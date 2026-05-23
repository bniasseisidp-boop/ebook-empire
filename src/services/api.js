import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
})

// Inject admin token if present
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('empire_admin_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// ─── Public API ───────────────────────────────────
export const getBooks      = (params = {}) => api.get('/books', { params })
export const getBook       = (id)          => api.get(`/books/${id}`)
export const requestDownload = (id, email) => api.post(`/books/${id}/download`, { email })
export const createPaymentIntent = (id, email) => api.post(`/books/${id}/purchase`, { email })
export const confirmPurchase = (bookId, paymentIntentId) =>
  api.post(`/books/${bookId}/confirm-purchase`, { payment_intent_id: paymentIntentId })

// ─── Admin API ────────────────────────────────────
export const adminLogin    = (credentials) => api.post('/admin/login', credentials)
export const adminLogout   = ()            => { localStorage.removeItem('empire_admin_token') }
export const uploadBook    = (formData)    => api.post('/admin/books', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const getAdminBooks = ()            => api.get('/admin/books')
export const deleteBook    = (id)          => api.delete(`/admin/books/${id}`)
export const updateBook    = (id, data)    => api.put(`/admin/books/${id}`, data)
export const getDownloads  = (params = {}) => api.get('/admin/downloads', { params })
export const getPurchases  = (params = {}) => api.get('/admin/purchases', { params })
export const getStats      = ()            => api.get('/admin/stats')
export const getChartData  = ()            => api.get('/admin/chart-data')

export default api
