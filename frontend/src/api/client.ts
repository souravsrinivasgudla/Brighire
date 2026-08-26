import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

import { clearAccessToken, getAccessToken } from '../auth/token'
import type { ApiErrorBody } from '../types/auth'
import { ApiError } from '../utils/errors'

const baseURL = import.meta.env.VITE_API_URL

if (!baseURL) {
  console.warn('VITE_API_URL is not set. API requests will fail.')
}

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }

  return config
})

function extractDetail(data: unknown): string {
  if (!data || typeof data !== 'object') {
    return 'Request failed.'
  }

  const body = data as ApiErrorBody
  const detail = body.detail

  if (typeof detail === 'string') {
    return detail
  }

  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0]
    if (first && typeof first.msg === 'string') {
      return first.msg
    }
  }

  return 'Request failed.'
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status ?? 0
    const message = error.response
      ? extractDetail(error.response.data)
      : error.message || 'Network error. Please try again.'

    if (status === 401) {
      clearAccessToken()
    }

    return Promise.reject(new ApiError(message, status, error.response?.data))
  },
)

export default apiClient
