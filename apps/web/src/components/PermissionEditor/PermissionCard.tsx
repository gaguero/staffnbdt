import React, { useState, useCallback } from 'react';
import {
  Eye as EyeIcon,
  X as XMarkIcon,
  AlertTriangle as ExclamationTriangleIcon,
  Link as LinkIcon,
  Info as InformationCircleIcon,
  Clock as ClockIcon,
  ArrowUpDown as ArrowsUpDownIcon,
  Sparkles as SparklesIcon
} from 'lucide-react';

import { 
  PermissionCardProps, 
  PermissionCardSize 
} from '../../types/permissionEditor';

// Resource icons mapping
const RESOURCE_ICONS: Record<string, string> = {
  user: '👤',
  role: '🎭',
  document: '📄',
  schedule: '📅',
  payroll: '💰',
  vacation: '🏖️',
  analytics: '📊',
  audit: '📋',
  system: '⚙️',
  organization: '🏢',
  property: '🏨',
  department: '🏬',
  training: '🎓',
  benefit: '🎁',
  inventory: '📦',
  maintenance: '🔧',
  security: '🔒',
  guest: '🎪',
  booking: '📝',
  billing: '💳'
};

// Action colors mapping
const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  read: 'bg-blue-100 text-blue-700',
  update: 'bg-yellow-100 text-yellow-700',
  delete: 'bg-red-100 text-red-700',
  manage: 'bg-purple-100 text-purple-700',
  approve: 'bg-emerald-100 text-emerald-700',
  reject: 'bg-red-100 text-red-700',
  export: 'bg-indigo-100 text-indigo-700',
  import: 'bg-cyan-100 text-cyan-700',
  assign: 'bg-orange-100 text-orange-700',
  revoke: 'bg-gray-100 text-gray-700'
};

// Scope colors mapping
const SCOPE_COLORS: Record<string, string> = {
  platform: 'bg-red-100 text-red-700',
  organization: 'bg-purple-100 text-purple-700',
  property: 'bg-blue-100 text-blue-700',
  department: 'bg-green-100 text-green-700',
  own: 'bg-gray-100 text-gray-700'
};

