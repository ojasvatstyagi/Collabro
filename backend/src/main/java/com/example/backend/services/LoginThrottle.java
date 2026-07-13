package com.example.backend.services;

import com.example.backend.exceptions.TooManyRequestsException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

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
 * Refused requests are not counted, so hammering a locked account does not extend the lock.
 * <p>
 * The counters live in memory: they reset on restart and are per instance. That is a deliberate trade-off while there
 * is no schema migration tool (see docs/AUDIT.md); run one instance or move this behind a shared store before scaling out.
 */
@Component
@Slf4j
public class LoginThrottle {

    static final Duration WINDOW = Duration.ofMinutes(15);
    static final int MAX_PER_USER_AND_IP = 5;
    static final int MAX_PER_USER = 20;
    static final int MAX_PER_IP = 30;
    // Bounds memory when someone floods the endpoint with made-up usernames from many addresses
    static final int MAX_TRACKED_KEYS = 50_000;
    private static final int MAX_USERNAME_LENGTH = 100;

    private final Clock clock;
    // Failure times per key, oldest first, never longer than that key's limit
    private final Map<String, Deque<Instant>> failures = new HashMap<>();

    public LoginThrottle() {
        this(Clock.systemUTC());
    }

    LoginThrottle(Clock clock) {
        this.clock = clock;
    }

    /** Throws {@link TooManyRequestsException} when this attempt must not even be checked against the password. */
    public synchronized void checkAllowed(String username, String clientAddress) {
        Instant now = clock.instant();
        Instant unlockAt = null;
        for (Limit limit : limits(username, clientAddress)) {
            Instant blockedUntil = blockedUntil(limit, now);
            if (blockedUntil != null && (unlockAt == null || blockedUntil.isAfter(unlockAt))) {
                unlockAt = blockedUntil;
            }
        }
        if (unlockAt != null) {
            long seconds = Math.max(1, Duration.between(now, unlockAt).toSeconds() + 1);
            log.warn("Login throttled for a client, retry in {}s", seconds);
            throw new TooManyRequestsException("Too many failed login attempts. Try again later.", seconds);
        }
    }

    public synchronized void recordFailure(String username, String clientAddress) {
        Instant now = clock.instant();
        if (failures.size() >= MAX_TRACKED_KEYS) {
            failures.values().removeIf(times -> times.isEmpty() || !times.peekLast().plus(WINDOW).isAfter(now));
        }
        for (Limit limit : limits(username, clientAddress)) {
            Deque<Instant> times = failures.get(limit.key());
            if (times == null) {
                if (failures.size() >= MAX_TRACKED_KEYS) {
                    continue;
                }
                times = new ArrayDeque<>();
                failures.put(limit.key(), times);
            }
            times.addLast(now);
            while (times.size() > limit.max()) {
                times.pollFirst();
            }
        }
    }

    /**
     * Forgives the username + address pair that just proved itself. The address-wide and username-wide counters are
     * left to expire on their own: otherwise an attacker could reset them by logging into an account they own.
     */
    public synchronized void recordSuccess(String username, String clientAddress) {
        failures.remove(pairKey(username, clientAddress));
    }

    private Instant blockedUntil(Limit limit, Instant now) {
        Deque<Instant> times = failures.get(limit.key());
        if (times == null) {
            return null;
        }
        while (!times.isEmpty() && !times.peekFirst().plus(WINDOW).isAfter(now)) {
            times.pollFirst();
        }
        if (times.isEmpty()) {
            failures.remove(limit.key());
            return null;
        }
        // The deque holds at most `max` entries, so a full one is blocked until its oldest failure leaves the window
        return times.size() >= limit.max() ? times.peekFirst().plus(WINDOW) : null;
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
