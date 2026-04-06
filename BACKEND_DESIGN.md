# Skill Atlas — 后端设计文档

> 技术栈：Spring Boot 3.4.7 · JDK 21 · PostgreSQL 16 · Caffeine Cache · Docker Compose

---

## 一、工程结构

```
backend/src/main/java/com/skillplatform/
├── SkillPlatformApplication.java       # 启动类，@EnableCaching
├── catalog/
│   └── MarketplaceCategoryCatalog.java # 行业分类种子数据（硬编码）
├── config/
│   ├── CacheConfig.java                # Caffeine 缓存配置（5min TTL，500条上限）
│   ├── CorsConfig.java                 # CORS 跨域配置
│   ├── JwtAuthFilter.java              # JWT 认证过滤器（OncePerRequestFilter）
│   └── SecurityConfig.java            # Spring Security 权限规则
├── controller/
│   ├── AdminController.java            # /api/admin/** (ROLE_ADMIN)
│   ├── AuthController.java            # /api/auth/** (OAuth2 + 固定账密)
│   ├── CategoryController.java        # /api/categories/**
│   ├── LeaderboardController.java     # /api/leaderboard (公开)
│   ├── ProfileController.java         # /api/users/{username}/profile (公开)
│   ├── SkillController.java           # /api/skills/**
│   └── UserController.java            # /api/users/me/**
├── dto/                               # 数据传输对象（见第三节）
├── exception/
│   ├── BusinessException.java         # 业务异常（带 HTTP 状态码）
│   ├── GlobalExceptionHandler.java    # @ControllerAdvice 全局异常处理
│   └── ResourceNotFoundException.java
├── model/                             # JPA 实体（见第二节）
├── repository/                        # Spring Data JPA 接口
└── service/                           # 业务逻辑（见第四节）
```

---

## 二、数据模型

### 2.1 User（用户）

```sql
CREATE TABLE users (
  id                   BIGSERIAL PRIMARY KEY,
  linux_do_id          VARCHAR(100) UNIQUE NOT NULL,  -- Linux.do 平台用户ID
  username             VARCHAR(100) NOT NULL,
  name                 VARCHAR(200),
  email                VARCHAR(200),
  avatar_url           VARCHAR(500),
  trust_level          INTEGER DEFAULT 0,             -- Linux.do trust level (0-4)
  is_admin             BOOLEAN DEFAULT false,
  active               BOOLEAN DEFAULT true,
  points_balance       INTEGER DEFAULT 0,             -- 当前积分余额
  total_points_spent   INTEGER DEFAULT 0,             -- 累计消费积分（用于等级计算）
  last_check_in_date   DATE,
  check_in_streak_days INTEGER DEFAULT 0,             -- 当前连签天数
  total_check_in_count INTEGER DEFAULT 0,
  last_login_at        TIMESTAMP,
  created_at           TIMESTAMP DEFAULT NOW(),
  updated_at           TIMESTAMP DEFAULT NOW()
);
```

### 2.2 Skill（技能）

