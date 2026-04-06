# Skill Atlas — 个人 AI 数字资产平台 产品设计

## 一、产品定位重构

> **Skill Atlas 是一个以「AI 能力资产化」为核心的数字市场。**
> 你拥有的 Skill 不是普通文件，它是你在 AI 时代的能力凭证、数字资产、身份名片。

### 与竞品的本质区别

| 维度 | 普通 Skill 市场 | Skill Atlas 定位 |
|------|----------------|-----------------|
| 用户关系 | 浏览者 | 资产持有者 |
| 内容属性 | 文件下载 | 数字资产所有权 |
| 价值来源 | 功能实用性 | 实用性 × 稀缺性 × 社区认可度 |
| 创作者激励 | 无 | 积分收益 + 声誉 |
| 用户身份 | 匿名访客 | 有等级的 AI 生产力持有者 |

---

## 二、核心用户画像

### A. 探索者（Seeker）
- 想找某个场景的 AI 能力，不知道从哪里找
- 诉求：**发现 → 评估 → 低成本试用**
- 路径：首页 → 分类浏览 → 查看详情 → 1积分试用

### B. 收藏家（Collector）
- 把构建自己的 Skill 库视作一种成就感
- 诉求：**收藏 → 组合 → 展示自己的 AI 工具箱**
- 路径：持续积累收藏 → 个人主页展示 Skill 图谱

### C. 创作者（Creator）
- 有自制 Skill 想分享/变现
- 诉求：**上传 → 被发现 → 赚取积分收益**
- 路径：提交 → 审核 → 发布 → 获得下载积分分成

### D. 重度玩家（Power User）
- 每天签到、参与评分、写 Review
- 诉求：**等级特权 → 影响社区 → 平台话语权**
- 路径：积分运营 → 升级 → 获得早期访问资格 → 成为 Curator

---

## 三、积分经济设计

### 3.1 积分获取（Supply）

| 行为 | 积分 | 频率上限 |
|------|------|---------|
| 新用户注册 | +100 | 一次 |
| 每日签到 | +5 | 每日 |
| 连签 7 天额外奖励 | +30 | 每周 |
| 连签 30 天额外奖励 | +200 | 每月 |
| 首次上传 Skill（通过审核） | +200 | 一次 |
| 我上传的 Skill 被下载 | +分成比例 × 售价 | 每次触发 |
| 我的 Skill 获得 5 星评分 | +10 | 每次触发 |
| 我评分/写 Review | +2 | 每日上限 10 |
| 邀请新用户注册 | +50 | 每人一次 |
| 管理员手动发放 | 任意 | 手动 |

### 3.2 积分消耗（Demand）

| 行为 | 积分 |
|------|------|
| 下载收费 Skill | - pricePoints（由作者/管理员定价） |
| 免费 Skill | 0 积分 |
| 提交 Skill 至平台（保证质量） | -10（通过审核后退回） |

### 3.3 积分定价策略（Skill 定价参考）

| 类型 | 积分区间 | 说明 |
|------|---------|------|
| 免费 Skill | 0 | 基础工具、入门级 |
| 轻量 Skill | 5~20 | 单一功能、简洁实用 |
| 专业 Skill | 20~100 | 多步骤、专业场景 |
| 精品 Skill | 100~500 | 独家、高质量、稀缺 |
| 限量 Skill | 作者自定义 | 限时限量，价值由市场决定 |

### 3.4 分成模型

- 作者分成：下载积分 × **70%**
- 平台留存：下载积分 × **30%**（用于运营奖励池、活动）
- 分成实时结算，记入积分余额

---

## 四、等级体系设计

### 4.1 等级划分

| 等级 | 名称 | 解锁条件 | 特权 |
|------|------|---------|------|
| Lv.0 | 访客 | 未登录 | 浏览、试读简介 |
| Lv.1 | 探索者 | 登录 | 免费 Skill 下载、评分 |
| Lv.2 | 学徒 | 累计消费 50 积分 | 上传 Skill、个人主页 |
| Lv.3 | 工匠 | 上传 3+ Skill 或消费 300+ | 优先审核、Skill 标记推荐资格 |
| Lv.4 | 专家 | 累计积分收益 1000+ | 参与 Curator 评审、积分加成 × 1.2 |
| Lv.5 | 大师 | 社区顶级贡献者（管理员认定） | 平台 co-creator 资格 |

