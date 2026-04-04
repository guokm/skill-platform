package com.skillplatform.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * Caffeine 本地缓存配置
 * TTL: 5 分钟；最大条目数: 500
 * 命中率较高的静态列表（trending / featured / stats / most-downloaded / latest）均使用此缓存。
 */
@Configuration
public class CacheConfig {

    public static final String CACHE_TRENDING        = "trending";
    public static final String CACHE_MOST_DOWNLOADED = "mostDownloaded";
    public static final String CACHE_FEATURED        = "featured";
    public static final String CACHE_LATEST          = "latest";
    public static final String CACHE_STATS           = "stats";
    public static final String CACHE_RATING          = "rating";

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager(
                CACHE_TRENDING, CACHE_MOST_DOWNLOADED, CACHE_FEATURED,
                CACHE_LATEST, CACHE_STATS, CACHE_RATING
        );
        manager.setCaffeine(
                Caffeine.newBuilder()
                        .expireAfterWrite(5, TimeUnit.MINUTES)
                        .maximumSize(500)
                        .recordStats()
        );
        return manager;
    }
}
