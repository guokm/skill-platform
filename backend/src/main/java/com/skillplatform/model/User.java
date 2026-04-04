package com.skillplatform.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.time.LocalDate;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Linux.do 平台用户 ID（字符串，对应 Linux.do 的 id 字段） */
    @Column(name = "linux_do_id", unique = true, nullable = false, length = 100)
    private String linuxDoId;

    @Column(nullable = false, length = 100)
    private String username;

    @Column(length = 200)
    private String name;

    @Column(length = 200)
    private String email;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    /** Linux.do trust_level: 0=新用户 1=基础 2=成员 3=正式 4=领袖 */
    @Column(name = "trust_level")
    @Builder.Default
    private Integer trustLevel = 0;

    /** 手动指定的超级管理员 */
    @Column(name = "is_admin")
    @Builder.Default
    private Boolean isAdmin = false;

    @Column(name = "active")
    @Builder.Default
    private Boolean active = true;

    @Column(name = "points_balance")
    @Builder.Default
    private Integer pointsBalance = 0;

    @Column(name = "total_points_spent")
    @Builder.Default
    private Integer totalPointsSpent = 0;

    @Column(name = "last_check_in_date")
    private LocalDate lastCheckInDate;

    @Column(name = "check_in_streak_days")
    @Builder.Default
    private Integer checkInStreakDays = 0;

    @Column(name = "total_check_in_count")
    @Builder.Default
    private Integer totalCheckInCount = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;
}
