package com.skillplatform.service;

import com.skillplatform.model.User;
import com.skillplatform.repository.PointTransactionRepository;
import com.skillplatform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PointTransactionRepository pointTransactionRepository;
    private final PointService pointService;

    @Value("${app.oauth2.linux-do.client-id}")
    private String clientId;

    @Value("${app.oauth2.linux-do.client-secret}")
    private String clientSecret;

    @Value("${app.oauth2.linux-do.authorization-endpoint}")
    private String authorizationEndpoint;

    @Value("${app.oauth2.linux-do.token-endpoint}")
    private String tokenEndpoint;

    @Value("${app.oauth2.linux-do.user-endpoint}")
    private String userEndpoint;

    @Value("${app.oauth2.linux-do.redirect-uri}")
    private String redirectUri;

    @Value("${app.admin.min-trust-level:2}")
    private int minTrustLevel;

    @Value("${app.admin.extra-admin-ids:}")
    private String extraAdminIds;

    @Value("${app.points.initial-balance:20}")
    private int initialBalance;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Build the Linux.do authorization URL
     */
    public String buildAuthorizationUrl(String state) {
        return authorizationEndpoint
                + "?client_id=" + clientId
                + "&response_type=code"
                + "&redirect_uri=" + encodeUrl(redirectUri)
                + "&scope=read"
                + "&state=" + state;
    }

    /**
     * Exchange authorization code for user info, upsert user, return JWT
     */
    @Transactional
    public String handleCallback(String code) {
        // Step 1: Exchange code for access token
        String accessToken = exchangeCodeForToken(code);

        // Step 2: Fetch user info from Linux.do
        Map<String, Object> userInfo = fetchUserInfo(accessToken);

        // Step 3: Upsert user in DB
        User user = upsertUser(userInfo);

        // Step 4: Generate JWT
        return jwtService.generateToken(user);
    }

    @SuppressWarnings("unchecked")
    private String exchangeCodeForToken(String code) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.setBasicAuth(clientId, clientSecret);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "authorization_code");
        body.add("code", code);
        body.add("redirect_uri", redirectUri);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(tokenEndpoint, request, Map.class);
            Map<String, Object> responseBody = response.getBody();
            if (responseBody == null || !responseBody.containsKey("access_token")) {
                throw new RuntimeException("No access_token in response");
            }
            return (String) responseBody.get("access_token");
        } catch (Exception e) {
            log.error("Failed to exchange code for token: {}", e.getMessage());
            throw new RuntimeException("OAuth2 token exchange failed: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> fetchUserInfo(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    userEndpoint, HttpMethod.GET, request, Map.class);
            Map<String, Object> body = response.getBody();
            if (body == null) throw new RuntimeException("Empty user info response");
            return body;
        } catch (Exception e) {
            log.error("Failed to fetch Linux.do user info: {}", e.getMessage());
            throw new RuntimeException("Failed to fetch user info: " + e.getMessage());
        }
    }

    private User upsertUser(Map<String, Object> info) {
        String linuxDoId = String.valueOf(info.get("id"));
        String username = (String) info.getOrDefault("username", "unknown");
        String name = (String) info.getOrDefault("name", username);
        String email = (String) info.getOrDefault("email", "");
        String avatarUrl = (String) info.getOrDefault("avatar_url", "");
        int trustLevel = info.get("trust_level") instanceof Number n ? n.intValue() : 0;
        boolean active = !Boolean.FALSE.equals(info.get("active"));
        boolean silenced = Boolean.TRUE.equals(info.get("silenced"));

        boolean isAdmin = trustLevel >= minTrustLevel || isExtraAdmin(linuxDoId);

        User user = userRepository.findByLinuxDoId(linuxDoId).orElseGet(User::new);
        boolean needsInitialPoints = user.getId() == null || user.getPointsBalance() == null;
        user.setLinuxDoId(linuxDoId);
        user.setUsername(username);
        user.setName(name);
        user.setEmail(email);
        user.setAvatarUrl(fixAvatarUrl(avatarUrl));
        user.setTrustLevel(trustLevel);
        user.setIsAdmin(isAdmin);
        user.setActive(active && !silenced);
        user.setLastLoginAt(LocalDateTime.now());
        if (needsInitialPoints) {
            user.setPointsBalance(Math.max(0, initialBalance));
            if (user.getTotalPointsSpent() == null) {
                user.setTotalPointsSpent(0);
            }
        } else if (user.getTotalPointsSpent() == null) {
            user.setTotalPointsSpent(0);
        }

        User savedUser = userRepository.save(user);
        if (needsInitialPoints && pointTransactionRepository.findTop10ByUserIdOrderByCreatedAtDesc(savedUser.getId()).isEmpty()) {
            pointService.grantInitialPoints(savedUser);
        }
        return savedUser;
    }

    private boolean isExtraAdmin(String linuxDoId) {
        if (extraAdminIds == null || extraAdminIds.isBlank()) return false;
        return Arrays.stream(extraAdminIds.split(","))
                .map(String::trim)
                .anyMatch(id -> id.equals(linuxDoId));
    }

    private String fixAvatarUrl(String url) {
        if (url == null || url.isBlank()) return url;
        // Linux.do avatars sometimes need size suffix
        if (url.contains("{size}")) {
            return url.replace("{size}", "120");
        }
        return url;
    }

    private String encodeUrl(String url) {
        try {
            return java.net.URLEncoder.encode(url, java.nio.charset.StandardCharsets.UTF_8);
        } catch (Exception e) {
            return url;
        }
    }
}
