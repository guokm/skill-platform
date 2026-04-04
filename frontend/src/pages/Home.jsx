import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Coins,
  Crown,
  Download,
  Eye,
  Flame,
  FolderGit2,
  Gem,
  Globe2,
  Layers,
  Lock,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  Upload,
  Users,
  Zap,
} from "lucide-react"
import SkillCard from "../components/SkillCard"
import CategoryCard from "../components/CategoryCard"
import { categoriesApi, skillsApi } from "../services/api"
import { useAuth } from "../context/AuthContext"
import { formatCount } from "../utils/format"

/* ─────────────────────────────────────────────────────────────────────────────
   Data
───────────────────────────────────────────────────────────────────────────── */
const LEVEL_TIERS = [
  { rank: 1, badge: "L1", nameZh: "见习者", nameEn: "Starter",     threshold: 0,   color: "#4a6480" },
  { rank: 2, badge: "L2", nameZh: "探索者", nameEn: "Explorer",    threshold: 40,  color: "#3b82f6" },
  { rank: 3, badge: "L3", nameZh: "共创者", nameEn: "Contributor", threshold: 100, color: "#06b6d4", uploadUnlock: true },
  { rank: 4, badge: "L4", nameZh: "策展者", nameEn: "Curator",     threshold: 220, color: "#a855f7" },
  { rank: 5, badge: "L5", nameZh: "领航者", nameEn: "Trailblazer", threshold: 400, color: "#eab308" },
]

const EARN_ITEMS = [
  { icon: "🔑", label: "首次注册",       pts: "+20", desc: "建立账号即获赠" },
  { icon: "📅", label: "每日签到",       pts: "+2",  desc: "最高连签加成 ×3" },
  { icon: "📦", label: "上传 Skill 审核通过", pts: "+10", desc: "每个包一次性奖励" },
  { icon: "💰", label: "Skill 被下载",   pts: "+70%", desc: "售价的 70% 归创作者" },
]

const SPEND_ITEMS = [
  { icon: "🆓", label: "免费 Skill",   pts: "0",   desc: "直接下载，无需积分" },
  { icon: "⚡", label: "轻量 Skill",   pts: "5–20", desc: "单一功能、入门场景" },
  { icon: "🏆", label: "专业 Skill",   pts: "20–100", desc: "多步骤、专业场景" },
  { icon: "💎", label: "精品 Skill",   pts: "100+", desc: "独家稀缺，限量发售" },
]

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: <Search className="h-6 w-6" />,
    title: "发现合适的 Skill",
    desc: "按行业 / 场景 / 关键词筛选，查看评分、下载量和社区评价，找到最适合你的 AI 能力组件。",
    color: "#06b6d4",
  },
  {
    step: "02",
    icon: <Coins className="h-6 w-6" />,
    title: "用积分购买并拥有",
    desc: "登录获得初始积分，每日签到持续积累。免费 Skill 直接下载，付费 Skill 一次购买永久拥有。",
    color: "#a855f7",
  },
  {
    step: "03",
    icon: <Upload className="h-6 w-6" />,
    title: "创作上传 & 赚取收益",
    desc: "成长到 L3 共创者即可上传 Skill zip 包，每次有人下载你都获得 70% 积分分成。",
    color: "#eab308",
  },
]

