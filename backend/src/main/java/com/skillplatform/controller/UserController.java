package com.skillplatform.controller;

import com.skillplatform.dto.CheckInResultDTO;
import com.skillplatform.dto.PointSummaryDTO;
import com.skillplatform.dto.PurchasedSkillDTO;
import com.skillplatform.dto.CreatorSkillDTO;
import com.skillplatform.dto.RatingDTO;
import com.skillplatform.dto.SkillSubmissionResultDTO;
import com.skillplatform.dto.SkillDTO;
import com.skillplatform.dto.SkillPurchaseStatusDTO;
import com.skillplatform.dto.UserLevelDTO;
import com.skillplatform.model.PointTransactionType;
import com.skillplatform.model.Skill;
import com.skillplatform.model.User;
import com.skillplatform.repository.PointTransactionRepository;
import com.skillplatform.repository.SkillRepository;
import com.skillplatform.repository.UserRepository;
import com.skillplatform.repository.UserSkillPurchaseRepository;
import com.skillplatform.service.FavoriteService;
import com.skillplatform.service.PointService;
import com.skillplatform.service.RatingService;
import com.skillplatform.service.SkillSubmissionService;
import com.skillplatform.service.UserLevelService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * 用户相关操作：收藏、评分
 * 所有接口均需要登录（JWT）。
 */
