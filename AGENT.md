# Skill Atlas — Agent 工作手册

> 本文件供 AI Agent（Claude 等）在参与本项目开发时遵循。
> 每次进入项目前，必须先阅读本文件。

---

## 一、强制工作规范

### 📌 规则 1：每次版本迭代后，必须同步更新设计文档

完成一个版本迭代（无论大小）后，**必须**同步更新以下两份文档：

| 文档 | 内容 | 更新时机 |
|------|------|---------|
| `PRODUCT_DESIGN.md` | 产品功能、积分规则、页面地图、迭代路线 | 新增/修改产品功能后 |
| `BACKEND_DESIGN.md` | 数据模型、API 接口、服务逻辑、环境变量 | 新增/修改数据表、接口、服务后 |

**更新内容包括：**
- 将已完成的版本标记为 `✅`（含完成内容摘要）
- 将新版本从「待实现」移入「当前迭代」并标记为 `🔄`
- 新增数据表的 DDL、新增接口的方法/路径/权限说明
- 修改积分规则时同步更新 `PRODUCT_DESIGN.md` 第三节积分经济设计

> ⚠️ 不允许只改代码不改文档。文档是团队的集体记忆，代码会变，文档记载意图。

---

### 📌 规则 2：ITERATION_PLAN.md 是版本任务清单

`ITERATION_PLAN.md` 记录每个版本的详细任务 checklist。

- 完成一个子任务后，将 `- [ ]` 改为 `- [x]`
- 整个版本完成后，在 `PRODUCT_DESIGN.md` 和 `BACKEND_DESIGN.md` 中完成同步

---

### 📌 规则 3：新功能开发流程

```
1. 读 PRODUCT_DESIGN.md — 理解产品意图
2. 读 BACKEND_DESIGN.md — 理解现有数据模型和接口
3. 读 ITERATION_PLAN.md — 找到当前版本的任务清单
4. 开发（后端先行：Model → Repository → Service → Controller → DTO）
5. 前端对接（api.js → 页面组件 → App.jsx 路由）
6. 完成后更新 PRODUCT_DESIGN.md 和 BACKEND_DESIGN.md
```

---

## 二、项目概览

**产品定位**：Skill Atlas 是以「AI 能力资产化」为核心的数字市场。每个 Skill 不是普通文件，而是用户在 AI 时代的能力凭证与数字资产。

**核心价值公式**：`价值 = 实用性 × 稀缺性 × 社区认可度`

**当前版本**：v1.4（积分体系 + 创作者工具 + 个人主页 + 排行榜已完成）

**下一版本**：v2.0（社区信任层 — Review 系统 + 时间窗口热榜）

---

## 三、后端项目介绍

### 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Spring Boot | 3.4.7 | 主框架 |
| JDK | 21 | 运行时（使用 Virtual Threads 等新特性） |
| PostgreSQL | 16 | 主数据库 |
| Caffeine | — | 本地缓存（5min TTL，500条上限） |
| Spring Security | — | JWT 认证 + RBAC 权限 |
| Spring Data JPA | — | ORM（Hibernate 6） |
| Lombok | — | 消除样板代码（@Data / @Builder） |
| Springdoc OpenAPI | — | Swagger UI 文档自动生成 |
| Docker | — | 容器化部署 |

### 工程结构

```
backend/src/main/java/com/skillplatform/
├── config/          # 安全配置、缓存配置、CORS、JWT 过滤器
├── controller/      # REST 控制器（Admin / Auth / Category / Leaderboard / Profile / Skill / User）
├── dto/             # 数据传输对象（16个 DTO）
├── exception/       # 业务异常 + 全局异常处理器
├── model/           # JPA 实体（User / Skill / Category / PointTransaction 等 8 个）
├── repository/      # Spring Data JPA 接口（含自定义 JPQL 查询）
└── service/         # 业务逻辑（PointService / UserLevelService / SkillCrawlerService 等 9 个）
```

### 认证机制

- **主要**：Linux.do OAuth2（Authorization Code Flow）→ 平台 JWT（168h 有效期）
- **备用**：固定账密（`ADMIN_USERNAME` / `ADMIN_PASSWORD`）→ 管理后台专用
- **权限**：`ROLE_USER`（默认）/ `ROLE_ADMIN`（trust_level ≥ 2 或手动设置）

### 核心服务

- **PointService** — 积分引擎：悲观锁防超扣、实时记账、作者 70% 分成
- **UserLevelService** — 等级计算：growthScore 公式，5 个等级 Tier
- **SkillCrawlerService** — 递归扫描 SKILL.md，解析 YAML frontmatter 入库
- **SkillSubmissionService** — ZIP 投稿上传，自动解析，默认 verified=false 待审核
- **RatingService** — 星评管理，首次评分触发积分奖励

### 数据库表（当前 v1.4）

`users` / `skills` / `categories` / `skill_tags` / `point_transactions` / `user_skill_purchases` / `user_favorites` / `skill_ratings`

### 关键配置项（环境变量）

详见 `BACKEND_DESIGN.md` 第八节，关键变量：
- `LINUX_DO_CLIENT_ID` / `LINUX_DO_CLIENT_SECRET` — OAuth2（必填）
- `JWT_SECRET` — 生产环境必须更换
- `DB_PASSWORD` — 数据库密码
- `AUTHOR_SHARE_RATIO` — 作者分成比例（默认 0.7）

### 本地开发

```bash
cd backend
# 需要本地 PostgreSQL，或先启动 docker compose 中的 postgres 服务
./mvnw spring-boot:run
# Swagger UI: http://localhost:8080/swagger-ui.html
```

