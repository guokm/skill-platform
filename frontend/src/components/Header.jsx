import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, Search, Sparkles, X } from 'lucide-react'

const NAV_ITEMS = [
  { label: '行业地图', to: '/' },
  { label: '全部 Skills', to: '/skills' },
  { label: '热门排行', to: '/skills?sortBy=popular' },
  { label: '最新入库', to: '/skills?sortBy=newest' },
]

export default function Header() {
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleSearch = (event) => {
    event.preventDefault()
    if (!query.trim()) {
      return
    }
    navigate(`/skills?keyword=${encodeURIComponent(query.trim())}`)
    setMenuOpen(false)
  }

  return (
    <header className="content-shell sticky top-0 z-50 px-3 pt-3 sm:px-4 lg:px-6">
      <div className="mx-auto max-w-7xl atlas-panel px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#101a26,#1d6f70)] text-2xl shadow-lg">
                <span>🧭</span>
              </div>
              <div className="min-w-0">
                <p className="font-display text-2xl leading-none text-atlas-ink">Skill Atlas</p>
                <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">Industry skill marketplace</p>
              </div>
            </div>
          </Link>

          <form onSubmit={handleSearch} className="hidden min-w-0 flex-1 items-center lg:flex">
            <div className="relative mx-auto w-full max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索 Skill、行业、关键词，例如 React、法务、SEO..."
                className="atlas-input pl-11 pr-28"
              />
              <button type="submit" className="atlas-button-solid absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-2.5 text-xs">
                搜索
              </button>
            </div>
          </form>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.to && !item.to.includes('?')
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-atlas-ink text-white' : 'text-slate-600 hover:bg-white/70 hover:text-atlas-ink'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(214,198,178,0.9)] bg-white/70 text-atlas-ink lg:hidden"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="切换菜单"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="mt-4 space-y-3 border-t border-[rgba(214,198,178,0.8)] pt-4 lg:hidden">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索 Skills"
                  className="atlas-input pl-11"
                />
              </div>
            </form>
            <div className="grid gap-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="atlas-button-outline justify-between"
                  onClick={() => setMenuOpen(false)}
                >
                  <span>{item.label}</span>
                  <Sparkles className="h-4 w-4 text-slate-400" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
