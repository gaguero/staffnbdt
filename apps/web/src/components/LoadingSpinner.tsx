import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-b-2 ${sizeClasses[size]}`}
        style={{ borderColor: 'var(--brand-primary)' }}
        role="status"
        aria-label="Loading"
      />
      {text && (
        <p className="mt-2 text-sm animate-pulse" style={{ color: 'var(--brand-text-secondary)' }}>
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;