```sql
CREATE TABLE skills (
  id                            BIGSERIAL PRIMARY KEY,
  slug                          VARCHAR(100) UNIQUE NOT NULL,
  name                          VARCHAR(200) NOT NULL,
  short_description             VARCHAR(500),
  description                   TEXT,
  readme_content                TEXT,                  -- SKILL.md 完整内容
  category_id                   BIGINT REFERENCES categories(id),
  author                        VARCHAR(200),
  version                       VARCHAR(50),
  license                       VARCHAR(200),
  download_url                  VARCHAR(500),
  source_url                    VARCHAR(500),
  source_path                   VARCHAR(1000),         -- 本地文件路径（爬虫用）
  icon_url                      VARCHAR(500),
  icon_emoji                    VARCHAR(10),
  origin                        VARCHAR(100),          -- 来源标识（如 ECC、community）
  submitter_linux_do_id         VARCHAR(100),          -- 投稿用户的 Linux.do ID
  submitter_username            VARCHAR(100),          -- 投稿用户名（展示用）
  submission_reward_granted     BOOLEAN DEFAULT false, -- 上架奖励是否已发放
  submission_reward_granted_at  TIMESTAMP,
  click_count                   BIGINT DEFAULT 0,
  download_count                BIGINT DEFAULT 0,
  price_points                  INTEGER DEFAULT 1,     -- 0=免费
  featured                      BOOLEAN DEFAULT false,
  verified                      BOOLEAN DEFAULT false, -- false=待审核，true=公开可见
  created_at                    TIMESTAMP DEFAULT NOW(),
  updated_at                    TIMESTAMP DEFAULT NOW()
);

-- 从句子标签到技能的多对多（ElementCollection）
CREATE TABLE skill_tags (
  skill_id BIGINT REFERENCES skills(id),
  tag      VARCHAR(50)
);

-- 索引
CREATE INDEX idx_skill_click_count    ON skills(click_count);
CREATE INDEX idx_skill_download_count ON skills(download_count);
CREATE INDEX idx_skill_category_id    ON skills(category_id);
CREATE INDEX idx_skill_created_at     ON skills(created_at);
CREATE INDEX idx_skill_featured       ON skills(featured);
CREATE INDEX idx_skill_verified       ON skills(verified);
```

> ⚠️ **重要**：用户上传的 Skill 默认 `verified=false`，管理员在投稿审核队列中通过后才变为 `true`。爬虫从本地目录爬取的官方 Skill 默认 `verified=true`。

### 2.3 Category（分类）

```sql
CREATE TABLE categories (
  id          BIGSERIAL PRIMARY KEY,
  slug        VARCHAR(100) UNIQUE NOT NULL,
  name        VARCHAR(100),         -- 英文名
  name_zh     VARCHAR(100),         -- 中文名
  description TEXT,
  icon_emoji  VARCHAR(10),
  industry    VARCHAR(100),         -- 所属行业
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

分类由 `MarketplaceCategoryCatalog.java` 硬编码种子数据，启动时由 `DataInitService` 写入数据库（幂等）。行业分组逻辑在 `CategoryService.getGroupedCategories()` 中实现。

### 2.4 PointTransaction（积分流水）

```sql
CREATE TABLE point_transactions (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT NOT NULL,
  skill_id      BIGINT,               -- 关联技能（若有）
  type          VARCHAR(50) NOT NULL, -- 见 PointTransactionType 枚举
  delta_points  INTEGER NOT NULL,     -- 正=收入，负=支出
  balance_after INTEGER NOT NULL,     -- 操作后余额快照
  note          VARCHAR(300),
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_point_tx_user_id    ON point_transactions(user_id);
CREATE INDEX idx_point_tx_skill_id   ON point_transactions(skill_id);
CREATE INDEX idx_point_tx_created_at ON point_transactions(created_at);
```

**PointTransactionType 枚举：**

| 类型 | 说明 |
|------|------|
| `WELCOME_BONUS` | 新用户注册赠送积分 |
| `DAILY_CHECK_IN` | 每日签到（含连签奖励） |
| `DOWNLOAD_PURCHASE` | 下载付费技能扣积分 |
| `AUTHOR_REVENUE_SHARE` | 技能被下载，作者获得分成 |
| `SKILL_SUBMISSION_REWARD` | 技能审核通过后的上架奖励 |
| `RATING_REWARD` | 用户首次评分奖励 |
| `ADMIN_ADJUSTMENT` | 管理员手动调整 |

### 2.5 UserSkillPurchase（购买记录）

```sql
CREATE TABLE user_skill_purchases (
  id           BIGSERIAL PRIMARY KEY,
  user_id      BIGINT NOT NULL,
  skill_id     BIGINT NOT NULL,
  points_paid  INTEGER NOT NULL,
  created_at   TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, skill_id)           -- 每人每技能只能买一次
);
```

### 2.6 UserFavorite（收藏）

```sql
CREATE TABLE user_favorites (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT NOT NULL,
  skill_id   BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, skill_id)
);
```

### 2.7 SkillRating（评分）

```sql
CREATE TABLE skill_ratings (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT NOT NULL,
  skill_id   BIGINT NOT NULL,
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, skill_id)
);
```

---

## 三、DTO 设计

| DTO | 用途 |
|-----|------|
| `SkillDTO` | 技能详情（含 submitterUsername、avgRating） |
| `UserDTO` | 用户信息（含 levelProfile、积分、连签数） |
| `UserLevelDTO` | 等级详情（rank、levelName、growthScore、nextThreshold） |
| `CategoryDTO` | 分类（含 skillCount） |
| `CategoryGroupDTO` | 行业分组（industry + List<CategoryDTO>） |
| `PointTransactionDTO` | 单条积分流水 |
| `PointSummaryDTO` | 积分摘要（余额、总收入、总支出） |
| `CheckInResultDTO` | 签到结果（delta、streakDays、streakBonus） |
| `PurchasedSkillDTO` | 我的已购技能列表项 |
| `CreatorSkillDTO` | 创作者仪表盘技能卡（含 totalEarned、purchaserCount） |
| `PublicProfileDTO` | 公开主页（含 levelProfile、submittedSkills） |
| `SkillPurchaseStatusDTO` | 技能购买状态（isPurchased、pricePoints、balanceSufficient） |
| `SkillSubmissionResultDTO` | 上传结果（skillId、slug、message） |
| `RatingDTO` | 评分（avgRating、ratingCount、myRating） |
| `PagedResponse<T>` | 分页包装器 |

---

## 四、核心服务

### 4.1 PointService — 积分引擎

所有积分变动走 `PointService`，保证：
- **悲观锁**：通过 `userRepository.findByIdForUpdate()` 防并发超扣
- **原子记账**：每次变动同时写 `point_transactions` 和更新 `user.pointsBalance`

**主要方法：**

```java
// 签到（含连签奖励）
CheckInResultDTO checkIn(Long userId)

