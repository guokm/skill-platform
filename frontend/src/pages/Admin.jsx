import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RefreshCcw, Trash2, Star, StarOff, ShieldCheck, ShieldX,
  Search, Loader2, Users, TrendingUp, Download, Zap,
  ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2
} from 'lucide-react'
import { adminApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { formatCount } from '../utils/format'

export default function Admin() {
  const { isAdmin, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab] = useState('skills')  // skills | users | crawl
  const [stats, setStats] = useState(null)

  // Skills list state
  const [skills, setSkills] = useState([])
  const [skillsLoading, setSkillsLoading] = useState(false)
  const [skillsPagination, setSkillsPagination] = useState({})
  const [skillKeyword, setSkillKeyword] = useState('')
  const [skillPage, setSkillPage] = useState(0)
  const [actionLoading, setActionLoading] = useState({})

  // Users state
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)

  // Crawl state
  const [crawling, setCrawling] = useState(false)
  const [crawlResult, setCrawlResult] = useState(null)

  // Toast
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/admin/login')
    }
  }, [authLoading, isAdmin])

  // Load stats
  useEffect(() => {
    adminApi.stats().then(r => setStats(r.data)).catch(() => {
      showToast('加载统计数据失败', 'error')
    })
  }, [tab])

  // Load skills
  const loadSkills = useCallback(async () => {
    setSkillsLoading(true)
    try {
      const res = await adminApi.listSkills({ page: skillPage, size: 15, keyword: skillKeyword || undefined })
      setSkills(res.data.content)
      setSkillsPagination(res.data)
    } catch (e) {
      showToast('加载 Skills 列表失败：' + (e.response?.data?.error || e.message), 'error')
    } finally { setSkillsLoading(false) }
  }, [skillPage, skillKeyword])

  useEffect(() => {
    if (tab === 'skills') loadSkills()
  }, [tab, loadSkills])

  // Load users
  const loadUsers = useCallback(async () => {
    setUsersLoading(true)
    try {
      const res = await adminApi.listUsers()
      setUsers(res.data)
    } catch (e) {
      showToast('加载用户列表失败：' + (e.response?.data?.error || e.message), 'error')
    } finally { setUsersLoading(false) }
  }, [])

  useEffect(() => {
    if (tab === 'users') loadUsers()
  }, [tab, loadUsers])

  const handleCrawl = async () => {
    setCrawling(true)
    setCrawlResult(null)
    try {
      const res = await adminApi.crawl()
      setCrawlResult(res.data)
      showToast(`爬取完成：新增 ${res.data.created}，更新 ${res.data.updated}，跳过 ${res.data.skipped}`)
      loadSkills()
    } catch (e) {
      showToast('爬取失败：' + (e.response?.data?.message || e.message), 'error')
    } finally {
      setCrawling(false)
    }
  }

  const handleToggleFeatured = async (skill) => {
    setActionLoading(p => ({ ...p, [skill.id + '_feat']: true }))
    try {
      const res = await adminApi.toggleFeatured(skill.id)
      setSkills(skills.map(s => s.id === skill.id ? { ...s, featured: res.data.featured } : s))
      showToast(`${res.data.featured ? '已精选' : '取消精选'}：${skill.name}`)
    } catch { showToast('操作失败', 'error') }
    finally { setActionLoading(p => ({ ...p, [skill.id + '_feat']: false })) }
  }

  const handleToggleVerified = async (skill) => {
    setActionLoading(p => ({ ...p, [skill.id + '_ver']: true }))
    try {
      const res = await adminApi.toggleVerified(skill.id)
      setSkills(skills.map(s => s.id === skill.id ? { ...s, verified: res.data.verified } : s))
      showToast(`${res.data.verified ? '已验证' : '取消验证'}：${skill.name}`)
    } catch { showToast('操作失败', 'error') }
    finally { setActionLoading(p => ({ ...p, [skill.id + '_ver']: false })) }
  }

  const handleDelete = async (skill) => {
    if (!window.confirm(`确认删除「${skill.name}」？此操作不可撤销。`)) return
    setActionLoading(p => ({ ...p, [skill.id + '_del']: true }))
    try {
      await adminApi.deleteSkill(skill.id)
      setSkills(skills.filter(s => s.id !== skill.id))
      showToast(`已删除：${skill.name}`)
    } catch { showToast('删除失败', 'error') }
    finally { setActionLoading(p => ({ ...p, [skill.id + '_del']: false })) }
  }

  const handleToggleAdmin = async (user) => {
    try {
      const res = await adminApi.toggleAdmin(user.id)
      setUsers(users.map(u => u.id === user.id ? res.data : u))
      showToast(`${res.data.isAdmin ? '已设为管理员' : '已移除管理员权限'}：${user.username}`)
    } catch { showToast('操作失败', 'error') }
  }

  if (authLoading) return <PageLoader />

  const TABS = [
    { key: 'skills', label: 'Skills 管理' },
    { key: 'users', label: '用户管理' },
    { key: 'crawl', label: '爬取中心' },
  ]

  return (
    <div className="px-3 pb-12 pt-4 sm:px-4 lg:px-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-2xl text-sm font-medium ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-atlas-ink text-white'
        }`}>
          {toast.type === 'error' ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 text-emerald-300" />}
          {toast.msg}
        </div>
      )}

      <div className="mx-auto max-w-7xl space-y-5">
        {/* Header */}
        <div className="atlas-panel-dark surface-noise relative overflow-hidden px-6 py-6 sm:px-8">
          <div className="hero-wave opacity-50" />
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="section-kicker text-white/50">Admin Dashboard</p>
              <h1 className="display-title mt-2 text-3xl text-white">管理后台</h1>
            </div>
            {stats && (
              <div className="flex flex-wrap gap-4">
                <StatChip label="Skills" value={formatCount(stats.totalSkills)} icon={<Zap className="h-4 w-4" />} />
                <StatChip label="用户" value={formatCount(stats.totalUsers)} icon={<Users className="h-4 w-4" />} />
                <StatChip label="总点击" value={formatCount(stats.totalClicks)} icon={<TrendingUp className="h-4 w-4" />} />
                <StatChip label="总下载" value={formatCount(stats.totalDownloads)} icon={<Download className="h-4 w-4" />} />
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                tab === t.key ? 'bg-atlas-ink text-white' : 'atlas-button-outline'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Skills Tab ─────────────────────────────────────────────────────── */}
        {tab === 'skills' && (
          <div className="atlas-panel px-5 py-5 space-y-4">
            {/* Search + Refresh */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={skillKeyword}
                  onChange={(e) => { setSkillKeyword(e.target.value); setSkillPage(0) }}
                  placeholder="搜索 Skill 名称…"
                  className="atlas-input pl-11"
                />
              </div>
              <button onClick={loadSkills} className="atlas-button-outline gap-2">
                <RefreshCcw className="h-4 w-4" /> 刷新
              </button>
            </div>

            {/* Table */}
            {skillsLoading ? <TableLoader /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(214,198,178,0.8)] text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                      <th className="pb-3 pr-4 font-medium">Skill</th>
                      <th className="pb-3 pr-4 font-medium hidden md:table-cell">分类</th>
                      <th className="pb-3 pr-4 font-medium hidden sm:table-cell">点击</th>
                      <th className="pb-3 pr-4 font-medium hidden sm:table-cell">下载</th>
                      <th className="pb-3 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(214,198,178,0.5)]">
                    {skills.map(skill => (
                      <tr key={skill.id} className="group hover:bg-white/60">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{skill.iconEmoji ?? '🔧'}</span>
                            <div>
                              <p className="font-medium text-atlas-ink truncate max-w-[180px]">{skill.name}</p>
                              <p className="text-xs text-slate-400 truncate max-w-[180px]">{skill.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4 hidden md:table-cell">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                            {skill.category?.nameZh ?? '未分类'}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-slate-600 hidden sm:table-cell">{formatCount(skill.clickCount)}</td>
                        <td className="py-3 pr-4 text-slate-600 hidden sm:table-cell">{formatCount(skill.downloadCount)}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            {/* Featured */}
                            <ActionBtn
                              loading={actionLoading[skill.id + '_feat']}
                              onClick={() => handleToggleFeatured(skill)}
                              title={skill.featured ? '取消精选' : '设为精选'}
                              active={skill.featured}
                              activeColor="text-yellow-500"
                            >
                              {skill.featured ? <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" /> : <StarOff className="h-4 w-4" />}
                            </ActionBtn>
                            {/* Verified */}
                            <ActionBtn
                              loading={actionLoading[skill.id + '_ver']}
                              onClick={() => handleToggleVerified(skill)}
                              title={skill.verified ? '取消验证' : '标记已验证'}
                            >
                              {skill.verified ? <ShieldCheck className="h-4 w-4 text-emerald-500" /> : <ShieldX className="h-4 w-4 text-slate-400" />}
                            </ActionBtn>
                            {/* Delete */}
                            <ActionBtn
                              loading={actionLoading[skill.id + '_del']}
                              onClick={() => handleDelete(skill)}
                              title="删除"
                              danger
                            >
                              <Trash2 className="h-4 w-4" />
                            </ActionBtn>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {skills.length === 0 && (
                      <tr><td colSpan={5} className="py-10 text-center text-slate-400">没有找到 Skills</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {skillsPagination.totalPages > 1 && (
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>共 {skillsPagination.totalElements} 条</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSkillPage(p => Math.max(0, p - 1))}
                    disabled={skillPage === 0}
                    className="atlas-button-outline px-3 py-2 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span>{skillPage + 1} / {skillsPagination.totalPages}</span>
                  <button
                    onClick={() => setSkillPage(p => p + 1)}
                    disabled={skillsPagination.last}
                    className="atlas-button-outline px-3 py-2 disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Users Tab ──────────────────────────────────────────────────────── */}
        {tab === 'users' && (
          <div className="atlas-panel px-5 py-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="display-title text-xl text-atlas-ink">用户列表</h2>
              <button onClick={loadUsers} className="atlas-button-outline gap-2">
                <RefreshCcw className="h-4 w-4" /> 刷新
              </button>
            </div>
            {usersLoading ? <TableLoader /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(214,198,178,0.8)] text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                      <th className="pb-3 pr-4 font-medium">用户</th>
                      <th className="pb-3 pr-4 font-medium hidden sm:table-cell">Linux.do ID</th>
                      <th className="pb-3 pr-4 font-medium">Trust</th>
                      <th className="pb-3 pr-4 font-medium hidden md:table-cell">最后登录</th>
                      <th className="pb-3 font-medium">管理员</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(214,198,178,0.5)]">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-white/60">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            {u.avatarUrl
                              ? <img src={u.avatarUrl} className="h-8 w-8 rounded-full object-cover" alt="" />
                              : <div className="flex h-8 w-8 items-center justify-center rounded-full bg-atlas-ink text-white text-xs font-bold">{u.username?.[0]?.toUpperCase()}</div>
                            }
                            <div>
                              <p className="font-medium">{u.username}</p>
                              <p className="text-xs text-slate-400">{u.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-slate-400 font-mono text-xs hidden sm:table-cell">{u.linuxDoId}</td>
                        <td className="py-3 pr-4">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            u.trustLevel >= 3 ? 'bg-emerald-100 text-emerald-700' :
                            u.trustLevel >= 2 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                          }`}>L{u.trustLevel}</span>
                        </td>
                        <td className="py-3 pr-4 text-slate-400 text-xs hidden md:table-cell">
                          {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('zh-CN') : '—'}
                        </td>
                        <td className="py-3">
                          <button
                            onClick={() => handleToggleAdmin(u)}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                              u.isAdmin ? 'bg-indigo-100 text-indigo-700 hover:bg-red-100 hover:text-red-600' : 'bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-700'
                            }`}
                          >
                            {u.isAdmin ? '✓ 管理员' : '设为管理员'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan={5} className="py-10 text-center text-slate-400">暂无用户</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Crawl Tab ──────────────────────────────────────────────────────── */}
        {tab === 'crawl' && (
          <div className="atlas-panel px-6 py-6 space-y-6">
            <div>
              <p className="section-kicker">Skill Crawler</p>
              <h2 className="display-title mt-2 text-3xl text-atlas-ink">爬取中心</h2>
              <p className="mt-2 text-sm text-slate-600">
                从挂载的 Skills 目录递归扫描所有 <code className="rounded bg-slate-100 px-1 text-xs">SKILL.md</code>，自动解析并入库。
              </p>
            </div>

            <button
              onClick={handleCrawl}
              disabled={crawling}
              className="atlas-button-solid gap-3 px-8 py-3.5 text-base disabled:opacity-60"
            >
              {crawling
                ? <><Loader2 className="h-5 w-5 animate-spin" /> 爬取中…</>
                : <><RefreshCcw className="h-5 w-5" /> 立即爬取</>
              }
            </button>

            {crawlResult && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-5">
                <p className="font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" /> 爬取完成
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
                  <CrawlStat label="扫描" value={crawlResult.scanned ?? '—'} />
                  <CrawlStat label="新增" value={crawlResult.created} color="text-emerald-700" />
                  <CrawlStat label="更新" value={crawlResult.updated} color="text-blue-700" />
                  <CrawlStat label="跳过" value={crawlResult.skipped} color="text-orange-600" />
                </div>
                {crawlResult.roots && (
                  <p className="mt-3 text-xs text-emerald-600">
                    扫描路径: {Array.isArray(crawlResult.roots) ? crawlResult.roots.join(', ') : crawlResult.roots}
                  </p>
                )}
              </div>
            )}

            <div className="rounded-2xl bg-slate-50 border border-[rgba(214,198,178,0.9)] px-5 py-4 text-sm text-slate-600 space-y-1.5">
              <p className="font-medium text-atlas-ink">自动爬取计划</p>
              <p>系统会按配置的 cron 表达式自动触发爬取（默认每 6 小时一次）。</p>
              <p>也可点击上方按钮手动触发，新增和更新会立即生效。</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatChip({ label, value, icon }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-4 py-2 text-white">
      {icon}
      <span className="text-sm font-semibold">{value}</span>
      <span className="text-xs text-white/60">{label}</span>
    </div>
  )
}

function ActionBtn({ loading, onClick, title, danger, children }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      title={title}
      className={`flex h-8 w-8 items-center justify-center rounded-xl transition disabled:opacity-50 ${
        danger ? 'hover:bg-red-50 hover:text-red-500 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
      }`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </button>
  )
}

function CrawlStat({ label, value, color = 'text-slate-700' }) {
  return (
    <div className="rounded-xl bg-white px-3 py-2.5 text-center shadow-sm">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}

function TableLoader() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  )
}

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[var(--atlas-teal)]" />
    </div>
  )
}
