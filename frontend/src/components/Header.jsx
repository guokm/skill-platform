import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Award, Calendar, Coins, Heart, Menu, Sparkles, User, X, LogIn, LogOut, Settings, ChevronDown, Upload } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { authApi, pointsApi } from '../services/api'

const NAV_ITEMS = [
  { label: '行业地图', to: '/' },
  { label: '全部 Skills', to: '/skills' },
  { label: '排行榜', to: '/leaderboard' },
  { label: '最新入库', to: '/skills?sortBy=newest' },
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [pointsSummary, setPointsSummary] = useState(null)
  const [checkingIn, setCheckingIn] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isLoggedIn, isAdmin, logout } = useAuth()

  useEffect(() => {
    if (!isLoggedIn) { setPointsSummary(null); return }
    pointsApi.summary().then(res => setPointsSummary(res.data)).catch(() => {})
  }, [isLoggedIn])

  const handleCheckIn = async (e) => {
    e.stopPropagation()
    if (checkingIn || pointsSummary?.checkedInToday) return
    setCheckingIn(true)
    try {
      const res = await pointsApi.checkIn()
      setPointsSummary(prev => prev
        ? { ...prev, pointsBalance: res.data.pointsBalance, checkedInToday: true, checkInStreakDays: res.data.checkInStreakDays }
        : prev
      )
    } catch { /* already checked in or error */ }
    finally { setCheckingIn(false) }
  }

  const handleLoginWithLinuxDo = async () => {
    try {
      const res = await authApi.getLoginUrl()
      window.location.href = res.data.url
    } catch {
      navigate('/admin/login')
    }
  }

  return (
    <header className="content-shell sticky top-0 z-50 px-3 pt-3 sm:px-4 lg:px-6">
      <div className="mx-auto max-w-7xl bg-atlas-surface/90 backdrop-blur border-b border-atlas-line px-4 py-3 sm:px-6 rounded-2xl">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-2xl shadow-lg">
                <span>🧭</span>
              </div>
              <div className="min-w-0">
                <p className="font-display text-2xl leading-none text-atlas-ink">Skill Atlas</p>
                <p className="mt-1 text-xs uppercase tracking-[0.22em] text-atlas-muted">Industry skill marketplace</p>
              </div>
            </div>
          </Link>

          {/* Nav + Auth — desktop */}
          <div className="hidden items-center gap-1 lg:ml-auto lg:flex">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.to && !item.to.includes('?')
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-atlas-teal/10 text-atlas-teal border border-atlas-teal/20'
                      : 'text-atlas-muted hover:text-atlas-ink hover:bg-atlas-s2'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}

            {/* Auth area */}
            {isLoggedIn ? (
              <div className="relative ml-2 flex items-center gap-2">
                <div className="hidden rounded-full border border-atlas-teal/25 bg-atlas-teal/10 px-3 py-2 text-xs font-semibold text-atlas-teal sm:inline-flex">
                  {user?.pointsBalance ?? 0} 积分
                </div>
                {user?.levelProfile?.badge && (
                  <div className="hidden rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 xl:inline-flex">
                    {user.levelProfile.badge} {user.levelProfile.nameZh}
                  </div>
                )}
                <button
                  onClick={() => setUserMenuOpen(v => !v)}
                  className="flex items-center gap-2 rounded-full border border-atlas-line bg-atlas-s2 px-3 py-2 text-sm text-atlas-ink hover:border-atlas-teal/60 hover:bg-atlas-s2/80 transition"
                >
                  {user?.avatarUrl
                    ? <img src={user.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                    : <div className="flex h-6 w-6 items-center justify-center rounded-full bg-atlas-teal text-white text-xs font-bold">{user?.username?.[0]?.toUpperCase()}</div>
                  }
                  <span className="max-w-[80px] truncate font-medium">{user?.username}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-atlas-muted" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-atlas-s2 border border-atlas-line rounded-2xl py-2 text-sm shadow-xl z-50" onClick={() => setUserMenuOpen(false)}>
                    {/* Points panel */}
                    <div className="mx-2 mb-2 rounded-xl border border-atlas-teal/15 bg-atlas-surface/60 px-3 py-2.5" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-1 text-xs text-atlas-muted"><Coins className="h-3 w-3 text-atlas-teal" />余额</span>
                        <span className="font-mono text-base font-bold text-atlas-teal">
                          {pointsSummary?.pointsBalance ?? user?.pointsBalance ?? 0}
                        </span>
                      </div>
                      <button
                        onClick={handleCheckIn}
                        disabled={pointsSummary?.checkedInToday || checkingIn}
                        className={`flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition ${
                          pointsSummary?.checkedInToday
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
                            : 'bg-atlas-teal/10 text-atlas-teal border border-atlas-teal/20 hover:bg-atlas-teal/20'
                        }`}
                      >
                        <Calendar className="h-3 w-3" />
                        {pointsSummary?.checkedInToday
                          ? `已签到 · ${pointsSummary.checkInStreakDays}天连签`
                          : checkingIn ? '签到中…' : '每日签到 +5 积分'}
                      </button>
                    </div>
                    <Link to={`/u/${user?.username}`} className="flex items-center gap-2 px-4 py-2 text-atlas-ink hover:bg-atlas-surface/60 transition">
                      <User className="h-4 w-4 text-atlas-teal" /> 我的主页
                    </Link>
                    <Link to="/me/points" className="flex items-center gap-2 px-4 py-2 text-atlas-ink hover:bg-atlas-surface/60 transition">
                      <Coins className="h-4 w-4 text-atlas-teal" /> 积分中心
                    </Link>
                    <Link to="/me/purchases" className="flex items-center gap-2 px-4 py-2 text-atlas-ink hover:bg-atlas-surface/60 transition">
                      <Award className="h-4 w-4 text-amber-400" /> 我的资产
                    </Link>
                    <Link to="/me/favorites" className="flex items-center gap-2 px-4 py-2 text-atlas-ink hover:bg-atlas-surface/60 transition">
                      <Heart className="h-4 w-4 text-rose-400" /> 我的收藏
                    </Link>
                    <Link to="/me/skills" className="flex items-center gap-2 px-4 py-2 text-atlas-ink hover:bg-atlas-surface/60 transition">
                      <Upload className="h-4 w-4 text-purple-400" /> 我的投稿
                    </Link>
                    <Link to="/submit" className="flex items-center gap-2 px-4 py-2 text-atlas-ink hover:bg-atlas-surface/60 transition">
                      <Upload className="h-4 w-4 text-emerald-400" /> 上传 Skill
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" className="flex items-center gap-2 px-4 py-2 text-atlas-ink hover:bg-atlas-surface/60 transition">
                        <Settings className="h-4 w-4" /> 管理后台
                      </Link>
                    )}
                    <div className="my-1 mx-4 border-t border-atlas-line" />
                    <button
                      onClick={logout}
                      className="flex w-full items-center gap-2 px-4 py-2 text-orange-400 hover:bg-orange-500/10 transition"
                    >
                      <LogOut className="h-4 w-4" /> 退出登录
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleLoginWithLinuxDo}
                className="ml-2 atlas-button-solid flex items-center gap-2 px-4 py-2.5 text-sm"
              >
                <LogIn className="h-4 w-4" />
                Linux.do 登录
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-atlas-line bg-atlas-s2 text-atlas-ink hover:border-atlas-teal/60 lg:hidden transition"
            onClick={() => setMenuOpen(v => !v)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="mt-4 space-y-3 border-t border-atlas-line pt-4 lg:hidden">
            <div className="grid gap-2">
              {isLoggedIn && (
                <div className="rounded-2xl border border-atlas-teal/20 bg-atlas-teal/10 px-4 py-3 text-sm font-medium text-atlas-teal">
                  当前积分：{user?.pointsBalance ?? 0}
                </div>
              )}
              {isLoggedIn && user?.levelProfile?.nameZh && (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-300">
                  当前等级：{user.levelProfile.badge} {user.levelProfile.nameZh}
                </div>
              )}
              {NAV_ITEMS.map((item) => (
                <Link key={item.to} to={item.to} className="atlas-button-outline justify-between" onClick={() => setMenuOpen(false)}>
                  <span>{item.label}</span>
                  <Sparkles className="h-4 w-4 text-atlas-muted" />
                </Link>
              ))}
              {isLoggedIn && (
                <Link to={`/u/${user?.username}`} className="atlas-button-outline justify-between" onClick={() => setMenuOpen(false)}>
                  <span>👤 我的主页</span>
                </Link>
              )}
              {isLoggedIn && (
                <Link to="/me/favorites" className="atlas-button-outline justify-between" onClick={() => setMenuOpen(false)}>
                  <span>❤️ 我的收藏</span>
                </Link>
              )}
              {isLoggedIn && (
                <Link to="/me/points" className="atlas-button-outline justify-between" onClick={() => setMenuOpen(false)}>
                  <span>✨ 积分中心</span>
                </Link>
              )}
              {isLoggedIn && (
                <Link to="/me/purchases" className="atlas-button-outline justify-between" onClick={() => setMenuOpen(false)}>
                  <span>🏆 我的资产</span>
                </Link>
              )}
              {isLoggedIn && (
                <Link to="/me/skills" className="atlas-button-outline justify-between" onClick={() => setMenuOpen(false)}>
                  <span>📦 我的投稿</span>
                </Link>
              )}
              {isLoggedIn && (
                <Link to="/submit" className="atlas-button-outline justify-between" onClick={() => setMenuOpen(false)}>
                  <span>📦 投稿技能</span>
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin" className="atlas-button-outline justify-between" onClick={() => setMenuOpen(false)}>
                  <span>🛠 管理后台</span>
                </Link>
              )}
              {isLoggedIn
                ? <button onClick={() => { logout(); setMenuOpen(false) }} className="atlas-button-outline text-orange-400 border-orange-500/20">
                    <LogOut className="h-4 w-4" /> 退出登录
                  </button>
                : <button onClick={handleLoginWithLinuxDo} className="atlas-button-solid w-full justify-center">
                    <LogIn className="h-4 w-4" /> Linux.do 登录
                  </button>
              }
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
