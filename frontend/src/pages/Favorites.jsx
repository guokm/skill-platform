import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Search } from 'lucide-react'
import { favoritesApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import SkillCard from '../components/SkillCard'

export default function Favorites() {
  const { isLoggedIn } = useAuth()
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoggedIn) { setLoading(false); return }
    favoritesApi.myFavorites()
      .then((res) => setSkills(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isLoggedIn])

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-500/10 border border-rose-500/20 text-4xl">
            <Heart className="h-10 w-10 text-rose-400" />
          </div>
          <h1 className="display-title mt-6 text-3xl text-atlas-strong">我的收藏</h1>
          <p className="mt-2 text-atlas-muted">登录后查看你收藏的技能</p>
          <Link to="/admin/login" className="atlas-button-solid mt-6 inline-flex items-center gap-2 px-6 py-3">
            去登录
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="px-3 pb-12 pt-4 sm:px-4 lg:px-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="atlas-panel-dark surface-noise relative overflow-hidden px-6 py-7 sm:px-8">
          <div className="hero-wave opacity-60" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <Heart className="h-7 w-7 fill-rose-400 text-rose-400" />
            </div>
            <div>
              <p className="section-kicker">My Collection</p>
              <h1 className="display-title mt-1 text-3xl text-atlas-strong">我的收藏</h1>
            </div>
            <div className="ml-auto rounded-full border border-atlas-line bg-atlas-s2 px-4 py-2 font-mono text-lg text-atlas-teal">
              {loading ? '…' : skills.length}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mt-5">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="atlas-panel h-48 animate-pulse" />
              ))}
            </div>
          ) : skills.length === 0 ? (
            <div className="atlas-panel flex flex-col items-center justify-center py-20 text-center">
              <Heart className="h-12 w-12 text-atlas-muted/40" />
              <p className="mt-4 text-atlas-muted">还没有收藏任何技能</p>
              <Link
                to="/skills"
                className="atlas-button-outline mt-6 inline-flex items-center gap-2 px-6 py-2.5"
              >
                <Search className="h-4 w-4" />
                浏览技能
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {skills.map((skill) => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
