package com.skillplatform.repository;

import com.skillplatform.model.SkillRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SkillRatingRepository extends JpaRepository<SkillRating, Long> {

    Optional<SkillRating> findByUserIdAndSkillId(Long userId, Long skillId);

    long countBySkillId(Long skillId);

    @Query("SELECT COALESCE(AVG(r.rating * 1.0), 0.0) FROM SkillRating r WHERE r.skillId = :skillId")
    Double avgRatingBySkillId(@Param("skillId") Long skillId);
}
