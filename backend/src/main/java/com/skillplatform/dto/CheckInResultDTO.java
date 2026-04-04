package com.skillplatform.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class CheckInResultDTO {
    private Integer rewardPoints;
    private Integer pointsBalance;
    private Integer checkInStreakDays;
    private Integer totalCheckInCount;
    private Boolean checkedInToday;
    private LocalDate lastCheckInDate;
    private String message;
}