// 下载扣积分 + 检查访问权限（免费/已购/余额足够）
void ensureDownloadAccess(Long userId, Skill skill)

// 作者收益分成（下载后自动触发，70%）
void creditAuthorRevenue(Skill skill, int pricePoints)   // private

// 首次评分奖励（+2分，重复评分不触发）
void rewardRatingPoints(Long userId, Long skillId, String skillName)

// 管理员手动调整
PointSummaryDTO adjustPoints(Long adminUserId, int delta, String note)

// 新用户注册礼包（+100分）
void grantWelcomeBonus(User user)

// 技能上架奖励（+200分，只发一次）
void grantSubmissionReward(Skill skill)
```

**连签奖励逻辑：**
```
连签天数 % 30 == 0  → 额外 +200 分（DAILY_CHECK_IN 同一笔交易）
连签天数 % 7  == 0  → 额外 +30 分
否则              → 仅基础 +5 分
```

**作者分成逻辑：**
```
分成 = floor(pricePoints × 0.7)
条件：pricePoints > 0 且 Skill 有 submitterLinuxDoId
跳过：免费技能、无归属技能
```

### 4.2 UserLevelService — 等级系统

**成长值公式：**
```
growthScore = totalPointsSpent × 0.5
            + 通过 AUTHOR_REVENUE_SHARE 获得的总积分 × 1.0
            + 已上传技能数 × 50
            + 评分总次数 × 2
