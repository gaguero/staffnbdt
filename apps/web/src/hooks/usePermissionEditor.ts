import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { 
  PermissionEditorState, 
  RoleConfiguration, 
  ValidationError, 
  EditorAction, 
  EditorState, 
  PermissionCard,
  DragDropState,
  PermissionConflict,
  CoverageAnalysis,
  PreviewResult,
  DEFAULT_ROLE_CONFIGURATION,
  EDITOR_VALIDATION_RULES,
  RoleLevel
} from '../types/permissionEditor';
import { Permission } from '../types/permission';
import { Role } from '../../../packages/types/enums';
import { useDebounce } from './useDebounce';

interface UsePermissionEditorOptions {
  mode: 'create' | 'edit' | 'view' | 'clone';
  roleId?: string;
  templateId?: string;
  initialRole?: RoleConfiguration;
  autoSave?: boolean;
  autoSaveInterval?: number;
  maxUndoSteps?: number;
  validateOnChange?: boolean;
}

export function usePermissionEditor(options: UsePermissionEditorOptions) {
  const {
    mode,
    roleId,
    templateId,
    initialRole,
    autoSave = false,
    autoSaveInterval = 30000,
    maxUndoSteps = 50,
    validateOnChange = true
  } = options;

  // Core state
  const [state, setState] = useState<PermissionEditorState>({
    mode,
    role: initialRole || DEFAULT_ROLE_CONFIGURATION,
    selectedPermissions: new Set(initialRole?.permissions || []),
    availablePermissions: [],
    validationErrors: [],
    isDirty: false,
    isLoading: false,
    isSaving: false,
    searchQuery: '',
    activeCategory: null,
    draggedPermission: null,
    dropZoneActive: false,
    lastAction: null,
    undoStack: [],
    redoStack: []
  });

  // Refs for performance optimization
  const validationTimeoutRef = useRef<NodeJS.Timeout>();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const dragStateRef = useRef<DragDropState>({
    isDragging: false,
    draggedItem: null,
    dropTarget: null,
    dropZones: [],
    validDropTargets: [],
    dragPreview: null
  });

  // Debounced search query
  const debouncedSearchQuery = useDebounce(state.searchQuery, 300);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setState(prev => ({ ...prev, isLoading: true }));
      
      try {
        // Load available permissions
        const permissions = await fetchAvailablePermissions();
        
        // Load role data if editing existing role
        let roleData = initialRole;
        if (mode === 'edit' && roleId && !initialRole) {
          roleData = await fetchRole(roleId);
        } else if (mode === 'clone' && roleId) {
          const originalRole = await fetchRole(roleId);
          roleData = {
            ...originalRole,
            id: undefined,
            name: `${originalRole.name} (Copy)`,
            isCustomRole: true,
            createdAt: undefined,
            updatedAt: undefined,
            version: 1
          };
        } else if (templateId) {
          const template = await fetchRoleTemplate(templateId);
          roleData = createRoleFromTemplate(template);
        }

        setState(prev => ({
          ...prev,
          availablePermissions: permissions,
          role: roleData || DEFAULT_ROLE_CONFIGURATION,
          selectedPermissions: new Set(roleData?.permissions || []),
          isLoading: false
        }));

        // Initial validation
        if (validateOnChange && roleData) {
          validateRole(roleData, permissions);
        }
      } catch (error) {
        console.error('Failed to load initial data:', error);
        setState(prev => ({ 
          ...prev, 
          isLoading: false,
          validationErrors: [{
            type: 'error',
            code: 'load-failed',
            message: 'Failed to load role data. Please try again.'
          }]
        }));
      }
    };

    loadInitialData();
  }, [mode, roleId, templateId, initialRole, validateOnChange]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && state.isDirty && !state.isLoading && !state.isSaving) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveRoleDraft();
      }, autoSaveInterval);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [state.isDirty, state.isLoading, state.isSaving, autoSave, autoSaveInterval]);

  // Validation with debouncing
  useEffect(() => {
    if (validateOnChange && state.isDirty) {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }

      validationTimeoutRef.current = setTimeout(() => {
        validateRole(state.role, state.availablePermissions);
      }, 500);
    }

    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [state.role, state.selectedPermissions, validateOnChange, state.isDirty]);

  // Computed values
  const workspace = useMemo(() => {
    const selectedPermissionData = state.availablePermissions.filter(p => 
      state.selectedPermissions.has(p.id)
    );

    const permissionCards: PermissionCard[] = selectedPermissionData.map(permission => ({
      permission,
      isSelected: true,
      isDragging: false,
      isDroppable: true,
      conflicts: findConflicts(permission, selectedPermissionData),
      dependencies: findDependencies(permission, selectedPermissionData),
      conditions: state.role.conditions.filter(c => c.permissions.includes(permission.id))
    }));

    const groupedByCategory = groupPermissionsByCategory(permissionCards);
    const conflicts = findAllConflicts(selectedPermissionData);
    const coverage = analyzeCoverage(selectedPermissionData, state.availablePermissions);

    return {
      selectedPermissions: permissionCards,
      groupedByCategory,
      searchResults: filterPermissionsBySearch(permissionCards, debouncedSearchQuery),
      recentlyAdded: getRecentlyAddedPermissions(permissionCards, state.lastAction),
      conflicts,
      coverage
    };
  }, [state.selectedPermissions, state.availablePermissions, state.role.conditions, debouncedSearchQuery, state.lastAction]);

  const palette = useMemo(() => {
    const availableForSelection = state.availablePermissions.filter(p => 
      !state.selectedPermissions.has(p.id)
    );

    return {
      categories: groupAvailablePermissions(availableForSelection, state.activeCategory),
      searchResults: filterPermissionsBySearch(
        availableForSelection.map(p => ({ permission: p } as PermissionCard)), 
        debouncedSearchQuery
      ),
      recentPermissions: getRecentPermissions(),
      popularPermissions: getPopularPermissions(),
      recommendations: getRecommendedPermissions(state.role, state.selectedPermissions)
    };
  }, [state.availablePermissions, state.selectedPermissions, state.activeCategory, debouncedSearchQuery, state.role]);

  const canUndo = state.undoStack.length > 0;
  const canRedo = state.redoStack.length > 0;
  const hasValidationErrors = state.validationErrors.some(e => e.type === 'error');
  const canSave = !hasValidationErrors && state.isDirty && !state.isSaving;

  // Action creators
  const createSnapshot = useCallback((): EditorState => ({
    selectedPermissions: new Set(state.selectedPermissions),
    role: { ...state.role },
    timestamp: new Date()
  }), [state.selectedPermissions, state.role]);

  const pushToUndoStack = useCallback((action: EditorAction) => {
    const snapshot = createSnapshot();
    
    setState(prev => ({
      ...prev,
      undoStack: [...prev.undoStack.slice(-maxUndoSteps + 1), snapshot],
      redoStack: [], // Clear redo stack on new action
      lastAction: action,
      isDirty: true
    }));
  }, [createSnapshot, maxUndoSteps]);

  const addPermission = useCallback((permission: Permission) => {
    if (state.selectedPermissions.has(permission.id)) {
      return; // Already selected
    }

    const newSelectedPermissions = new Set(state.selectedPermissions);
    newSelectedPermissions.add(permission.id);

    const action: EditorAction = {
      type: 'add-permission',
      timestamp: new Date(),
      data: { permissionId: permission.id },
      undoData: { permissionId: permission.id }
    };

    pushToUndoStack(action);

    setState(prev => ({
      ...prev,
      selectedPermissions: newSelectedPermissions,
      role: {
        ...prev.role,
        permissions: Array.from(newSelectedPermissions)
      }
    }));
  }, [state.selectedPermissions, pushToUndoStack]);

  const removePermission = useCallback((permissionId: string) => {
    if (!state.selectedPermissions.has(permissionId)) {
      return; // Not selected
    }

    const newSelectedPermissions = new Set(state.selectedPermissions);
    newSelectedPermissions.delete(permissionId);

    const action: EditorAction = {
      type: 'remove-permission',
      timestamp: new Date(),
      data: { permissionId },
      undoData: { permissionId }
    };

    pushToUndoStack(action);

    setState(prev => ({
      ...prev,
      selectedPermissions: newSelectedPermissions,
      role: {
        ...prev.role,
        permissions: Array.from(newSelectedPermissions),
        conditions: prev.role.conditions.map(condition => ({
          ...condition,
          permissions: condition.permissions.filter(id => id !== permissionId)
        }))
      }
    }));
  }, [state.selectedPermissions, pushToUndoStack]);

  const updateRoleMetadata = useCallback((updates: Partial<RoleConfiguration>) => {
    const action: EditorAction = {
      type: 'update-metadata',
      timestamp: new Date(),
      data: updates,
      undoData: {
        name: state.role.name,
        description: state.role.description,
        level: state.role.level,
        metadata: state.role.metadata
      }
    };

    pushToUndoStack(action);

    setState(prev => ({
      ...prev,
      role: { ...prev.role, ...updates }
    }));
  }, [state.role, pushToUndoStack]);

  const addBulkPermissions = useCallback((permissions: Permission[]) => {
    const newPermissionIds = permissions
      .map(p => p.id)
      .filter(id => !state.selectedPermissions.has(id));

    if (newPermissionIds.length === 0) return;

    const newSelectedPermissions = new Set([
      ...state.selectedPermissions,
      ...newPermissionIds
    ]);

    const action: EditorAction = {
      type: 'add-permission',
      timestamp: new Date(),
      data: { permissionIds: newPermissionIds },
      undoData: { permissionIds: newPermissionIds }
    };

    pushToUndoStack(action);

    setState(prev => ({
      ...prev,
      selectedPermissions: newSelectedPermissions,
      role: {
        ...prev.role,
        permissions: Array.from(newSelectedPermissions)
      }
    }));
  }, [state.selectedPermissions, pushToUndoStack]);

  const clearAllPermissions = useCallback(() => {
    if (state.selectedPermissions.size === 0) return;

    const action: EditorAction = {
      type: 'remove-permission',
      timestamp: new Date(),
      data: { cleared: true },
      undoData: { 
        permissionIds: Array.from(state.selectedPermissions),
        conditions: state.role.conditions
      }
    };

    pushToUndoStack(action);

    setState(prev => ({
      ...prev,
      selectedPermissions: new Set(),
      role: {
        ...prev.role,
        permissions: [],
        conditions: []
      }
    }));
  }, [state.selectedPermissions, state.role.conditions, pushToUndoStack]);

  const undo = useCallback(() => {
    const lastSnapshot = state.undoStack[state.undoStack.length - 1];
    if (!lastSnapshot) return;

    const currentSnapshot = createSnapshot();
    
    setState(prev => ({
      ...prev,
      selectedPermissions: lastSnapshot.selectedPermissions,
      role: lastSnapshot.role,
      undoStack: prev.undoStack.slice(0, -1),
      redoStack: [...prev.redoStack, currentSnapshot],
      isDirty: prev.undoStack.length > 1
    }));
  }, [state.undoStack, createSnapshot]);

  const redo = useCallback(() => {
    const nextSnapshot = state.redoStack[state.redoStack.length - 1];
    if (!nextSnapshot) return;

    const currentSnapshot = createSnapshot();

    setState(prev => ({
      ...prev,
      selectedPermissions: nextSnapshot.selectedPermissions,
      role: nextSnapshot.role,
      undoStack: [...prev.undoStack, currentSnapshot],
      redoStack: prev.redoStack.slice(0, -1),
      isDirty: true
    }));
  }, [state.redoStack, createSnapshot]);

  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const setActiveCategory = useCallback((category: string | null) => {
    setState(prev => ({ ...prev, activeCategory: category }));
  }, []);

  const validateRole = useCallback((role: RoleConfiguration, permissions: Permission[]) => {
    const selectedPermissionData = permissions.filter(p => role.permissions.includes(p.id));
    const errors: ValidationError[] = [];

    // Run all validation rules
    EDITOR_VALIDATION_RULES.forEach(rule => {
      const result = rule.check(selectedPermissionData, role);
      errors.push(...result.errors);
    });

    setState(prev => ({ ...prev, validationErrors: errors }));
    return errors;
  }, []);

  const saveRole = useCallback(async (): Promise<boolean> => {
    if (!canSave) return false;

    setState(prev => ({ ...prev, isSaving: true }));

    try {
      const finalValidation = validateRole(state.role, state.availablePermissions);
      const hasErrors = finalValidation.some(e => e.type === 'error');
      
      if (hasErrors) {
        setState(prev => ({ ...prev, isSaving: false }));
        return false;
      }

      // Prepare role for saving
      const roleToSave: RoleConfiguration = {
        ...state.role,
        permissions: Array.from(state.selectedPermissions),
        updatedAt: new Date(),
        version: state.role.version + 1
      };

      // Call API to save role
      await saveRoleToAPI(roleToSave);

      setState(prev => ({
        ...prev,
        role: roleToSave,
        isDirty: false,
        isSaving: false,
        undoStack: [],
        redoStack: []
      }));

      return true;
    } catch (error) {
      console.error('Failed to save role:', error);
      setState(prev => ({
        ...prev,
        isSaving: false,
        validationErrors: [
          ...prev.validationErrors,
          {
            type: 'error',
            code: 'save-failed',
            message: 'Failed to save role. Please try again.'
          }
        ]
      }));
      return false;
    }
  }, [canSave, state.role, state.availablePermissions, state.selectedPermissions, validateRole]);

  const saveRoleDraft = useCallback(async () => {
    try {
      const draftData = {
        role: state.role,
        selectedPermissions: Array.from(state.selectedPermissions),
        timestamp: new Date()
      };
      
      await saveDraftToLocalStorage(roleId || 'new', draftData);
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [state.role, state.selectedPermissions, roleId]);

  const previewRole = useCallback((): PreviewResult => {
    const testCases = generateTestCases(state.role, state.availablePermissions);
    const scenarios = generateTestScenarios(state.role);
    const recommendations = generateRecommendations(state.role, workspace.coverage);
    const warnings = generateWarnings(state.validationErrors);

    return {
      role: state.role,
      testCases,
      scenarios,
      recommendations,
      warnings
    };
  }, [state.role, state.availablePermissions, state.validationErrors, workspace.coverage]);

  const exportRole = useCallback((format: 'json' | 'yaml' | 'csv' = 'json') => {
    const exportData = {
      role: state.role,
      permissions: state.availablePermissions.filter(p => 
        state.selectedPermissions.has(p.id)
      ),
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: 'permission-editor',
        version: '1.0'
      }
    };

    return exportRoleData(exportData, format);
  }, [state.role, state.availablePermissions, state.selectedPermissions]);

  // Drag and drop handlers
  const handleDragStart = useCallback((permission: Permission, event: React.DragEvent) => {
    dragStateRef.current = {
      ...dragStateRef.current,
      isDragging: true,
      draggedItem: permission
    };

    setState(prev => ({ ...prev, draggedPermission: permission }));
    
    // Set drag data
    event.dataTransfer.setData('application/json', JSON.stringify({
      type: 'permission',
      permission
    }));
    event.dataTransfer.effectAllowed = 'copy';
  }, []);

  const handleDragEnd = useCallback(() => {
    dragStateRef.current = {
      ...dragStateRef.current,
      isDragging: false,
      draggedItem: null,
      dropTarget: null
    };

    setState(prev => ({ 
      ...prev, 
      draggedPermission: null, 
      dropZoneActive: false 
    }));
  }, []);

  const handleDrop = useCallback((event: React.DragEvent, dropZone: string) => {
    event.preventDefault();
    
    try {
      const dragData = JSON.parse(event.dataTransfer.getData('application/json'));
      
      if (dragData.type === 'permission' && dragData.permission) {
        if (dropZone === 'workspace') {
          addPermission(dragData.permission);
        } else if (dropZone === 'trash') {
          removePermission(dragData.permission.id);
        }
      }
    } catch (error) {
      console.error('Invalid drag data:', error);
    }

    handleDragEnd();
  }, [addPermission, removePermission, handleDragEnd]);

  return {
    // State
    state,
    workspace,
    palette,
    dragState: dragStateRef.current,
    
    // Computed
    canUndo,
    canRedo,
    canSave,
    hasValidationErrors,
    
    // Actions
    addPermission,
    removePermission,
    addBulkPermissions,
    clearAllPermissions,
    updateRoleMetadata,
    
    // History
    undo,
    redo,
    
    // Search & Filter
    setSearchQuery,
    setActiveCategory,
    
    // Validation
    validateRole,
    
    // Persistence
    saveRole,
    saveRoleDraft,
    
    // Preview & Export
    previewRole,
    exportRole,
    
    // Drag & Drop
    handleDragStart,
    handleDragEnd,
    handleDrop
  };
}

