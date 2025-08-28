import React, { useState } from 'react';
import {
  Eye,
  Pencil,
  Check,
  // X,
  AlertTriangle,
  Info,
  Plus,
  Minus,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import {
  ClonePreview as ClonePreviewType, // Type alias needed for component props
  ClonePreviewProps
} from '../../types/roleDuplication';
import { Permission } from '../../types/permission';

const ClonePreview: React.FC<ClonePreviewProps> = ({
  preview,
  onEdit,
  onConfirm,
  onCancel,
  showDetailedDiff = true,
  showValidationDetails = true,
  className = ''
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    metadata: true,
    permissions: false,
    changes: false,
    validation: true
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Helper functions commented out for now as they're not used
  // const getSeverityColor = (severity: 'error' | 'warning' | 'info') => {
  //   switch (severity) {
  //     case 'error': return 'text-red-600 bg-red-50 border-red-200';
  //     case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  //     case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
  //     default: return 'text-gray-600 bg-gray-50 border-gray-200';
  //   }
  // };

  // const getSeverityIcon = (severity: 'error' | 'warning' | 'info') => {
  //   switch (severity) {
  //     case 'error': return <AlertTriangle className="h-4 w-4" />;
  //     case 'warning': return <AlertTriangle className="h-4 w-4" />;
  //     case 'info': return <Info className="h-4 w-4" />;
  //     default: return <Info className="h-4 w-4" />;
  //   }
  // };

  const hasValidationIssues = preview.validationErrors.length > 0;
  const hasWarnings = preview.validationWarnings.length > 0;
  const hasSuggestions = preview.suggestedImprovements.length > 0;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Eye className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Clone Preview</h2>
              <p className="text-sm text-gray-600">
                Review the changes before creating the new role
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Validation Status Indicator */}
            <div className={`
              px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1
              ${hasValidationIssues 
                ? 'bg-red-100 text-red-800 border border-red-200'
                : hasWarnings 
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                : 'bg-green-100 text-green-800 border border-green-200'
              }
            `}>
              {hasValidationIssues ? (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  <span>Has Issues</span>
                </>
              ) : hasWarnings ? (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  <span>Warnings</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Ready</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="divide-y divide-gray-200">
        {/* Role Metadata Section */}
        <div className="p-6">
          <button
            onClick={() => toggleSection('metadata')}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="text-lg font-medium text-gray-900">Role Details</h3>
            {expandedSections.metadata ? (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-400" />
            )}
          </button>
          
          {expandedSections.metadata && (
            <div className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-700">Name</div>
                  <div className="text-lg font-semibold text-gray-900 mt-1">
                    {preview.targetConfiguration.newMetadata.name}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-700">Level</div>
                  <div className="text-lg font-semibold text-gray-900 mt-1">
                    {preview.estimatedLevel}
                    {preview.estimatedLevel !== preview.targetConfiguration.newMetadata.level && (
                      <span className="text-sm text-orange-600 ml-2">
                        (suggested: {preview.estimatedLevel})
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-700">Clone Type</div>
                  <div className="text-lg font-semibold text-gray-900 mt-1 capitalize">
                    {preview.targetConfiguration.cloneType.replace('_', ' ')}
                  </div>
                </div>
              </div>
              
              {preview.targetConfiguration.newMetadata.description && (
                <div className="mt-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Description</div>
                  <div className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {preview.targetConfiguration.newMetadata.description}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Permissions Overview Section */}
        <div className="p-6">
          <button
            onClick={() => toggleSection('permissions')}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="text-lg font-medium text-gray-900">
              Permissions ({preview.resultingPermissions.length})
            </h3>
            {expandedSections.permissions ? (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-400" />
            )}
          </button>
          
          {expandedSections.permissions && (
            <div className="mt-4">
              {/* Permission Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {preview.resultingPermissions.length}
                  </div>
                  <div className="text-sm text-blue-700">Total Permissions</div>
                </div>
                
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {preview.addedPermissions.length}
                  </div>
                  <div className="text-sm text-green-700">Added</div>
                </div>
                
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {preview.removedPermissions.length}
                  </div>
                  <div className="text-sm text-red-700">Removed</div>
                </div>
              </div>
              
              {/* Permission Categories */}
              <div className="space-y-4">
                {getPermissionsByCategory(preview.resultingPermissions).map(([category, permissions]) => (
                  <div key={category} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="font-medium text-gray-900 mb-2">
                      {category} ({permissions.length})
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {permissions.slice(0, 6).map(permission => (
                        <div key={permission.id} className="text-sm text-gray-700">
                          {permission.action} ({permission.scope})
                        </div>
                      ))}
                      {permissions.length > 6 && (
                        <div className="text-sm text-gray-500">
                          +{permissions.length - 6} more...
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Changes Section */}
        {showDetailedDiff && (preview.addedPermissions.length > 0 || preview.removedPermissions.length > 0 || preview.modifiedPermissions.length > 0) && (
          <div className="p-6">
            <button
              onClick={() => toggleSection('changes')}
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="text-lg font-medium text-gray-900">Detailed Changes</h3>
              {expandedSections.changes ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </button>
            
            {expandedSections.changes && (
              <div className="mt-4 space-y-4">
                {/* Added Permissions */}
                {preview.addedPermissions.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <Plus className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800">
                        Added Permissions ({preview.addedPermissions.length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {preview.addedPermissions.map(permission => (
                        <div key={permission.id} className="text-sm text-green-700">
                          <span className="font-medium">{permission.resource}.{permission.action}</span>
                          <span className="text-green-600 ml-2">({permission.scope})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Removed Permissions */}
                {preview.removedPermissions.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <Minus className="h-5 w-5 text-red-600" />
                      <span className="font-medium text-red-800">
                        Removed Permissions ({preview.removedPermissions.length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {preview.removedPermissions.map(permission => (
                        <div key={permission.id} className="text-sm text-red-700">
                          <span className="font-medium">{permission.resource}.{permission.action}</span>
                          <span className="text-red-600 ml-2">({permission.scope})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Modified Permissions */}
                {preview.modifiedPermissions.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <SlidersHorizontal className="h-5 w-5 text-yellow-600" />
                      <span className="font-medium text-yellow-800">
                        Modified Permissions ({preview.modifiedPermissions.length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {preview.modifiedPermissions.map(permission => (
                        <div key={permission.id} className="text-sm text-yellow-700">
                          <span className="font-medium">{permission.resource}.{permission.action}</span>
                          <span className="text-yellow-600 ml-2">(scope adjusted)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Validation Section */}
        {showValidationDetails && (hasValidationIssues || hasWarnings || hasSuggestions) && (
          <div className="p-6">
            <button
              onClick={() => toggleSection('validation')}
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="text-lg font-medium text-gray-900">Validation & Suggestions</h3>
              {expandedSections.validation ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </button>
            
            {expandedSections.validation && (
              <div className="mt-4 space-y-4">
                {/* Validation Errors */}
                {preview.validationErrors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <span className="font-medium text-red-800">
                        Validation Errors ({preview.validationErrors.length})
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {preview.validationErrors.map((error, index) => (
                        <li key={index} className="text-sm text-red-700 flex items-start space-x-2">
                          <span className="block w-1 h-1 bg-red-600 rounded-full mt-2 flex-shrink-0" />
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Validation Warnings */}
                {preview.validationWarnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <span className="font-medium text-yellow-800">
                        Warnings ({preview.validationWarnings.length})
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {preview.validationWarnings.map((warning, index) => (
                        <li key={index} className="text-sm text-yellow-700 flex items-start space-x-2">
                          <span className="block w-1 h-1 bg-yellow-600 rounded-full mt-2 flex-shrink-0" />
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Suggestions */}
                {preview.suggestedImprovements.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <Info className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-800">
                        Suggestions ({preview.suggestedImprovements.length})
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {preview.suggestedImprovements.map((suggestion, index) => (
                        <li key={index} className="text-sm text-blue-700 flex items-start space-x-2">
                          <span className="block w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Conflict Analysis */}
        {(preview.conflictAnalysis.namingConflicts.length > 0 || 
          preview.conflictAnalysis.permissionConflicts.length > 0 || 
          preview.conflictAnalysis.hierarchyConflicts.length > 0) && (
          <div className="p-6 bg-red-50 border-t border-red-200">
            <div className="flex items-center space-x-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h3 className="text-lg font-medium text-red-800">Conflicts Detected</h3>
            </div>
            
            <div className="space-y-3">
              {preview.conflictAnalysis.namingConflicts.map((conflict, index) => (
                <div key={index} className="text-sm text-red-700 bg-white border border-red-200 p-3 rounded">
                  <span className="font-medium">Naming Conflict:</span> {conflict}
                </div>
              ))}
              {preview.conflictAnalysis.permissionConflicts.map((conflict, index) => (
                <div key={index} className="text-sm text-red-700 bg-white border border-red-200 p-3 rounded">
                  <span className="font-medium">Permission Conflict:</span> {conflict}
                </div>
              ))}
              {preview.conflictAnalysis.hierarchyConflicts.map((conflict, index) => (
                <div key={index} className="text-sm text-red-700 bg-white border border-red-200 p-3 rounded">
                  <span className="font-medium">Hierarchy Conflict:</span> {conflict}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {hasValidationIssues ? (
              <span className="text-red-600">⚠️ Please resolve validation errors before proceeding</span>
            ) : (
              <span className="text-green-600">✅ Ready to create role</span>
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
              onClick={onEdit}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Pencil className="h-4 w-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={onConfirm}
              disabled={hasValidationIssues}
              className={`
                flex items-center space-x-2 px-6 py-2 rounded-md font-medium transition-colors
                ${hasValidationIssues
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
                }
              `}
            >
              <Check className="h-4 w-4" />
              <span>Confirm & Create</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to group permissions by category
const getPermissionsByCategory = (permissions: Permission[]): Array<[string, Permission[]]> => {
  const groups = permissions.reduce((acc, permission) => {
    const category = permission.resource;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);
  
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
};

export default ClonePreview;
