# Skill Atlas — 产品迭代计划

> 定位：**AI 能力资产化平台** — Skill 不是文件，是你在 AI 时代的能力凭证与数字资产
>
> 当前版本：**v1.4**（积分体系 + 创作者工具 + 个人主页 + 排行榜已完成）
>
> 核心价值公式：**价值 = 实用性 × 稀缺性 × 社区认可度**

---

## 现状评估

| 价值支柱 | 当前状态 | 缺口 |
|---------|---------|------|
| 实用性 | ✅ 完整（下载、使用、积分购买） | — |
| 稀缺性 | ✅ 基础（积分定价、创作者审核） | 限量/促销机制缺失 |
| 社区认可度 | ⚠️ 残缺（仅星评，无深度反馈） | **最大空洞** |
| 创作者反馈 | ❌ 几乎为零（审核后无任何动态） | 留存杀手 |
| 资产感 | ⚠️ 基础（已购列表、个人主页） | 无法展示和分享 |
| 增长飞轮 | ❌ 缺失（无邀请、无病毒传播） | — |

---

## v2.0 — 社区信任层（预计 2 周）

> **战略目标**：补上「社区认可度」这条腿，让平台从「文件下载站」升级为「有共识的 AI 资产市场」。

### 为什么优先

没有真实社区反馈，用户不敢付积分。星评是最弱的信任信号。
Review 系统一旦建立，每一条评价都是 SEO 内容，也是新用户的决策依据。

---

### 2.0.1 Skill Review 系统（核心）

**产品逻辑**
- 区别于星评（1-5星），Review 是图文长评，描述真实使用场景
- 每个 Skill 详情页底部展示 Review 列表，按「有帮助」数倒序排列
- 写 Review 获积分奖励（+5，每个 Skill 限一次，避免刷分）
- 管理员可删除违规 Review

**数据库**

```sql
CREATE TABLE skill_reviews (
  id           BIGSERIAL PRIMARY KEY,
  skill_id     BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  user_id      BIGINT NOT NULL,
  title        VARCHAR(200),                      -- 评价标题（可选）
  content      TEXT NOT NULL,                     -- 正文（Markdown）
  use_case     VARCHAR(200),                      -- 使用场景（如"销售跟进邮件"）
  rating       INTEGER CHECK (rating BETWEEN 1 AND 5),
  helpful_count INTEGER DEFAULT 0,               -- 「有帮助」点赞数
  is_visible   BOOLEAN DEFAULT true,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, skill_id)                     -- 每人每 Skill 限一篇
);

CREATE TABLE review_helpful_votes (
  id         BIGSERIAL PRIMARY KEY,
  review_id  BIGINT NOT NULL REFERENCES skill_reviews(id) ON DELETE CASCADE,
  user_id    BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (review_id, user_id)                   -- 每人每 Review 只能点一次
);
```

**后端**
- `SkillReview` 实体 + `SkillReviewRepository`
- `ReviewService`：
  - `createReview(userId, skillId, req)` — 写入后触发 +5 积分奖励（幂等）
  - `voteHelpful(userId, reviewId)` — 切换投票状态
  - `deleteReview(adminId, reviewId)` — 管理员删除
- `GET /api/skills/{slug}/reviews` — 公开，分页，按 helpful_count 排序
- `POST /api/skills/{slug}/reviews` — 需登录，要求已购买或已下载该 Skill
- `POST /api/reviews/{id}/helpful` — 需登录，切换「有帮助」
- `DELETE /api/admin/reviews/{id}` — 管理员删除

**前端**
- `SkillDetail.jsx` 底部新增 Review 区块：
  - Review 列表（头像 + 用户名 + 使用场景标签 + 正文 + 有帮助按钮）
  - 写 Review 表单（折叠式，填写标题 + 正文 + 使用场景）
  - 未购买用户看到"购买后可评价"提示
- 积分规则说明：写 Review 得 +5 积分

