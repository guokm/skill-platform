package com.skillplatform.dto;

public record RatingDTO(
        Long skillId,
        Double avgRating,
        Long totalCount,
        Integer myRating   // null if current user hasn't rated
) {}
