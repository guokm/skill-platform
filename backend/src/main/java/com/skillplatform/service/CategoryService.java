package com.skillplatform.service;

import com.skillplatform.catalog.MarketplaceCategoryCatalog;
import com.skillplatform.dto.CategoryDTO;
import com.skillplatform.dto.CategoryGroupDTO;
import com.skillplatform.model.Category;
import com.skillplatform.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryService {

    private static final Map<String, Integer> GROUP_ORDER = Map.of(
            "technical", 1,
            "functional", 2,
            "industry", 3
    );

    private final CategoryRepository categoryRepository;

    public List<CategoryDTO> getAllCategories() {
        ensureDefaultCategories();
        return categoryRepository.findAllByOrderBySortOrderAsc()
                .stream()
                .map(CategoryDTO::from)
                .toList();
    }

    public List<CategoryGroupDTO> getGroupedCategories() {
        return getAllCategories().stream()
                .collect(Collectors.groupingBy(
                        CategoryDTO::getGroupKey,
                        Collectors.toList()
                ))
                .entrySet()
                .stream()
                .sorted(Comparator.comparingInt(entry -> GROUP_ORDER.getOrDefault(entry.getKey(), 99)))
                .map(entry -> {
                    List<CategoryDTO> categories = entry.getValue().stream()
                            .sorted(Comparator.comparingInt(CategoryDTO::getSortOrder))
                            .toList();
                    CategoryDTO sample = categories.getFirst();
                    return new CategoryGroupDTO(
                            sample.getGroupKey(),
                            sample.getGroupName(),
                            sample.getGroupNameZh(),
                            categories
                    );
                })
                .toList();
    }

    public CategoryDTO getCategoryBySlug(String slug) {
        ensureDefaultCategories();
        return categoryRepository.findBySlug(slug)
                .map(CategoryDTO::from)
                .orElseThrow(() -> new RuntimeException("Category not found: " + slug));
    }

    @Transactional
    public void ensureDefaultCategories() {
        MarketplaceCategoryCatalog.all().forEach(this::upsertCategory);
    }

    @Transactional
    public Category resolveCategory(String categoryHint, List<String> tags, String... searchableTexts) {
        MarketplaceCategoryCatalog.CategoryDefinition definition = MarketplaceCategoryCatalog.classify(
                categoryHint,
                MarketplaceCategoryCatalog.combineTexts(tags, searchableTexts)
        );
        return upsertCategory(definition);
    }

    @Transactional
    public Category findOrCreateCategory(String slug, String name, String nameZh) {
        return categoryRepository.findBySlug(slug)
                .orElseGet(() -> {
                    MarketplaceCategoryCatalog.CategoryDefinition definition = MarketplaceCategoryCatalog.findByAlias(slug)
                            .orElse(new MarketplaceCategoryCatalog.CategoryDefinition(
                                    slug,
                                    name,
                                    nameZh,
                                    nameZh + " 相关技能",
                                    "🧰",
                                    "slate",
                                    99,
                                    "functional",
                                    "Functional",
                                    "职能类",
                                    List.of()
                            ));
                    return upsertCategory(definition);
                });
    }

    private Category upsertCategory(MarketplaceCategoryCatalog.CategoryDefinition definition) {
        Category category = categoryRepository.findBySlug(definition.slug())
                .orElseGet(Category::new);

        boolean needsSave = category.getId() == null
                || !Objects.equals(definition.slug(), category.getSlug())
                || !Objects.equals(definition.name(), category.getName())
                || !Objects.equals(definition.nameZh(), category.getNameZh())
                || !Objects.equals(definition.groupKey(), category.getGroupKey())
                || !Objects.equals(definition.groupName(), category.getGroupName())
                || !Objects.equals(definition.groupNameZh(), category.getGroupNameZh())
                || !Objects.equals(definition.description(), category.getDescription())
                || !Objects.equals(definition.icon(), category.getIcon())
                || !Objects.equals(definition.colorClass(), category.getColorClass())
                || !Objects.equals(definition.sortOrder(), category.getSortOrder());

        if (!needsSave) {
            return category;
        }

        category.setSlug(definition.slug());
        category.setName(definition.name());
        category.setNameZh(definition.nameZh());
        category.setGroupKey(definition.groupKey());
        category.setGroupName(definition.groupName());
        category.setGroupNameZh(definition.groupNameZh());
        category.setDescription(definition.description());
        category.setIcon(definition.icon());
        category.setColorClass(definition.colorClass());
        category.setSortOrder(definition.sortOrder());
        return categoryRepository.save(category);
    }
}
