package com.skillplatform.dto;

import lombok.Data;

@Data
public class UserLevelDTO {
    private Integer rank;
    private String code;
    private String nameZh;
    private String nameEn;
    private String badge;
    private String description;
    private Long growthScore;
    private Long currentThreshold;
    private Long nextThreshold;
    private String nextLevelNameZh;
    private Boolean canUploadZip;
    private Integer uploadUnlockRank;
    private String uploadUnlockLevelNameZh;
    private String uploadUnlockBadge;
    private Long uploadUnlockThreshold;
    private Long remainingGrowthToNextLevel;
    private Long remainingGrowthToUpload;
    private Long purchasedSkillCount;
    private Long submittedSkillCount;
}
