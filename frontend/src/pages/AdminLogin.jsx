import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Lock, User, Eye, EyeOff, Loader2, LogIn } from 'lucide-react'
import { authApi } from '../services/api'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { loginAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLinuxDoLogin = async () => {
    try {
      const res = await authApi.getLoginUrl()
      window.location.href = res.data.url
    } catch {
      setError('获取登录地址失败，请稍后重试')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('请填写用户名和密码')
      return
    }
    setLoading(true)
    setError('')
    try {
      await loginAdmin(username, password)
      navigate('/admin')
    } catch (err) {
      setError(err.response?.data?.error || '用户名或密码错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 bg-transparent">
      <div className="w-full max-w-sm space-y-5">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-atlas-teal/25 text-3xl shadow-xl">
            🧭
          </div>
          <h1 className="display-title text-3xl text-atlas-strong">管理后台</h1>
          <p className="mt-1 text-sm text-atlas-muted">Skill Atlas Admin</p>
        </div>

        {/* Linux.do OAuth */}
        <button
          onClick={handleLinuxDoLogin}
          className="w-full atlas-button-solid flex items-center justify-center gap-3 py-3.5 font-medium"
        >
          <span className="text-lg">🐧</span>
          <span>用 Linux.do 账号登录</span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-atlas-line" />
          <span className="text-xs uppercase tracking-[0.2em] text-atlas-muted">或使用固定账密</span>
          <div className="flex-1 h-px bg-atlas-line" />
        </div>

        {/* Fixed credentials form */}
        <form onSubmit={handleSubmit} className="atlas-panel px-6 py-6 space-y-4">
          <div>
            <label className="section-kicker mb-2 block">用户名</label>
            <div className="relative">
              <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-atlas-muted" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="管理员用户名"
                className="atlas-input pl-11"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="section-kicker mb-2 block">密码</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-atlas-muted" />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="atlas-input pl-11 pr-12"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-atlas-muted hover:text-atlas-teal transition"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="bg-red-950/80 border border-red-500/30 text-red-400 rounded-xl px-4 py-2.5 text-sm font-medium">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full atlas-button-solid flex items-center justify-center gap-2 py-3 disabled:opacity-60 font-medium"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            {loading ? '登录中…' : '登录'}
          </button>
        </form>
      </div>
    </div>
  )
}
