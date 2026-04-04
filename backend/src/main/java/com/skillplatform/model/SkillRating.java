package com.skillplatform.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "skill_ratings",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_user_skill_rating",
                columnNames = {"user_id", "skill_id"}
        ),
        indexes = {
                @Index(name = "idx_rating_skill_id", columnList = "skill_id"),
                @Index(name = "idx_rating_user_id",  columnList = "user_id"),
        }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SkillRating {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "skill_id", nullable = false)
    private Long skillId;

    /** 1 ~ 5 星 */
    @Column(nullable = false)
    private Integer rating;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
