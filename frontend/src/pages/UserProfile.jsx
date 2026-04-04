import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Coins,
  Download,
  ExternalLink,
  Flame,
  PackagePlus,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Upload,
} from 'lucide-react'
import { profileApi } from '../services/api'
import { formatCount, formatDate } from '../utils/format'

export default function UserProfile() {
  const { username } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setNotFound(false)
    profileApi.getPublicProfile(username)
      .then((res) => { if (active) setProfile(res.data) })
      .catch((err) => {
        if (active) {
          if (err.response?.status === 404 || err.response?.status === 500) {
            setNotFound(true)
          } else {
            navigate('/skills')
          }
        }
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [username, navigate])

  if (loading) {
    return (
      <div className="px-3 pb-12 pt-4 sm:px-4 lg:px-6">
        <div className="mx-auto max-w-5xl space-y-5">
          <div className="atlas-panel h-64 animate-pulse" />
          <div className="grid gap-5 lg:grid-cols-[1fr,320px]">
            <div className="atlas-panel h-80 animate-pulse" />
            <div className="space-y-4">
              <div className="atlas-panel h-36 animate-pulse" />
              <div className="atlas-panel h-36 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="px-3 pb-12 pt-6 sm:px-4 lg:px-6">
        <div className="mx-auto max-w-2xl">
          <section className="atlas-panel-dark surface-noise relative overflow-hidden px-8 py-16 text-center">
            <div className="hero-wave opacity-50" />
            <div className="relative z-10">
              <p className="text-6xl">👤</p>
              <p className="section-kicker mt-6">Profile Not Found</p>
              <h1 className="display-title mt-2 text-4xl text-atlas-strong">找不到这个用户</h1>
              <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-atlas-muted">
                用户名 <code className="rounded bg-atlas-s3 px-2 py-0.5 text-atlas-teal">{username}</code> 不存在或尚未注册 Skill Atlas。
              </p>
              <Link to="/skills" className="atlas-button-solid mt-8 inline-flex px-6 py-3">
                浏览技能市场
              </Link>
            </div>
          </section>
        </div>
      </div>
    )
  }

  if (!profile) return null

  const level = profile.levelProfile
  const displayName = profile.name || profile.username

  // Achievement badges
  const badges = buildBadges(profile)

  return (
    <div className="px-3 pb-12 pt-4 sm:px-4 lg:px-6">
      <div className="mx-auto max-w-5xl space-y-5">

        {/* Profile hero */}
        <section className="atlas-panel-dark surface-noise relative overflow-hidden px-6 py-8 sm:px-10">
          <div className="hero-wave opacity-75" />
          <div className="relative z-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              {/* Avatar */}
              <div className="relative shrink-0">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={displayName}
                    className="h-24 w-24 rounded-[28px] border-2 border-atlas-teal/30 object-cover shadow-2xl"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border-2 border-atlas-teal/30 bg-gradient-to-br from-atlas-teal/20 to-blue-600/20 text-4xl shadow-2xl">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Level badge overlay */}
                {level && (
                  <div className="absolute -bottom-2 -right-2 rounded-xl border border-amber-500/30 bg-amber-500/15 px-2 py-1 text-xs font-bold text-amber-300 shadow-lg backdrop-blur">
                    {level.badge}
                  </div>
                )}
              </div>

              {/* Identity */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="display-title text-3xl text-atlas-strong sm:text-4xl">{displayName}</h1>
                  {level && (
                    <span className="rounded-full border border-atlas-teal/25 bg-atlas-teal/10 px-3 py-1 text-sm font-semibold text-atlas-teal">
                      {level.badge} {level.nameZh}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-atlas-muted">@{profile.username}</p>
                {level?.description && (
                  <p className="mt-3 max-w-xl text-sm leading-7 text-atlas-ink">{level.description}</p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-atlas-muted">
                  {profile.joinedAt && (
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      加入于 {formatDate(profile.joinedAt)}
                    </span>
                  )}
                  {profile.linuxDoId && (
                    <a
                      href={`https://linux.do/u/${profile.username}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 rounded-full border border-atlas-line bg-atlas-s2 px-3 py-1 transition hover:border-atlas-teal/40"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Linux.do 主页
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Achievement badges */}
            {badges.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {badges.map((b) => (
                  <span
                    key={b.key}
                    title={b.description}
                    className="flex items-center gap-1.5 rounded-full border border-atlas-line bg-atlas-s2 px-3 py-1.5 text-xs font-medium text-atlas-ink"
                  >
                    <span>{b.emoji}</span>
                    {b.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Main content */}
        <div className="grid gap-5 lg:grid-cols-[1fr,300px]">

          {/* Left: Submitted Skills */}
          <section className="atlas-panel px-6 py-6 sm:px-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-kicker">Digital Assets</p>
                <h2 className="display-title mt-2 text-3xl">技能资产</h2>
              </div>
              <div className="rounded-full border border-atlas-line bg-atlas-s2 px-4 py-2 font-mono text-sm text-atlas-teal">
                {profile.submittedSkillCount} 个
              </div>
            </div>

            <div className="mt-6">
              {profile.submittedSkills?.length === 0 ? (
                <div className="flex min-h-[200px] flex-col items-center justify-center rounded-[24px] border border-dashed border-atlas-line bg-atlas-s2 px-6 py-8 text-center">
                  <PackagePlus className="h-10 w-10 text-atlas-muted opacity-60" />
                  <p className="mt-4 text-sm text-atlas-muted">该用户尚未公开投稿技能</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {profile.submittedSkills.map((skill) => (
                    <SkillCard key={skill.id} skill={skill} />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Right: Stats sidebar */}
          <aside className="space-y-4">
            {/* Level progress */}
            {level && (
              <section className="atlas-panel px-5 py-5">
                <p className="section-kicker">Level Progress</p>
                <div className="mt-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-lg font-semibold text-atlas-strong">{level.badge} {level.nameZh}</span>
                    <span className="font-mono text-sm text-atlas-teal">{formatCount(level.growthScore)} GS</span>
                  </div>
                  {level.nextThreshold && (
                    <>
                      <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-atlas-s3">
                        <div
                          className="progress-shimmer h-full rounded-full bg-gradient-to-r from-atlas-teal to-blue-400"
                          style={{
                            width: `${Math.min(100, Math.round(
                              ((level.growthScore - level.currentThreshold) /
                              (level.nextThreshold - level.currentThreshold)) * 100
                            ))}%`
                          }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-atlas-muted">
                        距离 {level.nextLevelNameZh} 还差 {formatCount(level.remainingGrowthToNextLevel)} 成长值
                      </p>
                    </>
                  )}
                  {!level.nextThreshold && (
                    <p className="mt-2 text-xs text-atlas-teal">已达最高等级 🎉</p>
                  )}
                </div>
              </section>
            )}

            {/* Stats */}
            <section className="atlas-panel px-5 py-5">
              <p className="section-kicker">Statistics</p>
              <div className="mt-4 space-y-3">
                <StatRow icon={<Upload className="h-4 w-4 text-purple-400" />} label="已投稿技能" value={`${profile.submittedSkillCount} 个`} />
                <StatRow icon={<Download className="h-4 w-4 text-blue-400" />} label="已购买资源" value={`${profile.purchasedSkillCount} 个`} />
                <StatRow icon={<Flame className="h-4 w-4 text-orange-400" />} label="当前连签" value={`${profile.checkInStreakDays} 天`} />
                <StatRow icon={<CalendarDays className="h-4 w-4 text-teal-400" />} label="累计签到" value={`${profile.totalCheckInCount} 次`} />
                {level?.canUploadZip && (
                  <StatRow icon={<BadgeCheck className="h-4 w-4 text-emerald-400" />} label="投稿权限" value="已解锁" highlight />
                )}
              </div>
            </section>

            {/* Share profile CTA */}
            <section className="atlas-panel px-5 py-5">
              <p className="section-kicker">Share</p>
              <p className="mt-3 text-sm leading-7 text-atlas-muted">
                这是 {displayName} 的 AI 能力资产名片，展示了他在 Skill Atlas 上积累的数字资产。
              </p>
              <Link
                to="/skills"
                className="atlas-button-outline mt-4 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.14em]"
              >
                <Sparkles className="h-3.5 w-3.5" />
                探索技能市场
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}

function SkillCard({ skill }) {
  return (
    <Link
      to={`/skills/${skill.slug}`}
      className="group flex items-start gap-3 rounded-[22px] border border-atlas-line bg-atlas-s2 p-4 transition hover:-translate-y-0.5 hover:border-atlas-teal/40"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-atlas-line bg-atlas-s3 text-2xl">
        {skill.iconEmoji ?? '🧰'}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-atlas-strong transition group-hover:text-atlas-teal">
            {skill.name}
          </p>
          <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-atlas-muted opacity-0 transition group-hover:opacity-100" />
        </div>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-atlas-muted">
          {skill.shortDescription ?? skill.description}
        </p>
        <div className="mt-2 flex items-center gap-2">
          {skill.verified && (
            <span className="flex items-center gap-0.5 text-xs text-emerald-400">
              <ShieldCheck className="h-3 w-3" /> 已验证
            </span>
          )}
          {skill.featured && (
            <span className="flex items-center gap-0.5 text-xs text-amber-400">
              <Star className="h-3 w-3" /> 精选
            </span>
          )}
          <span className="ml-auto text-xs text-atlas-muted">
            {skill.pricePoints === 0 ? '免费' : `${skill.pricePoints} 积分`}
          </span>
        </div>
      </div>
    </Link>
  )
}

function StatRow({ icon, label, value, highlight }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-atlas-line bg-atlas-s3 px-4 py-3">
      <span className="flex items-center gap-2 text-sm text-atlas-muted">
        {icon}
        {label}
      </span>
      <span className={`font-mono text-sm font-semibold ${highlight ? 'text-emerald-400' : 'text-atlas-strong'}`}>
        {value}
      </span>
    </div>
  )
}

function buildBadges(profile) {
  const badges = []

  // Level-based
  const rank = profile.levelProfile?.rank ?? 0
  if (rank >= 5) badges.push({ key: 'trailblazer', emoji: '🚀', label: '领航者', description: '平台核心共建者' })
  else if (rank >= 4) badges.push({ key: 'curator', emoji: '🎯', label: '策展者', description: '持续贡献高质量资源' })
  else if (rank >= 3) badges.push({ key: 'contributor', emoji: '⚡', label: '共创者', description: '已解锁投稿权限' })

  // Activity badges
  if ((profile.checkInStreakDays ?? 0) >= 30) {
    badges.push({ key: 'streak30', emoji: '🔥', label: '月连签', description: '连续签到 30 天' })
  } else if ((profile.checkInStreakDays ?? 0) >= 7) {
    badges.push({ key: 'streak7', emoji: '✨', label: '周连签', description: '连续签到 7 天' })
  }

  // Creator badges
  if ((profile.submittedSkillCount ?? 0) >= 10) {
    badges.push({ key: 'creator10', emoji: '🏆', label: '技能达人', description: '已上传 10+ 技能包' })
  } else if ((profile.submittedSkillCount ?? 0) >= 1) {
    badges.push({ key: 'creator1', emoji: '📦', label: '创作者', description: '已上传技能包' })
  }

  // Collector badges
  if ((profile.purchasedSkillCount ?? 0) >= 20) {
    badges.push({ key: 'collector20', emoji: '💎', label: '收藏家', description: '已购买 20+ 技能' })
  } else if ((profile.purchasedSkillCount ?? 0) >= 5) {
    badges.push({ key: 'collector5', emoji: '🎒', label: '探索者', description: '已购买 5+ 技能' })
  }

  return badges
}
