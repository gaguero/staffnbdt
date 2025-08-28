import React from 'react';
import RoleBadge from './RoleBadge';
import { Role } from '../types/role';

export interface RoleBadgeGroupProps {
  /** Primary system role */
  systemRole: string | Role;
  /** Additional custom roles assigned to the user */
  customRoles?: Array<{
    id: string;
    name: string;
    description?: string;
    level?: number;
  }>;
  /** Size variant for all badges */
  size?: 'sm' | 'md' | 'lg';
  /** Maximum number of badges to show before collapsing */
  maxVisible?: number;
  /** Show role descriptions in tooltips */
  showTooltips?: boolean;
  /** Layout direction */
  direction?: 'horizontal' | 'vertical';
  /** Additional CSS classes */
  className?: string;
}

const RoleBadgeGroup: React.FC<RoleBadgeGroupProps> = ({
  systemRole,
  customRoles = [],
  size = 'md',
  maxVisible = 3,
  showTooltips = true,
  direction = 'horizontal',
  className = ''
}) => {
  const totalRoles = 1 + customRoles.length; // System role + custom roles
  const hasMoreRoles = totalRoles > maxVisible;
  const visibleCustomRoles = hasMoreRoles 
    ? customRoles.slice(0, maxVisible - 1) 
    : customRoles;
  const hiddenRoleCount = totalRoles - maxVisible;

  const containerClasses = [
    'flex items-center',
    direction === 'horizontal' ? 'flex-row gap-1.5' : 'flex-col gap-1',
    className
  ].join(' ');

  const MoreRolesBadge = () => {
    if (!hasMoreRoles || hiddenRoleCount <= 0) return null;

    const remainingRoles = customRoles.slice(maxVisible - 1);
    const tooltipContent = remainingRoles
      .map(role => role.name)
      .join(', ');

    return (
      <div className="relative group inline-block">
        <span className={`
          inline-flex items-center justify-center
          ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 
            size === 'md' ? 'px-2.5 py-1 text-sm' : 
            'px-3 py-1.5 text-base'}
          font-medium rounded-full border
          bg-gray-50 text-gray-600 border-gray-300
          hover:bg-gray-100 transition-colors duration-200
          cursor-help
        `}>
          +{hiddenRoleCount}
        </span>

        {/* Tooltip for additional roles */}
        {showTooltips && tooltipContent && (
          <div 
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 
                       bg-gray-900 text-white text-sm rounded-lg shadow-lg 
                       opacity-0 group-hover:opacity-100 transition-opacity duration-200 
                       pointer-events-none z-50 whitespace-nowrap max-w-xs"
            role="tooltip"
            aria-hidden="true"
          >
            <div className="font-medium">Additional Roles:</div>
            <div className="text-xs text-gray-300 mt-1">{tooltipContent}</div>
            
            {/* Tooltip arrow */}
            <div 
              className="absolute top-full left-1/2 transform -translate-x-1/2 
                         w-0 h-0 border-l-4 border-r-4 border-t-4 
                         border-l-transparent border-r-transparent border-t-gray-900"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={containerClasses} role="group" aria-label="User roles">
      {/* Primary system role */}
      <RoleBadge
        role={systemRole}
        isCustomRole={false}
        size={size}
        showTooltip={showTooltips}
      />

      {/* Visible custom roles */}
      {visibleCustomRoles.map((customRole) => (
        <RoleBadge
          key={customRole.id}
          role={customRole.name}
          isCustomRole={true}
          size={size}
          showTooltip={showTooltips}
          customRoles={[customRole]}
        />
      ))}

      {/* More roles indicator */}
      <MoreRolesBadge />
    </div>
  );
};

export default RoleBadgeGroup;