import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Trophy, Download, TrendingUp, Zap, Flame, Crown, Medal, Award,
  Loader2, Users, BarChart3
} from 'lucide-react'
import { leaderboardApi } from '../services/api'
import { formatCount } from '../utils/format'

const RANK_ICONS = [
  <Crown key={0} className="h-5 w-5 text-amber-400" />,
  <Medal key={1} className="h-5 w-5 text-slate-300" />,
  <Award key={2} className="h-5 w-5 text-amber-600" />,
]

function RankBadge({ rank }) {
  if (rank < 3) return RANK_ICONS[rank]
  return <span className="font-mono text-sm font-bold text-atlas-muted w-5 text-center">{rank + 1}</span>
}

function SkillRankCard({ skill, rank, metricLabel, metricValue }) {
  return (
    <Link
      to={`/skills/${skill.slug}`}
      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-atlas-s3 transition group"
    >
      <div className="w-7 flex items-center justify-center shrink-0">
        <RankBadge rank={rank} />
      </div>
      <span className="text-xl shrink-0">{skill.iconEmoji ?? '🔧'}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-atlas-ink text-sm truncate group-hover:text-atlas-teal transition">
          {skill.name}
        </p>
        <p className="text-xs text-atlas-muted truncate">{skill.category?.nameZh ?? '未分类'}</p>
      </div>
      <span className="font-mono text-sm font-bold text-atlas-teal shrink-0">
        {formatCount(metricValue)}
        <span className="text-xs text-atlas-muted font-normal ml-1">{metricLabel}</span>
      </span>
    </Link>
  )
}

function UserRankCard({ user, rank, metricLabel, metricValue }) {
  return (
    <Link
      to={user.username ? `/u/${user.username}` : '#'}
      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-atlas-s3 transition group"
    >
      <div className="w-7 flex items-center justify-center shrink-0">
        <RankBadge rank={rank} />
      </div>
      <div className="relative shrink-0">
        {user.avatarUrl
          ? <img src={user.avatarUrl} className="h-8 w-8 rounded-full object-cover" alt="" />
          : <div className="h-8 w-8 rounded-full bg-atlas-teal/20 flex items-center justify-center text-atlas-teal font-bold text-sm">
              {user.username?.[0]?.toUpperCase() ?? '?'}
            </div>
        }
        {user.levelProfile && (
          <span className="absolute -bottom-1 -right-1 rounded-full bg-atlas-bg border border-atlas-line text-[9px] font-bold text-atlas-teal px-1 leading-tight">
            {user.levelProfile.level}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-atlas-ink text-sm truncate group-hover:text-atlas-teal transition">
          {user.username ?? '匿名用户'}
        </p>
        <p className="text-xs text-atlas-muted truncate">{user.levelProfile?.levelName ?? '探索者'}</p>
      </div>
      <span className="font-mono text-sm font-bold text-atlas-teal shrink-0">
        {formatCount(metricValue)}
        <span className="text-xs text-atlas-muted font-normal ml-1">{metricLabel}</span>
      </span>
    </Link>
  )
}

function LeaderboardPanel({ title, icon, children, loading }) {
  return (
    <div className="atlas-panel px-0 py-5 overflow-hidden">
      <div className="flex items-center gap-2 px-5 mb-4">
        <div className="text-atlas-teal">{icon}</div>
        <h2 className="display-title text-lg text-atlas-strong">{title}</h2>
      </div>
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-atlas-teal" />
        </div>
      ) : (
        <div className="divide-y divide-atlas-line">
          {children}
        </div>
      )}
    </div>
  )
}

