package com.skillplatform.catalog;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public final class MarketplaceCategoryCatalog {

    public record CategoryDefinition(
            String slug,
            String name,
            String nameZh,
            String description,
            String icon,
            String colorClass,
            int sortOrder,
            String groupKey,
            String groupName,
            String groupNameZh,
            List<String> keywords
    ) {
    }

    private static final List<CategoryDefinition> CATEGORIES = List.of(
            new CategoryDefinition(
                    "frontend-development",
                    "Frontend Development",
                    "前端开发",
                    "React、Vue、设计系统、可视化与体验工程相关技能。",
                    "🧩",
                    "sky",
                    1,
                    "technical",
                    "Technical",
                    "技术类",
                    List.of("frontend", "react", "vue", "next", "tailwind", "css", "ui", "browser", "design system")
            ),
            new CategoryDefinition(
                    "backend-development",
                    "Backend Development",
                    "后端开发",
                    "Spring Boot、Java、API、数据库与服务端工程技能。",
                    "🗄",
                    "emerald",
                    2,
                    "technical",
                    "Technical",
                    "技术类",
                    List.of("backend", "spring", "java", "api", "server", "database", "service", "microservice")
            ),
            new CategoryDefinition(
                    "ai-automation",
                    "AI & Automation",
                    "AI 与自动化",
                    "Prompt、Agent、工作流自动化与大模型应用类技能。",
                    "🤖",
                    "cyan",
                    3,
                    "technical",
                    "Technical",
                    "技术类",
                    List.of("agent", "ai", "llm", "gpt", "automation", "workflow", "prompt", "model", "schedule")
            ),
            new CategoryDefinition(
                    "design-experience",
                    "Design & Experience",
                    "设计体验",
                    "UI、UX、品牌、图像与创意表达相关技能。",
                    "🎨",
                    "amber",
                    4,
                    "technical",
                    "Technical",
                    "技术类",
                    List.of("design", "ux", "ui", "figma", "image", "visual", "brand", "creative")
            ),
            new CategoryDefinition(
                    "product-management",
                    "Product Management",
                    "产品管理",
                    "需求分析、路线图、PRD、策略研究与协作推进。",
                    "🧭",
                    "rose",
                    5,
                    "functional",
                    "Functional",
                    "职能类",
                    List.of("product", "prd", "roadmap", "spec", "strategy", "research", "stakeholder")
            ),
            new CategoryDefinition(
                    "office-productivity",
                    "Office Productivity",
                    "办公效率",
                    "文档、PPT、PDF、知识整理与协同办公相关技能。",
                    "🗂",
                    "slate",
                    6,
                    "functional",
                    "Functional",
                    "职能类",
                    List.of("document", "docx", "word", "pdf", "slide", "ppt", "presentation", "office", "knowledge")
            ),
            new CategoryDefinition(
                    "sales-business",
                    "Sales & Business",
                    "销售商务",
                    "方案撰写、客户沟通、CRM、商机推进与商务协同。",
                    "🤝",
                    "orange",
                    7,
                    "functional",
                    "Functional",
                    "职能类",
                    List.of("sales", "crm", "proposal", "customer", "business", "commerce", "deal")
            ),
            new CategoryDefinition(
                    "data-analysis",
                    "Data Analysis",
                    "数据分析",
                    "数据清洗、报表、SQL、Excel、指标分析与洞察提炼。",
                    "📈",
                    "teal",
                    8,
                    "functional",
                    "Functional",
                    "职能类",
                    List.of("data", "excel", "xlsx", "sql", "analytics", "dashboard", "metric", "report", "csv")
            ),
            new CategoryDefinition(
                    "finance-accounting",
                    "Finance & Accounting",
                    "财务会计",
                    "预算、报销、发票、财务报表与结算流程相关技能。",
                    "💹",
                    "lime",
                    9,
                    "industry",
                    "Industry",
                    "行业类",
                    List.of("finance", "budget", "invoice", "payment", "accounting", "expense", "tax")
            ),
            new CategoryDefinition(
                    "legal-compliance",
                    "Legal & Compliance",
                    "法务合规",
                    "合同审查、政策合规、风险评估与治理流程相关技能。",
                    "⚖",
                    "zinc",
                    10,
                    "industry",
                    "Industry",
                    "行业类",
                    List.of("legal", "contract", "compliance", "policy", "regulation", "risk", "governance")
            ),
            new CategoryDefinition(
                    "education-training",
                    "Education & Training",
                    "教育培训",
                    "课程设计、教学素材、培训内容与知识传递相关技能。",
                    "🎓",
                    "indigo",
                    11,
                    "industry",
                    "Industry",
                    "行业类",
                    List.of("education", "training", "course", "student", "lesson", "teaching", "syllabus")
            ),
            new CategoryDefinition(
                    "marketing-growth",
                    "Marketing & Growth",
                    "市场增长",
                    "内容营销、品牌传播、SEO、增长策略与活动策划。",
                    "📣",
                    "pink",
                    12,
                    "industry",
                    "Industry",
                    "行业类",
                    List.of("marketing", "seo", "campaign", "growth", "social", "content", "brand", "email")
            )
    );

    private static final CategoryDefinition DEFAULT_CATEGORY = CATEGORIES.stream()
            .filter(category -> category.slug().equals("office-productivity"))
            .findFirst()
            .orElseThrow();

    private MarketplaceCategoryCatalog() {
    }

    public static List<CategoryDefinition> all() {
        return CATEGORIES;
    }

    public static CategoryDefinition defaultCategory() {
        return DEFAULT_CATEGORY;
    }

    public static Optional<CategoryDefinition> findByAlias(String input) {
        if (input == null || input.isBlank()) {
            return Optional.empty();
        }

        String normalized = normalize(input);
        return CATEGORIES.stream()
                .filter(category -> normalized.equals(normalize(category.slug()))
                        || normalized.equals(normalize(category.name()))
                        || normalized.equals(normalize(category.nameZh())))
                .findFirst();
    }

    public static CategoryDefinition classify(String categoryHint, String... texts) {
        Optional<CategoryDefinition> fromHint = findByAlias(categoryHint);
        if (fromHint.isPresent()) {
            return fromHint.get();
        }

        String searchText = Stream.of(texts)
                .filter(value -> value != null && !value.isBlank())
                .map(MarketplaceCategoryCatalog::normalize)
                .collect(Collectors.joining(" "));

        if (searchText.isBlank()) {
            return defaultCategory();
        }

        int bestScore = 0;
        CategoryDefinition bestCategory = defaultCategory();

        for (CategoryDefinition category : CATEGORIES) {
            int score = 0;
            for (String keyword : category.keywords()) {
                String normalizedKeyword = normalize(keyword);
                if (searchText.contains(normalizedKeyword)) {
                    score += normalizedKeyword.length() > 5 ? 3 : 1;
                }
            }
            if (score > bestScore) {
                bestScore = score;
                bestCategory = category;
            }
        }

        return bestCategory;
    }

    public static String combineTexts(List<String> tags, String... texts) {
        String tagText = tags == null ? "" : String.join(" ", tags);
        return Stream.concat(Stream.of(tagText), Arrays.stream(texts))
                .filter(value -> value != null && !value.isBlank())
                .collect(Collectors.joining(" "));
    }

    private static String normalize(String value) {
        return value.toLowerCase(Locale.ROOT)
                .replaceAll("[^\\p{IsAlphabetic}\\p{IsDigit}\\s-]+", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }
}
