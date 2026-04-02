package com.skillplatform.service;

import com.skillplatform.model.Category;
import com.skillplatform.model.Skill;
import com.skillplatform.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitService implements CommandLineRunner {

    @Value("${app.demo-data.enabled:false}")
    private boolean demoDataEnabled;

    private final CategoryService categoryService;
    private final SkillRepository skillRepository;

    @Override
    public void run(String... args) {
        categoryService.ensureDefaultCategories();

        if (demoDataEnabled && skillRepository.count() == 0) {
            initSampleSkills();
        }
    }

    private void initSampleSkills() {
        log.info("Demo data enabled. Initializing sample skills...");

        Category frontend = categoryService.findOrCreateCategory("frontend-development", "Frontend Development", "前端开发");
        Category backend = categoryService.findOrCreateCategory("backend-development", "Backend Development", "后端开发");
        Category automation = categoryService.findOrCreateCategory("ai-automation", "AI & Automation", "AI 与自动化");
        Category office = categoryService.findOrCreateCategory("office-productivity", "Office Productivity", "办公效率");
        Category data = categoryService.findOrCreateCategory("data-analysis", "Data Analysis", "数据分析");
        Category marketing = categoryService.findOrCreateCategory("marketing-growth", "Marketing & Growth", "市场增长");

        List<Skill> skills = List.of(
                Skill.builder()
                        .slug("frontend-design-system")
                        .name("Frontend Design System")
                        .shortDescription("构建企业级组件库、栅格规范和交互体验标准。")
                        .description("Create frontend foundations including design tokens, reusable React components, and responsive interaction patterns.")
                        .readmeContent("# Frontend Design System\n\nBuild and refine reusable frontend foundations.")
                        .category(frontend)
                        .iconEmoji("🧩")
                        .author("Skill Platform")
                        .version("1.0.0")
                        .license("MIT")
                        .tags(List.of("react", "frontend", "design-system"))
                        .clickCount(1860L)
                        .downloadCount(720L)
                        .featured(true)
                        .verified(true)
                        .build(),
                Skill.builder()
                        .slug("spring-api-starter")
                        .name("Spring API Starter")
                        .shortDescription("快速搭建 Spring Boot API、数据访问和接口文档。")
                        .description("Bootstrap Spring Boot backend projects with REST APIs, validation, persistence, and API docs.")
                        .readmeContent("# Spring API Starter\n\nGenerate backend APIs and service scaffolding.")
                        .category(backend)
                        .iconEmoji("🗄")
                        .author("Skill Platform")
                        .version("1.0.0")
                        .license("Apache-2.0")
                        .tags(List.of("spring", "backend", "api"))
                        .clickCount(1420L)
                        .downloadCount(530L)
                        .featured(true)
                        .verified(true)
                        .build(),
                Skill.builder()
                        .slug("agent-workflow-operator")
                        .name("Agent Workflow Operator")
                        .shortDescription("设计多 Agent 工作流、任务编排与自动执行闭环。")
                        .description("Plan and automate agent workflows, scheduled jobs, and repeatable multi-step operations.")
                        .readmeContent("# Agent Workflow Operator\n\nCreate workflow automations for AI agents.")
                        .category(automation)
                        .iconEmoji("🤖")
                        .author("Skill Platform")
                        .version("1.2.0")
                        .license("MIT")
                        .tags(List.of("agent", "automation", "workflow"))
                        .clickCount(2190L)
                        .downloadCount(910L)
                        .featured(true)
                        .verified(true)
                        .build(),
                Skill.builder()
                        .slug("workspace-doc-kit")
                        .name("Workspace Doc Kit")
                        .shortDescription("处理 Word、PDF、PPT 等办公文档并生成可分享内容。")
                        .description("Create and transform office documents including Word, PDF, slides, and collaborative knowledge assets.")
                        .readmeContent("# Workspace Doc Kit\n\nOperate on office files and shared documentation.")
                        .category(office)
                        .iconEmoji("🗂")
                        .author("Skill Platform")
                        .version("2.0.0")
                        .license("MIT")
                        .tags(List.of("document", "pdf", "ppt"))
                        .clickCount(980L)
                        .downloadCount(440L)
                        .featured(false)
                        .verified(true)
                        .build(),
                Skill.builder()
                        .slug("analytics-storyteller")
                        .name("Analytics Storyteller")
                        .shortDescription("从 Excel、SQL 和报表中提炼洞察，形成可视化结论。")
                        .description("Analyze spreadsheet and SQL data, then turn metrics into concise business insights and dashboards.")
                        .readmeContent("# Analytics Storyteller\n\nTurn raw data into clear business narratives.")
                        .category(data)
                        .iconEmoji("📈")
                        .author("Skill Platform")
                        .version("1.1.0")
                        .license("MIT")
                        .tags(List.of("data", "excel", "dashboard"))
                        .clickCount(1675L)
                        .downloadCount(610L)
                        .featured(false)
                        .verified(true)
                        .build(),
                Skill.builder()
                        .slug("growth-content-studio")
                        .name("Growth Content Studio")
                        .shortDescription("生成营销 Campaign、内容选题和增长动作建议。")
                        .description("Create marketing campaigns, SEO content plans, and growth experiments for product launches.")
                        .readmeContent("# Growth Content Studio\n\nBuild campaign plans and growth content ideas.")
                        .category(marketing)
                        .iconEmoji("📣")
                        .author("Skill Platform")
                        .version("1.0.0")
                        .license("MIT")
                        .tags(List.of("marketing", "campaign", "growth"))
                        .clickCount(1210L)
                        .downloadCount(385L)
                        .featured(false)
                        .verified(true)
                        .build()
        );

        skillRepository.saveAll(skills);
        log.info("Initialized {} demo skills", skills.size());
    }
}
