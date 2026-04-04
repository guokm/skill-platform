package com.skillplatform.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "point_transactions", indexes = {
        @Index(name = "idx_point_tx_user_id", columnList = "user_id"),
        @Index(name = "idx_point_tx_skill_id", columnList = "skill_id"),
        @Index(name = "idx_point_tx_created_at", columnList = "created_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PointTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "skill_id")
    private Long skillId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private PointTransactionType type;

    @Column(name = "delta_points", nullable = false)
    private Integer deltaPoints;

    @Column(name = "balance_after", nullable = false)
    private Integer balanceAfter;

    @Column(length = 300)
    private String note;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
