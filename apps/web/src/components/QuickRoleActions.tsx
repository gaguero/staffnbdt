import React, { useState } from 'react';
import { User } from '../services/userService';
import { useAuth } from '../contexts/AuthContext';
import { Role, canManageRole } from '../types/role';
import { useAssignSystemRole, useChangeUserRole } from '../hooks/useSystemRoles';
import RoleBadge from './RoleBadge';
import LoadingSpinner from './LoadingSpinner';
// toastService imported but handled by hooks

interface QuickRoleActionsProps {
  user: User;
  onRoleChanged?: (user: User, newRole: string) => void;
  compact?: boolean;
}

interface QuickRoleChangeProps {
  user: User;
  targetRole: string;
  onSuccess?: () => void;
  className?: string;
}

const QuickRoleChange: React.FC<QuickRoleChangeProps> = ({ 
  user, 
  targetRole, 
  onSuccess,
  className = ''
}) => {
  const [isChanging, setIsChanging] = useState(false);
  const changeUserRole = useChangeUserRole();
  const assignSystemRole = useAssignSystemRole();

  const handleQuickChange = async () => {
    if (isChanging || targetRole === user.role) return;

    try {
      setIsChanging(true);
      
      if (user.role && user.role !== 'STAFF') {
        // This is a role change
        await changeUserRole.mutateAsync({
          userId: user.id,
          role: targetRole,
          reason: 'Quick role change'
        });
      } else {
        // This is a new role assignment
        await assignSystemRole.mutateAsync({
          userId: user.id,
          role: targetRole,
          reason: 'Quick role assignment'
        });
      }

      onSuccess?.();
    } catch (error) {
      console.error('Quick role change failed:', error);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <button
      onClick={handleQuickChange}
      disabled={isChanging || targetRole === user.role}
      className={`
        inline-flex items-center space-x-2 px-3 py-1.5 text-sm
        border border-gray-300 rounded-md hover:bg-gray-50 
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        ${className}
      `}
    >
      {isChanging && <LoadingSpinner size="sm" />}
      <RoleBadge role={targetRole} size="sm" showTooltip={false} />
      <span className="text-gray-700">
        {targetRole === user.role ? 'Current' : 'Set'}
      </span>
    </button>
  );
};

const QuickRoleActions: React.FC<QuickRoleActionsProps> = ({ 
  user, 
  onRoleChanged, 
  compact = false 
}) => {
  const { user: currentUser } = useAuth();

  // Get roles that current user can assign
  const assignableRoles = React.useMemo(() => {
    if (!currentUser) return [];

    const currentUserRole = currentUser.role as Role;
    
    return Object.values(Role).filter(role => {
      // Can't assign same role
      if (role === user.role) return false;
      
      // Check if current user can manage this role
      return canManageRole(currentUserRole, role);
    });
  }, [currentUser, user.role]);

  if (!currentUser || assignableRoles.length === 0) {
    return null;
  }

  if (compact) {
    // Compact version - show only most common role changes
    const commonRoles = assignableRoles.filter(role => 
      [Role.STAFF, Role.DEPARTMENT_ADMIN, Role.PROPERTY_MANAGER].includes(role)
    ).slice(0, 3);

    if (commonRoles.length === 0) return null;

    return (
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-500">Quick:</span>
        {commonRoles.map(role => (
          <QuickRoleChange
            key={role}
            user={user}
            targetRole={role}
            onSuccess={() => onRoleChanged?.(user, role)}
            className="text-xs"
          />
        ))}
      </div>
    );
  }

  // Full version - show all assignable roles
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">
          Quick Role Assignment
        </span>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">Current:</span>
          <RoleBadge role={user.role || 'STAFF'} size="sm" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {assignableRoles.map(role => (
          <QuickRoleChange
            key={role}
            user={user}
            targetRole={role}
            onSuccess={() => onRoleChanged?.(user, role)}
          />
        ))}
      </div>

      {assignableRoles.length > 4 && (
        <div className="text-xs text-gray-500 text-center">
          {assignableRoles.length} role options available
        </div>
      )}
    </div>
  );
};

export default QuickRoleActions;