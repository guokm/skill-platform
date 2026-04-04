package com.skillplatform.service;

import com.skillplatform.config.CacheConfig;
import com.skillplatform.dto.PagedResponse;
import com.skillplatform.dto.SkillDTO;
import com.skillplatform.model.Skill;
import com.skillplatform.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import jakarta.persistence.criteria.Predicate;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
@RequiredArgsConstructor
@Slf4j
public class SkillService {

    public record DownloadPayload(String filename, byte[] content) {
    }

    private final SkillRepository skillRepository;
    private final CategoryService categoryService;
    private final PointService pointService;

    public PagedResponse<SkillDTO> getSkills(
            Long categoryId,
            String categorySlug,
            String keyword,
            int page,
            int size,
            String sortBy
    ) {
        Sort sort = switch (sortBy) {
            case "downloads" -> Sort.by(Sort.Direction.DESC, "downloadCount")
                    .and(Sort.by(Sort.Direction.DESC, "clickCount"));
            case "newest" -> Sort.by(Sort.Direction.DESC, "createdAt");
            case "updated" -> Sort.by(Sort.Direction.DESC, "updatedAt");
            default -> Sort.by(Sort.Direction.DESC, "clickCount")
                    .and(Sort.by(Sort.Direction.DESC, "downloadCount"));
        };

        Pageable pageable = PageRequest.of(page, size, sort);
        var skillPage = skillRepository.findAll(
                buildSpecification(categoryId, normalizeParam(categorySlug), normalizeParam(keyword)),
                pageable
        );
        return PagedResponse.from(skillPage.map(SkillDTO::from));
    }

