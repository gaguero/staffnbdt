import React, { useState, useMemo, useCallback } from 'react';
import {
  Trash2 as TrashIcon,
  Grid3x3 as Squares2X2Icon,
  List as ListBulletIcon,
  Menu as Bars3Icon,
  ArrowUpDown as ArrowsUpDownIcon,
  AlertTriangle as ExclamationTriangleIcon,
  Info as InformationCircleIcon,
  X as XMarkIcon,
  Eye as EyeIcon,
  Link as LinkIcon,
} from 'lucide-react';

import { 
  PermissionWorkspaceProps, 
  PermissionCard as PermissionCardType
} from '../../types/permissionEditor';
import { Permission } from '../../types/permission';

const PermissionWorkspace: React.FC<PermissionWorkspaceProps> = ({
  permissions,
  validationErrors,
  onPermissionRemove,
  onDropPermission,
  className = '',
  layout = 'grouped',
  showConflicts = true,
  showDependencies = true
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>(
    layout === 'grid' ? 'grid' : layout === 'list' ? 'list' : 'compact'
  );
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  // Group permissions by category
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, PermissionCardType[]> = {};
    
    permissions.forEach(permissionCard => {
      const category = permissionCard.permission.resource || 'other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(permissionCard);
    });

    // Sort groups by name
    const sortedGroups: Record<string, PermissionCardType[]> = {};
    Object.keys(groups)
      .sort()
      .forEach(key => {
        sortedGroups[key] = groups[key].sort((a, b) => 
          `${a.permission.resource}.${a.permission.action}`.localeCompare(`${b.permission.resource}.${b.permission.action}`)
        );
      });

    return sortedGroups;
  }, [permissions]);

  // Get conflicts and dependencies summary
  const conflictsSummary = useMemo(() => {
    const allConflicts = permissions.flatMap(p => p.conflicts);
    const allDependencies = permissions.flatMap(p => p.dependencies);
    
    return {
      conflictCount: new Set(allConflicts).size,
      dependencyCount: new Set(allDependencies).size,
      hasIssues: allConflicts.length > 0 || validationErrors.length > 0
    };
  }, [permissions, validationErrors]);

  // Handle drag over for drop zone
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // Handle drop in workspace
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
      if (dragData.type === 'permission' && dragData.permission) {
        onDropPermission(dragData.permission, {
          id: 'workspace',
          name: 'Role Permissions',
          description: 'Drop permissions here to add to role',
          accepts: () => true,
          onDrop: () => {},
          className: '',
          isActive: true
        });
      }
    } catch (error) {
      console.error('Invalid drag data:', error);
    }
  }, [onDropPermission]);

  // Handle permission card selection
  const handleCardSelect = useCallback((permission: Permission) => {
    setSelectedCard(selectedCard === permission.id ? null : permission.id);
  }, [selectedCard]);

  // Handle permission removal
  const handlePermissionRemove = useCallback((permissionId: string) => {
    onPermissionRemove(permissionId);
    if (selectedCard === permissionId) {
      setSelectedCard(null);
    }
  }, [onPermissionRemove, selectedCard]);

  // Handle permission details
  const handleShowDetails = useCallback((permission: Permission) => {
    setSelectedCard(permission.id);
    // Could expand to show details panel in future
  }, []);

  // Render permission card
  const renderPermissionCard = useCallback((permissionCard: PermissionCardType) => {
    const isSelected = selectedCard === permissionCard.permission.id;
    const hasConflicts = showConflicts && permissionCard.conflicts.length > 0;
    const hasDependencies = showDependencies && permissionCard.dependencies.length > 0;

    return (
      <div
        key={permissionCard.permission.id}
        className="group relative"
        data-permission-id={permissionCard.permission.id}
      >
        {/* Permission Card */}
        <div
          className={`p-3 border rounded-lg transition-all duration-200 cursor-pointer ${
            isSelected
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : hasConflicts
              ? 'border-red-200 bg-red-50 hover:border-red-300'
              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
          }`}
          onClick={() => handleCardSelect(permissionCard.permission)}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('application/json', JSON.stringify({
              type: 'permission',
              permission: permissionCard.permission
            }));
            e.dataTransfer.effectAllowed = 'move';
          }}
        >
          {/* Card Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {`${permissionCard.permission.resource}.${permissionCard.permission.action}`}
              </h4>
              <div className="flex items-center space-x-1 mt-1">
                <span className="inline-block px-1.5 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                  {permissionCard.permission.resource}
                </span>
                <span className="inline-block px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                  {permissionCard.permission.action}
                </span>
                <span className="inline-block px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                  {permissionCard.permission.scope}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShowDetails(permissionCard.permission);
                }}
                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded"
                title="View details"
              >
                <EyeIcon className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePermissionRemove(permissionCard.permission.id);
                }}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded"
                title="Remove from role"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Description */}
          {permissionCard.permission.description && (
            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
              {permissionCard.permission.description}
            </p>
          )}

          {/* Conflicts and Dependencies Indicators */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {hasConflicts && (
                <div className="flex items-center space-x-1 text-red-600">
                  <ExclamationTriangleIcon className="h-3 w-3" />
                  <span className="text-xs font-medium">
                    {permissionCard.conflicts.length} conflict{permissionCard.conflicts.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              
              {hasDependencies && (
                <div className="flex items-center space-x-1 text-blue-600">
                  <LinkIcon className="h-3 w-3" />
                  <span className="text-xs">
                    {permissionCard.dependencies.length} dep{permissionCard.dependencies.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {permissionCard.conditions.length > 0 && (
                <div className="flex items-center space-x-1 text-amber-600">
                  <InformationCircleIcon className="h-3 w-3" />
                  <span className="text-xs">Conditional</span>
                </div>
              )}
            </div>

            {/* Drag Handle */}
            <div className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <ArrowsUpDownIcon className="h-4 w-4" />
            </div>
          </div>

          {/* Expanded Details */}
          {isSelected && (hasConflicts || hasDependencies || permissionCard.conditions.length > 0) && (
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
              {hasConflicts && (
                <div>
                  <h5 className="text-xs font-medium text-red-700 mb-1">Conflicts:</h5>
                  <div className="space-y-1">
                    {permissionCard.conflicts.slice(0, 3).map((conflictId, idx) => {
                      const conflictPermission = permissions.find(p => p.permission.id === conflictId)?.permission;
                      return (
                        <div key={idx} className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                          {conflictPermission ? `${conflictPermission.resource}.${conflictPermission.action}.${conflictPermission.scope}` : conflictId}
                        </div>
                      );
                    })}
                    {permissionCard.conflicts.length > 3 && (
                      <div className="text-xs text-red-500">
                        +{permissionCard.conflicts.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              {hasDependencies && (
                <div>
                  <h5 className="text-xs font-medium text-blue-700 mb-1">Dependencies:</h5>
                  <div className="space-y-1">
                    {permissionCard.dependencies.slice(0, 3).map((depId, idx) => {
                      const depPermission = permissions.find(p => p.permission.id === depId)?.permission;
                      return (
                        <div key={idx} className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {depPermission ? `${depPermission.resource}.${depPermission.action}.${depPermission.scope}` : depId}
                        </div>
                      );
                    })}
                    {permissionCard.dependencies.length > 3 && (
                      <div className="text-xs text-blue-500">
                        +{permissionCard.dependencies.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              {permissionCard.conditions.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-amber-700 mb-1">Conditions:</h5>
                  <div className="space-y-1">
                    {permissionCard.conditions.map((condition, idx) => (
                      <div key={idx} className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                        {condition.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }, [
    selectedCard, 
    showConflicts, 
    showDependencies, 
    permissions,
    handleCardSelect, 
    handleShowDetails, 
    handlePermissionRemove
  ]);

  // Render grid layout
  const renderGridLayout = useCallback(() => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4">
      {permissions.map((permissionCard) => renderPermissionCard(permissionCard))}
    </div>
  ), [permissions, renderPermissionCard]);

  // Render list layout
  const renderListLayout = useCallback(() => (
    <div className="space-y-2 p-4">
      {permissions.map((permissionCard) => renderPermissionCard(permissionCard))}
    </div>
  ), [permissions, renderPermissionCard]);

  // Render grouped layout
  const renderGroupedLayout = useCallback(() => (
    <div className="p-4 space-y-6">
      {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
        <div key={category} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 capitalize">
              {category} ({categoryPermissions.length})
            </h3>
            <div className="h-px bg-gray-200 flex-1 ml-3" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {categoryPermissions.map((permissionCard) => 
              renderPermissionCard(permissionCard)
            )}
          </div>
        </div>
      ))}
    </div>
  ), [groupedPermissions, renderPermissionCard]);

  return (
    <div 
      className={`flex flex-col h-full bg-white ${className}`}
      data-drop-zone="workspace"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Selected Permissions ({permissions.length})
          </h3>
          
          {conflictsSummary.hasIssues && (
            <div className="flex items-center space-x-2 text-sm">
              {conflictsSummary.conflictCount > 0 && (
                <span className="flex items-center space-x-1 text-red-600">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <span>{conflictsSummary.conflictCount} conflicts</span>
                </span>
              )}
              {validationErrors.length > 0 && (
                <span className="flex items-center space-x-1 text-amber-600">
                  <InformationCircleIcon className="h-4 w-4" />
                  <span>{validationErrors.length} issues</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* View Controls */}
        <div className="flex items-center space-x-2">
          {/* Layout Toggle */}
          <div className="flex items-center border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              title="Grid view"
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 ${viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              title="List view"
            >
              <ListBulletIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`p-1.5 ${viewMode === 'compact' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              title="Grouped view"
            >
              <Bars3Icon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {permissions.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <TrashIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Permissions Selected</h4>
            <p className="text-gray-600 text-center max-w-xs mb-4">
              Drag permissions from the palette on the left to build your role
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Drag & drop permissions to add them</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Click on permissions to view details</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Use templates for quick setup</span>
              </div>
            </div>
          </div>
        ) : (
          /* Content Based on View Mode */
          <>
            {viewMode === 'grid' && renderGridLayout()}
            {viewMode === 'list' && renderListLayout()}
            {viewMode === 'compact' && renderGroupedLayout()}
          </>
        )}
      </div>

      {/* Footer */}
      {permissions.length > 0 && (
        <div className="border-t border-gray-200 p-3 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>{permissions.length} permissions selected</span>
              {conflictsSummary.conflictCount > 0 && (
                <span className="text-red-600">
                  {conflictsSummary.conflictCount} conflicts detected
                </span>
              )}
              {conflictsSummary.dependencyCount > 0 && (
                <span className="text-blue-600">
                  {conflictsSummary.dependencyCount} dependencies
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs">Drop zone active</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionWorkspace;