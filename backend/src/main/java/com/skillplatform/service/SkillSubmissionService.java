package com.skillplatform.service;

import com.skillplatform.dto.SkillSubmissionResultDTO;
import com.skillplatform.exception.BusinessException;
import com.skillplatform.model.Skill;
import com.skillplatform.model.User;
import com.skillplatform.repository.SkillRepository;
import com.skillplatform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.yaml.snakeyaml.DumperOptions;
import org.yaml.snakeyaml.Yaml;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Service
@RequiredArgsConstructor
@Slf4j
public class SkillSubmissionService {

    private static final Pattern FRONTMATTER_PATTERN = Pattern.compile("^---\\s*\\n(.*?)\\n---\\s*", Pattern.DOTALL);

    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final SkillCrawlerService skillCrawlerService;
    private final SkillService skillService;
    private final UserLevelService userLevelService;

    @Value("${skill.upload.base-path:/skills/user-submissions}")
    private String uploadBasePath;

    @Value("${skill.upload.auto-crawl:true}")
    private boolean autoCrawl;

    @Transactional
    public SkillSubmissionResultDTO submitSkillPackage(Long userId, MultipartFile file, Integer requestedPricePoints) {
        userLevelService.ensureUploadPermission(userId);

        if (file == null || file.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "EMPTY_FILE", "请上传 zip 技能包");
        }

        String originalFilename = Optional.ofNullable(file.getOriginalFilename()).orElse("skill-package.zip");
        if (!originalFilename.toLowerCase(Locale.ROOT).endsWith(".zip")) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "INVALID_FILE_TYPE", "只支持上传 .zip 技能包");
        }

        User submitter = resolveSubmitter(userId);
        Path baseDirectory = ensureWritableBaseDirectory();
        Path extractionDirectory = createSubmissionDirectory(baseDirectory, originalFilename);

        try (InputStream inputStream = file.getInputStream()) {
            extractZip(inputStream, extractionDirectory);
        } catch (IOException ex) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "INVALID_ZIP", "技能包解压失败，请检查 zip 内容是否完整");
        }

        List<Path> skillFiles = findSkillMarkdownFiles(extractionDirectory);
        if (skillFiles.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "MISSING_SKILL_MD", "zip 中没有找到 SKILL.md");
        }
        if (skillFiles.size() > 1) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "MULTIPLE_SKILL_MD", "一个 zip 仅支持上传一个技能包，请确保只包含一个 SKILL.md");
        }

        Path skillFile = skillFiles.getFirst();
        int finalPricePoints = mergeSubmissionMetadata(skillFile, submitter, requestedPricePoints);

        Map<String, Object> crawlResult = Map.of();
        if (autoCrawl) {
            crawlResult = skillCrawlerService.crawl();
            skillService.evictAllCaches();
        }

        Skill discoveredSkill = skillRepository.findBySourcePath(skillFile.toAbsolutePath().toString()).orElse(null);

        SkillSubmissionResultDTO result = new SkillSubmissionResultDTO();
        result.setMessage(discoveredSkill != null ? "技能包上传成功，已经自动入库" : "技能包上传成功，已写入待扫描目录");
        result.setUploadFolder(extractionDirectory.toString());
        result.setPricePoints(finalPricePoints);
        result.setSubmitterLinuxDoId(submitter != null ? submitter.getLinuxDoId() : null);
        result.setCrawlResult(crawlResult);
        if (discoveredSkill != null) {
            result.setSkillSlug(discoveredSkill.getSlug());
            result.setSkillName(discoveredSkill.getName());
            result.setSubmissionRewardGranted(Boolean.TRUE.equals(discoveredSkill.getSubmissionRewardGranted()));
        } else {
            result.setSubmissionRewardGranted(false);
        }
        return result;
    }

    private User resolveSubmitter(Long userId) {
        if (userId == null || userId <= 0) {
            return null;
        }
        if (userId == -1L) {
            return null;
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
    }

    private Path ensureWritableBaseDirectory() {
        Path baseDirectory = Paths.get(uploadBasePath).toAbsolutePath().normalize();
        try {
            Files.createDirectories(baseDirectory);
        } catch (IOException ex) {
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR, "UPLOAD_PATH_UNAVAILABLE", "上传目录不可写，请检查服务挂载配置");
        }
        return baseDirectory;
    }

    private Path createSubmissionDirectory(Path baseDirectory, String originalFilename) {
        String baseName = originalFilename.replaceFirst("(?i)\\.zip$", "");
        String folderName = sanitizeSlug(baseName) + "-" + DateTimeFormatter.ofPattern("yyyyMMddHHmmss").format(LocalDateTime.now());
        Path extractionDirectory = baseDirectory.resolve(folderName).normalize();
        if (!extractionDirectory.startsWith(baseDirectory)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "INVALID_UPLOAD_PATH", "无效的上传目录");
        }
        try {
            Files.createDirectories(extractionDirectory);
        } catch (IOException ex) {
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR, "CREATE_UPLOAD_DIR_FAILED", "创建上传目录失败");
        }
        return extractionDirectory;
    }

    private void extractZip(InputStream inputStream, Path extractionDirectory) throws IOException {
        try (ZipInputStream zipInputStream = new ZipInputStream(inputStream)) {
            ZipEntry entry;
            boolean extractedAnyFile = false;
            while ((entry = zipInputStream.getNextEntry()) != null) {
                String entryName = Optional.ofNullable(entry.getName()).orElse("").replace("\\", "/");
                if (entryName.isBlank()) {
                    continue;
                }
                Path targetPath = extractionDirectory.resolve(entryName).normalize();
                if (!targetPath.startsWith(extractionDirectory)) {
                    throw new BusinessException(HttpStatus.BAD_REQUEST, "ZIP_SLIP_DETECTED", "zip 包含非法路径");
                }
                if (entry.isDirectory()) {
                    Files.createDirectories(targetPath);
                } else {
                    Files.createDirectories(Optional.ofNullable(targetPath.getParent()).orElse(extractionDirectory));
                    try (OutputStream outputStream = Files.newOutputStream(targetPath)) {
                        zipInputStream.transferTo(outputStream);
                    }
                    extractedAnyFile = true;
                }
                zipInputStream.closeEntry();
            }
            if (!extractedAnyFile) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "EMPTY_ARCHIVE", "zip 中没有可用文件");
            }
        }
    }

    private List<Path> findSkillMarkdownFiles(Path extractionDirectory) {
        try (Stream<Path> stream = Files.walk(extractionDirectory)) {
            return stream
                    .filter(Files::isRegularFile)
                    .filter(path -> "SKILL.md".equalsIgnoreCase(path.getFileName().toString()))
                    .sorted()
                    .toList();
        } catch (IOException ex) {
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR, "SCAN_UPLOAD_FAILED", "扫描上传技能包失败");
        }
    }

    private int mergeSubmissionMetadata(Path skillFile, User submitter, Integer requestedPricePoints) {
        try {
            String content = Files.readString(skillFile);
            Matcher matcher = FRONTMATTER_PATTERN.matcher(content);
            boolean hasFrontmatter = matcher.find();
            String rawFrontmatter = hasFrontmatter ? matcher.group(1) : null;
            String body = hasFrontmatter ? content.substring(matcher.end()).trim() : content.trim();

            Map<String, Object> metadata = parseFrontmatter(rawFrontmatter);
            if (submitter != null && submitter.getLinuxDoId() != null && !submitter.getLinuxDoId().isBlank()) {
                metadata.put("submitterLinuxDoId", submitter.getLinuxDoId().trim());
            }
            if (submitter != null && submitter.getUsername() != null && !submitter.getUsername().isBlank()) {
                metadata.put("submitterUsername", submitter.getUsername().trim());
            }
            if (!metadata.containsKey("author") && submitter != null) {
                metadata.put("author", firstNonBlank(submitter.getName(), submitter.getUsername()));
            }

            // Community-uploaded skills start as unverified; admin must approve before they appear publicly
            metadata.put("verified", false);

            int finalPricePoints = resolvePricePoints(metadata, requestedPricePoints);
            metadata.put("pricePoints", finalPricePoints);

            String frontmatter = dumpFrontmatter(metadata);
            String merged = "---\n" + frontmatter + "---\n\n" + body + "\n";
            Files.writeString(skillFile, merged);
            return finalPricePoints;
        } catch (IOException ex) {
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR, "WRITE_SKILL_METADATA_FAILED", "写入技能元数据失败");
        }
    }

    private Map<String, Object> parseFrontmatter(String rawFrontmatter) {
        if (rawFrontmatter == null || rawFrontmatter.isBlank()) {
            return new LinkedHashMap<>();
        }

        try {
            Object loaded = new Yaml().load(rawFrontmatter);
            if (loaded instanceof Map<?, ?> rawMap) {
                Map<String, Object> metadata = new LinkedHashMap<>();
                rawMap.forEach((key, value) -> {
                    if (key != null && value != null) {
                        metadata.put(String.valueOf(key), value);
                    }
                });
                return metadata;
            }
        } catch (Exception ex) {
            log.warn("Failed to parse frontmatter during submission: {}", ex.getMessage());
        }
        return new LinkedHashMap<>();
    }

    private int resolvePricePoints(Map<String, Object> metadata, Integer requestedPricePoints) {
        if (requestedPricePoints != null) {
            return Math.max(0, requestedPricePoints);
        }
        for (String key : List.of("pricePoints", "price_points", "price", "points", "credits")) {
            Object value = metadata.get(key);
            if (value instanceof Number number) {
                return Math.max(0, number.intValue());
            }
            if (value instanceof String text) {
                try {
                    return Math.max(0, Integer.parseInt(text.trim()));
                } catch (NumberFormatException ignore) {
                    // fall through
                }
            }
        }
        return 1;
    }

    private String dumpFrontmatter(Map<String, Object> metadata) {
        DumperOptions options = new DumperOptions();
        options.setDefaultFlowStyle(DumperOptions.FlowStyle.BLOCK);
        options.setPrettyFlow(true);
        options.setSplitLines(false);
        return new Yaml(options).dump(metadata).trim() + "\n";
    }

    private String sanitizeSlug(String rawValue) {
        String normalized = Optional.ofNullable(rawValue)
                .orElse("skill-package")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
        return normalized.isBlank() ? "skill-package" : normalized;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return null;
    }
}
