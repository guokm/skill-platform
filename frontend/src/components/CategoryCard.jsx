import { useNavigate } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

const COLOR_STYLES = {
  sky: 'from-sky-100 via-white to-sky-50 text-sky-900',
  emerald: 'from-emerald-100 via-white to-emerald-50 text-emerald-900',
  cyan: 'from-cyan-100 via-white to-cyan-50 text-cyan-900',
  amber: 'from-amber-100 via-white to-amber-50 text-amber-900',
  rose: 'from-rose-100 via-white to-rose-50 text-rose-900',
  slate: 'from-slate-100 via-white to-slate-50 text-slate-900',
  orange: 'from-orange-100 via-white to-orange-50 text-orange-900',
  teal: 'from-teal-100 via-white to-teal-50 text-teal-900',
  lime: 'from-lime-100 via-white to-lime-50 text-lime-900',
  zinc: 'from-zinc-100 via-white to-zinc-50 text-zinc-900',
  indigo: 'from-indigo-100 via-white to-indigo-50 text-indigo-900',
  pink: 'from-pink-100 via-white to-pink-50 text-pink-900',
}

export default function CategoryCard({ category }) {
  const navigate = useNavigate()
  const colorStyle = COLOR_STYLES[category.colorClass] ?? COLOR_STYLES.slate

  return (
    <button
      type="button"
      onClick={() => navigate(`/skills?category=${category.slug}`)}
      className={`surface-noise atlas-panel relative overflow-hidden bg-gradient-to-br ${colorStyle} p-5 text-left transition hover:-translate-y-1 hover:shadow-2xl`}
    >
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-3xl">{category.icon}</p>
          <h3 className="mt-4 text-xl font-semibold">{category.nameZh ?? category.name}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{category.description}</p>
        </div>
        <ArrowUpRight className="h-5 w-5 shrink-0 text-slate-400" />
      </div>

      <div className="relative z-10 mt-5 flex items-center justify-between border-t border-black/5 pt-4 text-xs uppercase tracking-[0.18em] text-slate-500">
        <span>{category.groupNameZh}</span>
        <span>{category.skillCount} skills</span>
      </div>
    </button>
  )
}
