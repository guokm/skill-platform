package com.skillplatform.controller;

import com.skillplatform.dto.UserDTO;
import com.skillplatform.model.User;
import com.skillplatform.repository.UserRepository;
import com.skillplatform.service.AuthService;
import com.skillplatform.service.JwtService;
import com.skillplatform.service.UserLevelService;
import io.jsonwebtoken.Claims;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.security.MessageDigest;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Auth", description = "Linux.do OAuth2 authentication")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final UserLevelService userLevelService;

    @Value("${app.oauth2.linux-do.frontend-url:http://localhost}")
    private String frontendUrl;

    @Value("${app.admin.username:skillatlas}")
    private String adminUsername;

    @Value("${app.admin.password:Sk!llAtl@s#2026$}")
    private String adminPassword;

    /**
     * 1. 前端调用此接口获取 Linux.do 授权 URL，然后跳转
     */
    @GetMapping("/login-url")
    @Operation(summary = "获取 Linux.do 授权 URL")
    public ResponseEntity<Map<String, String>> getLoginUrl() {
        String state = UUID.randomUUID().toString().replace("-", "");
        String url = authService.buildAuthorizationUrl(state);
        return ResponseEntity.ok(Map.of("url", url, "state", state));
    }

    /**
     * 2. Linux.do 回调，后端处理后重定向前端 /auth/callback?token=xxx
     */
    @GetMapping("/callback")
    @Operation(summary = "Linux.do OAuth2 回调处理")
    public ResponseEntity<Void> callback(
            @RequestParam("code") String code,
            @RequestParam(value = "state", required = false) String state) {

        try {
            String jwt = authService.handleCallback(code);
            String redirectUrl = frontendUrl + "/auth/callback?token=" + jwt;
            return ResponseEntity.status(302)
                    .location(URI.create(redirectUrl))
                    .build();
        } catch (Exception e) {
            log.error("OAuth2 callback failed: {}", e.getMessage());
            String errorUrl = frontendUrl + "/auth/callback?error=" +
                    java.net.URLEncoder.encode(e.getMessage(), java.nio.charset.StandardCharsets.UTF_8);
            return ResponseEntity.status(302).location(URI.create(errorUrl)).build();
        }
    }

    /**
     * 3. 前端携带 JWT 获取当前用户信息
     */
    @GetMapping("/me")
    @Operation(summary = "获取当前登录用户信息")
    public ResponseEntity<UserDTO> me(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        long userId;
        try {
            userId = Long.parseLong((String) authentication.getPrincipal());
        } catch (NumberFormatException e) {
            return ResponseEntity.status(401).build();
        }
        // 内置管理员（id = -1，不在数据库中）直接返回虚拟 UserDTO
        if (userId == -1L) {
            UserDTO adminDto = new UserDTO();
            adminDto.setId(-1L);
            adminDto.setUsername(adminUsername);
            adminDto.setName("系统管理员");
            adminDto.setIsAdmin(true);
            adminDto.setTrustLevel(4);
            adminDto.setPointsBalance(999999);
            adminDto.setTotalPointsSpent(0);
            adminDto.setLevelProfile(userLevelService.getLevelProfile(-1L));
            return ResponseEntity.ok(adminDto);
        }
        return userRepository.findById(userId)
                .map(user -> ResponseEntity.ok(userLevelService.toUserDTO(user)))
                .orElse(ResponseEntity.status(401).build());
    }

    /**
     * 4. 注销（前端删除 token 即可，此处仅返回成功）
     */
    @PostMapping("/logout")
    @Operation(summary = "注销登录")
    public ResponseEntity<Map<String, String>> logout() {
        return ResponseEntity.ok(Map.of("message", "已注销，请删除本地 token"));
    }

    /**
     * 5. 固定账密登录（Admin 后台专用）
     */
    @PostMapping("/admin-login")
    @Operation(summary = "后台固定账密登录")
    public ResponseEntity<Map<String, Object>> adminLogin(@RequestBody AdminLoginRequest req) {
        // 使用常量时间比较防止 timing attack
        boolean usernameMatch = MessageDigest.isEqual(
                adminUsername.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                (req.getUsername() == null ? "" : req.getUsername()).getBytes(java.nio.charset.StandardCharsets.UTF_8)
        );
        boolean passwordMatch = MessageDigest.isEqual(
                adminPassword.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                (req.getPassword() == null ? "" : req.getPassword()).getBytes(java.nio.charset.StandardCharsets.UTF_8)
        );
        if (!usernameMatch || !passwordMatch) {
            return ResponseEntity.status(401).body(Map.of("error", "用户名或密码错误"));
        }
        // 构建一个虚拟的内置管理员 User 用于生成 JWT
        User adminUser = User.builder()
                .id(-1L)
                .linuxDoId("admin")
                .username(adminUsername)
                .name("系统管理员")
                .trustLevel(4)
                .isAdmin(true)
                .build();
        String token = jwtService.generateToken(adminUser);
        return ResponseEntity.ok(Map.of(
                "token", token,
                "user", Map.of(
                        "username", adminUsername,
                        "name", "系统管理员",
                        "isAdmin", true
                )
        ));
    }

    @Data
    public static class AdminLoginRequest {
        private String username;
        private String password;
    }
}
