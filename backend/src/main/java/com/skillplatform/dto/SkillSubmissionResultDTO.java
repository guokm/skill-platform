package com.skillplatform.dto;

import lombok.Data;

import java.util.Map;

@Data
public class SkillSubmissionResultDTO {
    private String message;
    private String skillSlug;
    private String skillName;
    private Integer pricePoints;
    private String submitterLinuxDoId;
    private Boolean submissionRewardGranted;
    private String uploadFolder;
    private Map<String, Object> crawlResult;
}
