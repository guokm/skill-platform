package com.skillplatform.dto;

import com.skillplatform.model.User;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserDTO {
    private Long id;
    private String linuxDoId;
    private String username;
    private String name;
    private String email;
    private String avatarUrl;
    private Integer trustLevel;
    private Boolean isAdmin;
    private LocalDateTime lastLoginAt;

    public static UserDTO from(User u) {
        UserDTO dto = new UserDTO();
        dto.setId(u.getId());
        dto.setLinuxDoId(u.getLinuxDoId());
        dto.setUsername(u.getUsername());
        dto.setName(u.getName());
        dto.setEmail(u.getEmail());
        dto.setAvatarUrl(u.getAvatarUrl());
        dto.setTrustLevel(u.getTrustLevel());
        dto.setIsAdmin(u.getIsAdmin());
        dto.setLastLoginAt(u.getLastLoginAt());
        return dto;
    }
}
