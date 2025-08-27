import React, { useState, useCallback } from 'react';
import {
  XMarkIcon,
  DocumentDuplicateIcon,
  PlusIcon,
  TrashIcon,
  SparklesIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { Role } from '../../services/roleService';
import {
  BulkCloneDialogProps,
  CloneBatchConfig,
  CloneTemplate
} from '../../types/roleDuplication';

const BulkCloneDialog: React.FC<BulkCloneDialogProps> = ({
  isOpen,
  sourceRoles,
  onConfirm,
  onCancel,
  templates = [],
  maxBatchSize = 10
}) => {
  const [batchConfig, setBatchConfig] = useState<CloneBatchConfig>({
    sourceRoles: sourceRoles.map(role => role.id),
    batchType: 'variations',
    namePattern: '{sourceName} - {variation}',
    variations: [],
    globalAdjustments: {}
  });
  
  const [newVariation, setNewVariation] = useState({ name: '', adjustments: {} });
  const [selectedTemplate, setSelectedTemplate] = useState<CloneTemplate | null>(null);

  // Add variation
  const addVariation = useCallback(() => {
    if (!newVariation.name.trim()) return;
    
    setBatchConfig(prev => ({
      ...prev,
      variations: [
        ...prev.variations,
        {
          name: newVariation.name,
          adjustments: newVariation.adjustments
        }
      ]
    }));
    
    setNewVariation({ name: '', adjustments: {} });
  }, [newVariation]);

  // Remove variation
  const removeVariation = useCallback((index: number) => {
    setBatchConfig(prev => ({
      ...prev,
      variations: prev.variations.filter((_, i) => i !== index)
    }));
  }, []);

  // Apply template
  const applyTemplate = useCallback((template: CloneTemplate) => {
    setSelectedTemplate(template);
    setBatchConfig(prev => ({
      ...prev,
      globalAdjustments: {
        ...prev.globalAdjustments,
        ...template.configuration
      }
    }));
  }, []);

  // Handle confirm
  const handleConfirm = useCallback(() => {
    if (batchConfig.variations.length === 0) return;
    onConfirm(batchConfig);
  }, [batchConfig, onConfirm]);

  // Validation
  const isValid = batchConfig.variations.length > 0 && batchConfig.variations.length <= maxBatchSize;
  const totalRolesToCreate = sourceRoles.length * batchConfig.variations.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <ClipboardDocumentListIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Bulk Clone Roles</h2>
                <p className="text-sm text-gray-600">
                  Create multiple variations of {sourceRoles.length} selected roles
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          <div className="space-y-6">
            {/* Batch Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Batch Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: 'variations', label: 'Variations', description: 'Create different versions' },
                  { value: 'departments', label: 'Departments', description: 'Clone for departments' },
                  { value: 'properties', label: 'Properties', description: 'Clone for properties' },
                  { value: 'regions', label: 'Regions', description: 'Clone for regions' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setBatchConfig(prev => ({ ...prev, batchType: option.value as any }))}
                    className={`
                      p-3 border rounded-lg text-left transition-all
                      ${batchConfig.batchType === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs opacity-75 mt-1">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Name Pattern */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name Pattern
              </label>
              <input
                type="text"
                value={batchConfig.namePattern}
                onChange={(e) => setBatchConfig(prev => ({ ...prev, namePattern: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="{sourceName} - {variation}"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use {'{'}sourceName{'}'} for original role name and {'{'}variation{'}'} for variation name
              </p>
            </div>

            {/* Templates */}
            {templates.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Quick Templates
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {templates.slice(0, 4).map(template => (
                    <button
                      key={template.id}
                      onClick={() => applyTemplate(template)}
                      className={`
                        p-3 border rounded-lg text-left transition-all
                        ${selectedTemplate?.id === template.id
                          ? 'border-blue-500 bg-blue-50 text-blue-900'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-2">
                        <SparklesIcon className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-sm">{template.name}</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{template.description}</div>
                      <div className="text-xs text-green-600 mt-1">
                        Used {template.usage.timesUsed} times
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Variations */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Variations ({batchConfig.variations.length}/{maxBatchSize})
                </label>
                {batchConfig.variations.length < maxBatchSize && (
                  <span className="text-xs text-gray-500">
                    Add up to {maxBatchSize} variations
                  </span>
                )}
              </div>
              
              {/* Add Variation Form */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newVariation.name}
                      onChange={(e) => setNewVariation(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter variation name (e.g., Manager, Assistant, Supervisor)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && addVariation()}
                    />
                  </div>
                  <button
                    onClick={addVariation}
                    disabled={!newVariation.name.trim() || batchConfig.variations.length >= maxBatchSize}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {/* Variation List */}
              {batchConfig.variations.length > 0 && (
                <div className="space-y-2">
                  {batchConfig.variations.map((variation, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{variation.name}</div>
                        <div className="text-sm text-gray-600">
                          Will create: {batchConfig.namePattern.replace('{variation}', variation.name)}
                        </div>
                      </div>
                      <button
                        onClick={() => removeVariation(index)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Preview */}
            {batchConfig.variations.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3">Bulk Clone Preview</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{sourceRoles.length}</div>
                    <div className="text-sm text-blue-700">Source Roles</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{batchConfig.variations.length}</div>
                    <div className="text-sm text-blue-700">Variations Each</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{totalRolesToCreate}</div>
                    <div className="text-sm text-blue-700">Total New Roles</div>
                  </div>
                </div>
                
                {totalRolesToCreate > 20 && (
                  <div className="mt-3 text-sm text-orange-700 bg-orange-50 border border-orange-200 p-2 rounded">
                    ⚠️ This will create {totalRolesToCreate} roles. Consider breaking this into smaller batches.
                  </div>
                )}
              </div>
            )}

            {/* Source Roles Preview */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Source Roles</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {sourceRoles.map(role => (
                  <div key={role.id} className="bg-gray-50 border border-gray-200 rounded-md p-3">
                    <div className="font-medium text-gray-900 text-sm">{role.name}</div>
                    <div className="text-xs text-gray-600">
                      Level {role.level} • {role.permissions.length} permissions
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {isValid ? (
                <span className="text-green-600">
                  ✅ Ready to create {totalRolesToCreate} roles
                </span>
              ) : (
                <span className="text-orange-600">
                  ⚠️ {batchConfig.variations.length === 0 ? 'Add at least one variation' : `Maximum ${maxBatchSize} variations allowed`}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!isValid}
                className={`
                  flex items-center space-x-2 px-6 py-2 rounded-md font-medium transition-colors
                  ${isValid
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                <DocumentDuplicateIcon className="h-4 w-4" />
                <span>Create {totalRolesToCreate} Roles</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkCloneDialog;