const PermissionCard: React.FC<PermissionCardProps> = ({
  permission,
  isSelected = false,
  isDragging = false,
  hasConflicts = false,
  hasDependencies = false,
  conditions = [],
  size = PermissionCardSize.MEDIUM,
  onSelect,
  onRemove,
  onShowDetails,
  className = '',
  showTooltip = true,
  showConditions = true
}) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Get size-specific classes
  const getSizeClasses = useCallback(() => {
    switch (size) {
      case PermissionCardSize.SMALL:
        return {
          container: 'p-2',
          title: 'text-xs font-medium',
          description: 'text-xs',
          badges: 'text-xs',
          spacing: 'space-y-1'
        };
      case PermissionCardSize.LARGE:
        return {
          container: 'p-4',
          title: 'text-base font-semibold',
          description: 'text-sm',
          badges: 'text-sm',
          spacing: 'space-y-3'
        };
      default: // MEDIUM
        return {
          container: 'p-3',
          title: 'text-sm font-medium',
          description: 'text-xs',
          badges: 'text-xs',
          spacing: 'space-y-2'
        };
    }
  }, [size]);

  const sizeClasses = getSizeClasses();

  // Get resource icon
  const getResourceIcon = useCallback(() => {
    return RESOURCE_ICONS[permission.resource] || '🔧';
  }, [permission.resource]);

  // Get action color class
  const getActionColorClass = useCallback(() => {
    return ACTION_COLORS[permission.action] || 'bg-gray-100 text-gray-700';
  }, [permission.action]);

  // Get scope color class
  const getScopeColorClass = useCallback(() => {
    return SCOPE_COLORS[permission.scope] || 'bg-gray-100 text-gray-700';
  }, [permission.scope]);

  // Format permission name
  const getDisplayName = useCallback(() => {
    return `${permission.resource}.${permission.action}`;
  }, [permission.resource, permission.action]);

  // Handle card click
  const handleCardClick = useCallback(() => {
    onSelect(permission);
  }, [onSelect, permission]);

  // Handle details click
  const handleDetailsClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onShowDetails(permission);
  }, [onShowDetails, permission]);

  // Handle remove click
  const handleRemoveClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(permission.id);
  }, [onRemove, permission.id]);

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'permission',
      permission
    }));
    e.dataTransfer.effectAllowed = 'move';
  }, [permission]);

  // Get card styling based on state
  const getCardStyling = useCallback(() => {
    let baseClasses = `relative border rounded-lg transition-all duration-200 cursor-pointer group ${sizeClasses.container}`;
    
    if (isDragging) {
      baseClasses += ' opacity-50 scale-95 rotate-2 shadow-lg';
    } else if (isSelected) {
      baseClasses += ' border-blue-500 bg-blue-50 shadow-md';
    } else if (hasConflicts) {
      baseClasses += ' border-red-200 bg-red-50 hover:border-red-300';
    } else {
      baseClasses += ' border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm';
    }

    return baseClasses;
  }, [isDragging, isSelected, hasConflicts, sizeClasses.container]);

  return (
    <div
      className={`${getCardStyling()} ${className}`}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable
      onDragStart={handleDragStart}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start space-x-2 flex-1 min-w-0">
          {/* Resource Icon */}
          <span className="text-lg flex-shrink-0" title={permission.resource}>
            {getResourceIcon()}
          </span>
          
          {/* Permission Name */}
          <div className="flex-1 min-w-0">
            <h4 className={`${sizeClasses.title} text-gray-900 truncate`} title={getDisplayName()}>
              {getDisplayName()}
            </h4>
            
            {/* Permission ID */}
            {size !== PermissionCardSize.SMALL && (
              <p className="text-xs text-gray-500 truncate font-mono">
                {permission.resource}.{permission.action}.{permission.scope}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`flex items-center space-x-1 ${isHovered || isSelected ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>
          <button
            onClick={handleDetailsClick}
            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors duration-200"
            title="View details"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          <button
            onClick={handleRemoveClick}
            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors duration-200"
            title="Remove permission"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Permission Badges */}
      <div className="flex items-center flex-wrap gap-1 mb-2">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full ${sizeClasses.badges} font-medium ${getActionColorClass()}`}>
          {permission.action}
        </span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full ${sizeClasses.badges} font-medium ${getScopeColorClass()}`}>
          {permission.scope}
        </span>
      </div>

      {/* Description */}
      {permission.description && size !== PermissionCardSize.SMALL && (
        <div className="mb-2">
          <p className={`${sizeClasses.description} text-gray-600 ${showFullDescription ? '' : 'line-clamp-2'}`}>
            {permission.description}
          </p>
          {permission.description.length > 100 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowFullDescription(!showFullDescription);
              }}
              className="text-xs text-blue-600 hover:text-blue-800 mt-1"
            >
              {showFullDescription ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}

      {/* Status Indicators */}
      <div className="flex items-center justify-between">
        {/* Issues and Indicators */}
        <div className="flex items-center space-x-2">
          {hasConflicts && (
            <div className="flex items-center space-x-1 text-red-600" title="Has conflicts">
              <ExclamationTriangleIcon className="h-3 w-3" />
              <span className="text-xs">Conflict</span>
            </div>
          )}
          
          {hasDependencies && (
            <div className="flex items-center space-x-1 text-blue-600" title="Has dependencies">
              <LinkIcon className="h-3 w-3" />
              <span className="text-xs">Deps</span>
            </div>
          )}

          {showConditions && conditions.length > 0 && (
            <div className="flex items-center space-x-1 text-amber-600" title="Has conditions">
              <InformationCircleIcon className="h-3 w-3" />
              <span className="text-xs">Conditional</span>
            </div>
          )}

          {/* Usage indicator */}
          {(permission as any).isPopular && (
            <div className="flex items-center space-x-1 text-green-600" title="Popular permission">
              <SparklesIcon className="h-3 w-3" />
            </div>
          )}

          {/* Recent indicator */}
          {(permission as any).isRecent && (
            <div className="flex items-center space-x-1 text-purple-600" title="Recently used">
              <ClockIcon className="h-3 w-3" />
            </div>
          )}
        </div>

        {/* Drag Handle */}
        <div className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <ArrowsUpDownIcon className="h-4 w-4" />
        </div>
      </div>

      {/* Conditions Details (when expanded) */}
      {showConditions && conditions.length > 0 && isSelected && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <h5 className="text-xs font-medium text-gray-700 mb-2 flex items-center space-x-1">
            <InformationCircleIcon className="h-3 w-3" />
            <span>Conditions</span>
          </h5>
          <div className="space-y-1">
            {conditions.map((condition, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs">
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                  <span className="font-medium text-amber-800">{condition.name}</span>
                </div>
                {condition.isActive ? (
                  <span className="text-green-600 font-medium">Active</span>
                ) : (
                  <span className="text-gray-500">Inactive</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tooltip (if enabled and has detailed info) */}
      {showTooltip && isHovered && !isDragging && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg max-w-xs pointer-events-none">
          <div className="font-medium mb-1">{getDisplayName()}</div>
          {permission.description && (
            <div className="text-gray-300 mb-2">{permission.description}</div>
          )}
          <div className="space-y-1">
            <div><strong>Resource:</strong> {permission.resource}</div>
            <div><strong>Action:</strong> {permission.action}</div>
            <div><strong>Scope:</strong> {permission.scope}</div>
            {conditions.length > 0 && (
              <div><strong>Conditions:</strong> {conditions.length}</div>
            )}
          </div>
          
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
};

export default PermissionCard;