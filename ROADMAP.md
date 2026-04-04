# Skill Atlas — 版本迭代路线图

> 当前状态：**v0.9 Beta**（核心功能完整，可部署）
> 技术栈：Spring Boot 3.4.7 / JDK 21 / PostgreSQL / React 18 / Vite / TailwindCSS / Docker

---

## 现有功能清单（v0.9 已完成）

| 模块 | 功能 |
|------|------|
| 爬取系统 | 递归扫描 SKILL.md、YAML frontmatter 解析、定时爬取、多路径挂载 |
| 分类体系 | 12 个行业分类 / 3 大分组、关键词自动归类、emoji 图标 |
| 浏览 & 搜索 | 关键词搜索、分类筛选、4 种排序、分页、相关推荐 |
| 热度追踪 | 点击数、下载数、热门榜、下载榜、精选榜、最新榜 |
| 认证体系 | Linux.do OAuth2、JWT、固定账密 Admin 登录、登录后才能下载 |
| 管理后台 | Skills 管理（精选/验证/删除）、用户管理（Admin 切换）、爬取触发 |
| 工程化 | Docker Compose 一键部署、nginx 反代、PostgreSQL 健康检查 |

---

## v1.0 — 生产就绪版（打磨期，预计 1-2 周）

> 目标：把现有功能做扎实，可以正式对外开放。

### 🔧 性能与稳定性

- [ ] **后端接口缓存**
  - `/api/skills/trending`、`/api/skills/featured`、`/api/skills/stats` 加 5 分钟 Spring Cache
  - 爬取/修改后主动清除对应缓存
- [ ] **数据库索引优化**
  - `skills.click_count`、`skills.download_count`、`skills.category_id`、`skills.slug` 加索引
  - `skill_tags.tag` 加索引（支持标签搜索）
- [ ] **前端分包优化**
  - Vite 配置 `manualChunks`：react-vendor、markdown、icons 分包
  - 图片懒加载（用户头像、分类 icon）

### 🔍 搜索体验提升

- [ ] **搜索防抖**：搜索框输入 300ms 后自动触发，无需手动点按钮
- [ ] **全文搜索扩展**：现在只搜 name/description，扩展到 tags、author、origin
- [ ] **搜索高亮**：结果列表中匹配关键词高亮显示
- [ ] **热门搜索词**：搜索框聚焦时展示 Top 10 热搜词（后端记录搜索词频率）

### 🛠 Admin 增强

- [ ] **Admin Skills 内联编辑**：直接在列表里修改 name、emoji、shortDescription，不跳页
- [ ] **批量操作**：多选 + 批量精选 / 批量验证 / 批量删除
- [ ] **爬取日志**：爬取历史记录表，显示每次爬取时间、结果、来源路径
- [ ] **操作审计日志**：Admin 操作（删除、修改权限）记录到 `audit_logs` 表

### 🐛 已知 Bug 修复

- [ ] Skills 列表分页超过 8 页时页码显示截断，需要省略号分页组件
- [ ] 移动端 Admin 表格横向滚动体验差，需要响应式优化
- [ ] 首页统计数字初始为 0 时闪烁问题

---

## v1.1 — 用户互动版（预计 2-3 周）

> 目标：让登录用户能与平台内容产生真实互动。

### ⭐ 收藏系统

**后端**
```
POST   /api/skills/{id}/favorite     — 收藏 / 取消收藏（toggle）
GET    /api/users/me/favorites       — 我的收藏列表（分页）
```

**数据模型**
```sql
CREATE TABLE user_favorites (
  user_id   BIGINT REFERENCES users(id),
  skill_id  BIGINT REFERENCES skills(id),
  created_at TIMESTAMP,
  PRIMARY KEY (user_id, skill_id)
);
```

**前端**
- SkillCard 右上角添加收藏按钮（心形图标）
- 个人中心页 `/me/favorites` 展示收藏列表
- Header 用户下拉菜单加入「我的收藏」入口

### 📊 评分系统

**后端**
```
POST   /api/skills/{id}/rate         — 打分（1-5 星，每人只能打一次，可修改）
GET    /api/skills/{id}/rating       — 获取评分统计（平均分、人数）
```

**数据模型**
```sql
CREATE TABLE skill_ratings (
  user_id    BIGINT REFERENCES users(id),
  skill_id   BIGINT REFERENCES skills(id),
  score      SMALLINT CHECK (score BETWEEN 1 AND 5),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  PRIMARY KEY (user_id, skill_id)
);
```

