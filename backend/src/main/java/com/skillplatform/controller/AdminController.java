package com.skillplatform.controller;

import com.skillplatform.dto.PointSummaryDTO;
import com.skillplatform.dto.PagedResponse;
import com.skillplatform.dto.SkillDTO;
import com.skillplatform.dto.UserDTO;
import com.skillplatform.model.Skill;
import com.skillplatform.model.User;
import com.skillplatform.repository.SkillRepository;
import com.skillplatform.repository.UserRepository;
import com.skillplatform.service.SkillCrawlerService;
import com.skillplatform.service.PointService;
import com.skillplatform.service.SkillService;
import com.skillplatform.service.UserLevelService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin", description = "管理员操作，需要 ROLE_ADMIN")
@SecurityRequirement(name = "bearerAuth")
public class AdminController {

    private final SkillCrawlerService crawlerService;
    private final SkillRepository skillRepository;
    private final UserRepository userRepository;
    private final SkillService skillService;
    private final PointService pointService;
    private final UserLevelService userLevelService;

    // ── Crawl ─────────────────────────────────────────────────────────────

    @PostMapping("/crawl")
    @Operation(summary = "触发 Skill 爬取")
    public ResponseEntity<Map<String, Object>> triggerCrawl() {
        Map<String, Object> result = crawlerService.crawl();
        skillService.evictAllCaches();
        return ResponseEntity.ok(result);
    }

    // ── Skill Management ──────────────────────────────────────────────────

    @GetMapping("/skills")
    @Operation(summary = "分页查询 Skills（管理视图）")
    public ResponseEntity<PagedResponse<SkillDTO>> listSkills(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(required = false) String keyword
    ) {
        return ResponseEntity.ok(skillService.getSkills(null, null, keyword, page, size, sortBy.equals("createdAt") ? "newest" : sortBy));
    }

    @PatchMapping("/skills/{id}")
    @Operation(summary = "更新 Skill 属性（featured / verified / name 等）")
    public ResponseEntity<SkillDTO> patchSkill(
            @PathVariable Long id,
            @RequestBody SkillPatchRequest req) {

        Skill skill = skillRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Skill not found: " + id));

        if (req.getFeatured() != null) skill.setFeatured(req.getFeatured());
        if (req.getVerified() != null) skill.setVerified(req.getVerified());
        if (req.getName() != null && !req.getName().isBlank()) skill.setName(req.getName());
        if (req.getShortDescription() != null) skill.setShortDescription(req.getShortDescription());
        if (req.getIconEmoji() != null) skill.setIconEmoji(req.getIconEmoji());
        if (req.getPricePoints() != null) skill.setPricePoints(Math.max(0, req.getPricePoints()));

        SkillDTO dto = SkillDTO.from(skillRepository.save(skill));
        skillService.evictAllCaches();
        return ResponseEntity.ok(dto);
    }