    public SkillDTO getSkillBySlug(String slug) {
        return SkillDTO.from(getSkillEntityBySlug(slug));
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = CacheConfig.CACHE_TRENDING,  allEntries = true),
        @CacheEvict(value = CacheConfig.CACHE_STATS,     allEntries = true),
    })
    public void recordClick(Long skillId) {
        ensureSkillExists(skillId);
        skillRepository.incrementClickCount(skillId);
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = CacheConfig.CACHE_MOST_DOWNLOADED, allEntries = true),
        @CacheEvict(value = CacheConfig.CACHE_STATS,           allEntries = true),
    })
    public void recordDownload(Long skillId) {
        ensureSkillExists(skillId);
        skillRepository.incrementDownloadCount(skillId);
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = CacheConfig.CACHE_MOST_DOWNLOADED, allEntries = true),
        @CacheEvict(value = CacheConfig.CACHE_STATS, allEntries = true),
    })
    public DownloadPayload prepareDownload(Long skillId, Long userId) {
        Skill skill = getSkillEntity(skillId);
        pointService.ensureDownloadAccess(userId, skill);
        recordDownload(skillId);

        if (skill.getSourcePath() != null && !skill.getSourcePath().isBlank()) {
            try {
                Path sourceFile = Path.of(skill.getSourcePath());
                if (Files.exists(sourceFile) && sourceFile.getParent() != null) {
                    return new DownloadPayload(
                            skill.getSlug() + ".zip",
                            zipSkillDirectory(sourceFile.getParent())
                    );
                }
            } catch (IOException ex) {
                log.warn("Falling back to generated package because source directory is unavailable: {}", skill.getSourcePath());
            }
        }

        return new DownloadPayload(
                skill.getSlug() + ".zip",
                buildFallbackZip(skill)
        );
    }

    @Cacheable(CacheConfig.CACHE_TRENDING)
    public List<SkillDTO> getTrendingSkills() {
        return skillRepository.findTop10ByOrderByClickCountDesc()
                .stream()
                .map(SkillDTO::from)
                .toList();
    }

    @Cacheable(CacheConfig.CACHE_MOST_DOWNLOADED)
    public List<SkillDTO> getMostDownloaded() {
        return skillRepository.findTop10ByOrderByDownloadCountDesc()
                .stream()
                .map(SkillDTO::from)
                .toList();
    }

    @Cacheable(CacheConfig.CACHE_FEATURED)
    public List<SkillDTO> getFeaturedSkills() {
        return skillRepository.findTop6ByFeaturedTrueOrderByClickCountDesc()
                .stream()
                .map(SkillDTO::from)
                .toList();
    }

    @Cacheable(CacheConfig.CACHE_LATEST)
    public List<SkillDTO> getLatestSkills() {
        return skillRepository.findTop8ByOrderByCreatedAtDesc()
                .stream()
                .map(SkillDTO::from)
                .toList();
    }

    public List<SkillDTO> getRelatedSkills(String slug, int limit) {
        Skill skill = getSkillEntityBySlug(slug);
        if (skill.getCategory() == null) {
            return List.of();
        }
        int safeLimit = Math.max(1, Math.min(limit, 12));
        return skillRepository.findRelatedByCategory(
                skill.getCategory().getId(),
                slug,
                PageRequest.of(0, safeLimit)
        ).stream().map(SkillDTO::from).toList();
    }

    @Cacheable(CacheConfig.CACHE_STATS)
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalSkills", skillRepository.count());
        stats.put("totalCategories", categoryService.getAllCategories().size());
        stats.put("totalClicks", skillRepository.sumClickCount());
        stats.put("totalDownloads", skillRepository.sumDownloadCount());
        stats.put("timestamp", LocalDateTime.now());
        return stats;
    }

    /** 管理员操作后清除所有列表缓存，保证首页数据一致 */
    @Caching(evict = {
        @CacheEvict(value = CacheConfig.CACHE_TRENDING,        allEntries = true),
        @CacheEvict(value = CacheConfig.CACHE_MOST_DOWNLOADED, allEntries = true),
        @CacheEvict(value = CacheConfig.CACHE_FEATURED,        allEntries = true),
        @CacheEvict(value = CacheConfig.CACHE_LATEST,          allEntries = true),
        @CacheEvict(value = CacheConfig.CACHE_STATS,           allEntries = true),
        @CacheEvict(value = CacheConfig.CACHE_RATING,          allEntries = true),
    })
    public void evictAllCaches() {
        log.info("All skill caches evicted");
    }

    private Skill getSkillEntity(Long skillId) {
        return skillRepository.findById(skillId)
                .orElseThrow(() -> new RuntimeException("Skill not found: " + skillId));
    }

    private Skill getSkillEntityBySlug(String slug) {
        return skillRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Skill not found: " + slug));
    }

    private void ensureSkillExists(Long skillId) {
        if (!skillRepository.existsById(skillId)) {
            throw new RuntimeException("Skill not found: " + skillId);
        }
    }

    private String buildMarkdownFallback(Skill skill) {
        StringBuilder builder = new StringBuilder();
        builder.append("---\n");
        builder.append("name: ").append(skill.getName()).append('\n');
        if (skill.getDescription() != null && !skill.getDescription().isBlank()) {
            builder.append("description: \"").append(skill.getDescription().replace("\"", "\\\"")).append("\"\n");
        }
        if (skill.getLicense() != null && !skill.getLicense().isBlank()) {
            builder.append("license: ").append(skill.getLicense()).append('\n');
        }
        if (skill.getAuthor() != null && !skill.getAuthor().isBlank()) {
            builder.append("author: ").append(skill.getAuthor()).append('\n');
        }
        builder.append("pricePoints: ").append(pointService.normalizePrice(skill.getPricePoints())).append('\n');
        builder.append("---\n\n");
        if (skill.getReadmeContent() != null && !skill.getReadmeContent().isBlank()) {
            builder.append(skill.getReadmeContent());
        } else if (skill.getShortDescription() != null) {
            builder.append("# ").append(skill.getName()).append("\n\n");
            builder.append(skill.getShortDescription()).append('\n');
        }
        return builder.toString();
    }

    private String normalizeParam(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private Specification<Skill> buildSpecification(Long categoryId, String categorySlug, String keyword) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (categoryId != null) {
                predicates.add(criteriaBuilder.equal(root.get("category").get("id"), categoryId));
            }

            if (categorySlug != null) {
                predicates.add(criteriaBuilder.equal(root.get("category").get("slug"), categorySlug));
            }

            if (keyword != null) {
                String pattern = "%" + keyword.toLowerCase() + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("description")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("shortDescription")), pattern)
                ));
            }

            return predicates.isEmpty()
                    ? criteriaBuilder.conjunction()
                    : criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private byte[] zipSkillDirectory(Path skillDirectory) throws IOException {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
             ZipOutputStream zipOutputStream = new ZipOutputStream(outputStream, StandardCharsets.UTF_8)) {

            String rootFolderName = skillDirectory.getFileName().toString();

            Files.walk(skillDirectory)
                    .filter(Files::isRegularFile)
                    .forEach(file -> writeZipEntry(zipOutputStream, file, skillDirectory, rootFolderName));

            zipOutputStream.finish();
            return outputStream.toByteArray();
        }
    }

    private byte[] buildFallbackZip(Skill skill) {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
             ZipOutputStream zipOutputStream = new ZipOutputStream(outputStream, StandardCharsets.UTF_8)) {

            ZipEntry entry = new ZipEntry(skill.getSlug() + "/SKILL.md");
            zipOutputStream.putNextEntry(entry);
            zipOutputStream.write(buildMarkdownFallback(skill).getBytes(StandardCharsets.UTF_8));
            zipOutputStream.closeEntry();
            zipOutputStream.finish();
            return outputStream.toByteArray();
        } catch (IOException ex) {
            throw new RuntimeException("Failed to build fallback skill package", ex);
        }
    }

    private void writeZipEntry(ZipOutputStream zipOutputStream, Path file, Path rootDirectory, String rootFolderName) {
        String relativePath = rootDirectory.relativize(file).toString().replace('\\', '/');
        String entryName = rootFolderName + "/" + relativePath;

        try (InputStream inputStream = Files.newInputStream(file)) {
            zipOutputStream.putNextEntry(new ZipEntry(entryName));
            inputStream.transferTo(zipOutputStream);
            zipOutputStream.closeEntry();
        } catch (IOException ex) {
            throw new RuntimeException("Failed to add file to skill package: " + file, ex);
        }
    }
}
