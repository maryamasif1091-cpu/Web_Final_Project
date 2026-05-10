import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL}/api` 
    : 'http://localhost:5001/api',
})

API.interceptors.request.use((config) => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user?.token) config.headers.Authorization = `Bearer ${user.token}`
  } catch {}
  return config
})

API.interceptors.response.use(
  res => res,
  err => {
    console.error('API Error:', err.response?.data?.message || err.message)
    return Promise.reject(err)
  }
)

export default API