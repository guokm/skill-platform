package com.skillplatform.repository;

import com.skillplatform.model.PointTransaction;
import com.skillplatform.model.PointTransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PointTransactionRepository extends JpaRepository<PointTransaction, Long> {
    List<PointTransaction> findTop10ByUserIdOrderByCreatedAtDesc(Long userId);

    /** 统计某用户因技能分成获得的总积分 */
    @Query("SELECT COALESCE(SUM(t.deltaPoints), 0) FROM PointTransaction t WHERE t.userId = :userId AND t.type = :type")
    long sumDeltaPointsByUserIdAndType(@Param("userId") Long userId, @Param("type") PointTransactionType type);

    /** 统计某技能的下载收益总额 */
    @Query("SELECT COALESCE(SUM(t.deltaPoints), 0) FROM PointTransaction t WHERE t.skillId = :skillId AND t.type = :type")
    long sumDeltaPointsBySkillIdAndType(@Param("skillId") Long skillId, @Param("type") PointTransactionType type);
}