```

**等级划分：**

| Rank | Code | 中文名 | 英文名 | growthScore 阈值 |
|------|------|--------|--------|-----------------|
| 1 | starter | 见习者 | Starter | 0 |
| 2 | explorer | 探索者 | Explorer | 40 |
| 3 | contributor | 共创者 | Contributor | 100 |
| 4 | curator | 策展者 | Curator | 220 |
| 5 | trailblazer | 领航者 | Trailblazer | 400 |

上传权限在 rank ≥ 3（可配置，`UPLOAD_UNLOCK_RANK` 环境变量）时解锁。

### 4.3 SkillCrawlerService — 爬虫

递归扫描挂载目录（`/skills`），解析 `SKILL.md` frontmatter（YAML 头部），写入或更新 `skills` 表。

**解析字段映射：**

| frontmatter key | Skill 字段 |
|-----------------|-----------|
| `name` / `title` | name |
| `slug` | slug（缺省用目录名转换） |
| `description` / `shortDescription` | shortDescription |
| `category` | category（按 slug 查找或创建） |
| `author` | author |
| `version` | version |
| `iconEmoji` / `icon` | iconEmoji |
| `pricePoints` / `price` | pricePoints |
| `featured` | featured |
| `verified` | verified（官方爬虫默认 true） |
| `submitterLinuxDoId` | submitterLinuxDoId |
| `submitterUsername` / `submitter` / `uploader` | submitterUsername |
| `tags` | tags（List） |

### 4.4 SkillSubmissionService — 用户投稿

用户上传 ZIP 包 → 解压到 `SKILL_UPLOAD_PATH` → 读取 SKILL.md → 调用 `SkillCrawlerService.crawlSingleDirectory()` 入库。

投稿时自动注入元数据：
- `submitterLinuxDoId` = 当前登录用户的 Linux.do ID
- `submitterUsername` = 当前用户名
- `verified: false`（必须管理员审核通过才公开）

### 4.5 RatingService

- 评分范围 1-5 星
- 首次评分触发 `pointService.rewardRatingPoints()`（+2 积分）
- 重复评分更新星级，不再给积分（`isNew` 标志控制）
- 平均分由 `SkillRatingRepository.averageRatingBySkillId()` 实时聚合

---

## 五、API 接口总览

### 5.1 公开接口（无需认证）

| Method | Path | 说明 |
|--------|------|------|
| GET | `/api/skills` | 分页查询技能（支持分类/关键词/排序筛选） |
| GET | `/api/skills/featured` | 精选技能（Top 6，缓存） |
| GET | `/api/skills/trending` | 热门技能（点击榜 Top 10） |
| GET | `/api/skills/most-downloaded` | 下载榜 Top 10 |
| GET | `/api/skills/latest` | 最新入库 Top 8 |
| GET | `/api/skills/stats` | 平台统计（总技能数、总下载数等） |
| GET | `/api/skills/{slug}` | 技能详情 |
| GET | `/api/skills/{slug}/related` | 相关技能 |
| POST | `/api/skills/{slug}/click` | 记录点击（无需登录） |
| GET | `/api/skills/{skillId}/rating` | 获取评分（未登录时 myRating=null） |
| GET | `/api/categories` | 所有分类 |
| GET | `/api/categories/grouped` | 行业分组分类 |
| GET | `/api/users/{username}/profile` | 公开用户主页 |
| GET | `/api/leaderboard` | 排行榜（技能榜 + 用户榜） |
| POST | `/api/auth/linux-do` | 发起 Linux.do OAuth2 授权 |
| GET | `/api/auth/callback` | OAuth2 回调，返回 JWT |
| POST | `/api/auth/admin/login` | 固定账密登录（管理后台） |

### 5.2 需要登录（JWT Bearer Token）

| Method | Path | 说明 |
|--------|------|------|
| GET | `/api/users/me` | 当前用户信息 |
| GET | `/api/users/me/points` | 积分摘要 |
| GET | `/api/users/me/transactions` | 积分流水（分页） |
| POST | `/api/users/me/check-in` | 每日签到 |
| GET | `/api/users/me/favorites` | 我的收藏 |
| POST | `/api/skills/{slug}/favorite` | 收藏/取消收藏 |
| POST | `/api/skills/{skillId}/rate` | 评分（1-5星） |
| POST | `/api/skills/{slug}/download` | 下载技能（扣积分） |
| GET | `/api/users/me/purchases` | 我的已购技能 |
| GET | `/api/users/me/skills/{id}/purchase-status` | 技能购买状态查询 |
| GET | `/api/users/me/submitted-skills` | 我的投稿（创作者仪表盘） |
| POST | `/api/users/me/submissions/upload` | 上传 ZIP 投稿 |
| GET | `/api/users/me/level` | 等级详情 |

### 5.3 管理员接口（ROLE_ADMIN）

| Method | Path | 说明 |
|--------|------|------|
| GET | `/api/admin/stats` | 平台统计（含待审核数） |
| POST | `/api/admin/crawl` | 触发爬虫 |
| GET | `/api/admin/skills` | 技能列表（分页 + 搜索） |
| PATCH | `/api/admin/skills/{id}` | 修改技能属性 |
| DELETE | `/api/admin/skills/{id}` | 删除技能 |
| POST | `/api/admin/skills/{id}/feature` | 切换精选状态 |
| POST | `/api/admin/skills/{id}/verify` | 切换验证状态 |
| GET | `/api/admin/users` | 用户列表 |
| PATCH | `/api/admin/users/{id}/admin` | 切换管理员权限 |
| PATCH | `/api/admin/users/{id}/points` | 手动调整积分 |
| GET | `/api/admin/submissions` | 待审核投稿列表 |
| POST | `/api/admin/submissions/{id}/approve` | 审核通过（设 verified=true） |
| POST | `/api/admin/submissions/{id}/reject` | 审核拒绝（删除记录） |

---

## 六、安全设计

### 6.1 认证方式

- **主要**：Linux.do OAuth2（Authorization Code Flow）→ 回调后颁发平台 JWT
- **备用**：固定账密（`ADMIN_USERNAME` / `ADMIN_PASSWORD`）→ 仅供管理后台使用

### 6.2 JWT 配置

```
Header: Authorization: Bearer <token>
默认有效期: 168 小时（7天）
签名算法: HS256
密钥: JWT_SECRET 环境变量（生产环境必须更换）
```

### 6.3 管理员判定规则

满足任一条件即为管理员：
1. `users.is_admin = true`（手动设置）
2. Linux.do `trust_level >= ADMIN_MIN_TRUST_LEVEL`（默认 2）
3. Linux.do ID 在 `ADMIN_EXTRA_IDS` 白名单中

### 6.4 权限注解

- 控制器层：`@PreAuthorize("hasRole('ADMIN')")`（AdminController 整体）
- 服务层：检查 `userId == -1L` 为管理员虚拟 ID

---

## 七、缓存策略

使用 Caffeine 本地缓存（`CacheConfig.java`）：

| 缓存名 | TTL | 最大条目 | 用途 |
|--------|-----|---------|------|
| `skills` | 5 分钟 | 500 | 技能列表 / 详情 |
| `categories` | 5 分钟 | 200 | 分类列表 |

写操作（新增/更新/删除）后调用 `skillService.evictAllCaches()` 主动失效。

---

## 八、配置项说明

所有关键配置均支持通过环境变量覆盖：

| 环境变量 | 默认值 | 说明 |
|---------|--------|------|
| `DB_HOST` | localhost | 数据库主机 |
| `DB_PORT` | 5432 | 数据库端口 |
| `DB_NAME` | skillplatform | 数据库名 |
| `DB_USER` | skilluser | 数据库用户 |
| `DB_PASSWORD` | skillpass | 数据库密码 |
| `JWT_SECRET` | *(内置)*  | 生产环境必须更换 |
| `JWT_EXPIRATION_HOURS` | 168 | JWT 有效期（小时） |
| `LINUX_DO_CLIENT_ID` | — | Linux.do OAuth2 应用 ID |
| `LINUX_DO_CLIENT_SECRET` | — | Linux.do OAuth2 密钥 |
| `OAUTH2_REDIRECT_URI` | `http://localhost:8080/api/auth/callback` | OAuth2 回调地址 |
| `FRONTEND_URL` | `http://localhost` | 前端地址（重定向用） |
| `ADMIN_USERNAME` | skillatlas | 后台固定账号 |
| `ADMIN_PASSWORD` | Sk!llAtl@s#2026$ | 后台固定密码 |
| `ADMIN_MIN_TRUST_LEVEL` | 2 | 自动授权管理员的 trust_level 门槛 |
| `ADMIN_EXTRA_IDS` | — | 额外管理员 Linux.do ID（逗号分隔） |
| `SKILL_SCAN_PATH` | /skills | 爬虫扫描路径 |
| `SKILL_UPLOAD_PATH` | /skills/user-submissions | 用户投稿上传路径 |
| `SKILL_CRAWL_ON_STARTUP` | true | 启动时是否自动爬取 |
| `SKILL_CRAWLER_CRON` | `0 0 */6 * * *` | 定时爬取 cron 表达式（每6小时） |
| `DEFAULT_USER_POINTS` | 100 | 新用户注册赠送积分 |
| `DAILY_CHECK_IN_POINTS` | 5 | 每日签到基础积分 |
| `SKILL_SUBMISSION_POINTS` | 200 | 技能上架奖励积分 |
| `AUTHOR_SHARE_RATIO` | 0.7 | 作者收益分成比例（70%） |
| `STREAK_7DAY_BONUS` | 30 | 连签 7 天额外奖励 |
| `STREAK_30DAY_BONUS` | 200 | 连签 30 天额外奖励 |
| `RATING_REWARD` | 2 | 首次评分奖励积分 |
| `UPLOAD_UNLOCK_RANK` | 3 | 解锁投稿权限的最低等级 |
| `UPLOAD_MAX_FILE_SIZE` | 100MB | 上传文件大小上限 |

