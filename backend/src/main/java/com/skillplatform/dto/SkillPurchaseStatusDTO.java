package com.skillplatform.dto;

import lombok.Data;

@Data
public class SkillPurchaseStatusDTO {
    private Long skillId;
    private Integer pricePoints;
    private Integer pointsBalance;
    private Boolean purchased;
    private Boolean canAfford;
}
