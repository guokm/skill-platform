import axios from 'axios'

const TOKEN_KEY = 'skill_atlas_token'

const API = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

// 自动附加 JWT
API.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 401 自动清除 token
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
    }
    return Promise.reject(err)
  }
)

// ── Skills ────────────────────────────────────────────────────────────────
export const skillsApi = {
  list: (params) => API.get('/skills', { params }),
  getBySlug: (slug) => API.get(`/skills/${slug}`),
  recordClick: (id) => API.post(`/skills/${id}/click`),
  recordDownload: (id) => API.post(`/skills/${id}/download`),
  // 下载整包（需要登录，直接用 URL 跳转时 token 通过 query 传递）
  downloadPackageUrl: (id) => `/api/skills/${id}/download-package`,
  trending: () => API.get('/skills/trending'),
  mostDownloaded: () => API.get('/skills/most-downloaded'),
  featured: () => API.get('/skills/featured'),
  latest: () => API.get('/skills/latest'),
  stats: () => API.get('/skills/stats'),
  related: (slug, limit = 4) => API.get(`/skills/${slug}/related?limit=${limit}`),
}

// ── Categories ────────────────────────────────────────────────────────────
export const categoriesApi = {
  list: () => API.get('/categories'),
  grouped: () => API.get('/categories/grouped'),
  getBySlug: (slug) => API.get(`/categories/${slug}`),
}

// ── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  getLoginUrl: () => API.get('/auth/login-url'),
  me: (token) => axios.get('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  }),
  adminLogin: (username, password) => API.post('/auth/admin-login', { username, password }),
  logout: () => API.post('/auth/logout'),
}

// ── Admin ─────────────────────────────────────────────────────────────────
export const adminApi = {
  crawl: () => API.post('/admin/crawl'),
  stats: () => API.get('/admin/stats'),
  listSkills: (params) => API.get('/admin/skills', { params }),
  patchSkill: (id, data) => API.patch(`/admin/skills/${id}`, data),
  deleteSkill: (id) => API.delete(`/admin/skills/${id}`),
  toggleFeatured: (id) => API.post(`/admin/skills/${id}/feature`),
  toggleVerified: (id) => API.post(`/admin/skills/${id}/verify`),
  listUsers: () => API.get('/admin/users'),
  toggleAdmin: (id) => API.patch(`/admin/users/${id}/admin`),
}

export default API