    @DeleteMapping("/skills/{id}")
    @Operation(summary = "删除 Skill")
    public ResponseEntity<Void> deleteSkill(@PathVariable Long id) {
        if (!skillRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        skillRepository.deleteById(id);
        skillService.evictAllCaches();
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/skills/{id}/feature")
    @Operation(summary = "切换 Featured 状态")
    public ResponseEntity<Map<String, Object>> toggleFeatured(@PathVariable Long id) {
        Skill skill = skillRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Skill not found: " + id));
        skill.setFeatured(!Boolean.TRUE.equals(skill.getFeatured()));
        skillRepository.save(skill);
        skillService.evictAllCaches();
        return ResponseEntity.ok(Map.of("id", id, "featured", skill.getFeatured()));
    }

    @PostMapping("/skills/{id}/verify")
    @Operation(summary = "切换 Verified 状态")
    public ResponseEntity<Map<String, Object>> toggleVerified(@PathVariable Long id) {
        Skill skill = skillRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Skill not found: " + id));
        skill.setVerified(!Boolean.TRUE.equals(skill.getVerified()));
        skillRepository.save(skill);
        skillService.evictAllCaches();
        return ResponseEntity.ok(Map.of("id", id, "verified", skill.getVerified()));
    }

    // ── User Management ───────────────────────────────────────────────────

    @GetMapping("/users")
    @Operation(summary = "查询用户列表")
    public ResponseEntity<List<UserDTO>> listUsers() {
        return ResponseEntity.ok(
                userRepository.findAll(Sort.by(Sort.Direction.DESC, "lastLoginAt"))
                        .stream().map(userLevelService::toUserDTO).toList()
        );
    }

    @PatchMapping("/users/{id}/admin")
    @Operation(summary = "切换用户管理员权限")
    public ResponseEntity<UserDTO> toggleAdmin(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
        user.setIsAdmin(!Boolean.TRUE.equals(user.getIsAdmin()));
        return ResponseEntity.ok(userLevelService.toUserDTO(userRepository.save(user)));
    }

    @PatchMapping("/users/{id}/points")
    @Operation(summary = "管理员调整用户积分")
    public ResponseEntity<PointSummaryDTO> adjustUserPoints(
            @PathVariable Long id,
            @RequestBody UserPointsPatchRequest req
    ) {
        int deltaPoints = req.getDeltaPoints() == null ? 0 : req.getDeltaPoints();
        return ResponseEntity.ok(pointService.adjustPoints(id, deltaPoints, req.getNote()));
    }

    // ── Submissions Review Queue ──────────────────────────────────────────

    @GetMapping("/submissions")
    @Operation(summary = "获取待审核的社区投稿列表")
    public ResponseEntity<List<SkillDTO>> listPendingSubmissions() {
        List<SkillDTO> pending = skillRepository.findPendingCommunitySubmissions()
                .stream().map(SkillDTO::from).toList();
        return ResponseEntity.ok(pending);
    }

    @PostMapping("/submissions/{id}/approve")
    @Operation(summary = "审核通过：将 Skill 设为已验证，对外公开")
    public ResponseEntity<SkillDTO> approveSubmission(@PathVariable Long id) {
        Skill skill = skillRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Skill not found: " + id));
        skill.setVerified(true);
        SkillDTO dto = SkillDTO.from(skillRepository.save(skill));
        skillService.evictAllCaches();
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/submissions/{id}/reject")
    @Operation(summary = "审核拒绝：删除该 Skill 记录（提交者需重新提交）")
    public ResponseEntity<Map<String, Object>> rejectSubmission(
            @PathVariable Long id,
            @RequestBody(required = false) SubmissionRejectRequest req
    ) {
        Skill skill = skillRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Skill not found: " + id));
        String name = skill.getName();
        String note = req != null && req.getNote() != null ? req.getNote() : "内容不符合平台标准";
        skillRepository.deleteById(id);
        skillService.evictAllCaches();
        return ResponseEntity.ok(Map.of("id", id, "name", name, "reason", note, "rejected", true));
    }

    // ── Stats ─────────────────────────────────────────────────────────────

    @GetMapping("/stats")
    @Operation(summary = "平台统计数据（管理视图）")
    public ResponseEntity<Map<String, Object>> adminStats() {
        return ResponseEntity.ok(Map.of(
                "totalSkills", skillRepository.count(),
                "totalUsers", userRepository.count(),
                "totalClicks", skillRepository.sumClickCount(),
                "totalDownloads", skillRepository.sumDownloadCount(),
                "totalPointsBalance", userRepository.sumPointsBalance(),
                "totalPointsSpent", userRepository.sumTotalPointsSpent(),
                "featuredSkills", skillRepository.countByFeaturedTrue(),
                "verifiedSkills", skillRepository.countByVerifiedTrue(),
                "pendingSubmissions", skillRepository.findPendingCommunitySubmissions().size()
        ));
    }

    // ── DTOs ──────────────────────────────────────────────────────────────

    @Data
    public static class SkillPatchRequest {
        private Boolean featured;
        private Boolean verified;
        private String name;
        private String shortDescription;
        private String iconEmoji;
        private Integer pricePoints;
    }

    @Data
    public static class UserPointsPatchRequest {
        private Integer deltaPoints;
        private String note;
    }

    @Data
    public static class SubmissionRejectRequest {
        private String note;
    }
}
