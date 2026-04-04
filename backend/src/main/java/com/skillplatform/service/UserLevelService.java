package com.skillplatform.service;

import com.skillplatform.dto.UserDTO;
import com.skillplatform.dto.UserLevelDTO;
import com.skillplatform.exception.BusinessException;
import com.skillplatform.model.User;
import com.skillplatform.repository.SkillRepository;
import com.skillplatform.repository.UserRepository;
import com.skillplatform.repository.UserSkillPurchaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserLevelService {

    private static final List<LevelTier> LEVEL_TIERS = List.of(
            new LevelTier(1, "starter", "见习者", "Starter", "L1", 0, "刚完成登录建档，正在熟悉平台"),
            new LevelTier(2, "explorer", "探索者", "Explorer", "L2", 40, "开始签到、下载和收藏资源，形成稳定使用"),
            new LevelTier(3, "contributor", "共创者", "Contributor", "L3", 100, "已经建立足够活跃度，可解锁 zip 投稿权限"),
            new LevelTier(4, "curator", "策展者", "Curator", "L4", 220, "持续贡献高质量资源，能影响整个资源生态"),
            new LevelTier(5, "trailblazer", "领航者", "Trailblazer", "L5", 400, "平台核心共建者，拥有极高活跃度和贡献度")
    );

    private final UserRepository userRepository;
    private final UserSkillPurchaseRepository purchaseRepository;
    private final SkillRepository skillRepository;

    @Value("${app.points.upload-unlock-rank:3}")
    private int uploadUnlockRank;

    public UserDTO toUserDTO(User user) {
        return UserDTO.from(user, buildLevelProfile(user));
    }

    public UserLevelDTO getLevelProfile(Long userId) {
        if (userId != null && userId == -1L) {
            return buildAdminLevelProfile();
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        return buildLevelProfile(user);
    }

    public UserLevelDTO buildLevelProfile(User user) {
        if (user == null) {
            return buildAdminLevelProfile();
        }
        if (Boolean.TRUE.equals(user.getIsAdmin())) {
            return buildAdminLevelProfile();
        }

        long purchasedSkillCount = user.getId() == null ? 0 : purchaseRepository.countByUserId(user.getId());
        long submittedSkillCount = user.getLinuxDoId() == null || user.getLinuxDoId().isBlank()
                ? 0
                : skillRepository.countBySubmitterLinuxDoId(user.getLinuxDoId());

        long growthScore = calculateGrowthScore(user, purchasedSkillCount, submittedSkillCount);
        LevelTier currentTier = resolveTier(growthScore);
        LevelTier nextTier = resolveNextTier(currentTier.rank());
        LevelTier uploadUnlockTier = resolveUploadUnlockTier();
        long uploadUnlockThreshold = uploadUnlockTier == null ? 0L : uploadUnlockTier.threshold();

        UserLevelDTO dto = new UserLevelDTO();
        dto.setRank(currentTier.rank());
        dto.setCode(currentTier.code());
        dto.setNameZh(currentTier.nameZh());
        dto.setNameEn(currentTier.nameEn());
        dto.setBadge(currentTier.badge());
        dto.setDescription(currentTier.description());
        dto.setGrowthScore(growthScore);
        dto.setCurrentThreshold(currentTier.threshold());
        dto.setNextThreshold(nextTier == null ? null : nextTier.threshold());
        dto.setNextLevelNameZh(nextTier == null ? null : nextTier.nameZh());
        dto.setCanUploadZip(Boolean.TRUE.equals(user.getActive()) && currentTier.rank() >= uploadUnlockRank);
        dto.setUploadUnlockRank(uploadUnlockTier == null ? uploadUnlockRank : uploadUnlockTier.rank());
        dto.setUploadUnlockLevelNameZh(uploadUnlockTier == null ? "指定等级" : uploadUnlockTier.nameZh());
        dto.setUploadUnlockBadge(uploadUnlockTier == null ? "L" + uploadUnlockRank : uploadUnlockTier.badge());
        dto.setUploadUnlockThreshold(uploadUnlockThreshold);
        dto.setRemainingGrowthToNextLevel(nextTier == null ? 0 : Math.max(0, nextTier.threshold() - growthScore));
        dto.setRemainingGrowthToUpload(Math.max(0, uploadUnlockThreshold - growthScore));
        dto.setPurchasedSkillCount(purchasedSkillCount);
        dto.setSubmittedSkillCount(submittedSkillCount);
        return dto;
    }

    public void ensureUploadPermission(Long userId) {
        if (userId != null && userId == -1L) {
            return;
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "UPLOAD_ACCOUNT_INACTIVE", "当前账号不可用，暂时不能投稿技能包");
        }

        UserLevelDTO levelProfile = buildLevelProfile(user);
        if (Boolean.TRUE.equals(levelProfile.getCanUploadZip())) {
            return;
        }

        throw new BusinessException(
                HttpStatus.FORBIDDEN,
                "UPLOAD_LEVEL_REQUIRED",
                "当前等级为 " + levelProfile.getNameZh() + "，成长值还差 "
                        + levelProfile.getRemainingGrowthToUpload() + " 才能解锁 zip 投稿权限"
        );
    }

    private long calculateGrowthScore(User user, long purchasedSkillCount, long submittedSkillCount) {
        long trustBonus = Math.max(0, user.getTrustLevel() == null ? 0 : user.getTrustLevel()) * 15L;
        long checkInBonus = Math.max(0, user.getTotalCheckInCount() == null ? 0 : user.getTotalCheckInCount()) * 3L;
        long purchaseBonus = purchasedSkillCount * 8L;
        long spendingBonus = Math.max(0, user.getTotalPointsSpent() == null ? 0 : user.getTotalPointsSpent());
        long submissionBonus = submittedSkillCount * 30L;
        return trustBonus + checkInBonus + purchaseBonus + spendingBonus + submissionBonus;
    }

    private LevelTier resolveTier(long growthScore) {
        LevelTier current = LEVEL_TIERS.getFirst();
        for (LevelTier tier : LEVEL_TIERS) {
            if (growthScore >= tier.threshold()) {
                current = tier;
            } else {
                break;
            }
        }
        return current;
    }

    private LevelTier resolveNextTier(int currentRank) {
        return LEVEL_TIERS.stream()
                .filter(tier -> tier.rank() == currentRank + 1)
                .findFirst()
                .orElse(null);
    }

    private LevelTier resolveUploadUnlockTier() {
        return LEVEL_TIERS.stream()
                .filter(tier -> tier.rank() == uploadUnlockRank)
                .findFirst()
                .orElse(null);
    }

    private UserLevelDTO buildAdminLevelProfile() {
        LevelTier uploadUnlockTier = resolveUploadUnlockTier();
        UserLevelDTO dto = new UserLevelDTO();
        dto.setRank(99);
        dto.setCode("admin");
        dto.setNameZh("系统管理员");
        dto.setNameEn("Administrator");
        dto.setBadge("ADMIN");
        dto.setDescription("内置管理员账号，默认拥有全部功能权限");
        dto.setGrowthScore(999999L);
        dto.setCurrentThreshold(0L);
        dto.setNextThreshold(null);
        dto.setNextLevelNameZh(null);
        dto.setCanUploadZip(true);
        dto.setUploadUnlockRank(uploadUnlockTier == null ? uploadUnlockRank : uploadUnlockTier.rank());
        dto.setUploadUnlockLevelNameZh(uploadUnlockTier == null ? "指定等级" : uploadUnlockTier.nameZh());
        dto.setUploadUnlockBadge(uploadUnlockTier == null ? "L" + uploadUnlockRank : uploadUnlockTier.badge());
        dto.setUploadUnlockThreshold(0L);
        dto.setRemainingGrowthToNextLevel(0L);
        dto.setRemainingGrowthToUpload(0L);
        dto.setPurchasedSkillCount(0L);
        dto.setSubmittedSkillCount(0L);
        return dto;
    }

    private record LevelTier(
            int rank,
            String code,
            String nameZh,
            String nameEn,
            String badge,
            long threshold,
            String description
    ) {
    }
}
