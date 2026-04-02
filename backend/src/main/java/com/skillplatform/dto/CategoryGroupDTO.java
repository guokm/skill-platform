package com.skillplatform.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class CategoryGroupDTO {
    private String key;
    private String name;
    private String nameZh;
    private List<CategoryDTO> categories;
}