// Helper functions
async function fetchAvailablePermissions(): Promise<Permission[]> {
  // Mock implementation - replace with actual API call
  return [];
}

async function fetchRole(roleId: string): Promise<RoleConfiguration> {
  // Mock implementation - replace with actual API call
  throw new Error('Not implemented');
}

async function fetchRoleTemplate(templateId: string): Promise<any> {
  // Mock implementation - replace with actual API call
  throw new Error('Not implemented');
}

function createRoleFromTemplate(template: any): RoleConfiguration {
  return {
    ...DEFAULT_ROLE_CONFIGURATION,
    name: template.name,
    description: template.description,
    permissions: template.permissions,
    level: template.roleLevel
  };
}

async function saveRoleToAPI(role: RoleConfiguration): Promise<void> {
  // Mock implementation - replace with actual API call
  console.log('Saving role:', role);
}

async function saveDraftToLocalStorage(key: string, data: any): Promise<void> {
  localStorage.setItem(`role-draft-${key}`, JSON.stringify(data));
}

function findConflicts(permission: Permission, allPermissions: Permission[]): string[] {
  // Mock implementation - replace with actual conflict detection logic
  return [];
}

function findDependencies(permission: Permission, allPermissions: Permission[]): string[] {
  // Mock implementation - replace with actual dependency detection logic
  return [];
}

