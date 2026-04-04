package com.skillplatform.dto;

import com.skillplatform.model.PointTransaction;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PointTransactionDTO {
    private Long id;
    private Long skillId;
    private String type;
    private Integer deltaPoints;
    private Integer balanceAfter;
    private String note;
    private LocalDateTime createdAt;

    public static PointTransactionDTO from(PointTransaction transaction) {
        PointTransactionDTO dto = new PointTransactionDTO();
        dto.setId(transaction.getId());
        dto.setSkillId(transaction.getSkillId());
        dto.setType(transaction.getType().name());
        dto.setDeltaPoints(transaction.getDeltaPoints());
        dto.setBalanceAfter(transaction.getBalanceAfter());
        dto.setNote(transaction.getNote());
        dto.setCreatedAt(transaction.getCreatedAt());
        return dto;
    }
}
