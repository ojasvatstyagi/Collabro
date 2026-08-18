package com.example.backend.services;

import com.example.backend.exceptions.TooManyRequestsException;
import com.example.backend.repositories.LoginFailureRepository;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.*;

/** Against a real (H2) database: the failures are rows, so what the throttle knows is shared and survives a restart. */
@DataJpaTest(properties = "spring.jpa.properties.hibernate.generate_statistics=true")
class LoginThrottleTest {

    @Autowired
    private LoginFailureRepository repository;
    @Autowired
    private EntityManagerFactory entityManagerFactory;

    private MutableClock clock;
    private LoginThrottle throttle;

    @BeforeEach
    void setUp() {
        clock = new MutableClock(Instant.parse("2026-07-13T10:00:00Z"));
        throttle = new LoginThrottle(repository, clock);
    }

    private void fail(String user, String ip, int times) {
        for (int i = 0; i < times; i++) {
            throttle.checkAllowed(user, ip);
            throttle.recordFailure(user, ip);
        }
    }

    @Test
    void allowsFailuresUpToTheLimitThenRefuses() {
        fail("alice", "1.1.1.1", LoginThrottle.MAX_PER_USER_AND_IP);

        TooManyRequestsException ex = assertThrows(TooManyRequestsException.class,
                () -> throttle.checkAllowed("alice", "1.1.1.1"));
        assertTrue(ex.getRetryAfterSeconds() > 0);
        assertTrue(ex.getRetryAfterSeconds() <= LoginThrottle.WINDOW.toSeconds() + 1);
    }

    @Test
    void theLockEndsWhenTheOldestOfTheCountedFailuresLeavesTheWindow_SoRetryAfterIsExact() {
        // five failures two minutes apart: at 0, 2, 4, 6 and 8 minutes
        for (int i = 0; i < LoginThrottle.MAX_PER_USER_AND_IP; i++) {
            throttle.recordFailure("alice", "1.1.1.1");
            if (i < LoginThrottle.MAX_PER_USER_AND_IP - 1) {
                clock.advance(Duration.ofMinutes(2));
            }
        }

        TooManyRequestsException ex = assertThrows(TooManyRequestsException.class,
                () -> throttle.checkAllowed("alice", "1.1.1.1"));

        // now is minute 8; the first failure (minute 0) leaves the window at minute 15: 7 minutes from now, not 15
        assertEquals(7 * 60 + 1, ex.getRetryAfterSeconds());
        clock.advance(Duration.ofMinutes(7).plusSeconds(1));
        assertDoesNotThrow(() -> throttle.checkAllowed("alice", "1.1.1.1"));
    }

    @Test
    void aLockedClientIsRefusedEvenForTheCorrectPassword() {
        // checkAllowed runs before the password is looked at, so a refused request carries no information
        fail("alice", "1.1.1.1", LoginThrottle.MAX_PER_USER_AND_IP);
        assertThrows(TooManyRequestsException.class, () -> throttle.checkAllowed("alice", "1.1.1.1"));
    }

    @Test
    void unlocksWhenTheWindowHasPassed() {
        fail("alice", "1.1.1.1", LoginThrottle.MAX_PER_USER_AND_IP);

        clock.advance(LoginThrottle.WINDOW.plusSeconds(1));

        assertDoesNotThrow(() -> throttle.checkAllowed("alice", "1.1.1.1"));
    }

    @Test
    void failuresSlideOutOfTheWindowOneByOne() {
        throttle.recordFailure("alice", "1.1.1.1");
        clock.advance(Duration.ofMinutes(10));
        fail("alice", "1.1.1.1", LoginThrottle.MAX_PER_USER_AND_IP - 1);
        assertThrows(TooManyRequestsException.class, () -> throttle.checkAllowed("alice", "1.1.1.1"));

        // The first failure is now 15+ minutes old, so only four count
        clock.advance(Duration.ofMinutes(6));

        assertDoesNotThrow(() -> throttle.checkAllowed("alice", "1.1.1.1"));
    }

    @Test
    void aStrangerGuessingFromElsewhereCannotLockOutTheOwnersOwnAddress() {
        fail("alice", "6.6.6.6", LoginThrottle.MAX_PER_USER_AND_IP);

        assertThrows(TooManyRequestsException.class, () -> throttle.checkAllowed("alice", "6.6.6.6"));
        assertDoesNotThrow(() -> throttle.checkAllowed("alice", "1.1.1.1"));
    }

    @Test
    void guessingOneUsernameFromManyAddressesIsStoppedByThePerUsernameLimit() {
        for (int i = 0; i < LoginThrottle.MAX_PER_USER; i++) {
            throttle.recordFailure("alice", "10.0.0." + i);
        }

        assertThrows(TooManyRequestsException.class, () -> throttle.checkAllowed("alice", "10.0.1.1"));
    }

    @Test
    void tryingManyUsernamesFromOneAddressIsStoppedByThePerAddressLimit() {
        for (int i = 0; i < LoginThrottle.MAX_PER_IP; i++) {
            throttle.recordFailure("user" + i, "7.7.7.7");
        }

        assertThrows(TooManyRequestsException.class, () -> throttle.checkAllowed("someone-new", "7.7.7.7"));
        assertDoesNotThrow(() -> throttle.checkAllowed("someone-new", "8.8.8.8"));
    }

    @Test
    void usernamesThatDoNotExistAreThrottledLikeRealOnes() {
        // The throttle never sees whether the user exists, so the responses cannot differ
        fail("no-such-user", "1.1.1.1", LoginThrottle.MAX_PER_USER_AND_IP);

        assertThrows(TooManyRequestsException.class, () -> throttle.checkAllowed("no-such-user", "1.1.1.1"));
    }