function findAllConflicts(permissions: Permission[]): PermissionConflict[] {
  // Mock implementation - replace with actual conflict detection logic
  return [];
}

function analyzeCoverage(selected: Permission[], available: Permission[]): CoverageAnalysis {
  return {
    totalPermissions: available.length,
    selectedPermissions: selected.length,
    coveragePercentage: (selected.length / available.length) * 100,
    missingCriticalPermissions: [],
    redundantPermissions: [],
    resourceCoverage: {},
    actionCoverage: {},
    scopeCoverage: {}
  };
}

function groupPermissionsByCategory(permissions: PermissionCard[]): Record<string, PermissionCard[]> {
  return permissions.reduce((groups, permissionCard) => {
    const category = permissionCard.permission.resource || 'other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(permissionCard);
    return groups;
  }, {} as Record<string, PermissionCard[]>);
}

function groupAvailablePermissions(permissions: Permission[], activeCategory: string | null): any {
  // Mock implementation - replace with actual grouping logic
  return {};
}

function filterPermissionsBySearch(permissions: PermissionCard[], query: string): PermissionCard[] {
  if (!query.trim()) return permissions;
  
  const lowerQuery = query.toLowerCase();
  return permissions.filter(({ permission }) => 
    permission.name?.toLowerCase().includes(lowerQuery) ||
    permission.description?.toLowerCase().includes(lowerQuery) ||
    permission.resource?.toLowerCase().includes(lowerQuery) ||
    permission.action?.toLowerCase().includes(lowerQuery)
  );
}