---

## 九、部署

### 一键启动

```bash
# 拷贝环境变量模板
cp .env.example .env

# 修改必要配置（Linux.do OAuth2 密钥、JWT 密钥等）
vim .env

# 构建并启动
docker compose up --build -d

# 查看日志
docker compose logs -f backend
```

### 服务端口

| 服务 | 端口 |
|------|------|
| Nginx（前端 + API 代理） | 80 |
| Spring Boot 后端 | 8080（内部） |
| PostgreSQL | 5432（内部） |

### 健康检查

- 后端：`GET /api/skills/stats`（返回 200 即健康）
- 数据库：`pg_isready -U skilluser -d skillplatform`

### Swagger API 文档

启动后访问：`http://localhost:8080/swagger-ui.html`

---

## 十、版本迭代记录

### ✅ v1.2 积分 & 购买系统（已完成）

新增实体：`PointTransaction`、`UserSkillPurchase`
新增枚举：`PointTransactionType`（WELCOME_BONUS / DAILY_CHECK_IN / DOWNLOAD_PURCHASE / AUTHOR_REVENUE_SHARE / SKILL_SUBMISSION_REWARD / RATING_REWARD / ADMIN_ADJUSTMENT）
新增服务：`PointService`（签到、下载扣积分、作者分成、评分奖励、管理员调整）
新增接口：`/api/users/me/check-in`、`/api/users/me/points`、`/api/users/me/transactions`

