package com.example.backend.services;

import com.example.backend.exceptions.TokenRefreshException;
import com.example.backend.models.RefreshToken;
import com.example.backend.models.User;
import com.example.backend.repositories.RefreshTokenRepository;
import com.example.backend.security.JwtTokenProvider;
import com.example.backend.security.TokenHasher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    private JwtTokenProvider jwtTokenProvider;
    private RefreshTokenService service;
    private User user;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtSecret",
                "unit-test-secret-key-that-is-long-enough-0123456789");
        ReflectionTestUtils.setField(jwtTokenProvider, "accessTokenExpiration", 900_000L);
        ReflectionTestUtils.setField(jwtTokenProvider, "refreshTokenExpiration", 604_800_000L);
        service = new RefreshTokenService(refreshTokenRepository, jwtTokenProvider);

        user = new User();
        user.setUsername("alice");
    }

    /** Logs in and returns the raw refresh token together with the row that was stored for it. */
    private record Session(String rawToken, RefreshToken stored) {
    }

    private Session login() {
        String raw = service.issue(user);
        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(captor.capture());
        clearInvocations(refreshTokenRepository);
        return new Session(raw, captor.getValue());
    }

    // ---- issue ----

    @Test
    void issue_StoresOnlyTheHashAndReplacesThePreviousSession() {
        String raw = service.issue(user);

        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).deleteByUser(user);
        verify(refreshTokenRepository).save(captor.capture());
        RefreshToken stored = captor.getValue();
        assertNotEquals(raw, stored.getToken(), "the raw token must never be stored");
        assertEquals(TokenHasher.sha256(raw), stored.getToken());
        assertTrue(jwtTokenProvider.validateRefreshToken(raw));
        assertTrue(stored.getExpiryDate().isAfter(LocalDateTime.now().plusDays(6)));
    }

    // ---- rotate ----

    @Test
    void rotate_WithCurrentToken_IssuesNewPairAndRemembersTheOldToken() {
        Session session = login();
        when(refreshTokenRepository.findByToken(TokenHasher.sha256(session.rawToken())))
                .thenReturn(Optional.of(session.stored()));

        RefreshTokenService.Rotation rotation = service.rotate(session.rawToken());

        assertNotNull(rotation.refreshToken());
        assertNotEquals(session.rawToken(), rotation.refreshToken());
        assertTrue(jwtTokenProvider.validateRefreshToken(rotation.refreshToken()));
        assertTrue(jwtTokenProvider.validateAccessToken(rotation.accessToken()));
        assertEquals(user, rotation.user());
        assertEquals(TokenHasher.sha256(rotation.refreshToken()), session.stored().getToken());
        assertEquals(TokenHasher.sha256(session.rawToken()), session.stored().getPreviousToken());
        assertNotNull(session.stored().getRotatedAt());
        verify(refreshTokenRepository).save(session.stored());
    }

    @Test
    void rotate_ReplayedRightAfterRotation_GetsAnAccessTokenButNoSecondRefreshToken() {
        Session session = login();
        String oldHash = TokenHasher.sha256(session.rawToken());
        when(refreshTokenRepository.findByToken(oldHash)).thenReturn(Optional.of(session.stored()));
        service.rotate(session.rawToken());
        String currentHash = session.stored().getToken();

        // A concurrent request that still carried the old cookie
        when(refreshTokenRepository.findByToken(oldHash)).thenReturn(Optional.empty());
        when(refreshTokenRepository.findByPreviousToken(oldHash)).thenReturn(Optional.of(session.stored()));
        RefreshTokenService.Rotation second = service.rotate(session.rawToken());

        assertNull(second.refreshToken());
        assertTrue(jwtTokenProvider.validateAccessToken(second.accessToken()));
        assertEquals(currentHash, session.stored().getToken(), "the stored session must not change");
        verify(refreshTokenRepository, never()).delete(any(RefreshToken.class));
    }

    @Test
    void rotate_ReplayedLongAfterRotation_IsTreatedAsTheftAndEndsTheSession() {
        Session session = login();
        String oldHash = TokenHasher.sha256(session.rawToken());
        when(refreshTokenRepository.findByToken(oldHash)).thenReturn(Optional.of(session.stored()));
        service.rotate(session.rawToken());
        session.stored().setRotatedAt(LocalDateTime.now().minus(RefreshTokenService.ROTATION_GRACE).minusSeconds(1));

        when(refreshTokenRepository.findByToken(oldHash)).thenReturn(Optional.empty());
        when(refreshTokenRepository.findByPreviousToken(oldHash)).thenReturn(Optional.of(session.stored()));

        TokenRefreshException ex = assertThrows(TokenRefreshException.class,
                () -> service.rotate(session.rawToken()));

        assertTrue(ex.getMessage().contains("reuse"));
        verify(refreshTokenRepository).delete(session.stored());
    }

    @Test
    void rotate_WithValidlySignedButUnknownToken_IsRejectedWithoutTouchingOtherSessions() {
        String unknown = jwtTokenProvider.generateRefreshToken("alice");

        assertThrows(TokenRefreshException.class, () -> service.rotate(unknown));

        verify(refreshTokenRepository, never()).delete(any(RefreshToken.class));
        verify(refreshTokenRepository, never()).deleteByUser(any(User.class));
    }

    @Test
    void rotate_WithAnAccessToken_IsRejectedBeforeAnyLookup() {
        String accessToken = jwtTokenProvider.generateAccessToken("alice");

        assertThrows(TokenRefreshException.class, () -> service.rotate(accessToken));

        verifyNoInteractions(refreshTokenRepository);
    }

    @Test
    void rotate_WithGarbage_IsRejectedBeforeAnyLookup() {
        assertThrows(TokenRefreshException.class, () -> service.rotate("not-a-jwt"));

        verifyNoInteractions(refreshTokenRepository);
    }

    @Test
    void rotate_WhenTheStoredSessionHasExpired_DeletesItAndRejects() {
        Session session = login();
        session.stored().setExpiryDate(LocalDateTime.now().minusMinutes(1));
        when(refreshTokenRepository.findByToken(TokenHasher.sha256(session.rawToken())))
                .thenReturn(Optional.of(session.stored()));

        assertThrows(TokenRefreshException.class, () -> service.rotate(session.rawToken()));

        verify(refreshTokenRepository).delete(session.stored());
    }

    // ---- revoke ----

    @Test
    void revoke_DeletesTheSessionByHash() {
        service.revoke("some-refresh-token");

        verify(refreshTokenRepository).deleteByToken(TokenHasher.sha256("some-refresh-token"));
    }
}
