package com.skillplatform.service;

import com.skillplatform.model.Category;
import com.skillplatform.model.Skill;
import com.skillplatform.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.yaml.snakeyaml.Yaml;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Slf4j
public class SkillCrawlerService {

    private static final Pattern FRONTMATTER_PATTERN = Pattern.compile("^---\\s*\\n(.*?)\\n---\\s*", Pattern.DOTALL);

    private static final List<String> TAG_HINTS = List.of(
            "react", "vue", "next", "tailwind", "spring", "java", "api", "agent",
            "automation", "workflow", "prompt", "sql", "excel", "dashboard", "marketing",
            "seo", "content", "finance", "legal", "course", "design", "document", "pdf", "ppt"
    );

    private final SkillRepository skillRepository;
    private final CategoryService categoryService;

    @Value("${skill.crawler.scan-path:/skills}")
    private String scanPath;

    @Value("${skill.crawler.scan-paths:}")
    private String scanPaths;

    @Value("${skill.crawler.run-on-startup:true}")
    private boolean runOnStartup;

    public Map<String, Object> crawl() {
        categoryService.ensureDefaultCategories();

        List<Path> roots = resolveScanRoots();
        if (roots.isEmpty()) {
            log.warn("No valid scan roots resolved from scan-path={} scan-paths={}", scanPath, scanPaths);
            return result(0, 0, 0, 0, List.of());
        }

        int scanned = 0;
        int created = 0;
        int updated = 0;
        int skipped = 0;

        for (Path root : roots) {
            try (Stream<Path> pathStream = Files.walk(root)) {
                List<Path> skillFiles = pathStream
                        .filter(Files::isRegularFile)
                        .filter(path -> "SKILL.md".equalsIgnoreCase(path.getFileName().toString()))
                        .sorted()
                        .toList();

                for (Path skillFile : skillFiles) {
                    scanned++;
                    try {
                        boolean wasCreated = upsertSkill(root, skillFile);
                        if (wasCreated) {
                            created++;
                        } else {
                            updated++;
                        }
                    } catch (Exception ex) {
                        skipped++;
                        log.error("Failed to ingest skill file {}", skillFile, ex);
                    }
                }
            } catch (IOException ex) {
                skipped++;
                log.error("Failed to walk scan root {}", root, ex);
            }
        }

        log.info("Skill crawl finished. scanned={}, created={}, updated={}, skipped={}", scanned, created, updated, skipped);
        return result(scanned, created, updated, skipped, roots.stream().map(Path::toString).toList());
    }

    @EventListener(ApplicationReadyEvent.class)
    public void crawlOnStartup() {
        if (!runOnStartup) {
            log.info("Startup crawl disabled by configuration.");
            return;
        }
        log.info("Running startup skill crawl...");
        crawl();
    }

    @Scheduled(cron = "${skill.crawler.cron:0 0 */6 * * *}")
    public void scheduledCrawl() {
        log.info("Running scheduled skill crawl...");
        crawl();
    }

