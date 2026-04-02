import axios from 'axios'

const API = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// Skills
export const skillsApi = {
  list: (params) => API.get('/skills', { params }),
  getBySlug: (slug) => API.get(`/skills/${slug}`),
  recordClick: (id) => API.post(`/skills/${id}/click`),
  recordDownload: (id) => API.post(`/skills/${id}/download`),
  downloadPackageUrl: (id) => `/api/skills/${id}/download-package`,
  trending: () => API.get('/skills/trending'),
  mostDownloaded: () => API.get('/skills/most-downloaded'),
  featured: () => API.get('/skills/featured'),
  latest: () => API.get('/skills/latest'),
  stats: () => API.get('/skills/stats'),
}

// Categories
export const categoriesApi = {
  list: () => API.get('/categories'),
  grouped: () => API.get('/categories/grouped'),
  getBySlug: (slug) => API.get(`/categories/${slug}`),
}

// Admin
export const adminApi = {
  crawl: () => API.post('/admin/crawl'),
}

export default API
