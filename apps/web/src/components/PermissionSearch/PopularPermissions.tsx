import React from 'react';
import {
  Flame,
  Check,
  Users,
  File,
  GraduationCap,
  Shield,
  Settings,
  Building,
} from 'lucide-react';
import { PermissionSearchIndex } from '../../types/permissionSearch';

interface PopularPermissionsProps {
  permissions: PermissionSearchIndex[];
  selectedPermissions: Set<string>;
  onPermissionSelect: (permission: PermissionSearchIndex) => void;
  mode: 'single-select' | 'multi-select' | 'filter' | 'standalone' | 'inline' | 'modal';
  maxHeight?: number;
  className?: string;
}

const RESOURCE_ICONS: Record<string, React.ComponentType<any>> = {
  user: Users,
  document: File,
  training: GraduationCap,
  permission: Shield,
  role: Shield,
  organization: Building,
  property: Building,
  default: Settings,
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

export const PopularPermissions: React.FC<PopularPermissionsProps> = ({
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

  const getPopularityLevel = (popularity: number) => {
    if (popularity >= 80) return { level: 'Very High', color: 'red', flames: 3 };
    if (popularity >= 60) return { level: 'High', color: 'orange', flames: 2 };
    if (popularity >= 40) return { level: 'Medium', color: 'yellow', flames: 1 };
    return { level: 'Low', color: 'gray', flames: 0 };
  };

  if (permissions.length === 0) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
        <div className="p-8 text-center">
          <Flame className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="text-lg font-medium text-gray-900 mt-4">No popular permissions</h3>
          <p className="text-sm text-gray-600 mt-2">
            Popular permissions will appear here based on usage patterns
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-orange-50">
        <div className="flex items-center space-x-2">
          <Flame className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-orange-900">
            Popular Permissions
          </h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            {permissions.length} permissions
          </span>
        </div>
        <p className="text-sm text-orange-700 mt-1">
          Most frequently used permissions across the system
        </p>
      </div>

      {/* Permissions List */}
      <div className="overflow-y-auto" style={{ maxHeight: maxHeight - 100 }}>
        {permissions.map((permission, index) => {
          const isSelected = selectedPermissions.has(permission.name);
          const Icon = getResourceIcon(permission.resource);
          const categoryColor = getCategoryColor(permission.category);
          const popularityInfo = getPopularityLevel(permission.popularity);

          return (
            <button
              key={permission.id}
              onClick={() => onPermissionSelect(permission)}
              className={`
                w-full text-left p-4 border-b border-gray-100 last:border-b-0
                hover:bg-orange-50 transition-colors
                focus:outline-none focus:bg-orange-50 focus:ring-2 focus:ring-orange-500 focus:ring-inset
                ${isSelected ? 'bg-orange-50 border-orange-200' : ''}
              `}
            >
              <div className="flex items-start space-x-4">
                {/* Popularity Rank */}
                <div className="flex-shrink-0 w-8 text-center">
                  <div className="text-lg font-bold text-orange-600">#{index + 1}</div>
                </div>

                {/* Selection Indicator */}
                {mode === 'multi-select' && (
                  <div className={`
                    flex-shrink-0 w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center
                    ${isSelected 
                      ? 'bg-orange-600 border-orange-600 text-white' 
                      : 'border-gray-300'
                    }
                  `}>
                    {isSelected && <Check className="h-3 w-3" />}
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
                  {/* Display Name and Popularity */}
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-medium text-gray-900 truncate">
                      {permission.displayName || permission.name}
                    </h4>
                    
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {/* Popularity Flames */}
                      <div className="flex items-center space-x-0.5">
                        {Array.from({ length: 3 }, (_, i) => (
                          <Flame
                            key={i}
                            className={`h-3 w-3 ${
                              i < popularityInfo.flames 
                                ? 'text-orange-500' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      
                      {/* Popularity Score */}
                      <span className={`
                        inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                        bg-${popularityInfo.color}-100 text-${popularityInfo.color}-800
                      `}>
                        {permission.popularity}%
                      </span>
                    </div>
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
                    
                    <span className={`
                      text-xs text-${popularityInfo.color}-600 font-medium
                    `}>
                      {popularityInfo.level} Usage
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 bg-gray-50 text-center">
        <p className="text-xs text-gray-600">
          Popularity is calculated based on usage frequency and common workflows
        </p>
      </div>
    </div>
  );
};

export default PopularPermissions;
