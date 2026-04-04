package com.skillplatform.dto;

import com.skillplatform.model.Skill;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 创作者视角的技能摘要 —— 包含下载量、评分和积分收益。
 */
@Data
public class CreatorSkillDTO {

    private Long id;
    private String slug;
    private String name;
    private String shortDescription;
    private String iconEmoji;
    private Integer pricePoints;
    private Long downloadCount;
    private Long clickCount;
    private Boolean featured;
    private Boolean verified;
    private Boolean submissionRewardGranted;
    private LocalDateTime createdAt;

    /** 该技能带来的总分成积分（AUTHOR_REVENUE_SHARE 类型之和） */
    private Long totalEarned;

    /** 下载该技能的独立用户数（= UserSkillPurchase 记录数） */
    private Long purchaserCount;

    public static CreatorSkillDTO from(Skill skill, long totalEarned, long purchaserCount) {
        CreatorSkillDTO dto = new CreatorSkillDTO();
        dto.setId(skill.getId());
        dto.setSlug(skill.getSlug());
        dto.setName(skill.getName());
        dto.setShortDescription(skill.getShortDescription());
        dto.setIconEmoji(skill.getIconEmoji());
        dto.setPricePoints(skill.getPricePoints() == null ? 0 : skill.getPricePoints());
        dto.setDownloadCount(skill.getDownloadCount() == null ? 0 : skill.getDownloadCount());
        dto.setClickCount(skill.getClickCount() == null ? 0 : skill.getClickCount());
        dto.setFeatured(Boolean.TRUE.equals(skill.getFeatured()));
        dto.setVerified(Boolean.TRUE.equals(skill.getVerified()));
        dto.setSubmissionRewardGranted(Boolean.TRUE.equals(skill.getSubmissionRewardGranted()));
        dto.setCreatedAt(skill.getCreatedAt());
        dto.setTotalEarned(totalEarned);
        dto.setPurchaserCount(purchaserCount);
        return dto;
    }
}
