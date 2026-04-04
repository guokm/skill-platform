import { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  RefreshCcw, Trash2, Star, StarOff, ShieldCheck, ShieldX,
  Search, Loader2, Users, TrendingUp, Download, Zap,
  ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2,
  Clock, CheckCheck, XCircle, ExternalLink
} from 'lucide-react'
import { adminApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { formatCount } from '../utils/format'

export default function Admin() {
  const { isAdmin, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab] = useState('skills')  // skills | users | submissions | crawl
  const [stats, setStats] = useState(null)

  // Skills list state
  const [skills, setSkills] = useState([])
  const [skillsLoading, setSkillsLoading] = useState(false)
  const [skillsPagination, setSkillsPagination] = useState({})
  const [skillKeyword, setSkillKeyword] = useState('')
  const [skillPage, setSkillPage] = useState(0)
  const [actionLoading, setActionLoading] = useState({})
  const [priceDrafts, setPriceDrafts] = useState({})

  // Batch operations state
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [batchLoading, setBatchLoading] = useState(false)

  // Users state
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)

  // Submissions state
  const [submissions, setSubmissions] = useState([])
  const [submissionsLoading, setSubmissionsLoading] = useState(false)
  const [submissionActionLoading, setSubmissionActionLoading] = useState({})
  const [rejectNote, setRejectNote] = useState({})

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
      setPriceDrafts(Object.fromEntries((res.data.content ?? []).map(skill => [skill.id, `${skill.pricePoints ?? 1}`])))
      setSkillsPagination(res.data)
      setSelectedIds(new Set())
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

  // Load submissions
  const loadSubmissions = useCallback(async () => {
    setSubmissionsLoading(true)
    try {
      const res = await adminApi.listSubmissions()
      setSubmissions(res.data)
    } catch (e) {
      showToast('加载投稿列表失败：' + (e.response?.data?.error || e.message), 'error')
    } finally { setSubmissionsLoading(false) }
  }, [])

  useEffect(() => {
    if (tab === 'submissions') loadSubmissions()
  }, [tab, loadSubmissions])

  const handleApproveSubmission = async (skill) => {
    setSubmissionActionLoading(p => ({ ...p, [skill.id + '_approve']: true }))
    try {
      await adminApi.approveSubmission(skill.id)
      setSubmissions(submissions.filter(s => s.id !== skill.id))
      showToast(`✅ 已通过审核：${skill.name}`)
    } catch (e) {
      showToast('审核操作失败：' + (e.response?.data?.error || e.message), 'error')
    } finally { setSubmissionActionLoading(p => ({ ...p, [skill.id + '_approve']: false })) }
  }

  const handleRejectSubmission = async (skill) => {
    const note = rejectNote[skill.id] || '内容不符合平台标准'
    if (!window.confirm(`确认拒绝「${skill.name}」？该 Skill 记录将被删除。`)) return
    setSubmissionActionLoading(p => ({ ...p, [skill.id + '_reject']: true }))
    try {
      await adminApi.rejectSubmission(skill.id, { note })
      setSubmissions(submissions.filter(s => s.id !== skill.id))
      showToast(`已拒绝：${skill.name}`)
    } catch (e) {
      showToast('拒绝操作失败：' + (e.response?.data?.error || e.message), 'error')
    } finally { setSubmissionActionLoading(p => ({ ...p, [skill.id + '_reject']: false })) }
  }

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

  const handleSavePrice = async (skill) => {
    const rawValue = priceDrafts[skill.id]
    const nextPrice = Number.parseInt(rawValue, 10)
    if (Number.isNaN(nextPrice) || nextPrice < 0) {
      showToast('积分定价必须是大于等于 0 的整数', 'error')
      return
    }
    setActionLoading(p => ({ ...p, [skill.id + '_price']: true }))
    try {
      const res = await adminApi.patchSkill(skill.id, { pricePoints: nextPrice })
      setSkills(skills.map(s => s.id === skill.id ? res.data : s))
      setPriceDrafts(p => ({ ...p, [skill.id]: `${res.data.pricePoints ?? nextPrice}` }))
      showToast(`已更新定价：${skill.name} -> ${nextPrice} 积分`)
    } catch (e) {
      showToast('更新定价失败：' + (e.response?.data?.error || e.message), 'error')
    } finally {
      setActionLoading(p => ({ ...p, [skill.id + '_price']: false }))
    }
  }

  const handleToggleCheckbox = (skillId) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(skillId)) {
        next.delete(skillId)
      } else {
        next.add(skillId)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    if (selectedIds.size === skills.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(skills.map(s => s.id)))
    }
  }

  const handleBatchFeatured = async () => {
    if (selectedIds.size === 0) return
    setBatchLoading(true)
    try {
      const unselectedSkills = Array.from(selectedIds).filter(id => {
        const skill = skills.find(s => s.id === id)
        return skill && !skill.featured
      })
      for (const skillId of unselectedSkills) {
        await adminApi.toggleFeatured(skillId)
      }
      await loadSkills()
      showToast(`已批量精选 ${unselectedSkills.length} 项`)
    } catch (e) {
      showToast('批量精选失败', 'error')
    } finally {
      setBatchLoading(false)
    }
  }

  const handleBatchVerified = async () => {
    if (selectedIds.size === 0) return
    setBatchLoading(true)
    try {
      const unverifiedSkills = Array.from(selectedIds).filter(id => {
        const skill = skills.find(s => s.id === id)
        return skill && !skill.verified
      })
      for (const skillId of unverifiedSkills) {
        await adminApi.toggleVerified(skillId)
      }
      await loadSkills()
      showToast(`已批量验证 ${unverifiedSkills.length} 项`)
    } catch (e) {
      showToast('批量验证失败', 'error')
    } finally {
      setBatchLoading(false)
    }
  }

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return
    if (!window.confirm(`确认删除 ${selectedIds.size} 项？此操作不可撤销。`)) return
    setBatchLoading(true)
    try {
      for (const skillId of selectedIds) {
        await adminApi.deleteSkill(skillId)
      }
      await loadSkills()
      showToast(`已删除 ${selectedIds.size} 项`)
    } catch (e) {
      showToast('批量删除失败', 'error')
    } finally {
      setBatchLoading(false)
    }
  }

  const handleToggleAdmin = async (user) => {
    try {
      const res = await adminApi.toggleAdmin(user.id)
      setUsers(users.map(u => u.id === user.id ? res.data : u))
      showToast(`${res.data.isAdmin ? '已设为管理员' : '已移除管理员权限'}：${user.username}`)
    } catch { showToast('操作失败', 'error') }
  }

  const handleAdjustPoints = async (user, deltaPoints) => {
    try {
      const res = await adminApi.adjustUserPoints(user.id, {
        deltaPoints,
        note: deltaPoints >= 0 ? '后台补充积分' : '后台扣减积分',
      })
      setUsers(users.map(u => (
        u.id === user.id
          ? { ...u, pointsBalance: res.data.pointsBalance, totalPointsSpent: res.data.totalPointsSpent }
          : u
      )))
      showToast(`${deltaPoints >= 0 ? '已增加' : '已扣减'} ${Math.abs(deltaPoints)} 积分：${user.username}`)
    } catch (e) {
      showToast('积分调整失败：' + (e.response?.data?.error || e.message), 'error')
    }
  }

  if (authLoading) return <PageLoader />

  const pendingCount = stats?.pendingSubmissions ?? 0

  const TABS = [
    { key: 'skills', label: 'Skills 管理' },
    { key: 'users', label: '用户管理' },
    { key: 'submissions', label: '投稿审核', badge: pendingCount },
    { key: 'crawl', label: '爬取中心' },
  ]

  return (
    <div className="px-3 pb-12 pt-4 sm:px-4 lg:px-6 bg-transparent">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-2xl text-sm font-medium border ${
          toast.type === 'error' ? 'bg-red-950/90 border-red-500/40 text-red-400' : 'bg-atlas-s2 border-atlas-teal/40 text-atlas-teal'
        }`}>
          {toast.type === 'error' ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      <div className="mx-auto max-w-7xl space-y-5">
        {/* Header with Stats Bar */}
        <div className="space-y-4">
          <div className="atlas-panel-dark surface-noise relative overflow-hidden px-6 py-6 sm:px-8">
            <div className="hero-wave opacity-50" />
            <div className="relative z-10">
              <p className="section-kicker text-atlas-muted">Admin Dashboard</p>
              <h1 className="display-title mt-2 text-3xl text-atlas-strong">管理后台</h1>
            </div>
          </div>
          {stats && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
              <StatChip label="Skills" value={formatCount(stats.totalSkills)} icon={<Zap className="h-4 w-4" />} />
              <StatChip label="用户" value={formatCount(stats.totalUsers)} icon={<Users className="h-4 w-4" />} />
              <StatChip label="总点击" value={formatCount(stats.totalClicks)} icon={<TrendingUp className="h-4 w-4" />} />
              <StatChip label="总下载" value={formatCount(stats.totalDownloads)} icon={<Download className="h-4 w-4" />} />
              <StatChip label="待审核" value={formatCount(stats.pendingSubmissions ?? 0)} icon={<Clock className="h-4 w-4" />} highlight={stats.pendingSubmissions > 0} />
              <StatChip label="已消费积分" value={formatCount(stats.totalPointsSpent)} icon={<Zap className="h-4 w-4" />} />
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-atlas-line flex gap-6">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-3 text-sm font-medium transition flex items-center gap-2 ${
                tab === t.key
                  ? 'border-b-2 border-atlas-teal text-atlas-teal'
                  : 'text-atlas-muted hover:text-atlas-ink'
              }`}
            >
              {t.label}
              {t.badge > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center leading-none">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Skills Tab ─────────────────────────────────────────────────────── */}
        {tab === 'skills' && (
          <div className="atlas-panel overflow-hidden px-5 py-5 space-y-4">
            {/* Search + Refresh */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-atlas-muted" />
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

            {/* Batch Operations Bar */}
            {selectedIds.size > 0 && (
              <div className="bg-atlas-teal/10 border border-atlas-teal/25 rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium text-atlas-teal">已选 {selectedIds.size} 项</span>
                <button
                  onClick={handleBatchFeatured}
                  disabled={batchLoading}
                  className="atlas-button-solid text-xs px-3 py-1.5 disabled:opacity-60"
                >
                  {batchLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : '批量精选'}
                </button>
                <button
                  onClick={handleBatchVerified}
                  disabled={batchLoading}
                  className="atlas-button-solid text-xs px-3 py-1.5 disabled:opacity-60"
                >
                  {batchLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : '批量验证'}
                </button>
                <button
                  onClick={handleBatchDelete}
                  disabled={batchLoading}
                  className="text-red-400 hover:bg-red-500/10 rounded-xl px-3 py-1.5 text-xs font-medium transition disabled:opacity-60"
                >
                  {batchLoading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : '批量删除'}
                </button>
              </div>
            )}

            {/* Table */}
            {skillsLoading ? <TableLoader /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-atlas-s2 border-b border-atlas-line">
                      <th className="py-3 px-4 text-left">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === skills.length && skills.length > 0}
                          onChange={handleSelectAll}
                          className="accent-cyan-500 cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-4 text-left section-kicker">Skill</th>
                      <th className="py-3 px-4 text-left section-kicker hidden md:table-cell">分类</th>
                      <th className="py-3 px-4 text-left section-kicker">定价</th>
                      <th className="py-3 px-4 text-left section-kicker hidden sm:table-cell">点击</th>
                      <th className="py-3 px-4 text-left section-kicker hidden sm:table-cell">下载</th>
                      <th className="py-3 px-4 text-left section-kicker">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skills.map(skill => (
                      <tr key={skill.id} className="border-b border-atlas-line hover:bg-atlas-s2/50 transition">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(skill.id)}
                            onChange={() => handleToggleCheckbox(skill.id)}
                            className="accent-cyan-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{skill.iconEmoji ?? '🔧'}</span>
                            <div>
                              <p className="font-medium text-atlas-ink truncate max-w-[180px]">{skill.name}</p>
                              <p className="text-xs text-atlas-muted truncate max-w-[180px]">{skill.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <span className="rounded-full bg-atlas-s3 border border-atlas-line px-2 py-0.5 text-xs text-atlas-muted">
                            {skill.category?.nameZh ?? '未分类'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex min-w-[150px] items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              value={priceDrafts[skill.id] ?? skill.pricePoints ?? 1}
                              onChange={(e) => setPriceDrafts(p => ({ ...p, [skill.id]: e.target.value }))}
                              className="atlas-input h-10 px-3 py-2 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => handleSavePrice(skill)}
                              disabled={actionLoading[skill.id + '_price']}
                              className="atlas-button-outline whitespace-nowrap px-3 py-2 text-xs"
                            >
                              {actionLoading[skill.id + '_price'] ? '保存中' : '保存'}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-atlas-muted hidden sm:table-cell font-mono text-xs">{formatCount(skill.clickCount)}</td>
                        <td className="py-3 px-4 text-atlas-muted hidden sm:table-cell font-mono text-xs">{formatCount(skill.downloadCount)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            {/* Featured */}
                            <ActionBtn
                              loading={actionLoading[skill.id + '_feat']}
                              onClick={() => handleToggleFeatured(skill)}
                              title={skill.featured ? '取消精选' : '设为精选'}
                            >
                              {skill.featured ? <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> : <StarOff className="h-4 w-4 text-atlas-muted" />}
                            </ActionBtn>
                            {/* Verified */}
                            <ActionBtn
                              loading={actionLoading[skill.id + '_ver']}
                              onClick={() => handleToggleVerified(skill)}
                              title={skill.verified ? '取消验证' : '标记已验证'}
                            >
                              {skill.verified ? <ShieldCheck className="h-4 w-4 text-emerald-400" /> : <ShieldX className="h-4 w-4 text-atlas-muted" />}
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
                      <tr><td colSpan={7} className="py-10 text-center text-atlas-muted">没有找到 Skills</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {skillsPagination.totalPages > 1 && (
              <div className="flex items-center justify-between text-sm text-atlas-muted">
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
          <div className="atlas-panel overflow-hidden px-5 py-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="display-title text-xl text-atlas-strong">用户列表</h2>
              <button onClick={loadUsers} className="atlas-button-outline gap-2">
                <RefreshCcw className="h-4 w-4" /> 刷新
              </button>
            </div>
            {usersLoading ? <TableLoader /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-atlas-s2 border-b border-atlas-line">
                      <th className="py-3 px-4 text-left section-kicker">用户</th>
                      <th className="py-3 px-4 text-left section-kicker hidden sm:table-cell">Linux.do ID</th>
                      <th className="py-3 px-4 text-left section-kicker">积分</th>
                      <th className="py-3 px-4 text-left section-kicker hidden md:table-cell">已消费</th>
                      <th className="py-3 px-4 text-left section-kicker">Trust</th>
                      <th className="py-3 px-4 text-left section-kicker hidden md:table-cell">最后登录</th>
                      <th className="py-3 px-4 text-left section-kicker">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-atlas-line hover:bg-atlas-s2/50 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {u.avatarUrl
                              ? <img src={u.avatarUrl} className="h-8 w-8 rounded-full object-cover" alt="" />
                              : <div className="flex h-8 w-8 items-center justify-center rounded-full bg-atlas-teal/20 text-atlas-teal text-xs font-bold">{u.username?.[0]?.toUpperCase()}</div>
                            }
                            <div>
                              <p className="font-medium text-atlas-ink">{u.username}</p>
                              <p className="text-xs text-atlas-muted">{u.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-atlas-muted font-mono text-xs hidden sm:table-cell">{u.linuxDoId}</td>
                        <td className="py-3 px-4 font-mono text-xs text-atlas-teal">{u.pointsBalance ?? 0}</td>
                        <td className="py-3 px-4 font-mono text-xs text-atlas-muted hidden md:table-cell">{u.totalPointsSpent ?? 0}</td>
                        <td className="py-3 px-4">
                          <span className="bg-atlas-teal/10 border border-atlas-teal/20 text-atlas-teal font-mono text-xs px-2 py-0.5 rounded-full">
                            L{u.trustLevel}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-atlas-muted text-xs hidden md:table-cell">
                          {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('zh-CN') : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => handleAdjustPoints(u, 10)}
                              className="atlas-button-outline px-3 py-1 text-xs"
                            >
                              +10 积分
                            </button>
                            <button
                              onClick={() => handleAdjustPoints(u, -10)}
                              className="atlas-button-outline px-3 py-1 text-xs"
                            >
                              -10 积分
                            </button>
                            <button
                              onClick={() => handleToggleAdmin(u)}
                              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                                u.isAdmin
                                  ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400'
                                  : 'atlas-button-outline text-xs'
                              }`}
                            >
                              {u.isAdmin ? '✓ 管理员' : '设为管理员'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan={7} className="py-10 text-center text-atlas-muted">暂无用户</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Submissions Tab ────────────────────────────────────────────────── */}
        {tab === 'submissions' && (
          <div className="atlas-panel overflow-hidden px-5 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="section-kicker">Community Submissions</p>
                <h2 className="display-title mt-1 text-xl text-atlas-strong">待审核投稿</h2>
                <p className="text-xs text-atlas-muted mt-1">用户上传的技能包需要审核通过后才会对外公开。</p>
              </div>
              <button onClick={loadSubmissions} className="atlas-button-outline gap-2">
                <RefreshCcw className="h-4 w-4" /> 刷新
              </button>
            </div>

            {submissionsLoading ? <TableLoader /> : submissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-atlas-muted">
                <CheckCircle2 className="h-10 w-10 text-emerald-400/60" />
                <p className="text-sm font-medium">没有待审核的投稿</p>
                <p className="text-xs">所有社区投稿已处理完毕</p>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map(skill => (
                  <div key={skill.id} className="atlas-panel-dark surface-noise rounded-2xl px-5 py-4 space-y-3">
                    <div className="flex items-start gap-4">
                      <span className="text-3xl mt-0.5">{skill.iconEmoji ?? '🔧'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-atlas-ink text-base">{skill.name}</h3>
                          <span className="rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-400 text-xs px-2 py-0.5 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> 待审核
                          </span>
                          {skill.pricePoints > 0 && (
                            <span className="rounded-full bg-atlas-teal/10 border border-atlas-teal/20 text-atlas-teal text-xs px-2 py-0.5">
                              {skill.pricePoints} 积分
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-atlas-muted mt-1">{skill.shortDescription || skill.description?.slice(0, 120) || '—'}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-atlas-muted">
                          {skill.submitterUsername && (
                            <Link to={`/u/${skill.submitterUsername}`} target="_blank" className="flex items-center gap-1 hover:text-atlas-teal transition">
                              <ExternalLink className="h-3 w-3" />
                              @{skill.submitterUsername}
                            </Link>
                          )}
                          <span>分类：{skill.category?.nameZh ?? '未分类'}</span>
                          {skill.tags?.length > 0 && (
                            <span>标签：{skill.tags.slice(0, 4).join(', ')}</span>
                          )}
                          <span>提交时间：{skill.createdAt ? new Date(skill.createdAt).toLocaleString('zh-CN') : '—'}</span>
                        </div>
                      </div>
                      <Link
                        to={`/skills/${skill.slug}`}
                        target="_blank"
                        className="shrink-0 text-xs text-atlas-muted hover:text-atlas-teal transition flex items-center gap-1"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> 预览
                      </Link>
                    </div>

                    {/* Reject note input + action buttons */}
                    <div className="border-t border-atlas-line pt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <input
                        type="text"
                        value={rejectNote[skill.id] ?? ''}
                        onChange={e => setRejectNote(p => ({ ...p, [skill.id]: e.target.value }))}
                        placeholder="拒绝理由（可选，默认：内容不符合平台标准）"
                        className="atlas-input text-xs flex-1 h-9"
                      />
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleApproveSubmission(skill)}
                          disabled={submissionActionLoading[skill.id + '_approve']}
                          className="atlas-button-solid gap-1.5 px-4 py-2 text-xs"
                        >
                          {submissionActionLoading[skill.id + '_approve']
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <CheckCheck className="h-3.5 w-3.5" />
                          }
                          通过
                        </button>
                        <button
                          onClick={() => handleRejectSubmission(skill)}
                          disabled={submissionActionLoading[skill.id + '_reject']}
                          className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 px-4 py-2 text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {submissionActionLoading[skill.id + '_reject']
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <XCircle className="h-3.5 w-3.5" />
                          }
                          拒绝
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Crawl Tab ──────────────────────────────────────────────────────── */}
        {tab === 'crawl' && (
          <div className="atlas-panel px-6 py-6 space-y-6">
            <div>
              <p className="section-kicker">Skill Crawler</p>
              <h2 className="display-title mt-2 text-3xl text-atlas-strong">爬取中心</h2>
              <p className="mt-2 text-sm text-atlas-muted">
                从挂载的 Skills 目录递归扫描所有 <code className="rounded bg-atlas-s3 px-1 text-xs font-mono text-atlas-teal">SKILL.md</code>，自动解析并入库。
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
              <div className="atlas-panel-dark surface-noise rounded-2xl px-6 py-5 space-y-4">
                <p className="font-semibold text-atlas-teal mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" /> 爬取完成
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <CrawlStat label="扫描" value={crawlResult.scanned ?? '—'} />
                  <CrawlStat label="新增" value={crawlResult.created} />
                  <CrawlStat label="更新" value={crawlResult.updated} />
                  <CrawlStat label="跳过" value={crawlResult.skipped} />
                </div>
                {crawlResult.roots && (
                  <p className="mt-2 text-xs text-atlas-muted font-mono">
                    扫描路径: {Array.isArray(crawlResult.roots) ? crawlResult.roots.join(', ') : crawlResult.roots}
                  </p>
                )}
              </div>
            )}

            <div className="atlas-panel-dark rounded-2xl px-5 py-4 text-sm text-atlas-muted space-y-1.5">
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

function StatChip({ label, value, icon, highlight }) {
  return (
    <div className={`atlas-panel px-5 py-4 flex items-center gap-3 ${highlight ? 'border-amber-500/30 bg-amber-500/5' : ''}`}>
      <div className={highlight ? 'text-amber-400' : 'text-atlas-teal'}>{icon}</div>
      <div>
        <p className="section-kicker text-atlas-muted">{label}</p>
        <p className={`font-mono text-2xl font-bold ${highlight ? 'text-amber-400' : 'text-atlas-teal'}`}>{value}</p>
      </div>
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
        danger ? 'text-red-400 hover:bg-red-500/10' : 'text-atlas-muted hover:text-atlas-teal hover:bg-atlas-s3'
      }`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin text-atlas-teal" /> : children}
    </button>
  )
}

function CrawlStat({ label, value }) {
  return (
    <div className="bg-atlas-s2 rounded-xl border border-atlas-line px-3 py-2.5 text-center">
      <p className="font-mono text-2xl text-atlas-teal font-bold">{value}</p>
      <p className="text-xs text-atlas-muted mt-0.5">{label}</p>
    </div>
  )
}

function TableLoader() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-xl bg-atlas-s3" />
      ))}
    </div>
  )
}

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-atlas-teal" />
    </div>
  )
}