### ✅ v1.3 创作者工具（已完成）

新增服务：`SkillSubmissionService`（ZIP 解压 + SKILL.md 解析 + 入库）
新增接口：`/api/users/me/submissions/upload`、`/api/admin/submissions/**`
规则：用户投稿默认 `verified=false`，Admin 审核通过后变 `true`

### ✅ v1.4 个人主页 & 排行榜（已完成）

新增控制器：`ProfileController`（`/api/users/{username}/profile`）、`LeaderboardController`（`/api/leaderboard?period=`）
新增 DTO：`PublicProfileDTO`、`CreatorSkillDTO`
新增 Repository 方法：`findPendingCommunitySubmissions`、`findTopByPointsBalance`、`findByUsername`

---

## 十一、待实现功能

### 🔄 v2.0 社区信任层（当前迭代）

**新增数据表**

```sql
-- Skill 长评
CREATE TABLE skill_reviews (
  id            BIGSERIAL PRIMARY KEY,
  skill_id      BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  user_id       BIGINT NOT NULL,
  title         VARCHAR(200),
  content       TEXT NOT NULL,
  use_case      VARCHAR(200),          -- 使用场景描述
  rating        INTEGER CHECK (rating BETWEEN 1 AND 5),
  helpful_count INTEGER DEFAULT 0,
  is_visible    BOOLEAN DEFAULT true,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, skill_id)
);

-- Review 有帮助点赞
CREATE TABLE review_helpful_votes (
  id         BIGSERIAL PRIMARY KEY,
  review_id  BIGINT NOT NULL REFERENCES skill_reviews(id) ON DELETE CASCADE,
  user_id    BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (review_id, user_id)
);
```

