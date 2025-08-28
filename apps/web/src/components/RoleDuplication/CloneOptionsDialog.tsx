import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Settings,
  Filter,
  SlidersHorizontal,
  // Check,
  // Info,
  Sparkles,
  Eye
} from 'lucide-react';
// import { Role } from '../../services/roleService'; // Not used
import {
  CloneConfiguration,
  CloneOptionsDialogProps,
  // CloneType // Not used
} from '../../types/roleDuplication';
import { useRoleDuplication } from '../../hooks/useRoleDuplication';
import { Permission } from '../../types/permission';

const CloneOptionsDialog: React.FC<CloneOptionsDialogProps> = ({
  isOpen,
  sourceRole,
  onConfirm,
  onCancel,
  initialConfiguration,
  showPreview = true,
  enableSmartSuggestions = true
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'permissions' | 'advanced'>('basic');
  const [configuration, setConfiguration] = useState<CloneConfiguration>({
    sourceRoleId: sourceRole.id,
    cloneType: 'full',
    newMetadata: {
      name: '',
      description: '',
      level: sourceRole.level || 50,
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
    } as CloneConfiguration['inheritanceRules'],
    ...initialConfiguration
  });
  
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableScopes, setAvailableScopes] = useState<string[]>([]);
  const [showPreviewPanel, setShowPreviewPanel] = useState(false);

  const {
    clonePreview,
    generatePreview,
    recommendations,
    // getSmartSuggestions
  } = useRoleDuplication();

  // Initialize available permissions and categories
  useEffect(() => {
    if (sourceRole.permissions) {
      // Add required timestamps to permissions if missing
      const permissionsWithTimestamps = sourceRole.permissions.map(p => ({
        ...p,
        createdAt: p.createdAt || new Date().toISOString(),
        updatedAt: p.updatedAt || new Date().toISOString()
      }));
      setAvailablePermissions(permissionsWithTimestamps);
      
      const categories = [...new Set(sourceRole.permissions.map(p => p.resource))];
      setAvailableCategories(categories);
      
      const scopes = [...new Set(sourceRole.permissions.filter(p => p.scope).map(p => p.scope))];
      setAvailableScopes(scopes);
    }
  }, [sourceRole]);

  // Update configuration
  const updateConfiguration = useCallback((updates: Partial<CloneConfiguration>) => {
    setConfiguration((prev: CloneConfiguration) => ({
      ...prev,
      ...updates,
      newMetadata: {
        ...prev.newMetadata,
        ...updates.newMetadata
      },
      permissionFilters: {
        ...prev.permissionFilters,
        ...updates.permissionFilters
      },
      inheritanceRules: {
        ...prev.inheritanceRules,
        ...updates.inheritanceRules
      }
    }));
  }, []);

  // Handle permission category toggle
  const toggleCategory = (category: string, include: boolean) => {
    const currentCategories = include 
      ? configuration.permissionFilters.includeCategories
      : configuration.permissionFilters.excludeCategories;
    
    const updatedCategories = currentCategories.includes(category)
      ? currentCategories.filter(c => c !== category)
      : [...currentCategories, category];
    
    updateConfiguration({
      permissionFilters: {
        ...configuration.permissionFilters,
        [include ? 'includeCategories' : 'excludeCategories']: updatedCategories
      }
    });
  };

  // Handle scope toggle
  const toggleScope = (scope: string, include: boolean) => {
    const currentScopes = include 
      ? configuration.permissionFilters.includeScopes
      : configuration.permissionFilters.excludeScopes;
    
    const updatedScopes = currentScopes.includes(scope)
      ? currentScopes.filter(s => s !== scope)
      : [...currentScopes, scope];
    
    updateConfiguration({
      permissionFilters: {
        ...configuration.permissionFilters,
        [include ? 'includeScopes' : 'excludeScopes']: updatedScopes
      }
    });
  };

  // Handle individual permission toggle
  const togglePermission = (permissionId: string) => {
    const currentSelections = configuration.permissionFilters.customSelections;
    const updatedSelections = currentSelections.includes(permissionId)
      ? currentSelections.filter(id => id !== permissionId)
      : [...currentSelections, permissionId];
    
    updateConfiguration({
      permissionFilters: {
        ...configuration.permissionFilters,
        customSelections: updatedSelections
      }
    });
  };

  // Handle preview generation
  const handleGeneratePreview = async () => {
    try {
      await generatePreview();
      setShowPreviewPanel(true);
    } catch (error) {
      console.error('Error generating preview:', error);
    }
  };

  // Handle confirm
  const handleConfirm = () => {
    onConfirm(configuration);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Settings className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Advanced Clone Options</h2>
                  <p className="text-sm text-gray-600">
                    Configure detailed settings for cloning <span className="font-medium">{sourceRole.name}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="mt-6">
              <div className="flex space-x-6 border-b border-gray-200">
                {[
                  { key: 'basic', label: 'Basic Settings', icon: <Settings className="h-4 w-4" /> },
                  { key: 'permissions', label: 'Permission Filters', icon: <Filter className="h-4 w-4" /> },
                  { key: 'advanced', label: 'Advanced', icon: <SlidersHorizontal className="h-4 w-4" /> }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`
                      flex items-center space-x-2 px-3 py-2 border-b-2 text-sm font-medium transition-colors
                      ${activeTab === tab.key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
            {activeTab === 'basic' && (
              <BasicSettingsTab
                configuration={configuration}
                onUpdate={updateConfiguration}
                recommendations={recommendations}
                enableSmartSuggestions={enableSmartSuggestions}
              />
            )}

            {activeTab === 'permissions' && (
              <PermissionFiltersTab
                configuration={configuration}
                availablePermissions={availablePermissions}
                availableCategories={availableCategories}
                availableScopes={availableScopes}
                onToggleCategory={toggleCategory}
                onToggleScope={toggleScope}
                onTogglePermission={togglePermission}
              />
            )}

            {activeTab === 'advanced' && (
              <AdvancedSettingsTab
                configuration={configuration}
                onUpdate={updateConfiguration}
              />
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {showPreview && (
                  <button
                    onClick={handleGeneratePreview}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Preview</span>
                  </button>
                )}
                
                {enableSmartSuggestions && recommendations.length > 0 && (
                  <div className="text-sm text-blue-600">
                    <Sparkles className="h-4 w-4 inline mr-1" />
                    {recommendations.length} suggestions available
                  </div>
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
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Apply Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Panel */}
      {showPreviewPanel && clonePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Clone Preview</h3>
                <button
                  onClick={() => setShowPreviewPanel(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="font-medium text-gray-700">Permissions</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {clonePreview.resultingPermissions.length}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="font-medium text-gray-700">Level</div>
                    <div className="text-2xl font-bold text-green-600">
                      {clonePreview.estimatedLevel}
                    </div>
                  </div>
                </div>
                
                {clonePreview.validationErrors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                    <div className="font-medium text-red-800 mb-2">Validation Errors</div>
                    <ul className="text-sm text-red-700 space-y-1">
                      {clonePreview.validationErrors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {clonePreview.validationWarnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                    <div className="font-medium text-yellow-800 mb-2">Warnings</div>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {clonePreview.validationWarnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {clonePreview.suggestedImprovements.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                    <div className="font-medium text-blue-800 mb-2">Suggestions</div>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {clonePreview.suggestedImprovements.map((suggestion, index) => (
                        <li key={index}>• {suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Tab Components
interface BasicSettingsTabProps {
  configuration: CloneConfiguration;
  onUpdate: (updates: Partial<CloneConfiguration>) => void;
  recommendations: any[];
  enableSmartSuggestions: boolean;
}

const BasicSettingsTab: React.FC<BasicSettingsTabProps> = ({
  configuration,
  onUpdate,
  recommendations,
  enableSmartSuggestions
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role Name
          </label>
          <input
            type="text"
            value={configuration.newMetadata.name}
            onChange={(e) => onUpdate({ newMetadata: { ...configuration.newMetadata, name: e.target.value } })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter role name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Level
          </label>
          <input
            type="number"
            value={configuration.newMetadata.level}
            onChange={(e) => onUpdate({ newMetadata: { ...configuration.newMetadata, level: parseInt(e.target.value) || 50 } })}
            min="1"
            max="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={configuration.newMetadata.description}
          onChange={(e) => onUpdate({ newMetadata: { ...configuration.newMetadata, description: e.target.value } })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Describe this role's purpose and responsibilities"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category
        </label>
        <input
          type="text"
          value={configuration.newMetadata.category || ''}
          onChange={(e) => onUpdate({ newMetadata: { ...configuration.newMetadata, category: e.target.value } })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Management, Operations, Support"
        />
      </div>
      
      {enableSmartSuggestions && recommendations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">Smart Suggestions</span>
          </div>
          <div className="space-y-2">
            {recommendations.slice(0, 3).map((rec, index) => (
              <div key={index} className="text-sm text-blue-800">
                • {rec.explanation}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface PermissionFiltersTabProps {
  configuration: CloneConfiguration;
  availablePermissions: Permission[];
  availableCategories: string[];
  availableScopes: string[];
  onToggleCategory: (category: string, include: boolean) => void;
  onToggleScope: (scope: string, include: boolean) => void;
  onTogglePermission: (permissionId: string) => void;
}

const PermissionFiltersTab: React.FC<PermissionFiltersTabProps> = ({
  configuration,
  availablePermissions,
  availableCategories,
  availableScopes,
  onToggleCategory,
  onToggleScope,
  onTogglePermission
}) => {
  return (
    <div className="space-y-6">
      {/* Category Filters */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Permission Categories</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Include Categories</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {availableCategories.map(category => (
                <label key={category} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={configuration.permissionFilters.includeCategories.includes(category)}
                    onChange={() => onToggleCategory(category, true)}
                    className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{category}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Exclude Categories</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {availableCategories.map(category => (
                <label key={category} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={configuration.permissionFilters.excludeCategories.includes(category)}
                    onChange={() => onToggleCategory(category, false)}
                    className="mr-2 h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">{category}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scope Filters */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Permission Scopes</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Include Scopes</h4>
            <div className="space-y-2">
              {availableScopes.map(scope => (
                <label key={scope} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={configuration.permissionFilters.includeScopes.includes(scope)}
                    onChange={() => onToggleScope(scope, true)}
                    className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 capitalize">{scope}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Exclude Scopes</h4>
            <div className="space-y-2">
              {availableScopes.map(scope => (
                <label key={scope} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={configuration.permissionFilters.excludeScopes.includes(scope)}
                    onChange={() => onToggleScope(scope, false)}
                    className="mr-2 h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700 capitalize">{scope}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Individual Permission Selection */}
      {configuration.cloneType === 'partial' && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Individual Permissions</h3>
          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
            <div className="p-3 space-y-2">
              {availablePermissions.map(permission => (
                <label key={permission.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={configuration.permissionFilters.customSelections.includes(permission.id)}
                    onChange={() => onTogglePermission(permission.id)}
                    className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{permission.resource}.{permission.action}</div>
                    <div className="text-sm text-gray-600">{permission.scope} scope</div>
                    {permission.description && (
                      <div className="text-xs text-gray-500 mt-1">{permission.description}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface AdvancedSettingsTabProps {
  configuration: CloneConfiguration;
  onUpdate: (updates: Partial<CloneConfiguration>) => void;
}

const AdvancedSettingsTab: React.FC<AdvancedSettingsTabProps> = ({
  configuration,
  onUpdate
}) => {
  return (
    <div className="space-y-6">
      {/* Lineage Settings */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Lineage & Inheritance</h3>
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={configuration.preserveLineage}
              onChange={(e) => onUpdate({ preserveLineage: e.target.checked })}
              className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-gray-900">Preserve Role Lineage</div>
              <div className="text-sm text-gray-600">Track parent-child relationships between roles</div>
            </div>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={configuration.inheritanceRules?.copyUserAssignments || false}
              onChange={(e) => onUpdate({
                inheritanceRules: {
                  ...configuration.inheritanceRules!,
                  copyUserAssignments: e.target.checked
                }
              })}
              className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-gray-900">Copy User Assignments</div>
              <div className="text-sm text-gray-600">Assign users from source role to the new role</div>
            </div>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={configuration.inheritanceRules?.adjustLevel || false}
              onChange={(e) => onUpdate({
                inheritanceRules: {
                  ...configuration.inheritanceRules!,
                  adjustLevel: e.target.checked
                }
              })}
              className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-gray-900">Auto-adjust Level</div>
              <div className="text-sm text-gray-600">Automatically adjust role level based on permissions</div>
            </div>
          </label>
        </div>
      </div>

      {/* Clone Metadata */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Clone Metadata</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={(configuration.newMetadata.tags || []).join(', ')}
              onChange={(e) => {
                const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
                onUpdate({ newMetadata: { ...configuration.newMetadata, tags } });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., management, temporary, project"
            />
          </div>
        </div>
      </div>

      {/* Debug Information */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Configuration Preview</h3>
        <pre className="text-xs text-gray-700 bg-white p-3 rounded border overflow-auto max-h-40">
          {JSON.stringify(configuration, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default CloneOptionsDialog;
