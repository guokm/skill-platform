import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Download,
  FolderGit2,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import SkillCard from '../components/SkillCard'
import CategoryCard from '../components/CategoryCard'
import { categoriesApi, skillsApi } from '../services/api'
import { formatCount } from '../utils/format'

export default function Home() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [categoryGroups, setCategoryGroups] = useState([])
  const [trending, setTrending] = useState([])
  const [downloads, setDownloads] = useState([])
  const [latest, setLatest] = useState([])
  const [featured, setFeatured] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadHomepage() {
      // 用 allSettled 保证单个接口失败不影响整页渲染
      const [groupedRes, trendingRes, downloadsRes, latestRes, featuredRes, statsRes] =
        await Promise.allSettled([
          categoriesApi.grouped(),
          skillsApi.trending(),
          skillsApi.mostDownloaded(),
          skillsApi.latest(),
          skillsApi.featured(),
          skillsApi.stats(),
        ])

      if (groupedRes.status === 'fulfilled') setCategoryGroups(groupedRes.value.data)
      if (trendingRes.status === 'fulfilled') setTrending(trendingRes.value.data.slice(0, 5))
      if (downloadsRes.status === 'fulfilled') setDownloads(downloadsRes.value.data.slice(0, 5))
      if (latestRes.status === 'fulfilled') setLatest(latestRes.value.data.slice(0, 4))
      if (featuredRes.status === 'fulfilled') setFeatured(featuredRes.value.data.slice(0, 3))
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data)

      setLoading(false)
    }

    loadHomepage()
  }, [])

  const handleSearch = (event) => {
    event.preventDefault()
    if (!query.trim()) {
      return
    }
    navigate(`/skills?keyword=${encodeURIComponent(query.trim())}`)
  }

  if (loading) {
    return <LoadingState />
  }

  return (
    <div className="px-3 pb-12 sm:px-4 lg:px-6">
      <div className="mx-auto max-w-7xl space-y-8 pb-12 pt-4">
        <section className="atlas-panel-dark surface-noise relative overflow-hidden px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="hero-wave" />
          <div className="relative z-10 grid gap-10 lg:grid-cols-[1.2fr,0.8fr] lg:items-end">
            <div>
              <div className="atlas-pill w-fit border-white/10 bg-white/10 text-white/70 fade-up">
                <Sparkles className="h-4 w-4 text-[var(--atlas-coral)]" />
                SKILL.md 行业化市场
              </div>
              <h1 className="display-title fade-up-delay mt-6 max-w-4xl text-5xl leading-[0.92] text-white sm:text-6xl">
                把所有 Skills，整理成一张可搜索、可追踪的行业地图。
              </h1>
              <p className="fade-up-delay-2 mt-6 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
                自动递归爬取 `SKILL.md`，按行业与职能分类展示，提供热门排行、下载排行和真实交互数据。
              </p>

              <form onSubmit={handleSearch} className="fade-up-delay-3 mt-8 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="搜索 React、Agent、法务、财务、SEO..."
                    className="w-full rounded-full border border-white/10 bg-white/8 py-4 pl-12 pr-5 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/30"
                  />
                </div>
                <button type="submit" className="atlas-button bg-[var(--atlas-coral)] px-6 py-4 text-sm font-semibold text-white">
                  进入技能库
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>

            <div className="grid gap-4 fade-up-delay-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <StatBox label="Skills 总量" value={formatCount(stats.totalSkills)} helper="递归索引所有 SKILL.md" />
              <StatBox label="分类数" value={formatCount(stats.totalCategories)} helper="技术类 / 职能类 / 行业类" />
              <StatBox label="总点击" value={formatCount(stats.totalClicks)} helper="查看热度实时累计" />
              <StatBox label="总下载" value={formatCount(stats.totalDownloads)} helper="下载量闭环统计" />
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <InfoCard
            title="自动采集"
            icon={<FolderGit2 className="h-5 w-5" />}
            body="递归扫描多个目录，自动解析 frontmatter、作者、版本、标签和来源。"
          />
          <InfoCard
            title="行业分类"
            icon={<Sparkles className="h-5 w-5" />}
            body="把原本散落的技能整理成技术类、职能类、行业类，更像一个真正能逛的市场。"
          />
          <InfoCard
            title="热度可见"
            icon={<TrendingUp className="h-5 w-5" />}
            body="点击量和下载量都落库，首页和详情页都能看到真实趋势。"
          />
        </section>

        <section className="space-y-8">
          <SectionHeading
            kicker="Category Map"
            title="按行业和岗位场景浏览"
            subtitle="借鉴 skills.yangsir.net 的结构，但增加了更完整的列表、统计和详情页能力。"
            href="/skills"
          />

          <div className="space-y-6">
            {categoryGroups.map((group, index) => (
              <div key={group.key} className={`atlas-panel px-6 py-6 sm:px-7 ${index % 2 === 0 ? 'fade-up' : 'fade-up-delay'}`}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="section-kicker">{group.name}</p>
                    <h2 className="display-title mt-2 text-3xl text-atlas-ink">{group.nameZh}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/skills')}
                    className="atlas-button-outline w-fit px-4 py-2 text-xs uppercase tracking-[0.18em]"
                  >
                    查看全部
                  </button>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {group.categories.map((category) => (
                    <CategoryCard key={category.id} category={category} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr,1.1fr,0.8fr]">
          <LeaderboardPanel
            title="最受关注"
            kicker="Top by clicks"
            helper="点击量最高的 Skills"
            items={trending}
            metricKey="clickCount"
            metricLabel="查看"
          />
          <LeaderboardPanel
            title="下载最多"
            kicker="Top by downloads"
            helper="真正被带走使用的 Skills"
            items={downloads}
            metricKey="downloadCount"
            metricLabel="下载"
          />
          <div className="atlas-panel px-6 py-6">
            <p className="section-kicker">Curated</p>
            <h2 className="display-title mt-2 text-3xl">值得先逛的入口</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              如果你是第一次进入这个技能市场，可以先看精选，再看最新，最后按行业筛选。
            </p>

            <div className="mt-6 space-y-3">
              <button type="button" onClick={() => navigate('/skills?sortBy=popular')} className="atlas-button-outline w-full justify-between">
                <span>看热门榜单</span>
                <TrendingUp className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => navigate('/skills?sortBy=downloads')} className="atlas-button-outline w-full justify-between">
                <span>看下载排行</span>
                <Download className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => navigate('/skills?sortBy=newest')} className="atlas-button-outline w-full justify-between">
                <span>看最新入库</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {featured.length > 0 && (
          <section className="space-y-5">
            <SectionHeading
              kicker="Featured"
              title="精选推荐"
              subtitle="适合放在首页第一屏之后，给用户一个“先看这些”的安全选择。"
            />
            <div className="grid gap-5 lg:grid-cols-3">
              {featured.map((skill) => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-5">
          <SectionHeading
            kicker="New arrivals"
            title="最新入库"
            subtitle="每次爬取后，新增 Skills 会优先出现在这里。"
            href="/skills?sortBy=newest"
          />
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
            {latest.map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function SectionHeading({ kicker, title, subtitle, href }) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="section-kicker">{kicker}</p>
        <h2 className="display-title mt-2 text-4xl text-atlas-ink">{title}</h2>
        {subtitle && <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{subtitle}</p>}
      </div>
      {href && (
        <button type="button" onClick={() => navigate(href)} className="atlas-button-outline w-fit px-4 py-2 text-xs uppercase tracking-[0.18em]">
          查看全部
        </button>
      )}
    </div>
  )
}

function LeaderboardPanel({ title, kicker, helper, items, metricKey, metricLabel }) {
  const navigate = useNavigate()

  return (
    <div className="atlas-panel px-6 py-6">
      <p className="section-kicker">{kicker}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <h2 className="display-title text-3xl text-atlas-ink">{title}</h2>
          <p className="mt-2 text-sm text-slate-600">{helper}</p>
        </div>
        <button type="button" onClick={() => navigate('/skills')} className="atlas-button-outline px-4 py-2 text-xs uppercase tracking-[0.18em]">
          全部
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {items.map((skill, index) => (
          <button
            key={skill.id}
            type="button"
            onClick={() => navigate(`/skills/${skill.slug}`)}
            className="flex w-full items-center gap-4 rounded-[22px] border border-[rgba(214,198,178,0.8)] bg-white/65 px-4 py-4 text-left transition hover:-translate-y-0.5 hover:bg-white"
          >
            <div className="display-title flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#efe3d2,#fffaf3)] text-xl">
              {index + 1}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 font-semibold text-atlas-ink">{skill.name}</p>
              <p className="mt-1 line-clamp-1 text-sm text-slate-500">{skill.shortDescription}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{metricLabel}</p>
              <p className="mt-1 text-lg font-semibold text-atlas-ink">{formatCount(skill[metricKey])}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function InfoCard({ title, body, icon }) {
  return (
    <div className="atlas-panel px-5 py-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#efe3d2,#fffaf3)] text-atlas-ink">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-atlas-ink">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-600">{body}</p>
    </div>
  )
}

function StatBox({ label, value, helper }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/8 px-5 py-5">
      <p className="text-xs uppercase tracking-[0.2em] text-white/45">{label}</p>
      <p className="display-title mt-3 text-4xl text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-white/60">{helper}</p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="px-3 pb-12 pt-4 sm:px-4 lg:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="atlas-panel-dark h-[360px] animate-pulse" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="atlas-panel h-40 animate-pulse" />
          ))}
        </div>
        <div className="atlas-panel h-[420px] animate-pulse" />
      </div>
    </div>
  )
}
