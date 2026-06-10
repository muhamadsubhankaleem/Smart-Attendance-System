import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// ─── Request Interceptor — inject access token ────────────────────────────────
axiosInstance.interceptors.request.use((config) => {
  const token = window.__accessToken
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  return config
})

// ─── Response Interceptor — auto-refresh on 401 ───────────────────────────────
axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/v1/auth/refresh', {
            refresh_token: refreshToken,
          })
          window.__accessToken = data.access_token
          localStorage.setItem('refresh_token', data.refresh_token)
          original.headers['Authorization'] = `Bearer ${data.access_token}`
          return axiosInstance(original)
        } catch {
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
