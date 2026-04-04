package com.skillplatform.controller;

import com.skillplatform.dto.PublicProfileDTO;
import com.skillplatform.dto.SkillDTO;
import com.skillplatform.model.User;
import com.skillplatform.repository.SkillRepository;
import com.skillplatform.repository.UserRepository;
import com.skillplatform.repository.UserSkillPurchaseRepository;
import com.skillplatform.service.UserLevelService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Profile", description = "公开用户主页接口")
public class ProfileController {

    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final UserSkillPurchaseRepository purchaseRepository;
    private final UserLevelService userLevelService;

    /**
     * 根据用户名获取公开主页信息。
     * 该接口无需认证，任何人都可以访问。
     */
    @GetMapping("/{username}/profile")
    @Operation(summary = "获取用户公开主页（无需登录）")
    public ResponseEntity<PublicProfileDTO> getPublicProfile(@PathVariable String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        PublicProfileDTO dto = new PublicProfileDTO();
        dto.setUsername(user.getUsername());
        dto.setName(user.getName());
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setLinuxDoId(user.getLinuxDoId());
        dto.setJoinedAt(user.getCreatedAt());

        // Level profile
        dto.setLevelProfile(userLevelService.buildLevelProfile(user));

        // Points (public portion only)
        dto.setCheckInStreakDays(user.getCheckInStreakDays() == null ? 0 : Math.max(0, user.getCheckInStreakDays()));
        dto.setTotalCheckInCount(user.getTotalCheckInCount() == null ? 0 : Math.max(0, user.getTotalCheckInCount()));

        // Asset counts
        String linuxDoId = user.getLinuxDoId();
        long submittedCount = (linuxDoId == null || linuxDoId.isBlank())
                ? 0
                : skillRepository.countBySubmitterLinuxDoId(linuxDoId.trim());
        dto.setSubmittedSkillCount(submittedCount);
        dto.setPurchasedSkillCount(purchaseRepository.countByUserId(user.getId()));

        // Submitted skills (public list)
        List<SkillDTO> submittedSkills = (linuxDoId == null || linuxDoId.isBlank())
                ? List.of()
                : skillRepository.findBySubmitterLinuxDoIdOrderByCreatedAtDesc(linuxDoId.trim())
                        .stream()
                        .map(SkillDTO::from)
                        .toList();
        dto.setSubmittedSkills(submittedSkills);

        return ResponseEntity.ok(dto);
    }
}
