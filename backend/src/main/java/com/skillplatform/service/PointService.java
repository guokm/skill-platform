package com.skillplatform.service;

import com.skillplatform.dto.PointSummaryDTO;
import com.skillplatform.dto.PointTransactionDTO;
import com.skillplatform.dto.PurchasedSkillDTO;
import com.skillplatform.dto.CheckInResultDTO;
import com.skillplatform.dto.SkillDTO;
import com.skillplatform.dto.SkillPurchaseStatusDTO;
import com.skillplatform.exception.BusinessException;
import com.skillplatform.model.PointTransaction;
import com.skillplatform.model.PointTransactionType;
import com.skillplatform.model.Skill;
import com.skillplatform.model.User;
import com.skillplatform.model.UserSkillPurchase;
import com.skillplatform.repository.PointTransactionRepository;
import com.skillplatform.repository.SkillRepository;
import com.skillplatform.repository.UserRepository;
import com.skillplatform.repository.UserSkillPurchaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PointService {

    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final UserSkillPurchaseRepository purchaseRepository;
    private final PointTransactionRepository pointTransactionRepository;
    private final UserLevelService userLevelService;

    @Value("${app.points.initial-balance:100}")
    private int initialBalance;

    @Value("${app.points.daily-check-in-reward:5}")
    private int dailyCheckInReward;

    @Value("${app.points.skill-submission-reward:200}")
    private int skillSubmissionReward;

    @Value("${app.points.author-share-ratio:0.7}")
    private double authorShareRatio;

    @Value("${app.points.streak-7day-bonus:30}")
    private int streak7DayBonus;

    @Value("${app.points.streak-30day-bonus:200}")
    private int streak30DayBonus;

    @Value("${app.points.rating-reward:2}")
    private int ratingReward;

    @Transactional
    public void grantInitialPoints(User user) {
        int safeInitialBalance = Math.max(0, initialBalance);
        if (safeInitialBalance <= 0) {
            return;
        }
        pointTransactionRepository.save(PointTransaction.builder()
                .userId(user.getId())
                .type(PointTransactionType.WELCOME_BONUS)
                .deltaPoints(safeInitialBalance)
                .balanceAfter(safeInitialBalance)
                .note("首次登录赠送积分")
                .build());
    }

    @Transactional
    public void ensureDownloadAccess(Long userId, Skill skill) {
        if (userId == null || userId <= 0) {
            return;
        }

        User user = userRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        initializeLegacyBalance(user);

        if (purchaseRepository.existsByUserIdAndSkillId(userId, skill.getId())) {
            return;
        }

        int pricePoints = normalizePrice(skill.getPricePoints());
        int currentBalance = normalizeBalance(user.getPointsBalance());
        if (currentBalance < pricePoints) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST,
                    "INSUFFICIENT_POINTS",
                    "积分不足，当前剩余 " + currentBalance + " 积分，下载需要 " + pricePoints + " 积分"
            );
        }

        int nextBalance = currentBalance - pricePoints;
        user.setPointsBalance(nextBalance);
        user.setTotalPointsSpent(normalizeBalance(user.getTotalPointsSpent()) + pricePoints);
        userRepository.save(user);

        purchaseRepository.save(UserSkillPurchase.builder()
                .userId(userId)
                .skillId(skill.getId())
                .pricePoints(pricePoints)
                .build());

        pointTransactionRepository.save(PointTransaction.builder()
                .userId(userId)
                .skillId(skill.getId())
                .type(PointTransactionType.DOWNLOAD_PURCHASE)
                .deltaPoints(-pricePoints)
                .balanceAfter(nextBalance)
                .note("下载技能包：" + skill.getName())
                .build());

        // ── 作者分成：将 70% 积分划转给技能提交者 ──────────────────────
        creditAuthorRevenue(skill, pricePoints);
    }

    /**
     * 将下载积分的 authorShareRatio（默认 70%）划转给技能提交者。
     * 仅当 pricePoints > 0 且能找到对应的 Linux.do 用户时生效。
     */
    private void creditAuthorRevenue(Skill skill, int pricePoints) {
        if (pricePoints <= 0) return;
        String submitterLinuxDoId = skill.getSubmitterLinuxDoId();
        if (submitterLinuxDoId == null || submitterLinuxDoId.isBlank()) return;

        int authorReward = (int) Math.max(1, Math.floor(pricePoints * authorShareRatio));
        userRepository.findByLinuxDoId(submitterLinuxDoId.trim())
                .flatMap(author -> userRepository.findByIdForUpdate(author.getId()))
                .ifPresent(author -> {
                    initializeLegacyBalance(author);
                    int authorNextBalance = normalizeBalance(author.getPointsBalance()) + authorReward;
                    author.setPointsBalance(authorNextBalance);
                    userRepository.save(author);
                    pointTransactionRepository.save(PointTransaction.builder()
                            .userId(author.getId())
                            .skillId(skill.getId())
                            .type(PointTransactionType.AUTHOR_REVENUE_SHARE)
                            .deltaPoints(authorReward)
                            .balanceAfter(authorNextBalance)
                            .note("技能下载分成：" + skill.getName() + "（" + (int)(authorShareRatio * 100) + "%）")
                            .build());
                });
    }

    @Transactional(readOnly = true)
    public PointSummaryDTO getPointSummary(Long userId) {
        if (userId != null && userId == -1L) {
            PointSummaryDTO summary = new PointSummaryDTO();
            summary.setPointsBalance(999999);
            summary.setTotalPointsSpent(0);
            summary.setPurchasedSkillCount(0L);
            summary.setCheckedInToday(true);
            summary.setCheckInStreakDays(999);
            summary.setTotalCheckInCount(999);
            summary.setLevelProfile(userLevelService.getLevelProfile(-1L));
            summary.setRecentTransactions(java.util.List.of());
            return summary;
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        PointSummaryDTO summary = new PointSummaryDTO();
        summary.setPointsBalance(normalizeBalance(user.getPointsBalance()));
        summary.setTotalPointsSpent(normalizeBalance(user.getTotalPointsSpent()));
        summary.setPurchasedSkillCount(purchaseRepository.countByUserId(userId));
        summary.setLastCheckInDate(user.getLastCheckInDate());
        summary.setCheckedInToday(isCheckedInToday(user));
        summary.setCheckInStreakDays(normalizeBalance(user.getCheckInStreakDays()));
        summary.setTotalCheckInCount(normalizeBalance(user.getTotalCheckInCount()));
        summary.setLevelProfile(userLevelService.buildLevelProfile(user));
        summary.setRecentTransactions(pointTransactionRepository.findTop10ByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(PointTransactionDTO::from)
                .toList());
        return summary;
    }

    @Transactional
    public CheckInResultDTO checkIn(Long userId) {
        if (userId != null && userId == -1L) {
            CheckInResultDTO dto = new CheckInResultDTO();
            dto.setRewardPoints(0);
            dto.setPointsBalance(999999);
            dto.setCheckInStreakDays(999);
            dto.setTotalCheckInCount(999);
            dto.setCheckedInToday(true);
            dto.setLastCheckInDate(LocalDate.now());
            dto.setMessage("管理员账号无需签到");
            return dto;
        }

        User user = userRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        initializeLegacyBalance(user);

        LocalDate today = LocalDate.now();
        if (today.equals(user.getLastCheckInDate())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "ALREADY_CHECKED_IN", "今天已经签到过了");
        }

        int baseReward = Math.max(0, dailyCheckInReward);
        int nextStreak = user.getLastCheckInDate() != null && user.getLastCheckInDate().plusDays(1).equals(today)
                ? normalizeBalance(user.getCheckInStreakDays()) + 1
                : 1;

        // ── 连签里程碑奖励 ──────────────────────────────────────────────
        int streakBonus = 0;
        String streakMessage = null;
        if (nextStreak % 30 == 0) {
            streakBonus = Math.max(0, streak30DayBonus);
            streakMessage = "连续签到 " + nextStreak + " 天，获得月度连签奖励 " + streakBonus + " 积分！";
        } else if (nextStreak % 7 == 0) {
            streakBonus = Math.max(0, streak7DayBonus);
            streakMessage = "连续签到 " + nextStreak + " 天，获得周连签奖励 " + streakBonus + " 积分！";
        }
        int rewardPoints = baseReward + streakBonus;

        int nextBalance = normalizeBalance(user.getPointsBalance()) + rewardPoints;
        user.setPointsBalance(nextBalance);
        user.setLastCheckInDate(today);
        user.setCheckInStreakDays(nextStreak);
        user.setTotalCheckInCount(normalizeBalance(user.getTotalCheckInCount()) + 1);
        userRepository.save(user);

        String note = streakMessage != null
                ? "每日签到 + 连签奖励（" + nextStreak + " 天）"
                : "每日签到奖励";
        pointTransactionRepository.save(PointTransaction.builder()
                .userId(userId)
                .type(PointTransactionType.DAILY_CHECK_IN)
                .deltaPoints(rewardPoints)
                .balanceAfter(nextBalance)
                .note(note)
                .build());

        String message = streakMessage != null
                ? streakMessage
                : "签到成功，获得 " + baseReward + " 积分";
        CheckInResultDTO dto = new CheckInResultDTO();
        dto.setRewardPoints(rewardPoints);
        dto.setPointsBalance(nextBalance);
        dto.setCheckInStreakDays(nextStreak);
        dto.setTotalCheckInCount(normalizeBalance(user.getTotalCheckInCount()));
        dto.setCheckedInToday(true);
        dto.setLastCheckInDate(today);
        dto.setMessage(message);
        return dto;
    }

    @Transactional(readOnly = true)
    public List<PurchasedSkillDTO> getPurchasedSkills(Long userId) {
        if (userId != null && userId == -1L) {
            return List.of();
        }

        List<UserSkillPurchase> purchases = purchaseRepository.findByUserIdOrderByCreatedAtDesc(userId);
        if (purchases.isEmpty()) {
            return List.of();
        }

        Map<Long, SkillDTO> skillsById = new LinkedHashMap<>();
        skillRepository.findAllById(purchases.stream().map(UserSkillPurchase::getSkillId).toList())
                .forEach(skill -> skillsById.put(skill.getId(), SkillDTO.from(skill)));

        return purchases.stream()
                .map(purchase -> PurchasedSkillDTO.from(purchase, skillsById.get(purchase.getSkillId())))
                .filter(dto -> dto.getSkill() != null)
                .toList();
    }

    @Transactional(readOnly = true)
    public SkillPurchaseStatusDTO getPurchaseStatus(Long userId, Long skillId) {
        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new RuntimeException("Skill not found: " + skillId));

        SkillPurchaseStatusDTO dto = new SkillPurchaseStatusDTO();
        dto.setSkillId(skillId);
        dto.setPricePoints(normalizePrice(skill.getPricePoints()));

        if (userId != null && userId == -1L) {
            dto.setPurchased(true);
            dto.setCanAfford(true);
            dto.setPointsBalance(999999);
            return dto;
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        int balance = normalizeBalance(user.getPointsBalance());
        dto.setPointsBalance(balance);
        dto.setPurchased(purchaseRepository.existsByUserIdAndSkillId(userId, skillId));
        dto.setCanAfford(balance >= dto.getPricePoints());
        return dto;
    }

    @Transactional
    public PointSummaryDTO adjustPoints(Long userId, int deltaPoints, String note) {
        User user = userRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        initializeLegacyBalance(user);

        int nextBalance = normalizeBalance(user.getPointsBalance()) + deltaPoints;
        if (nextBalance < 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "NEGATIVE_POINTS", "扣减后积分不能小于 0");
        }

        user.setPointsBalance(nextBalance);
        userRepository.save(user);

        pointTransactionRepository.save(PointTransaction.builder()
                .userId(userId)
                .type(PointTransactionType.ADMIN_ADJUSTMENT)
                .deltaPoints(deltaPoints)
                .balanceAfter(nextBalance)
                .note(note == null || note.isBlank() ? "管理员调整积分" : note.trim())
                .build());

        return getPointSummary(userId);
    }

    /**
     * 用户评分技能后，发放评分奖励积分（默认 2 积分，每次评分触发一次，不重复）。
     * 由 RatingService 在新增评分时调用。
     */
    @Transactional
    public void rewardRatingPoints(Long userId, Long skillId, String skillName) {
        if (userId == null || userId <= 0 || userId == -1L) return;
        int reward = Math.max(0, ratingReward);
        if (reward == 0) return;

        User user = userRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        initializeLegacyBalance(user);

        int nextBalance = normalizeBalance(user.getPointsBalance()) + reward;
        user.setPointsBalance(nextBalance);
        userRepository.save(user);

        pointTransactionRepository.save(PointTransaction.builder()
                .userId(userId)
                .skillId(skillId)
                .type(PointTransactionType.RATING_REWARD)
                .deltaPoints(reward)
                .balanceAfter(nextBalance)
                .note("评分奖励：" + (skillName != null ? skillName : "技能 #" + skillId))
                .build());
    }

    @Transactional
    public void rewardSkillSubmissionIfEligible(Skill skill) {
        if (skill == null || skill.getId() == null) {
            return;
        }

        String submitterLinuxDoId = skill.getSubmitterLinuxDoId();
        if (submitterLinuxDoId == null || submitterLinuxDoId.isBlank()) {
            return;
        }
        if (Boolean.TRUE.equals(skill.getSubmissionRewardGranted())) {
            return;
        }

        userRepository.findByLinuxDoId(submitterLinuxDoId.trim())
                .flatMap(user -> userRepository.findByIdForUpdate(user.getId()))
                .ifPresent(user -> {
                    initializeLegacyBalance(user);

                    int rewardPoints = Math.max(0, skillSubmissionReward);
                    int nextBalance = normalizeBalance(user.getPointsBalance()) + rewardPoints;
                    user.setPointsBalance(nextBalance);
                    userRepository.save(user);

                    pointTransactionRepository.save(PointTransaction.builder()
                            .userId(user.getId())
                            .skillId(skill.getId())
                            .type(PointTransactionType.SKILL_SUBMISSION_REWARD)
                            .deltaPoints(rewardPoints)
                            .balanceAfter(nextBalance)
                            .note("技能上架奖励：" + skill.getName())
                            .build());

                    skill.setSubmissionRewardGranted(true);
                    skill.setSubmissionRewardGrantedAt(LocalDateTime.now());
                    skillRepository.save(skill);
                });
    }

    public int normalizePrice(Integer pricePoints) {
        return Math.max(0, pricePoints == null ? 1 : pricePoints);
    }

    private int normalizeBalance(Integer value) {
        return value == null ? 0 : Math.max(0, value);
    }

    private boolean isCheckedInToday(User user) {
        return user != null && user.getLastCheckInDate() != null && user.getLastCheckInDate().equals(LocalDate.now());
    }

    private void initializeLegacyBalance(User user) {
        boolean changed = false;
        if (user.getPointsBalance() == null) {
            user.setPointsBalance(Math.max(0, initialBalance));
            changed = true;
        }
        if (user.getTotalPointsSpent() == null) {
            user.setTotalPointsSpent(0);
            changed = true;
        }
        if (user.getCheckInStreakDays() == null) {
            user.setCheckInStreakDays(0);
            changed = true;
        }
        if (user.getTotalCheckInCount() == null) {
            user.setTotalCheckInCount(0);
            changed = true;
        }
        if (changed) {
            userRepository.save(user);
        }
    }
}