    @Test
    void usernameCaseAndPaddingDoNotCreateFreshCounters() {
        fail("Alice", "1.1.1.1", 3);
        fail("  alice  ", "1.1.1.1", 2);

        assertThrows(TooManyRequestsException.class, () -> throttle.checkAllowed("ALICE", "1.1.1.1"));
    }

    @Test
    void aSuccessfulLoginClearsOnlyThatUsernameAndAddressPair() {
        fail("alice", "1.1.1.1", LoginThrottle.MAX_PER_USER_AND_IP - 1);

        throttle.recordSuccess("alice", "1.1.1.1");
        fail("alice", "1.1.1.1", LoginThrottle.MAX_PER_USER_AND_IP - 1);

        assertDoesNotThrow(() -> throttle.checkAllowed("alice", "1.1.1.1"));
    }

    @Test
    void aSuccessfulLoginDoesNotResetTheAddressWideCount() {
        // Otherwise an attacker could log into an account of their own between guesses and never be stopped
        for (int i = 0; i < LoginThrottle.MAX_PER_IP; i++) {
            throttle.recordFailure("victim" + i, "7.7.7.7");
            throttle.recordSuccess("mine", "7.7.7.7");
        }

        assertThrows(TooManyRequestsException.class, () -> throttle.checkAllowed("mine", "7.7.7.7"));
    }

    @Test
    void refusedRequestsDoNotExtendTheLock() {
        fail("alice", "1.1.1.1", LoginThrottle.MAX_PER_USER_AND_IP);
        for (int i = 0; i < 50; i++) {
            assertThrows(TooManyRequestsException.class, () -> throttle.checkAllowed("alice", "1.1.1.1"));
        }

        clock.advance(LoginThrottle.WINDOW.plusSeconds(1));

        assertDoesNotThrow(() -> throttle.checkAllowed("alice", "1.1.1.1"));
    }

    @Test
    void nullUsernameDoesNotBlowUp() {
        assertDoesNotThrow(() -> {
            throttle.checkAllowed(null, "1.1.1.1");
            throttle.recordFailure(null, "1.1.1.1");
        });
    }

    // ---- what moving the counters into the database is for

    @Test
    void twoInstancesOfTheApplicationShareTheCounters() {
        LoginThrottle otherInstance = new LoginThrottle(repository, clock);

        fail("alice", "1.1.1.1", LoginThrottle.MAX_PER_USER_AND_IP);   // all of it on one instance...

        assertThrows(TooManyRequestsException.class, () -> otherInstance.checkAllowed("alice", "1.1.1.1")); // ...seen by the other
    }

    @Test
    void failuresSpreadOverInstancesAddUpToOneLimit() {
        LoginThrottle second = new LoginThrottle(repository, clock);
        for (int i = 0; i < LoginThrottle.MAX_PER_USER_AND_IP; i++) {
            (i % 2 == 0 ? throttle : second).recordFailure("alice", "1.1.1.1");
        }

        assertThrows(TooManyRequestsException.class, () -> throttle.checkAllowed("alice", "1.1.1.1"));
        assertThrows(TooManyRequestsException.class, () -> second.checkAllowed("alice", "1.1.1.1"));
    }

    @Test
    void aRestartForgetsNothing() {
        fail("alice", "1.1.1.1", LoginThrottle.MAX_PER_USER_AND_IP);

        LoginThrottle restarted = new LoginThrottle(repository, clock); // a new process, same database

        assertThrows(TooManyRequestsException.class, () -> restarted.checkAllowed("alice", "1.1.1.1"));
    }

    @Test
    void refusedRequestsAddNoRows_SoHammeringALockedAccountDoesNotGrowTheTable() {
        fail("alice", "1.1.1.1", LoginThrottle.MAX_PER_USER_AND_IP);
        long rows = repository.count();

        for (int i = 0; i < 100; i++) {
            assertThrows(TooManyRequestsException.class, () -> throttle.checkAllowed("alice", "1.1.1.1"));
        }

        assertEquals(rows, repository.count());
        assertEquals(3L * LoginThrottle.MAX_PER_USER_AND_IP, rows, "each failure is counted against three keys");
    }

    @Test
    void purgeExpiredDeletesOnlyFailuresThatLeftTheWindow() {
        throttle.recordFailure("old", "1.1.1.1");
        clock.advance(LoginThrottle.WINDOW.plusMinutes(1));
        throttle.recordFailure("recent", "2.2.2.2");

        int deleted = throttle.purgeExpired();

        assertEquals(3, deleted);
        assertEquals(3, repository.count());
        assertDoesNotThrow(() -> throttle.checkAllowed("old", "1.1.1.1"));
    }

    @Test
    void aCheckCostsAtMostOneQueryPerKey_AndARecordedFailureOneInsertPerKey() {
        var statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();

        statistics.clear();
        throttle.checkAllowed("alice", "1.1.1.1");
        long check = statistics.getPrepareStatementCount();
        statistics.clear();
        throttle.recordFailure("alice", "1.1.1.1");
        long record = statistics.getPrepareStatementCount();

        assertEquals(3, check);
        assertEquals(3, record);
    }

    @Test
    void theKeyForAVeryLongUsernameStillFitsTheColumn() {
        String huge = "a".repeat(5000);

        assertDoesNotThrow(() -> throttle.recordFailure(huge, "2001:0db8:85a3:0000:0000:8a2e:0370:7334"));
        assertEquals(3, repository.count());
    }

    private static final class MutableClock extends Clock {
        private Instant now;

        MutableClock(Instant start) {
            this.now = start;
        }

        void advance(Duration d) {
            now = now.plus(d);
        }

        @Override
        public java.time.ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(java.time.ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }
}
