import React, { useState, useCallback } from 'react';
import useErrorHandler from '../hooks/useErrorHandler';

export interface ImageFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  fallbackComponent?: React.ReactNode;
  onError?: (error: Error) => void;
  onLoad?: () => void;
  retryEnabled?: boolean;
  maxRetries?: number;
  children?: (state: {
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    retry: () => void;
  }) => React.ReactNode;
}

const ImageFallback: React.FC<ImageFallbackProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc,
  fallbackComponent,
  onError,
  onLoad,
  retryEnabled = true,
  maxRetries = 3,
  children,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasTriedFallback, setHasTriedFallback] = useState(false);
  
  const { errorState, setError, clearError, executeWithRetry } = useErrorHandler({
    maxRetries: retryEnabled ? maxRetries : 0,
    showToast: false,
  });

  const handleImageError = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    const error = new Error(`Failed to load image: ${currentSrc}`);
    
    // If we haven't tried the fallback yet and one is provided
    if (!hasTriedFallback && fallbackSrc) {
      setHasTriedFallback(true);
      setCurrentSrc(fallbackSrc);
      return; // Don't set error yet, try fallback first
    }
    
    setError(error);
    setIsLoading(false);
    
    if (onError) {
      onError(error);
    }
  }, [currentSrc, fallbackSrc, hasTriedFallback, setError, onError]);

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    clearError();
    
    if (onLoad) {
      onLoad();
    }
  }, [clearError, onLoad]);

  const retryLoad = useCallback(async () => {
    if (!retryEnabled) return;
    
    try {
      await executeWithRetry(
        () => new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
          img.src = src;
        }),
        { showToast: true }
      );
      
      // If retry successful, reset to original src
      setCurrentSrc(src);
      setHasTriedFallback(false);
      setIsLoading(false);
    } catch (error) {
      // Error handling is done in executeWithRetry
    }
  }, [src, retryEnabled, executeWithRetry]);

  // If children render prop is provided
  if (children) {
    return (
      <>
        {children({
          isLoading,
          isError: errorState.isError,
          error: errorState.error,
          retry: retryLoad,
        })}
      </>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}>
        <span className="text-gray-400 text-sm">Loading...</span>
      </div>
    );
  }

  // Show error state with fallback component if provided
  if (errorState.isError && fallbackComponent) {
    return <>{fallbackComponent}</>;
  }

  // Show error state with retry option
  if (errorState.isError) {
    return (
      <div className={`bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-4 ${className}`}>
        <div className="text-gray-400 text-2xl mb-2">📷</div>
        <p className="text-sm text-gray-600 text-center mb-3">
          Failed to load image
        </p>
        {retryEnabled && (
          <button
            onClick={retryLoad}
            disabled={errorState.isRetrying}
            className="text-xs bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-3 py-1 rounded transition-colors"
          >
            {errorState.isRetrying ? 'Retrying...' : 'Try Again'}
          </button>
        )}
      </div>
    );
  }

  // Show the image
  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleImageError}
      onLoad={handleImageLoad}
      loading="lazy"
    />
  );
};

export default ImageFallback;