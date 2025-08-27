import React from 'react';
import {
  ClockIcon,
  CheckIcon,
  UserGroupIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  CogIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import {
  ClockIcon as ClockSolidIcon,
  CheckIcon as CheckSolidIcon,
} from '@heroicons/react/24/solid';
import { PermissionSearchIndex } from '../../types/permissionSearch';

interface RecentPermissionsProps {
  permissions: PermissionSearchIndex[];
  selectedPermissions: Set<string>;
  onPermissionSelect: (permission: PermissionSearchIndex) => void;
  mode: 'single-select' | 'multi-select' | 'filter' | 'standalone' | 'inline' | 'modal';
  maxHeight?: number;
  className?: string;
}

const RESOURCE_ICONS: Record<string, React.ComponentType<any>> = {
  user: UserGroupIcon,
  document: DocumentTextIcon,
  training: AcademicCapIcon,
  permission: ShieldCheckIcon,
  role: ShieldCheckIcon,
  organization: BuildingOfficeIcon,
  property: BuildingOfficeIcon,
  default: CogIcon,
};

const CATEGORY_COLORS: Record<string, string> = {
  HR: 'blue',
  Training: 'green',
  Documents: 'purple',
  Operations: 'orange',
  Admin: 'red',
  Inventory: 'yellow',
  Maintenance: 'gray',
  'Front Desk': 'indigo',
  Financial: 'emerald',
};

export const RecentPermissions: React.FC<RecentPermissionsProps> = ({
  permissions,
  selectedPermissions,
  onPermissionSelect,
  mode,
  maxHeight = 400,
  className = '',
}) => {
  const getResourceIcon = (resource: string) => {
    const Icon = RESOURCE_ICONS[resource] || RESOURCE_ICONS.default;
    return Icon;
  };

  const getCategoryColor = (category: string) => {
    return CATEGORY_COLORS[category] || 'gray';
  };

  // Simulate recent usage timestamps (in a real app, this would come from actual usage data)
  const getRecentTimestamp = (index: number) => {
    const now = new Date();
    const hoursAgo = Math.floor(Math.random() * 24) + index; // Distribute across last 24+ hours
    return new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (permissions.length === 0) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
        <div className="p-8 text-center">
          <ClockIcon className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="text-lg font-medium text-gray-900 mt-4">No recent permissions</h3>
          <p className="text-sm text-gray-600 mt-2">
            Recently accessed permissions will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-green-50">
        <div className="flex items-center space-x-2">
          <ClockSolidIcon className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-green-900">
            Recent Permissions
          </h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {permissions.length} permissions
          </span>
        </div>
        <p className="text-sm text-green-700 mt-1">
          Permissions you've recently accessed or worked with
        </p>
      </div>

      {/* Permissions List */}
      <div className="overflow-y-auto" style={{ maxHeight: maxHeight - 100 }}>
        {permissions.map((permission, index) => {
          const isSelected = selectedPermissions.has(permission.name);
          const Icon = getResourceIcon(permission.resource);
          const categoryColor = getCategoryColor(permission.category);
          const timestamp = getRecentTimestamp(index);

          return (
            <button
              key={permission.id}
              onClick={() => onPermissionSelect(permission)}
              className={`
                w-full text-left p-4 border-b border-gray-100 last:border-b-0
                hover:bg-green-50 transition-colors
                focus:outline-none focus:bg-green-50 focus:ring-2 focus:ring-green-500 focus:ring-inset
                ${isSelected ? 'bg-green-50 border-green-200' : ''}
              `}
            >
              <div className="flex items-start space-x-4">
                {/* Timestamp */}
                <div className="flex-shrink-0 text-center min-w-[60px]">
                  <div className="text-xs font-medium text-green-600">
                    {formatTimestamp(timestamp)}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {timestamp.toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: true 
                    })}
                  </div>
                </div>

                {/* Selection Indicator */}
                {mode === 'multi-select' && (
                  <div className={`
                    flex-shrink-0 w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center
                    ${isSelected 
                      ? 'bg-green-600 border-green-600 text-white' 
                      : 'border-gray-300'
                    }
                  `}>
                    {isSelected && <CheckSolidIcon className="h-3 w-3" />}
                  </div>
                )}

                {/* Icon */}
                <div className={`
                  flex-shrink-0 p-2 rounded-md bg-${categoryColor}-100 text-${categoryColor}-600
                `}>
                  <Icon className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Display Name */}
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-medium text-gray-900 truncate">
                      {permission.displayName || permission.name}
                    </h4>
                    
                    {/* Recent Badge */}
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 flex-shrink-0 ml-2">
                      Recent
                    </span>
                  </div>

                  {/* Permission Name */}
                  <div className="mt-1">
                    <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {permission.name}
                    </code>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {permission.description}
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center space-x-4 mt-3">
                    <span className={`
                      inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                      bg-${categoryColor}-100 text-${categoryColor}-800
                    `}>
                      {permission.category}
                    </span>
                    
                    <span className="text-sm text-gray-500">
                      {permission.scope} scope
                    </span>
                    
                    {permission.popularity >= 70 && (
                      <span className="inline-flex items-center text-xs text-orange-600">
                        <span className="mr-1">🔥</span>
                        Popular
                      </span>
                    )}
                    
                    {permission.isConditional && (
                      <span className="inline-flex items-center text-xs text-amber-600">
                        <span className="mr-1">⚠️</span>
                        Conditional
                      </span>
                    )}
                  </div>

                  {/* Usage Context (simulated) */}
                  <div className="mt-2 text-xs text-gray-500">
                    {index % 3 === 0 && 'Used in role assignment'}
                    {index % 3 === 1 && 'Used in user management'}
                    {index % 3 === 2 && 'Used in permission review'}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>
            Showing your {permissions.length} most recent permissions
          </span>
          
          <button className="text-green-600 hover:text-green-800 font-medium">
            View All Recent Activity
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecentPermissions;
