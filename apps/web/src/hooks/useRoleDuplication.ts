import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Role } from '../services/roleService';
import {
  CloneConfiguration,
  ClonePreview,
  CloneValidationResult,
  SmartCloneRecommendation,
  UseRoleDuplicationReturn,
  CloneType,
  CloneBatchConfig,
  RoleDuplicationContext
} from '../types/roleDuplication';
import { usePermissions } from './usePermissions';
import { roleService } from '../services/roleService';
import { Permission } from '../types/permission';

/**
 * Advanced role duplication hook with smart suggestions and validation
 */
export const useRoleDuplication = (context?: RoleDuplicationContext): UseRoleDuplicationReturn => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  
  // State
  const [isCloning, setIsCloning] = useState(false);
  const [sourceRoleId, setSourceRoleId] = useState<string | null>(null);
  const [configuration, setConfiguration] = useState<CloneConfiguration | null>(null);
  const [clonePreview, setClonePreview] = useState<ClonePreview | null>(null);
  const [validationResult, setValidationResult] = useState<CloneValidationResult | null>(null);
  const [recommendations, setRecommendations] = useState<SmartCloneRecommendation[]>([]);
  const [batchConfig, setBatchConfig] = useState<CloneBatchConfig | null>(null);

  // Mutations
  const cloneRoleMutation = useMutation({
    mutationFn: async (config: CloneConfiguration) => {
      // Check if cloneRole method exists, otherwise create placeholder
      if ('cloneRole' in roleService) {
        return (roleService as any).cloneRole(config);
      }
      throw new Error('cloneRole method not implemented in roleService');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['roleStats'] });
    }
  });

  const batchCloneMutation = useMutation({
    mutationFn: async (config: CloneBatchConfig) => {
      // Check if batchCloneRoles method exists, otherwise create placeholder
      if ('batchCloneRoles' in roleService) {
        return (roleService as any).batchCloneRoles(config);
      }
      throw new Error('batchCloneRoles method not implemented in roleService');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['roleStats'] });
    }
  });

  // Initialize clone process
  const startClone = useCallback((roleId: string, initialConfig?: Partial<CloneConfiguration>) => {
    if (!hasPermission('role.create', '', '')) {
      throw new Error('Insufficient permissions to clone roles');
    }

    setIsCloning(true);
    setSourceRoleId(roleId);
    
    // Create default configuration
    const defaultConfig: CloneConfiguration = {
      sourceRoleId: roleId,
      cloneType: 'full',
      newMetadata: {
        name: '',
        description: '',
        level: 50, // Default level
      },
      permissionFilters: {
        includeCategories: [],
        excludeCategories: [],
        includeScopes: [],
        excludeScopes: [],
        customSelections: []
      },
      scopeAdjustments: {},
      preserveLineage: true,
      inheritanceRules: {
        copyUserAssignments: false,
        adjustLevel: true,
        autoSuggestLevel: true
      },
      ...initialConfig
    };
    
    setConfiguration(defaultConfig);
    
    // Generate initial recommendations
    generateSmartSuggestions(roleId, defaultConfig);
  }, [hasPermission]);

  // Update configuration
  const updateConfiguration = useCallback((updates: Partial<CloneConfiguration>) => {
    if (!configuration) return;
    
    const newConfig = {
      ...configuration,
      ...updates,
      newMetadata: {
        ...configuration.newMetadata,
        ...updates.newMetadata
      },
      permissionFilters: {
        ...configuration.permissionFilters,
        ...updates.permissionFilters
      }
    };
    
    setConfiguration(newConfig);
    
    // Re-generate recommendations based on new config
    if (sourceRoleId) {
      generateSmartSuggestions(sourceRoleId, newConfig);
    }
  }, [configuration, sourceRoleId]);

  // Generate preview
  const generatePreview = useCallback(async (): Promise<ClonePreview> => {
    if (!configuration || !sourceRoleId) {
      throw new Error('No configuration available for preview');
    }

    try {
      // Get source role details
      const sourceRoleResponse = await roleService.getRole(sourceRoleId);
      if (!sourceRoleResponse) {
        throw new Error('Source role not found');
      }

      const sourceRole = 'data' in sourceRoleResponse ? sourceRoleResponse.data : sourceRoleResponse;
      // Calculate resulting permissions based on filters
      const resultingPermissions = calculateResultingPermissions(sourceRole, configuration).map(p => ({ ...p, createdAt: new Date(), updatedAt: new Date() }));
      
      // Analyze changes
      const addedPermissions = resultingPermissions.filter(p => 
        !sourceRole.permissions?.some(sp => sp.id === p.id)
      );
      const removedPermissions = (sourceRole.permissions || []).map(p => ({ ...p, createdAt: new Date(), updatedAt: new Date() })).filter(sp => 
        !resultingPermissions.some(p => p.id === sp.id)
      );
      const modifiedPermissions = resultingPermissions.filter(p => {
        const sourcePermission = sourceRole.permissions?.find(sp => sp.id === p.id);
        if (!sourcePermission) return false;
        const enhancedSourcePerm = { ...sourcePermission, createdAt: new Date(), updatedAt: new Date() };
        return hasPermissionChanges(enhancedSourcePerm, p);
      });

      // Validation
      const validation = await validateConfiguration();
      
      // Estimate appropriate level
      const estimatedLevel = estimateRoleLevel(resultingPermissions, configuration.cloneType);
      
      // Conflict analysis
      const conflictAnalysis = await analyzeConflicts(configuration, context);
      
      const preview: ClonePreview = {
        sourceRole,
        targetConfiguration: configuration,
        resultingPermissions,
        addedPermissions,
        removedPermissions,
        modifiedPermissions,
        validationErrors: validation?.errors.filter(e => e.severity === 'error').map(e => e.message) || [],
        validationWarnings: validation?.errors.filter(e => e.severity === 'warning').map(e => e.message) || [],
        suggestedImprovements: validation?.suggestions.map(s => s.message) || [],
        estimatedLevel,
        conflictAnalysis
      };
      
      setClonePreview(preview);
      return preview;
    } catch (error) {
      console.error('Error generating clone preview:', error);
      throw error;
    }
  }, [configuration, sourceRoleId, context]);

  // Validate configuration
  const validateConfiguration = useCallback(async (): Promise<CloneValidationResult> => {
    if (!configuration) {
      throw new Error('No configuration to validate');
    }

    const errors: CloneValidationResult['errors'] = [];
    const suggestions: CloneValidationResult['suggestions'] = [];
    const conflicts: CloneValidationResult['conflicts'] = [];

    // Name validation
    if (!configuration.newMetadata.name.trim()) {
      errors.push({
        field: 'name',
        message: 'Role name is required',
        severity: 'error'
      });
    } else if (configuration.newMetadata.name.length < 3) {
      errors.push({
        field: 'name',
        message: 'Role name must be at least 3 characters',
        severity: 'error'
      });
    } else if (context?.existingNames.includes(configuration.newMetadata.name)) {
      conflicts.push({
        type: 'naming',
        message: `Role name "${configuration.newMetadata.name}" already exists`,
        resolution: 'Choose a different name or add a suffix'
      });
    }

    // Description validation
    if (!configuration.newMetadata.description.trim()) {
      suggestions.push({
        type: 'description',
        message: 'Consider adding a description to help identify this role\'s purpose',
        autoApplicable: false
      });
    }

    // Level validation
    if (context?.hierarchyConstraints) {
      const { minLevel, maxLevel } = context.hierarchyConstraints;
      if (configuration.newMetadata.level < minLevel) {
        errors.push({
          field: 'level',
          message: `Role level must be at least ${minLevel}`,
          severity: 'error'
        });
      }
      if (configuration.newMetadata.level > maxLevel) {
        errors.push({
          field: 'level',
          message: `Role level cannot exceed ${maxLevel}`,
          severity: 'error'
        });
      }
    }

    // Permission validation
    if (configuration.cloneType === 'partial' && 
        configuration.permissionFilters.customSelections.length === 0) {
      errors.push({
        field: 'permissions',
        message: 'Partial clone requires at least one permission to be selected',
        severity: 'error'
      });
    }

    const result: CloneValidationResult = {
      isValid: errors.filter(e => e.severity === 'error').length === 0 && conflicts.length === 0,
      errors,
      suggestions,
      conflicts
    };

    setValidationResult(result);
    return result;
  }, [configuration, context]);

  // Execute clone
  const executeClone = useCallback(async (): Promise<Role> => {
    if (!configuration) {
      throw new Error('No configuration available for cloning');
    }

    // Validate before execution
    const validation = await validateConfiguration();
    if (!validation.isValid) {
      throw new Error('Configuration validation failed');
    }

    try {
      const clonedRole = await cloneRoleMutation.mutateAsync(configuration);
      
      // Clean up state
      setIsCloning(false);
      setSourceRoleId(null);
      setConfiguration(null);
      setClonePreview(null);
      setValidationResult(null);
      setRecommendations([]);
      
      return clonedRole;
    } catch (error) {
      console.error('Error executing role clone:', error);
      throw error;
    }
  }, [configuration, validateConfiguration, cloneRoleMutation]);

  // Cancel clone
  const cancelClone = useCallback(() => {
    setIsCloning(false);
    setSourceRoleId(null);
    setConfiguration(null);
    setClonePreview(null);
    setValidationResult(null);
    setRecommendations([]);
    setBatchConfig(null);
  }, []);

  // Apply recommendation
  const applyRecommendation = useCallback((recommendation: SmartCloneRecommendation) => {
    if (!recommendation.isAutoApplicable || !configuration) return;

    const updates: Partial<CloneConfiguration> = {};
    
    switch (recommendation.recommendationType) {
      case 'level_adjustment':
        updates.newMetadata = {
          ...configuration.newMetadata,
          level: recommendation.suggestedValue
        };
        break;
      case 'name_suggestion':
        updates.newMetadata = {
          ...configuration.newMetadata,
          name: recommendation.suggestedValue
        };
        break;
      // Add more cases as needed
    }
    
    updateConfiguration(updates);
  }, [configuration, updateConfiguration]);

  // Get smart suggestions
  const getSmartSuggestions = useCallback((): SmartCloneRecommendation[] => {
    return recommendations;
  }, [recommendations]);

  // Batch clone operations
  const startBatchClone = useCallback((config: CloneBatchConfig) => {
    setBatchConfig(config);
  }, []);

  const executeBatchClone = useCallback(async (): Promise<Role[]> => {
    if (!batchConfig) {
      throw new Error('No batch configuration available');
    }

    try {
      const result = await batchCloneMutation.mutateAsync(batchConfig);
      setBatchConfig(null);
      return result;
    } catch (error) {
      console.error('Error executing batch clone:', error);
      throw error;
    }
  }, [batchConfig, batchCloneMutation]);

  // Helper functions
  const generateSmartSuggestions = useCallback(async (roleId: string, config: CloneConfiguration) => {
    try {
      const suggestions: SmartCloneRecommendation[] = [];
      
      // Get source role
      const sourceRoleResponse = await roleService.getRole(roleId);
      if (!sourceRoleResponse) return;
      const sourceRole = 'data' in sourceRoleResponse ? sourceRoleResponse.data : sourceRoleResponse;

      // Name suggestion based on clone type
      if (!config.newMetadata.name) {
        const nameSuggestion = generateNameSuggestion(sourceRole, config.cloneType);
        suggestions.push({
          recommendationType: 'name_suggestion',
          confidence: 0.8,
          explanation: `Suggested name based on ${config.cloneType} clone pattern`,
          suggestedValue: nameSuggestion,
          reasoning: 'Follows naming conventions for cloned roles',
          isAutoApplicable: true
        });
      }

      // Level adjustment suggestion
      const suggestedLevel = estimateRoleLevel((sourceRole.permissions || []).map(p => ({ ...p, createdAt: new Date(), updatedAt: new Date() })), config.cloneType);
      if (suggestedLevel !== config.newMetadata.level) {
        suggestions.push({
          recommendationType: 'level_adjustment',
          confidence: 0.9,
          explanation: `Suggested level ${suggestedLevel} based on permission analysis`,
          suggestedValue: suggestedLevel,
          reasoning: 'Level calculated based on permission scope and complexity',
          isAutoApplicable: true
        });
      }

      setRecommendations(suggestions);
    } catch (error) {
      console.error('Error generating smart suggestions:', error);
    }
  }, []);

  const calculateResultingPermissions = (sourceRole: Role, config: CloneConfiguration): any[] => {
    let permissions = [...sourceRole.permissions];
    
    // Apply filters based on clone type
    switch (config.cloneType) {
      case 'full':
        // Keep all permissions
        break;
      case 'permissions':
        // Keep permissions but reset metadata-dependent ones
        break;
      case 'template':
        // Apply template-specific filters
        permissions = applyTemplateFilters(permissions.map(p => ({ ...p, createdAt: new Date(), updatedAt: new Date() })), config);
        break;
      case 'partial':
        // Apply custom selections
        if (config.permissionFilters.customSelections.length > 0) {
          permissions = permissions.filter(p => 
            config.permissionFilters.customSelections.includes(p.id)
          );
        }
        break;
      case 'hierarchy':
        // Adjust permissions based on hierarchy level
        permissions = applyHierarchyFilters(permissions.map(p => ({ ...p, createdAt: new Date(), updatedAt: new Date() })), config);
        break;
    }
    
    // Apply category filters
    if (config.permissionFilters.excludeCategories.length > 0) {
      permissions = permissions.filter(p => 
        !config.permissionFilters.excludeCategories.includes(p.resource)
      );
    }
    
    if (config.permissionFilters.includeCategories.length > 0) {
      permissions = permissions.filter(p => 
        config.permissionFilters.includeCategories.includes(p.resource)
      );
    }
    
    // Apply scope adjustments
    permissions = permissions.map(p => {
      const newScope = config.scopeAdjustments[p.id];
      return newScope ? { 
        ...p, 
        scope: newScope,
        createdAt: (p as any).createdAt || new Date(),
        updatedAt: (p as any).updatedAt || new Date()
      } : {
        ...p,
        createdAt: (p as any).createdAt || new Date(),
        updatedAt: (p as any).updatedAt || new Date()
      };
    });
    
    return permissions as any[];
  };

  const hasPermissionChanges = (original: Permission, modified: Permission): boolean => {
    return original.scope !== modified.scope || 
           original.resource !== modified.resource ||
           original.action !== modified.action;
  };

  const estimateRoleLevel = (permissions: Permission[], cloneType: CloneType): number => {
    // Simple algorithm to estimate role level based on permission complexity
    const baseScore = permissions.length * 2;
    const scopeMultiplier = permissions.reduce((acc, p) => {
      switch (p.scope) {
        case 'platform': return acc + 10;
        case 'organization': return acc + 8;
        case 'property': return acc + 6;
        case 'department': return acc + 4;
        case 'own': return acc + 2;
        default: return acc + 3;
      }
    }, 0) / permissions.length;
    
    const cloneTypeMultiplier = cloneType === 'hierarchy' ? 0.9 : 1.0;
    
    return Math.min(Math.max(Math.round((baseScore + scopeMultiplier) * cloneTypeMultiplier), 10), 100);
  };

  const generateNameSuggestion = (sourceRole: Role, cloneType: CloneType): string => {
    const baseName = sourceRole.name;
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    
    switch (cloneType) {
      case 'template':
        return `${baseName} Template`;
      case 'hierarchy':
        return `${baseName} (Modified)`;
      case 'partial':
        return `${baseName} (Partial)`;
      default:
        return `${baseName} Copy ${timestamp}`;
    }
  };

  const applyTemplateFilters = (permissions: Permission[], _config: CloneConfiguration): Permission[] => {
    // Template-specific permission filtering logic
    return permissions;
  };

  const applyHierarchyFilters = (permissions: Permission[], config: CloneConfiguration): Permission[] => {
    // Hierarchy-specific permission filtering logic
    const targetLevel = config.newMetadata.level;
    
    return permissions.filter(p => {
      // Remove high-level permissions for lower-level roles
      if (targetLevel < 70 && p.scope === 'platform') return false;
      if (targetLevel < 50 && p.scope === 'organization') return false;
      
      return true;
    });
  };

  const analyzeConflicts = async (config: CloneConfiguration, _context?: RoleDuplicationContext) => {
    const conflicts = {
      namingConflicts: [] as string[],
      permissionConflicts: [] as string[],
      hierarchyConflicts: [] as string[]
    };

    // Check naming conflicts
    if (context?.existingNames.includes(config.newMetadata.name)) {
      conflicts.namingConflicts.push(`Role name "${config.newMetadata.name}" already exists`);
    }

    // Check hierarchy conflicts
    if (context?.hierarchyConstraints) {
      const { minLevel, maxLevel } = context.hierarchyConstraints;
      if (config.newMetadata.level < minLevel || config.newMetadata.level > maxLevel) {
        conflicts.hierarchyConflicts.push(`Level ${config.newMetadata.level} is outside allowed range ${minLevel}-${maxLevel}`);
      }
    }

    return conflicts;
  };

  return {
    // State
    isCloning,
    clonePreview,
    validationResult,
    recommendations,
    
    // Actions
    startClone,
    updateConfiguration,
    generatePreview,
    validateConfiguration,
    executeClone,
    cancelClone,
    
    // Recommendations
    applyRecommendation,
    getSmartSuggestions,
    
    // Batch operations
    startBatchClone,
    executeBatchClone
  };
};

export default useRoleDuplication;