**新增 PointTransactionType**
- `REVIEW_REWARD` — 写 Review 奖励 (+5)

**新增接口**

| Method | Path | 权限 | 说明 |
|--------|------|------|------|
| GET | `/api/skills/{slug}/reviews` | 公开 | Review 列表（分页，按有帮助数排序） |
| POST | `/api/skills/{slug}/reviews` | 登录 | 写 Review（要求已购/已下载） |
| POST | `/api/reviews/{id}/helpful` | 登录 | 切换「有帮助」投票 |
| DELETE | `/api/admin/reviews/{id}` | 管理员 | 删除违规 Review |

**新增服务方法**
- `ReviewService.createReview()` — 写入 + 触发积分奖励（幂等）
- `ReviewService.voteHelpful()` — 切换投票，更新 `helpful_count`
- `LeaderboardController` 支持 `period=week|month|all` 参数

**SkillDTO 新增字段**
- `reviewCount: int`
- `helpfulReviewCount: int`

---

### 📋 v2.1 创作者反馈闭环

**新增数据表**

```sql
CREATE TABLE notifications (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT NOT NULL,
  type       VARCHAR(50) NOT NULL,  -- SKILL_APPROVED | SKILL_DOWNLOADED | REVIEW_RECEIVED | RATING_RECEIVED
  title      VARCHAR(200) NOT NULL,
  content    VARCHAR(500),
  link       VARCHAR(300),
  skill_id   BIGINT,
  is_read    BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_notification_user_unread ON notifications(user_id, is_read, created_at DESC);
```

**新增接口**

| Method | Path | 权限 | 说明 |
|--------|------|------|------|
| GET | `/api/notifications` | 登录 | 最近 50 条通知 |
| GET | `/api/notifications/unread-count` | 登录 | 未读数（Header 轮询） |
| POST | `/api/notifications/read` | 登录 | 批量标记已读 |
| GET | `/api/users/me/submissions` | 登录 | 我的投稿状态列表 |

**新增服务**
- `NotificationService.notify()` — 统一通知入口，植入 approve/rate/review 流程

---

### 📋 v2.2 资产感强化

**新增数据表**

```sql
CREATE TABLE collections (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  icon_emoji  VARCHAR(10),
  is_public   BOOLEAN DEFAULT true,
  skill_count INTEGER DEFAULT 0,
  view_count  INTEGER DEFAULT 0,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE collection_skills (
  id            BIGSERIAL PRIMARY KEY,
  collection_id BIGINT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  skill_id      BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  sort_order    INTEGER DEFAULT 0,
  added_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE (collection_id, skill_id)
);
```

**新增接口**：`CollectionController`（`/api/collections/**`，CRUD + Fork）

---

### 📋 v2.3 增长飞轮

**新增数据表**

```sql
CREATE TABLE invite_codes (
  id         BIGSERIAL PRIMARY KEY,
  inviter_id BIGINT NOT NULL,
  code       VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE invite_records (
  id             BIGSERIAL PRIMARY KEY,
  inviter_id     BIGINT NOT NULL,
  invitee_id     BIGINT NOT NULL,
  code           VARCHAR(20) NOT NULL,
  reward_granted BOOLEAN DEFAULT false,
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE skill_promotions (
  id             BIGSERIAL PRIMARY KEY,
  skill_id       BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  original_price INTEGER NOT NULL,
  promo_price    INTEGER NOT NULL,
  max_quantity   INTEGER,
  sold_count     INTEGER DEFAULT 0,
  starts_at      TIMESTAMP NOT NULL,
  ends_at        TIMESTAMP NOT NULL,
  is_active      BOOLEAN DEFAULT true,
  created_by     BIGINT,
  created_at     TIMESTAMP DEFAULT NOW()
);
```

**新增 PointTransactionType**
- `INVITE_REWARD` — 邀请新用户奖励 (+50)

---

### 📋 v3.0 AI 原生

- [ ] `AiEnrichmentService` — 接入 Claude API，自动生成 shortDescription + 标签
- [ ] `skill_versions` 表 — Skill 版本历史 + 更新通知
- [ ] 沙盒测试环境（受控执行验证）
