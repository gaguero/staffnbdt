import { useState, useCallback, useMemo } from 'react';

export interface BulkSelectionState<T = any> {
  selectedIds: Set<string>;
  selectedItems: T[];
  isAllSelected: boolean;
  isPartialSelection: boolean;
  selectedCount: number;
}

export interface UseBulkSelectionReturn<T = any> {
  state: BulkSelectionState<T>;
  toggleItem: (id: string, item?: T) => void;
  toggleAll: (items: T[], getItemId: (item: T) => string) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
  getSelectedItems: (items: T[], getItemId: (item: T) => string) => T[];
}

/**
 * Custom hook for managing bulk selection state
 * Part of Phase 2 UX improvements for bulk operations framework
 */
export const useBulkSelection = <T = any>(): UseBulkSelectionReturn<T> => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<T[]>([]);

  const toggleItem = useCallback((id: string, item?: T) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });

    if (item) {
      setSelectedItems(prev => {
        const exists = prev.find((i: any) => i.id === id);
        if (exists) {
          return prev.filter((i: any) => i.id !== id);
        } else {
          return [...prev, item];
        }
      });
    }
  }, []);

  const toggleAll = useCallback((items: T[], getItemId: (item: T) => string) => {
    const allIds = items.map(getItemId);
    const allSelected = allIds.every(id => selectedIds.has(id));

    if (allSelected) {
      // Deselect all
      setSelectedIds(new Set());
      setSelectedItems([]);
    } else {
      // Select all
      setSelectedIds(new Set(allIds));
      setSelectedItems([...items]);
    }
  }, [selectedIds]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectedItems([]);
  }, []);

  const isSelected = useCallback((id: string) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  const getSelectedItems = useCallback((items: T[], getItemId: (item: T) => string) => {
    return items.filter(item => selectedIds.has(getItemId(item)));
  }, [selectedIds]);

  const state = useMemo((): BulkSelectionState<T> => {
    const selectedCount = selectedIds.size;
    
    return {
      selectedIds,
      selectedItems,
      isAllSelected: false, // Will be calculated in the component with current items
      isPartialSelection: selectedCount > 0,
      selectedCount,
    };
  }, [selectedIds, selectedItems]);

  return {
    state,
    toggleItem,
    toggleAll,
    clearSelection,
    isSelected,
    getSelectedItems,
  };
};