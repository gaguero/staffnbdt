import React, { memo } from 'react';
import {
  ChevronRightIcon,
  ChevronDownIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { 
  PermissionTreeNodeProps,
  RESOURCE_ICONS,
  ACTION_ICONS,
  SCOPE_ICONS,
  PERMISSION_VIEWER_ICONS
} from '../../types/permissionViewer';

export const PermissionTreeNode: React.FC<PermissionTreeNodeProps> = memo(({
  node,
  level,
  onToggle,
  onSelect,
  isSelected,
  isExpanded,
  showCheckboxes,
  showCounts,
  showDescriptions,
  className = '',
}) => {
  const hasChildren = node.children.length > 0;
  const indentation = level * 20;

  // Get appropriate icon based on node type
  const getNodeIcon = () => {
    switch (node.type) {
      case 'resource':
        return RESOURCE_ICONS[node.name] || PERMISSION_VIEWER_ICONS.RESOURCE;
      case 'action':
        return ACTION_ICONS[node.name] || PERMISSION_VIEWER_ICONS.ACTION;
      case 'permission':
        if (node.permission) {
          return SCOPE_ICONS[node.permission.scope] || PERMISSION_VIEWER_ICONS.PERMISSION;
        }
        return PERMISSION_VIEWER_ICONS.PERMISSION;
      default:
        return '📝';
    }
  };

  // Get node display name
  const getDisplayName = () => {
    if (node.type === 'permission' && node.permission) {
      return `${node.permission.resource}.${node.permission.action}.${node.permission.scope}`;
    }
    return node.name;
  };

  // Get node styling based on type and state
  const getNodeStyling = () => {
    const baseClasses = "flex items-center space-x-2 py-2 px-2 rounded cursor-pointer transition-colors";
    
    if (isSelected) {
      return `${baseClasses} bg-blue-50 border border-blue-200 text-blue-900`;
    }
    
    switch (node.type) {
      case 'resource':
        return `${baseClasses} hover:bg-gray-50 font-medium text-gray-900`;
      case 'action':
        return `${baseClasses} hover:bg-gray-50 font-medium text-gray-800`;
      case 'permission':
        return `${baseClasses} hover:bg-gray-50 text-gray-700 text-sm`;
      default:
        return `${baseClasses} hover:bg-gray-50`;
    }
  };

  // Handle node click
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (hasChildren) {
      onToggle(node.id);
    }
    
    if (showCheckboxes || node.type === 'permission') {
      onSelect(node.id, node.permission);
    }
  };

  // Handle checkbox change
  const handleCheckboxChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(node.id, node.permission);
  };

  // Handle expand/collapse click
  const handleExpandClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggle(node.id);
  };

  return (
    <div className={`${className}`} style={{ marginLeft: `${indentation}px` }}>
      <div className={getNodeStyling()} onClick={handleClick}>
        {/* Expand/Collapse Button */}
        {hasChildren && (
          <button
            onClick={handleExpandClick}
            className="flex-shrink-0 p-1 hover:bg-gray-200 rounded"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 text-gray-500" />
            )}
          </button>
        )}

        {/* Spacer for nodes without children */}
        {!hasChildren && (
          <div className="w-6 flex-shrink-0"></div>
        )}

        {/* Checkbox */}
        {showCheckboxes && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleCheckboxChange}
            onClick={handleCheckboxChange}
            className="flex-shrink-0 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        )}

        {/* Node Icon */}
        <span className="flex-shrink-0 text-lg" title={`${node.type}: ${node.name}`}>
          {getNodeIcon()}
        </span>

        {/* Node Name */}
        <span className="flex-1 truncate" title={getDisplayName()}>
          {getDisplayName()}
        </span>

        {/* Count Badge */}
        {showCounts && node.count && node.count > 0 && (
          <span className="flex-shrink-0 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
            {node.count}
          </span>
        )}

        {/* Permission Scope Badge */}
        {node.type === 'permission' && node.permission && (
          <span
            className={`flex-shrink-0 text-xs px-2 py-1 rounded-full border ${
              node.permission.scope === 'platform' ? 'bg-purple-100 text-purple-800 border-purple-200' :
              node.permission.scope === 'organization' ? 'bg-blue-100 text-blue-800 border-blue-200' :
              node.permission.scope === 'property' ? 'bg-green-100 text-green-800 border-green-200' :
              node.permission.scope === 'department' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
              'bg-gray-100 text-gray-800 border-gray-200'
            }`}
          >
            {node.permission.scope}
          </span>
        )}

        {/* Description Info Icon */}
        {showDescriptions && node.description && (
          <InformationCircleIcon 
            className="flex-shrink-0 h-4 w-4 text-gray-400 hover:text-gray-600" 
            title={node.description}
          />
        )}
      </div>

      {/* Description */}
      {showDescriptions && node.description && isExpanded && (
        <div className="ml-8 mt-1 text-xs text-gray-500 italic">
          {node.description}
        </div>
      )}

      {/* Permission Details */}
      {node.type === 'permission' && node.permission && isSelected && (
        <div className="ml-8 mt-2 p-3 bg-blue-50 border border-blue-200 rounded text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-medium text-gray-700">Resource:</span>
              <span className="ml-1 text-gray-600">{node.permission.resource}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Action:</span>
              <span className="ml-1 text-gray-600">{node.permission.action}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Scope:</span>
              <span className="ml-1 text-gray-600">{node.permission.scope}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">ID:</span>
              <span className="ml-1 text-gray-600 font-mono">{node.permission.id}</span>
            </div>
          </div>
          {node.permission.conditions && (
            <div className="mt-2">
              <span className="font-medium text-gray-700">Conditions:</span>
              <pre className="mt-1 text-gray-600 bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                {JSON.stringify(node.permission.conditions, null, 2)}
              </pre>
            </div>
          )}
          {node.permission.description && (
            <div className="mt-2">
              <span className="font-medium text-gray-700">Description:</span>
              <p className="mt-1 text-gray-600">{node.permission.description}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

PermissionTreeNode.displayName = 'PermissionTreeNode';

export default PermissionTreeNode;