export default function Leaderboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSkillTab, setActiveSkillTab] = useState('downloads')
  const [activeUserTab, setActiveUserTab] = useState('balance')

  useEffect(() => {
    setLoading(true)
    leaderboardApi.get()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const skillTabs = [
    { key: 'downloads', label: '下载榜', icon: <Download className="h-3.5 w-3.5" /> },
    { key: 'clicks', label: '热度榜', icon: <TrendingUp className="h-3.5 w-3.5" /> },
  ]

  const userTabs = [
    { key: 'balance', label: '积分榜', icon: <Zap className="h-3.5 w-3.5" /> },
    { key: 'spent', label: '消费榜', icon: <BarChart3 className="h-3.5 w-3.5" /> },
    { key: 'streak', label: '连签榜', icon: <Flame className="h-3.5 w-3.5" /> },
  ]

  const currentSkills = activeSkillTab === 'downloads'
    ? { list: data?.topSkillsByDownloads ?? [], metric: '次', key: 'downloadCount' }
    : { list: data?.topSkillsByClicks ?? [], metric: '次', key: 'clickCount' }

  const currentUsers = activeUserTab === 'balance'
    ? { list: data?.topUsersByBalance ?? [], metric: '积分', key: 'pointsBalance' }
    : activeUserTab === 'spent'
    ? { list: data?.topUsersBySpent ?? [], metric: '积分', key: 'totalPointsSpent' }
    : { list: data?.topUsersByStreak ?? [], metric: '天', key: 'checkInStreakDays' }

  return (
    <div className="px-3 pb-16 pt-4 sm:px-4 lg:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="atlas-panel-dark surface-noise relative overflow-hidden px-6 py-7 sm:px-8">
          <div className="hero-wave opacity-40" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/15 border border-amber-400/25">
              <Trophy className="h-7 w-7 text-amber-400" />
            </div>
            <div>
              <p className="section-kicker text-atlas-muted">Community Rankings</p>
              <h1 className="display-title mt-1 text-3xl text-atlas-strong">排行榜</h1>
              <p className="mt-1 text-sm text-atlas-muted">发现最受欢迎的技能和最活跃的创作者</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Skills Leaderboard */}
          <div className="space-y-0">
            <div className="atlas-panel px-0 py-5 overflow-hidden">
              <div className="flex items-center gap-2 px-5 mb-3">
                <div className="text-atlas-teal"><Download className="h-5 w-5" /></div>
                <h2 className="display-title text-lg text-atlas-strong">技能榜</h2>
              </div>
              {/* Sub-tabs */}
              <div className="flex gap-1 px-5 mb-4">
                {skillTabs.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setActiveSkillTab(t.key)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      activeSkillTab === t.key
                        ? 'bg-atlas-teal/15 text-atlas-teal border border-atlas-teal/25'
                        : 'text-atlas-muted hover:text-atlas-ink hover:bg-atlas-s3'
                    }`}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-atlas-teal" />
                </div>
              ) : (
                <div className="divide-y divide-atlas-line">
                  {currentSkills.list.map((skill, i) => (
                    <SkillRankCard
                      key={skill.id}
                      skill={skill}
                      rank={i}
                      metricLabel={currentSkills.metric}
                      metricValue={skill[currentSkills.key]}
                    />
                  ))}
                  {currentSkills.list.length === 0 && (
                    <p className="py-8 text-center text-sm text-atlas-muted">暂无数据</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Users Leaderboard */}
          <div className="space-y-0">
            <div className="atlas-panel px-0 py-5 overflow-hidden">
              <div className="flex items-center gap-2 px-5 mb-3">
                <div className="text-atlas-teal"><Users className="h-5 w-5" /></div>
                <h2 className="display-title text-lg text-atlas-strong">用户榜</h2>
              </div>
              {/* Sub-tabs */}
              <div className="flex gap-1 px-5 mb-4 flex-wrap">
                {userTabs.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setActiveUserTab(t.key)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      activeUserTab === t.key
                        ? 'bg-atlas-teal/15 text-atlas-teal border border-atlas-teal/25'
                        : 'text-atlas-muted hover:text-atlas-ink hover:bg-atlas-s3'
                    }`}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-atlas-teal" />
                </div>
              ) : (
                <div className="divide-y divide-atlas-line">
                  {currentUsers.list.map((user, i) => (
                    <UserRankCard
                      key={user.id}
                      user={user}
                      rank={i}
                      metricLabel={currentUsers.metric}
                      metricValue={user[currentUsers.key]}
                    />
                  ))}
                  {currentUsers.list.length === 0 && (
                    <p className="py-8 text-center text-sm text-atlas-muted">暂无数据</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
