package com.skillplatform.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 对外公开的用户主页数据 —— 不包含邮箱等敏感信息。
 */
@Data
public class PublicProfileDTO {

    // ── 基本信息 ─────────────────────────────────────────────────────────────
    private String username;
    private String name;
    private String avatarUrl;
    private String linuxDoId;
    private LocalDateTime joinedAt;

    // ── 等级 & 成长 ──────────────────────────────────────────────────────────
    private UserLevelDTO levelProfile;

    // ── 积分摘要（公开部分）────────────────────────────────────────────────────
    private Integer checkInStreakDays;
    private Integer totalCheckInCount;

    // ── 资产统计 ──────────────────────────────────────────────────────────────
    private Long submittedSkillCount;   // 提交的技能数
    private Long purchasedSkillCount;   // 购买的技能数（仅数量）

    // ── 提交的技能列表（公开展示） ──────────────────────────────────────────────
    private List<SkillDTO> submittedSkills;
}
