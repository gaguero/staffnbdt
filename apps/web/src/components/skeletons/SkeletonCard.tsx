import React from 'react';

interface SkeletonCardProps {
  className?: string;
  showAvatar?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  showBadge?: boolean;
  showActions?: boolean;
  rows?: number;
}

/**
 * Skeleton loader for card-like content
 * Provides a better loading experience than generic spinners
 */
const SkeletonCard: React.FC<SkeletonCardProps> = ({
  className = '',
  showAvatar = true,
  showTitle = true,
  showSubtitle = true,
  showBadge = false,
  showActions = false,
  rows = 1,
}) => {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="card p-4">
        <div className="flex items-start space-x-4">
          {showAvatar && (
            <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
          )}
          
          <div className="flex-1 min-w-0 space-y-3">
            {showTitle && (
              <div className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                {showBadge && <div className="h-5 bg-gray-200 rounded-full w-16" />}
              </div>
            )}
            
            {showSubtitle && (
              <div className="h-3 bg-gray-200 rounded w-1/4" />
            )}
            
            {/* Content rows */}
            <div className="space-y-2">
              {Array.from({ length: rows }).map((_, index) => (
                <div
                  key={index}
                  className={`h-3 bg-gray-200 rounded ${
                    index === rows - 1 ? 'w-3/4' : 'w-full'
                  }`}
                />
              ))}
            </div>
            
            {showActions && (
              <div className="flex space-x-2 pt-2">
                <div className="h-8 bg-gray-200 rounded w-16" />
                <div className="h-8 bg-gray-200 rounded w-16" />
                <div className="h-8 bg-gray-200 rounded w-16" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;