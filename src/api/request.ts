import axios, { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios'
import { API_BASE_URL } from './config'
import { AUTH_TOKEN_KEY } from '../auth/session'
import { handleUnauthorized } from './unauthorizedHandler'
import { refreshAccessToken } from './tokenRefresh'

const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

request.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

request.interceptors.response.use(
  // The backend returns the resource directly (no envelope) and an empty
  // body on 204 -- axios gives that back as `''`, which every caller should
  // see as "nothing", not a string.
  (response) => (response.data === '' ? undefined : response.data),
  async (error: AxiosError) => {
    const original = error.config as (typeof error.config & { _retry?: boolean }) | undefined
    if (error.response?.status === 401 && localStorage.getItem(AUTH_TOKEN_KEY) && original && !original._retry) {
      original._retry = true
      const token = await refreshAccessToken()
      if (token) {
        original.headers = AxiosHeaders.from(original.headers)
        original.headers.set('Authorization', `Bearer ${token}`)
        const response = await request(original)
        return response
      }
      handleUnauthorized()
    }
    return Promise.reject(error)
  },
)

export default request
