package com.example.backend.services;

import com.example.backend.exceptions.TooManyRequestsException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.*;

class LoginThrottleTest {

    private MutableClock clock;
    private LoginThrottle throttle;

    @BeforeEach
    void setUp() {
        clock = new MutableClock(Instant.parse("2026-07-13T10:00:00Z"));
        throttle = new LoginThrottle(clock);
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
