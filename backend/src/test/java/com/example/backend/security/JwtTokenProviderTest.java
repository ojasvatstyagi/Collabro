package com.example.backend.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private static final String SECRET = "unit-test-secret-key-that-is-long-enough-0123456789";

    private JwtTokenProvider provider;

    @BeforeEach
    void setUp() {
        provider = providerWith(SECRET, 900_000L, 604_800_000L);
    }

    private static JwtTokenProvider providerWith(String secret, long accessMs, long refreshMs) {
        JwtTokenProvider p = new JwtTokenProvider();
        ReflectionTestUtils.setField(p, "jwtSecret", secret);
        ReflectionTestUtils.setField(p, "accessTokenExpiration", accessMs);
        ReflectionTestUtils.setField(p, "refreshTokenExpiration", refreshMs);
        return p;
    }

    @Test
    void accessToken_IsAcceptedAsAccessOnly() {
        String token = provider.generateAccessToken("alice");

        assertTrue(provider.validateAccessToken(token));
        assertFalse(provider.validateRefreshToken(token));
        assertEquals("alice", provider.getUsernameFromToken(token));
    }

    @Test
    void refreshToken_IsAcceptedAsRefreshOnly() {
        String token = provider.generateRefreshToken("alice");

        assertTrue(provider.validateRefreshToken(token));
        assertFalse(provider.validateAccessToken(token), "a refresh token must not work as a Bearer access token");
    }

    @Test
    void tokensIssuedForTheSameUserInTheSameInstant_AreStillDistinct() {
        assertNotEquals(provider.generateRefreshToken("alice"), provider.generateRefreshToken("alice"));
    }

    @Test
    void tokenWithoutTypeClaim_IsRejected() {
        // What the previous version issued: signed and unexpired, but untyped
        String legacy = Jwts.builder()
                .subject("alice")
                .expiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8)))
                .compact();

        assertFalse(provider.validateAccessToken(legacy));
        assertFalse(provider.validateRefreshToken(legacy));
    }

    @Test
    void expiredToken_IsRejected() {
        JwtTokenProvider shortLived = providerWith(SECRET, -1_000L, -1_000L);

        assertFalse(shortLived.validateAccessToken(shortLived.generateAccessToken("alice")));
        assertFalse(shortLived.validateRefreshToken(shortLived.generateRefreshToken("alice")));
    }

    @Test
    void tokenSignedWithAnotherKey_IsRejected() {
        JwtTokenProvider other = providerWith("a-completely-different-secret-key-9876543210", 900_000L, 604_800_000L);

        assertFalse(provider.validateAccessToken(other.generateAccessToken("alice")));
    }

    @Test
    void tamperedAndGarbageTokens_AreRejected() {
        String token = provider.generateAccessToken("alice");

        assertFalse(provider.validateAccessToken(token.substring(0, token.length() - 2) + "xx"));
        assertFalse(provider.validateAccessToken("not-a-jwt"));
        assertFalse(provider.validateAccessToken(""));
        assertFalse(provider.validateRefreshToken(null));
    }
}
