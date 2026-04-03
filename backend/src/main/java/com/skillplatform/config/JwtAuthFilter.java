package com.skillplatform.config;

import com.skillplatform.service.JwtService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String token = extractToken(request);

        if (token != null && jwtService.isValid(token)) {
            try {
                Claims claims = jwtService.validateAndParse(token);
                String userId = claims.getSubject();
                boolean isAdmin = Boolean.TRUE.equals(claims.get("isAdmin", Boolean.class));
                int trustLevel = claims.get("trustLevel") instanceof Number n ? n.intValue() : 0;

                List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
                if (isAdmin) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                }

                var auth = new UsernamePasswordAuthenticationToken(userId, null, authorities);
                auth.setDetails(claims);
                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (Exception e) {
                log.debug("JWT processing error: {}", e.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        // 1. Authorization header (preferred)
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        // 2. Query parameter ?token=xxx (used for direct download links)
        String tokenParam = request.getParameter("token");
        if (tokenParam != null && !tokenParam.isBlank()) {
            return tokenParam;
        }
        return null;
    }
}
