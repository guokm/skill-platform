package com.skillplatform.dto;

import com.skillplatform.model.UserSkillPurchase;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PurchasedSkillDTO {
    private Long id;
    private Integer pricePoints;
    private LocalDateTime purchasedAt;
    private SkillDTO skill;

    public static PurchasedSkillDTO from(UserSkillPurchase purchase, SkillDTO skill) {
        PurchasedSkillDTO dto = new PurchasedSkillDTO();
        dto.setId(purchase.getId());
        dto.setPricePoints(purchase.getPricePoints());
        dto.setPurchasedAt(purchase.getCreatedAt());
        dto.setSkill(skill);
        return dto;
    }
}
