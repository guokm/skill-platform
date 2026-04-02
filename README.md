# Skill Atlas

一个面向多 Agent 时代的 Skills 市场项目。它会递归爬取所有 `SKILL.md`，整理成行业化展示站点，并记录点击量和下载量。

## 技术栈

- 后端: Spring Boot `3.4.7` + JDK `21`
- 前端: React `18` + Vite + TailwindCSS
- 数据库: PostgreSQL `16`
- 部署: Docker Compose

## 现在支持什么

- 递归扫描多个目录中的 `SKILL.md`
- 解析 YAML frontmatter，提取名称、作者、版本、标签、来源等元数据
- 按 `技术类 / 职能类 / 行业类` 做分类展示
- 记录查看次数和下载次数
- 热门榜、下载榜、最新入库、精选推荐
- 详情页直接下载原始 `SKILL.md`
- Docker 一键部署

## 项目结构

```text
skill-platform/
├── backend/                 # Spring Boot API
├── frontend/                # React 站点
├── skills-data/             # 本地挂载的 Skills 数据目录
│   └── examples/            # 仓库自带示例 Skills
└── scripts/
    ├── import-skills.sh     # 导入本机已有 Skills
    └── launch.sh            # 导入后直接 docker compose 启动
```

## 一键启动

### 方式一: 直接启动示例站点

```bash
cp .env.example .env
docker compose up -d --build
```

访问地址:

- 前端: [http://localhost](http://localhost)
- Swagger: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

### 方式二: 导入本机已有 Skills 后启动

```bash
cp .env.example .env
./scripts/import-skills.sh
docker compose up -d --build
```

或者直接执行:

```bash
./scripts/launch.sh
```

脚本默认会尝试导入这些目录里的 Skills:

- `$CODEX_HOME/skills`
- `~/.codex/skills`
- `~/.agents/skills`

如果你要自定义来源目录，可以覆盖环境变量:

```bash
LOCAL_SKILL_SOURCE_DIRS="/path/one:/path/two" ./scripts/import-skills.sh
```

## Skills 目录约定

站点会递归扫描挂载目录下所有名为 `SKILL.md` 的文件。

## 怎么新增技能

最简单的方式就是往 `skills-data/` 下面新增一个技能目录，目录里放完整技能包。

例如：

```text
skills-data/
└── my-new-skill/
    ├── SKILL.md
    ├── scripts/
    │   └── run.sh
    ├── assets/
    │   └── cover.png
    └── README.md
```

然后执行任意一种方式：

```bash
docker compose up -d --build
```

或者服务已经在运行时，手动触发一次爬取：

```bash
curl -X POST http://localhost:8080/api/admin/crawl
```

只要目录里存在 `SKILL.md`，这个技能就会被收入站点；下载时也会把整个目录压缩成 zip，而不是只下载单个 `SKILL.md`。

示例:

```text
skills-data/
├── examples/
│   ├── frontend-design-system/
│   │   └── SKILL.md
│   └── growth-content-studio/
│       └── SKILL.md
└── imported/
    └── ...
```

示例 frontmatter:

```md
---
name: frontend-design-system
description: "搭建 React 组件库、设计规范和响应式界面。"
author: Skill Atlas
version: 1.0.0
license: MIT
category: frontend-development
tags:
  - react
  - design-system
featured: true
verified: true
icon: "🧩"
---
```

## 行业分类

### 技术类

- 前端开发
- 后端开发
- AI 与自动化
- 设计体验

### 职能类

- 产品管理
- 办公效率
- 销售商务
- 数据分析

### 行业类

- 财务会计
- 法务合规
- 教育培训
- 市场增长

如果 `SKILL.md` 没写 `category`，系统会根据标题、描述、正文和标签自动归类。

## 主要接口

- `GET /api/skills`
  支持 `keyword`、`category`、`categoryId`、`sortBy`、`page`、`size`
- `GET /api/skills/{slug}`
  获取 Skill 详情
- `POST /api/skills/{id}/click`
  记录查看次数
- `POST /api/skills/{id}/download`
  单独记录下载次数
- `GET /api/skills/{id}/download-package`
  下载整个技能目录的 zip 包并自动累计下载
- `GET /api/skills/trending`
  热门榜
- `GET /api/skills/most-downloaded`
  下载榜
- `GET /api/skills/latest`
  最新入库
- `GET /api/categories`
  分类列表
- `GET /api/categories/grouped`
  按大类分组后的分类列表
- `POST /api/admin/crawl`
  手动触发爬取

## 常用环境变量

`.env.example` 已给出默认值，常用项如下:

- `DB_PASSWORD`
- `PORT`
- `SKILLS_DIR`
- `DEMO_DATA_ENABLED`
- `SKILL_CRAWL_ON_STARTUP`
- `SKILL_CRAWLER_CRON`
- `SKILL_SCAN_PATHS`

## 本地开发

### 后端

```bash
cd backend
mvn spring-boot:run
```

### 前端

```bash
cd frontend
npm install
npm run dev
```

## 备注

- 仓库里默认放了 `skills-data/examples` 示例数据，方便直接预览站点。
- 生产环境建议把真正的 Skills 仓库或目录挂载到 `SKILLS_DIR`。
- 下载次数通过后端压缩下载接口累计，下载内容是完整技能包而不是单个 `SKILL.md`。