等级计算公式：
```
level_score = 消费积分 × 0.5 + 获得积分(来自下载分成) × 1.0 + 上传Skill数 × 50 + 评分数 × 2
```

---

## 五、产品功能迭代路线

### ✅ v1.2 — 积分 & 购买系统（已完成）

- 积分流水表（point_transactions）、购买记录表（user_skill_purchases）
- PointService：签到（含连签 7/30 天奖励）、下载扣积分、余额管理
- 作者收益分成（70%，实时结算）、首次评分奖励（+2 积分）
- 新用户注册礼包（+100 积分）、上架奖励（+200 积分）
- 前端：Header 积分余额、签到入口、积分流水页 `/me/points`、购买确认弹窗

---

### ✅ v1.3 — 创作者工具（已完成）

- ZIP 投稿上传（自动解析 SKILL.md frontmatter 入库）
- 用户上传 Skill 默认 `verified=false`，管理员审核后公开
- 创作者仪表盘 `/me/skills`：投稿列表、下载数、收益积分
- Admin 投稿审核队列（红点角标 + 通过/拒绝操作）

---

### ✅ v1.4 — 个人主页 & 排行榜（已完成）

- `/u/:username` 公开个人主页：等级徽章、成就系统、已投稿 Skill 展示
- `/leaderboard` 排行榜：技能榜（下载/热度）、用户榜（积分/消费/连签）
- Header 导航更新，支持公开链接分享

---

### 🔄 v2.0 — 社区信任层（当前迭代）

**核心诉求：补上「社区认可度」这条腿 — 价值 = 实用性 × 稀缺性 × 社区认可度**

**2.0.1 Skill Review 系统（核心）**
- 用户对已购/已下载 Skill 写图文长评（区别于纯星评）
- 每条 Review 含：标题、正文（Markdown）、使用场景标签
- 「有帮助」点赞机制，按点赞数倒序展示优质评价
- 写 Review 获 +5 积分奖励（每个 Skill 限一次）
- 管理员可删除违规 Review

**2.0.2 时间窗口热榜（周榜/月榜）**
- 排行榜支持 `period=week|month|all` 参数
- 按时间窗口内下载量增量排序，给新 Skill 曝光机会
- 前端排行榜新增时间段切换 + 排名变化指示器（↑↓ NEW）

**2.0.3 Review 影响排名**
- Skill 综合评分 = 星评均分 × 0.6 + Review 数量权重 × 0.2 + 有帮助数权重 × 0.2
- 搜索/浏览支持「综合评分」排序

**新增积分规则**

| 行为 | 积分 | 频率上限 |
|------|------|---------|
| 写 Skill Review | +5 | 每个 Skill 限一次 |

---

### 📋 v2.1 — 创作者反馈闭环（下一迭代）

**核心诉求：让创作者看到自己 Skill 的真实影响，形成持续创作动力**

- 站内通知系统（铃铛图标）：审核通过、被下载、收到 Review、获得评分
- `/me/submissions` 投稿状态页：待审核 / 已上架 / 被拒绝（含理由）
- 创作者仪表盘增加：近 30 天收益趋势图、最新 Reviews 摘要

---

### 📋 v2.2 — 资产感强化

**核心诉求：让 AI 资产「看得见、秀得出去」**

- 用户自建 Collection 专题集（`/collections/:id`）：组合多个 Skill 并公开分享
- 可分享技能卡片（Canvas 生成 OG 图，适合发布到社区）
- 个人主页「资产图谱」视觉升级 + 活动时间线

---

### 📋 v2.3 — 增长飞轮

**核心诉求：从外部导流转向用户自驱增长**

- 邀请码系统（`/me/invite`）：邀请新用户双方各得 50 积分
- Skill 限时促销：创作者设折扣期 + 限量份数，详情页倒计时
- Skill Bundle 打包销售（组合定价）

---

### 📋 v3.0 — AI 原生（长期）

**核心诉求：平台本身成为 AI 生产力的一部分**

- AI 辅助生成 Skill 描述（接入 Claude API，自动填写 shortDescription + 标签）
- Skill 版本管理（更新通知已购用户）
- Skill 沙盒测试（提交后自动在受控环境验证）
- Skill 兼容性矩阵（记录在哪些 AI 工具上验证过）
- 智能推荐 2.0（基于你已有 Skill 推荐协同 Skill）
- Skill 版本管理（更新时通知已购用户）
- Skill API 化（通过 API Key 直接调用他人 Skill）

---

## 六、当前最关键的 3 件事

### 优先级排序

**P0 — 先跑通积分消费闭环**

下载扣积分 → 积分流水 → 余额显示

这是整个资产化叙事的基础。没有这个，所有功能都没有意义。

**P1 — 给用户「赚积分」的理由**

签到 + 上传奖励 + 被下载分成

让用户留下来、贡献内容，形成供给侧正循环。

**P2 — 让用户看到自己的「资产」**

个人主页 + 积分流水 + 已购列表

资产感的核心不是有多少，而是**看得见**。

---

## 七、关键数据库设计

```sql
-- 积分流水（每笔进出）
CREATE TABLE point_ledger (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT NOT NULL,
  delta         INTEGER NOT NULL,          -- 正=收入, 负=支出
  balance_after INTEGER NOT NULL,          -- 操作后余额快照
  type          VARCHAR(50) NOT NULL,      -- CHECK_IN / PURCHASE / EARN_FROM_DOWNLOAD / ADMIN_GRANT ...
  skill_id      BIGINT,                    -- 关联的 Skill（若有）
  remark        VARCHAR(200),
  created_at    TIMESTAMP DEFAULT NOW()
);

-- 购买记录
CREATE TABLE skill_purchases (
  id            BIGSERIAL PRIMARY KEY,
  buyer_user_id BIGINT NOT NULL,
  skill_id      BIGINT NOT NULL,
  points_paid   INTEGER NOT NULL,
  created_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE (buyer_user_id, skill_id)         -- 每人每 Skill 只能买一次
);

-- Skill 表新增字段
ALTER TABLE skills ADD COLUMN price_points  INTEGER DEFAULT 0;   -- 0=免费
ALTER TABLE skills ADD COLUMN creator_id    BIGINT;              -- 上传者 userId
ALTER TABLE skills ADD COLUMN is_community  BOOLEAN DEFAULT false; -- 社区投稿

-- 提交审核队列
CREATE TABLE skill_submissions (
  id             BIGSERIAL PRIMARY KEY,
  submitter_id   BIGINT NOT NULL,
  skill_id       BIGINT,                   -- 审核通过后填入
  package_path   VARCHAR(500),             -- zip 文件路径
  parsed_name    VARCHAR(200),
  parsed_desc    TEXT,
  price_points   INTEGER DEFAULT 0,
  status         VARCHAR(20) DEFAULT 'PENDING',  -- PENDING / APPROVED / REJECTED
  reviewer_note  VARCHAR(500),
  created_at     TIMESTAMP DEFAULT NOW(),
  reviewed_at    TIMESTAMP
);
```

---

## 八、前端页面地图（完整）

```
/                     首页（行业地图 + 积分入口）
/skills               技能市场（筛选 + 积分定价展示）
/skills/:slug         技能详情（购买按钮 + 积分余额提示）
/me/dashboard         我的工作台（资产概览）
/me/points            积分流水 & 签到
/me/favorites         收藏列表
/me/purchases         已购 Skill
/me/skills            我发布的 Skill + 收益
/me/submissions       我提交的审核中 Skill
/submit               上传 Skill
/u/:username          公开个人主页
/leaderboard          积分榜 / 贡献榜
/admin                管理后台（含 Submissions 审核标签）
```
