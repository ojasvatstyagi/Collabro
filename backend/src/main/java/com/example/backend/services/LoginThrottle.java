package com.example.backend.services;

import com.example.backend.exceptions.TooManyRequestsException;
import com.example.backend.models.LoginFailure;
import com.example.backend.repositories.LoginFailureRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

/**
 * Slows down password guessing on login. Failed attempts are counted in a sliding window against three keys, and a
 * request is refused (even with the right password, so the lock cannot be used as a password oracle) while any of
 * them is full:
 * <ul>
 *   <li>username + client address: stops guessing from one machine without letting a stranger lock the real owner
 *       out of their own account from elsewhere;</li>
 *   <li>username alone, a higher limit: stops guessing spread over many addresses;</li>
 *   <li>client address alone: stops one machine trying many usernames (password spraying).</li>
 * </ul>
 * Unknown usernames are counted exactly like known ones, so the response never reveals whether an account exists.
 * Refused requests are not counted, so hammering a locked account neither extends the lock nor grows the table.
 * <p>
 * The failures are rows in {@code login_failures}, so every instance of the application sees the same counts and a
 * restart forgets nothing. (Two instances answering at the very same moment can each let one extra attempt through:
 * the check and the insert are not one atomic step. The limits are small enough for that not to matter.)
 */
@Component
@Slf4j
public class LoginThrottle {

    static final Duration WINDOW = Duration.ofMinutes(15);
    static final int MAX_PER_USER_AND_IP = 5;
    static final int MAX_PER_USER = 20;
    static final int MAX_PER_IP = 30;
    private static final int MAX_USERNAME_LENGTH = 100;

    private final LoginFailureRepository failures;
    private final Clock clock;

    @Autowired
    public LoginThrottle(LoginFailureRepository failures) {
        this(failures, Clock.systemUTC());
    }

    LoginThrottle(LoginFailureRepository failures, Clock clock) {
        this.failures = failures;
        this.clock = clock;
    }

    /** Throws {@link TooManyRequestsException} when this attempt must not even be checked against the password. */
    @Transactional(readOnly = true)
    public void checkAllowed(String username, String clientAddress) {
        LocalDateTime now = now();
        LocalDateTime after = now.minus(WINDOW);
        LocalDateTime unlockAt = null;
        for (Limit limit : limits(username, clientAddress)) {
            // The newest `max` failures in the window: if that many exist, the lock lasts until the oldest of them
            // leaves the window
            List<LocalDateTime> newest = failures.newestSince(limit.key(), after, PageRequest.of(0, limit.max()));
            if (newest.size() >= limit.max()) {
                LocalDateTime blockedUntil = newest.get(newest.size() - 1).plus(WINDOW);
                if (unlockAt == null || blockedUntil.isAfter(unlockAt)) {
                    unlockAt = blockedUntil;
                }
            }
        }
        if (unlockAt != null) {
            long seconds = Math.max(1, Duration.between(now, unlockAt).toSeconds() + 1);
            log.warn("Login throttled for a client, retry in {}s", seconds);
            throw new TooManyRequestsException("Too many failed login attempts. Try again later.", seconds);
        }
    }

    @Transactional
    public void recordFailure(String username, String clientAddress) {
        LocalDateTime now = now();
        failures.saveAll(java.util.Arrays.stream(limits(username, clientAddress))
                .map(limit -> new LoginFailure(limit.key(), now)).toList());
    }

    /**
     * Forgives the username + address pair that just proved itself. The address-wide and username-wide counters are
     * left to expire on their own: otherwise an attacker could reset them by logging into an account they own.
     */
    @Transactional
    public void recordSuccess(String username, String clientAddress) {
        failures.deleteAllForKey(pairKey(username, clientAddress));
    }

    /** Deletes failures that have left the window; they can no longer count for anything. */
    @Transactional
    public int purgeExpired() {
        return failures.deleteOlderThan(now().minus(WINDOW));
    }

    private LocalDateTime now() {
        return LocalDateTime.now(clock);
    }

    private Limit[] limits(String username, String clientAddress) {
        String name = normalise(username);
        return new Limit[] {
                new Limit(pairKey(username, clientAddress), MAX_PER_USER_AND_IP),
                new Limit("user:" + name, MAX_PER_USER),
                new Limit("ip:" + clientAddress, MAX_PER_IP)
        };
    }

    private String pairKey(String username, String clientAddress) {
        return "pair:" + normalise(username) + "|" + clientAddress;
    }

    private String normalise(String username) {
        String name = username == null ? "" : username.trim().toLowerCase(Locale.ROOT);
        return name.length() > MAX_USERNAME_LENGTH ? name.substring(0, MAX_USERNAME_LENGTH) : name;
    }

    private record Limit(String key, int max) {
    }
}