    private boolean upsertSkill(Path root, Path skillFile) throws IOException {
        String rawContent = Files.readString(skillFile);
        Map<String, Object> frontmatter = parseFrontmatter(rawContent);
        String readmeContent = stripFrontmatter(rawContent);

        String relativeFolder = Optional.ofNullable(root.relativize(skillFile.getParent()))
                .map(Path::toString)
                .orElse(skillFile.getParent().getFileName().toString());

        String name = firstNonBlank(
                stringValue(frontmatter, "name"),
                skillFile.getParent().getFileName().toString()
        );
        String slug = firstNonBlank(
                slugify(stringValue(frontmatter, "slug")),
                slugify(name),
                slugify(relativeFolder)
        );

        List<String> tags = resolveTags(frontmatter, name, readmeContent, relativeFolder);
        String description = firstNonBlank(
                stringValue(frontmatter, "description"),
                extractSummary(readmeContent),
                name + " skill"
        );
        String shortDescription = truncate(firstNonBlank(
                stringValue(frontmatter, "summary"),
                description
        ), 180);

        Category category = categoryService.resolveCategory(
                firstNonBlank(
                        stringValue(frontmatter, "category"),
                        stringValue(frontmatter, "industry"),
                        stringValue(frontmatter, "vertical")
                ),
                tags,
                name,
                description,
                readmeContent,
                relativeFolder
        );

        Skill skill = skillRepository.findBySlug(slug).orElseGet(Skill::new);
        boolean isNew = skill.getId() == null;

        skill.setSlug(slug);
        skill.setName(name);
        skill.setDescription(description);
        skill.setShortDescription(shortDescription);
        skill.setReadmeContent(readmeContent);
        skill.setCategory(category);
        skill.setAuthor(firstNonBlank(stringValue(frontmatter, "author"), stringValue(frontmatter, "owner")));
        skill.setVersion(firstNonBlank(stringValue(frontmatter, "version"), "1.0.0"));
        skill.setLicense(firstNonBlank(stringValue(frontmatter, "license"), "Unknown"));
        skill.setDownloadUrl(firstNonBlank(stringValue(frontmatter, "downloadUrl"), stringValue(frontmatter, "download_url")));
        skill.setSourceUrl(firstNonBlank(stringValue(frontmatter, "sourceUrl"), stringValue(frontmatter, "source_url")));
        skill.setSourcePath(skillFile.toAbsolutePath().toString());
        skill.setIconUrl(firstNonBlank(stringValue(frontmatter, "iconUrl"), stringValue(frontmatter, "icon_url")));
        skill.setIconEmoji(firstNonBlank(stringValue(frontmatter, "icon"), stringValue(frontmatter, "emoji"), inferEmoji(category.getSlug(), name)));
        skill.setOrigin(firstNonBlank(stringValue(frontmatter, "origin"), stringValue(frontmatter, "source")));
        skill.setTags(tags);
        skill.setFeatured(booleanValue(frontmatter, "featured", false));
        skill.setVerified(booleanValue(frontmatter, "verified", true));

        if (isNew) {
            skill.setClickCount(0L);
            skill.setDownloadCount(0L);
        }

        skillRepository.save(skill);
        return isNew;
    }

    private List<Path> resolveScanRoots() {
        String rawPaths = scanPaths != null && !scanPaths.isBlank() ? scanPaths : scanPath;
        if (rawPaths == null || rawPaths.isBlank()) {
            return List.of();
        }

        return Arrays.stream(rawPaths.split("[,;\\n]"))
                .map(String::trim)
                .filter(path -> !path.isBlank())
                .map(Paths::get)
                .filter(Files::exists)
                .map(Path::toAbsolutePath)
                .distinct()
                .toList();
    }

    private Map<String, Object> parseFrontmatter(String content) {
        Matcher matcher = FRONTMATTER_PATTERN.matcher(content);
        if (!matcher.find()) {
            return Map.of();
        }

        try {
            Object loaded = new Yaml().load(matcher.group(1));
            if (loaded instanceof Map<?, ?> rawMap) {
                Map<String, Object> result = new LinkedHashMap<>();
                rawMap.forEach((key, value) -> {
                    if (key != null && value != null) {
                        result.put(key.toString(), value);
                    }
                });
                return result;
            }
        } catch (Exception ex) {
            log.warn("Failed to parse SKILL frontmatter: {}", ex.getMessage());
        }
        return Map.of();
    }

    private String stripFrontmatter(String content) {
        return FRONTMATTER_PATTERN.matcher(content).replaceFirst("").trim();
    }

    private List<String> resolveTags(Map<String, Object> frontmatter, String name, String readmeContent, String relativeFolder) {
        Set<String> tags = new LinkedHashSet<>();
        tags.addAll(listValue(frontmatter, "tags"));
        tags.addAll(listValue(frontmatter, "keywords"));

        String searchableText = normalize(Stream.of(name, readmeContent, relativeFolder)
                .filter(Objects::nonNull)
                .collect(Collectors.joining(" ")));
        for (String hint : TAG_HINTS) {
            if (searchableText.contains(hint)) {
                tags.add(hint);
            }
        }

        if (tags.isEmpty()) {
            Arrays.stream(relativeFolder.split("[/\\\\-]"))
                    .map(this::normalize)
                    .filter(part -> !part.isBlank())
                    .forEach(tags::add);
        }

        return tags.stream()
                .map(this::normalize)
                .filter(tag -> !tag.isBlank())
                .distinct()
                .limit(8)
                .toList();
    }

