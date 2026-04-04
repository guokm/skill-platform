package com.skillplatform.service;

import com.skillplatform.config.CacheConfig;
import com.skillplatform.dto.RatingDTO;
import com.skillplatform.model.Skill;
import com.skillplatform.model.SkillRating;
import com.skillplatform.repository.SkillRatingRepository;
import com.skillplatform.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RatingService {

    private final SkillRatingRepository ratingRepository;
    private final SkillRepository skillRepository;
    private final PointService pointService;

    @Cacheable(value = CacheConfig.CACHE_RATING, key = "{#skillId, #userId}")
    public RatingDTO getRating(Long skillId, Long userId) {
        Double avg   = ratingRepository.avgRatingBySkillId(skillId);
        long   count = ratingRepository.countBySkillId(skillId);
        Integer my   = userId == null ? null
                : ratingRepository.findByUserIdAndSkillId(userId, skillId)
                        .map(SkillRating::getRating).orElse(null);
        return new RatingDTO(skillId, avg == null ? 0.0 : avg, count, my);
    }

    @Transactional
    @CacheEvict(value = CacheConfig.CACHE_RATING, allEntries = true)
    public RatingDTO rate(Long skillId, Long userId, int stars) {
        if (stars < 1 || stars > 5) {
            throw new IllegalArgumentException("Rating must be 1 ~ 5");
        }
        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new RuntimeException("Skill not found: " + skillId));

        Optional<SkillRating> existing = ratingRepository.findByUserIdAndSkillId(userId, skillId);
        boolean isNew = existing.isEmpty();

        SkillRating rating = existing.orElse(SkillRating.builder().userId(userId).skillId(skillId).build());
        rating.setRating(stars);
        ratingRepository.save(rating);

        // 仅首次评分发放积分奖励，防止刷分
        if (isNew) {
            try {
                pointService.rewardRatingPoints(userId, skillId, skill.getName());
            } catch (Exception ignored) {
                // 奖励失败不影响主流程
            }
        }

        Double avg   = ratingRepository.avgRatingBySkillId(skillId);
        long   count = ratingRepository.countBySkillId(skillId);
        return new RatingDTO(skillId, avg == null ? 0.0 : avg, count, stars);
    }
}
