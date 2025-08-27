import { useState, useCallback, useEffect } from 'react';
import { SearchHistory, SavedSearch } from '../types/permissionSearch';

interface UseSearchHistoryOptions {
  maxHistoryItems?: number;
  storageKey?: string;
  enableLocalStorage?: boolean;
}

interface UseSearchHistoryReturn {
  history: SearchHistory[];
  savedSearches: SavedSearch[];
  addToHistory: (query: string, resultCount: number, filters?: any) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  saveSearch: (name: string, query: string, description?: string, filters?: any) => void;
  deleteSavedSearch: (id: string) => void;
  updateSavedSearch: (id: string, updates: Partial<SavedSearch>) => void;
  getPopularQueries: () => string[];
  getRecentQueries: () => string[];
}

const DEFAULT_OPTIONS: UseSearchHistoryOptions = {
  maxHistoryItems: 50,
  storageKey: 'permissionSearchHistory',
  enableLocalStorage: true,
};

/**
 * Custom hook for managing search history and saved searches
 */
export function useSearchHistory(options: UseSearchHistoryOptions = {}): UseSearchHistoryReturn {
  const {
    maxHistoryItems = 50,
    storageKey = 'permissionSearchHistory',
    enableLocalStorage = true,
  } = { ...DEFAULT_OPTIONS, ...options };

  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    if (!enableLocalStorage) return;

    try {
      const historyData = localStorage.getItem(`${storageKey}_history`);
      const savedData = localStorage.getItem(`${storageKey}_saved`);

      if (historyData) {
        const parsedHistory = JSON.parse(historyData);
        setHistory(parsedHistory.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        })));
      }

      if (savedData) {
        const parsedSaved = JSON.parse(savedData);
        setSavedSearches(parsedSaved.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          lastUsed: item.lastUsed ? new Date(item.lastUsed) : undefined,
        })));
      }
    } catch (error) {
      console.warn('Failed to load search history from localStorage:', error);
    }
  }, [storageKey, enableLocalStorage]);

  // Save to localStorage when data changes
  useEffect(() => {
    if (!enableLocalStorage) return;

    try {
      localStorage.setItem(`${storageKey}_history`, JSON.stringify(history));
    } catch (error) {
      console.warn('Failed to save search history to localStorage:', error);
    }
  }, [history, storageKey, enableLocalStorage]);

  useEffect(() => {
    if (!enableLocalStorage) return;

    try {
      localStorage.setItem(`${storageKey}_saved`, JSON.stringify(savedSearches));
    } catch (error) {
      console.warn('Failed to save saved searches to localStorage:', error);
    }
  }, [savedSearches, storageKey, enableLocalStorage]);

  // Add item to history
  const addToHistory = useCallback((query: string, resultCount: number, filters?: any) => {
    if (!query.trim()) return;

    setHistory(prev => {
      // Remove existing entry with same query
      const filtered = prev.filter(item => item.query !== query);
      
      // Add new entry at the beginning
      const newItem: SearchHistory = {
        id: Date.now().toString(),
        query,
        timestamp: new Date(),
        resultCount,
        filters,
      };

      // Keep only the most recent items
      return [newItem, ...filtered].slice(0, maxHistoryItems);
    });
  }, [maxHistoryItems]);

  // Remove item from history
  const removeFromHistory = useCallback((id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  }, []);

  // Clear all history
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  // Save a search
  const saveSearch = useCallback((name: string, query: string, description?: string, filters?: any) => {
    if (!name.trim() || !query.trim()) return;

    const newSavedSearch: SavedSearch = {
      id: Date.now().toString(),
      name: name.trim(),
      query: query.trim(),
      description: description?.trim(),
      filters,
      createdAt: new Date(),
      useCount: 0,
    };

    setSavedSearches(prev => [...prev, newSavedSearch]);
  }, []);

  // Delete a saved search
  const deleteSavedSearch = useCallback((id: string) => {
    setSavedSearches(prev => prev.filter(item => item.id !== id));
  }, []);

  // Update a saved search
  const updateSavedSearch = useCallback((id: string, updates: Partial<SavedSearch>) => {
    setSavedSearches(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  // Get popular queries (most frequently searched)
  const getPopularQueries = useCallback((): string[] => {
    const queryFrequency = new Map<string, number>();

    // Count frequency of each query in history
    history.forEach(item => {
      const count = queryFrequency.get(item.query) || 0;
      queryFrequency.set(item.query, count + 1);
    });

    // Sort by frequency and return top queries
    return Array.from(queryFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(entry => entry[0]);
  }, [history]);

  // Get recent queries (chronologically recent)
  const getRecentQueries = useCallback((): string[] => {
    return history
      .slice(0, 10)
      .map(item => item.query);
  }, [history]);

  return {
    history,
    savedSearches,
    addToHistory,
    removeFromHistory,
    clearHistory,
    saveSearch,
    deleteSavedSearch,
    updateSavedSearch,
    getPopularQueries,
    getRecentQueries,
  };
}

export default useSearchHistory;
