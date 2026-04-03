import { Link } from 'react-router-dom'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-[linear-gradient(135deg,#101a26,#1d6f70)] text-5xl shadow-2xl">
          🧭
        </div>
        <h1 className="display-title mt-8 text-7xl text-atlas-ink">404</h1>
        <p className="mt-3 text-xl text-slate-600">页面不存在</p>
        <p className="mt-2 text-sm text-slate-400">
          你要找的页面已经离开了地图的边界…
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/" className="atlas-button-solid flex items-center gap-2 px-6 py-3">
            <Home className="h-4 w-4" />
            回到首页
          </Link>
          <Link to="/skills" className="atlas-button-outline flex items-center gap-2 px-6 py-3">
            <Search className="h-4 w-4" />
            浏览技能
          </Link>
        </div>
      </div>
    </div>
  )
}
