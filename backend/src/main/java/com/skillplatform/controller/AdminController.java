package com.skillplatform.controller;

import com.skillplatform.service.SkillCrawlerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Admin operations")
public class AdminController {

    private final SkillCrawlerService crawlerService;

    @PostMapping("/crawl")
    @Operation(summary = "Trigger skill crawl from configured scan path")
    public ResponseEntity<Map<String, Object>> triggerCrawl() {
        Map<String, Object> result = crawlerService.crawl();
        return ResponseEntity.ok(result);
    }
}
