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
  Heart,
  Lock,
  LogIn,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from 'lucide-react'
import { skillsApi, authApi, favoritesApi, ratingsApi, usersApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { formatCount, formatDate } from '../utils/format'

export default function SkillDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { isLoggedIn, user, refreshUser } = useAuth()
  const [skill, setSkill] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [relatedSkills, setRelatedSkills] = useState([])
  const [purchaseStatus, setPurchaseStatus] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState('')
  // Favorites
  const [favorited, setFavorited] = useState(false)
  const [favCount, setFavCount] = useState(0)
  const [favLoading, setFavLoading] = useState(false)
  // Ratings
  const [ratingData, setRatingData] = useState(null)  // { avgRating, totalCount, myRating }
  const [hoverStar, setHoverStar] = useState(0)
  const [ratingLoading, setRatingLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadSkill() {
      try {
        const response = await skillsApi.getBySlug(slug)
        if (!active) return
        setSkill(response.data)
        setPurchaseStatus(null)
        setDownloadError('')
        await skillsApi.recordClick(response.data.id)
        if (active) {
          setSkill((current) => current ? { ...current, clickCount: (current.clickCount ?? 0) + 1 } : current)
        }
        // Load related skills, favorites status, and rating in parallel
        const [relRes, ratingRes, favRes, purchaseRes] = await Promise.allSettled([
          skillsApi.related(slug, 4),
          ratingsApi.get(response.data.id),
          isLoggedIn ? favoritesApi.status(response.data.id) : Promise.resolve(null),
          isLoggedIn ? usersApi.purchaseStatus(response.data.id) : Promise.resolve(null),
        ])
        if (active) {
          if (relRes.status === 'fulfilled') setRelatedSkills(relRes.value.data ?? [])
          if (ratingRes.status === 'fulfilled') setRatingData(ratingRes.value.data)
          if (favRes.status === 'fulfilled' && favRes.value) {
            setFavorited(favRes.value.data?.favorited ?? false)
            setFavCount(favRes.value.data?.totalFavorites ?? 0)
          }
          if (purchaseRes.status === 'fulfilled' && purchaseRes.value) {
            setPurchaseStatus(purchaseRes.value.data)
          }
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
  }, [isLoggedIn, navigate, slug])

  const handleDownload = async () => {
    if (!skill) return
    if (!isLoggedIn) {
      setShowLoginModal(true)
      return
    }
    if (downloading) return
    if (purchaseStatus && !purchaseStatus.purchased && !purchaseStatus.canAfford) {
      setDownloadError(`积分不足，当前仅剩 ${purchaseStatus.pointsBalance} 积分。`)
      return
    }

    setDownloading(true)
    setDownloadError('')
    try {
      const res = await skillsApi.downloadPackage(skill.id)
      const filename = getDownloadFilename(res.headers?.['content-disposition'], `${skill.slug}.zip`)
      downloadBlob(res.data, filename)
      setSkill((current) => current ? { ...current, downloadCount: (current.downloadCount ?? 0) + 1 } : current)
      const nextUser = await refreshUser()
      if (isLoggedIn) {
        const purchaseRes = await usersApi.purchaseStatus(skill.id)
        setPurchaseStatus({
          ...purchaseRes.data,
          pointsBalance: purchaseRes.data?.pointsBalance ?? nextUser?.pointsBalance ?? purchaseStatus?.pointsBalance ?? 0,
        })
      }
    } catch (error) {
      setDownloadError(await readBlobErrorMessage(error))
    } finally {
      setDownloading(false)
    }
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

  const handleFavorite = async () => {
    if (!isLoggedIn) { setShowLoginModal(true); return }
    if (favLoading) return
    setFavLoading(true)
    try {
      const res = await favoritesApi.toggle(skill.id)
      setFavorited(res.data.favorited)
      setFavCount(res.data.totalFavorites)
    } catch {
      // ignore
    } finally {
      setFavLoading(false)
    }
  }

  const handleRate = async (stars) => {
    if (!isLoggedIn) { setShowLoginModal(true); return }
    if (ratingLoading) return
    setRatingLoading(true)
    try {
      const res = await ratingsApi.rate(skill.id, stars)
      setRatingData(res.data)
    } catch {
      // ignore
    } finally {
      setRatingLoading(false)
    }
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

  const currentPrice = purchaseStatus?.pricePoints ?? skill.pricePoints ?? 1
  const currentBalance = purchaseStatus?.pointsBalance ?? user?.pointsBalance ?? 0
  const alreadyPurchased = !!purchaseStatus?.purchased
  const canAfford = purchaseStatus ? purchaseStatus.canAfford : currentBalance >= currentPrice
  const downloadDisabled = isLoggedIn && !alreadyPurchased && !canAfford
  const balanceLabel = isLoggedIn ? `${currentBalance} 积分` : '登录后可见'

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
                <div className="atlas-pill w-fit">
                  {skill.category?.icon} {skill.category?.groupNameZh ?? '行业类'}
                </div>

                <div className="mt-5 flex items-start gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[26px] bg-atlas-s2 border border-atlas-line text-5xl shadow-2xl">
                    {skill.iconEmoji ?? '🧰'}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="display-title text-4xl text-atlas-strong sm:text-5xl">{skill.name}</h1>
                      {skill.verified && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          已验证
                        </span>
                      )}
                      {skill.featured && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs text-amber-400">
                          <Sparkles className="h-3.5 w-3.5" />
                          精选
                        </span>
                      )}
                    </div>
                    <p className="mt-4 max-w-3xl text-base leading-8 text-atlas-ink">
                      {skill.shortDescription ?? skill.description}
                    </p>
                    {skill.category && (
                      <Link
                        to={`/skills?category=${skill.category.slug}`}
                        className="mt-5 inline-flex items-center gap-2 rounded-full border border-atlas-teal/25 bg-atlas-teal/8 px-4 py-2 text-sm text-atlas-teal/80 transition hover:border-atlas-teal/40"
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
                  <p className="mt-4 rounded-[22px] border border-atlas-line bg-atlas-s2 px-5 py-5 font-mono text-sm leading-7 text-atlas-ink">
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
                        className="flex items-center gap-3 rounded-2xl border border-atlas-line bg-atlas-s2 px-4 py-3 transition hover:border-atlas-teal/40"
                      >
                        <span className="text-2xl">{r.iconEmoji ?? '🧰'}</span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-atlas-strong">{r.name}</p>
                          <p className="truncate text-xs text-atlas-muted">{r.shortDescription}</p>
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
                  <div className="rounded-[22px] border border-atlas-line bg-atlas-s2 px-4 py-4 text-sm text-atlas-ink">
                    <div className="flex items-center justify-between gap-3">
                      <span className="section-kicker text-xs">资源定价</span>
                      <span className="font-semibold text-atlas-teal">{currentPrice} 积分</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="section-kicker text-xs">当前余额</span>
                      <span className="font-semibold text-atlas-strong">{balanceLabel}</span>
                    </div>
                    <p className="mt-3 text-xs leading-6 text-atlas-muted">
                      {alreadyPurchased
                        ? '你已经购买过这个技能包，后续重复下载不会再次扣积分。'
                        : currentPrice === 0
                          ? '当前资源为免费资源，下载不会消耗积分。'
                          : `首次下载会扣除 ${currentPrice} 积分，并自动把技能包加入你的已购资源。`
                      }
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={downloadDisabled || downloading}
                    className={`w-full justify-center ${downloadDisabled || downloading ? 'atlas-button-outline opacity-70 cursor-not-allowed' : 'atlas-button-solid'}`}
                  >
                    {isLoggedIn ? <Download className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    {!isLoggedIn
                      ? '登录后下载'
                      : downloading
                        ? '正在准备技能包...'
                        : alreadyPurchased
                          ? '继续下载技能包'
                          : currentPrice === 0
                            ? '免费下载技能包'
                            : `消耗 ${currentPrice} 积分下载`
                    }
                  </button>

                  {downloadError && (
                    <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs leading-6 text-red-300">
                      {downloadError}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleFavorite}
                    disabled={favLoading}
                    className={`w-full flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition ${
                      favorited
                        ? 'border-rose-500/40 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                        : 'atlas-button-outline'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${favorited ? 'fill-rose-400' : ''}`} />
                    {favorited ? `已收藏 (${favCount})` : `收藏 (${favCount})`}
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
                  <p className="mt-3 text-center text-xs text-atlas-muted">
                    需要 Linux.do 账号登录才能下载 / 收藏，下载时会按资源定价扣积分
                  </p>
                )}
              </section>

              {/* Star Rating */}
              <section className="atlas-panel px-5 py-5">
                <p className="section-kicker">Rating</p>
                <div className="mt-4">
                  {/* Stars display / input */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const filled = star <= (hoverStar || ratingData?.myRating || 0)
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverStar(star)}
                          onMouseLeave={() => setHoverStar(0)}
                          onClick={() => handleRate(star)}
                          disabled={ratingLoading}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={`h-7 w-7 transition ${
                              filled ? 'fill-amber-400 text-amber-400' : 'text-atlas-muted'
                            }`}
                          />
                        </button>
                      )
                    })}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <span className="font-mono text-xl text-atlas-teal">
                      {ratingData ? ratingData.avgRating.toFixed(1) : '—'}
                    </span>
                    <span className="text-atlas-muted">
                      / 5 · {ratingData?.totalCount ?? 0} 次评分
                    </span>
                  </div>
                  {!isLoggedIn && (
                    <p className="mt-2 text-xs text-atlas-muted">登录后可评分</p>
                  )}
                </div>
              </section>

              <section className="atlas-panel px-5 py-5">
                <p className="section-kicker">Metadata</p>
                <div className="mt-4 space-y-4 text-sm">
                  <MetaRow label="作者" value={skill.author ?? '未提供'} />
                  {skill.submitterUsername && (
                    <div className="flex items-start justify-between gap-3 border-b border-atlas-line pb-3">
                      <span className="section-kicker text-xs">投稿人</span>
                      <Link
                        to={`/u/${skill.submitterUsername}`}
                        className="text-right font-medium text-atlas-teal hover:underline"
                      >
                        @{skill.submitterUsername}
                      </Link>
                    </div>
                  )}
                  <MetaRow label="版本" value={skill.version ?? '1.0.0'} />
                  <MetaRow label="许可证" value={skill.license ?? 'Unknown'} />
                  <MetaRow label="积分定价" value={`${currentPrice} 积分`} />
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
                        className="inline-flex items-center rounded-full bg-atlas-teal/8 border border-atlas-teal/20 px-3 py-1.5 text-xs text-atlas-teal/70 transition hover:border-atlas-teal/40"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              <section className="atlas-panel px-5 py-5">
                <p className="section-kicker">Notes</p>
                <div className="mt-4 rounded-[22px] border border-atlas-line bg-atlas-s2 px-4 py-4 text-sm leading-7 text-atlas-ink">
                  下载操作会由后端把整个技能目录压缩成 zip 返回，并同步记录下载次数。首次下载会生成购买记录并扣除对应积分，重复下载不会重复扣费。
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-atlas-muted">
                  <FolderGit2 className="h-4 w-4" />
                  爬取来源可通过 Docker 挂载目录统一管理，后台也可以单独调整资源定价
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>

      {/* Login required modal */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className="atlas-panel w-full max-w-sm px-8 py-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute right-4 top-4 text-atlas-muted hover:text-atlas-strong"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-atlas-teal/25 text-3xl shadow-xl">
              <Lock className="h-7 w-7 text-atlas-teal" />
            </div>
            <h2 className="display-title mt-5 text-2xl text-atlas-strong">登录后可下载</h2>
            <p className="mt-2 text-sm text-atlas-muted">
              下载技能包需要登录 Linux.do 账号。
              <br />登录后会按照技能定价扣除对应积分。
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

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

function getDownloadFilename(contentDisposition, fallbackName) {
  if (!contentDisposition) return fallbackName
  const match = contentDisposition.match(/filename="?(.*?)"?$/i)
  return match?.[1] || fallbackName
}

async function readBlobErrorMessage(error) {
  const fallback = error?.response?.data?.error || error?.message || '下载失败，请稍后重试'
  const blob = error?.response?.data
  if (!(blob instanceof Blob)) {
    return fallback
  }

  try {
    const text = await blob.text()
    if (!text) return fallback
    const parsed = JSON.parse(text)
    return parsed.error || fallback
  } catch {
    return fallback
  }
}

function DetailStat({ label, value }) {
  return (
    <div className="rounded-[24px] border border-atlas-line bg-atlas-s3 px-5 py-5">
      <p className="section-kicker text-xs">{label}</p>
      <p className="mt-3 font-mono text-xl text-atlas-teal">{value}</p>
    </div>
  )
}

function MetaRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-atlas-line pb-3 last:border-none last:pb-0">
      <span className="section-kicker text-xs">{label}</span>
      <span className="text-right font-medium text-atlas-ink">{value}</span>
    </div>
  )
}
