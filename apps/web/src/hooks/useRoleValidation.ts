import { useCallback, useMemo } from 'react';
import { 
  ValidationError, 
  ValidationRule, 
  ValidationResult, 
  ValidationSuggestion,
  RoleConfiguration,
  PermissionConflict,
  RoleLevel
} from '../types/permissionEditor';
import { Permission } from '../types/permission';
import { Role } from '../../../packages/types/enums';

interface UseRoleValidationOptions {
  enableRealTimeValidation?: boolean;
  strictMode?: boolean;
  customRules?: ValidationRule[];
  context?: 'creation' | 'editing' | 'assignment';
}

export function useRoleValidation(options: UseRoleValidationOptions = {}) {
  const {
    enableRealTimeValidation = true,
    strictMode = false,
    customRules = [],
    context = 'creation'
  } = options;

  // Core validation rules
  const coreValidationRules: ValidationRule[] = useMemo(() => [
    // Required fields validation
    {
      name: 'required-fields',
      severity: 'error',
      check: (permissions: Permission[], role: RoleConfiguration): ValidationResult => {
        const errors: ValidationError[] = [];
        
        if (!role.name?.trim()) {
          errors.push({
            type: 'error',
            field: 'name',
            code: 'required',
            message: 'Role name is required',
            suggestions: ['Enter a descriptive name for this role']
          });
        }

        if (!role.description?.trim()) {
          errors.push({
            type: 'error',
            field: 'description',
            code: 'required',
            message: 'Role description is required',
            suggestions: ['Provide a clear description of what this role can do']
          });
        }

        if (role.name && role.name.length < 3) {
          errors.push({
            type: 'error',
            field: 'name',
            code: 'min-length',
            message: 'Role name must be at least 3 characters long'
          });
        }

        if (role.name && role.name.length > 50) {
          errors.push({
            type: 'error',
            field: 'name',
            code: 'max-length',
            message: 'Role name cannot exceed 50 characters'
          });
        }

        return {
          isValid: errors.length === 0,
          errors,
          suggestions: []
        };
      }
    },

    // Permission consistency validation
    {
      name: 'permission-consistency',
      severity: 'warning',
      check: (permissions: Permission[], role: RoleConfiguration): ValidationResult => {
        const errors: ValidationError[] = [];
        const suggestions: ValidationSuggestion[] = [];

        if (permissions.length === 0) {
          errors.push({
            type: 'warning',
            code: 'no-permissions',
            message: 'This role has no permissions assigned',
            suggestions: ['Add at least one permission to make this role functional']
          });
        }

        // Check for overly broad permissions
        const dangerousPermissions = permissions.filter(p => 
          p.action === 'delete' && p.scope === 'platform'
        );

        if (dangerousPermissions.length > 0) {
          errors.push({
            type: 'warning',
            code: 'dangerous-permissions',
            message: 'This role contains platform-wide delete permissions',
            suggestions: ['Consider using more restrictive scopes for delete operations'],
            permissionIds: dangerousPermissions.map(p => p.id)
          });
        }

        // Check for permission imbalance
        const readPermissions = permissions.filter(p => p.action === 'read');
        const writePermissions = permissions.filter(p => p.action === 'create' || p.action === 'update');
        
        if (writePermissions.length > 0 && readPermissions.length === 0) {
          suggestions.push({
            type: 'add-permission',
            message: 'Consider adding read permissions to complement write access',
            action: () => {} // Implementation would add suggested read permissions
          });
        }

        return {
          isValid: errors.length === 0,
          errors,
          suggestions
        };
      }
    },

    // Role hierarchy validation
    {
      name: 'role-hierarchy',
      severity: 'error',
      check: (permissions: Permission[], role: RoleConfiguration): ValidationResult => {
        const errors: ValidationError[] = [];

        // Check scope consistency with role level
        const invalidScopePermissions = permissions.filter(permission => {
          switch (role.level) {
            case RoleLevel.DEPARTMENT:
              return ['platform', 'organization', 'property'].includes(permission.scope);
            case RoleLevel.PROPERTY:
              return ['platform', 'organization'].includes(permission.scope);
            case RoleLevel.ORGANIZATION:
              return permission.scope === 'platform';
            case RoleLevel.INDIVIDUAL:
              return permission.scope !== 'own';
            default:
              return false;
          }
        });

        if (invalidScopePermissions.length > 0) {
          errors.push({
            type: 'error',
            code: 'scope-hierarchy-violation',
            message: `Role level "${role.level}" cannot have permissions with broader scopes`,
            suggestions: [
              'Adjust the role level to match the permission scopes',
              'Remove permissions that exceed the role\'s scope'
            ],
            permissionIds: invalidScopePermissions.map(p => p.id)
          });
        }

        return {
          isValid: errors.length === 0,
          errors,
          suggestions: []
        };
      }
    },

    // Permission conflicts validation
    {
      name: 'permission-conflicts',
      severity: 'error',
      check: (permissions: Permission[], role: RoleConfiguration): ValidationResult => {
        const errors: ValidationError[] = [];
        const suggestions: ValidationSuggestion[] = [];

        // Define conflicting permission patterns
        const conflictRules = [
          {
            pattern1: { resource: 'user', action: 'create' },
            pattern2: { resource: 'user', action: 'delete' },
            message: 'Having both user creation and deletion permissions may pose security risks',
            severity: 'warning' as const
          },
          {
            pattern1: { resource: 'role', action: 'manage', scope: 'platform' },
            pattern2: { resource: 'user', action: 'assign', scope: 'platform' },
            message: 'Platform role management with user assignment creates super-admin privileges',
            severity: 'warning' as const
          }
        ];

        conflictRules.forEach(rule => {
          const hasPattern1 = permissions.some(p => 
            matchesPattern(p, rule.pattern1)
          );
          const hasPattern2 = permissions.some(p => 
            matchesPattern(p, rule.pattern2)
          );

          if (hasPattern1 && hasPattern2) {
            errors.push({
              type: rule.severity,
              code: 'permission-conflict',
              message: rule.message,
              suggestions: ['Review these permissions and consider if both are necessary']
            });
          }
        });

        // Check for duplicate permissions
        const permissionSignatures = permissions.map(p => `${p.resource}.${p.action}.${p.scope}`);
        const duplicates = permissionSignatures.filter((sig, index) => 
          permissionSignatures.indexOf(sig) !== index
        );

        if (duplicates.length > 0) {
          errors.push({
            type: 'warning',
            code: 'duplicate-permissions',
            message: 'This role contains duplicate permissions',
            suggestions: ['Remove duplicate permissions to clean up the role']
          });
        }

        return {
          isValid: errors.filter(e => e.type === 'error').length === 0,
          errors,
          suggestions
        };
      }
    },

    // Resource coverage validation
    {
      name: 'resource-coverage',
      severity: 'info',
      check: (permissions: Permission[], role: RoleConfiguration): ValidationResult => {
        const errors: ValidationError[] = [];
        const suggestions: ValidationSuggestion[] = [];

        // Analyze resource coverage
        const resourceGroups = groupPermissionsByResource(permissions);
        const incompleteResources = Object.entries(resourceGroups).filter(
          ([resource, perms]) => {
            const actions = perms.map(p => p.action);
            // Check if resource has read but no write permissions (might be intentional)
            return actions.includes('read') && 
                   !actions.some(a => ['create', 'update', 'delete'].includes(a)) &&
                   perms.length === 1;
          }
        );

        if (incompleteResources.length > 0) {
          incompleteResources.forEach(([resource, perms]) => {
            suggestions.push({
              type: 'add-permission',
              message: `Consider adding write permissions for ${resource} resource`,
              action: () => {} // Implementation would suggest relevant write permissions
            });
          });
        }

        // Check for common missing permissions based on role type
        const missingCommonPermissions = findMissingCommonPermissions(permissions, role);
        if (missingCommonPermissions.length > 0) {
          errors.push({
            type: 'info',
            code: 'missing-common-permissions',
            message: 'Some commonly used permissions are missing from this role',
            suggestions: missingCommonPermissions.map(p => `Add ${p} permission`)
          });
        }

        return {
          isValid: true, // Info level doesn't affect validity
          errors,
          suggestions
        };
      }
    },

    // Security validation
    {
      name: 'security-analysis',
      severity: 'warning',
      check: (permissions: Permission[], role: RoleConfiguration): ValidationResult => {
        const errors: ValidationError[] = [];

        // Check for potential privilege escalation paths
        const hasUserManagement = permissions.some(p => 
          p.resource === 'user' && ['create', 'update', 'delete'].includes(p.action)
        );
        const hasRoleManagement = permissions.some(p => 
          p.resource === 'role' && ['create', 'update', 'assign'].includes(p.action)
        );

        if (hasUserManagement && hasRoleManagement) {
          errors.push({
            type: 'warning',
            code: 'privilege-escalation-risk',
            message: 'This role can manage both users and roles, creating potential for privilege escalation',
            suggestions: [
              'Consider separating user and role management into different roles',
              'Add additional approval workflows for role assignments'
            ]
          });
        }

        // Check for excessive permissions for role level
        const platformPermissions = permissions.filter(p => p.scope === 'platform');
        if (role.level !== RoleLevel.PLATFORM && platformPermissions.length > 5) {
          errors.push({
            type: 'warning',
            code: 'excessive-platform-access',
            message: 'This role has extensive platform-level permissions',
            suggestions: ['Consider if all these platform permissions are necessary'],
            permissionIds: platformPermissions.map(p => p.id)
          });
        }

        return {
          isValid: errors.filter(e => e.type === 'error').length === 0,
          errors,
          suggestions: []
        };
      }
    }
  ], []);

  // Combine core rules with custom rules
  const allValidationRules = useMemo(() => [
    ...coreValidationRules,
    ...customRules
  ], [coreValidationRules, customRules]);

  // Main validation function
  const validateRole = useCallback((
    permissions: Permission[], 
    role: RoleConfiguration,
    runAllRules: boolean = true
  ): ValidationResult => {
    const allErrors: ValidationError[] = [];
    const allSuggestions: ValidationSuggestion[] = [];

    const rulesToRun = runAllRules 
      ? allValidationRules 
      : allValidationRules.filter(rule => rule.severity === 'error');

    rulesToRun.forEach(rule => {
      try {
        const result = rule.check(permissions, role);
        allErrors.push(...result.errors);
        allSuggestions.push(...result.suggestions);
      } catch (error) {
        console.error(`Validation rule "${rule.name}" failed:`, error);
        allErrors.push({
          type: 'error',
          code: 'validation-rule-error',
          message: `Validation rule "${rule.name}" encountered an error`
        });
      }
    });

    return {
      isValid: allErrors.filter(e => e.type === 'error').length === 0,
      errors: allErrors,
      suggestions: allSuggestions
    };
  }, [allValidationRules]);

  // Quick validation for specific aspects
  const validatePermissionAddition = useCallback((
    newPermission: Permission,
    currentPermissions: Permission[],
    role: RoleConfiguration
  ): ValidationResult => {
    const testPermissions = [...currentPermissions, newPermission];
    return validateRole(testPermissions, role, false); // Only run error-level rules
  }, [validateRole]);

  // Check for conflicts between permissions
  const findPermissionConflicts = useCallback((permissions: Permission[]): PermissionConflict[] => {
    const conflicts: PermissionConflict[] = [];
    
    // Check for mutual exclusions
    const mutualExclusionRules = [
      {
        permissions: ['user.delete.platform', 'user.create.platform'],
        type: 'mutual-exclusion' as const,
        message: 'Platform-wide user creation and deletion should be carefully controlled'
      }
    ];

    mutualExclusionRules.forEach(rule => {
      const hasConflictingPermissions = rule.permissions.every(permPattern =>
        permissions.some(p => matchesPermissionPattern(p, permPattern))
      );

      if (hasConflictingPermissions) {
        conflicts.push({
          type: rule.type,
          severity: 'warning',
          permissions: rule.permissions,
          message: rule.message,
          resolution: 'Consider if both permissions are necessary',
          autoFixAvailable: false
        });
      }
    });

    return conflicts;
  }, []);

  // Generate suggestions based on role analysis
  const generateSuggestions = useCallback((
    permissions: Permission[],
    role: RoleConfiguration
  ): ValidationSuggestion[] => {
    const suggestions: ValidationSuggestion[] = [];

    // Suggest common permission groups
    if (permissions.length > 0) {
      const resources = [...new Set(permissions.map(p => p.resource))];
      
      resources.forEach(resource => {
        const resourcePermissions = permissions.filter(p => p.resource === resource);
        const actions = resourcePermissions.map(p => p.action);

        // If has read but no write, suggest write permissions
        if (actions.includes('read') && !actions.includes('update')) {
          suggestions.push({
            type: 'add-permission',
            message: `Add update permission for ${resource} to complement read access`,
            action: () => {} // Implementation would add the permission
          });
        }
      });
    }

    return suggestions;
  }, []);

  // Auto-fix certain validation issues
  const autoFixIssues = useCallback((
    permissions: Permission[],
    role: RoleConfiguration,
    errors: ValidationError[]
  ): { permissions: Permission[], role: RoleConfiguration } => {
    let fixedPermissions = [...permissions];
    let fixedRole = { ...role };

    errors.forEach(error => {
      switch (error.code) {
        case 'duplicate-permissions':
          // Remove duplicate permissions
          const uniquePermissions = fixedPermissions.filter(
            (permission, index, self) => 
              self.findIndex(p => 
                p.resource === permission.resource &&
                p.action === permission.action &&
                p.scope === permission.scope
              ) === index
          );
          fixedPermissions = uniquePermissions;
          break;

        case 'scope-hierarchy-violation':
          // Adjust role level to match permissions or remove conflicting permissions
          const maxScope = getMaxScopeFromPermissions(fixedPermissions);
          const appropriateLevel = getSuitableRoleLevelForScope(maxScope);
          if (appropriateLevel !== role.level) {
            fixedRole.level = appropriateLevel;
          }
          break;
      }
    });

    return { permissions: fixedPermissions, role: fixedRole };
  }, []);

  return {
    // Main validation function
    validateRole,
    
    // Specific validation checks
    validatePermissionAddition,
    findPermissionConflicts,
    generateSuggestions,
    
    // Auto-fix functionality
    autoFixIssues,
    
    // Validation rules
    allValidationRules,
    
    // Utilities
    isValidRole: (permissions: Permission[], role: RoleConfiguration) => 
      validateRole(permissions, role).isValid
  };
}

// Helper functions
function matchesPattern(permission: Permission, pattern: any): boolean {
  return Object.entries(pattern).every(([key, value]) => 
    permission[key as keyof Permission] === value
  );
}

function matchesPermissionPattern(permission: Permission, pattern: string): boolean {
  const [resource, action, scope] = pattern.split('.');
  return permission.resource === resource && 
         permission.action === action && 
         permission.scope === scope;
}

function groupPermissionsByResource(permissions: Permission[]): Record<string, Permission[]> {
  return permissions.reduce((groups, permission) => {
    const resource = permission.resource;
    if (!groups[resource]) {
      groups[resource] = [];
    }
    groups[resource].push(permission);
    return groups;
  }, {} as Record<string, Permission[]>);
}

function findMissingCommonPermissions(permissions: Permission[], role: RoleConfiguration): string[] {
  const commonPermissionSets = {
    [RoleLevel.DEPARTMENT]: [
      'schedule.read.department',
      'user.read.department',
      'document.read.department'
    ],
    [RoleLevel.PROPERTY]: [
      'analytics.read.property',
      'user.read.property',
      'department.read.property'
    ],
    [RoleLevel.ORGANIZATION]: [
      'property.read.organization',
      'analytics.read.organization',
      'user.read.organization'
    ]
  };

  const expectedPermissions = commonPermissionSets[role.level] || [];
  const existingPermissionStrings = permissions.map(p => `${p.resource}.${p.action}.${p.scope}`);
  
  return expectedPermissions.filter(expected => 
    !existingPermissionStrings.includes(expected)
  );
}

function getMaxScopeFromPermissions(permissions: Permission[]): string {
  const scopeHierarchy = ['own', 'department', 'property', 'organization', 'platform'];
  const scopes = permissions.map(p => p.scope);
  
  return scopeHierarchy.find(scope => scopes.includes(scope)) || 'own';
}

function getSuitableRoleLevelForScope(scope: string): RoleLevel {
  switch (scope) {
    case 'platform': return RoleLevel.PLATFORM;
    case 'organization': return RoleLevel.ORGANIZATION;
    case 'property': return RoleLevel.PROPERTY;
    case 'department': return RoleLevel.DEPARTMENT;
    default: return RoleLevel.INDIVIDUAL;
  }
}