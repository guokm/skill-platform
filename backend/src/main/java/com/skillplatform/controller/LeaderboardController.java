package com.skillplatform.controller;

import com.skillplatform.dto.SkillDTO;
import com.skillplatform.dto.UserDTO;
import com.skillplatform.model.User;
import com.skillplatform.repository.SkillRepository;
import com.skillplatform.repository.UserRepository;
import com.skillplatform.service.UserLevelService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
@Tag(name = "Leaderboard", description = "排行榜接口（公开）")
public class LeaderboardController {

    private final SkillRepository skillRepository;
    private final UserRepository userRepository;
    private final UserLevelService userLevelService;

    /**
     * 综合排行榜数据
     */
    @GetMapping
    @Operation(summary = "获取综合排行榜数据")
    public ResponseEntity<Map<String, Object>> getLeaderboard() {
        Map<String, Object> result = new LinkedHashMap<>();

        // Top skills by downloads (all-time)
        List<SkillDTO> topByDownloads = skillRepository.findTop10ByOrderByDownloadCountDesc()
                .stream().map(SkillDTO::from).toList();

        // Top skills by clicks
        List<SkillDTO> topByClicks = skillRepository.findTop10ByOrderByClickCountDesc()
                .stream().map(SkillDTO::from).toList();

        // Top users by points balance (richest)
        List<UserDTO> topByBalance = userRepository.findTopByPointsBalance(PageRequest.of(0, 10))
                .stream().map(this::toPublicUserDTO).toList();

        // Top contributors by total points spent (most active buyers)
        List<UserDTO> topBySpent = userRepository.findTopByPointsSpent(PageRequest.of(0, 10))
                .stream().map(this::toPublicUserDTO).toList();

        // Top by check-in streak
        List<UserDTO> topByStreak = userRepository.findTopByCheckInStreak(PageRequest.of(0, 10))
                .stream().map(this::toPublicUserDTO).toList();

        result.put("topSkillsByDownloads", topByDownloads);
        result.put("topSkillsByClicks", topByClicks);
        result.put("topUsersByBalance", topByBalance);
        result.put("topUsersBySpent", topBySpent);
        result.put("topUsersByStreak", topByStreak);

        return ResponseEntity.ok(result);
    }

    /**
     * Converts a User to a public-safe DTO (no email, no admin flag)
     */
    private UserDTO toPublicUserDTO(User u) {
        UserDTO dto = new UserDTO();
        dto.setId(u.getId());
        dto.setUsername(u.getUsername());
        dto.setName(u.getName());
        dto.setAvatarUrl(u.getAvatarUrl());
        dto.setTrustLevel(u.getTrustLevel());
        dto.setPointsBalance(u.getPointsBalance() == null ? 0 : Math.max(0, u.getPointsBalance()));
        dto.setTotalPointsSpent(u.getTotalPointsSpent() == null ? 0 : Math.max(0, u.getTotalPointsSpent()));
        dto.setCheckInStreakDays(u.getCheckInStreakDays() == null ? 0 : Math.max(0, u.getCheckInStreakDays()));
        dto.setTotalCheckInCount(u.getTotalCheckInCount() == null ? 0 : Math.max(0, u.getTotalCheckInCount()));
        dto.setLevelProfile(userLevelService.buildLevelProfile(u));
        return dto;
    }
}