**PointTransactionType 新增**
```java
REVIEW_REWARD   // 写 Review 奖励
```

---

### 2.0.2 时间窗口热榜（周榜/月榜）

**产品逻辑**
- 现有排行榜是全时累计，新 Skill 永远排不进去
- 按时间窗口计算下载/点击增量，给新 Skill 曝光机会
- 热榜数据每小时更新一次（定时任务）

**数据库**

```sql
CREATE TABLE skill_rank_snapshots (
  id           BIGSERIAL PRIMARY KEY,
  skill_id     BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  period       VARCHAR(20) NOT NULL,    -- 'week' | 'month'
  score        BIGINT NOT NULL,         -- 该时间段内增量
  rank_position INTEGER,               -- 当前排名
  snapshot_at  TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_rank_period ON skill_rank_snapshots(period, score DESC);
```

**实现方案（简化版）**
- 在 `PointTransaction` 中记录时间，后端用 `WHERE created_at > NOW() - INTERVAL '7 days'` 聚合
- 无需额外快照表，直接查询 `skills.download_count` 的时间段增量（利用 `point_transactions` 表中 `DOWNLOAD_PURCHASE` 类型记录）

**后端**
- `LeaderboardController` 新增参数：`GET /api/leaderboard?period=week|month|all`
- `SkillRepository` 新增按时间窗口的下载量查询

**前端**
- `Leaderboard.jsx` 技能榜顶部加时间段切换：全时 / 本月 / 本周
- 排名变化指示器（↑2 / ↓1 / NEW）

---

### 2.0.3 Review 影响排名

- Skill 综合评分 = 星评均分 × 0.6 + Review 数量权重 × 0.2 + 有帮助数权重 × 0.2
- `SkillDTO` 新增字段：`reviewCount`、`helpfulReviewCount`
- 搜索/浏览支持按「综合评分」排序

---

## v2.1 — 创作者反馈闭环（预计 1 周）

> **战略目标**：让创作者看到自己 Skill 的真实影响，形成持续创作动力。

### 为什么优先

当前创作者上传 Skill 后几乎没有任何反馈。审核通过后不知道、被下载了不知道、被评分了不知道。这是创作者流失的直接原因。

---

### 2.1.1 我的投稿状态页 `/me/submissions`

**产品逻辑**
- 用户查看自己所有投稿的状态：待审核 / 已上架 / 已拒绝（含拒绝理由）
- 已上架的 Skill 显示下载数、收益积分、最新 Review 摘要

**后端**
- `SkillRepository` 新增：`findBySubmitterLinuxDoIdOrderByCreatedAtDesc()` 已有
- 新增 `SubmittedSkillStatusDTO`：含 `status`（PENDING/APPROVED/REJECTED）、`rejectionNote`、`downloadCount`、`totalEarned`、`latestReview`
- `GET /api/users/me/submissions` — 区别于 `/me/submitted-skills`（创作者仪表盘），这个专注于审核状态

**前端**
- 新页面 `MySubmissions.jsx`（路由：`/me/submissions`）
- 状态卡片：🟡 待审核 / ✅ 已上架 / ❌ 已拒绝（显示理由）
- 已上架 Skill 折叠展示：下载量趋势 + 最新 Review

---

### 2.1.2 站内通知系统

**产品逻辑**
- 轻量通知（无需邮件），右上角铃铛图标 + 未读数红点
- 触发时机：Skill 审核通过、被下载（每日汇总）、收到 Review、获得评分

**数据库**

```sql
CREATE TABLE notifications (
  id           BIGSERIAL PRIMARY KEY,
  user_id      BIGINT NOT NULL,
  type         VARCHAR(50) NOT NULL,  -- SKILL_APPROVED | SKILL_DOWNLOADED | REVIEW_RECEIVED | RATING_RECEIVED
  title        VARCHAR(200) NOT NULL,
  content      VARCHAR(500),
  link         VARCHAR(300),          -- 点击跳转的前端路由
  skill_id     BIGINT,
  is_read      BOOLEAN DEFAULT false,
  created_at   TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_notification_user_unread ON notifications(user_id, is_read, created_at DESC);
```

