# Skill Atlas 🚀

> **你的 AI 能力凭证时代来了** | *Your AI Capability Credential in the AI Era*

[![Java 21](https://img.shields.io/badge/Java-21-ED8B00?style=flat-square&logo=openjdk)](https://openjdk.java.net/)
[![Spring Boot 3.4.7](https://img.shields.io/badge/Spring%20Boot-3.4.7-6DB33F?style=flat-square&logo=spring-boot)](https://spring.io/projects/spring-boot)
[![React 18](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

## 📋 目录 | Table of Contents

- [产品愿景](#产品愿景--product-vision)
- [核心特性](#核心特性--key-features)
- [技术栈](#技术栈--tech-stack)
- [快速开始](#快速开始--quick-start)
- [系统架构](#系统架构--architecture)
- [API 概览](#api-概览--api-overview)
- [积分与等级系统](#积分与等级系统--points--levels)
- [项目结构](#项目结构--project-structure)
- [开发指南](#开发指南--development-guide)
- [贡献指南](#贡献指南--contributing)
- [许可证](#许可证--license)

---

## 产品愿景 | Product Vision

### 🎯 我们在做什么 | What We're Building

**Skill Atlas** 是一个**个人 AI 数字资产平台** (Personal AI Digital Asset Platform)，将 AI 技能（SKILL.md 文件）视为可交易的数字资产，而不仅仅是代码文件。

**Skill Atlas** is a **Personal AI Digital Asset Platform** that treats AI skills (SKILL.md files) as ownable, tradable digital assets—not just a download site, but a complete digital marketplace with a points economy, creator incentives, and reputation system.

### 核心价值主张 | Core Value Proposition

✨ **拥有你的 AI 能力** - Own your AI capabilities as digital assets
💰 **创建者激励** - Earn 70% of download revenue as a skill creator
📊 **声誉系统** - Build your reputation through contributions and ratings
🏆 **成长路径** - Progress through 5 levels from Starter to Trailblazer
🔐 **完整控制** - Full ownership with blockchain-ready architecture

---

## 核心特性 | Key Features

### 🛍️ 技能市场 | Skill Marketplace
- 📚 **自动爬取** SKILL.md 文件，自动解析 frontmatter 元数据
- 🏷️ **产业分类** - 按行业自动分类（技术、创意、商业等）
- 🔍 **全文搜索** - 关键词搜索和高级过滤
- ⭐ **评分系统** - 1-5 星评分和缓存机制
- ❤️ **收藏功能** - 标记喜爱的技能
- 📈 **相关推荐** - 基于分类的相关技能推荐

### 💎 积分经济 | Points Economy
- 🎁 **注册奖励** - 新用户 20 积分
- 📅 **日常签到** - 每日 +2 积分，7/30 天连续奖励加倍
- 📥 **下载机制** - 免费技能 0 积分，付费技能扣除对应积分
- 🎯 **投稿激励** - 提交被批准的技能 +10 积分奖励
- 💵 **创作者收益** - 每次下载获得售价的 70%

### 🏅 等级系统 | Level System

成长通过您的贡献、购买、签到来计算：

| 等级 | 成长值 | 能力解锁 |
|------|--------|---------|
| 🌟 L1 初学者 (Starter) | 0 | 基础浏览 |
| 🚀 L2 探索者 (Explorer) | 40 | 下载技能 |
| 🎯 L3 贡献者 (Contributor) | 100 | **上传 ZIP 技能包** |
| 👑 L4 策展人 (Curator) | 220 | 高级功能 |
| 🌠 L5 开拓者 (Trailblazer) | 400+ | VIP 权限 |

**成长值计算公式：**
```
Growth Score = trustLevel × 15 + checkIns × 3 + purchases × 8 + pointsSpent + submissions × 30
```

### 🔐 身份认证 | Authentication
- 🔗 **Linux.do OAuth2** - 社区集成登录
- 👤 **管理员认证** - 固定凭证后台管理
- 🔑 **JWT 令牌** - 无状态会话管理 (jjwt 0.12.6)
- ⏱️ **安全过期** - 自动令牌更新和管理

### 🎨 深科技 UI | Dark Tech Interface
- 🌙 **深色系设计** - 青色/深蓝配色系统
- ⚡ **科技感** - 现代、清爽、专业
- 📱 **响应式** - 完美适配桌面和移动设备
- ♿ **无障碍** - WCAG 2.1 标准支持

### 👨‍💼 管理后台 | Admin Dashboard
- 🔄 **手动爬取** - 触发 SKILL.md 索引更新
- 📝 **技能管理** - 编辑、精选、验证标记
- 👥 **用户管理** - 查看用户、权限、统计
- 📊 **平台统计** - 下载量、评分、活跃用户
- 🎯 **批量操作** - 高效的大规模管理

### 📦 技能提交 | Skill Submission
- 📤 **ZIP 上传** - 上传包含 SKILL.md 的技能包
- 🔍 **自动解析** - 自动解析 frontmatter 元数据
- ⚡ **自动索引** - 快速爬取并发布
- 💰 **即时奖励** - 提交成功即获得积分奖励
- 🎓 **教程集成** - 完整的提交指南

---

## 技术栈 | Tech Stack

### 🎯 后端 | Backend
```
Java 21 + Spring Boot 3.4.7
├── Spring Data JPA (数据持久化)
├── Spring Security (JWT 认证)
├── Spring Cache (Caffeine 缓存，5分钟 TTL)
├── PostgreSQL (数据存储)
├── jjwt 0.12.6 (JWT 处理)
├── Linux.do OAuth2 集成
└── Docker 部署
```

### ⚛️ 前端 | Frontend
```
React 18 + Vite (快速开发)
├── React Router v6 (客户端路由)
├── Tailwind CSS (样式系统)
├── Lucide React (图标库)
├── React Markdown (Markdown 渲染)
├── Axios (HTTP 客户端)
└── Dark Mode 主题支持
```

### 🗄️ 数据库 | Database
```
PostgreSQL 16
├── 用户与认证表
├── 技能与分类表
├── 积分与交易表
├── 评分与反馈表
├── 购买历史表
└── 优化的索引设计
```

### 🐳 部署 | Deployment
```
Docker + Docker Compose
├── 后端容器 (Spring Boot)
├── 前端容器 (Nginx)
├── PostgreSQL 容器
└── 网络隔离与卷管理
```

---

## 快速开始 | Quick Start

### 前置要求 | Prerequisites
- Docker & Docker Compose
- Git
- (可选) Java 21、Node.js 18+

### 1️⃣ 克隆项目 | Clone Repository

```bash
git clone https://github.com/your-org/skill-atlas.git
cd skill-platform
```

### 2️⃣ 配置环境 | Configure Environment

复制示例配置文件并编辑：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的配置：

```env
# 数据库配置 | Database
POSTGRES_DB=skill_atlas
POSTGRES_USER=skilluser
POSTGRES_PASSWORD=your_secure_password

# JWT 和安全 | Security
JWT_SECRET=your_very_long_secure_jwt_secret_key_min_256_bits

# OAuth2 配置 | OAuth2 (Linux.do)
LINUX_DO_CLIENT_ID=your_client_id
LINUX_DO_CLIENT_SECRET=your_client_secret
OAUTH2_REDIRECT_URI=http://localhost:3000/callback

# 应用配置 | Application
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8080

# 管理员凭证 | Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin_password
```

### 3️⃣ 启动应用 | Start Application

**Docker Compose (推荐):**

```bash
docker-compose up -d
```

等待 30 秒让 PostgreSQL 初始化...

```bash
docker-compose logs -f
```

**本地开发 (不使用 Docker):**

后端：
```bash
cd backend
mvn clean spring-boot:run
```

前端：
```bash
cd frontend
npm install
npm run dev
```

### 4️⃣ 访问应用 | Access Application

- 🌐 **前端**: http://localhost:3000
- 🔧 **后端 API**: http://localhost:8080/api
- 📚 **Swagger Docs**: http://localhost:8080/swagger-ui.html

### 5️⃣ 首次登录 | First Login

1. 点击"Linux.do 登录"进行 OAuth2 登录
2. 或使用管理员凭证：
   - 用户名: `admin`
   - 密码: 来自 `.env` 文件
3. 获得 20 积分的注册奖励！

### 📤 导入示例技能 | Import Sample Skills

```bash
# 触发爬取本地 skills-data 目录
curl -X POST http://localhost:8080/api/admin/crawl \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 系统架构 | Architecture

### 📐 高层架构 | High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     用户浏览器 | User Browser               │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS
                     ↓
┌─────────────────────────────────────────────────────────────┐
│   React 18 + Vite Frontend (Tailwind CSS, Dark Mode)        │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Home    │  │ Skills   │  │  Admin   │  │ Favorites│   │
│  │  Page    │  │  Browser │  │ Dashboard│  │  Page    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  AuthContext (JWT Token Management)                         │
│  API Service Layer (Axios)                                  │
└────────────────────┬────────────────────────────────────────┘
                     │ REST API (JSON)
                     ↓
┌─────────────────────────────────────────────────────────────┐
│    Spring Boot 3.4.7 Backend (Java 21)                      │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Controllers (REST Endpoints)                          │ │
│  │  ├── SkillController       (技能相关)                 │ │
│  │  ├── UserController        (用户相关)                 │ │
│  │  ├── AdminController       (管理功能)                 │ │
│  │  └── AuthController        (认证)                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↕                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Business Logic Services                               │ │
│  │  ├── SkillService          (技能业务)                 │ │
│  │  ├── PointService          (积分管理)                 │ │
│  │  ├── UserLevelService      (等级系统)                 │ │
│  │  ├── SkillSubmissionService (提交处理)               │ │
│  │  ├── RatingService         (评分系统)                 │ │
│  │  └── CrawlService          (爬取引擎)                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↕                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Data Persistence Layer (Spring Data JPA)             │ │
│  │  Repositories, Query Methods, Entity Mapping          │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Security Layer:                                             │
│  ├── JWT Filter (jjwt 0.12.6)                              │
│  ├── OAuth2 Integration (Linux.do)                         │
│  ├── Role-Based Access Control (RBAC)                      │
│  └── CORS Configuration                                     │
│                                                              │
│  Cache Layer:                                                │
│  └── Caffeine Cache (5min TTL on trending/featured/stats)   │
└────────────────────┬────────────────────────────────────────┘
                     │ SQL Queries
                     ↓
┌─────────────────────────────────────────────────────────────┐
│    PostgreSQL 16 Database                                   │
│                                                              │
│  Tables:                                                     │
│  ├── users (用户账户)                                      │
│  ├── skills (技能数据)                                     │
│  ├── categories (分类)                                     │
│  ├── skill_ratings (评分)                                  │
│  ├── user_favorites (收藏)                                 │
│  ├── point_transactions (积分交易)                         │
│  ├── user_purchases (购买记录)                             │
│  ├── user_checkins (签到记录)                              │
│  └── crawl_logs (爬取日志)                                 │
│                                                              │
│  Indexes on:                                                │
│  ├── click_count, download_count (热度排序)              │
│  ├── category_id (分类查询)                               │
│  └── created_at (时间排序)                                │
└─────────────────────────────────────────────────────────────┘
```

### 核心流程 | Core Workflows

#### 用户下载技能 | User Downloads Skill
```
1. 用户点击下载按钮
2. 前端请求 /api/skills/{id}/download-package
3. 后端验证 JWT 和积分余额
4. 如果是付费：扣除积分，创建购买记录
5. 返回下载链接 (包含 ?token= 参数用于直接浏览器下载)
6. 前端跳转到下载链接
7. 后端记录下载事件，更新 download_count
```

#### 用户提交技能 | User Submits Skill
```
1. 用户达到 L3 (Contributor) 等级
2. 上传包含 SKILL.md 的 ZIP 包
3. 后端自动解析 frontmatter
4. 自动爬取并索引到数据库
5. 创建 PointTransaction 记录 +10 积分
6. 技能立即发布 (或等待管理员审核)
7. 用户看到"我的提交"中的技能
```

#### 日常签到 | Daily Check-in
```
1. 用户点击"签到"按钮
2. 后端检查今天是否已签到
3. 如果未签到：+2 积分，记录到 user_checkins
4. 检查连续签到天数，触发 7/30 天连续奖励
5. 更新用户的成长值 (checkIns × 3)
6. 前端显示奖励动画
```

---

## API 概览 | API Overview

### 认证 | Authentication

```
POST /api/auth/login-url
获取 Linux.do OAuth2 登录 URL

GET /api/auth/callback?code=XXX
OAuth2 回调处理

POST /api/auth/admin-login
请求体: { username, password }
响应: { token, user }

GET /api/auth/me
获取当前用户信息 (需要 JWT)
```

### 技能浏览 | Skills Browsing

```
GET /api/skills
查询参数:
  - page (分页，0开始)
  - size (每页数量，默认20)
  - category (分类 ID)
  - keyword (关键词搜索)
  - sort (排序: trending|featured|latest|most-downloaded)

GET /api/skills/{id}
获取技能详情

GET /api/skills/{slug}
通过 slug 获取技能 (SEO友好)

GET /api/skills/trending
热门技能 (缓存 5 分钟)

GET /api/skills/featured
精选技能 (缓存 5 分钟)

GET /api/skills/latest
最新技能

GET /api/skills/most-downloaded
下载最多的技能

GET /api/skills/{id}/related
相关技能推荐

GET /api/skills/{id}/stats
技能统计数据 (缓存)
```

### 用户交互 | User Interactions

```
POST /api/skills/{id}/click
记录浏览事件

POST /api/skills/{id}/download
记录下载并扣除积分

GET /api/skills/{id}/download-package
获取 ZIP 下载链接 (需要 JWT)

POST /api/skills/{id}/favorite
切换收藏状态

DELETE /api/skills/{id}/favorite
取消收藏

GET /api/skills/{id}/rating
获取技能评分

POST /api/skills/{id}/rate
提交评分
请求体: { rating: 1-5, comment: "..." }
```

### 用户相关 | User Management

```
GET /api/users/me
获取当前用户信息

GET /api/users/me/points
获取积分余额和历史

GET /api/users/me/level
获取等级和成长值

GET /api/users/me/purchases
获取购买历史

GET /api/users/me/favorites
获取收藏的技能

POST /api/users/me/check-in
每日签到

POST /api/users/me/submissions/upload
上传技能 ZIP 包
表单数据: { file: File, pricePoints: number, category: string }

GET /api/users/me/submissions
获取我提交的技能
```

### 管理接口 | Admin Endpoints

```
POST /api/admin/crawl
手动触发爬取
查询参数: path=/path/to/skills (可选)

GET /api/admin/skills
管理面板的技能列表 (无分页限制)

PATCH /api/admin/skills/{id}
编辑技能
请求体: { featured: boolean, verified: boolean, ... }

DELETE /api/admin/skills/{id}
删除技能

PATCH /api/admin/skills/{id}/batch
批量操作

GET /api/admin/stats
平台统计数据 (缓存)

GET /api/admin/users
用户管理列表

PATCH /api/admin/users/{id}
编辑用户权限
```

### 分类 | Categories

```
GET /api/categories
获取所有分类

GET /api/categories/{id}/skills
获取分类下的技能
```

---

## 积分与等级系统 | Points & Levels

### 💰 积分经济详解 | Points Economy Details

#### 获取积分的方式 | Earning Points

| 操作 | 积分 | 说明 |
|------|------|------|
| 注册 | +20 | 一次性注册奖励 |
| 日常签到 | +2 | 每天一次，连续签到7/30天翻倍 |
| 提交技能 | +10 | 提交被批准后 |
| 邀请朋友 | +5-50 | 基于邀请人数 |

#### 消耗积分的方式 | Spending Points

| 操作 | 积分 | 说明 |
|------|------|------|
| 下载免费技能 | 0 | 不消耗积分 |
| 下载付费技能 | -pricePoints | 定价时设定 |

#### 创作者收入 | Creator Earnings

每次有用户下载你发布的技能：

```
用户支付: 10 积分
创作者获得: 7 积分 (70%)
平台费用: 3 积分 (30%)
```

### 🏆 等级系统详解 | Level System Details

#### 成长值计算公式 | Growth Score Formula

```
成长值 = trustLevel × 15 + checkIns × 3 + purchases × 8 + pointsSpent + submissions × 30

其中：
- trustLevel: 账户信任度 (0-10)
- checkIns: 总签到天数
- purchases: 购买的技能数量
- pointsSpent: 总消耗积分
- submissions: 发布的技能数量
```

#### 等级进度示例 | Level Progression Example

```
新用户
├─ 注册: +20 积分, 成长值 = 0
│
└─ 日签到 10 天: 成长值 = 30 (checkIns × 3)
   └─ 达成 L2 Explorer (成长值 40)
      └─ 现在可以下载技能！

继续签到 30 天 + 购买 5 个技能
├─ checkIns = 30 → +90
├─ purchases = 5 → +40
└─ 成长值 ≈ 130 + ... ≥ 100
   └─ 达成 L3 Contributor
      └─ 现在可以上传 ZIP 技能包！

提交 2 个技能 + 更多购买
├─ submissions = 2 → +60
├─ purchases = 10 → +80
├─ trustLevel = 5 → +75
└─ 成长值 ≥ 220
   └─ 达成 L4 Curator
```

### 特殊规则 | Special Rules

- ⚠️ **积分不能为负** - 购买时会验证余额
- 🔄 **签到连续奖励** - 第 7 天 +5，第 30 天 +10
- 📈 **成长值只增不减** - 永久记录你的成就
- 🎁 **首次下载优惠** - 新用户首个付费下载 50% 折扣
- 🌟 **等级达成奖励** - 升级时额外奖励：L2 +10, L3 +20, L4 +50, L5 +100

---

## 项目结构 | Project Structure

```
skill-platform/
│
├── README.md                       # 本文件 | This file
├── PRODUCT_DESIGN.md               # 产品设计文档 | Product specification
├── ROADMAP.md                      # 开发路线图 | Development roadmap
├── docker-compose.yml              # Docker 容器编排 | Container orchestration
├── .env.example                    # 环境变量模板 | Environment template
│
├── backend/                        # Spring Boot 后端 | Backend
│   ├── pom.xml                     # Maven 依赖配置
│   ├── Dockerfile                  # 后端容器镜像
│   │
│   └── src/main/java/com/skillplatform/
│       │
│       ├── config/                 # 配置类 | Configuration
│       │   ├── SecurityConfig.java           # JWT + OAuth2 安全配置
│       │   ├── WebConfig.java               # CORS + Web 配置
│       │   ├── CacheConfig.java             # Caffeine 缓存配置
│       │   └── JwtFilter.java               # JWT 过滤器
│       │
│       ├── controller/             # REST 控制器 | API Endpoints
│       │   ├── SkillController.java         # 技能 API
│       │   ├── UserController.java          # 用户 API
│       │   ├── AdminController.java         # 管理 API
│       │   ├── AuthController.java          # 认证 API
│       │   └── CategoryController.java      # 分类 API
│       │
│       ├── service/                # 业务逻辑 | Business Logic
│       │   ├── SkillService.java            # 技能服务
│       │   ├── PointService.java            # 积分服务
│       │   ├── UserLevelService.java        # 等级计算
│       │   ├── SkillSubmissionService.java  # 提交处理
│       │   ├── RatingService.java           # 评分服务
│       │   ├── CrawlService.java            # 爬取引擎
│       │   ├── OAuth2Service.java           # OAuth2 处理
│       │   └── DownloadService.java         # 下载管理
│       │
│       ├── model/                  # 数据实体 | Entities
│       │   ├── Skill.java                   # 技能实体
│       │   ├── User.java                    # 用户实体
│       │   ├── Category.java                # 分类实体
│       │   ├── SkillRating.java             # 评分实体
│       │   ├── UserFavorite.java            # 收藏实体
│       │   ├── PointTransaction.java        # 交易实体
│       │   ├── UserSkillPurchase.java       # 购买实体
│       │   ├── UserCheckIn.java             # 签到实体
│       │   └── SkillSubmission.java         # 提交实体
│       │
│       ├── repository/             # 数据访问层 | Data Access
│       │   ├── SkillRepository.java         # 技能查询
│       │   ├── UserRepository.java          # 用户查询
│       │   ├── PointTransactionRepository.java
│       │   ├── UserFavoriteRepository.java
│       │   ├── SkillRatingRepository.java
│       │   └── CategoryRepository.java
│       │
│       ├── dto/                    # 数据传输对象 | DTOs
│       │   ├── SkillDTO.java               # 技能 DTO
│       │   ├── UserDTO.java                # 用户 DTO
│       │   ├── PointBalanceDTO.java        # 积分 DTO
│       │   ├── LevelInfoDTO.java           # 等级 DTO
│       │   └── UploadResponseDTO.java      # 上传响应 DTO
│       │
│       ├── exception/              # 异常处理 | Exception Handling
│       │   ├── SkillNotFoundException.java
│       │   ├── InsufficientPointsException.java
│       │   └── GlobalExceptionHandler.java
│       │
│       ├── util/                   # 工具类 | Utilities
│       │   ├── JwtUtils.java               # JWT 工具
│       │   ├── SkillmarkParser.java        # SKILL.md 解析器
│       │   └── FileUtils.java              # 文件工具
│       │
│       └── SkillPlatformApplication.java   # 应用入口
│
├── frontend/                       # React 前端 | Frontend
│   ├── package.json                # 依赖配置
│   ├── vite.config.js              # Vite 配置
│   ├── tailwind.config.js           # Tailwind 配置
│   ├── Dockerfile                  # 前端容器镜像
│   │
│   └── src/
│       ├── main.jsx                # 应用入口
│       ├── App.jsx                 # 应用主组件
│       ├── index.css               # 全局样式
│       │
│       ├── pages/                  # 页面组件 | Pages
│       │   ├── Home.jsx                    # 首页
│       │   ├── SkillBrowser.jsx            # 技能浏览
│       │   ├── SkillDetail.jsx             # 技能详情
│       │   ├── AdminDashboard.jsx          # 管理后台
│       │   ├── UserProfile.jsx             # 用户资料
│       │   ├── Favorites.jsx               # 收藏页面
│       │   ├── MySubmissions.jsx           # 我的提交
│       │   └── SkillUpload.jsx             # 技能上传
│       │
│       ├── components/             # 可复用组件 | Components
│       │   ├── Header.jsx                  # 顶部导航
│       │   ├── Footer.jsx                  # 页脚
│       │   ├── SkillCard.jsx               # 技能卡片
│       │   ├── CategoryCard.jsx            # 分类卡片
│       │   ├── RatingStars.jsx             # 评分星标
│       │   ├── PointsDisplay.jsx           # 积分显示
│       │   ├── LevelBadge.jsx              # 等级徽章
│       │   └── LoadingSpinner.jsx          # 加载动画
│       │
│       ├── context/                # 全局状态 | Context
│       │   └── AuthContext.jsx             # 认证上下文
│       │
│       ├── services/               # API 服务 | Services
│       │   └── api.js                      # Axios 实例和 API 调用
│       │
│       ├── hooks/                  # 自定义 Hook | Custom Hooks
│       │   ├── useAuth.js                  # 认证 Hook
│       │   └── usePoints.js                # 积分 Hook
│       │
│       └── assets/                 # 静态资源 | Assets
│           ├── logo.svg
│           ├── icons/
│           └── images/
│
├── scripts/                        # 脚本工具 | Scripts
│   ├── init-db.sql                 # 数据库初始化脚本
│   ├── seed-data.sql               # 测试数据脚本
│   └── deploy.sh                   # 部署脚本
│
└── skills-data/                    # 示例技能数据 | Sample Skills
    ├── skill-1/
    │   ├── SKILL.md
    │   ├── skill.zip
    │   └── README.md
    └── skill-2/
        ├── SKILL.md
        ├── skill.zip
        └── README.md
```

---

## 开发指南 | Development Guide

### 本地开发设置 | Local Development Setup

#### 1. 后端开发

```bash
cd backend

# 安装依赖
mvn clean install

# 启动 Spring Boot (需要运行的 PostgreSQL)
mvn spring-boot:run

# 运行测试
mvn test

# 构建 Docker 镜像
docker build -t skill-atlas-backend:latest .
```

**IDE 配置推荐:**
- IntelliJ IDEA 或 Eclipse
- 安装 Lombok Plugin
- Enable Annotation Processing

#### 2. 前端开发

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器 (hot reload)
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 代码检查和格式化
npm run lint
npm run format
```

**推荐编辑器:**
- VS Code + ESLint + Prettier 扩展
- WebStorm

#### 3. 数据库开发

```bash
# 使用 Docker 启动 PostgreSQL
docker run --name skill-atlas-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=skill_atlas \
  -p 5432:5432 \
  postgres:16

# 连接数据库
psql -h localhost -U postgres -d skill_atlas

# 运行初始化脚本
psql -h localhost -U postgres -d skill_atlas -f scripts/init-db.sql
```

### 代码规范 | Code Style

#### Java 代码规范
- 使用 4 个空格缩进
- 遵循 Google Java Style Guide
- 使用 camelCase 命名变量
- 使用 PascalCase 命名类
- 添加 JavaDoc 注释在公共方法

```java
/**
 * 获取技能详情
 *
 * @param id 技能 ID
 * @return 技能信息
 * @throws SkillNotFoundException 当技能不存在时
 */
public SkillDTO getSkillDetail(Long id) {
    // 实现...
}
```

#### JavaScript 代码规范
- 使用 2 个空格缩进
- 遵循 Airbnb JavaScript Style Guide
- 使用 camelCase 命名变量
- 使用 PascalCase 命名组件
- 添加 JSDoc 注释

```javascript
/**
 * 获取技能列表
 * @param {number} page - 页码
 * @param {number} size - 每页数量
 * @returns {Promise<Array>} 技能列表
 */
const fetchSkills = async (page = 0, size = 20) => {
  // 实现...
};
```

### 数据库迁移 | Database Migrations

使用 Flyway 进行版本控制:

```bash
src/main/resources/db/migration/
├── V1__Initial_Schema.sql
├── V2__Add_Ratings_Table.sql
└── V3__Add_User_Checkins.sql
```

新增迁移文件:
```bash
# 创建新的迁移文件
cat > src/main/resources/db/migration/V4__Add_New_Feature.sql << 'EOF'
-- 新建表或修改结构
ALTER TABLE skills ADD COLUMN new_column VARCHAR(255);
EOF
```

### 测试 | Testing

```bash
# 后端单元测试
cd backend
mvn test

# 后端集成测试
mvn verify

# 前端单元测试
cd frontend
npm run test

# 前端 E2E 测试
npm run test:e2e

# 生成覆盖率报告
mvn clean jacoco:prepare-agent test jacoco:report
```

### 调试 | Debugging

**后端调试:**
```bash
# 启用远程调试
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=y,address=5005"
```

在 IDE 中配置 Remote Debug，连接到 localhost:5005

**前端调试:**
- Chrome DevTools: F12
- VS Code Debugger: 配置 .vscode/launch.json

### Git 工作流 | Git Workflow

```bash
# 创建特性分支
git checkout -b feature/new-feature

# 提交更改
git add .
git commit -m "feat: 添加新功能描述"

# 推送分支
git push origin feature/new-feature

# 创建 Pull Request
# 在 GitHub 上创建 PR，请求审核

# 合并后删除分支
git branch -d feature/new-feature
```

**提交消息格式:**
```
type(scope): subject

body

footer
```

类型: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

示例:
```
feat(skill): 添加技能评分功能

- 实现 1-5 星评分系统
- 添加评分缓存机制
- 创建评分组件

Closes #123
```

---

## 贡献指南 | Contributing

感谢你对 Skill Atlas 的兴趣！我们欢迎各种形式的贡献。

### 如何贡献 | How to Contribute

1. **Fork 仓库** - 点击 GitHub 上的 Fork 按钮
2. **克隆你的 Fork** - `git clone https://github.com/your-username/skill-atlas.git`
3. **创建特性分支** - `git checkout -b feature/amazing-feature`
4. **进行更改** - 在你的分支上工作
5. **提交更改** - `git commit -m 'Add amazing feature'`
6. **推送到 Fork** - `git push origin feature/amazing-feature`
7. **创建 Pull Request** - 在 GitHub 上创建 PR

### 贡献类型 | Types of Contributions

#### 报告 Bug
在 Issues 中创建新 Issue：
- 清楚描述问题
- 提供重现步骤
- 包括错误日志/截图
- 说明你的环境 (OS、浏览器、Java/Node 版本)

#### 提议功能
在 Discussions 中讨论或 Issues 中详细描述：
- 解释为什么需要这个功能
- 提供用例示例
- 说明预期的行为

#### 改进文档
- 修正拼写/语法错误
- 添加缺失的文档
- 改进示例代码
- 翻译到其他语言

#### 提交代码
- 修复 Bug
- 实现新功能
- 优化性能
- 重构代码

### 开发标准 | Development Standards

- 通过所有现有测试
- 为新功能添加测试
- 遵循代码规范
- 添加适当的文档
- 更新 CHANGELOG (如有)

### 审核流程 | Review Process

1. 自动化检查 (CI/CD)
2. 代码审查 (至少一个维护者)
3. 合并到 develop 分支
4. 定期发布到 main

### 社区准则 | Community Guidelines

- 尊重所有贡献者
- 建设性的反馈
- 无骚扰或歧视
- 保持专业态度

---

## 常见问题 | FAQ

### Q: 如何重置我的积分？
A: 联系管理员。管理员可以在后台手动调整用户积分。

### Q: 我忘记了我的 Linux.do 密码怎么办？
A: 在 Linux.do 官网找到"忘记密码"功能，或联系 Linux.do 支持。

### Q: 如何成为 Contributor (L3) 以上传技能？
A: 需要达到 100 成长值。可以通过：
- 连续签到 30 天 (+90 成长值)
- 购买 2 个技能 (+16 成长值)
- 总共达到 100+ 即可上传

### Q: 下载的技能有效期是多久？
A: 永久有效。一旦购买，你拥有该技能的完全访问权。

### Q: 如何联系开发团队？
A:
- Issues: GitHub Issues
- Email: contact@skillatllas.com
- 讨论: GitHub Discussions

---

## 许可证 | License

Skill Atlas 采用 **MIT 许可证**。详见 [LICENSE](LICENSE) 文件。

MIT 许可证允许：
- 商业使用
- 修改
- 分发
- 私人使用

需要：
- 声明许可证
- 声明重要更改

---

## 致谢 | Acknowledgments

感谢以下项目和社区的支持：

- **Spring Boot** - 强大的后端框架
- **React** - 现代 UI 库
- **PostgreSQL** - 可靠的数据库
- **Tailwind CSS** - 快速样式开发
- **Linux.do** - OAuth2 提供商
- 所有贡献者和用户！

---

## 路线图 | Roadmap

查看 [ROADMAP.md](ROADMAP.md) 了解未来计划：

- **Phase 1** (Q2 2026): MVP 发布
  - 核心功能完成
  - 公开测试版

- **Phase 2** (Q3 2026): 社区功能
  - 讨论论坛
  - 技能评论
  - 创作者博客

- **Phase 3** (Q4 2026): 高级功能
  - 技能订阅制
  - AI 推荐引擎
  - 链上资产认证

---

## 联系方式 | Contact

- Email: contact@skillatllas.com
- Website: https://skillatllas.com
- Discord: [Discord Community]
- Twitter: [@SkillAtlas]

---

**Made with care by the Skill Atlas Team**

*转变 AI 能力为永久数字资产 | Transform AI Capabilities into Permanent Digital Assets*

---

**最后更新** | Last Updated: 2026-04-04
**版本** | Version: 1.0.0

