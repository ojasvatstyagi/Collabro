package com.example.backend.services;

import com.example.backend.exceptions.TokenRefreshException;
import com.example.backend.models.RefreshToken;
import com.example.backend.models.User;
import com.example.backend.repositories.RefreshTokenRepository;
import com.example.backend.security.JwtTokenProvider;
import com.example.backend.security.TokenHasher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;

/**
 * Refresh tokens are single use: every refresh swaps in a new one. Only a hash is stored. Presenting a token that
 * was already rotated away (outside a short grace window for concurrent requests) is treated as theft and ends
 * the user's session.
 */
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    /** Two tabs can refresh at the same instant; the loser still carries the previous token. */
    static final Duration ROTATION_GRACE = Duration.ofSeconds(10);

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * @param refreshToken the new refresh token to set as a cookie, or null when the request was a concurrent
     *                     duplicate and the cookie already holds the current token
     */
    public record Rotation(User user, String accessToken, String refreshToken) {
    }

    /** Starts a session: replaces any existing refresh token of the user and returns the new raw token. */
    @Transactional
    public String issue(User user) {
        refreshTokenRepository.deleteByUser(user);
        String token = jwtTokenProvider.generateRefreshToken(user.getUsername());
        refreshTokenRepository.save(RefreshToken.builder()
                .token(TokenHasher.sha256(token))
                .user(user)
                .expiryDate(expiryOf(token))
                .build());
        return token;
    }

    // Not rolled back on rejection: the revocation done when reuse is detected must still be committed
    @Transactional(noRollbackFor = TokenRefreshException.class)
    public Rotation rotate(String presentedToken) {
        if (!jwtTokenProvider.validateRefreshToken(presentedToken)) {
            throw new TokenRefreshException("Invalid refresh token");
        }
        String hash = TokenHasher.sha256(presentedToken);

        Optional<RefreshToken> current = refreshTokenRepository.findByToken(hash);
        if (current.isPresent()) {
            return rotateCurrent(current.get(), hash);
        }

        Optional<RefreshToken> rotatedAway = refreshTokenRepository.findByPreviousToken(hash);
        if (rotatedAway.isPresent()) {
            RefreshToken stored = rotatedAway.get();
            if (isWithinGrace(stored)) {
                return new Rotation(stored.getUser(), jwtTokenProvider.generateAccessToken(stored.getUser().getUsername()), null);
            }
            refreshTokenRepository.delete(stored);
            throw new TokenRefreshException("Refresh token reuse detected. Please login again.");
        }

        // Validly signed but unknown, e.g. the user logged in elsewhere since. Reject without touching other sessions.
        throw new TokenRefreshException("Invalid refresh token");
    }

    @Transactional
    public void revoke(String presentedToken) {
        refreshTokenRepository.deleteByToken(TokenHasher.sha256(presentedToken));
    }

    private Rotation rotateCurrent(RefreshToken stored, String presentedHash) {
        if (stored.isExpired()) {
            refreshTokenRepository.delete(stored);
            throw new TokenRefreshException("Refresh token expired. Please login again.");
        }
        User user = stored.getUser();
        String newToken = jwtTokenProvider.generateRefreshToken(user.getUsername());

        stored.setPreviousToken(presentedHash);
        stored.setRotatedAt(LocalDateTime.now());
        stored.setToken(TokenHasher.sha256(newToken));
        stored.setExpiryDate(expiryOf(newToken));
        refreshTokenRepository.save(stored);

        return new Rotation(user, jwtTokenProvider.generateAccessToken(user.getUsername()), newToken);
    }

    private boolean isWithinGrace(RefreshToken stored) {
        return stored.getRotatedAt() != null
                && stored.getRotatedAt().plus(ROTATION_GRACE).isAfter(LocalDateTime.now());
    }

    private LocalDateTime expiryOf(String token) {
        return LocalDateTime.ofInstant(jwtTokenProvider.getExpirationDateFromToken(token).toInstant(),
                ZoneId.systemDefault());
    }
}
