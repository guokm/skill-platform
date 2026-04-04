import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Award, Coins, Download, Search } from 'lucide-react'
import { pointsApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { formatDate } from '../utils/format'

export default function MyPurchases() {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoggedIn) { setLoading(false); return }
    pointsApi.purchases().then(r => setPurchases(r.data ?? [])).catch(() => {}).finally(() => setLoading(false))
  }, [isLoggedIn])

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Award className="mx-auto h-12 w-12 text-atlas-muted/40" />
          <p className="mt-4 text-atlas-muted">请先登录查看资产</p>
          <Link to="/admin/login" className="atlas-button-solid mt-4 inline-flex px-6 py-2.5">去登录</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pb-12 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-5">

        {/* Header */}
        <div className="atlas-panel-dark surface-noise relative overflow-hidden px-6 py-7 sm:px-8">
          <div className="hero-wave opacity-60" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <Award className="h-7 w-7 text-amber-400" />
            </div>
            <div>
              <p className="section-kicker">My Assets</p>
              <h1 className="display-title mt-1 text-3xl text-atlas-strong">我的资产</h1>
              <p className="text-sm text-atlas-muted mt-1">已购买的 Skill — 永久拥有</p>
            </div>
            <div className="ml-auto rounded-full border border-atlas-line bg-atlas-s2 px-4 py-2 font-mono text-lg text-atlas-teal">
              {loading ? '…' : purchases.length}
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="atlas-panel h-24 animate-pulse" />)}
          </div>
        ) : purchases.length === 0 ? (
          <div className="atlas-panel flex flex-col items-center py-20 text-center">
            <Award className="h-12 w-12 text-atlas-muted/30" />
            <p className="mt-4 text-atlas-muted">还没有购买任何 Skill</p>
            <p className="mt-1 text-xs text-atlas-muted">每次下载付费 Skill 后会出现在这里</p>
            <Link to="/skills" className="atlas-button-outline mt-6 inline-flex gap-2 px-6 py-2.5">
              <Search className="h-4 w-4" /> 去逛技能市场
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {purchases.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => item.skill?.slug && navigate(`/skills/${item.skill.slug}`)}
                className="atlas-panel w-full flex items-center gap-4 px-5 py-4 text-left hover:border-atlas-teal/40 transition"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-atlas-s2 border border-atlas-line text-2xl">
                  {item.skill?.iconEmoji ?? '🧰'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-atlas-strong">{item.skill?.name ?? '未知技能'}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-atlas-muted">{item.skill?.shortDescription}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-atlas-muted">
                    <span className="flex items-center gap-1">
                      <Coins className="h-3 w-3 text-atlas-teal" />
                      花费 {item.pricePoints} 积分
                    </span>
                    {item.purchasedAt && (
                      <span>· {formatDate(item.purchasedAt)}</span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400">
                    已拥有
                  </span>
                  <Download className="h-4 w-4 text-atlas-muted" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
