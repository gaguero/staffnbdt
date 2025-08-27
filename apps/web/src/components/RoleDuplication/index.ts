export { default as RoleDuplicator } from './RoleDuplicator';
export { default as CloneOptionsDialog } from './CloneOptionsDialog';
export { default as BulkCloneDialog } from './BulkCloneDialog';
export { default as ClonePreview } from './ClonePreview';
export { default as RoleLineageTree } from './RoleLineageTree';
export { default as CloneTemplateGallery } from './CloneTemplateGallery';

// Hooks
export { useRoleDuplication } from '../../hooks/useRoleDuplication';
export { useRoleLineage } from '../../hooks/useRoleLineage';

// Types
export type {
  CloneConfiguration,
  CloneType,
  ClonePreview as ClonePreviewType,
  RoleLineage,
  CloneBatchConfig
} from '../../types/roleDuplication';
