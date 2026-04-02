import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, Download, Eye, ShieldCheck, Sparkles } from 'lucide-react'
import { formatCount } from '../utils/format'

const CATEGORY_TONES = {
  'frontend-development': 'bg-sky-100 text-sky-900',
  'backend-development': 'bg-emerald-100 text-emerald-900',
  'ai-automation': 'bg-cyan-100 text-cyan-900',
  'design-experience': 'bg-amber-100 text-amber-900',
  'product-management': 'bg-rose-100 text-rose-900',
  'office-productivity': 'bg-slate-100 text-slate-900',
  'sales-business': 'bg-orange-100 text-orange-900',
  'data-analysis': 'bg-teal-100 text-teal-900',
  'finance-accounting': 'bg-lime-100 text-lime-900',
  'legal-compliance': 'bg-zinc-100 text-zinc-900',
  'education-training': 'bg-indigo-100 text-indigo-900',
  'marketing-growth': 'bg-pink-100 text-pink-900',
}

export default function SkillCard({ skill }) {
  const navigate = useNavigate()
  const categoryTone = CATEGORY_TONES[skill.category?.slug] ?? CATEGORY_TONES['office-productivity']

  return (
    <button
      type="button"
      onClick={() => navigate(`/skills/${skill.slug}`)}
      className="surface-noise atlas-panel group relative overflow-hidden p-5 text-left transition hover:-translate-y-1.5 hover:shadow-2xl"
    >
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#fffaf3,#efe3d2)] text-3xl shadow-inner">
            {skill.iconEmoji ?? '🧰'}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-atlas-ink transition group-hover:text-[var(--atlas-teal)]">
                {skill.name}
              </h3>
              {skill.verified && <ShieldCheck className="h-4 w-4 text-emerald-600" />}
              {skill.featured && <Sparkles className="h-4 w-4 text-[var(--atlas-coral)]" />}
            </div>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
              {skill.shortDescription ?? skill.description}
            </p>
          </div>
        </div>

        <ArrowUpRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:text-atlas-ink" />
      </div>

      <div className="relative z-10 mt-5 flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${categoryTone}`}>
          {skill.category?.icon} {skill.category?.nameZh ?? skill.category?.name}
        </span>
        {skill.tags?.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-full bg-white/80 px-3 py-1 text-xs text-slate-500">
            #{tag}
          </span>
        ))}
      </div>

      <div className="relative z-10 mt-5 flex items-center justify-between border-t border-[rgba(214,198,178,0.8)] pt-4 text-sm text-slate-500">
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
        <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
          {skill.author ?? 'Marketplace'}
        </span>
      </div>
    </button>
  )
}
