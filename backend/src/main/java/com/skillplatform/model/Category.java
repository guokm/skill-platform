package com.skillplatform.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "categories")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = "skills")
@ToString(exclude = "skills")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String slug;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "name_zh", length = 100)
    private String nameZh;

    @Column(name = "group_key", length = 50)
    private String groupKey;

    @Column(name = "group_name", length = 100)
    private String groupName;

    @Column(name = "group_name_zh", length = 100)
    private String groupNameZh;

    @Column(length = 500)
    private String description;

    @Column(length = 10)
    private String icon;  // Emoji icon

    @Column(name = "color_class", length = 50)
    private String colorClass;  // Tailwind CSS color class

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Skill> skills = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public long getSkillCount() {
        return skills != null ? skills.size() : 0;
    }
}
