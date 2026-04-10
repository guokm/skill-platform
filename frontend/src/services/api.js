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
  downloadPackage: (id) => API.get(`/skills/${id}/download-package`, { responseType: 'blob' }),
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
  exchangeCode: (code, redirectUri) => API.post('/auth/exchange-code', { code, redirectUri }),
  me: (token) => axios.get('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  }),
  adminLogin: (username, password) => API.post('/auth/admin-login', { username, password }),
  logout: () => API.post('/auth/logout'),
}

// ── Points & Level ────────────────────────────────────────────────────────
export const pointsApi = {
  summary:        () => API.get('/users/me/points'),
  checkIn:        () => API.post('/users/me/check-in'),
  level:          () => API.get('/users/me/level'),
  purchases:      () => API.get('/users/me/purchases'),
  purchaseStatus: (skillId) => API.get(`/users/me/skills/${skillId}/purchase-status`),
  uploadSkill:    (formData, onProgress) => API.post('/users/me/submissions/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded * 100) / e.total)),
  }),
}

// ── Favorites ─────────────────────────────────────────────────────────────
export const favoritesApi = {
  myFavorites: () => API.get('/users/me/favorites'),
  toggle: (id) => API.post(`/skills/${id}/favorite`),
  status: (id) => API.get(`/skills/${id}/favorite`),
}

// ── Public Profile ────────────────────────────────────────────────────────
export const profileApi = {
  getPublicProfile: (username) => API.get(`/users/${encodeURIComponent(username)}/profile`),
}

// ── Users ─────────────────────────────────────────────────────────────────
export const usersApi = {
  myPoints: () => API.get('/users/me/points'),
  myLevel: () => API.get('/users/me/level'),
  myPurchases: () => API.get('/users/me/purchases'),
  mySubmittedSkills: () => API.get('/users/me/submitted-skills'),
  checkIn: () => API.post('/users/me/check-in'),
  uploadSkill: (formData) => API.post('/users/me/submissions/upload', formData),
  purchaseStatus: (id) => API.get(`/users/me/skills/${id}/purchase-status`),
}

// ── Ratings ───────────────────────────────────────────────────────────────
export const ratingsApi = {
  get: (id) => API.get(`/skills/${id}/rating`),
  rate: (id, rating) => API.post(`/skills/${id}/rate`, { rating }),
}

// ── Leaderboard ───────────────────────────────────────────────────────────
export const leaderboardApi = {
  get: () => API.get('/leaderboard'),
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
  adjustUserPoints: (id, data) => API.patch(`/admin/users/${id}/points`, data),
  listSubmissions: () => API.get('/admin/submissions'),
  approveSubmission: (id) => API.post(`/admin/submissions/${id}/approve`),
  rejectSubmission: (id, data) => API.post(`/admin/submissions/${id}/reject`, data),
}

export default API
