package com.skillplatform.repository;

import com.skillplatform.model.UserFavorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserFavoriteRepository extends JpaRepository<UserFavorite, Long> {

    boolean existsByUserIdAndSkillId(Long userId, Long skillId);

    Optional<UserFavorite> findByUserIdAndSkillId(Long userId, Long skillId);

    List<UserFavorite> findByUserIdOrderByCreatedAtDesc(Long userId);

    long countBySkillId(Long skillId);

    void deleteByUserIdAndSkillId(Long userId, Long skillId);
}