@RestController
@RequiredArgsConstructor
@Tag(name = "User", description = "用户收藏 & 评分接口")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final FavoriteService favoriteService;
    private final RatingService   ratingService;
    private final PointService pointService;
    private final SkillSubmissionService skillSubmissionService;
    private final UserLevelService userLevelService;
    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final PointTransactionRepository pointTransactionRepository;
    private final UserSkillPurchaseRepository purchaseRepository;

    @GetMapping("/api/users/me/points")
    @Operation(summary = "获取我的积分信息")
    public ResponseEntity<PointSummaryDTO> myPoints(Authentication auth) {
        Long userId = extractUserId(auth);
        return ResponseEntity.ok(pointService.getPointSummary(userId));
    }

    @GetMapping("/api/users/me/level")
    @Operation(summary = "获取我的等级与权限信息")
    public ResponseEntity<UserLevelDTO> myLevel(Authentication auth) {
        Long userId = extractUserId(auth);
        return ResponseEntity.ok(userLevelService.getLevelProfile(userId));
    }

    @PostMapping("/api/users/me/check-in")
    @Operation(summary = "每日签到领取积分")
    public ResponseEntity<CheckInResultDTO> dailyCheckIn(Authentication auth) {
        Long userId = extractUserId(auth);
        return ResponseEntity.ok(pointService.checkIn(userId));
    }

    @GetMapping("/api/users/me/purchases")
    @Operation(summary = "获取我已购买的技能资源")
    public ResponseEntity<List<PurchasedSkillDTO>> myPurchases(Authentication auth) {
        Long userId = extractUserId(auth);
        return ResponseEntity.ok(pointService.getPurchasedSkills(userId));
    }

    @PostMapping("/api/users/me/submissions/upload")
    @Operation(summary = "上传技能包 zip，自动解压并触发入库")
    public ResponseEntity<SkillSubmissionResultDTO> uploadSkillPackage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "pricePoints", required = false) Integer pricePoints,
            Authentication auth
    ) {
        Long userId = extractUserId(auth);
        return ResponseEntity.ok(skillSubmissionService.submitSkillPackage(userId, file, pricePoints));
    }

    @GetMapping("/api/users/me/skills/{id}/purchase-status")
    @Operation(summary = "查询当前用户对某个技能的购买状态")
    public ResponseEntity<SkillPurchaseStatusDTO> getPurchaseStatus(
            @PathVariable Long id,
            Authentication auth
    ) {
        Long userId = extractUserId(auth);
        return ResponseEntity.ok(pointService.getPurchaseStatus(userId, id));
    }

    // ────────────────────────────── Creator / Submitted Skills ─────────────

    @GetMapping("/api/users/me/submitted-skills")
    @Operation(summary = "获取我提交的技能列表（创作者视角，含收益统计）")
    public ResponseEntity<List<CreatorSkillDTO>> mySubmittedSkills(Authentication auth) {
        Long userId = extractUserId(auth);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        String linuxDoId = user.getLinuxDoId();
        if (linuxDoId == null || linuxDoId.isBlank()) {
            return ResponseEntity.ok(List.of());
        }
        List<Skill> skills = skillRepository.findBySubmitterLinuxDoIdOrderByCreatedAtDesc(linuxDoId.trim());
        List<CreatorSkillDTO> result = skills.stream().map(skill -> {
            long earned = pointTransactionRepository.sumDeltaPointsBySkillIdAndType(
                    skill.getId(), PointTransactionType.AUTHOR_REVENUE_SHARE);
            long purchaserCount = purchaseRepository.countBySkillId(skill.getId());
            return CreatorSkillDTO.from(skill, earned, purchaserCount);
        }).toList();
        return ResponseEntity.ok(result);
    }

    // ────────────────────────────── Favorites ──────────────────────────────

    /** 获取当前用户的收藏列表 */
    @GetMapping("/api/users/me/favorites")
    @Operation(summary = "获取我的收藏列表")
    public ResponseEntity<List<SkillDTO>> myFavorites(Authentication auth) {
        Long userId = extractUserId(auth);
        return ResponseEntity.ok(favoriteService.getUserFavorites(userId));
    }

    /** 切换收藏状态（已收藏 → 取消，未收藏 → 添加） */
    @PostMapping("/api/skills/{id}/favorite")
    @Operation(summary = "收藏 / 取消收藏")
    public ResponseEntity<Map<String, Object>> toggleFavorite(
            @PathVariable Long id,
            Authentication auth
    ) {
        Long userId = extractUserId(auth);
        return ResponseEntity.ok(favoriteService.toggleFavorite(userId, id));
    }

    /** 查询某技能对当前用户的收藏状态 */
    @GetMapping("/api/skills/{id}/favorite")
    @Operation(summary = "查询收藏状态 & 总收藏数")
    public ResponseEntity<Map<String, Object>> getFavoriteStatus(
            @PathVariable Long id,
            Authentication auth
    ) {
        Long userId = extractUserId(auth);
        boolean favorited = favoriteService.isFavorited(userId, id);
        long total = favoriteService.getFavoriteCount(id);
        return ResponseEntity.ok(Map.of("favorited", favorited, "totalFavorites", total));
    }

    // ────────────────────────────── Ratings ────────────────────────────────

    /** 查询某技能的评分信息（包含当前用户评分，若已登录） */
    @GetMapping("/api/skills/{id}/rating")
    @Operation(summary = "获取技能评分信息")
    public ResponseEntity<RatingDTO> getRating(
            @PathVariable Long id,
            Authentication auth
    ) {
        Long userId = auth != null ? extractUserId(auth) : null;
        return ResponseEntity.ok(ratingService.getRating(id, userId));
    }

    /** 提交/更新评分（需登录） */
    @PostMapping("/api/skills/{id}/rate")
    @Operation(summary = "提交评分 (1~5 星)")
    public ResponseEntity<RatingDTO> rate(
            @PathVariable Long id,
            @RequestBody RateRequest req,
            Authentication auth
    ) {
        Long userId = extractUserId(auth);
        return ResponseEntity.ok(ratingService.rate(id, userId, req.getRating()));
    }

    // ────────────────────────────── Helpers ────────────────────────────────

    private Long extractUserId(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) {
            throw new RuntimeException("Not authenticated");
        }
        return Long.parseLong(auth.getName());
    }

    @Data
    public static class RateRequest {
        private int rating;
    }
}
