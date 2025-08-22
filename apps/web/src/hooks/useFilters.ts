import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FilterPreset } from '../components/FilterCombination';

interface UseFiltersOptions {
  defaultFilters?: Record<string, any>;
  storageKey?: string;
  enableUrlSync?: boolean;
  enableLocalStorage?: boolean;
  onFilterChange?: (filters: Record<string, any>) => void;
}

interface UseFiltersReturn {
  filters: Record<string, any>;
  presets: FilterPreset[];
  activeFilterCount: number;
  
  // Filter operations
  setFilter: (key: string, value: any) => void;
  removeFilter: (key: string) => void;
  clearAllFilters: () => void;
  setMultipleFilters: (filters: Record<string, any>) => void;
  
  // Preset operations
  savePreset: (name: string, description?: string) => void;
  loadPreset: (preset: FilterPreset) => void;
  deletePreset: (presetId: string) => void;
  
  // Utility functions
  hasActiveFilters: boolean;
  getFilterValue: (key: string) => any;
  isFilterActive: (key: string) => boolean;
  exportFiltersToUrl: () => string;
  importFiltersFromUrl: (url: string) => void;
}

export const useFilters = (options: UseFiltersOptions = {}): UseFiltersReturn => {
  const {
    defaultFilters = {},
    storageKey = 'filters-data',
    enableUrlSync = true,
    enableLocalStorage = true,
    onFilterChange,
  } = options;

  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<Record<string, any>>(defaultFilters);
  const [presets, setPresets] = useState<FilterPreset[]>([]);

  // Load from URL params on mount
  useEffect(() => {
    if (enableUrlSync) {
      const urlFilters: Record<string, any> = {};
      
      for (const [key, value] of searchParams.entries()) {
        if (key.startsWith('filter_')) {
          const filterKey = key.substring(7); // Remove 'filter_' prefix
          try {
            // Try to parse JSON for complex values
            urlFilters[filterKey] = JSON.parse(decodeURIComponent(value));
          } catch {
            // Fallback to string value
            urlFilters[filterKey] = decodeURIComponent(value);
          }
        }
      }
      
      if (Object.keys(urlFilters).length > 0) {
        setFilters(prev => ({ ...prev, ...urlFilters }));
      }
    }
  }, [searchParams, enableUrlSync]);

  // Load from localStorage on mount
  useEffect(() => {
    if (enableLocalStorage && storageKey) {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const data = JSON.parse(stored);
          if (data.presets) {
            setPresets(data.presets);
          }
        }
      } catch (error) {
        console.warn('Failed to load filter data from localStorage:', error);
      }
    }
  }, [enableLocalStorage, storageKey]);

  // Save presets to localStorage when they change
  useEffect(() => {
    if (enableLocalStorage && storageKey) {
      try {
        const data = {
          presets,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch (error) {
        console.warn('Failed to save filter data to localStorage:', error);
      }
    }
  }, [presets, enableLocalStorage, storageKey]);

  // Sync filters to URL when they change
  useEffect(() => {
    if (enableUrlSync) {
      const newSearchParams = new URLSearchParams(searchParams);
      
      // Remove all existing filter params
      for (const key of Array.from(newSearchParams.keys())) {
        if (key.startsWith('filter_')) {
          newSearchParams.delete(key);
        }
      }
      
      // Add current filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && 
            (!Array.isArray(value) || value.length > 0)) {
          const paramKey = `filter_${key}`;
          const paramValue = typeof value === 'object' 
            ? encodeURIComponent(JSON.stringify(value))
            : encodeURIComponent(value.toString());
          newSearchParams.set(paramKey, paramValue);
        }
      });
      
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [filters, enableUrlSync, searchParams, setSearchParams]);

  // Call onChange callback when filters change
  useEffect(() => {
    onFilterChange?.(filters);
  }, [filters, onFilterChange]);

  const setFilter = useCallback((key: string, value: any) => {
    setFilters(prev => {
      if (value === undefined || value === null || value === '' || 
          (Array.isArray(value) && value.length === 0)) {
        const { [key]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: value };
    });
  }, []);

  const removeFilter = useCallback((key: string) => {
    setFilters(prev => {
      const { [key]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({});
  }, []);

  const setMultipleFilters = useCallback((newFilters: Record<string, any>) => {
    setFilters(newFilters);
  }, []);

  const savePreset = useCallback((name: string, description?: string) => {
    const newPreset: FilterPreset = {
      id: `preset_${Date.now()}`,
      name: name.trim(),
      description: description?.trim(),
      filters: { ...filters },
      createdAt: new Date().toISOString(),
    };

    setPresets(prev => {
      // Remove any existing preset with the same name
      const filtered = prev.filter(preset => preset.name !== newPreset.name);
      return [...filtered, newPreset].sort((a, b) => a.name.localeCompare(b.name));
    });
  }, [filters]);

  const loadPreset = useCallback((preset: FilterPreset) => {
    setFilters({ ...preset.filters });
  }, []);

  const deletePreset = useCallback((presetId: string) => {
    setPresets(prev => prev.filter(preset => preset.id !== presetId));
  }, []);

  const getFilterValue = useCallback((key: string) => {
    return filters[key];
  }, [filters]);

  const isFilterActive = useCallback((key: string) => {
    const value = filters[key];
    return value !== undefined && value !== null && value !== '' && 
           (!Array.isArray(value) || value.length > 0);
  }, [filters]);

  const exportFiltersToUrl = useCallback(() => {
    const url = new URL(window.location.href);
    
    // Clear existing filter params
    for (const key of Array.from(url.searchParams.keys())) {
      if (key.startsWith('filter_')) {
        url.searchParams.delete(key);
      }
    }
    
    // Add current filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && 
          (!Array.isArray(value) || value.length > 0)) {
        const paramKey = `filter_${key}`;
        const paramValue = typeof value === 'object' 
          ? encodeURIComponent(JSON.stringify(value))
          : encodeURIComponent(value.toString());
        url.searchParams.set(paramKey, paramValue);
      }
    });
    
    return url.toString();
  }, [filters]);

  const importFiltersFromUrl = useCallback((urlString: string) => {
    try {
      const url = new URL(urlString);
      const importedFilters: Record<string, any> = {};
      
      for (const [key, value] of url.searchParams.entries()) {
        if (key.startsWith('filter_')) {
          const filterKey = key.substring(7);
          try {
            importedFilters[filterKey] = JSON.parse(decodeURIComponent(value));
          } catch {
            importedFilters[filterKey] = decodeURIComponent(value);
          }
        }
      }
      
      setFilters(importedFilters);
    } catch (error) {
      console.warn('Failed to import filters from URL:', error);
    }
  }, []);

  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).filter(([, value]) => 
      value !== undefined && value !== null && value !== '' && 
      (!Array.isArray(value) || value.length > 0)
    ).length;
  }, [filters]);

  const hasActiveFilters = activeFilterCount > 0;

  return {
    filters,
    presets,
    activeFilterCount,
    
    setFilter,
    removeFilter,
    clearAllFilters,
    setMultipleFilters,
    
    savePreset,
    loadPreset,
    deletePreset,
    
    hasActiveFilters,
    getFilterValue,
    isFilterActive,
    exportFiltersToUrl,
    importFiltersFromUrl,
  };
};