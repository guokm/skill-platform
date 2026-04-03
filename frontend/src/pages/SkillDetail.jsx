import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  ExternalLink,
  FolderGit2,
  Lock,
  LogIn,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import { skillsApi, authApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { formatCount, formatDate } from '../utils/format'

export default function SkillDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const [skill, setSkill] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [relatedSkills, setRelatedSkills] = useState([])

  useEffect(() => {
    let active = true

    async function loadSkill() {
      try {
        const response = await skillsApi.getBySlug(slug)
        if (!active) return
        setSkill(response.data)
        await skillsApi.recordClick(response.data.id)
        if (active) {
          setSkill((current) => current ? { ...current, clickCount: (current.clickCount ?? 0) + 1 } : current)
        }
        // Load related skills
        try {
          const relRes = await skillsApi.related(slug, 4)
          if (active) setRelatedSkills(relRes.data ?? [])
        } catch {
          // ignore related skills error
        }
      } catch (error) {
        console.error('Failed to load skill detail', error)
        navigate('/skills')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadSkill()
    return () => { active = false }
  }, [navigate, slug])

  const handleDownload = () => {
    if (!skill) return
    if (!isLoggedIn) {
      setShowLoginModal(true)
      return
    }
    const token = localStorage.getItem('skill_atlas_token')
    const url = `${skillsApi.downloadPackageUrl(skill.id)}${token ? `?token=${encodeURIComponent(token)}` : ''}`
    const link = document.createElement('a')
    link.href = url
    link.target = '_blank'
    link.rel = 'noreferrer'
    link.click()
    setSkill((current) => current ? { ...current, downloadCount: (current.downloadCount ?? 0) + 1 } : current)
  }

  const handleLoginRedirect = async () => {
    sessionStorage.setItem('auth_redirect', window.location.pathname)
    try {
      const res = await authApi.getLoginUrl()
      window.location.href = res.data.url
    } catch {
      navigate('/admin/login')
    }
  }

  const handleCopyDescription = async () => {
    if (!skill) return
    await navigator.clipboard.writeText(skill.description ?? skill.shortDescription ?? '')
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  if (loading) {
    return (
      <div className="px-3 pb-12 pt-4 sm:px-4 lg:px-6">
        <div className="mx-auto max-w-6xl space-y-5">
          <div className="atlas-panel h-16 animate-pulse" />
          <div className="atlas-panel h-60 animate-pulse" />
          <div className="atlas-panel h-[520px] animate-pulse" />
        </div>
      </div>
    )
  }

  if (!skill) return null

  return (
    <>
      <div className="px-3 pb-12 pt-4 sm:px-4 lg:px-6">
        <div className="mx-auto max-w-6xl space-y-5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="atlas-button-outline px-4 py-2 text-xs uppercase tracking-[0.18em]"
          >
            <ArrowLeft className="h-4 w-4" />
            返回列表
          </button>

          {/* Hero */}
          <section className="atlas-panel-dark surface-noise relative overflow-hidden px-6 py-7 sm:px-8">
            <div className="hero-wave opacity-80" />
            <div className="relative z-10 grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
              <div>
                <div className="atlas-pill w-fit border-white/10 bg-white/10 text-white/70">
                  {skill.category?.icon} {skill.category?.groupNameZh ?? '行业类'}
                </div>

                <div className="mt-5 flex items-start gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[26px] bg-white/12 text-5xl shadow-2xl">
                    {skill.iconEmoji ?? '🧰'}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="display-title text-4xl text-white sm:text-5xl">{skill.name}</h1>
                      {skill.verified && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/12 px-3 py-1 text-xs text-emerald-200">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          已验证
                        </span>
                      )}
                      {skill.featured && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-orange-300/30 bg-orange-300/12 px-3 py-1 text-xs text-orange-100">
                          <Sparkles className="h-3.5 w-3.5" />
                          精选
                        </span>
                      )}
                    </div>
                    <p className="mt-4 max-w-3xl text-base leading-8 text-white/74">
                      {skill.shortDescription ?? skill.description}
                    </p>
                    {skill.category && (
                      <Link
                        to={`/skills?category=${skill.category.slug}`}
                        className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/75 transition hover:bg-white/16"
                      >
                        {skill.category.icon} {skill.category.nameZh}
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <DetailStat label="查看次数" value={formatCount(skill.clickCount)} />
                <DetailStat label="下载次数" value={formatCount(skill.downloadCount)} />
                <DetailStat label="发布时间" value={formatDate(skill.createdAt)} />
                <DetailStat label="最近更新" value={formatDate(skill.updatedAt)} />
              </div>
            </div>
          </section>

          <div className="grid gap-5 xl:grid-cols-[1fr,320px]">
            <div className="space-y-5">
              {/* Readme */}
              <section className="atlas-panel px-6 py-6 sm:px-8">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="section-kicker">Usage</p>
                    <h2 className="display-title mt-2 text-3xl">说明文档</h2>
                  </div>
                  <button type="button" onClick={handleCopyDescription} className="atlas-button-outline px-4 py-2 text-xs uppercase tracking-[0.18em]">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? '已复制' : '复制描述'}
                  </button>
                </div>
                <div className="markdown-body mt-6">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {skill.readmeContent || skill.description || ''}
                  </ReactMarkdown>
                </div>
              </section>

              {/* Description summary */}
              {skill.description && (
                <section className="atlas-panel px-6 py-6 sm:px-8">
                  <p className="section-kicker">Prompt summary</p>
                  <h2 className="display-title mt-2 text-3xl">技能摘要</h2>
                  <p className="mt-4 rounded-[22px] border border-[rgba(214,198,178,0.9)] bg-white/70 px-5 py-5 font-mono text-sm leading-7 text-slate-600">
                    {skill.description}
                  </p>
                </section>
              )}

              {/* Related skills */}
              {relatedSkills.length > 0 && (
                <section className="atlas-panel px-6 py-6 sm:px-8">
                  <p className="section-kicker">Related</p>
                  <h2 className="display-title mt-2 text-3xl">相关技能</h2>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {relatedSkills.map((r) => (
                      <Link
                        key={r.id}
                        to={`/skills/${r.slug}`}
                        className="flex items-center gap-3 rounded-[22px] border border-[rgba(214,198,178,0.7)] bg-white/60 px-4 py-3 transition hover:bg-white hover:shadow-md"
                      >
                        <span className="text-2xl">{r.iconEmoji ?? '🧰'}</span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-atlas-ink">{r.name}</p>
                          <p className="truncate text-xs text-slate-500">{r.shortDescription}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-5">
              <section className="atlas-panel px-5 py-5">
                <p className="section-kicker">Actions</p>
                <div className="mt-4 grid gap-3">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="atlas-button-solid w-full justify-center"
                  >
                    {isLoggedIn ? <Download className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    {isLoggedIn ? '下载技能包' : '登录后下载'}
                  </button>

                  {skill.sourceUrl && (
                    <a
                      href={skill.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="atlas-button-outline w-full justify-center"
                    >
                      <ExternalLink className="h-4 w-4" />
                      查看来源
                    </a>
                  )}
                </div>
                {!isLoggedIn && (
                  <p className="mt-3 text-center text-xs text-slate-400">
                    需要 Linux.do 账号登录才能下载
                  </p>
                )}
              </section>

              <section className="atlas-panel px-5 py-5">
                <p className="section-kicker">Metadata</p>
                <div className="mt-4 space-y-4 text-sm text-slate-600">
                  <MetaRow label="作者" value={skill.author ?? '未提供'} />
                  <MetaRow label="版本" value={skill.version ?? '1.0.0'} />
                  <MetaRow label="许可证" value={skill.license ?? 'Unknown'} />
                  <MetaRow label="行业" value={skill.category?.nameZh ?? '未分类'} />
                  {skill.origin && <MetaRow label="来源平台" value={skill.origin} />}
                </div>
              </section>

              {skill.tags?.length > 0 && (
                <section className="atlas-panel px-5 py-5">
                  <p className="section-kicker">Tags</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {skill.tags.map((tag) => (
                      <Link
                        key={tag}
                        to={`/skills?keyword=${encodeURIComponent(tag)}`}
                        className="inline-flex items-center rounded-full bg-white/80 px-3 py-2 text-xs text-slate-600 transition hover:text-[var(--atlas-teal)]"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              <section className="atlas-panel px-5 py-5">
                <p className="section-kicker">Notes</p>
                <div className="mt-4 rounded-[22px] border border-[rgba(214,198,178,0.85)] bg-white/72 px-4 py-4 text-sm leading-7 text-slate-600">
                  下载操作会由后端把整个技能目录压缩成 zip 返回，并同步记录下载次数，方便首页榜单做真实排序。
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                  <FolderGit2 className="h-4 w-4" />
                  爬取来源可通过 Docker 挂载目录统一管理
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>

      {/* Login required modal */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className="atlas-panel w-full max-w-sm px-8 py-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-atlas-ink"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#101a26,#1d6f70)] text-3xl shadow-xl">
              <Lock className="h-7 w-7 text-white" />
            </div>
            <h2 className="display-title mt-5 text-2xl text-atlas-ink">登录后可下载</h2>
            <p className="mt-2 text-sm text-slate-500">
              下载技能包需要登录 Linux.do 账号。
              <br />登录后即可免费下载所有技能。
            </p>
            <div className="mt-6 grid gap-3">
              <button
                onClick={handleLoginRedirect}
                className="atlas-button-solid w-full justify-center"
              >
                <LogIn className="h-4 w-4" />
                Linux.do 登录
              </button>
              <button
                onClick={() => setShowLoginModal(false)}
                className="atlas-button-outline w-full justify-center"
              >
                稍后再说
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function DetailStat({ label, value }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/8 px-5 py-5">
      <p className="text-xs uppercase tracking-[0.18em] text-white/45">{label}</p>
      <p className="mt-3 text-lg font-semibold text-white">{value}</p>
    </div>
  )
}

function MetaRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[rgba(214,198,178,0.6)] pb-3 last:border-none last:pb-0">
      <span className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</span>
      <span className="text-right font-medium text-atlas-ink">{value}</span>
    </div>
  )
}
