import { useNavigate } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

export default function CategoryCard({ category }) {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => navigate(`/skills?category=${category.slug}`)}
      className="atlas-panel group relative overflow-hidden p-5 text-left transition hover:-translate-y-1.5 border border-atlas-line hover:border-atlas-teal/60 hover:shadow-glow-sm"
    >
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-atlas-s2 border border-atlas-line text-3xl shadow-inner">
            {category.icon}
          </div>
          <h3 className="mt-4 text-xl font-semibold text-atlas-strong">{category.nameZh ?? category.name}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-atlas-muted">{category.description}</p>
        </div>
        <ArrowUpRight className="h-5 w-5 shrink-0 text-atlas-muted transition group-hover:text-atlas-teal mt-1" />
      </div>

      <div className="relative z-10 mt-5 flex items-center justify-between border-t border-atlas-line pt-4 text-xs uppercase tracking-[0.18em] text-atlas-muted">
        <span>{category.groupNameZh}</span>
        <span className="font-mono text-atlas-teal">{category.skillCount} skills</span>
      </div>
    </button>
  )
}