**Skill 模型新增字段**
- `avgRating DECIMAL(2,1)` — 平均分（异步维护）
- `ratingCount INT` — 打分人数

**前端**
- SkillDetail 侧边栏加 5 星评分组件
- SkillCard 底部显示评分（★ 4.2 · 38人）

### 💬 评论系统（轻量版）

**后端**
```
POST   /api/skills/{id}/comments     — 发布评论（登录用户）
GET    /api/skills/{id}/comments     — 获取评论列表（分页）
DELETE /api/comments/{id}            — 删除自己的评论
DELETE /api/admin/comments/{id}      — Admin 删除任意评论
```

**数据模型**
```sql
CREATE TABLE comments (
  id         BIGSERIAL PRIMARY KEY,
  skill_id   BIGINT REFERENCES skills(id),
  user_id    BIGINT REFERENCES users(id),
  content    TEXT NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**前端**
- SkillDetail 下方加评论区（Markdown 支持）
- 评论需 trust_level ≥ 1（防机器人）

---

## v1.2 — 内容生态版（预计 2-3 周）

> 目标：让社区用户也能贡献内容，形成内容生态。

### 📝 用户提交 Skill

**后端**
```
POST   /api/skills/submit            — 提交新 Skill（填写表单）
GET    /api/admin/submissions        — Admin 查看待审核列表
POST   /api/admin/submissions/{id}/approve  — 审核通过（发布）
POST   /api/admin/submissions/{id}/reject   — 拒绝（附原因）
```

**数据模型**
- `submissions` 表：记录提交内容、提交人、状态（pending/approved/rejected）
- 审核通过后自动创建 Skill 记录

**前端**
- `/submit` 页面：Skill 提交表单（名称、描述、分类、标签、Markdown 内容）
- 实时 Markdown 预览
- 提交后状态跟踪（我的提交）

### 🏷 标签增强

- [ ] 标签云页面 `/tags`：展示所有标签及使用频率
- [ ] 点击标签跳转到对应搜索结果
- [ ] Admin 可以合并/重命名标签
- [ ] 后端新增 `/api/skills/by-tag/{tag}` 接口

### 👤 用户主页

**后端**
```
GET    /api/users/{username}         — 公开用户信息（头像、简介、统计）
GET    /api/users/{username}/favorites  — 公开收藏列表
```

**前端**
- `/u/{username}` 用户主页
- 展示：头像、Linux.do 信息、收藏的 Skills、发布/提交历史

---

## v2.0 — 数据洞察版（预计 3-4 周）

> 目标：为管理员和用户提供数据驱动的洞察能力。

### 📈 趋势分析

**后端**
- 新增 `skill_events` 时间序列表，记录每次点击/下载的时间戳
- 新增接口：`/api/skills/{id}/trend?days=7` 返回每日点击/下载曲线数据

**数据模型**
```sql
CREATE TABLE skill_events (
  id         BIGSERIAL PRIMARY KEY,
  skill_id   BIGINT REFERENCES skills(id),
  event_type VARCHAR(20),   -- 'click' | 'download'
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX ON skill_events (skill_id, event_type, created_at);
```

**前端**
- SkillDetail 加「趋势图表」区块（Recharts 折线图）
- 支持 7 天 / 30 天 / 90 天 切换

### 📊 Admin 数据看板

- [ ] 替换原有简单统计，改为可视化 Dashboard
- [ ] 日活 / 周活用户趋势（折线图）
- [ ] 分类分布占比（饼图）
- [ ] 每日新增 Skills / 下载量（柱状图）
- [ ] 实时热搜词 Top 20（词云）

### 🔍 搜索词分析

**后端**
- `search_logs` 表：记录搜索词、时间、结果数
- `/api/admin/analytics/search-terms` — 热词统计接口

---

## v2.1 — 社区功能版（预计 3-4 周）

> 目标：增强平台社交属性，提升用户粘性。

### 👥 关注系统

```
POST   /api/users/{username}/follow     — 关注/取消关注
GET    /api/users/me/following          — 我关注的人
GET    /api/users/me/followers          — 关注我的人
GET    /api/feed                        — 关注的人的动态（收藏了哪些 Skill）
```

### 📢 站内通知

```
GET    /api/notifications               — 我的通知列表
POST   /api/notifications/read-all     — 全部标为已读
```

**通知触发场景**
- 有人评论了你收藏的 Skill
- 你提交的 Skill 审核通过/拒绝
- 有新 Skill 被加入你关注的分类

**前端**
- Header 铃铛图标 + 红点 badge
- 通知下拉面板

### 🏆 成就系统（轻量版）

- 徽章：首次登录、首次收藏、首次评论、发布 10 个 Skill
- 用户主页展示获得的徽章

---

## v3.0 — 平台开放版（长期规划）

> 目标：开放 API，让 Skill Atlas 成为 AI Agent 生态的基础设施。

### 🔌 开放 API

- API Key 管理（用户可以申请 API Key）
- 公开 REST API 文档（Swagger UI 对外开放）
- 速率限制（免费 100 次/天，Premium 无限制）
- Webhook：Skill 上线/更新时触发回调

**核心接口**
```
GET  /api/v1/skills              — 公开 Skills 列表
GET  /api/v1/skills/{slug}       — 技能详情
GET  /api/v1/categories          — 分类列表
POST /api/v1/skills/search       — 语义搜索（接入向量数据库）
```

### 🔎 语义搜索

- 接入 OpenAI Embedding 或本地模型（Ollama）
- Skills 入库时自动生成向量
- 支持语义搜索：「我需要一个帮我写邮件的技能」→ 命中相关 Skills
- pgvector 扩展 PostgreSQL

### 🌐 多语言支持

- i18n 框架接入（react-i18next）
- 支持：中文（已有）/ 英文
- Skill 名称、描述支持多语言版本

### 📦 Skill 版本管理

- Skills 支持版本号（v1.0 / v2.0）
- 可以查看历史版本的 SKILL.md 内容
- 变更日志（Changelog）展示

---

## 优先级矩阵

```
高价值 + 低成本 ──────── 优先做
┌─────────────────────────────────────────────────────┐
│  ⭐⭐⭐  v1.0 缓存 + 索引优化（1天，收益大）          │
│  ⭐⭐⭐  v1.0 搜索防抖（0.5天）                      │
│  ⭐⭐⭐  v1.1 收藏系统（3天，用户粘性最强）           │
│  ⭐⭐⭐  v1.0 Admin 批量操作（2天）                  │
├─────────────────────────────────────────────────────┤
│  ⭐⭐   v1.1 评分系统（3天）                         │
│  ⭐⭐   v2.0 趋势图表（4天）                         │
│  ⭐⭐   v1.2 用户提交 Skill（5天）                   │
├─────────────────────────────────────────────────────┤
│  ⭐    v2.1 关注系统（7天）                          │
│  ⭐    v3.0 语义搜索（10天+）                        │
│  ⭐    v3.0 开放 API（10天+）                        │
└─────────────────────────────────────────────────────┘
高成本 + 高价值 ──────── 按资源决定
```

---

## 技术债务清单（各版本穿插解决）

| 优先级 | 问题 | 建议方案 |
|--------|------|---------|
| 高 | 前端无 TypeScript | 逐步迁移：先 `.tsx` 新文件，再重构老文件 |
| 高 | 后端无单元测试 | JUnit 5 + Mockito，核心 Service 覆盖率 ≥ 60% |
| 中 | 无 Token 刷新机制 | 实现 Refresh Token（Redis 存储）|
| 中 | 搜索仅靠 LIKE 语句 | 接入 PostgreSQL 全文搜索 `tsvector` |
| 中 | 无 API 速率限制 | Bucket4j 或 nginx limit_req |
| 低 | Admin 无操作审计 | `audit_logs` 表记录所有写操作 |
| 低 | 无 CI/CD 流水线 | GitHub Actions：Build → Test → Docker Build → 推送 |

---

## 版本发布时间线（参考）

```
2026 Q2
  ├── 4月  v0.9 Beta → 内部测试 + Bug 修复
  ├── 5月  v1.0 生产就绪 → 正式上线
  └── 6月  v1.1 用户互动版 → 开放注册

2026 Q3
  ├── 7月  v1.2 内容生态版 → 接受社区提交
  └── 9月  v2.0 数据洞察版 → Admin 数据看板

2026 Q4
  ├── 10月 v2.1 社区功能版 → 关注 + 通知
  └── 12月 v3.0 平台开放版 → API + 语义搜索
```

---

*Skill Atlas Roadmap — 最后更新：2026-04-04*