/* ─────────────────────────────────────────────────────────────────────────────
   Animated Counter
───────────────────────────────────────────────────────────────────────────── */
function AnimatedCounter({ target, duration = 1800, suffix = "" }) {
  const [value, setValue] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    if (!target || started.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return
        started.current = true
        const start = performance.now()
        const animate = (now) => {
          const progress = Math.min((now - start) / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setValue(Math.round(eased * target))
          if (progress < 1) requestAnimationFrame(animate)
        }
        requestAnimationFrame(animate)
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])

  return (
    <span ref={ref} className="tabular-nums">
      {formatCount(value)}{suffix}
    </span>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────────────────────────────────── */
export default function Home() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const [query, setQuery] = useState("")
  const [categoryGroups, setCategoryGroups] = useState([])
  const [trending, setTrending] = useState([])
  const [downloads, setDownloads] = useState([])
  const [latest, setLatest] = useState([])
  const [featured, setFeatured] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadHomepage() {
      const [groupedRes, trendingRes, downloadsRes, latestRes, featuredRes, statsRes] =
        await Promise.allSettled([
          categoriesApi.grouped(),
          skillsApi.trending(),
          skillsApi.mostDownloaded(),
          skillsApi.latest(),
          skillsApi.featured(),
          skillsApi.stats(),
        ])
      if (groupedRes.status === "fulfilled") setCategoryGroups(groupedRes.value.data)
      if (trendingRes.status === "fulfilled") setTrending(trendingRes.value.data.slice(0, 6))
      if (downloadsRes.status === "fulfilled") setDownloads(downloadsRes.value.data.slice(0, 6))
      if (latestRes.status === "fulfilled") setLatest(latestRes.value.data.slice(0, 4))
      if (featuredRes.status === "fulfilled") setFeatured(featuredRes.value.data.slice(0, 3))
      if (statsRes.status === "fulfilled") setStats(statsRes.value.data)
      setLoading(false)
    }
    loadHomepage()
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    navigate(`/skills?keyword=${encodeURIComponent(query.trim())}`)
  }

  if (loading) return <LoadingState />

  return (
    <div className="pb-16">
      {/* ── 1. HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        {/* Animated orbs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="orb-float absolute left-[10%] top-[20%] h-96 w-96 rounded-full bg-cyan-500/8 blur-3xl" />
          <div className="orb-float-alt absolute right-[8%] top-[10%] h-80 w-80 rounded-full bg-blue-600/8 blur-3xl" />
          <div className="orb-float absolute bottom-[5%] left-[40%] h-64 w-64 rounded-full bg-purple-600/6 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl">
          {/* Kicker */}
          <div className="flex justify-center fade-up">
            <div className="atlas-pill animate-glow">
              <Sparkles className="h-3.5 w-3.5" />
              Personal AI Digital Asset Platform
            </div>
          </div>

          {/* Headline */}
          <h1 className="display-title fade-up-delay mt-8 text-center text-5xl leading-[1.05] text-atlas-strong sm:text-6xl lg:text-7xl">
            把 AI 能力，<br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              变成你的数字资产
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="fade-up-delay-2 mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-atlas-muted">
            发现、购买、收藏和创作 AI Skill——
            每一个 Skill 都是有所有权、有价格、可流通的数字资产，
            构建你在 AI 时代的能力名片。
          </p>

          {/* Search + CTA */}
          <form onSubmit={handleSearch} className="fade-up-delay-3 mx-auto mt-10 flex max-w-2xl flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-atlas-muted" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索 React / 法务 / SEO / 数据分析..."
                className="atlas-input w-full py-4 pl-12 pr-5 text-sm"
              />
            </div>
            <button type="submit" className="atlas-button-solid px-7 py-4 text-sm font-semibold whitespace-nowrap">
              进入技能库
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Secondary CTA row */}
          <div className="fade-up-delay-3 mt-4 flex flex-wrap justify-center gap-3">
            <Link to="/skills?sortBy=popular" className="atlas-button-outline px-5 py-2 text-sm">
              <Flame className="h-4 w-4 text-orange-400" /> 热门排行
            </Link>
            <Link to="/skills?sortBy=newest" className="atlas-button-outline px-5 py-2 text-sm">
              <Zap className="h-4 w-4 text-atlas-teal" /> 最新入库
            </Link>
            {!isLoggedIn && (
              <Link to="/admin/login" className="atlas-button-outline px-5 py-2 text-sm border-atlas-teal/30 text-atlas-teal">
                <Crown className="h-4 w-4" /> 登录领积分
              </Link>
            )}
          </div>

          {/* Live stats strip */}
          <div className="fade-up-delay-3 mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Skills 总量",  value: stats.totalSkills,    icon: <BookOpen className="h-4 w-4" /> },
              { label: "行业分类",     value: stats.totalCategories, icon: <Globe2 className="h-4 w-4" /> },
              { label: "总交互次数",   value: stats.totalClicks,     icon: <Eye className="h-4 w-4" /> },
              { label: "总下载次数",   value: stats.totalDownloads,  icon: <Download className="h-4 w-4" /> },
            ].map((s) => (
              <div key={s.label} className="atlas-panel-glow px-4 py-4 text-center">
                <div className="flex justify-center text-atlas-teal mb-2">{s.icon}</div>
                <p className="font-mono text-2xl font-semibold text-atlas-teal">
                  <AnimatedCounter target={Number(s.value) || 0} />
                </p>
                <p className="mt-1 text-xs text-atlas-muted">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. THREE PILLARS ────────────────────────────────────────────────── */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-5 md:grid-cols-3">
            <PillarCard
              gradient="from-cyan-500/20 to-blue-600/10 border-cyan-500/20"
              iconBg="bg-cyan-500/15 text-cyan-400"
              icon={<Search className="h-6 w-6" />}
              kicker="DISCOVER"
              title="发现"
              titleSub="AI 能力地图"
              desc="自动爬取 & 分类整理全网 SKILL.md，按行业、岗位场景搜索，快速找到你需要的 AI 能力组件。"
              items={["行业 / 职能双维度分类", "关键词搜索 + 标签筛选", "热度排行 & 评分系统"]}
              cta="浏览技能库"
              ctaTo="/skills"
            />
            <PillarCard
              gradient="from-purple-500/20 to-pink-600/10 border-purple-500/20"
              iconBg="bg-purple-500/15 text-purple-400"
              icon={<Gem className="h-6 w-6" />}
              kicker="OWN"
              title="拥有"
              titleSub="数字资产"
              desc="每个 Skill 都有积分定价。购买即拥有所有权——你的技能库就是你在 AI 时代的能力凭证。"
              items={["积分购买 · 永久拥有", "收藏夹 & 我的资产面板", "等级体系 & 权限成长"]}
              cta="登录领取积分"
              ctaTo="/admin/login"
            />
            <PillarCard
              gradient="from-amber-500/20 to-orange-600/10 border-amber-500/20"
              iconBg="bg-amber-500/15 text-amber-400"
              icon={<Upload className="h-6 w-6" />}
              kicker="CREATE"
              title="创作"
              titleSub="& 赚取收益"
              desc="成长到共创者等级，即可上传你的 Skill zip 包。每次有人下载，70% 积分直接到账。"
              items={["上传 zip 自动解析入库", "每次下载赚 70% 分成", "贡献越多 · 等级越高"]}
              cta="了解创作者计划"
              ctaTo="/skills"
            />
          </div>
        </div>
      </section>

      {/* ── 3. POINTS ECONOMY ───────────────────────────────────────────────── */}
      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="atlas-panel-dark surface-noise relative overflow-hidden px-6 py-10 sm:px-10">
            <div className="hero-wave" />
            <div className="relative z-10">
              <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="section-kicker">Points Economy</p>
                  <h2 className="display-title mt-2 text-4xl text-atlas-strong">积分经济体系</h2>
                  <p className="mt-2 max-w-xl text-sm leading-7 text-atlas-muted">
                    积分不是普通虚拟货币，它是你在平台的活跃度和贡献度的量化体现。
                    签到、购买、创作——每个行为都在积累。
                  </p>
                </div>
                <div className="shrink-0 rounded-2xl border border-atlas-teal/20 bg-atlas-s2 px-5 py-4 text-center">
                  <p className="section-kicker text-xs">新用户即得</p>
                  <p className="font-mono text-4xl font-bold text-atlas-teal mt-1">20</p>
                  <p className="text-xs text-atlas-muted mt-1">初始积分</p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {/* Earn */}
                <div>
                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" /> 积分获取途径
                  </p>
                  <div className="space-y-2">
                    {EARN_ITEMS.map((item) => (
                      <div key={item.label} className="flex items-center gap-3 rounded-xl border border-atlas-line bg-atlas-s2/60 px-4 py-3">
                        <span className="text-2xl">{item.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-atlas-strong">{item.label}</p>
                          <p className="text-xs text-atlas-muted">{item.desc}</p>
                        </div>
                        <div className="shrink-0 rounded-full bg-emerald-500/10 px-3 py-1 font-mono text-sm font-bold text-emerald-400 border border-emerald-500/20">
                          {item.pts}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Spend */}
                <div>
                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-atlas-teal">
                    <Layers className="h-4 w-4" /> Skill 积分定价
                  </p>
                  <div className="space-y-2">
                    {SPEND_ITEMS.map((item) => (
                      <div key={item.label} className="flex items-center gap-3 rounded-xl border border-atlas-line bg-atlas-s2/60 px-4 py-3">
                        <span className="text-2xl">{item.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-atlas-strong">{item.label}</p>
                          <p className="text-xs text-atlas-muted">{item.desc}</p>
                        </div>
                        <div className="shrink-0 rounded-full bg-atlas-teal/10 px-3 py-1 font-mono text-sm font-bold text-atlas-teal border border-atlas-teal/20">
                          {item.pts}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. LEVEL SYSTEM ─────────────────────────────────────────────────── */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <p className="section-kicker">Level System</p>
            <h2 className="display-title mt-2 text-4xl text-atlas-strong">五级成长体系</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-atlas-muted">
              你的等级由「成长值」决定——签到、购买、投稿都在积累。
              升到 L3 共创者即可解锁 zip 投稿权限。
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-5">
            {LEVEL_TIERS.map((tier) => (
              <div
                key={tier.rank}
                className="atlas-panel relative flex flex-col items-center px-4 py-6 text-center overflow-hidden"
                style={{ borderColor: `${tier.color}22` }}
              >
                {tier.uploadUnlock && (
                  <div className="absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-mono font-bold border"
                       style={{ color: tier.color, borderColor: `${tier.color}40`, background: `${tier.color}10` }}>
                    投稿解锁
                  </div>
                )}
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold border"
                  style={{ color: tier.color, background: `${tier.color}12`, borderColor: `${tier.color}30` }}
                >
                  {tier.badge}
                </div>
                <p className="mt-3 text-base font-bold text-atlas-strong">{tier.nameZh}</p>
                <p className="text-xs text-atlas-muted">{tier.nameEn}</p>
                <div className="mt-3 w-full rounded-full bg-atlas-s2 h-1 overflow-hidden">
                  <div
                    className="h-full progress-shimmer rounded-full"
                    style={{ width: `${Math.min(100, (tier.threshold / 400) * 100 + 20)}%`, background: tier.color }}
                  />
                </div>
                <p className="mt-2 font-mono text-xs text-atlas-muted">成长值 ≥ {tier.threshold}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 text-center">
            <p className="section-kicker">How It Works</p>
            <h2 className="display-title mt-2 text-4xl text-atlas-strong">三步开始你的 AI 资产之旅</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="atlas-panel relative overflow-hidden p-6">
                <div
                  className="absolute -right-6 -top-6 flex h-24 w-24 items-center justify-center rounded-full text-7xl font-black opacity-[0.06]"
                  style={{ color: step.color }}
                >
                  {step.step}
                </div>
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border"
                  style={{ color: step.color, background: `${step.color}15`, borderColor: `${step.color}30` }}
                >
                  {step.icon}
                </div>
                <p className="font-mono mt-4 text-xs" style={{ color: step.color }}>STEP {step.step}</p>
                <h3 className="display-title mt-1 text-xl text-atlas-strong">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-atlas-muted">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. TRENDING + DOWNLOADS ─────────────────────────────────────────── */}
      {(trending.length > 0 || downloads.length > 0) && (
        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="section-kicker">Live Rankings</p>
                <h2 className="display-title mt-1 text-3xl text-atlas-strong">实时排行榜</h2>
              </div>
              <Link to="/skills?sortBy=popular" className="atlas-button-outline px-4 py-2 text-xs uppercase tracking-wider">
                查看全部 <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <LeaderboardPanel
                title="最受关注"
                kicker="TOP BY CLICKS"
                icon={<TrendingUp className="h-4 w-4" />}
                items={trending}
                metricKey="clickCount"
                metricIcon={<Eye className="h-3.5 w-3.5" />}
                color="text-atlas-teal"
              />
              <LeaderboardPanel
                title="下载最多"
                kicker="TOP BY DOWNLOADS"
                icon={<Trophy className="h-4 w-4" />}
                items={downloads}
                metricKey="downloadCount"
                metricIcon={<Download className="h-3.5 w-3.5" />}
                color="text-amber-400"
              />
            </div>
          </div>
        </section>
      )}

      {/* ── 7. FEATURED ─────────────────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="section-kicker">Editor's Pick</p>
                <h2 className="display-title mt-1 text-3xl text-atlas-strong">精选推荐</h2>
              </div>
              <Link to="/skills?featured=true" className="atlas-button-outline px-4 py-2 text-xs uppercase tracking-wider">
                更多精选 <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {featured.map((skill) => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 8. CATEGORY MAP ─────────────────────────────────────────────────── */}
      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="section-kicker">Industry Map</p>
              <h2 className="display-title mt-2 text-3xl text-atlas-strong">行业技能地图</h2>
            </div>
            <Link to="/skills" className="atlas-button-outline px-4 py-2 text-xs uppercase tracking-wider">
              全部分类 <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-5">
            {categoryGroups.map((group) => (
              <div key={group.key} className="atlas-panel px-6 py-5 sm:px-7">
                <div className="mb-4 flex items-end justify-between">
                  <div>
                    <p className="section-kicker text-xs">{group.name}</p>
                    <h3 className="display-title mt-1 text-2xl text-atlas-strong">{group.nameZh}</h3>
                  </div>
                  <span className="font-mono text-xs text-atlas-muted">{group.categories?.length} 分类</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {group.categories.map((category) => (
                    <CategoryCard key={category.id} category={category} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. LATEST ───────────────────────────────────────────────────────── */}
      {latest.length > 0 && (
        <section className="px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <p className="section-kicker">New Arrivals</p>
                <h2 className="display-title mt-1 text-3xl text-atlas-strong">最新入库</h2>
              </div>
              <Link to="/skills?sortBy=newest" className="atlas-button-outline px-4 py-2 text-xs uppercase tracking-wider">
                查看全部 <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {latest.map((skill) => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 10. CREATOR CTA ─────────────────────────────────────────────────── */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="atlas-panel-dark surface-noise relative overflow-hidden px-6 py-14 sm:px-10">
            <div className="hero-wave opacity-70" />

            {/* Floating decorative badges */}
            <div className="pointer-events-none absolute right-8 top-8 hidden opacity-30 lg:block">
              <div className="space-y-3 text-right font-mono text-xs text-atlas-teal">
                <div className="atlas-panel px-3 py-1.5 text-emerald-400">★★★★★ 5.0</div>
                <div className="atlas-panel px-3 py-1.5">L3 · 共创者</div>
                <div className="atlas-panel px-3 py-1.5 text-amber-400">+70% 积分分成</div>
              </div>
            </div>

            <div className="relative z-10 max-w-2xl">
              <div className="atlas-pill mb-6 w-fit border-amber-500/30 bg-amber-500/10 text-amber-400">
                <Upload className="h-3.5 w-3.5" />
                Creator Program
              </div>
              <h2 className="display-title text-4xl text-atlas-strong sm:text-5xl">
                你也有一个值得分享的 Skill
              </h2>
              <p className="mt-5 text-base leading-8 text-atlas-muted">
                把你的 SKILL.md 打包成 zip，上传到平台。
                审核通过后自动上架，每次下载你得 <span className="text-amber-400 font-semibold">70% 积分分成</span>。
                成长到 L3 共创者等级即可解锁投稿权限。
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/submit" className="atlas-button-solid px-7 py-3.5 text-sm font-semibold">
                  <Upload className="h-4 w-4" />
                  上传我的 Skill
                </Link>
                <Link to="/me/level" className="atlas-button-outline px-7 py-3.5 text-sm font-semibold">
                  <Award className="h-4 w-4" />
                  查看我的等级
                </Link>
              </div>

              {/* Mini feature list */}
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-atlas-muted">
                {["自动解析 SKILL.md frontmatter", "支持 zip 批量打包", "实时积分到账", "永久展示在市场"].map((item) => (
                  <span key={item} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────────────────────────── */
function PillarCard({ gradient, iconBg, icon, kicker, title, titleSub, desc, items, cta, ctaTo }) {
  return (
    <div className={`atlas-panel relative overflow-hidden border bg-gradient-to-br p-7 ${gradient}`}>
      <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg}`}>
        {icon}
      </div>
      <p className="section-kicker mt-5 text-xs">{kicker}</p>
      <h3 className="display-title mt-1 text-2xl text-atlas-strong">
        {title} <span className="text-atlas-muted">{titleSub}</span>
      </h3>
      <p className="mt-3 text-sm leading-7 text-atlas-muted">{desc}</p>
      <ul className="mt-4 space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2 text-xs text-atlas-muted">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
            {item}
          </li>
        ))}
      </ul>
      <Link
        to={ctaTo}
        className="atlas-button-outline mt-6 inline-flex w-full justify-center text-sm"
      >
        {cta} <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

function LeaderboardPanel({ title, kicker, icon, items, metricKey, metricIcon, color }) {
  const navigate = useNavigate()
  return (
    <div className="atlas-panel px-5 py-5">
      <div className="flex items-center gap-2 mb-1">
        <span className={color}>{icon}</span>
        <p className="section-kicker text-xs">{kicker}</p>
      </div>
      <h3 className="display-title text-2xl text-atlas-strong">{title}</h3>

      <div className="mt-5 space-y-1">
        {items.map((skill, index) => (
          <button
            key={skill.id}
            type="button"
            onClick={() => navigate(`/skills/${skill.slug}`)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition border-l-2 border-transparent hover:border-atlas-teal/50 hover:bg-atlas-s2"
          >
            <span className="font-mono text-sm w-5 text-center text-atlas-muted">
              {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
            </span>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-atlas-s2 text-base border border-atlas-line">
              {skill.iconEmoji ?? "🧰"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm font-semibold text-atlas-ink">{skill.name}</p>
              <p className="line-clamp-1 text-xs text-atlas-muted">{skill.shortDescription}</p>
            </div>
            <div className="shrink-0 flex items-center gap-1 font-mono text-xs text-atlas-muted">
              {metricIcon}
              {formatCount(skill[metricKey])}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="atlas-panel-dark h-[500px] animate-pulse" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="atlas-panel h-64 animate-pulse" />)}
        </div>
        <div className="atlas-panel h-80 animate-pulse" />
      </div>
    </div>
  )
}
