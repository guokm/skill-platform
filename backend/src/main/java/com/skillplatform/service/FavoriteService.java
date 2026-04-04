package com.skillplatform.service;

import com.skillplatform.dto.SkillDTO;
import com.skillplatform.model.UserFavorite;
import com.skillplatform.repository.SkillRepository;
import com.skillplatform.repository.UserFavoriteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final UserFavoriteRepository favoriteRepository;
    private final SkillRepository skillRepository;

    /** 返回用户是否已收藏某技能 */
    public boolean isFavorited(Long userId, Long skillId) {
        return favoriteRepository.existsByUserIdAndSkillId(userId, skillId);
    }

    /** 切换收藏状态，返回当前状态 */
    @Transactional
    public Map<String, Object> toggleFavorite(Long userId, Long skillId) {
        if (!skillRepository.existsById(skillId)) {
            throw new RuntimeException("Skill not found: " + skillId);
        }
        boolean wasFavorited = favoriteRepository.existsByUserIdAndSkillId(userId, skillId);
        if (wasFavorited) {
            favoriteRepository.deleteByUserIdAndSkillId(userId, skillId);
        } else {
            favoriteRepository.save(UserFavorite.builder()
                    .userId(userId)
                    .skillId(skillId)
                    .build());
        }
        long total = favoriteRepository.countBySkillId(skillId);
        return Map.of(
                "skillId",    skillId,
                "favorited",  !wasFavorited,
                "totalFavorites", total
        );
    }

    /** 获取用户所有收藏的技能列表 */
    public List<SkillDTO> getUserFavorites(Long userId) {
        List<Long> skillIds = favoriteRepository
                .findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(UserFavorite::getSkillId)
                .toList();

        return skillIds.isEmpty()
                ? List.of()
                : skillRepository.findAllById(skillIds).stream()
                        .map(SkillDTO::from)
                        .toList();
    }

    /** 收藏总数 */
    public long getFavoriteCount(Long skillId) {
        return favoriteRepository.countBySkillId(skillId);
    }
}
