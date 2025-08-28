import React, { useState, useEffect, useCallback } from 'react';
import {
  X as XMarkIcon,
  Undo as ArrowUturnLeftIcon,
  Redo as ArrowUturnRightIcon,
  Play as PlayIcon,
  Download as DocumentArrowDownIcon,
  ClipboardCheck as ClipboardDocumentCheckIcon,
  AlertTriangle as ExclamationTriangleIcon,
  Info as InformationCircleIcon,
  Settings as AdjustmentsHorizontalIcon,
  Search as MagnifyingGlassIcon,
  Filter as FunnelIcon
} from 'lucide-react';

import { 
  PermissionEditorProps
} from '../../types/permissionEditor';
import { Permission } from '../../types/permission';

import { usePermissionEditor } from '../../hooks/usePermissionEditor';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import { useRoleValidation } from '../../hooks/useRoleValidation';

import RoleMetadataEditor from './RoleMetadataEditor';
import PermissionPalette from './PermissionPalette';
import PermissionWorkspace from './PermissionWorkspace';
import ValidationPanel from './ValidationPanel';
import PreviewPanel from './PreviewPanel';
import SaveRoleDialog from './SaveRoleDialog';
import RoleTemplates from './RoleTemplates';

export const PermissionEditor: React.FC<PermissionEditorProps> = ({
  mode,
  roleId,
  templateId,
  onSave,
  onCancel,
  onPreview,
  className = '',
  maxHeight = 800,
  showAdvancedFeatures = true,
  allowTemplateCreation = true,
  context = 'role-management'
}) => {
  // Local state for UI controls
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showPreviewPanel, setShowPreviewPanel] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(mode === 'create' && !roleId);
  const [showValidationPanel] = useState(true);
  const [showPermissionDetails, setShowPermissionDetails] = useState(false);
  const [selectedPermissionForDetails, setSelectedPermissionForDetails] = useState<Permission | null>(null);
  const [activePanel, setActivePanel] = useState<'palette' | 'workspace' | 'both'>('both');

  // Initialize permission editor
  const {
    state,
    workspace,
    canUndo,
    canRedo,
    canSave,
    hasValidationErrors,
    addPermission,
    removePermission,
    addBulkPermissions,
    clearAllPermissions,
    updateRoleMetadata,
    undo,
    redo,
    setSearchQuery,
    setActiveCategory,
    saveRole,
    previewRole,
    exportRole
  } = usePermissionEditor({
    mode,
    roleId,
    templateId,
    autoSave: true,
    autoSaveInterval: 30000,
    validateOnChange: true
  });

  // Initialize drag and drop
  const {
    dragState,
    announceToScreenReader
  } = useDragAndDrop({
    onDrop: (permission, dropZone) => {
      if (dropZone === 'workspace') {
        addPermission(permission);
        announceToScreenReader(`Added ${permission.resource}.${permission.action} to role`);
      } else if (dropZone === 'trash') {
        removePermission(permission.id);
        announceToScreenReader(`Removed ${permission.resource}.${permission.action} from role`);
      }
    },
    onDragStart: (permission) => {
      announceToScreenReader(`Dragging ${permission.resource}.${permission.action}`);
    },
    enableTouch: true,
    enableKeyboard: true
  });

  // Initialize validation
  const { autoFixIssues } = useRoleValidation({
    enableRealTimeValidation: true,
    strictMode: context === 'role-management',
    context: context === 'role-management' ? 'creation' : 'assignment'
  });

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return; // Don't interfere with form inputs
      }

      const { ctrlKey, metaKey, key } = event;
      const isModified = ctrlKey || metaKey;

      switch (true) {
        case isModified && key === 's':
          event.preventDefault();
          if (canSave) {
            handleSave();
          }
          break;

        case isModified && key === 'z' && !event.shiftKey:
          event.preventDefault();
          if (canUndo) {
            undo();
            announceToScreenReader('Undid last action');
          }
          break;

        case isModified && (key === 'y' || (key === 'z' && event.shiftKey)):
          event.preventDefault();
          if (canRedo) {
            redo();
            announceToScreenReader('Redid last action');
          }
          break;

        case isModified && key === 'p':
          event.preventDefault();
          handlePreview();
          break;

        case key === 'Escape':
          if (showSaveDialog) {
            setShowSaveDialog(false);
          } else if (showPreviewPanel) {
            setShowPreviewPanel(false);
          } else if (selectedPermissionForDetails) {
            setSelectedPermissionForDetails(null);
            setShowPermissionDetails(false);
          }
          break;

        case key === '/':
          event.preventDefault();
          const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
          searchInput?.focus();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [canSave, canUndo, canRedo, undo, redo, showSaveDialog, showPreviewPanel, selectedPermissionForDetails]);

  // Handle role saving
  const handleSave = useCallback(async () => {
    if (!canSave) return;

    try {
      const success = await saveRole();
      if (success) {
        await onSave(state.role);
        announceToScreenReader('Role saved successfully');
      }
    } catch (error) {
      console.error('Failed to save role:', error);
      announceToScreenReader('Failed to save role');
    }
  }, [canSave, saveRole, onSave, state.role]);

  // Handle role preview
  const handlePreview = useCallback(() => {
    previewRole();
    setShowPreviewPanel(true);
    onPreview?.(state.role);
    announceToScreenReader('Opened role preview');
  }, [previewRole, onPreview, state.role]);

  // Handle template selection
  const handleTemplateSelect = useCallback((template: any) => {
    // Apply template to current role
    updateRoleMetadata({
      name: template.name,
      description: template.description,
      permissions: template.permissions
    });

    // Add template permissions
    const templatePermissions = state.availablePermissions.filter(p => 
      template.permissions.includes(p.id)
    );
    
    if (templatePermissions.length > 0) {
      addBulkPermissions(templatePermissions);
    }

    setShowTemplateSelector(false);
    announceToScreenReader(`Applied template: ${template.name}`);
  }, [updateRoleMetadata, state.availablePermissions, addBulkPermissions]);

  // Handle permission selection for details
  const handlePermissionSelect = useCallback((permission: Permission) => {
    setSelectedPermissionForDetails(permission);
    setShowPermissionDetails(true);
  }, []);

  // Handle auto-fix suggestions
  const handleAutoFix = useCallback(() => {
    const selectedPermissions = state.availablePermissions.filter(p => 
      state.selectedPermissions.has(p.id)
    );

    const { permissions: _fixedPermissions, role: fixedRole } = autoFixIssues(
      selectedPermissions, 
      state.role, 
      state.validationErrors
    );

    // Apply fixes
    if (fixedRole !== state.role) {
      updateRoleMetadata(fixedRole);
    }

    announceToScreenReader('Applied automatic fixes');
  }, [state.availablePermissions, state.selectedPermissions, state.role, state.validationErrors, autoFixIssues, updateRoleMetadata]);

  // Validation error summary
  const errorSummary = React.useMemo(() => {
    const errors = state.validationErrors.filter(e => e.type === 'error').length;
    const warnings = state.validationErrors.filter(e => e.type === 'warning').length;
    const infos = state.validationErrors.filter(e => e.type === 'info').length;

    return { errors, warnings, infos };
  }, [state.validationErrors]);

  // Render loading state
  if (state.isLoading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 ${className}`} style={{ height: maxHeight }}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-900 mb-2">Loading Permission Editor</p>
            <p className="text-gray-600">Preparing role configuration interface...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`} style={{ height: maxHeight }}>
      {/* Header */}
      <div className="border-b border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <AdjustmentsHorizontalIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {mode === 'create' ? 'Create Role' : mode === 'edit' ? 'Edit Role' : mode === 'clone' ? 'Clone Role' : 'View Role'}
              </h1>
              <p className="text-sm text-gray-600">
                {mode === 'create' ? 'Build a custom role with specific permissions' : 
                 mode === 'edit' ? 'Modify role permissions and settings' :
                 mode === 'clone' ? 'Create a copy of an existing role' :
                 'View role configuration and permissions'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Validation Status */}
            {state.validationErrors.length > 0 && (
              <div className="flex items-center space-x-1 px-3 py-1.5 bg-white border rounded-md">
                {errorSummary.errors > 0 && (
                  <div className="flex items-center space-x-1 text-red-600">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">{errorSummary.errors}</span>
                  </div>
                )}
                {errorSummary.warnings > 0 && (
                  <div className="flex items-center space-x-1 text-yellow-600">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    <span className="text-sm">{errorSummary.warnings}</span>
                  </div>
                )}
                {errorSummary.infos > 0 && (
                  <div className="flex items-center space-x-1 text-blue-600">
                    <InformationCircleIcon className="h-4 w-4" />
                    <span className="text-sm">{errorSummary.infos}</span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {/* Undo/Redo */}
              <div className="flex items-center border border-gray-300 rounded-md">
                <button
                  onClick={undo}
                  disabled={!canUndo || state.isSaving}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Undo (Ctrl+Z)"
                >
                  <ArrowUturnLeftIcon className="h-4 w-4" />
                </button>
                <div className="w-px h-6 bg-gray-300" />
                <button
                  onClick={redo}
                  disabled={!canRedo || state.isSaving}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Redo (Ctrl+Y)"
                >
                  <ArrowUturnRightIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Preview */}
              <button
                onClick={handlePreview}
                disabled={state.isLoading}
                className="flex items-center space-x-2 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                title="Preview Role (Ctrl+P)"
              >
                <PlayIcon className="h-4 w-4" />
                <span>Preview</span>
              </button>

              {/* Export */}
              <button
                onClick={() => {
                  const exportData = exportRole('json');
                  const blob = new Blob([exportData], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${state.role.name || 'role'}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                disabled={state.isLoading}
                className="flex items-center space-x-2 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                title="Export Role"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                <span>Export</span>
              </button>

              {/* Save */}
              <button
                onClick={() => setShowSaveDialog(true)}
                disabled={!canSave || hasValidationErrors}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Save Role (Ctrl+S)"
              >
                <ClipboardDocumentCheckIcon className="h-4 w-4" />
                <span>{state.isSaving ? 'Saving...' : 'Save Role'}</span>
              </button>

              {/* Cancel */}
              <button
                onClick={onCancel}
                className="flex items-center space-x-2 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <XMarkIcon className="h-4 w-4" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Role Metadata Editor */}
        <RoleMetadataEditor
          role={state.role}
          onChange={() => {}}
          errors={state.validationErrors.filter(e => e.field)}
          className="mb-4"
          showAdvanced={showAdvancedFeatures}
        />

        {/* Quick Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-6">
            <span>
              <span className="font-medium text-gray-900">{workspace.selectedPermissions.length}</span> permissions selected
            </span>
            <span>
              <span className="font-medium text-gray-900">{workspace.coverage.coveragePercentage.toFixed(1)}%</span> coverage
            </span>
            {workspace.conflicts.length > 0 && (
              <span className="text-red-600">
                <span className="font-medium">{workspace.conflicts.length}</span> conflicts
              </span>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {state.isDirty && (
              <span className="text-orange-600 text-xs">Unsaved changes</span>
            )}
            
            <button
              onClick={() => setActivePanel(activePanel === 'both' ? 'workspace' : activePanel === 'workspace' ? 'palette' : 'both')}
              className="flex items-center space-x-1 text-gray-500 hover:text-gray-700"
              title="Toggle panel layout"
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4" />
              <span className="text-xs">Layout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-full overflow-hidden" style={{ height: maxHeight - 200 }}>
        {/* Left Panel - Permission Palette */}
        {(activePanel === 'both' || activePanel === 'palette') && (
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            <div className="p-3 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Available Permissions</h2>
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search permissions..."
                      value={state.searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      data-search-input
                    />
                  </div>
                </div>
                <button
                  onClick={() => setActiveCategory(null)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                  title="Clear filters"
                >
                  <FunnelIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <PermissionPalette
                permissions={state.availablePermissions}
                selectedPermissions={state.selectedPermissions}
                searchQuery={state.searchQuery}
                activeCategory={state.activeCategory}
                onPermissionSelect={handlePermissionSelect}
                onCategoryChange={setActiveCategory}
                onSearchChange={setSearchQuery}
                showCategories
                showSearch={false}
                showRecommendations
              />
            </div>
          </div>
        )}

        {/* Right Panel - Permission Workspace */}
        {(activePanel === 'both' || activePanel === 'workspace') && (
          <div className={`${activePanel === 'both' ? 'w-1/2' : 'w-full'} flex flex-col`}>
            <div className="p-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Role Permissions</h2>
                <div className="flex items-center space-x-2">
                  {workspace.selectedPermissions.length > 0 && (
                    <button
                      onClick={clearAllPermissions}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <PermissionWorkspace
                permissions={workspace.selectedPermissions}
                dragDropState={dragState}
                validationErrors={state.validationErrors}
                onPermissionRemove={removePermission}
                onPermissionReorder={() => {
                  // Implement reordering logic
                }}
                onDropPermission={(permission, dropZone) => {
                  if (dropZone.id === 'workspace') {
                    addPermission(permission);
                  }
                }}
                layout="grouped"
                showConflicts
                showDependencies
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Panel - Validation & Tools */}
      {showValidationPanel && state.validationErrors.length > 0 && (
        <div className="border-t border-gray-200">
          <ValidationPanel
            errors={state.validationErrors}
            suggestions={[]} // Generated by validation hook
            onApplySuggestion={() => {}}
            onDismissError={() => {}}
            showAutoFix
            className="max-h-48 overflow-y-auto"
          />
        </div>
      )}

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Choose a Template</h2>
                <button
                  onClick={() => setShowTemplateSelector(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-96">
              <RoleTemplates
                onSelectTemplate={handleTemplateSelect}
                onStartFromScratch={() => setShowTemplateSelector(false)}
                context={context}
              />
            </div>
          </div>
        </div>
      )}

      {/* Save Role Dialog */}
      {showSaveDialog && (
        <SaveRoleDialog
          role={state.role}
          isOpen={showSaveDialog}
          onSave={async (role) => {
            await onSave(role);
            setShowSaveDialog(false);
          }}
          onCancel={() => setShowSaveDialog(false)}
          validationErrors={state.validationErrors}
          existingRoles={[]} // Would be provided from parent
          showTemplateOption={allowTemplateCreation}
        />
      )}

      {/* Preview Panel */}
      {showPreviewPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl max-h-[90vh] overflow-hidden">
            <PreviewPanel
              role={state.role}
              testResults={previewRole()}
              onRunTests={() => {}}
              onExportRole={() => {
                const exportData = exportRole('json');
                const blob = new Blob([exportData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${state.role.name || 'role'}-preview.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="max-h-[90vh]"
              showTestCases
              showScenarios
            />
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowPreviewPanel(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permission Details Panel */}
      {showPermissionDetails && selectedPermissionForDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 max-h-[80vh]">
              <h3 className="text-lg font-semibold mb-4">Permission Details</h3>
              <p className="mb-4">Details for: {selectedPermissionForDetails.resource}.{selectedPermissionForDetails.action}</p>
              <button 
                onClick={() => {
                  setShowPermissionDetails(false);
                  setSelectedPermissionForDetails(null);
                }}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionEditor;