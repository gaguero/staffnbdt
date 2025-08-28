import React from 'react';
import { Role } from '../types/role';
import { SYSTEM_ROLES, isSystemRole, formatRoleName } from '../types/role';

export interface RoleBadgeProps {
  /** System role enum value or custom role name */
  role: string | Role;
  /** Whether this is a custom role (not a system role) */
  isCustomRole?: boolean;
  /** Size variant for the badge */
  size?: 'sm' | 'md' | 'lg';
  /** Show role description in tooltip */
  showTooltip?: boolean;
  /** Additional custom roles data for tooltip */
  customRoles?: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
  /** Additional CSS classes */
  className?: string;
}

const SYSTEM_ROLE_CONFIG = {
  [Role.PLATFORM_ADMIN]: {
    colorClasses: 'bg-red-100 text-red-800 border-red-200',
    darkColorClasses: 'dark:bg-red-900 dark:text-red-200 dark:border-red-700'
  },
  [Role.ORGANIZATION_OWNER]: {
    colorClasses: 'bg-purple-100 text-purple-800 border-purple-200',
    darkColorClasses: 'dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700'
  },
  [Role.ORGANIZATION_ADMIN]: {
    colorClasses: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    darkColorClasses: 'dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-700'
  },
  [Role.PROPERTY_MANAGER]: {
    colorClasses: 'bg-blue-100 text-blue-800 border-blue-200',
    darkColorClasses: 'dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700'
  },
  [Role.DEPARTMENT_ADMIN]: {
    colorClasses: 'bg-green-100 text-green-800 border-green-200',
    darkColorClasses: 'dark:bg-green-900 dark:text-green-200 dark:border-green-700'
  },
  [Role.STAFF]: {
    colorClasses: 'bg-gray-100 text-gray-800 border-gray-200',
    darkColorClasses: 'dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'
  }
};

const CUSTOM_ROLE_CONFIG = {
  colorClasses: 'bg-violet-100 text-violet-800 border-violet-200',
  darkColorClasses: 'dark:bg-violet-900 dark:text-violet-200 dark:border-violet-700',
  icon: '🎭'
};

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base'
};

const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  isCustomRole = false,
  size = 'md',
  showTooltip = true,
  customRoles = [],
  className = ''
}) => {
  // Determine if this is a system role
  const isSystem = !isCustomRole && isSystemRole(role as string);
  
  // Get configuration for the role
  const roleKey = role as Role;
  const systemRoleInfo = isSystem && Object.prototype.hasOwnProperty.call(SYSTEM_ROLES, roleKey) ? SYSTEM_ROLES[roleKey] : null;
  const systemConfig = isSystem && Object.prototype.hasOwnProperty.call(SYSTEM_ROLE_CONFIG, roleKey) ? SYSTEM_ROLE_CONFIG[roleKey as keyof typeof SYSTEM_ROLE_CONFIG] : null;
  const customRoleData = isCustomRole ? customRoles.find(r => r.name === role) : false;
  
  // Determine display properties
  const label = systemRoleInfo?.label || (customRoleData && typeof customRoleData !== 'boolean' ? customRoleData.name : undefined) || formatRoleName(role as string);
  const description = systemRoleInfo?.description || (customRoleData && typeof customRoleData !== 'boolean' ? customRoleData.description : undefined) || '';
  const icon = systemRoleInfo?.icon || CUSTOM_ROLE_CONFIG.icon;
  const colorClasses = systemConfig?.colorClasses || CUSTOM_ROLE_CONFIG.colorClasses;
  const darkColorClasses = systemConfig?.darkColorClasses || CUSTOM_ROLE_CONFIG.darkColorClasses;
  
  const badgeClasses = [
    'inline-flex items-center gap-1.5',
    'font-medium rounded-full border',
    'transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-opacity-50',
    SIZE_CLASSES[size],
    colorClasses,
    darkColorClasses,
    className
  ].join(' ');

  const BadgeContent = () => (
    <span className={badgeClasses}>
      <span className="leading-none" role="img" aria-hidden="true">
        {icon}
      </span>
      <span className="truncate max-w-32">
        {label}
      </span>
      {isCustomRole && !isSystem && (
        <span 
          className="text-xs opacity-75" 
          title="Custom Role"
          aria-label="Custom Role"
        >
          ✨
        </span>
      )}
    </span>
  );

  // If tooltip is disabled or no description, return simple badge
  if (!showTooltip || !description) {
    return <BadgeContent />;
  }

  // Return badge with tooltip
  return (
    <div className="relative group inline-block">
      <BadgeContent />
      
      {/* Tooltip */}
      <div 
        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 
                   bg-gray-900 text-white text-sm rounded-lg shadow-lg 
                   opacity-0 group-hover:opacity-100 transition-opacity duration-200 
                   pointer-events-none z-50 whitespace-nowrap max-w-xs"
        role="tooltip"
        aria-hidden="true"
      >
        <div className="font-medium">{label}</div>
        <div className="text-xs text-gray-300 mt-1">{description}</div>
        
        {/* Tooltip arrow */}
        <div 
          className="absolute top-full left-1/2 transform -translate-x-1/2 
                     w-0 h-0 border-l-4 border-r-4 border-t-4 
                     border-l-transparent border-r-transparent border-t-gray-900"
        />
      </div>
    </div>
  );
};

export default RoleBadge;