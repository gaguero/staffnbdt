import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Copy,
  Users,
  Calendar,
  Tag,
  ExternalLink
} from 'lucide-react';
import {
  RoleLineage,
  RoleLineageTreeProps,
  CloneType
} from '../../types/roleDuplication';

const RoleLineageTree: React.FC<RoleLineageTreeProps> = ({
  rootRole,
  selectedRoleId,
  onRoleSelect,
  onCloneRole,
  showCloneActions = true,
  maxDepth = 5,
  className = ''
}) => {
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set([rootRole.id]));

  const toggleExpanded = (roleId: string) => {
    setExpandedRoles(prev => {
      const next = new Set(prev);
      if (next.has(roleId)) {
        next.delete(roleId);
      } else {
        next.add(roleId);
      }
      return next;
    });
  };

  const getCloneTypeIcon = (cloneType?: CloneType) => {
    switch (cloneType) {
      case 'full': return '🔄';
      case 'permissions': return '🔑';
      case 'template': return '📋';
      case 'partial': return '⚙️';
      case 'hierarchy': return '🏗️';
      default: return '📄';
    }
  };

  const getCloneTypeColor = (cloneType?: CloneType) => {
    switch (cloneType) {
      case 'full': return 'text-blue-600 bg-blue-50';
      case 'permissions': return 'text-green-600 bg-green-50';
      case 'template': return 'text-purple-600 bg-purple-50';
      case 'partial': return 'text-orange-600 bg-orange-50';
      case 'hierarchy': return 'text-indigo-600 bg-indigo-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const renderRole = (role: RoleLineage, depth: number = 0) => {
    const isExpanded = expandedRoles.has(role.id);
    const hasChildren = role.childRoles.length > 0;
    const isSelected = role.id === selectedRoleId;
    const isOriginal = role.generationLevel === 0;
    const canExpand = hasChildren && depth < maxDepth;

    return (
      <div key={role.id} className="select-none">
        {/* Role Node */}
        <div
          className={`
            flex items-center space-x-2 p-3 rounded-lg transition-all cursor-pointer
            ${isSelected 
              ? 'bg-blue-100 border-2 border-blue-300 shadow-sm' 
              : 'hover:bg-gray-50 border-2 border-transparent'
            }
            ${depth > 0 ? 'ml-6' : ''}
          `}
          onClick={() => onRoleSelect?.(role)}
        >
          {/* Expand/Collapse Button */}
          <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
            {canExpand ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(role.id);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : hasChildren ? (
              <div className="w-2 h-2 bg-gray-300 rounded-full" />
            ) : null}
          </div>

          {/* Role Icon */}
          <div className={`
            p-2 rounded-lg flex-shrink-0
            ${isOriginal ? 'bg-green-100 text-green-600' : getCloneTypeColor(role.cloneType)}
          `}>
            {isOriginal ? (
              <Users className="h-5 w-5" />
            ) : (
              <Copy className="h-5 w-5" />
            )}
          </div>

          {/* Role Information */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className={`
                font-medium truncate
                ${isSelected ? 'text-blue-900' : 'text-gray-900'}
              `}>
                {role.name}
              </h4>
              
              {/* Generation Badge */}
              <span className={`
                px-2 py-1 text-xs font-medium rounded-full
                ${role.generationLevel === 0 
                  ? 'bg-green-100 text-green-800'
                  : role.generationLevel === 1
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-purple-100 text-purple-800'
                }
              `}>
                {role.generationLevel === 0 ? 'Original' : `Gen ${role.generationLevel}`}
              </span>
              
              {/* Clone Type Badge */}
              {role.cloneType && (
                <span className={`
                  px-2 py-1 text-xs font-medium rounded-full border
                  ${getCloneTypeColor(role.cloneType)}
                `}>
                  {getCloneTypeIcon(role.cloneType)} {role.cloneType.replace('_', ' ')}
                </span>
              )}
            </div>
            
            {/* Role Metadata */}
            <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Users className="h-3 w-3" />
                <span>{role.cloneCount} clones</span>
              </div>
              
              {role.clonedAt && (
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(role.clonedAt).toLocaleDateString()}</span>
                </div>
              )}
              
              {role.lineagePath.length > 1 && (
                <div className="flex items-center space-x-1">
                  <Tag className="h-3 w-3" />
                  <span>Path: {role.lineagePath.length - 1} ancestors</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {showCloneActions && (
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloneRole?.(role);
                }}
                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Clone this role"
              >
                <Copy className="h-4 w-4" />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Open role in new tab/window
                  window.open(`/admin/roles/${role.id}`, '_blank');
                }}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
                title="Open role details"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Children */}
        {isExpanded && hasChildren && depth < maxDepth && (
          <div className="relative">
            {/* Connection Lines */}
            <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-200" />
            
            {/* Child Roles */}
            <div className="space-y-1">
              {role.childRoles.map((childRole, index) => (
                <div key={childRole.id} className="relative">
                  {/* Horizontal connector */}
                  <div className="absolute left-3 top-6 w-4 h-px bg-gray-200" />
                  
                  {/* Last child indicator */}
                  {index === role.childRoles.length - 1 && (
                    <div className="absolute left-3 top-6 bottom-0 w-px bg-white" />
                  )}
                  
                  {renderRole(childRole, depth + 1)}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Max Depth Indicator */}
        {hasChildren && depth >= maxDepth && (
          <div className="ml-12 p-2 text-xs text-gray-500 italic">
            ... {role.childRoles.length} more descendants (max depth reached)
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Role Lineage</h3>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded" />
            <span>Original Role</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded" />
            <span>First Generation</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-100 border border-purple-300 rounded" />
            <span>Later Generations</span>
          </div>
        </div>
      </div>

      {/* Tree */}
      <div className="space-y-1">
        {renderRole(rootRole)}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-lg font-semibold text-gray-900">
              {countTotalRoles(rootRole)}
            </div>
            <div className="text-sm text-gray-600">Total Roles</div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-lg font-semibold text-gray-900">
              {getMaxDepth(rootRole)}
            </div>
            <div className="text-sm text-gray-600">Max Depth</div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-lg font-semibold text-gray-900">
              {rootRole.cloneCount}
            </div>
            <div className="text-sm text-gray-600">Direct Clones</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions
const countTotalRoles = (role: RoleLineage): number => {
  return 1 + role.childRoles.reduce((sum, child) => sum + countTotalRoles(child), 0);
};

const getMaxDepth = (role: RoleLineage, currentDepth: number = 0): number => {
  if (role.childRoles.length === 0) {
    return currentDepth;
  }
  
  return Math.max(
    ...role.childRoles.map(child => getMaxDepth(child, currentDepth + 1))
  );
};

export default RoleLineageTree;
