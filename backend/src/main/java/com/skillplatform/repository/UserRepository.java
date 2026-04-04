package com.skillplatform.repository;

import com.skillplatform.model.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByLinuxDoId(String linuxDoId);

    Optional<User> findByUsername(String username);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.id = :id")
    Optional<User> findByIdForUpdate(Long id);

    @Query("SELECT COALESCE(SUM(u.pointsBalance), 0) FROM User u")
    long sumPointsBalance();

    @Query("SELECT COALESCE(SUM(u.totalPointsSpent), 0) FROM User u")
    long sumTotalPointsSpent();

    @Query("SELECT u FROM User u ORDER BY u.pointsBalance DESC")
    java.util.List<User> findTopByPointsBalance(org.springframework.data.domain.Pageable pageable);

    @Query("SELECT u FROM User u ORDER BY u.totalPointsSpent DESC")
    java.util.List<User> findTopByPointsSpent(org.springframework.data.domain.Pageable pageable);

    @Query("SELECT u FROM User u ORDER BY u.checkInStreakDays DESC")
    java.util.List<User> findTopByCheckInStreak(org.springframework.data.domain.Pageable pageable);
}
