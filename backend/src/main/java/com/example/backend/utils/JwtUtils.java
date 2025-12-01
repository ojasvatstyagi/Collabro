package com.example.backend.utils;

import com.example.backend.models.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtils {

    private final SecretKey key;
    private final long jwtExpirationMs;

    public JwtUtils(@Value("${app.jwt.secret}") String jwtSecret,
                    @Value("${app.jwt.expiration}") long jwtExpirationMs) {
        this.jwtExpirationMs = jwtExpirationMs;
        // The secret is treated as a raw string and used to create a signing key.
        this.key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateJwtToken(User user) {
        return Jwts.builder()
                .setSubject(user.getUsername())
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public String getUserNameFromJwtToken(String token) {
        return Jwts
                .parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody().getSubject();
    }

    public boolean validateJwtToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            // Handle exceptions like ExpiredJwtException, MalformedJwtException, etc.
            return false;
        }
    }
}