package com.skillplatform.dto;

import com.skillplatform.model.User;
import lombok.Data;

import java.time.LocalDateTime;
import java.time.LocalDate;

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
    private Integer pointsBalance;
    private Integer totalPointsSpent;
    private UserLevelDTO levelProfile;
    private LocalDate lastCheckInDate;
    private Integer checkInStreakDays;
    private Integer totalCheckInCount;
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
        dto.setPointsBalance(u.getPointsBalance() == null ? 0 : Math.max(0, u.getPointsBalance()));
        dto.setTotalPointsSpent(u.getTotalPointsSpent() == null ? 0 : Math.max(0, u.getTotalPointsSpent()));
        dto.setLastCheckInDate(u.getLastCheckInDate());
        dto.setCheckInStreakDays(u.getCheckInStreakDays() == null ? 0 : Math.max(0, u.getCheckInStreakDays()));
        dto.setTotalCheckInCount(u.getTotalCheckInCount() == null ? 0 : Math.max(0, u.getTotalCheckInCount()));
        dto.setLastLoginAt(u.getLastLoginAt());
        return dto;
    }

    public static UserDTO from(User u, UserLevelDTO levelProfile) {
        UserDTO dto = from(u);
        dto.setLevelProfile(levelProfile);
        return dto;
    }
}
