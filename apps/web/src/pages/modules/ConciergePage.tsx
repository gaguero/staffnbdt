import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import conciergeService from '../../services/conciergeService';
import { userService, User } from '../../services/userService';
import { ConciergeObject, ConciergeObjectFilter, ConciergeStats } from '../../types/concierge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { PermissionGate, RoleBasedComponent } from '../../components';
import toastService from '../../services/toastService';
import CreateConciergeObjectModal from '../../components/concierge/CreateConciergeObjectModal';
import EditConciergeObjectModal from '../../components/concierge/EditConciergeObjectModal';
import ViewConciergeObjectModal from '../../components/concierge/ViewConciergeObjectModal';

const ConciergePage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [objects, setObjects] = useState<ConciergeObject[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedObject, setSelectedObject] = useState<ConciergeObject | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [filter, setFilter] = useState<ConciergeObjectFilter>({
    search: '',
    status: undefined,
    type: undefined,
  });
  const [stats, setStats] = useState<ConciergeStats>({
    totalObjects: 0,
    openObjects: 0,
    overdueObjects: 0,
    completedToday: 0,
    averageCompletionTime: 0,
  });

  // Load objects with filter
  const loadObjects = useCallback(async () => {
    try {
      setLoading(true);
      const response = await conciergeService.getObjects(filter);
      setObjects(response.data.data || []);
    } catch (error) {
      console.error('Failed to load concierge objects:', error);
      toastService.error('Failed to load concierge objects');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Load stats
  const loadStats = useCallback(async () => {
    if (currentUser?.role === 'STAFF') return;
    
    try {
      const response = await conciergeService.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, [currentUser]);

  // Load users for assignment dropdown
  const loadUsers = useCallback(async () => {
    try {
      const response = await userService.getUsers({});
      setUsers(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]);
    }
  }, []);

  useEffect(() => {
    loadObjects();
    loadStats();
    loadUsers();
  }, [loadObjects, loadStats, loadUsers]);

  const handleDelete = async (objectId: string) => {
    if (!window.confirm('Are you sure you want to delete this concierge object?')) {
      return;
    }

    try {
      setLoading(true);
      await conciergeService.deleteObject(objectId);
      await loadObjects();
      await loadStats();
      toastService.actions.deleted('Concierge Object');
    } catch (error: any) {
      console.error('Failed to delete object:', error);
      toastService.actions.operationFailed('delete object', error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (objectId: string) => {
    try {
      setLoading(true);
      await conciergeService.completeObject(objectId);
      await loadObjects();
      await loadStats();
      toastService.success('Object marked as completed');
    } catch (error: any) {
      console.error('Failed to complete object:', error);
      toastService.actions.operationFailed('complete object', error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (object: ConciergeObject) => {
    setSelectedObject(object);
    setShowEditModal(true);
  };

  const openViewModal = (object: ConciergeObject) => {
    setSelectedObject(object);
    setShowViewModal(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { className: 'bg-blue-100 text-blue-800', label: 'Open' },
      in_progress: { className: 'bg-yellow-100 text-yellow-800', label: 'In Progress' },
      completed: { className: 'bg-green-100 text-green-800', label: 'Completed' },
      cancelled: { className: 'bg-gray-100 text-gray-800', label: 'Cancelled' },
      overdue: { className: 'bg-red-100 text-red-800', label: 'Overdue' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && objects.length === 0) {
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
          <h1 className="text-2xl font-bold text-charcoal">Concierge Management</h1>
          <p className="text-gray-600">
            Manage guest requests and concierge services
            {currentUser?.role === 'STAFF' && (
              <span className="ml-2 text-sm text-orange-600">(Staff scope)</span>
            )}
          </p>
        </div>
        
        <div className="flex gap-2">
          <PermissionGate
            resource="concierge"
            action="create"
            scope="property"
            fallback={
              <RoleBasedComponent
                roles={['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'PROPERTY_MANAGER', 'DEPARTMENT_ADMIN']}
                hideOnDenied
              >
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn btn-primary"
                >
                  ✨ Create Object
                </button>
              </RoleBasedComponent>
            }
          >
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              ✨ Create Object
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Statistics */}
      <PermissionGate
        resource="concierge"
        action="read"
        scope="property"
        fallback={
          <RoleBasedComponent
            roles={['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'PROPERTY_MANAGER', 'DEPARTMENT_ADMIN']}
            hideOnDenied
          >
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="card p-4 text-center">
                <div className="text-2xl mb-2">📋</div>
                <p className="text-sm text-gray-600">Total Objects</p>
                <p className="text-2xl font-bold">{stats.totalObjects}</p>
              </div>
              <div className="card p-4 text-center">
                <div className="text-2xl mb-2">🔓</div>
                <p className="text-sm text-gray-600">Open</p>
                <p className="text-2xl font-bold">{stats.openObjects}</p>
              </div>
              <div className="card p-4 text-center">
                <div className="text-2xl mb-2">⏰</div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdueObjects}</p>
              </div>
              <div className="card p-4 text-center">
                <div className="text-2xl mb-2">✅</div>
                <p className="text-sm text-gray-600">Completed Today</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedToday}</p>
              </div>
              <div className="card p-4 text-center">
                <div className="text-2xl mb-2">⏱️</div>
                <p className="text-sm text-gray-600">Avg Time (hrs)</p>
                <p className="text-2xl font-bold">{Math.round(stats.averageCompletionTime / 60)}</p>
              </div>
            </div>
          </RoleBasedComponent>
        }
      >
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card p-4 text-center">
            <div className="text-2xl mb-2">📋</div>
            <p className="text-sm text-gray-600">Total Objects</p>
            <p className="text-2xl font-bold">{stats.totalObjects}</p>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl mb-2">🔓</div>
            <p className="text-sm text-gray-600">Open</p>
            <p className="text-2xl font-bold">{stats.openObjects}</p>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl mb-2">⏰</div>
            <p className="text-sm text-gray-600">Overdue</p>
            <p className="text-2xl font-bold text-red-600">{stats.overdueObjects}</p>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl mb-2">✅</div>
            <p className="text-sm text-gray-600">Completed Today</p>
            <p className="text-2xl font-bold text-green-600">{stats.completedToday}</p>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl mb-2">⏱️</div>
            <p className="text-sm text-gray-600">Avg Time (hrs)</p>
            <p className="text-2xl font-bold">{Math.round(stats.averageCompletionTime / 60)}</p>
          </div>
        </div>
      </PermissionGate>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <input
            type="text"
            placeholder="Search objects..."
            value={filter.search || ''}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            className="form-input flex-1"
          />
          <select
            value={filter.status?.[0] || ''}
            onChange={(e) => setFilter({ ...filter, status: e.target.value ? [e.target.value] : undefined })}
            className="form-input"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={filter.type?.[0] || ''}
            onChange={(e) => setFilter({ ...filter, type: e.target.value ? [e.target.value] : undefined })}
            className="form-input"
          >
            <option value="">All Types</option>
            <option value="restaurant_reservation">Restaurant Reservation</option>
            <option value="transportation">Transportation</option>
            <option value="tour_booking">Tour Booking</option>
            <option value="special_request">Special Request</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Objects Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Object</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest/Reservation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {objects.map((object) => (
                <tr key={object.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-charcoal">{object.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                      <p className="text-sm text-gray-500">ID: {object.id.slice(-8)}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                      {object.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(object.status)}</td>
                  <td className="px-6 py-4 text-sm">{formatDate(object.dueAt)}</td>
                  <td className="px-6 py-4 text-sm">
                    {object.guest && (
                      <p className="font-medium">{object.guest.firstName} {object.guest.lastName}</p>
                    )}
                    {object.reservation && (
                      <p className="text-gray-500">Res: {object.reservation.id.slice(-6)}</p>
                    )}
                    {!object.guest && !object.reservation && '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openViewModal(object)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View
                      </button>
                      
                      <PermissionGate
                        resource="concierge"
                        action="update"
                        scope="property"
                        hideOnDenied
                      >
                        <button
                          onClick={() => openEditModal(object)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                      </PermissionGate>
                      
                      {object.status !== 'completed' && (
                        <PermissionGate
                          resource="concierge"
                          action="update"
                          scope="property"
                          hideOnDenied
                        >
                          <button
                            onClick={() => handleComplete(object.id)}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            Complete
                          </button>
                        </PermissionGate>
                      )}
                      
                      <PermissionGate
                        resource="concierge"
                        action="delete"
                        scope="property"
                        hideOnDenied
                      >
                        <button
                          onClick={() => handleDelete(object.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </PermissionGate>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateConciergeObjectModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadObjects();
            loadStats();
          }}
        />
      )}

      {showEditModal && selectedObject && (
        <EditConciergeObjectModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedObject(null);
          }}
          object={selectedObject}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedObject(null);
            loadObjects();
            loadStats();
          }}
        />
      )}

      {showViewModal && selectedObject && (
        <ViewConciergeObjectModal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedObject(null);
          }}
          object={selectedObject}
        />
      )}
    </div>
  );
};

export default ConciergePage;