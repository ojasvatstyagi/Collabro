package com.example.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

@Component
public class JwtTokenProvider {

    private static final String TYPE_CLAIM = "type";
    private static final String ACCESS = "access";
    private static final String REFRESH = "refresh";

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.access-token-expiration}")
    private long accessTokenExpiration;

    @Value("${jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(String username) {
        return buildToken(username, ACCESS, accessTokenExpiration);
    }

    public String generateRefreshToken(String username) {
        return buildToken(username, REFRESH, refreshTokenExpiration);
    }

    // The type claim stops a refresh token being used as an access token (and vice versa); the random id keeps
    // two tokens issued for the same user in the same second from being identical.
    private String buildToken(String username, String type, long lifetimeMillis) {
        Date now = new Date();
        return Jwts.builder()
                .subject(username)
                .claim(TYPE_CLAIM, type)
                .id(UUID.randomUUID().toString())
                .issuedAt(now)
                .expiration(new Date(now.getTime() + lifetimeMillis))
                .signWith(getSigningKey())
                .compact();
    }

    /** True for a correctly signed, unexpired token issued as an access token. */
    public boolean validateAccessToken(String token) {
        return hasType(token, ACCESS);
    }

    /** True for a correctly signed, unexpired token issued as a refresh token. */
    public boolean validateRefreshToken(String token) {
        return hasType(token, REFRESH);
    }

    public String getUsernameFromToken(String token) {
        return parseClaims(token).orElseThrow(() -> new JwtException("Invalid token")).getSubject();
    }

    public Date getExpirationDateFromToken(String token) {
        return parseClaims(token).orElseThrow(() -> new JwtException("Invalid token")).getExpiration();
    }

    private boolean hasType(String token, String expectedType) {
        return parseClaims(token)
                .map(claims -> expectedType.equals(claims.get(TYPE_CLAIM, String.class)))
                .orElse(false);
    }

    private Optional<Claims> parseClaims(String token) {
        try {
            return Optional.of(Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload());
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
