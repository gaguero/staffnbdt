import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { userRoleService, UserRole } from '../services/roleService';

interface Props {
  userId: string;
  fallbackSystemRole?: string; // e.g., user.role for legacy display
  maxVisible?: number;
}

const pillClass = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 mr-1 mb-1';

export const UserCustomRoleBadges: React.FC<Props> = ({ userId, fallbackSystemRole, maxVisible = 2 }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['userCustomRoles', userId],
    queryFn: async () => {
      const response = await userRoleService.getUserRoles({ userId });
      return response.data as UserRole[];
    }
  });

  if (isLoading) {
    return <span className="text-xs text-gray-400">Loading…</span>;
  }

  const roles = (data || []).map(r => r.role?.name).filter(Boolean) as string[];

  if (roles.length === 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
        {fallbackSystemRole ? fallbackSystemRole.replace('_', ' ') : 'No custom role'}
      </span>
    );
  }

  const visible = roles.slice(0, maxVisible);
  const extra = roles.length - visible.length;

  return (
    <div className="flex flex-wrap items-center">
      {visible.map(name => (
        <span key={name} className={pillClass}>{name}</span>
      ))}
      {extra > 0 && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">+{extra}</span>
      )}
    </div>
  );
};

export default UserCustomRoleBadges;


