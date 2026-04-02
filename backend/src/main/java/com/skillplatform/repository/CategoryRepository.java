package com.skillplatform.repository;

import com.skillplatform.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    Optional<Category> findBySlug(String slug);

    List<Category> findAllByOrderBySortOrderAsc();

    @Query("SELECT c FROM Category c LEFT JOIN c.skills s GROUP BY c ORDER BY COUNT(s) DESC")
    List<Category> findAllOrderBySkillCountDesc();
}
