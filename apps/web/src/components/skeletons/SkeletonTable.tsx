import React from 'react';

interface SkeletonTableProps {
  columns?: number;
  rows?: number;
  showHeader?: boolean;
  className?: string;
}

/**
 * Skeleton loader for table content
 * Mimics the structure of data tables
 */
const SkeletonTable: React.FC<SkeletonTableProps> = ({
  columns = 6,
  rows = 5,
  showHeader = true,
  className = '',
}) => {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="card">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              {showHeader && (
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {Array.from({ length: columns }).map((_, index) => (
                      <th key={index} className="px-6 py-3">
                        <div className="h-3 bg-gray-200 rounded w-3/4" />
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.from({ length: rows }).map((_, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    {Array.from({ length: columns }).map((_, colIndex) => (
                      <td key={colIndex} className="px-6 py-4">
                        {colIndex === 0 ? (
                          // First column with avatar + text
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-200 rounded-full mr-4" />
                            <div className="space-y-1">
                              <div className="h-3 bg-gray-200 rounded w-24" />
                              <div className="h-2 bg-gray-200 rounded w-16" />
                            </div>
                          </div>
                        ) : colIndex === columns - 1 ? (
                          // Last column with action buttons
                          <div className="flex space-x-2">
                            <div className="h-6 bg-gray-200 rounded w-12" />
                            <div className="h-6 bg-gray-200 rounded w-12" />
                            <div className="h-6 bg-gray-200 rounded w-16" />
                          </div>
                        ) : (
                          // Regular content columns
                          <div className="space-y-1">
                            <div className={`h-3 bg-gray-200 rounded ${
                              Math.random() > 0.5 ? 'w-full' : 'w-3/4'
                            }`} />
                            {Math.random() > 0.7 && (
                              <div className="h-2 bg-gray-200 rounded w-1/2" />
                            )}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonTable;