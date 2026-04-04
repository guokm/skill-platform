import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BadgePlus,
  Clock3,
  Coins,
  Download,
  LibraryBig,
  LogIn,
  PackagePlus,
  ReceiptText,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { authApi, usersApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { formatCount, formatDate } from '../utils/format'

export default function PointsCenter() {
  const navigate = useNavigate()
  const { isLoggedIn, user, refreshUser } = useAuth()
  const [summary, setSummary] = useState(null)
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [checkInLoading, setCheckInLoading] = useState(false)
  const [checkInMessage, setCheckInMessage] = useState('')
  const [checkInMessageType, setCheckInMessageType] = useState('success')

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false)
      return
    }

    let active = true
    Promise.allSettled([usersApi.myPoints(), usersApi.myPurchases()])
      .then(([summaryRes, purchasesRes]) => {
        if (!active) return
        if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value.data)
        if (purchasesRes.status === 'fulfilled') setPurchases(purchasesRes.value.data ?? [])
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [isLoggedIn])

  const stats = useMemo(() => {
    const pointsBalance = summary?.pointsBalance ?? user?.pointsBalance ?? 0
    const totalSpent = summary?.totalPointsSpent ?? user?.totalPointsSpent ?? 0
    const purchasedCount = summary?.purchasedSkillCount ?? purchases.length
    const streakDays = summary?.checkInStreakDays ?? user?.checkInStreakDays ?? 0
    const totalCheckInCount = summary?.totalCheckInCount ?? user?.totalCheckInCount ?? 0
    const checkedInToday = !!summary?.checkedInToday
    const levelProfile = summary?.levelProfile ?? user?.levelProfile ?? null
    return { pointsBalance, totalSpent, purchasedCount, streakDays, totalCheckInCount, checkedInToday, levelProfile }
  }, [summary, purchases.length, user?.pointsBalance, user?.totalPointsSpent, user?.checkInStreakDays, user?.totalCheckInCount, user?.levelProfile])

  const handleLoginRedirect = async () => {
    sessionStorage.setItem('auth_redirect', window.location.pathname)
    try {
      const res = await authApi.getLoginUrl()
      window.location.href = res.data.url
    } catch {
      navigate('/admin/login')
    }
  }

  const handleCheckIn = async () => {
    if (checkInLoading || stats.checkedInToday) return
    setCheckInLoading(true)
    setCheckInMessage('')
    try {
      const res = await usersApi.checkIn()
      const result = res.data
      setSummary((current) => ({
        ...(current ?? {}),
        pointsBalance: result.pointsBalance,
        checkedInToday: result.checkedInToday,
        lastCheckInDate: result.lastCheckInDate,
        checkInStreakDays: result.checkInStreakDays,
        totalCheckInCount: result.totalCheckInCount,
        recentTransactions: current?.recentTransactions ?? [],
      }))
      await refreshUser()
      const summaryRes = await usersApi.myPoints()
      setSummary(summaryRes.data)
      setCheckInMessage(result.message || `签到成功，获得 ${result.rewardPoints} 积分`)
      setCheckInMessageType('success')
    } catch (error) {
      setCheckInMessage(error.response?.data?.error || '签到失败，请稍后重试')
      setCheckInMessageType('error')
    } finally {
      setCheckInLoading(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="px-3 pb-12 pt-6 sm:px-4 lg:px-6">
        <div className="mx-auto max-w-4xl">
          <section className="atlas-panel-dark surface-noise relative overflow-hidden px-8 py-12 text-center">
            <div className="hero-wave opacity-60" />
            <div className="relative z-10">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] border border-atlas-teal/20 bg-atlas-teal/10 text-atlas-teal shadow-2xl">
                <Coins className="h-10 w-10" />
              </div>
              <p className="section-kicker mt-6">Points Ledger</p>
              <h1 className="display-title mt-2 text-4xl text-atlas-strong">积分中心</h1>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-atlas-muted">
                登录后可以查看你的积分余额、最近扣分流水和已购技能包。下载付费资源后，也会在这里形成完整记录。
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <button type="button" onClick={handleLoginRedirect} className="atlas-button-solid px-6 py-3">
                  <LogIn className="h-4 w-4" />
                  Linux.do 登录
                </button>
                <Link to="/skills" className="atlas-button-outline px-6 py-3">
                  浏览资源
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
        <section className="atlas-panel-dark surface-noise relative overflow-hidden px-6 py-7 sm:px-8">
          <div className="hero-wave opacity-70" />
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
            <div>
              <p className="section-kicker">My Wallet</p>
              <h1 className="display-title mt-2 text-4xl text-atlas-strong sm:text-5xl">积分中心</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-atlas-muted">
                这里会汇总你的可用积分、已经购买过的技能包，以及最近的积分流水。整套下载消费记录都会在这里持续沉淀。
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link to="/skills" className="atlas-button-solid px-5 py-3">
                  <Sparkles className="h-4 w-4" />
                  去获取更多技能
                </Link>
                <Link to="/me/favorites" className="atlas-button-outline px-5 py-3">
                  <LibraryBig className="h-4 w-4" />
                  查看我的收藏
                </Link>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <ActionPanel
                  icon={<BadgePlus className="h-5 w-5" />}
                  title={stats.checkedInToday ? '今天已签到' : '每日签到'}
                  description={stats.checkedInToday
                    ? `连续签到 ${stats.streakDays} 天，今天的奖励已经到账。`
                    : '每天签到可领取积分，连续签到也会形成活跃记录。'
                  }
                  action={(
                    <button
                      type="button"
                      onClick={handleCheckIn}
                      disabled={checkInLoading || stats.checkedInToday}
                      className={stats.checkedInToday ? 'atlas-button-outline px-4 py-2 text-xs uppercase tracking-[0.16em] opacity-70' : 'atlas-button-solid px-4 py-2 text-xs uppercase tracking-[0.16em]'}
                    >
                      {checkInLoading ? '签到中...' : stats.checkedInToday ? '今日已领取' : '立即签到'}
                    </button>
                  )}
                />

                <ActionPanel
                  icon={<PackagePlus className="h-5 w-5" />}
                  title="上架奖励"
                  description={stats.levelProfile?.canUploadZip
                    ? '你的等级已经达到投稿门槛，现在上传技能包时，系统会自动写入投稿人 ID，并在满足条件时发放上架奖励积分。'
                    : `当前还差 ${stats.levelProfile?.remainingGrowthToUpload ?? 0} 成长值，达到 ${stats.levelProfile?.uploadUnlockBadge ?? `L${stats.levelProfile?.uploadUnlockRank ?? 0}`} ${stats.levelProfile?.uploadUnlockLevelNameZh ?? '指定等级'} 后就能解锁 zip 投稿。`
                  }
                  action={(
                    <Link to="/submit" className="atlas-button-outline px-4 py-2 text-xs uppercase tracking-[0.16em]">
                      {stats.levelProfile?.canUploadZip ? '去投稿技能' : '查看解锁条件'}
                    </Link>
                  )}
                />
              </div>

              {checkInMessage && (
                <div className={`mt-4 rounded-[22px] border px-4 py-3 text-sm ${
                  checkInMessageType === 'error'
                    ? 'border-red-500/20 bg-red-500/10 text-red-300'
                    : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                }`}>
                  {checkInMessage}
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {stats.levelProfile && (
                <LedgerStat
                  label="当前等级"
                  value={`${stats.levelProfile.badge} ${stats.levelProfile.nameZh}`}
                  detail={`成长值 ${formatCount(stats.levelProfile.growthScore ?? 0)}${stats.levelProfile.canUploadZip ? ' · 已解锁投稿' : ` · 还差 ${formatCount(stats.levelProfile.remainingGrowthToUpload ?? 0)} 解锁投稿`}`}
                  tone="amber"
                  icon={<Sparkles className="h-5 w-5" />}
                />
              )}
              <LedgerStat
                label="当前余额"
                value={`${formatCount(stats.pointsBalance)} 积分`}
                detail="可用于下载付费技能包"
                tone="teal"
                icon={<Coins className="h-5 w-5" />}
              />
              <LedgerStat
                label="累计消费"
                value={`${formatCount(stats.totalSpent)} 积分`}
                detail="首次下载资源时扣减"
                tone="amber"
                icon={<ReceiptText className="h-5 w-5" />}
              />
              <LedgerStat
                label="已购资源"
                value={formatCount(stats.purchasedCount)}
                detail="重复下载不再重复扣费"
                tone="blue"
                icon={<Download className="h-5 w-5" />}
              />
              <LedgerStat
                label="连续签到"
                value={`${formatCount(stats.streakDays)} 天`}
                detail={`累计签到 ${formatCount(stats.totalCheckInCount)} 次`}
                tone="emerald"
                icon={<Sparkles className="h-5 w-5" />}
              />
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[0.92fr,1.08fr]">
          <section className="atlas-panel px-6 py-6 sm:px-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-kicker">Recent Activity</p>
                <h2 className="display-title mt-2 text-3xl">最近流水</h2>
              </div>
              <div className="rounded-full border border-atlas-line bg-atlas-s2 px-4 py-2 font-mono text-sm text-atlas-teal">
                {loading ? '...' : `${summary?.recentTransactions?.length ?? 0} 条`}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-20 rounded-[22px] border border-atlas-line bg-atlas-s2 animate-pulse" />
                ))
              ) : summary?.recentTransactions?.length ? (
                summary.recentTransactions.map((transaction) => (
                  <TransactionItem key={transaction.id} transaction={transaction} />
                ))
              ) : (
                <EmptyPanel
                  icon={<Clock3 className="h-8 w-8" />}
                  title="还没有积分流水"
                  description="当你首次登录获赠积分、下载资源扣分，或管理员调整余额后，记录会出现在这里。"
                />
              )}
            </div>
          </section>

          <section className="atlas-panel px-6 py-6 sm:px-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-kicker">Purchased Library</p>
                <h2 className="display-title mt-2 text-3xl">已购资源</h2>
              </div>
              <div className="rounded-full border border-atlas-line bg-atlas-s2 px-4 py-2 font-mono text-sm text-atlas-teal">
                {loading ? '...' : `${purchases.length} 项`}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-52 rounded-[24px] border border-atlas-line bg-atlas-s2 animate-pulse" />
                ))
              ) : purchases.length ? (
                purchases.map((purchase) => (
                  <PurchasedCard key={purchase.id} purchase={purchase} />
                ))
              ) : (
                <div className="md:col-span-2">
                  <EmptyPanel
                    icon={<LibraryBig className="h-8 w-8" />}
                    title="你还没有已购资源"
                    description="现在下载付费技能包后，这里会自动沉淀成你的个人资源库。"
                    action={(
                      <Link to="/skills" className="atlas-button-solid mt-6 inline-flex px-5 py-3">
                        浏览技能市场
                      </Link>
                    )}
                  />
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function LedgerStat({ label, value, detail, tone, icon }) {
  const toneMap = {
    teal: 'border-atlas-teal/25 bg-atlas-teal/10 text-atlas-teal',
    amber: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
    blue: 'border-blue-500/20 bg-blue-500/10 text-blue-300',
    emerald: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
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

function ActionPanel({ icon, title, description, action }) {
  return (
    <div className="rounded-[24px] border border-atlas-line bg-atlas-s2 px-5 py-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-atlas-teal/20 bg-atlas-teal/10 text-atlas-teal">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-atlas-strong">{title}</h3>
      <p className="mt-2 min-h-[72px] text-sm leading-7 text-atlas-muted">{description}</p>
      <div className="mt-4">{action}</div>
    </div>
  )
}

function TransactionItem({ transaction }) {
  const isPositive = Number(transaction.deltaPoints ?? 0) >= 0
  return (
    <div className="rounded-[22px] border border-atlas-line bg-atlas-s2 px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
              isPositive
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                : 'border-amber-500/20 bg-amber-500/10 text-amber-300'
            }`}>
              {isPositive ? <TrendingUp className="mr-1 h-3.5 w-3.5" /> : <TrendingDown className="mr-1 h-3.5 w-3.5" />}
              {transaction.type}
            </span>
            <span className="text-xs text-atlas-muted">{formatDate(transaction.createdAt)}</span>
          </div>
          <p className="mt-3 text-sm font-medium text-atlas-strong">{transaction.note || '积分变更'}</p>
          <p className="mt-1 text-xs text-atlas-muted">变更后余额：{transaction.balanceAfter} 积分</p>
        </div>
        <div className={`rounded-full px-3 py-2 font-mono text-sm font-semibold ${
          isPositive ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'
        }`}>
          {isPositive ? '+' : ''}{transaction.deltaPoints}
        </div>
      </div>
    </div>
  )
}

function PurchasedCard({ purchase }) {
  const skill = purchase.skill
  if (!skill) return null

  return (
    <article className="group rounded-[24px] border border-atlas-line bg-atlas-s2 p-5 transition hover:-translate-y-1 hover:border-atlas-teal/40">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-atlas-line bg-atlas-s3 text-3xl shadow-inner">
            {skill.iconEmoji ?? '🧰'}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold text-atlas-strong transition group-hover:text-atlas-teal">{skill.name}</p>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-atlas-muted">{skill.shortDescription ?? skill.description}</p>
          </div>
        </div>
        <div className="rounded-full border border-atlas-teal/20 bg-atlas-teal/10 px-3 py-1.5 text-xs font-semibold text-atlas-teal">
          {purchase.pricePoints === 0 ? '免费' : `${purchase.pricePoints} 积分`}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-atlas-line pt-4 text-sm">
        <div>
          <p className="section-kicker text-xs">购买时间</p>
          <p className="mt-2 font-medium text-atlas-ink">{formatDate(purchase.purchasedAt)}</p>
        </div>
        <Link to={`/skills/${skill.slug}`} className="atlas-button-outline px-4 py-2 text-xs uppercase tracking-[0.16em]">
          进入资源
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  )
}

function EmptyPanel({ icon, title, description, action }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[26px] border border-dashed border-atlas-line bg-atlas-s2 px-6 py-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-atlas-teal/20 bg-atlas-teal/10 text-atlas-teal">
        {icon}
      </div>
      <h3 className="mt-5 text-xl font-semibold text-atlas-strong">{title}</h3>
      <p className="mt-3 max-w-md text-sm leading-7 text-atlas-muted">{description}</p>
      {action}
    </div>
  )
}