**后端**
- `NotificationService`：
  - `notify(userId, type, title, content, link, skillId)` — 统一发送入口
  - `markRead(userId, notificationId)` — 标记已读
  - `markAllRead(userId)` — 全部已读
  - 在 `AdminController.approveSubmission()` 中调用 notify
  - 在 `PointService.creditAuthorRevenue()` 中每日汇总（或实时）notify
  - 在 `RatingService.rate()` 中调用 notify
  - 在 `ReviewService.createReview()` 中调用 notify（通知被评价的 Skill 作者）
- `GET /api/notifications` — 最近 50 条，按时间倒序
- `GET /api/notifications/unread-count` — 未读数（Header 轮询用，5秒一次）
- `POST /api/notifications/read` — 标记已读（批量）

**前端**
- `Header.jsx` 铃铛图标：未读数红点，点击展开通知面板
- 通知面板：最近通知列表，每条含图标 + 标题 + 时间 + 跳转链接
- 「全部标记已读」按钮
- `App.jsx` 加路由 `/me/notifications`（全部通知页）

---

### 2.1.3 创作者数据增强

在 `/me/skills`（创作者仪表盘）新增：
- **收益趋势图**：近 30 天每日收益积分折线图（用 recharts）
- **下载分布**：各 Skill 下载占比饼图
- **最新 Reviews 摘要**：每个 Skill 最新一条 Review

---

## v2.2 — 资产感强化（预计 1.5 周）

> **战略目标**：让用户「看得见」自己的 AI 资产，并愿意向他人展示。

### 2.2.1 用户自建 Collection（专题集）

**产品逻辑**
- 用户将多个 Skill 组合成专题集（如「我的销售 AI 工具包」「写作必备套件」）
- Collection 可设为公开/私密
- 公开 Collection 可被其他用户访问、收藏、fork

**数据库**

