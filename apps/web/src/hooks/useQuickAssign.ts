import { useState, useCallback, useRef } from 'react';
import { QuickAssignOption, QuickAssignConfig } from '../components/QuickAssign';
import { toastService } from '../utils/toast';

interface UseQuickAssignOptions {
  onAssignSuccess?: (itemId: string, field: string, value: any) => void;
  onAssignError?: (error: any) => void;
  debounceMs?: number;
}

interface UseQuickAssignReturn {
  // State
  isAssigning: boolean;
  assignmentQueue: Record<string, any>;
  
  // Actions
  performAssignment: (itemId: string, config: QuickAssignConfig, value: any) => Promise<void>;
  bulkAssign: (assignments: Array<{ itemId: string; field: string; value: any }>) => Promise<void>;
  retryFailedAssignments: () => Promise<void>;
  clearQueue: () => void;
  
  // Utilities
  createManagerOptions: (managers: any[]) => QuickAssignOption[];
  createDepartmentOptions: (departments: any[]) => QuickAssignOption[];
  createUserOptions: (users: any[]) => QuickAssignOption[];
  createStatusOptions: () => QuickAssignOption[];
}

export const useQuickAssign = (
  assignmentFunction: (itemId: string, field: string, value: any) => Promise<void>,
  options: UseQuickAssignOptions = {}
): UseQuickAssignReturn => {
  const {
    onAssignSuccess,
    onAssignError,
    debounceMs = 300,
  } = options;

  const [isAssigning, setIsAssigning] = useState(false);
  const [assignmentQueue, setAssignmentQueue] = useState<Record<string, any>>({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const failedAssignments = useRef<Array<{ itemId: string; field: string; value: any; error: any }>>([]);

  // Perform single assignment
  const performAssignment = useCallback(async (
    itemId: string, 
    config: QuickAssignConfig, 
    value: any
  ) => {
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Add to queue for immediate UI feedback
    setAssignmentQueue(prev => ({
      ...prev,
      [`${itemId}_${config.field}`]: { itemId, field: config.field, value, pending: true }
    }));

    // Debounce the actual assignment
    timeoutRef.current = setTimeout(async () => {
      setIsAssigning(true);
      
      try {
        await assignmentFunction(itemId, config.field, value);
        
        // Remove from queue on success
        setAssignmentQueue(prev => {
          const updated = { ...prev };
          delete updated[`${itemId}_${config.field}`];
          return updated;
        });
        
        onAssignSuccess?.(itemId, config.field, value);
        
      } catch (error: any) {
        console.error('Assignment failed:', error);
        
        // Track failed assignment
        failedAssignments.current.push({
          itemId,
          field: config.field,
          value,
          error,
        });
        
        // Update queue to show error state
        setAssignmentQueue(prev => ({
          ...prev,
          [`${itemId}_${config.field}`]: { 
            itemId, 
            field: config.field, 
            value, 
            error: true 
          }
        }));
        
        onAssignError?.(error);
      } finally {
        setIsAssigning(false);
      }
    }, debounceMs);
  }, [assignmentFunction, onAssignSuccess, onAssignError, debounceMs]);

  // Bulk assignment
  const bulkAssign = useCallback(async (
    assignments: Array<{ itemId: string; field: string; value: any }>
  ) => {
    setIsAssigning(true);
    const loadingToast = toastService.loading(`Processing ${assignments.length} assignments...`);
    
    try {
      const results = await Promise.allSettled(
        assignments.map(({ itemId, field, value }) => 
          assignmentFunction(itemId, field, value)
        )
      );
      
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.length - succeeded;
      
      toastService.dismiss(loadingToast);
      
      if (failed === 0) {
        toastService.success(`Successfully completed ${succeeded} assignments`);
      } else if (succeeded === 0) {
        toastService.error(`All ${failed} assignments failed`);
      } else {
        toastService.warning(`${succeeded} succeeded, ${failed} failed`);
      }
      
      // Track failed assignments
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          failedAssignments.current.push({
            ...assignments[index],
            error: result.reason,
          });
        }
      });
      
    } catch (error) {
      toastService.dismiss(loadingToast);
      toastService.error('Bulk assignment failed');
    } finally {
      setIsAssigning(false);
    }
  }, [assignmentFunction]);

  // Retry failed assignments
  const retryFailedAssignments = useCallback(async () => {
    const failed = [...failedAssignments.current];
    failedAssignments.current = [];
    
    if (failed.length === 0) {
      toastService.info('No failed assignments to retry');
      return;
    }
    
    await bulkAssign(failed);
  }, [bulkAssign]);

  // Clear assignment queue
  const clearQueue = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setAssignmentQueue({});
    failedAssignments.current = [];
  }, []);

  // Utility functions for creating options
  const createManagerOptions = useCallback((managers: any[]): QuickAssignOption[] => {
    return managers.map(manager => ({
      value: manager.id,
      label: `${manager.firstName} ${manager.lastName}`,
      description: manager.email || manager.department?.name,
      icon: '👨‍💼',
      disabled: !manager.isActive,
    }));
  }, []);

  const createDepartmentOptions = useCallback((departments: any[]): QuickAssignOption[] => {
    return departments.map(dept => ({
      value: dept.id,
      label: dept.name,
      description: `${dept._count?.users || 0} users`,
      icon: '🏢',
      disabled: !dept.isActive,
    }));
  }, []);

  const createUserOptions = useCallback((users: any[]): QuickAssignOption[] => {
    return users.map(user => ({
      value: user.id,
      label: `${user.firstName} ${user.lastName}`,
      description: `${user.email} • ${user.role}`,
      icon: '👤',
      disabled: !user.isActive,
    }));
  }, []);

  const createStatusOptions = useCallback((): QuickAssignOption[] => {
    return [
      {
        value: 'true',
        label: 'Active',
        description: 'Enable access and functionality',
        icon: '✅',
      },
      {
        value: 'false',
        label: 'Inactive',
        description: 'Disable access and functionality',
        icon: '❌',
      },
    ];
  }, []);

  return {
    isAssigning,
    assignmentQueue,
    performAssignment,
    bulkAssign,
    retryFailedAssignments,
    clearQueue,
    createManagerOptions,
    createDepartmentOptions,
    createUserOptions,
    createStatusOptions,
  };
};