    private List<String> listValue(Map<String, Object> frontmatter, String key) {
        Object value = nestedValue(frontmatter, key);
        if (value instanceof List<?> rawList) {
            return rawList.stream()
                    .filter(Objects::nonNull)
                    .map(String::valueOf)
                    .toList();
        }
        if (value instanceof String rawString && !rawString.isBlank()) {
            return Arrays.stream(rawString.split("[,，]"))
                    .map(String::trim)
                    .filter(part -> !part.isBlank())
                    .toList();
        }
        return List.of();
    }

    private String stringValue(Map<String, Object> frontmatter, String key) {
        Object value = nestedValue(frontmatter, key);
        return value == null ? null : String.valueOf(value).trim();
    }

    private Object nestedValue(Map<String, Object> source, String key) {
        if (!key.contains(".")) {
            return source.get(key);
        }

        Object current = source;
        for (String part : key.split("\\.")) {
            if (!(current instanceof Map<?, ?> currentMap)) {
                return null;
            }
            current = currentMap.get(part);
            if (current == null) {
                return null;
            }
        }
        return current;
    }

    private boolean booleanValue(Map<String, Object> frontmatter, String key, boolean defaultValue) {
        Object value = nestedValue(frontmatter, key);
        if (value == null) {
            return defaultValue;
        }
        if (value instanceof Boolean boolValue) {
            return boolValue;
        }
        return Boolean.parseBoolean(String.valueOf(value));
    }

    private String extractSummary(String markdown) {
        return Arrays.stream(markdown.split("\\R\\R+"))
                .map(String::trim)
                .filter(block -> !block.isBlank())
                .filter(block -> !block.startsWith("#"))
                .filter(block -> !block.startsWith("```"))
                .findFirst()
                .map(block -> block.replaceAll("\\R+", " "))
                .map(block -> truncate(block, 220))
                .orElse("Skill marketplace entry");
    }

    private String inferEmoji(String categorySlug, String name) {
        String lowerName = normalize(name);
        if (lowerName.contains("react") || lowerName.contains("frontend")) {
            return "🧩";
        }
        if (lowerName.contains("spring") || lowerName.contains("backend")) {
            return "🗄";
        }
        if (lowerName.contains("prompt") || lowerName.contains("agent") || lowerName.contains("automation")) {
            return "🤖";
        }

        return switch (categorySlug) {
            case "frontend-development" -> "🧩";
            case "backend-development" -> "🗄";
            case "ai-automation" -> "🤖";
            case "design-experience" -> "🎨";
            case "product-management" -> "🧭";
            case "office-productivity" -> "🗂";
            case "sales-business" -> "🤝";
            case "data-analysis" -> "📈";
            case "finance-accounting" -> "💹";
            case "legal-compliance" -> "⚖";
            case "education-training" -> "🎓";
            case "marketing-growth" -> "📣";
            default -> "🧰";
        };
    }

    private Map<String, Object> result(int scanned, int created, int updated, int skipped, List<String> scanRoots) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("scanRoots", scanRoots);
        result.put("scanned", scanned);
        result.put("created", created);
        result.put("updated", updated);
        result.put("skipped", skipped);
        return result;
    }

    private String firstNonBlank(String... values) {
        return Stream.of(values)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .findFirst()
                .orElse(null);
    }

    private String slugify(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String slug = value.toLowerCase(Locale.ROOT)
                .replace('\\', '-')
                .replace('/', '-')
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-{2,}", "-")
                .replaceAll("^-|-$", "");

        return slug.isBlank() ? null : slug;
    }

    private String truncate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength - 3) + "...";
    }

    private String normalize(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT)
                .replaceAll("[^\\p{IsAlphabetic}\\p{IsDigit}\\s-]+", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }
}
