// Main Permission Editor component
export { default as PermissionEditor } from './PermissionEditor';

// Sub-components
export { default as RoleMetadataEditor } from './RoleMetadataEditor';
export { default as PermissionPalette } from './PermissionPalette';
export { default as PermissionWorkspace } from './PermissionWorkspace';
export { default as PermissionCard } from './PermissionCard';
export { default as ValidationPanel } from './ValidationPanel';
export { default as PreviewPanel } from './PreviewPanel';
export { default as SaveRoleDialog } from './SaveRoleDialog';
export { default as RoleTemplates } from './RoleTemplates';

// Hooks
export { usePermissionEditor } from '../../hooks/usePermissionEditor';
export { useDragAndDrop } from '../../hooks/useDragAndDrop';
export { useRoleValidation } from '../../hooks/useRoleValidation';

// Types and interfaces
export type {
  // Core types
  PermissionEditorProps,
  RoleConfiguration,
  ValidationError,
  ValidationRule,
  ValidationResult,
  ValidationSuggestion,
  PermissionCard as PermissionCardType,
  PermissionTemplate,
  
  // Component props
  RoleMetadataEditorProps,
  PermissionPaletteProps,
  PermissionWorkspaceProps,
  PermissionCardProps,
  ValidationPanelProps,
  PreviewPanelProps,
  SaveRoleDialogProps,
  
  // State types
  PermissionEditorState,
  DragDropState,
  EditorAction,
  EditorState,
  
  // Configuration types
  CategoryGroup,
  PermissionConflict,
  CoverageAnalysis,
  PreviewResult,
  TestCase,
  TestScenario
} from '../../types/permissionEditor';

// Enums
export {
  RoleLevel,
  EditorMode,
  PermissionCardSize,
  DragState
} from '../../types/permissionEditor';

// Constants and defaults
export {
  DEFAULT_ROLE_CONFIGURATION,
  EDITOR_VALIDATION_RULES,
  PERMISSION_CATEGORIES,
  ROLE_TEMPLATES,
  KEYBOARD_SHORTCUTS,
  DRAG_TYPES,
  DROP_ZONES
} from '../../types/permissionEditor';