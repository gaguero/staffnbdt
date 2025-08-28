import React, { useState, useCallback, useEffect } from 'react';
import {
  X as XMarkIcon,
  AlertTriangle as ExclamationTriangleIcon,
  CheckCircle as CheckCircleIcon,
  ClipboardCheck as ClipboardDocumentCheckIcon,
  Copy as DocumentDuplicateIcon,
  Sparkles as SparklesIcon,
  Info as InformationCircleIcon,
  Users as UserGroupIcon,
  Tag as TagIcon
} from 'lucide-react';

import { 
  SaveRoleDialogProps, 
  RoleConfiguration, 
  ValidationError 
} from '../../types/permissionEditor';
import RoleBadge from '../RoleBadge';

const SaveRoleDialog: React.FC<SaveRoleDialogProps> = ({
  role,
  isOpen,
  onSave,
  onCancel,
  validationErrors = [],
  existingRoles = [],
  showTemplateOption = true
}) => {
  const [saveAsTemplate, setSaveAsTemplate] = useState(role.metadata.isTemplate);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMode, setSaveMode] = useState<'role' | 'template' | 'both'>('role');

  // Check for role name conflicts
  const hasNameConflict = useCallback(() => {
    return existingRoles.some(existingRole => 
      existingRole.id !== role.id && 
      existingRole.name.toLowerCase() === role.name.toLowerCase()
    );
  }, [existingRoles, role.id, role.name]);

  // Check for validation errors that prevent saving
  const hasBlockingErrors = useCallback(() => {
    return validationErrors.some(error => error.type === 'error');
  }, [validationErrors]);

  // Get save button disabled state
  const isSaveDisabled = useCallback(() => {
    if (isSaving) return true;
    if (hasBlockingErrors()) return true;
    if (!role.name.trim() || !role.description.trim()) return true;
    if (saveMode === 'template' && !templateName.trim()) return true;
    return false;
  }, [isSaving, hasBlockingErrors, role.name, role.description, saveMode, templateName]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (isSaveDisabled()) return;

    setIsSaving(true);
    
    try {
      const roleToSave: RoleConfiguration = {
        ...role,
        metadata: {
          ...role.metadata,
          isTemplate: saveMode === 'template' || saveMode === 'both' || saveAsTemplate
        }
      };

      // If saving as template, update template metadata
      if (saveMode === 'template' || saveMode === 'both') {
        roleToSave.name = templateName || role.name;
        roleToSave.description = templateDescription || role.description;
        roleToSave.metadata.isTemplate = true;
      }

      await onSave(roleToSave);
    } catch (error) {
      console.error('Failed to save role:', error);
    } finally {
      setIsSaving(false);
    }
  }, [
    isSaveDisabled, 
    role, 
    saveMode, 
    saveAsTemplate, 
    templateName, 
    templateDescription, 
    onSave
  ]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setSaveAsTemplate(role.metadata.isTemplate);
      setTemplateName(role.name);
      setTemplateDescription(role.description);
      setSaveMode('role');
    }
  }, [isOpen, role.metadata.isTemplate, role.name, role.description]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <ClipboardDocumentCheckIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Save Role</h2>
              <p className="text-sm text-gray-600">Choose how to save your role configuration</p>
            </div>
          </div>
          
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
          {/* Role Preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Role Preview</h3>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <UserGroupIcon className="h-4 w-4" />
                <span>{role.metadata.usage?.userCount || 0} users</span>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <RoleBadge
                role={role.name || 'Untitled Role'}
                isCustomRole={role.isCustomRole}
                size="lg"
                showTooltip={false}
              />
              
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {role.name || 'Untitled Role'}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {role.description || 'No description provided'}
                </p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <span>{role.permissions.length} permissions</span>
                  <span>Level: {role.level}</span>
                  {role.metadata.tags.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <TagIcon className="h-3 w-3" />
                      <span>{role.metadata.tags.length} tags</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Validation Status */}
          {validationErrors.length > 0 && (
            <div className="border border-gray-200 rounded-lg">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">Validation Status</h3>
              </div>
              <div className="p-4 space-y-3 max-h-32 overflow-y-auto">
                {validationErrors.slice(0, 5).map((error, index) => {
                  const isError = error.type === 'error';
                  const IconComponent = isError ? ExclamationTriangleIcon : InformationCircleIcon;
                  const colorClasses = isError 
                    ? 'text-red-600 bg-red-50 border-red-200' 
                    : error.type === 'warning'
                    ? 'text-yellow-600 bg-yellow-50 border-yellow-200'
                    : 'text-blue-600 bg-blue-50 border-blue-200';

                  return (
                    <div key={index} className={`flex items-start space-x-2 p-2 border rounded ${colorClasses}`}>
                      <IconComponent className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{error.message}</p>
                        {error.field && (
                          <p className="text-xs opacity-75 mt-1">Field: {error.field}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {validationErrors.length > 5 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{validationErrors.length - 5} more issues
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Name Conflict Warning */}
          {hasNameConflict() && (
            <div className="flex items-start space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Name Conflict Detected
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  A role with the name "{role.name}" already exists. Saving will update the existing role.
                </p>
              </div>
            </div>
          )}

          {/* Save Options */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Save Options</h3>
            
            {/* Save as Role */}
            <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200">
              <input
                type="radio"
                name="save-mode"
                value="role"
                checked={saveMode === 'role'}
                onChange={(e) => setSaveMode(e.target.value as any)}
                className="mt-1 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <ClipboardDocumentCheckIcon className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">Save as Role</span>
                </div>
                <p className="text-sm text-gray-600">
                  Save this configuration as a role that can be assigned to users.
                </p>
              </div>
            </label>

            {/* Save as Template */}
            {showTemplateOption && (
              <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                <input
                  type="radio"
                  name="save-mode"
                  value="template"
                  checked={saveMode === 'template'}
                  onChange={(e) => setSaveMode(e.target.value as any)}
                  className="mt-1 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <SparklesIcon className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-900">Save as Template</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Save this configuration as a reusable template for creating similar roles.
                  </p>
                  
                  {saveMode === 'template' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Template Name
                        </label>
                        <input
                          type="text"
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Enter template name..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Template Description
                        </label>
                        <textarea
                          value={templateDescription}
                          onChange={(e) => setTemplateDescription(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Describe when to use this template..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              </label>
            )}

            {/* Save as Both */}
            {showTemplateOption && (
              <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                <input
                  type="radio"
                  name="save-mode"
                  value="both"
                  checked={saveMode === 'both'}
                  onChange={(e) => setSaveMode(e.target.value as any)}
                  className="mt-1 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <DocumentDuplicateIcon className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-900">Save as Both</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Save as a role for immediate use and also create a template for future roles.
                  </p>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            {hasBlockingErrors() ? (
              <div className="flex items-center space-x-2 text-red-600">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <span>Fix errors before saving</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircleIcon className="h-4 w-4" />
                <span>Ready to save</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSave}
              disabled={isSaveDisabled()}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isSaving ? 'Saving...' : saveMode === 'template' ? 'Save Template' : saveMode === 'both' ? 'Save Both' : 'Save Role'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaveRoleDialog;