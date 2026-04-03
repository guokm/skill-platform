package com.skillplatform.controller;

import com.skillplatform.dto.PagedResponse;
import com.skillplatform.dto.SkillDTO;
import com.skillplatform.service.SkillService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/skills")
@RequiredArgsConstructor
@Tag(name = "Skills", description = "Skills management endpoints")
public class SkillController {

    private final SkillService skillService;

    @GetMapping
    @Operation(summary = "List skills with pagination and filtering")
    public ResponseEntity<PagedResponse<SkillDTO>> getSkills(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false, name = "category") String categorySlug,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "popular") String sortBy
    ) {
        return ResponseEntity.ok(
                skillService.getSkills(categoryId, categorySlug, keyword, page, size, sortBy)
        );
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Get skill details by slug")
    public ResponseEntity<SkillDTO> getSkillBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(skillService.getSkillBySlug(slug));
    }

    @PostMapping("/{id}/click")
    @Operation(summary = "Record a skill click (view)")
    public ResponseEntity<Void> recordClick(@PathVariable Long id) {
        skillService.recordClick(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/download")
    @Operation(summary = "Record a skill download")
    public ResponseEntity<Void> recordDownload(@PathVariable Long id) {
        skillService.recordDownload(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping({"/{id}/download-file", "/{id}/download-package"})
    @Operation(summary = "Download the whole skill package and record a download")
    public ResponseEntity<ByteArrayResource> downloadSkill(@PathVariable Long id) {
        SkillService.DownloadPayload payload = skillService.prepareDownload(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/zip"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + payload.filename() + "\"")
                .body(new ByteArrayResource(payload.content()));
    }

    @GetMapping("/trending")
    @Operation(summary = "Get trending skills by click count")
    public ResponseEntity<List<SkillDTO>> getTrending() {
        return ResponseEntity.ok(skillService.getTrendingSkills());
    }

    @GetMapping("/most-downloaded")
    @Operation(summary = "Get most downloaded skills")
    public ResponseEntity<List<SkillDTO>> getMostDownloaded() {
        return ResponseEntity.ok(skillService.getMostDownloaded());
    }

    @GetMapping("/featured")
    @Operation(summary = "Get featured skills")
    public ResponseEntity<List<SkillDTO>> getFeatured() {
        return ResponseEntity.ok(skillService.getFeaturedSkills());
    }

    @GetMapping("/latest")
    @Operation(summary = "Get latest skills")
    public ResponseEntity<List<SkillDTO>> getLatest() {
        return ResponseEntity.ok(skillService.getLatestSkills());
    }

    @GetMapping("/{slug}/related")
    @Operation(summary = "Get related skills by same category")
    public ResponseEntity<List<SkillDTO>> getRelated(
            @PathVariable String slug,
            @RequestParam(defaultValue = "4") int limit
    ) {
        return ResponseEntity.ok(skillService.getRelatedSkills(slug, limit));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get platform statistics")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(skillService.getStats());
    }
}
