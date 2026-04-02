package com.skillplatform.dto;

import com.skillplatform.model.Category;
import lombok.Data;

@Data
public class CategoryDTO {
    private Long id;
    private String slug;
    private String name;
    private String nameZh;
    private String groupKey;
    private String groupName;
    private String groupNameZh;
    private String description;
    private String icon;
    private String colorClass;
    private Integer sortOrder;
    private long skillCount;

    public static CategoryDTO from(Category c) {
        CategoryDTO dto = new CategoryDTO();
        dto.setId(c.getId());
        dto.setSlug(c.getSlug());
        dto.setName(c.getName());
        dto.setNameZh(c.getNameZh());
        dto.setGroupKey(c.getGroupKey());
        dto.setGroupName(c.getGroupName());
        dto.setGroupNameZh(c.getGroupNameZh());
        dto.setDescription(c.getDescription());
        dto.setIcon(c.getIcon());
        dto.setColorClass(c.getColorClass());
        dto.setSortOrder(c.getSortOrder());
        dto.setSkillCount(c.getSkillCount());
        return dto;
    }
}
