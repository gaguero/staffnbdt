import React from 'react';
import { getLoadingState } from '../utils/whimsyHelpers';

interface DelightfulLoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  type?: 'syncing' | 'processing' | 'completing' | 'connecting' | 'saving' | 'loading';
  message?: string;
  showMessage?: boolean;
  className?: string;
}

const DelightfulLoadingSpinner: React.FC<DelightfulLoadingSpinnerProps> = ({
  size = 'md',
  type = 'loading',
  message,
  showMessage = true,
  className = ''
}) => {
  const loadingConfig = getLoadingState(type);
  const displayMessage = message || loadingConfig.text;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl'
  };

  return (
    <div className={`flex items-center justify-center space-x-3 ${className}`}>
      {/* Animated Icon */}
      <div className="relative">
        <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 animate-spin opacity-75`}>
        </div>
        <div className={`absolute inset-0 flex items-center justify-center ${iconSizes[size]} animate-pulse`}>
          <span className="filter drop-shadow-sm">
            {loadingConfig.icon}
          </span>
        </div>
      </div>
      
      {/* Message */}
      {showMessage && (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700 animate-pulse">
            {displayMessage}
          </span>
          <div className="flex space-x-1 mt-1">
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1 h-1 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DelightfulLoadingSpinner;