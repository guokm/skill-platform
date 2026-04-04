import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, Download, Eye, Heart, ShieldCheck, Sparkles } from 'lucide-react'
import { formatCount } from '../utils/format'
import { useAuth } from '../context/AuthContext'
import { favoritesApi } from '../services/api'

export default function SkillCard({ skill }) {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const [favorited, setFavorited] = useState(false)
  const [favLoading, setFavLoading] = useState(false)

  const handleFavorite = async (e) => {
    e.stopPropagation()
    if (!isLoggedIn) { navigate(`/skills/${skill.slug}`); return }
    if (favLoading) return
    setFavLoading(true)
    try {
      const res = await favoritesApi.toggle(skill.id)
      setFavorited(res.data.favorited)
    } catch {
      // ignore
    } finally {
      setFavLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => navigate(`/skills/${skill.slug}`)}
      className="atlas-panel group relative overflow-hidden p-5 text-left transition hover:-translate-y-1.5 border border-atlas-line hover:border-atlas-teal/60 hover:shadow-glow-sm"
    >
      {/* Favorite button */}
      <button
        type="button"
        onClick={handleFavorite}
        className={`absolute right-3 top-3 z-20 rounded-full p-1.5 transition ${
          favorited
            ? 'text-rose-400 bg-rose-500/10'
            : 'text-atlas-muted/40 hover:text-rose-400 hover:bg-rose-500/10'
        }`}
        title={favorited ? '取消收藏' : '收藏'}
      >
        <Heart className={`h-4 w-4 ${favorited ? 'fill-rose-400' : ''}`} />
      </button>

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-atlas-s2 border border-atlas-line text-3xl shadow-inner">
            {skill.iconEmoji ?? '🧰'}
          </div>
          <div className="min-w-0 pr-6">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-atlas-ink transition group-hover:text-atlas-teal">
                {skill.name}
              </h3>
              {skill.verified && (
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                  <ShieldCheck className="h-3 w-3" />
                  已认证
                </span>
              )}
              {skill.featured && (
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                  <Sparkles className="h-3 w-3" />
                  推荐
                </span>
              )}
            </div>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-atlas-muted">
              {skill.shortDescription ?? skill.description}
            </p>
          </div>
        </div>

        <ArrowUpRight className="h-5 w-5 shrink-0 text-atlas-muted transition group-hover:text-atlas-teal" />
      </div>

      <div className="relative z-10 mt-5 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-atlas-teal">
          {skill.category?.icon} {skill.category?.nameZh ?? skill.category?.name}
        </span>
        {skill.tags?.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-full bg-atlas-teal/8 border border-atlas-teal/15 px-3 py-1 text-xs text-atlas-teal/70">
            #{tag}
          </span>
        ))}
      </div>

      <div className="relative z-10 mt-5 flex items-center justify-between border-t border-atlas-line pt-4 text-sm text-atlas-muted font-mono">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            {formatCount(skill.clickCount)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Download className="h-4 w-4" />
            {formatCount(skill.downloadCount)}
          </span>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-atlas-teal">{skill.pricePoints ?? 1} 积分</p>
          <p className="text-xs uppercase tracking-[0.18em] text-atlas-muted">{skill.author ?? 'Marketplace'}</p>
        </div>
      </div>
    </button>
  )
}
