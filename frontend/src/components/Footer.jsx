import { Link } from 'react-router-dom'

const QUICK_LINKS = [
  { label: '前端开发', to: '/skills?category=frontend-development' },
  { label: '后端开发', to: '/skills?category=backend-development' },
  { label: '办公效率', to: '/skills?category=office-productivity' },
  { label: '市场增长', to: '/skills?category=marketing-growth' },
]

export default function Footer() {
  return (
    <footer className="content-shell px-3 pb-4 pt-12 sm:px-4 lg:px-6">
      <div className="mx-auto max-w-7xl atlas-panel-dark relative overflow-hidden px-6 py-8 sm:px-8">
        <div className="hero-wave opacity-50" />
        <div className="relative z-10 grid gap-10 lg:grid-cols-[1.4fr,1fr,1fr]">
          <div>
            <p className="section-kicker text-white/50">Skill Atlas</p>
            <h2 className="display-title mt-3 text-3xl text-white">把分散的 SKILL.md，整理成可浏览、可追踪、可部署的行业市场。</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/70">
              现在这套站点已经支持递归爬取、行业分类、点击与下载统计，以及 Docker 一键部署。
            </p>
          </div>

          <div>
            <p className="section-kicker text-white/50">Browse</p>
            <div className="mt-4 grid gap-2 text-sm text-white/80">
              <Link to="/" className="hover:text-white">首页</Link>
              <Link to="/skills" className="hover:text-white">全部 Skills</Link>
              <Link to="/skills?sortBy=popular" className="hover:text-white">热门排行</Link>
              <Link to="/skills?sortBy=downloads" className="hover:text-white">下载最多</Link>
            </div>
          </div>

          <div>
            <p className="section-kicker text-white/50">Categories</p>
            <div className="mt-4 grid gap-2 text-sm text-white/80">
              {QUICK_LINKS.map((item) => (
                <Link key={item.to} to={item.to} className="hover:text-white">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-10 flex flex-col gap-3 border-t border-white/10 pt-5 text-xs uppercase tracking-[0.2em] text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <span>Spring Boot 3.4.7 + React + PostgreSQL</span>
          <span>Docker Compose Ready</span>
        </div>
      </div>
    </footer>
  )
}
