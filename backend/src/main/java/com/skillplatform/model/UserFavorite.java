package com.skillplatform.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_favorites",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_user_skill_favorite",
                columnNames = {"user_id", "skill_id"}
        ),
        indexes = {
                @Index(name = "idx_fav_user_id",  columnList = "user_id"),
                @Index(name = "idx_fav_skill_id", columnList = "skill_id"),
        }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserFavorite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "skill_id", nullable = false)
    private Long skillId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