```sql
CREATE TABLE collections (
  id           BIGSERIAL PRIMARY KEY,
  user_id      BIGINT NOT NULL,
  title        VARCHAR(200) NOT NULL,
  description  TEXT,
  icon_emoji   VARCHAR(10),
  is_public    BOOLEAN DEFAULT true,
  skill_count  INTEGER DEFAULT 0,       -- 冗余字段，快速展示
  view_count   INTEGER DEFAULT 0,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
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

**后端**
- `CollectionController`（`/api/collections/**`）：CRUD + 添加/移除 Skill
- `GET /api/collections?userId=` — 用户的公开 Collection
- `POST /api/collections/{id}/fork` — Fork 他人 Collection 到自己名下

**前端**
- `Collections.jsx`（`/collections`）— 浏览公开 Collection
- `CollectionDetail.jsx`（`/collections/:id`）— Collection 详情 + 所含 Skill 网格
- 个人主页 `/u/:username` 新增「我的专题」区块
- Skill 详情页「添加到专题」按钮

---

### 2.2.2 可分享技能卡片

**产品逻辑**
- 每个 Skill 生成专属分享图（OG Image）
- 内容：Skill emoji + 名称 + 分类 + 平台品牌
- 用于分享到 Linux.do、微信、X 等社区，带来外部流量

**实现方案**
- 后端：`GET /api/skills/{slug}/og-image` → 使用 Java AWT 或模板 HTML → Puppeteer 截图
- 简化方案：前端动态生成 Canvas 图片并提供下载（无需后端）
- `<meta property="og:image">` 标签注入（Nginx 层 SSR 或 Vite SSR）

**前端**
- Skill 详情页「分享」按钮 → 弹窗展示预览卡片 + 复制链接/下载图片

---

### 2.2.3 个人主页资产墙优化

在 `/u/:username` 公开主页：
- 已购 + 自制 Skill 统一展示为「资产图谱」（Masonry 或六边形网格）
- 用户可设置展示哪些 Skill（隐私控制）
- 新增「活动时间线」：最近购买、发布、获得 Review 的动态记录

---

## v2.3 — 增长飞轮（预计 1 周）

> **战略目标**：从依赖外部导流转向用户自驱增长。

### 2.3.1 邀请码系统

**产品逻辑**
- 每个用户有唯一邀请码（`/invite/[code]`）
- 新用户通过邀请链接注册 → 双方各得 50 积分
- 邀请记录可在个人中心查看

**数据库**

```sql
CREATE TABLE invite_codes (
  id           BIGSERIAL PRIMARY KEY,
  inviter_id   BIGINT NOT NULL,
  code         VARCHAR(20) UNIQUE NOT NULL,
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE invite_records (
  id           BIGSERIAL PRIMARY KEY,
  inviter_id   BIGINT NOT NULL,
  invitee_id   BIGINT NOT NULL,
  code         VARCHAR(20) NOT NULL,
  reward_granted BOOLEAN DEFAULT false,
  created_at   TIMESTAMP DEFAULT NOW()
);
```

**后端**
- `InviteService`：生成邀请码、注册时校验邀请码、发放双向奖励
- OAuth2 回调时从 Cookie/Session 读取邀请码参数
- `PointTransactionType` 新增 `INVITE_REWARD`

**前端**
- `/me/invite` — 我的邀请页：邀请码 + 一键复制链接 + 邀请记录列表
- Header 用户菜单新增「邀请好友」入口

---

### 2.3.2 Skill 限时促销

**产品逻辑**
- 创作者/管理员可对 Skill 设置促销期：折扣价格 + 截止时间 + 限量份数
- 详情页显示倒计时和剩余份数，制造紧迫感

**数据库**

```sql
CREATE TABLE skill_promotions (
  id              BIGSERIAL PRIMARY KEY,
  skill_id        BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  original_price  INTEGER NOT NULL,
  promo_price     INTEGER NOT NULL,
  max_quantity    INTEGER,              -- NULL = 不限量
  sold_count      INTEGER DEFAULT 0,
  starts_at       TIMESTAMP NOT NULL,
  ends_at         TIMESTAMP NOT NULL,
  is_active       BOOLEAN DEFAULT true,
  created_by      BIGINT,              -- 管理员或创作者 ID
  created_at      TIMESTAMP DEFAULT NOW()
);
```

**后端**
- 下载时检查是否有进行中的促销，动态返回 `effectivePrice`
- `SkillDTO` 新增 `promotionInfo`（当前促销信息）
- `POST /api/admin/skills/{id}/promotion` — 设置促销
- 定时任务：过期促销自动标记 `is_active=false`

**前端**
- Skill 详情页：促销价格（划线原价 + 促销价 + 倒计时）
- Skill 列表卡片：促销标签（「限时特惠」红色角标）
- Admin 后台：Skills 管理新增「设置促销」按钮

---

## v3.0 — AI 原生（长期规划）

> **战略目标**：平台本身成为 AI 生产力的一部分，而不仅是分发渠道。

### 3.1 AI 辅助内容生成

- 上传 Skill 后，调用 Claude API 自动生成：
  - `shortDescription`（50字以内精准描述）
  - 标签推荐（从 Skill 内容提炼 3-5 个标签）
  - 使用场景建议（供填写 Review 时参考）

**后端**
- `AiEnrichmentService`：接入 Anthropic API，输入 SKILL.md 内容，输出结构化 JSON
- 在 `SkillSubmissionService` 上传成功后异步调用（不阻塞上传流程）
- `POST /api/admin/skills/{id}/ai-enrich` — 管理员手动触发

---

### 3.2 Skill 版本管理

- Skill 更新时记录版本历史（`skill_versions` 表）
- 已购买用户收到更新通知（通知系统）
- 详情页展示版本历史（更新日志）

---

### 3.3 Skill Bundle 打包销售

- 多个 Skill 组成套餐，折扣定价
- 购买 Bundle = 同时获得所有包含 Skill 的下载权限
- 创作者可跨人合作创建 Bundle（收益按比例分成）

---

### 3.4 积分充值与转账

- 积分充值：法币 → 积分（对接支付宝/微信支付）
- 积分转账：用户间互赠（每日上限 500 积分，防刷）
- 积分过期：180 天未活动，每月余额缩减 5%（激活留存）

---

## 任务清单

### v2.0（社区信任层）

**后端**
- [ ] `SkillReview` 实体 + `SkillReviewRepository`
- [ ] `ReviewService`（写 Review、投票、删除、积分奖励）
- [ ] Review 相关 REST 接口（5个）
- [ ] `PointTransactionType.REVIEW_REWARD` 枚举值
- [ ] `LeaderboardController` 支持 `period` 参数
- [ ] `SkillRepository` 时间窗口聚合查询

**前端**
- [ ] `SkillDetail.jsx` 新增 Review 区块（列表 + 写 Review 表单）
- [ ] Review 「有帮助」交互
- [ ] `Leaderboard.jsx` 时间段切换（周/月/全时）
- [ ] 排名变化指示器

### v2.1（创作者反馈闭环）

**后端**
- [ ] `Notification` 实体 + `NotificationRepository`
- [ ] `NotificationService`（通知触发、已读标记）
- [ ] 在 approve/rate/review 流程中植入通知调用
- [ ] `GET /api/notifications` + `GET /api/notifications/unread-count`
- [ ] `GET /api/users/me/submissions`（带状态字段）

**前端**
- [ ] `Header.jsx` 铃铛图标 + 通知面板
- [ ] `MySubmissions.jsx`（`/me/submissions`）
- [ ] 收益趋势图（recharts）
- [ ] App.jsx 路由 `/me/submissions`

### v2.2（资产感强化）

**后端**
- [ ] `Collection` 实体 + `CollectionSkill` + 相关 Repository
- [ ] `CollectionController`（CRUD + Fork）
- [ ] `SkillController` 新增「添加到专题」接口

**前端**
- [ ] `Collections.jsx`（`/collections`）
- [ ] `CollectionDetail.jsx`（`/collections/:id`）
- [ ] 个人主页专题区块
- [ ] Skill 详情页「添加到专题」按钮
- [ ] 分享卡片生成（Canvas）

### v2.3（增长飞轮）

**后端**
- [ ] `InviteCode` + `InviteRecord` 实体
- [ ] `InviteService` + OAuth2 回调邀请码处理
- [ ] `SkillPromotion` 实体 + 促销价格动态计算
- [ ] 促销过期定时任务
- [ ] Admin 设置促销接口

**前端**
- [ ] `MyInvite.jsx`（`/me/invite`）
- [ ] Header 用户菜单「邀请好友」入口
- [ ] Skill 详情页促销倒计时组件
- [ ] Skill 列表卡片促销角标

---

## 成功指标

| 版本 | 核心指标 | 目标 |
|------|---------|------|
| v2.0 | 每 Skill 平均 Review 数 | ≥ 1 条/月 |
| v2.0 | 有 Review 的 Skill 转化率提升 | +30% |
| v2.1 | 创作者 30 天留存率 | ≥ 60% |
| v2.1 | 通知打开率 | ≥ 40% |
| v2.2 | Collection 创建数 | ≥ 5个/周 |
| v2.2 | 个人主页访问深度（PV/UV） | ≥ 3 页 |
| v2.3 | 邀请带来新用户占比 | ≥ 20% |
| v2.3 | 促销期间 Skill 下载量提升 | +50% |
