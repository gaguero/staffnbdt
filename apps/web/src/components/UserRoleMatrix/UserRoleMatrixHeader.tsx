import React from 'react';
import { MatrixRole, UserRoleMatrixHeaderProps } from '../../types/userRoleMatrix';
import RoleBadge from '../RoleBadge';

interface HeaderCellProps {
  role: MatrixRole;
  isSelected: boolean;
  onSelect: (roleId: string, selected: boolean) => void;
  userCount: number;
  canBulkAssign: boolean;
}

const HeaderCell: React.FC<HeaderCellProps> = ({
  role,
  isSelected,
  onSelect,
  userCount,
  canBulkAssign,
}) => {
  return (
    <th
      className="sticky top-0 z-20 bg-white border-b border-gray-200 p-4 text-left 
                 min-w-[160px] max-w-[200px] shadow-sm"
    >
      <div className="flex flex-col space-y-2">
        {/* Role selection checkbox */}
        {canBulkAssign && (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(role.id, e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded
                       cursor-pointer transition-colors duration-200"
              aria-label={`Select ${role.name} role for bulk operations`}
            />
          </div>
        )}
        
        {/* Role badge */}
        <div className="flex justify-center">
          <RoleBadge
            role={role.systemRole || role.name}
            isCustomRole={!role.isSystemRole}
            size="sm"
            showTooltip={true}
            className="max-w-full"
          />
        </div>
        
        {/* Role name (for custom roles) */}
        {!role.isSystemRole && (
          <div className="text-center">
            <span className="text-xs font-medium text-gray-900 truncate block"
                  title={role.name}>
              {role.name}
            </span>
          </div>
        )}
        
        {/* User count */}
        <div className="text-center">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs
                         bg-gray-100 text-gray-700 font-medium">
            {userCount} users
          </span>
        </div>
        
        {/* Role level indicator */}
        <div className="text-center">
          <span className="text-xs text-gray-500">
            Level {role.level}
          </span>
        </div>
      </div>
    </th>
  );
};

const UserRoleMatrixHeader: React.FC<UserRoleMatrixHeaderProps> = ({
  roles,
  selectedUsers,
  selectedRoles,
  onRoleSelect,
  onSelectAllUsers,
  onSelectAllRoles: _onSelectAllRoles,
  userCount,
  permissions,
}) => {
  const allRolesSelected = roles.length > 0 && roles.every(role => selectedRoles.has(role.id));
  // const someRolesSelected = roles.some(role => selectedRoles.has(role.id));

  const handleSelectAllRoles = () => {
    if (allRolesSelected) {
      // Deselect all roles
      roles.forEach(role => onRoleSelect(role.id, false));
    } else {
      // Select all roles
      roles.forEach(role => onRoleSelect(role.id, true));
    }
  };

  return (
    <thead className="bg-gray-50">
      <tr>
        {/* User column header */}
        <th className="sticky left-0 z-30 bg-gray-50 border-b border-gray-200 p-4 text-left
                      w-64 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Users ({userCount})
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {selectedUsers.size > 0 && `${selectedUsers.size} selected`}
              </p>
            </div>
            
            {permissions.canBulkAssign && (
              <button
                onClick={onSelectAllUsers}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium
                         transition-colors duration-200"
                aria-label="Select all users"
              >
                {selectedUsers.size === userCount ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>
        </th>
        
        {/* Role column headers */}
        {roles.map(role => (
          <HeaderCell
            key={role.id}
            role={role}
            isSelected={selectedRoles.has(role.id)}
            onSelect={onRoleSelect}
            userCount={role.userCount}
            canBulkAssign={permissions.canBulkAssign}
          />
        ))}
        
        {/* Bulk actions column (when roles are selected) */}
        {permissions.canBulkAssign && selectedRoles.size > 0 && (
          <th className="sticky right-0 z-20 bg-gray-50 border-b border-gray-200 p-4
                        w-32 shadow-sm">
            <div className="flex flex-col items-center space-y-2">
              <span className="text-xs font-medium text-gray-700">
                Bulk Actions
              </span>
              <button
                onClick={handleSelectAllRoles}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium
                         transition-colors duration-200"
                aria-label="Toggle all role selection"
              >
                {allRolesSelected ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </th>
        )}
      </tr>
      
      {/* Second header row with role descriptions (for accessibility) */}
      <tr className="sr-only">
        <th scope="col">User Information</th>
        {roles.map(role => (
          <th key={role.id} scope="col">
            {role.name} - {role.description}
          </th>
        ))}
        {permissions.canBulkAssign && selectedRoles.size > 0 && (
          <th scope="col">Bulk Operations</th>
        )}
      </tr>
    </thead>
  );
};

export default UserRoleMatrixHeader;
