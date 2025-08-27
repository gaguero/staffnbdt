import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleService, CreateRoleInput, UpdateRoleInput, RoleAssignment } from '../services/roleService';
import { toast } from 'react-hot-toast';

// Query Keys
export const roleQueryKeys = {
  all: ['roles'] as const,
  roles: () => [...roleQueryKeys.all, 'list'] as const,
  role: (id: string) => [...roleQueryKeys.all, 'detail', id] as const,
  permissions: () => [...roleQueryKeys.all, 'permissions'] as const,
  permissionsByResource: () => [...roleQueryKeys.permissions(), 'by-resource'] as const,
  userRoles: (userId?: string) => [...roleQueryKeys.all, 'user-roles', userId] as const,
  roleStats: () => [...roleQueryKeys.all, 'stats'] as const,
  templates: () => [...roleQueryKeys.all, 'templates'] as const,
};

// Role Hooks
export function useRoles() {
  return useQuery({
    queryKey: roleQueryKeys.roles(),
    queryFn: () => roleService.getRoles(),
    select: (data) => data.data,
  });
}

export function useRole(id: string) {
  return useQuery({
    queryKey: roleQueryKeys.role(id),
    queryFn: () => roleService.getRole(id),
    select: (data) => data.data,
    enabled: !!id,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (role: CreateRoleInput) => roleService.createRole(role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.roles() });
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.roleStats() });
      toast.success('Role created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create role');
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: UpdateRoleInput }) => 
      roleService.updateRole(id, role),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.roles() });
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.role(variables.id) });
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.userRoles() });
      toast.success('Role updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update role');
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => roleService.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.roles() });
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.userRoles() });
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.roleStats() });
      toast.success('Role deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete role');
    },
  });
}

// Permission Hooks
export function usePermissions() {
  return useQuery({
    queryKey: roleQueryKeys.permissions(),
    queryFn: () => roleService.getAllPermissions(),
    select: (data) => data.data,
    retry: false, // Don't retry 404s
  });
}

export function usePermissionsByResource() {
  return useQuery({
    queryKey: roleQueryKeys.permissionsByResource(),
    queryFn: () => roleService.getPermissionsByResource(),
    select: (data) => data.data,
    retry: false, // Don't retry 404s
  });
}

// User Role Assignment Hooks
export function useUserRoles(userId?: string) {
  return useQuery({
    queryKey: roleQueryKeys.userRoles(userId),
    queryFn: () => roleService.getUserRoles(userId),
    select: (data) => data.data,
  });
}

export function useAssignRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (assignment: RoleAssignment) => roleService.assignRole(assignment),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.userRoles() });
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.userRoles(variables.userId) });
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.roles() });
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.roleStats() });
      toast.success('Role assigned successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to assign role');
    },
  });
}

export function useRemoveUserRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userRoleId: string) => roleService.removeUserRole(userRoleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.userRoles() });
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.roles() });
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.roleStats() });
      toast.success('Role removed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove role');
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userRoleId, assignment }: { userRoleId: string; assignment: Partial<RoleAssignment> }) => 
      roleService.updateUserRole(userRoleId, assignment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.userRoles() });
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.roles() });
      toast.success('Role assignment updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update role assignment');
    },
  });
}

// Bulk Operations
export function useBulkAssignRoles() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (assignments: RoleAssignment[]) => roleService.bulkAssignRoles(assignments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.userRoles() });
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.roles() });
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.roleStats() });
      toast.success('Roles assigned successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to assign roles');
    },
  });
}

export function useBulkRemoveRoles() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userRoleIds: string[]) => roleService.bulkRemoveRoles(userRoleIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.userRoles() });
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.roles() });
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.roleStats() });
      toast.success('Roles removed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove roles');
    },
  });
}

// Analytics
export function useRoleStats() {
  return useQuery({
    queryKey: roleQueryKeys.roleStats(),
    queryFn: () => roleService.getRoleStats(),
    select: (data) => data.data,
  });
}

// Templates
export function useRoleTemplates() {
  return useQuery({
    queryKey: roleQueryKeys.templates(),
    queryFn: () => roleService.getRoleTemplates(),
    select: (data) => data.data,
  });
}

export function useCreateRoleFromTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ templateId, customizations }: { templateId: string; customizations: Partial<CreateRoleInput> }) => 
      roleService.createRoleFromTemplate(templateId, customizations),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.roles() });
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.roleStats() });
      toast.success('Role created from template successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create role from template');
    },
  });
}

// Permission Checking
export function useCheckUserPermissions() {
  return useMutation({
    mutationFn: ({ userId, permissions }: { 
      userId: string; 
      permissions: { resource: string; action: string; scope?: string }[] 
    }) => roleService.checkUserPermissions(userId, permissions),
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to check permissions');
    },
  });
}