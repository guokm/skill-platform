package com.skillplatform.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public — 浏览和查看无需登录
                .requestMatchers(HttpMethod.GET, "/api/skills").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/skills/trending").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/skills/most-downloaded").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/skills/featured").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/skills/latest").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/skills/stats").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/skills/{slug}").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/skills/*/related").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/skills/*/click").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/categories").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/categories/**").permitAll()
                // 公开用户主页（无需登录）
                .requestMatchers(HttpMethod.GET, "/api/users/*/profile").permitAll()
                // 排行榜（公开）
                .requestMatchers(HttpMethod.GET, "/api/leaderboard").permitAll()
                // Auth endpoints（含固定账密后台登录）
                .requestMatchers("/api/auth/**").permitAll()
                // Swagger
                .requestMatchers("/swagger-ui/**", "/api-docs/**", "/swagger-ui.html").permitAll()
                // 评分查询：公开（未登录时不返回 myRating）
                .requestMatchers(HttpMethod.GET, "/api/skills/*/rating").permitAll()
                // 下载需要登录
                .requestMatchers("/api/skills/*/download-package", "/api/skills/*/download-file").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/skills/*/download").authenticated()
                // 收藏 & 评分 & 我的收藏 — 需要登录
                .requestMatchers("/api/skills/*/favorite").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/skills/*/rate").authenticated()
                .requestMatchers("/api/users/me/**").authenticated()
                // Admin 操作需要 ADMIN 角色
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                // 其他 POST/PUT/DELETE 需要认证
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
