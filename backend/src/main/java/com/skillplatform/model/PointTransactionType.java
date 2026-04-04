package com.skillplatform.model;

public enum PointTransactionType {
    WELCOME_BONUS,
    DAILY_CHECK_IN,
    DOWNLOAD_PURCHASE,
    AUTHOR_REVENUE_SHARE,   // 技能被下载，作者获得的分成
    SKILL_SUBMISSION_REWARD, // 技能审核通过后的上架奖励
    RATING_REWARD,          // 用户评分奖励
    ADMIN_ADJUSTMENT
}
