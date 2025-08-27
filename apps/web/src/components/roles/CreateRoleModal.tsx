import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CreateRoleInput, Role } from '../../services/roleService';
import { useCreateRole, useUpdateRole, usePermissionsByResource } from '../../hooks/useRoles';

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  role?: Role;
  mode?: 'create' | 'edit';
}

const CreateRoleModal: React.FC<CreateRoleModalProps> = ({
  isOpen,
  onClose,
  role,
  mode = 'create'
}) => {
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set());
  
  const { data: permissionsByResource } = usePermissionsByResource();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<CreateRoleInput>();

  const watchedLevel = watch('level', 0);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && role) {
        setValue('name', role.name);
        setValue('description', role.description);
        setValue('level', role.level);
        
        const rolePermissionIds = new Set(role.permissions.map(p => p.id));
        setSelectedPermissions(rolePermissionIds);
        setValue('permissions', Array.from(rolePermissionIds));
      } else {
        reset({
          level: 10,
          permissions: []
        });
        setSelectedPermissions(new Set());
      }
    }
  }, [isOpen, mode, role, setValue, reset]);

  const handlePermissionToggle = (permissionId: string) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setSelectedPermissions(newSelected);
    setValue('permissions', Array.from(newSelected));
  };

  const handleSelectAllResource = (resource: string) => {
    const resourcePermissions = permissionsByResource?.[resource] || [];
    const newSelected = new Set(selectedPermissions);
    
    const allSelected = resourcePermissions.every(p => newSelected.has(p.id));
    
    if (allSelected) {
      // Deselect all
      resourcePermissions.forEach(p => newSelected.delete(p.id));
    } else {
      // Select all
      resourcePermissions.forEach(p => newSelected.add(p.id));
    }
    
    setSelectedPermissions(newSelected);
    setValue('permissions', Array.from(newSelected));
  };

  const toggleResourceExpansion = (resource: string) => {
    const newExpanded = new Set(expandedResources);
    if (newExpanded.has(resource)) {
      newExpanded.delete(resource);
    } else {
      newExpanded.add(resource);
    }
    setExpandedResources(newExpanded);
  };

  const getLevelLabel = (level: number) => {
    if (level >= 90) return 'Platform Administrator';
    if (level >= 70) return 'Organization Administrator';
    if (level >= 50) return 'Property Manager';
    if (level >= 30) return 'Department Administrator';
    return 'Staff Member';
  };

  const getLevelColor = (level: number) => {
    if (level >= 90) return 'text-red-600';
    if (level >= 70) return 'text-orange-600';
    if (level >= 50) return 'text-yellow-600';
    if (level >= 30) return 'text-blue-600';
    return 'text-gray-600';
  };

  const onSubmit = async (data: CreateRoleInput) => {
    try {
      if (mode === 'edit' && role) {
        await updateRole.mutateAsync({
          id: role.id,
          role: data
        });
      } else {
        await createRole.mutateAsync(data);
      }
      onClose();
      reset();
      setSelectedPermissions(new Set());
    } catch (error) {
      console.error('Error saving role:', error);
    }
  };

  if (!isOpen) return null;

  const isLoading = createRole.isPending || updateRole.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'edit' ? 'Edit Role' : 'Create New Role'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          {/* Basic Information */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Role Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role Name *
                </label>
                <input
                  type="text"
                  {...register('name', { required: 'Role name is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Front Desk Manager"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Authority Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Authority Level *
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="1"
                    max="100"
                    {...register('level', { 
                      required: 'Authority level is required',
                      min: { value: 1, message: 'Level must be at least 1' },
                      max: { value: 100, message: 'Level cannot exceed 100' }
                    })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Staff (1-29)</span>
                    <span>Dept. Admin (30-49)</span>
                    <span>Property Mgr (50-69)</span>
                    <span>Org Admin (70-89)</span>
                    <span>Platform (90-100)</span>
                  </div>
                  <div className="text-center">
                    <span className="text-lg font-semibold">Level {watchedLevel}</span>
                    <span className={`ml-2 text-sm font-medium ${getLevelColor(watchedLevel)}`}>
                      ({getLevelLabel(watchedLevel)})
                    </span>
                  </div>
                </div>
                {errors.level && (
                  <p className="mt-1 text-sm text-red-600">{errors.level.message}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the role's responsibilities and scope..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Permissions */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Permissions</h3>
              <div className="text-sm text-gray-600">
                Selected: {selectedPermissions.size} permissions
              </div>
            </div>

            {permissionsByResource && (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {Object.entries(permissionsByResource).map(([resource, permissions]) => {
                  const isExpanded = expandedResources.has(resource);
                  const allSelected = permissions.every(p => selectedPermissions.has(p.id));
                  const someSelected = permissions.some(p => selectedPermissions.has(p.id));
                  
                  return (
                    <div key={resource} className="border border-gray-200 rounded-lg">
                      {/* Resource Header */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                           onClick={() => toggleResourceExpansion(resource)}>
                        <div className="flex items-center gap-3">
                          <svg 
                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <h4 className="font-medium text-gray-900 capitalize">
                            {resource.replace('_', ' ')} ({permissions.length})
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectAllResource(resource);
                          }}
                          className={`px-3 py-1 text-xs rounded-md transition-colors ${
                            allSelected 
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : someSelected 
                              ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {allSelected ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>

                      {/* Permissions List */}
                      {isExpanded && (
                        <div className="p-4 space-y-2">
                          {permissions.map(permission => (
                            <label 
                              key={permission.id} 
                              className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedPermissions.has(permission.id)}
                                onChange={() => handlePermissionToggle(permission.id)}
                                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">
                                  {permission.resource}.{permission.action}.{permission.scope}
                                </div>
                                {permission.description && (
                                  <div className="text-sm text-gray-600 mt-1">
                                    {permission.description}
                                  </div>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : mode === 'edit' ? 'Update Role' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoleModal;