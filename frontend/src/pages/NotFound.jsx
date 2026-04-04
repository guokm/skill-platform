import { Link } from 'react-router-dom'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 bg-transparent">
      <div className="text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-atlas-teal/20 text-5xl shadow-lg">
          🧭
        </div>
        <h1 className="display-title mt-8 text-8xl text-atlas-teal">404</h1>
        <p className="mt-3 text-xl text-atlas-strong">页面不存在</p>
        <p className="mt-2 text-sm text-atlas-muted">
          你要找的页面已经离开了地图的边界…
        </p>

        {/* Terminal-style error message */}
        <div className="mt-6 inline-block">
          <code className="font-mono text-atlas-teal/40 text-sm block">
            &gt; ERROR 404: resource.not.found_
          </code>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/" className="atlas-button-solid flex items-center gap-2 px-6 py-3 font-medium">
            <Home className="h-4 w-4" />
            回到首页
          </Link>
          <Link to="/skills" className="atlas-button-outline flex items-center gap-2 px-6 py-3 font-medium">
            <Search className="h-4 w-4" />
            浏览技能
          </Link>
        </div>
      </div>
    </div>
  )
}
