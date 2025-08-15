import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'

import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { registerSW } from './utils/registerSW'
import './index.css'

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
})

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  registerSW()
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#4A4A4A',
                border: '1px solid #E0E0E0',
                borderRadius: '0.75rem',
                padding: '12px 16px',
                fontSize: '14px',
                fontFamily: 'Proxima Nova, Tahoma, Arial, sans-serif',
              },
              success: {
                style: {
                  borderColor: '#2E7D32',
                },
                iconTheme: {
                  primary: '#2E7D32',
                  secondary: '#fff',
                },
              },
              error: {
                style: {
                  borderColor: '#C62828',
                },
                iconTheme: {
                  primary: '#C62828',
                  secondary: '#fff',
                },
              },
            }}
          />
        </AuthProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
)