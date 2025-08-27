import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, ExternalLinkIcon, RefreshCwIcon, DownloadIcon } from 'lucide-react';
import { DrillDownData } from '../hooks/useStatsDrillDown';
import LoadingSpinner from './LoadingSpinner';

interface StatDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: DrillDownData | null;
  isLoading?: boolean;
  error?: string | null;
  onNavigateToFiltered?: () => void;
  onRefresh?: () => void;
  onExport?: () => void;
}

const StatDrillDownModal: React.FC<StatDrillDownModalProps> = ({
  isOpen,
  onClose,
  data,
  isLoading = false,
  error = null,
  onNavigateToFiltered,
  onRefresh,
  onExport,
}) => {
  if (!isOpen || !data) return null;

  const renderDataItem = (item: any, index: number) => {
    // Generic data item renderer - customize based on your data structure
    const keys = Object.keys(item);
    const primaryKey = keys.find(key => 
      key.includes('name') || key.includes('title') || key.includes('label')
    ) || keys[0];
    
    const secondaryKey = keys.find(key => 
      key.includes('email') || key.includes('description') || key.includes('type')
    );
    
    const statusKey = keys.find(key => 
      key.includes('status') || key.includes('isActive') || key.includes('active')
    );

    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="font-medium text-charcoal">
              {item[primaryKey] || `Item ${index + 1}`}
            </p>
            {secondaryKey && item[secondaryKey] && (
              <p className="text-sm text-gray-600">
                {item[secondaryKey]}
              </p>
            )}
          </div>
          
          {statusKey && item[statusKey] !== undefined && (
            <div className="ml-2">
              {typeof item[statusKey] === 'boolean' ? (
                <span className={`badge ${item[statusKey] ? 'badge-success' : 'badge-error'}`}>
                  {item[statusKey] ? 'Active' : 'Inactive'}
                </span>
              ) : (
                <span className="badge badge-neutral">
                  {item[statusKey]}
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Additional fields */}
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500">
          {keys.slice(0, 4).map(key => {
            if (key === primaryKey || key === secondaryKey || key === statusKey) return null;
            
            const value = item[key];
            if (value === null || value === undefined || value === '') return null;
            
            return (
              <div key={key} className="truncate">
                <span className="font-medium">{key}:</span> {value.toString()}
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-charcoal flex items-center space-x-2">
                  <span>{data.originalStat.icon}</span>
                  <span>{data.title}</span>
                </h2>
                {data.subtitle && (
                  <p className="text-gray-600 mt-1">{data.subtitle}</p>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {onRefresh && (
                  <button
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="btn btn-outline btn-sm"
                    title="Refresh Data"
                  >
                    <RefreshCwIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                )}
                
                {onExport && (
                  <button
                    onClick={onExport}
                    className="btn btn-outline btn-sm"
                    title="Export Data"
                  >
                    <DownloadIcon className="w-4 h-4" />
                  </button>
                )}
                
                {onNavigateToFiltered && (
                  <button
                    onClick={onNavigateToFiltered}
                    className="btn btn-primary btn-sm"
                    title="View in Main List"
                  >
                    <ExternalLinkIcon className="w-4 h-4 mr-1" />
                    View All
                  </button>
                )}
                
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {error ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="text-lg font-medium text-charcoal mb-2">
                  Failed to Load Data
                </h3>
                <p className="text-gray-600 mb-4">{error}</p>
                {onRefresh && (
                  <button
                    onClick={onRefresh}
                    className="btn btn-primary"
                  >
                    Try Again
                  </button>
                )}
              </div>
            ) : isLoading ? (
              <div className="text-center py-12">
                <LoadingSpinner size="lg" />
                <p className="text-gray-600 mt-4">Loading detailed data...</p>
              </div>
            ) : data.data.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">{data.originalStat.icon || '📊'}</div>
                <h3 className="text-lg font-medium text-charcoal mb-2">
                  No Data Found
                </h3>
                <p className="text-gray-600">
                  No detailed data is available for this statistic.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Statistics Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{data.data.length}</p>
                    <p className="text-sm text-gray-600">Total Items</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {data.originalStat.value}
                    </p>
                    <p className="text-sm text-gray-600">Original Value</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Last Updated</p>
                    <p className="text-xs text-gray-500">
                      {new Date(data.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Applied Filters */}
                {data.filters && Object.keys(data.filters).length > 0 && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Applied Filters:</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(data.filters).map(([key, value]) => (
                        <span
                          key={key}
                          className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                        >
                          <span className="font-medium">{key}:</span>
                          <span className="ml-1">
                            {Array.isArray(value) ? value.join(', ') : value.toString()}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Data Items */}
                <div>
                  <h4 className="text-lg font-medium text-charcoal mb-4">
                    Detailed Breakdown
                  </h4>
                  
                  <div className="grid gap-3">
                    <AnimatePresence>
                      {data.data.map((item, index) => renderDataItem(item, index))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {data.data.length > 0 && (
                  <span>Showing {data.data.length} items</span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {onNavigateToFiltered && (
                  <button
                    onClick={onNavigateToFiltered}
                    className="btn btn-primary"
                  >
                    View Full List
                  </button>
                )}
                
                <button
                  onClick={onClose}
                  className="btn btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default StatDrillDownModal;