package com.skillplatform.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class PointSummaryDTO {
    private Integer pointsBalance;
    private Integer totalPointsSpent;
    private Long purchasedSkillCount;
    private Boolean checkedInToday;
    private LocalDate lastCheckInDate;
    private Integer checkInStreakDays;
    private Integer totalCheckInCount;
    private UserLevelDTO levelProfile;
    private List<PointTransactionDTO> recentTransactions;
}
