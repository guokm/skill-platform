import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [status, setStatus] = useState('loading') // loading | success | error
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    const error = searchParams.get('error')

    if (token) {
      login(token)
      setStatus('success')
      const redirect = sessionStorage.getItem('auth_redirect') || '/'
      sessionStorage.removeItem('auth_redirect')
      const timer = setTimeout(() => navigate(redirect), 1200)
      return () => clearTimeout(timer)
    }

    if (error) {
      setStatus('error')
      try {
        setErrorMsg(decodeURIComponent(error))
      } catch {
        setErrorMsg(error)
      }
      const timer = setTimeout(() => navigate('/'), 3000)
      return () => clearTimeout(timer)
    }

    setStatus('error')
    setErrorMsg('无效的回调参数')
    const timer = setTimeout(() => navigate('/'), 3000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="atlas-panel px-10 py-12 text-center max-w-sm w-full">
        {status === 'loading' && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-[var(--atlas-teal)]" />
            <h2 className="display-title mt-5 text-2xl">正在验证身份…</h2>
            <p className="mt-2 text-sm text-slate-500">请稍候</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
            <h2 className="display-title mt-5 text-2xl text-atlas-ink">登录成功！</h2>
            <p className="mt-2 text-sm text-slate-500">正在跳转…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="display-title mt-5 text-2xl text-atlas-ink">登录失败</h2>
            <p className="mt-2 text-sm text-slate-500">{errorMsg}</p>
            <p className="mt-1 text-xs text-slate-400">3秒后自动返回首页…</p>
          </>
        )}
      </div>
    </div>
  )
}
