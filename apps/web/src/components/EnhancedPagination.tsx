import React from 'react';

export interface PaginationConfig {
  page: number;
  limit: number;
  total: number;
  showSizeSelector?: boolean;
  sizeOptions?: number[];
  showInfo?: boolean;
  showFirstLast?: boolean;
  maxVisiblePages?: number;
}

interface EnhancedPaginationProps {
  config: PaginationConfig;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  className?: string;
  loading?: boolean;
}

/**
 * Enhanced pagination component with items per page selector and navigation controls
 * Implements Phase 2 UX improvement for enhanced pagination
 */
const EnhancedPagination: React.FC<EnhancedPaginationProps> = ({
  config,
  onPageChange,
  onLimitChange,
  className = '',
  loading = false,
}) => {
  const {
    page,
    limit,
    total,
    showSizeSelector = true,
    sizeOptions = [10, 25, 50, 100],
    showInfo = true,
    showFirstLast = true,
    maxVisiblePages = 5,
  } = config;

  const totalPages = Math.ceil(total / limit);
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  // Calculate visible page numbers
  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Smart pagination with ellipsis
      const halfVisible = Math.floor(maxVisiblePages / 2);
      let startPage = Math.max(1, page - halfVisible);
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      // Always show first page
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push('...');
        }
      }
      
      // Show visible pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Always show last page
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push('...');
        }
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page && !loading) {
      onPageChange(newPage);
    }
  };

  const handleLimitChange = (newLimit: number) => {
    if (newLimit !== limit && !loading) {
      // Adjust page if necessary to stay within bounds
      const newTotalPages = Math.ceil(total / newLimit);
      const adjustedPage = Math.min(page, newTotalPages);
      onLimitChange(newLimit);
      if (adjustedPage !== page) {
        onPageChange(adjustedPage);
      }
    }
  };

  if (total === 0) {
    return null;
  }

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-t border-gray-200 bg-gray-50 ${className}`}>
      {/* Items per page selector */}
      {showSizeSelector && (
        <div className="flex items-center gap-2">
          <label htmlFor="pageSize" className="text-sm text-gray-600">
            Items per page:
          </label>
          <select
            id="pageSize"
            value={limit}
            onChange={(e) => handleLimitChange(Number(e.target.value))}
            className="form-input text-sm py-1 px-2 w-auto min-w-0"
            disabled={loading}
          >
            {sizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Pagination info */}
      {showInfo && (
        <div className="text-sm text-gray-600">
          Showing {startItem} to {endItem} of {total} results
        </div>
      )}

      {/* Navigation controls */}
      <div className="flex items-center gap-1">
        {/* First page */}
        {showFirstLast && (
          <button
            onClick={() => handlePageChange(1)}
            disabled={page === 1 || loading}
            className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="First page"
          >
            ««
          </button>
        )}

        {/* Previous page */}
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1 || loading}
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Previous page"
        >
          ‹
        </button>

        {/* Page numbers */}
        {visiblePages.map((pageNum, index) => (
          <React.Fragment key={index}>
            {pageNum === '...' ? (
              <span className="px-2 py-1 text-sm text-gray-400">...</span>
            ) : (
              <button
                onClick={() => handlePageChange(pageNum as number)}
                disabled={loading}
                className={`px-3 py-1 text-sm border rounded transition-colors ${
                  pageNum === page
                    ? 'bg-warm-gold text-white border-warm-gold'
                    : 'border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {pageNum}
              </button>
            )}
          </React.Fragment>
        ))}

        {/* Next page */}
        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages || loading}
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Next page"
        >
          ›
        </button>

        {/* Last page */}
        {showFirstLast && (
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={page === totalPages || loading}
            className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Last page"
          >
            »»
          </button>
        )}
      </div>
    </div>
  );
};

export default EnhancedPagination;