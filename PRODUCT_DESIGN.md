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

### v1.2 — 积分 & 购买系统（当前推进）

**后端：**
- [x] User 模型加积分字段（pointsBalance, totalPointsSpent）
- [x] 签到系统（checkInStreakDays）
- [ ] PointLedger 积分流水表（每笔进出都记录）
- [ ] SkillPurchase 购买记录表
- [ ] PointService（充值、消费、查余额、签到）
- [ ] 下载时扣积分逻辑（SkillController）
- [ ] Skill 表加 pricePoints 字段 + 作者 userId

**前端：**
- [x] SkillCard 显示积分定价
- [ ] 积分余额显示（Header 右上角）
- [ ] 下载时积分确认弹窗
- [ ] 签到入口 + 连签动画
- [ ] 积分流水页面 `/me/points`

---

### v1.3 — 创作者工具（2 周）

**核心诉求：让 Skill 提交变得简单、让创作者有成就感**

**功能：**
- Skill 上传 (zip 包 → 自动解析 SKILL.md frontmatter)
- 上传表单：定价、分类、描述补充
- 我的发布页 `/me/skills` — 查看自己上传的 Skill 及每份收益
- 创作者数据面板：总下载数、总收益积分、评分趋势
- 管理员审核队列（Admin 增加 submissions tab）

**数据流：**
```
用户上传 zip → 解析 SKILL.md → 存入 skill_submissions →
管理员审核通过 → 写入 skills 表 → 通知用户 → 开始销售
```

---

### v1.4 — 个人主页（1 周）

**核心诉求：你的 Skill 收藏 = 你的 AI 能力名片**

**功能：**
- `/u/:username` 公开个人主页
- 展示：等级徽章 / 持有 Skill 数 / 发布 Skill 数 / 加入时间
- Skill 资产墙：已购 + 自制 Skill 的视觉展示
- 活动时间线：最近购买、发布、评分记录（可设置隐私）
- 成就徽章系统（首次购买、首次发布、连签 30 天等）

---

### v2.0 — 社区化（3 周）

**核心诉求：Skill 的价值由社区共同定义**

**功能：**
- Skill Review（长评论，带截图，区别于纯星评）
- "有帮助" 点赞系统（好评加权影响排名）
- Skill Collection（用户自建专题集，如「销售场景 Skill 包」）
- 官方精选 Collection（编辑推荐）
- Skill 热榜：周榜 / 月榜 / 全时榜（含收益大排行）
- 用户成就 Feed（你关注的人最新发布了...）

---

### v2.1 — 市场化（4 周）

**核心诉求：积分不只是消耗品，而是有流通价值的资产**

**功能：**
- 积分充值（法币 → 积分，可选）
- 积分转账（用户间互赠，有上限防刷）
- Skill 限时促销（创作者自设折扣期、限量份数）
- Skill Bundle（打包销售，折扣定价）
- 早鸟价（首 N 名购买者享受折扣）
- 积分过期机制（超 180 天未活动，余额每月缩减 5%）

---

### v3.0 — AI 原生（长期）

**核心诉求：平台本身成为 AI 生产力的一部分**

**功能：**
- Skill 沙盒测试（提交 Skill 后自动在受控环境执行验证）
- AI 辅助写 Skill 描述（GPT/Claude 生成 shortDescription、标签）
- Skill 兼容性矩阵（这个 Skill 在哪些 AI 工具上验证过）
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
