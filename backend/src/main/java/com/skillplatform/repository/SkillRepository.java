package com.skillplatform.repository;

import com.skillplatform.model.Skill;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface SkillRepository extends JpaRepository<Skill, Long>, JpaSpecificationExecutor<Skill> {

    Optional<Skill> findBySlug(String slug);

    Page<Skill> findByCategoryId(Long categoryId, Pageable pageable);

    Page<Skill> findByCategorySlug(String categorySlug, Pageable pageable);

    @Query("""
        SELECT s FROM Skill s
        WHERE LOWER(s.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
           OR LOWER(s.description) LIKE LOWER(CONCAT('%', :keyword, '%'))
           OR LOWER(s.shortDescription) LIKE LOWER(CONCAT('%', :keyword, '%'))
        """)
    Page<Skill> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    List<Skill> findTop10ByOrderByClickCountDesc();

    List<Skill> findTop10ByOrderByDownloadCountDesc();

    List<Skill> findTop6ByFeaturedTrueOrderByClickCountDesc();

    List<Skill> findTop8ByOrderByCreatedAtDesc();

    @Modifying
    @Transactional
    @Query("UPDATE Skill s SET s.clickCount = s.clickCount + 1 WHERE s.id = :id")
    void incrementClickCount(@Param("id") Long id);

    @Modifying
    @Transactional
    @Query("UPDATE Skill s SET s.downloadCount = s.downloadCount + 1 WHERE s.id = :id")
    void incrementDownloadCount(@Param("id") Long id);

    @Query("SELECT COUNT(s) FROM Skill s WHERE s.category.id = :categoryId")
    long countByCategoryId(@Param("categoryId") Long categoryId);

    @Query("SELECT COALESCE(SUM(s.clickCount), 0) FROM Skill s")
    long sumClickCount();

    @Query("SELECT COALESCE(SUM(s.downloadCount), 0) FROM Skill s")
    long sumDownloadCount();

    boolean existsBySlug(String slug);

    long countByFeaturedTrue();

    long countByVerifiedTrue();

    @Query("""
        SELECT s FROM Skill s
        WHERE s.category.id = :categoryId
          AND s.slug <> :excludeSlug
        ORDER BY s.clickCount DESC
        """)
    List<Skill> findRelatedByCategory(
            @Param("categoryId") Long categoryId,
            @Param("excludeSlug") String excludeSlug,
            Pageable pageable);
}
