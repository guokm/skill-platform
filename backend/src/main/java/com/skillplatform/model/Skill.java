package com.skillplatform.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
// @Index is already part of jakarta.persistence — imported via the wildcard above

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "skills", indexes = {
        @Index(name = "idx_skill_click_count",    columnList = "click_count"),
        @Index(name = "idx_skill_download_count", columnList = "download_count"),
        @Index(name = "idx_skill_category_id",    columnList = "category_id"),
        @Index(name = "idx_skill_created_at",     columnList = "created_at"),
        @Index(name = "idx_skill_featured",       columnList = "featured"),
        @Index(name = "idx_skill_verified",       columnList = "verified"),
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = "category")
@ToString(exclude = "category")
public class Skill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 100)
    private String slug;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "short_description", length = 500)
    private String shortDescription;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "readme_content", columnDefinition = "TEXT")
    private String readmeContent;  // Full SKILL.md content

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(length = 200)
    private String author;

    @Column(length = 50)
    private String version;

    @Column(length = 200)
    private String license;

    @Column(name = "download_url", length = 500)
    private String downloadUrl;

    @Column(name = "source_url", length = 500)
    private String sourceUrl;

    @Column(name = "source_path", length = 1000)
    private String sourcePath;

    @Column(name = "icon_url", length = 500)
    private String iconUrl;

    @Column(name = "icon_emoji", length = 10)
    private String iconEmoji;

    @Column(name = "origin", length = 100)
    private String origin;  // e.g. ECC, community, etc.

    @Column(name = "submitter_linux_do_id", length = 100)
    private String submitterLinuxDoId;

    @Column(name = "submitter_username", length = 100)
    private String submitterUsername;

    @Column(name = "submission_reward_granted")
    @Builder.Default
    private Boolean submissionRewardGranted = false;

    @Column(name = "submission_reward_granted_at")
    private LocalDateTime submissionRewardGrantedAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "skill_tags", joinColumns = @JoinColumn(name = "skill_id"))
    @Column(name = "tag", length = 50)
    @Builder.Default
    private List<String> tags = new ArrayList<>();

    @Column(name = "click_count")
    @Builder.Default
    private Long clickCount = 0L;

    @Column(name = "download_count")
    @Builder.Default
    private Long downloadCount = 0L;

    @Column(name = "price_points")
    @Builder.Default
    private Integer pricePoints = 1;

    @Column(name = "featured")
    @Builder.Default
    private Boolean featured = false;

    @Column(name = "verified")
    @Builder.Default
    private Boolean verified = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
