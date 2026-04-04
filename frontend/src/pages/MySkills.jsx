import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Coins,
  Download,
  Eye,
  LogIn,
  PackagePlus,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Upload,
} from 'lucide-react'
import { authApi, usersApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { formatCount, formatDate } from '../utils/format'

export default function MySkills() {
  const navigate = useNavigate()
  const { isLoggedIn, user } = useAuth()
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false)
      return
    }
    let active = true
    usersApi.mySubmittedSkills()
      .then((res) => { if (active) setSkills(res.data ?? []) })
      .catch(() => { if (active) setSkills([]) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [isLoggedIn])

  const handleLoginRedirect = async () => {
    sessionStorage.setItem('auth_redirect', window.location.pathname)
    try {
      const res = await authApi.getLoginUrl()
      window.location.href = res.data.url
    } catch {
      navigate('/admin/login')
    }
  }

  // ── 汇总数据 ──────────────────────────────────────────────────────────────
  const totalDownloads = skills.reduce((acc, s) => acc + (s.downloadCount ?? 0), 0)
  const totalEarned    = skills.reduce((acc, s) => acc + (s.totalEarned ?? 0), 0)
  const totalPurchasers = skills.reduce((acc, s) => acc + (s.purchaserCount ?? 0), 0)

  if (!isLoggedIn) {
    return (
      <div className="px-3 pb-12 pt-6 sm:px-4 lg:px-6">
        <div className="mx-auto max-w-4xl">
          <section className="atlas-panel-dark surface-noise relative overflow-hidden px-8 py-12 text-center">
            <div className="hero-wave opacity-60" />
            <div className="relative z-10">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] border border-atlas-teal/20 bg-atlas-teal/10 text-atlas-teal shadow-2xl">
                <Upload className="h-10 w-10" />
              </div>
              <p className="section-kicker mt-6">Creator Studio</p>
              <h1 className="display-title mt-2 text-4xl text-atlas-strong">我的投稿</h1>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-atlas-muted">
                登录后可以查看你上传的所有技能包，追踪每份技能的下载量、被收购人数和积分分成收益。
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <button type="button" onClick={handleLoginRedirect} className="atlas-button-solid px-6 py-3">
                  <LogIn className="h-4 w-4" />
                  Linux.do 登录
                </button>
                <Link to="/submit" className="atlas-button-outline px-6 py-3">
                  了解投稿流程
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="px-3 pb-12 pt-4 sm:px-4 lg:px-6">
      <div className="mx-auto max-w-7xl space-y-5">

        {/* Hero */}
        <section className="atlas-panel-dark surface-noise relative overflow-hidden px-6 py-7 sm:px-8">
          <div className="hero-wave opacity-70" />
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
            <div>
              <p className="section-kicker">Creator Studio</p>
              <h1 className="display-title mt-2 text-4xl text-atlas-strong sm:text-5xl">我的投稿</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-atlas-muted">
                这里汇总了你通过 Linux.do ID 关联的所有技能包，包括每份技能的查看数、被购买次数，以及平台按下载积分发放给你的 70% 分成。
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link to="/submit" className="atlas-button-solid px-5 py-3">
                  <Upload className="h-4 w-4" />
                  上传新技能包
                </Link>
                <Link to="/skills" className="atlas-button-outline px-5 py-3">
                  浏览技能市场
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <CreatorStat
                icon={<PackagePlus className="h-5 w-5" />}
                label="已投稿技能"
                value={`${formatCount(skills.length)} 个`}
                detail="关联你 Linux.do ID 的所有技能"
                tone="teal"
              />
              <CreatorStat
                icon={<Download className="h-5 w-5" />}
                label="总下载量"
                value={formatCount(totalDownloads)}
                detail={`共 ${formatCount(totalPurchasers)} 人购买`}
                tone="blue"
              />
              <CreatorStat
                icon={<Coins className="h-5 w-5" />}
                label="累计分成收益"
                value={`${formatCount(totalEarned)} 积分`}
                detail="按下载积分的 70% 实时结算"
                tone="amber"
              />
            </div>
          </div>
        </section>

        {/* Skill list */}
        <section className="atlas-panel px-6 py-6 sm:px-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-kicker">Your Portfolio</p>
              <h2 className="display-title mt-2 text-3xl">技能库</h2>
            </div>
            <div className="rounded-full border border-atlas-line bg-atlas-s2 px-4 py-2 font-mono text-sm text-atlas-teal">
              {loading ? '...' : `${skills.length} 个技能`}
            </div>
          </div>

          <div className="mt-6">
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-52 rounded-[24px] border border-atlas-line bg-atlas-s2 animate-pulse" />
                ))}
              </div>
            ) : skills.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {skills.map((skill) => (
                  <SkillCard key={skill.id} skill={skill} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Earnings info */}
        <section className="atlas-panel px-6 py-6 sm:px-8">
          <div>
            <p className="section-kicker">Revenue Model</p>
            <h2 className="display-title mt-2 text-3xl">分成规则</h2>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <RevenueRule
              icon={<Download className="h-5 w-5" />}
              title="按次结算"
              description="每当有用户首次下载你的付费技能包，平台会实时把积分的 70% 划转到你的账户，30% 归平台运营。"
            />
            <RevenueRule
              icon={<Coins className="h-5 w-5" />}
              title="无最低门槛"
              description="分成积分直接计入你的可用余额，没有提现门槛和等待期，可以立刻用于下载其他技能包。"
            />
            <RevenueRule
              icon={<Star className="h-5 w-5" />}
              title="质量决定收益"
              description="定价由你设置，下载量和评分共同影响资源的曝光排名，优质技能会持续带来收益。"
            />
          </div>
        </section>
      </div>
    </div>
  )
}

