import React from 'react';

export interface ErrorDisplayProps {
  error?: Error | null;
  message?: string;
  title?: string;
  showDetails?: boolean;
  onRetry?: (() => void) | (() => Promise<any>);
  onDismiss?: () => void;
  variant?: 'inline' | 'modal' | 'banner';
  className?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  message,
  title = 'Error',
  showDetails = false,
  onRetry,
  onDismiss,
  variant = 'inline',
  className = '',
}) => {
  if (!error && !message) return null;

  const displayMessage = message || (error ? getErrorMessage(error) : 'An error occurred');

  const getErrorMessage = (error: Error): string => {
    const response = (error as any).response;
    
    if (response?.data?.message) {
      return response.data.message;
    }
    
    if (response?.status === 404) {
      return 'The requested resource could not be found.';
    }
    
    if (response?.status === 500) {
      return 'A server error occurred. Please try again later.';
    }
    
    if (response?.status === 413) {
      return 'The file is too large. Please select a smaller image.';
    }
    
    if (error.message.includes('Network Error')) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    
    return error.message || 'An unexpected error occurred';
  };

  const getErrorIcon = (error: Error): string => {
    const response = (error as any).response;
    
    if (response?.status === 404) return '🔍';
    if (response?.status === 500) return '⚠️';
    if (response?.status === 413) return '📁';
    if (error.message.includes('Network Error')) return '📡';
    
    return '❌';
  };

  const baseClasses = 'rounded-lg border';
  
  const variantClasses = {
    inline: 'p-4 bg-red-50 border-red-200',
    modal: 'p-6 bg-white border-red-200 shadow-lg',
    banner: 'p-3 bg-red-100 border-red-300',
  };

  const textClasses = {
    inline: {
      title: 'text-sm font-medium text-red-800',
      message: 'text-sm text-red-700 mt-1',
      details: 'text-xs text-red-600 mt-2',
    },
    modal: {
      title: 'text-lg font-semibold text-red-900',
      message: 'text-red-800 mt-2',
      details: 'text-sm text-red-700 mt-3',
    },
    banner: {
      title: 'text-sm font-medium text-red-800',
      message: 'text-sm text-red-700',
      details: 'text-xs text-red-600 mt-1',
    },
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-lg">{getErrorIcon(error)}</span>
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className={textClasses[variant].title}>
            {title}
          </h3>
          <p className={textClasses[variant].message}>
            {getErrorMessage(error)}
          </p>
          
          {showDetails && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-red-600 hover:text-red-700">
                Technical Details
              </summary>
              <pre className={`${textClasses[variant].details} bg-red-100 p-2 rounded mt-1 overflow-auto max-h-32`}>
                {error.stack || error.message}
              </pre>
            </details>
          )}
        </div>
        
        <div className="ml-4 flex flex-col space-y-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded font-medium transition-colors"
            >
              Retry
            </button>
          )}
          
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-xs text-red-600 hover:text-red-700 font-medium"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;