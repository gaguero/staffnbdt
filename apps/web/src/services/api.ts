import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import toast from 'react-hot-toast'

import { 
  API_BASE_URL, 
  API_TIMEOUT, 
  TOKEN_STORAGE_KEY, 
  ERROR_MESSAGES,
  REFRESH_TOKEN_THRESHOLD 
} from '../utils/constants'
import { ApiResponse, AuthTokens, ApiError } from '../types'

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Auth token management
let authTokens: AuthTokens | null = null
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: any) => void
  reject: (error: any) => void
}> = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  
  failedQueue = []
}

// Get tokens from localStorage
export const getStoredTokens = (): AuthTokens | null => {
  try {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

// Store tokens in localStorage
export const storeTokens = (tokens: AuthTokens): void => {
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens))
  authTokens = tokens
}

// Remove tokens from localStorage
export const clearTokens = (): void => {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  authTokens = null
}

// Check if token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const currentTime = Date.now() / 1000
    return payload.exp < currentTime
  } catch {
    return true
  }
}

// Check if token expires soon
const isTokenExpiringSoon = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const currentTime = Date.now()
    const expiryTime = payload.exp * 1000
    return expiryTime - currentTime < REFRESH_TOKEN_THRESHOLD
  } catch {
    return true
  }
}

// Refresh access token
const refreshAccessToken = async (): Promise<string> => {
  const tokens = getStoredTokens()
  
  if (!tokens?.refreshToken) {
    throw new Error('No refresh token available')
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken: tokens.refreshToken }
    )
    
    const newTokens: AuthTokens = response.data.data
    storeTokens(newTokens)
    return newTokens.accessToken
  } catch (error) {
    clearTokens()
    // Redirect to login
    window.location.href = '/login'
    throw error
  }
}

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    // Get current tokens
    let tokens = authTokens || getStoredTokens()
    
    if (tokens?.accessToken) {
      // Check if token is expired or expiring soon
      if (isTokenExpired(tokens.accessToken)) {
        // Token is expired, refresh it
        if (!isRefreshing) {
          isRefreshing = true
          
          try {
            const newToken = await refreshAccessToken()
            config.headers.Authorization = `Bearer ${newToken}`
            processQueue(null, newToken)
          } catch (error) {
            processQueue(error, null)
            throw error
          } finally {
            isRefreshing = false
          }
        } else {
          // Already refreshing, queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          }).then((token) => {
            config.headers.Authorization = `Bearer ${token}`
            return config
          })
        }
      } else if (isTokenExpiringSoon(tokens.accessToken)) {
        // Token expires soon, refresh it in background
        refreshAccessToken().catch(() => {
          // Ignore errors in background refresh
        })
        config.headers.Authorization = `Bearer ${tokens.accessToken}`
      } else {
        // Token is valid
        config.headers.Authorization = `Bearer ${tokens.accessToken}`
      }
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      if (!isRefreshing) {
        isRefreshing = true
        
        try {
          const newToken = await refreshAccessToken()
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          processQueue(null, newToken)
          return api(originalRequest)
        } catch (refreshError) {
          processQueue(refreshError, null)
          clearTokens()
          window.location.href = '/login'
          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
      } else {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }
    }
    
    // Handle other errors
    const apiError: ApiError = {
      message: error.response?.data?.message || ERROR_MESSAGES.NETWORK_ERROR,
      code: error.response?.data?.code || 'UNKNOWN_ERROR',
      status: error.response?.status || 0,
      details: error.response?.data?.details
    }
    
    // Show error toast for non-auth errors
    if (error.response?.status !== 401) {
      const errorMessage = getErrorMessage(error.response?.status, apiError.message)
      toast.error(errorMessage)
    }
    
    return Promise.reject(apiError)
  }
)

// Get appropriate error message based on status code
const getErrorMessage = (status?: number, defaultMessage?: string): string => {
  switch (status) {
    case 400:
      return ERROR_MESSAGES.VALIDATION_ERROR
    case 401:
      return ERROR_MESSAGES.UNAUTHORIZED
    case 403:
      return ERROR_MESSAGES.FORBIDDEN
    case 404:
      return ERROR_MESSAGES.NOT_FOUND
    case 500:
      return ERROR_MESSAGES.SERVER_ERROR
    default:
      return defaultMessage || ERROR_MESSAGES.NETWORK_ERROR
  }
}

// Generic API methods
export const apiClient = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    api.get(url, config).then(response => response.data),
    
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    api.post(url, data, config).then(response => response.data),
    
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    api.put(url, data, config).then(response => response.data),
    
  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    api.patch(url, data, config).then(response => response.data),
    
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    api.delete(url, config).then(response => response.data),
}

// File upload helper
export const uploadFile = async (
  url: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<ApiResponse<any>> => {
  const formData = new FormData()
  formData.append('file', file)
  
  return api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(progress)
      }
    },
  }).then(response => response.data)
}

// Download file helper
export const downloadFile = async (url: string, filename?: string): Promise<void> => {
  try {
    const response = await api.get(url, {
      responseType: 'blob',
    })
    
    const blob = new Blob([response.data])
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  } catch (error) {
    toast.error('Failed to download file')
    throw error
  }
}

// Initialize auth tokens from storage
authTokens = getStoredTokens()

export default api