function SkillCard({ skill }) {
  const priceLabel = skill.pricePoints === 0 ? '免费' : `${skill.pricePoints} 积分`
  const earnedLabel = skill.pricePoints === 0 ? '无收益' : `+${formatCount(skill.totalEarned)} 积分`

  return (
    <article className="group rounded-[24px] border border-atlas-line bg-atlas-s2 p-5 transition hover:-translate-y-1 hover:border-atlas-teal/40">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-atlas-line bg-atlas-s3 text-3xl shadow-inner">
          {skill.iconEmoji ?? '🧰'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-semibold text-atlas-strong transition group-hover:text-atlas-teal">
              {skill.name}
            </p>
            {skill.verified && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
                <ShieldCheck className="h-3 w-3" />
                已验证
              </span>
            )}
            {skill.featured && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
                <Sparkles className="h-3 w-3" />
                精选
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-atlas-muted">
            {skill.shortDescription ?? '暂无简介'}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl border border-atlas-line bg-atlas-s3 px-3 py-3">
          <div className="flex items-center justify-center gap-1 text-atlas-muted">
            <Eye className="h-3.5 w-3.5" />
          </div>
          <p className="mt-1 font-mono text-base text-atlas-strong">{formatCount(skill.clickCount)}</p>
          <p className="mt-0.5 text-xs text-atlas-muted">查看</p>
        </div>
        <div className="rounded-2xl border border-atlas-line bg-atlas-s3 px-3 py-3">
          <div className="flex items-center justify-center gap-1 text-atlas-muted">
            <Download className="h-3.5 w-3.5" />
          </div>
          <p className="mt-1 font-mono text-base text-atlas-strong">{formatCount(skill.downloadCount)}</p>
          <p className="mt-0.5 text-xs text-atlas-muted">下载</p>
        </div>
        <div className="rounded-2xl border border-atlas-line bg-atlas-s3 px-3 py-3">
          <div className="flex items-center justify-center gap-1 text-amber-400">
            <TrendingUp className="h-3.5 w-3.5" />
          </div>
          <p className="mt-1 font-mono text-base text-amber-300">{earnedLabel}</p>
          <p className="mt-0.5 text-xs text-atlas-muted">分成</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-atlas-line pt-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-atlas-muted">
          <span className="rounded-full border border-atlas-line bg-atlas-s3 px-3 py-1">
            {priceLabel}
          </span>
          <span>上架于 {formatDate(skill.createdAt)}</span>
          {!skill.submissionRewardGranted && skill.pricePoints > 0 && (
            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-amber-300">
              待上架奖励
            </span>
          )}
        </div>
        <Link
          to={`/skills/${skill.slug}`}
          className="atlas-button-outline shrink-0 px-3 py-1.5 text-xs uppercase tracking-[0.14em]"
        >
          查看
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  )
}

function CreatorStat({ icon, label, value, detail, tone }) {
  const toneMap = {
    teal: 'border-atlas-teal/25 bg-atlas-teal/10 text-atlas-teal',
    amber: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
    blue: 'border-blue-500/20 bg-blue-500/10 text-blue-300',
  }
  return (
    <div className="rounded-[24px] border border-atlas-line bg-atlas-s3 px-5 py-5">
      <div className={`inline-flex rounded-2xl border px-3 py-2 ${toneMap[tone] ?? toneMap.teal}`}>
        {icon}
      </div>
      <p className="section-kicker mt-4 text-xs">{label}</p>
      <p className="mt-3 font-mono text-2xl text-atlas-strong">{value}</p>
      <p className="mt-2 text-xs leading-6 text-atlas-muted">{detail}</p>
    </div>
  )
}

function RevenueRule({ icon, title, description }) {
  return (
    <div className="rounded-[24px] border border-atlas-line bg-atlas-s2 px-5 py-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-atlas-teal/20 bg-atlas-teal/10 text-atlas-teal">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-atlas-strong">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-atlas-muted">{description}</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[26px] border border-dashed border-atlas-line bg-atlas-s2 px-6 py-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-atlas-teal/20 bg-atlas-teal/10 text-atlas-teal">
        <PackagePlus className="h-8 w-8" />
      </div>
      <h3 className="mt-5 text-xl font-semibold text-atlas-strong">还没有投稿技能</h3>
      <p className="mt-3 max-w-md text-sm leading-7 text-atlas-muted">
        上传你的第一个技能包后，它就会出现在这里，并开始为你创造积分分成收益。
      </p>
      <Link to="/submit" className="atlas-button-solid mt-6 inline-flex px-5 py-3">
        <Upload className="h-4 w-4" />
        上传技能包
      </Link>
    </div>
  )
}
