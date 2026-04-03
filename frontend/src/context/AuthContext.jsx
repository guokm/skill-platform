import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

const TOKEN_KEY = 'skill_atlas_token'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // 初始化：从 localStorage 读取 token 并验证
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setLoading(false)
      return
    }
    authApi.me(token)
      .then(res => setUser({ ...res.data, token }))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback((token) => {
    localStorage.setItem(TOKEN_KEY, token)
    authApi.me(token)
      .then(res => setUser({ ...res.data, token }))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        setUser(null)
      })
  }, [])

  const loginAdmin = useCallback(async (username, password) => {
    const res = await authApi.adminLogin(username, password)
    const { token, user: adminUser } = res.data
    localStorage.setItem(TOKEN_KEY, token)
    setUser({ ...adminUser, token, isAdmin: true })
    return adminUser
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }, [])

  const getToken = useCallback(() => localStorage.getItem(TOKEN_KEY), [])

  const value = useMemo(() => ({
    user,
    loading,
    isLoggedIn: !!user,
    isAdmin: !!user?.isAdmin,
    login,
    loginAdmin,
    logout,
    getToken,
  }), [user, loading, login, loginAdmin, logout, getToken])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
