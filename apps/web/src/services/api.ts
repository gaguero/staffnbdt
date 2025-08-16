import axios from 'axios';
import { TOKEN_STORAGE_KEY } from '../utils/constants';

// Use VITE_API_URL if set, otherwise use relative paths (for Railway deployment)
const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log requests in development
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    // Log errors in development
    if (import.meta.env.DEV) {
      console.error(`[API Error] ${error.config?.url}`, error.response?.data || error.message);
    }
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      window.location.href = '/login';
    }
    
    // Extract meaningful error message
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'An unexpected error occurred';
    
    // Create a new error with the extracted message
    const enhancedError = new Error(errorMessage);
    enhancedError.name = error.name;
    // Preserve the original error for debugging
    (enhancedError as any).originalError = error;
    (enhancedError as any).response = error.response;
    
    return Promise.reject(enhancedError);
  }
);

export default api;