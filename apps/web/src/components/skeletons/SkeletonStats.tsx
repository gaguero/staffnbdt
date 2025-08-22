import React from 'react';

interface SkeletonStatsProps {
  cards?: number;
  className?: string;
}

/**
 * Skeleton loader for statistics cards
 * Matches the grid layout of stat cards
 */
const SkeletonStats: React.FC<SkeletonStatsProps> = ({
  cards = 5,
  className = '',
}) => {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Array.from({ length: cards }).map((_, index) => (
          <div key={index} className="card p-4 text-center">
            <div className="flex justify-center mb-2">
              <div className="w-8 h-8 bg-gray-200 rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded mx-auto w-3/4" />
              <div className="h-6 bg-gray-200 rounded mx-auto w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkeletonStats;