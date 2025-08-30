// User Role Management Components
export { default as UserRoleSection } from './UserRoleSection';
export { default as UserRoleAssignment } from './UserRoleAssignment';
export { default as UserRoleHistory } from './UserRoleHistory';
export { default as UserPermissionPreview } from './UserPermissionPreview';
export { default as QuickRoleSelector } from './QuickRoleSelector';

// Re-export types
export type {
  UserRole,
  RoleAssignment,
  RoleHistory,
  EffectivePermissions,
} from '../../hooks/useUserRoleManagement';