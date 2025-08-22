import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PaginationConfig } from '../components/EnhancedPagination';

export interface UsePaginationOptions {
  defaultPage?: number;
  defaultLimit?: number;
  persistInUrl?: boolean;
  urlParams?: {
    page?: string;
    limit?: string;
  };
}

export interface UsePaginationReturn {
  page: number;
  limit: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  reset: () => void;
  getConfig: (total: number) => PaginationConfig;
}

/**
 * Custom hook for pagination state management with URL persistence
 * Part of Phase 2 UX improvements for enhanced pagination
 */
export const usePagination = (options: UsePaginationOptions = {}): UsePaginationReturn => {
  const {
    defaultPage = 1,
    defaultLimit = 25,
    persistInUrl = true,
    urlParams = { page: 'page', limit: 'limit' },
  } = options;

  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize state from URL params or defaults
  const [page, setPageState] = useState(() => {
    if (persistInUrl && urlParams.page) {
      const urlPage = searchParams.get(urlParams.page);
      return urlPage ? Math.max(1, parseInt(urlPage, 10)) : defaultPage;
    }
    return defaultPage;
  });

  const [limit, setLimitState] = useState(() => {
    if (persistInUrl && urlParams.limit) {
      const urlLimit = searchParams.get(urlParams.limit);
      return urlLimit ? Math.max(1, parseInt(urlLimit, 10)) : defaultLimit;
    }
    return defaultLimit;
  });

  // Update URL when state changes
  const updateUrl = useCallback((newPage: number, newLimit: number) => {
    if (!persistInUrl) return;

    const params = new URLSearchParams(searchParams);
    
    if (urlParams.page) {
      if (newPage === defaultPage) {
        params.delete(urlParams.page);
      } else {
        params.set(urlParams.page, newPage.toString());
      }
    }
    
    if (urlParams.limit) {
      if (newLimit === defaultLimit) {
        params.delete(urlParams.limit);
      } else {
        params.set(urlParams.limit, newLimit.toString());
      }
    }
    
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams, persistInUrl, urlParams, defaultPage, defaultLimit]);

  const setPage = useCallback((newPage: number) => {
    const validPage = Math.max(1, newPage);
    setPageState(validPage);
    updateUrl(validPage, limit);
  }, [limit, updateUrl]);

  const setLimit = useCallback((newLimit: number) => {
    const validLimit = Math.max(1, newLimit);
    setLimitState(validLimit);
    // Reset to page 1 when changing limit to avoid out-of-bounds pages
    setPageState(1);
    updateUrl(1, validLimit);
  }, [updateUrl]);

  const reset = useCallback(() => {
    setPageState(defaultPage);
    setLimitState(defaultLimit);
    updateUrl(defaultPage, defaultLimit);
  }, [defaultPage, defaultLimit, updateUrl]);

  const getConfig = useCallback((total: number): PaginationConfig => ({
    page,
    limit,
    total,
    showSizeSelector: true,
    sizeOptions: [10, 25, 50, 100],
    showInfo: true,
    showFirstLast: true,
    maxVisiblePages: 5,
  }), [page, limit]);

  // Sync with URL changes from external sources
  useEffect(() => {
    if (!persistInUrl) return;

    const urlPage = urlParams.page ? searchParams.get(urlParams.page) : null;
    const urlLimit = urlParams.limit ? searchParams.get(urlParams.limit) : null;

    if (urlPage) {
      const parsedPage = Math.max(1, parseInt(urlPage, 10));
      if (parsedPage !== page) {
        setPageState(parsedPage);
      }
    }

    if (urlLimit) {
      const parsedLimit = Math.max(1, parseInt(urlLimit, 10));
      if (parsedLimit !== limit) {
        setLimitState(parsedLimit);
      }
    }
  }, [searchParams, persistInUrl, urlParams, page, limit]);

  return {
    page,
    limit,
    setPage,
    setLimit,
    reset,
    getConfig,
  };
};