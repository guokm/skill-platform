import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Award, Calendar, CheckCircle2, Coins, TrendingUp, Trophy } from 'lucide-react'
import { pointsApi } from '../services/api'
import { useAuth } from '../context/AuthContext'

const TX_TYPE_LABEL = {
  WELCOME_BONUS:          { label: '新用户注册奖励', color: 'text-emerald-400' },
  DAILY_CHECK_IN:         { label: '每日签到',       color: 'text-atlas-teal' },
  DOWNLOAD_PURCHASE:      { label: '下载消费',       color: 'text-rose-400' },
  SKILL_SUBMISSION_REWARD:{ label: '投稿奖励',       color: 'text-amber-400' },
  ADMIN_ADJUSTMENT:       { label: '管理员调整',     color: 'text-purple-400' },
  EARN_FROM_DOWNLOAD:     { label: '下载分成收益',   color: 'text-emerald-400' },
}

export default function MyPoints() {
  const { isLoggedIn } = useAuth()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checkingIn, setCheckingIn] = useState(false)
  const [checkInMsg, setCheckInMsg] = useState('')

  useEffect(() => {
    if (!isLoggedIn) { setLoading(false); return }
    pointsApi.summary().then(r => setSummary(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [isLoggedIn])

  const handleCheckIn = async () => {
    if (checkingIn || summary?.checkedInToday) return
    setCheckingIn(true)
    setCheckInMsg('')
    try {
      const res = await pointsApi.checkIn()
      setSummary(prev => ({
        ...prev,
        pointsBalance:     res.data.pointsBalance,
        checkedInToday:    true,
        checkInStreakDays: res.data.checkInStreakDays,
        totalCheckInCount: res.data.totalCheckInCount,
      }))
      setCheckInMsg(`+${res.data.rewardPoints} 积分已到账！`)
    } catch (e) {
      setCheckInMsg(e?.response?.data?.message ?? '签到失败，请稍后再试')
    } finally {
      setCheckingIn(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Coins className="mx-auto h-12 w-12 text-atlas-muted/40" />
          <p className="mt-4 text-atlas-muted">请先登录</p>
          <Link to="/admin/login" className="atlas-button-solid mt-4 inline-flex px-6 py-2.5">去登录</Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="atlas-panel h-32 animate-pulse" />)}
        </div>
      </div>
    )
  }

  const level = summary?.levelProfile

  return (
    <div className="px-4 pb-12 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-5">

        {/* Header */}
        <div className="atlas-panel-dark surface-noise relative overflow-hidden px-6 py-8 sm:px-8">
          <div className="hero-wave opacity-60" />
          <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="section-kicker">Points Center</p>
              <h1 className="display-title mt-1 text-4xl text-atlas-strong">积分中心</h1>
              {level && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-full border border-atlas-teal/25 bg-atlas-teal/10 px-3 py-1 font-mono text-xs text-atlas-teal">
                    {level.badge} {level.nameZh}
                  </span>
                  <span className="text-xs text-atlas-muted">成长值 {level.growthScore}</span>
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-atlas-teal/20 bg-atlas-s2 px-8 py-5 text-center">
              <p className="section-kicker text-xs">当前余额</p>
              <p className="font-mono text-5xl font-bold text-atlas-teal mt-2">{summary?.pointsBalance ?? 0}</p>
              <p className="mt-1 text-xs text-atlas-muted">积分</p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatBox icon={<Trophy className="h-5 w-5" />} label="历史消费" value={summary?.totalPointsSpent ?? 0} color="text-amber-400" />
          <StatBox icon={<Calendar className="h-5 w-5" />} label="连签天数" value={`${summary?.checkInStreakDays ?? 0} 天`} color="text-atlas-teal" />
          <StatBox icon={<Award className="h-5 w-5" />} label="累计签到" value={`${summary?.totalCheckInCount ?? 0} 次`} color="text-purple-400" />
        </div>

        {/* Check-in card */}
        <div className="atlas-panel px-6 py-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="section-kicker text-xs">Daily Check-in</p>
              <h2 className="display-title mt-1 text-2xl text-atlas-strong">每日签到</h2>
              <p className="mt-1 text-sm text-atlas-muted">
                每天签到 +2 积分，连续签到额外奖励
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={handleCheckIn}
                disabled={summary?.checkedInToday || checkingIn}
                className={`flex items-center gap-2 rounded-2xl border px-6 py-3 text-sm font-semibold transition ${
                  summary?.checkedInToday
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 cursor-default'
                    : 'atlas-button-solid'
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                {summary?.checkedInToday ? '今日已签到' : checkingIn ? '签到中…' : '立即签到 +2'}
              </button>
              {checkInMsg && (
                <span className={`text-xs ${checkInMsg.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {checkInMsg}
                </span>
              )}
            </div>
          </div>

          {/* Streak dots */}
          <div className="mt-6 grid grid-cols-7 gap-2">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`h-8 w-8 rounded-full border flex items-center justify-center text-xs font-mono transition ${
                  i < (summary?.checkInStreakDays ?? 0) % 7
                    ? 'bg-atlas-teal border-atlas-teal text-white'
                    : i === (summary?.checkInStreakDays ?? 0) % 7
                      ? 'border-atlas-teal/50 text-atlas-teal animate-glow'
                      : 'border-atlas-line text-atlas-muted'
                }`}>
                  {i + 1}
                </div>
                <p className="text-[10px] text-atlas-muted">{['一','二','三','四','五','六','日'][i]}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Level progress */}
        {level && (
          <div className="atlas-panel px-6 py-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="section-kicker text-xs">Level Progress</p>
                <h2 className="display-title mt-1 text-2xl text-atlas-strong">等级成长</h2>
              </div>
              <Link to="/me/level" className="atlas-button-outline px-4 py-2 text-xs">查看详情</Link>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="rounded-full border border-atlas-teal/25 bg-atlas-teal/10 px-3 py-1 font-mono text-xs text-atlas-teal">
                {level.badge} {level.nameZh}
              </span>
              <div className="flex-1 rounded-full bg-atlas-s2 h-2 overflow-hidden">
                {level.nextThreshold && (
                  <div
                    className="h-full progress-shimmer rounded-full transition-all"
                    style={{ width: `${Math.min(100, ((level.growthScore - level.currentThreshold) / (level.nextThreshold - level.currentThreshold)) * 100)}%` }}
                  />
                )}
              </div>
              {level.nextThreshold
                ? <span className="text-xs text-atlas-muted whitespace-nowrap">还差 {level.remainingGrowthToNextLevel} → {level.nextLevelNameZh}</span>
                : <span className="text-xs text-amber-400">已达最高等级</span>
              }
            </div>
            {!level.canUploadZip && (
              <p className="mt-3 rounded-xl border border-amber-500/15 bg-amber-500/8 px-4 py-2.5 text-xs text-amber-400">
                成长值再积累 {level.remainingGrowthToUpload}，升到 {level.uploadUnlockLevelNameZh}（{level.uploadUnlockBadge}）即可解锁 Skill 投稿权限
              </p>
            )}
          </div>
        )}

        {/* Recent transactions */}
        <div className="atlas-panel px-6 py-5">
          <p className="section-kicker text-xs mb-1">Recent Transactions</p>
          <h2 className="display-title text-2xl text-atlas-strong">近期流水</h2>
          <div className="mt-4 space-y-2">
            {(summary?.recentTransactions ?? []).length === 0 ? (
              <p className="py-6 text-center text-sm text-atlas-muted">暂无流水记录</p>
            ) : (
              summary.recentTransactions.map((tx, i) => {
                const meta = TX_TYPE_LABEL[tx.type] ?? { label: tx.type, color: 'text-atlas-ink' }
                return (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-atlas-line bg-atlas-s2/40 px-4 py-3">
                    <div>
                      <p className={`text-sm font-medium ${meta.color}`}>{meta.label}</p>
                      {tx.note && <p className="text-xs text-atlas-muted mt-0.5">{tx.note}</p>}
                    </div>
                    <div className="text-right">
                      <p className={`font-mono text-sm font-bold ${tx.deltaPoints >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {tx.deltaPoints >= 0 ? '+' : ''}{tx.deltaPoints}
                      </p>
                      <p className="font-mono text-xs text-atlas-muted">余额 {tx.balanceAfter}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
          <Link to="/skills" className="atlas-button-outline mt-4 flex items-center justify-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4" /> 去逛技能市场赚积分
          </Link>
        </div>

      </div>
    </div>
  )
}

function StatBox({ icon, label, value, color }) {
  return (
    <div className="atlas-panel px-5 py-4 flex items-center gap-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-atlas-s2 border border-atlas-line ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-atlas-muted">{label}</p>
        <p className={`font-mono text-xl font-bold mt-0.5 ${color}`}>{value}</p>
      </div>
    </div>
  )
}
