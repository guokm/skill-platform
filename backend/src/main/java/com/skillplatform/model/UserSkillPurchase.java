package com.skillplatform.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_skill_purchases",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_user_skill_purchase",
                columnNames = {"user_id", "skill_id"}
        ),
        indexes = {
                @Index(name = "idx_purchase_user_id", columnList = "user_id"),
                @Index(name = "idx_purchase_skill_id", columnList = "skill_id"),
                @Index(name = "idx_purchase_created_at", columnList = "created_at")
        })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSkillPurchase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "skill_id", nullable = false)
    private Long skillId;

    @Column(name = "price_points", nullable = false)
    private Integer pricePoints;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