---

## 四、前端项目介绍

### 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.3 | UI 框架 |
| Vite | 6.0 | 构建工具（dev server + 生产打包） |
| React Router | 6.27 | 客户端路由（SPA） |
| Tailwind CSS | 3.4 | 原子化 CSS |
| Axios | 1.7 | HTTP 客户端（自动附 JWT、401 自动清除 token） |
| Lucide React | 0.468 | 图标库 |
| react-markdown | 9.0 | Markdown 渲染（Skill README） |
| clsx | 2.1 | 条件 className 拼接 |

### 设计系统

深色主题，CSS 变量定义于 `src/styles/index.css`：

| Token | 值 | 用途 |
|-------|----|------|
| `--atlas-bg` | `#070d16` | 页面背景 |
| `--atlas-surface` | `#0c1521` | 卡片底色 |
| `--atlas-teal` | `#06b6d4` | 主强调色（Cyan） |
| `--atlas-ink` | `#c8d8e8` | 正文颜色 |
| `--atlas-muted` | `#4a6480` | 次要文字 |

字体：Inter（正文）/ JetBrains Mono（代码 / 数字）/ Syne（标题）

常用 CSS 组件类：`.atlas-panel`、`.atlas-panel-dark`、`.atlas-button-solid`、`.atlas-button-outline`、`.atlas-input`、`.section-kicker`、`.display-title`

### 工程结构

```
frontend/src/
├── App.jsx              # 路由表（所有页面路由集中在此）
├── main.jsx             # 应用入口，挂载 AuthContext
├── components/
│   ├── Header.jsx       # 顶部导航（含积分余额、签到、用户菜单、通知铃铛）
│   ├── Footer.jsx       # 底部
│   ├── SkillCard.jsx    # 技能卡片（列表页、首页复用）
│   └── CategoryCard.jsx # 分类卡片
├── context/
│   └── AuthContext.jsx  # 全局认证状态（user / isLoggedIn / isAdmin / loading）
├── pages/
│   ├── Home.jsx         # 首页（行业地图 + 精选 + 热门）
│   ├── Skills.jsx       # 技能市场（筛选 + 分页）
│   ├── SkillDetail.jsx  # 技能详情（购买 + 下载 + 评分 + Review）
│   ├── Leaderboard.jsx  # 排行榜（技能榜 + 用户榜，支持周/月/全时）
│   ├── UserProfile.jsx  # 公开个人主页 /u/:username
│   ├── PointsCenter.jsx # 积分中心（流水 + 签到）
│   ├── MyPurchases.jsx  # 我的已购
│   ├── MySkills.jsx     # 创作者仪表盘（我的投稿 + 收益）
│   ├── Favorites.jsx    # 我的收藏
│   ├── SubmitSkill.jsx  # 上传投稿
│   ├── Admin.jsx        # 管理后台（Skills / Users / 投稿审核 / 爬取中心）
│   ├── AdminLogin.jsx   # 管理员登录
│   ├── AuthCallback.jsx # OAuth2 回调处理
│   └── NotFound.jsx     # 404
├── services/
│   └── api.js           # 所有 API 调用（按模块导出：skillsApi / usersApi / adminApi 等）
└── utils/
    └── format.js        # formatCount / formatDate 等工具函数
```

### 路由表

| 路径 | 页面 | 权限 |
|------|------|------|
| `/` | Home | 公开 |
| `/skills` | Skills | 公开 |
| `/skills/:slug` | SkillDetail | 公开（下载需登录） |
| `/leaderboard` | Leaderboard | 公开 |
| `/u/:username` | UserProfile | 公开 |
| `/me/favorites` | Favorites | 登录 |
| `/me/points` | PointsCenter | 登录 |
| `/me/purchases` | MyPurchases | 登录 |
| `/me/skills` | MySkills | 登录 |
| `/submit` | SubmitSkill | 登录（rank ≥ 3） |
| `/admin` | Admin | ROLE_ADMIN |
| `/admin/login` | AdminLogin | 公开 |
| `/auth/callback` | AuthCallback | 公开 |

### API 层约定

所有接口调用统一从 `src/services/api.js` 导入，禁止在组件中直接使用 axios：

```js
import { skillsApi, usersApi, adminApi, leaderboardApi } from '../services/api'
```

JWT token 存储于 `localStorage`，key 为 `skill_atlas_token`，由 axios 拦截器自动附加。

### 本地开发

```bash
cd frontend
npm install
npm run dev
# 开发服务器: http://localhost:3000
# /api 请求自动代理到 http://localhost:8080
```

---

## 五、部署

```bash
# 复制环境变量模板并配置
cp .env.example .env

# 一键构建并启动（PostgreSQL + Backend + Frontend/Nginx）
docker compose up --build -d

# 查看状态
docker compose ps
docker compose logs -f backend
```

详见 `docker-compose.yml` 和 `BACKEND_DESIGN.md` 第九节。

---

## 六、设计文档索引

| 文档 | 内容 |
|------|------|
| `PRODUCT_DESIGN.md` | 产品定位、用户画像、积分经济、等级体系、功能迭代路线、页面地图 |
| `BACKEND_DESIGN.md` | 技术栈、数据模型（DDL）、DTO 设计、核心服务、API 接口总览、环境变量、部署说明 |
| `ITERATION_PLAN.md` | 各版本详细任务 checklist（含数据库设计、后端任务、前端任务、成功指标） |
| `ROADMAP.md` | 高层路线图（历史版本记录） |
| `AGENT.md` | 本文件 — Agent 工作规范 + 项目介绍 |
