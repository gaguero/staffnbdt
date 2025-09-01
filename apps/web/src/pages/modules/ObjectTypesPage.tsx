import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { conciergeService, ObjectType } from '../../services/conciergeService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { PermissionGate, RoleBasedComponent } from '../../components';
import toastService from '../../services/toastService';
import CreateObjectTypeModal from '../../components/concierge/CreateObjectTypeModal';
import EditObjectTypeModal from '../../components/concierge/EditObjectTypeModal';
import ViewObjectTypeModal from '../../components/concierge/ViewObjectTypeModal';

const ObjectTypesPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [objectTypes, setObjectTypes] = useState<ObjectType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedObjectType, setSelectedObjectType] = useState<ObjectType | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [filter, setFilter] = useState({
    search: '',
    active: 'all',
  });

  // Load object types
  const loadObjectTypes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await conciergeService.getObjectTypes();
      let types = response.data || [];

      // Apply filters
      if (filter.search) {
        types = types.filter(type =>
          type.name.toLowerCase().includes(filter.search.toLowerCase())
        );
      }
      if (filter.active !== 'all') {
        types = types.filter(type => type.isActive === (filter.active === 'active'));
      }

      setObjectTypes(types);
    } catch (error) {
      console.error('Failed to load object types:', error);
      toastService.error('Failed to load object types');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadObjectTypes();
  }, [loadObjectTypes]);

  const handleDelete = async (typeId: string) => {
    const type = objectTypes.find(t => t.id === typeId);
    if (!type) return;

    if (!window.confirm(`Are you sure you want to delete the "${type.name}" object type?`)) {
      return;
    }

    try {
      setLoading(true);
      await conciergeService.deleteObjectType(typeId);
      await loadObjectTypes();
      toastService.actions.deleted('Object Type', type.name);
    } catch (error: any) {
      console.error('Failed to delete object type:', error);
      toastService.actions.operationFailed('delete object type', error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (typeId: string) => {
    const type = objectTypes.find(t => t.id === typeId);
    if (!type) return;

    try {
      setLoading(true);
      await conciergeService.updateObjectType(typeId, { isActive: !type.isActive });
      await loadObjectTypes();
      toastService.actions[type.isActive ? 'deactivated' : 'activated']('Object Type', type.name);
    } catch (error: any) {
      console.error('Failed to toggle object type status:', error);
      toastService.actions.operationFailed('update object type', error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (objectType: ObjectType) => {
    setSelectedObjectType(objectType);
    setShowEditModal(true);
  };

  const openViewModal = (objectType: ObjectType) => {
    setSelectedObjectType(objectType);
    setShowViewModal(true);
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Inactive</span>
    );
  };

  if (loading && objectTypes.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Object Type Management</h1>
          <p className="text-gray-600">
            Configure concierge object types and their field schemas
            {currentUser?.role === 'STAFF' && (
              <span className="ml-2 text-sm text-orange-600">(Limited access)</span>
            )}
          </p>
        </div>
        
        <div className="flex gap-2">
          <PermissionGate
            resource="concierge"
            action="manage"
            scope="property"
            fallback={
              <RoleBasedComponent
                roles={['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'PROPERTY_MANAGER']}
                hideOnDenied
              >
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn btn-primary"
                >
                  ➕ Create Object Type
                </button>
              </RoleBasedComponent>
            }
          >
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              ➕ Create Object Type
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <input
            type="text"
            placeholder="Search object types..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            className="form-input flex-1"
          />
          <select
            value={filter.active}
            onChange={(e) => setFilter({ ...filter, active: e.target.value })}
            className="form-input"
          >
            <option value="all">All Types</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Object Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {objectTypes.map((objectType) => (
          <div key={objectType.id} className="card p-6 hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-charcoal text-lg">{objectType.name}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  {getStatusBadge(objectType.isActive)}
                  <span className="text-xs text-gray-500">
                    {objectType.fieldsSchema.fields.length} field{objectType.fieldsSchema.fields.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              
              <div className="relative">
                <button
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => {}}
                >
                  ⋮
                </button>
              </div>
            </div>

            {/* Schema Preview */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Fields Schema:</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {objectType.fieldsSchema.fields.slice(0, 4).map((field, index) => (
                  <div key={index} className="flex items-center justify-between text-xs bg-gray-50 rounded px-2 py-1">
                    <span className="font-medium">{field.label}</span>
                    <span className="text-gray-500 capitalize">{field.type}</span>
                  </div>
                ))}
                {objectType.fieldsSchema.fields.length > 4 && (
                  <div className="text-xs text-gray-500 text-center py-1">
                    +{objectType.fieldsSchema.fields.length - 4} more fields...
                  </div>
                )}
              </div>
            </div>

            {/* UI Hints */}
            {objectType.uiHints && Object.keys(objectType.uiHints).length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">UI Configuration:</h4>
                <div className="text-xs text-gray-600 bg-blue-50 rounded px-2 py-1">
                  {Object.keys(objectType.uiHints).length} UI hint{Object.keys(objectType.uiHints).length !== 1 ? 's' : ''} configured
                </div>
              </div>
            )}

            {/* Validations */}
            {objectType.validations && Object.keys(objectType.validations).length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Validations:</h4>
                <div className="text-xs text-gray-600 bg-orange-50 rounded px-2 py-1">
                  {Object.keys(objectType.validations).length} validation rule{Object.keys(objectType.validations).length !== 1 ? 's' : ''} configured
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <button
                onClick={() => openViewModal(objectType)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View Details
              </button>
              
              <div className="flex space-x-2">
                <PermissionGate
                  resource="concierge"
                  action="manage"
                  scope="property"
                  hideOnDenied
                >
                  <button
                    onClick={() => openEditModal(objectType)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                </PermissionGate>
                
                <PermissionGate
                  resource="concierge"
                  action="manage"
                  scope="property"
                  hideOnDenied
                >
                  <button
                    onClick={() => handleToggleActive(objectType.id)}
                    className={`text-sm ${objectType.isActive ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'}`}
                  >
                    {objectType.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </PermissionGate>
                
                <PermissionGate
                  resource="concierge"
                  action="manage"
                  scope="property"
                  hideOnDenied
                >
                  <button
                    onClick={() => handleDelete(objectType.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </PermissionGate>
              </div>
            </div>
          </div>
        ))}
      </div>

      {objectTypes.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏗️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Object Types Found
          </h3>
          <p className="text-gray-600 mb-4">
            {filter.search || filter.active !== 'all'
              ? 'No object types match your current filters.'
              : 'Create your first object type to get started with concierge objects.'
            }
          </p>
          {(filter.search || filter.active !== 'all') ? (
            <button
              onClick={() => setFilter({ search: '', active: 'all' })}
              className="btn btn-secondary"
            >
              Clear Filters
            </button>
          ) : (
            <PermissionGate
              resource="concierge"
              action="manage"
              scope="property"
              hideOnDenied
            >
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
              >
                Create First Object Type
              </button>
            </PermissionGate>
          )}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateObjectTypeModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadObjectTypes();
          }}
        />
      )}

      {showEditModal && selectedObjectType && (
        <EditObjectTypeModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedObjectType(null);
          }}
          objectType={selectedObjectType}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedObjectType(null);
            loadObjectTypes();
          }}
        />
      )}

      {showViewModal && selectedObjectType && (
        <ViewObjectTypeModal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedObjectType(null);
          }}
          objectType={selectedObjectType}
        />
      )}
    </div>
  );
};

export default ObjectTypesPage;