import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

export interface ErrorState {
  isError: boolean;
  error: Error | null;
  retryCount: number;
  isRetrying: boolean;
}

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
  showToast: boolean;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  exponentialBackoff: true,
  showToast: true,
};

export function useErrorHandler(initialConfig?: Partial<RetryConfig>) {
  const config = { ...DEFAULT_RETRY_CONFIG, ...initialConfig };
  
  const [errorState, setErrorState] = useState<ErrorState>({
    isError: false,
    error: null,
    retryCount: 0,
    isRetrying: false,
  });

  const setError = useCallback((error: Error | null) => {
    setErrorState(prev => ({
      ...prev,
      isError: !!error,
      error,
    }));
  }, []);

  const clearError = useCallback(() => {
    setErrorState({
      isError: false,
      error: null,
      retryCount: 0,
      isRetrying: false,
    });
  }, []);

  const executeWithRetry = useCallback(
    async <T>(
      operation: () => Promise<T>,
      customConfig?: Partial<RetryConfig>
    ): Promise<T> => {
      const effectiveConfig = { ...config, ...customConfig };
      let lastError: Error;

      for (let attempt = 0; attempt <= effectiveConfig.maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            setErrorState(prev => ({
              ...prev,
              isRetrying: true,
              retryCount: attempt,
            }));

            // Calculate delay with exponential backoff
            const delay = effectiveConfig.exponentialBackoff
              ? effectiveConfig.retryDelay * Math.pow(2, attempt - 1)
              : effectiveConfig.retryDelay;

            if (effectiveConfig.showToast) {
              toast.loading(`Retrying... (${attempt}/${effectiveConfig.maxRetries})`, {
                id: 'retry-toast',
                duration: delay,
              });
            }

            await new Promise(resolve => setTimeout(resolve, delay));
          }

          const result = await operation();
          
          // Clear error state on success
          setErrorState({
            isError: false,
            error: null,
            retryCount: 0,
            isRetrying: false,
          });

          if (attempt > 0 && effectiveConfig.showToast) {
            toast.dismiss('retry-toast');
            toast.success('Operation succeeded after retry!');
          }

          return result;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          
          // Check if error should not be retried
          if (isNonRetryableError(lastError)) {
            break;
          }
        }
      }

      // All retries exhausted
      setErrorState({
        isError: true,
        error: lastError!,
        retryCount: effectiveConfig.maxRetries,
        isRetrying: false,
      });

      if (effectiveConfig.showToast) {
        toast.dismiss('retry-toast');
        toast.error(getErrorMessage(lastError!));
      }

      throw lastError!;
    },
    [config]
  );

  return {
    errorState,
    setError,
    clearError,
    executeWithRetry,
    isError: errorState.isError,
    error: errorState.error,
    isRetrying: errorState.isRetrying,
    retryCount: errorState.retryCount,
  };
}

function isNonRetryableError(error: Error): boolean {
  const nonRetryableStatuses = [400, 401, 403, 404, 422];
  const response = (error as any).response;
  
  if (response && nonRetryableStatuses.includes(response.status)) {
    return true;
  }

  // Check for specific error types that shouldn't be retried
  const nonRetryableMessages = [
    'invalid file type',
    'file too large',
    'unauthorized',
    'forbidden',
    'not found',
    'validation error',
  ];

  const errorMessage = error.message.toLowerCase();
  return nonRetryableMessages.some(msg => errorMessage.includes(msg));
}

function getErrorMessage(error: Error): string {
  const response = (error as any).response;
  
  if (response?.data?.message) {
    return response.data.message;
  }
  
  if (response?.status === 404) {
    return 'Resource not found. Please check if the service is available.';
  }
  
  if (response?.status === 500) {
    return 'Server error. Please try again in a moment.';
  }
  
  if (response?.status === 413) {
    return 'File too large. Please select a smaller image.';
  }
  
  if (error.message.includes('Network Error')) {
    return 'Network connection problem. Please check your internet connection.';
  }
  
  return error.message || 'An unexpected error occurred';
}

export default useErrorHandler;