package com.skillplatform.dto;

import com.skillplatform.model.Skill;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class SkillDTO {
    private Long id;
    private String slug;
    private String name;
    private String shortDescription;
    private String description;
    private String readmeContent;
    private CategoryDTO category;
    private String author;
    private String version;
    private String license;
    private String downloadUrl;
    private String sourceUrl;
    private String iconUrl;
    private String iconEmoji;
    private String origin;
    private String submitterUsername;
    private List<String> tags;
    private Long clickCount;
    private Long downloadCount;
    private Integer pricePoints;
    private Boolean featured;
    private Boolean verified;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static SkillDTO from(Skill s) {
        SkillDTO dto = new SkillDTO();
        dto.setId(s.getId());
        dto.setSlug(s.getSlug());
        dto.setName(s.getName());
        dto.setShortDescription(s.getShortDescription());
        dto.setDescription(s.getDescription());
        dto.setReadmeContent(s.getReadmeContent());
        if (s.getCategory() != null) {
            dto.setCategory(CategoryDTO.from(s.getCategory()));
        }
        dto.setAuthor(s.getAuthor());
        dto.setVersion(s.getVersion());
        dto.setLicense(s.getLicense());
        dto.setDownloadUrl(s.getDownloadUrl());
        dto.setSourceUrl(s.getSourceUrl());
        dto.setIconUrl(s.getIconUrl());
        dto.setIconEmoji(s.getIconEmoji());
        dto.setOrigin(s.getOrigin());
        dto.setSubmitterUsername(s.getSubmitterUsername());
        dto.setTags(s.getTags());
        dto.setClickCount(s.getClickCount());
        dto.setDownloadCount(s.getDownloadCount());
        dto.setPricePoints(s.getPricePoints() == null ? 1 : Math.max(0, s.getPricePoints()));
        dto.setFeatured(s.getFeatured());
        dto.setVerified(s.getVerified());
        dto.setCreatedAt(s.getCreatedAt());
        dto.setUpdatedAt(s.getUpdatedAt());
        return dto;
    }
}
