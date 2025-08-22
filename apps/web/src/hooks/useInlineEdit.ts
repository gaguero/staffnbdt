import { useState, useCallback } from 'react';
import { toastService } from '../utils/toast';

export interface InlineEditField {
  key: string;
  type?: 'text' | 'number' | 'select' | 'boolean';
  options?: Array<{ value: any; label: string }>;
  validator?: (value: any) => string | null;
  displayFormatter?: (value: any) => string;
  permission?: string;
}

export interface UseInlineEditOptions {
  onUpdate: (id: string, field: string, value: any) => Promise<void>;
  fields: InlineEditField[];
  optimisticUpdates?: boolean;
}

export interface UseInlineEditReturn {
  isEditing: (id: string, field: string) => boolean;
  isSaving: (id: string, field: string) => boolean;
  startEdit: (id: string, field: string) => void;
  cancelEdit: (id: string, field: string) => void;
  saveEdit: (id: string, field: string, value: any) => Promise<void>;
  canEdit: (field: string) => boolean;
  getFieldConfig: (field: string) => InlineEditField | undefined;
}

/**
 * Custom hook for managing inline edit state across multiple items and fields
 * Part of Phase 2 UX improvements for inline editing capabilities
 */
export const useInlineEdit = (options: UseInlineEditOptions): UseInlineEditReturn => {
  const { onUpdate, fields, optimisticUpdates = true } = options;
  
  const [editingStates, setEditingStates] = useState<Record<string, boolean>>({});
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});

  const getStateKey = useCallback((id: string, field: string) => `${id}:${field}`, []);

  const isEditing = useCallback((id: string, field: string) => {
    return editingStates[getStateKey(id, field)] || false;
  }, [editingStates, getStateKey]);

  const isSaving = useCallback((id: string, field: string) => {
    return savingStates[getStateKey(id, field)] || false;
  }, [savingStates, getStateKey]);

  const startEdit = useCallback((id: string, field: string) => {
    const key = getStateKey(id, field);
    setEditingStates(prev => ({ ...prev, [key]: true }));
  }, [getStateKey]);

  const cancelEdit = useCallback((id: string, field: string) => {
    const key = getStateKey(id, field);
    setEditingStates(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  }, [getStateKey]);

  const saveEdit = useCallback(async (id: string, field: string, value: any) => {
    const key = getStateKey(id, field);
    const fieldConfig = fields.find(f => f.key === field);

    // Validate if validator exists
    if (fieldConfig?.validator) {
      const error = fieldConfig.validator(value);
      if (error) {
        throw new Error(error);
      }
    }

    setSavingStates(prev => ({ ...prev, [key]: true }));

    try {
      await onUpdate(id, field, value);
      
      // Clear editing state on successful save
      setEditingStates(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });

      if (optimisticUpdates) {
        toastService.success('Updated successfully');
      }
    } catch (error: any) {
      console.error('Inline edit save failed:', error);
      throw error; // Re-throw so the EditableCell can handle it
    } finally {
      setSavingStates(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
    }
  }, [getStateKey, fields, onUpdate, optimisticUpdates]);

  const canEdit = useCallback((field: string) => {
    const fieldConfig = fields.find(f => f.key === field);
    if (!fieldConfig) return false;
    
    // Add permission check here if needed
    // For now, just check if field is configured
    return true;
  }, [fields]);

  const getFieldConfig = useCallback((field: string) => {
    return fields.find(f => f.key === field);
  }, [fields]);

  return {
    isEditing,
    isSaving,
    startEdit,
    cancelEdit,
    saveEdit,
    canEdit,
    getFieldConfig,
  };
};