function getRecentlyAddedPermissions(permissions: PermissionCard[], lastAction: EditorAction | null): PermissionCard[] {
  // Mock implementation - return recently added based on last action
  return permissions.slice(-5);
}

function getRecentPermissions(): Permission[] {
  // Mock implementation - replace with actual recent permissions logic
  return [];
}

function getPopularPermissions(): Permission[] {
  // Mock implementation - replace with actual popular permissions logic
  return [];
}

function getRecommendedPermissions(role: RoleConfiguration, selected: Set<string>): Permission[] {
  // Mock implementation - replace with actual recommendation logic
  return [];
}

function generateTestCases(role: RoleConfiguration, permissions: Permission[]): any[] {
  // Mock implementation - replace with actual test case generation
  return [];
}

function generateTestScenarios(role: RoleConfiguration): any[] {
  // Mock implementation - replace with actual test scenario generation
  return [];
}

function generateRecommendations(role: RoleConfiguration, coverage: CoverageAnalysis): string[] {
  // Mock implementation - replace with actual recommendation generation
  return [];
}

function generateWarnings(errors: ValidationError[]): string[] {
  return errors
    .filter(e => e.type === 'warning')
    .map(e => e.message);
}

function exportRoleData(data: any, format: string): string {
  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  }
  // Add other format implementations
  return JSON.stringify(data);
}