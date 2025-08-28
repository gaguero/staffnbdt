import React, { useState } from 'react';
import { MatrixUser, MatrixRole, UserRoleMatrixRowProps } from '../../types/userRoleMatrix';

interface RoleCellProps {
  user: MatrixUser;
  role: MatrixRole;
  isAssigned: boolean;
  isOptimistic?: boolean;
  onToggle: (userId: string, roleId: string, isAssigned: boolean) => void;
  isRoleSelected: boolean;
  canAssign: boolean;
  canUnassign: boolean;
}

const RoleCell: React.FC<RoleCellProps> = ({
  user,
  role,
  isAssigned,
  isOptimistic = false,
  onToggle,
  isRoleSelected,
  canAssign,
  canUnassign,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const canToggle = isAssigned ? canUnassign : canAssign;
  
  const handleToggle = () => {
    if (canToggle) {
      onToggle(user.id, role.id, isAssigned);
    }
  };

  const getCellClasses = () => {
    let classes = 'relative p-4 text-center border-b border-gray-200 transition-all duration-200';
    
    if (isRoleSelected) {
      classes += ' bg-blue-50 ring-2 ring-blue-200';
    } else if (isAssigned) {
      classes += ' bg-green-50';
    } else {
      classes += ' bg-white hover:bg-gray-50';
    }
    
    if (isOptimistic) {
      classes += ' opacity-60';
    }
    
    if (canToggle) {
      classes += ' cursor-pointer';
    } else {
      classes += ' cursor-not-allowed';
    }
    
    return classes;
  };

  const getCheckboxClasses = () => {
    let classes = 'h-5 w-5 transition-all duration-200';
    
    if (isAssigned) {
      classes += ' text-green-600 focus:ring-green-500';
    } else {
      classes += ' text-blue-600 focus:ring-blue-500';
    }
    
    if (!canToggle) {
      classes += ' opacity-50 cursor-not-allowed';
    } else {
      classes += ' cursor-pointer hover:scale-110';
    }
    
    return classes;
  };

  const getTooltipText = () => {
    if (!canToggle) {
      return 'You do not have permission to modify this role assignment';
    }
    
    const action = isAssigned ? 'Remove' : 'Assign';
    return `${action} ${role.name} role ${isAssigned ? 'from' : 'to'} ${user.firstName} ${user.lastName}`;
  };

  return (
    <td
      className={getCellClasses()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleToggle}
      role="gridcell"
      aria-label={getTooltipText()}
    >
      <div className="flex items-center justify-center">
        <input
          type="checkbox"
          checked={isAssigned}
          onChange={handleToggle}
          disabled={!canToggle}
          className={getCheckboxClasses()}
          onClick={(e) => e.stopPropagation()}
          aria-label={getTooltipText()}
        />
        
        {/* Loading indicator for optimistic updates */}
        {isOptimistic && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50">
            <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        {/* Hover tooltip */}
        {isHovered && canToggle && (
          <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2
                         px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg
                         whitespace-nowrap opacity-0 group-hover:opacity-100
                         transition-opacity duration-200 pointer-events-none">
            {getTooltipText()}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2
                           w-0 h-0 border-l-4 border-r-4 border-t-4
                           border-l-transparent border-r-transparent border-t-gray-900" />
          </div>
        )}
      </div>
    </td>
  );
};

const UserRoleMatrixRow: React.FC<UserRoleMatrixRowProps> = ({
  user,
  roles,
  assignments,
  onToggleRole,
  onUserSelect,
  isUserSelected,
  selectedRoles,
  isOptimistic = false,
  permissions,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const assignedRoleCount = assignments.size;
  const isInactive = user.status === 'inactive';

  const handleUserSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUserSelect(user.id, e.target.checked);
  };

  const getRowClasses = () => {
    let classes = 'group transition-colors duration-200';
    
    if (isUserSelected) {
      classes += ' bg-blue-50';
    } else if (isHovered) {
      classes += ' bg-gray-50';
    }
    
    if (isInactive) {
      classes += ' opacity-60';
    }
    
    return classes;
  };

  const getUserCellClasses = () => {
    let classes = 'sticky left-0 z-10 bg-white border-b border-gray-200 p-4 w-64 shadow-sm';
    
    if (isUserSelected) {
      classes += ' !bg-blue-50 ring-2 ring-blue-200';
    } else if (isHovered) {
      classes += ' !bg-gray-50';
    }
    
    return classes;
  };

  return (
    <tr
      className={getRowClasses()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="row"
    >
      {/* User information cell */}
      <td className={getUserCellClasses()}>
        <div className="flex items-center space-x-3">
          {/* User selection checkbox */}
          <div className="flex-shrink-0">
            <input
              type="checkbox"
              checked={isUserSelected}
              onChange={handleUserSelect}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded
                       cursor-pointer transition-colors duration-200"
              aria-label={`Select ${user.firstName} ${user.lastName} for bulk operations`}
            />
          </div>
          
          {/* User avatar */}
          <div className="flex-shrink-0">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={`${user.firstName} ${user.lastName}`}
                className="h-10 w-10 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center
                            border border-gray-200">
                <span className="text-sm font-medium text-gray-600">
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </span>
              </div>
            )}
          </div>
          
          {/* User details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user.firstName} {user.lastName}
              </p>
              {isInactive && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs
                               font-medium bg-red-100 text-red-800">
                  Inactive
                </span>
              )}
            </div>
            
            <p className="text-sm text-gray-500 truncate" title={user.email}>
              {user.email}
            </p>
            
            {user.department && (
              <p className="text-xs text-gray-400 truncate" title={user.department.name}>
                {user.department.name}
              </p>
            )}
            
            {/* Role count indicator */}
            <div className="mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs
                             bg-gray-100 text-gray-700 font-medium">
                {assignedRoleCount} {assignedRoleCount === 1 ? 'role' : 'roles'}
              </span>
            </div>
          </div>
        </div>
      </td>
      
      {/* Role assignment cells */}
      {roles.map(role => {
        const isAssigned = assignments.has(role.id);
        const isRoleSelected = selectedRoles.has(role.id);
        
        return (
          <RoleCell
            key={role.id}
            user={user}
            role={role}
            isAssigned={isAssigned}
            isOptimistic={isOptimistic}
            onToggle={onToggleRole}
            isRoleSelected={isRoleSelected}
            canAssign={permissions.canAssignRoles && !isInactive}
            canUnassign={permissions.canUnassignRoles && !isInactive}
          />
        );
      })}
      
      {/* Bulk actions indicator (when roles are selected) */}
      {selectedRoles.size > 0 && (
        <td className="sticky right-0 z-10 bg-white border-b border-gray-200 p-4 w-32
                      shadow-sm text-center">
          {isUserSelected && (
            <div className="flex items-center justify-center">
              <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse" />
            </div>
          )}
        </td>
      )}
    </tr>
  );
};

export default UserRoleMatrixRow;
