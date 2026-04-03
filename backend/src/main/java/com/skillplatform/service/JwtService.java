package com.skillplatform.service;

import com.skillplatform.model.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

@Service
@Slf4j
public class JwtService {

    @Value("${app.jwt.secret}")
    private String secret;

    @Value("${app.jwt.expiration-hours:168}")
    private long expirationHours;

    public String generateToken(User user) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationHours * 3600_000L);

        return Jwts.builder()
                .subject(user.getId().toString())
                .claims(Map.of(
                        "username", user.getUsername(),
                        "name", user.getName() != null ? user.getName() : user.getUsername(),
                        "avatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : "",
                        "trustLevel", user.getTrustLevel(),
                        "isAdmin", Boolean.TRUE.equals(user.getIsAdmin())
                ))
                .issuedAt(now)
                .expiration(expiry)
                .signWith(getKey())
                .compact();
    }

    public Claims validateAndParse(String token) {
        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isValid(String token) {
        try {
            validateAndParse(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Invalid JWT: {}", e.getMessage());
            return false;
        }
    }

    private SecretKey getKey() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        // HMAC-SHA256 requires at least 32 bytes
        if (keyBytes.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, keyBytes.length);
            keyBytes = padded;
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
