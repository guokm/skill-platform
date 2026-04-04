package com.skillplatform.repository;

import com.skillplatform.model.UserSkillPurchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserSkillPurchaseRepository extends JpaRepository<UserSkillPurchase, Long> {
    boolean existsByUserIdAndSkillId(Long userId, Long skillId);

    long countByUserId(Long userId);

    long countBySkillId(Long skillId);

    List<UserSkillPurchase> findByUserIdOrderByCreatedAtDesc(Long userId);
}
