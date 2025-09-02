import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import conciergeService from '../../services/conciergeService';
import { userService, User } from '../../services/userService';
import { ConciergeObject } from '../../types/concierge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { PermissionGate } from '../../components';
import toastService from '../../services/toastService';

interface TodayBoardColumn {
  title: string;
  status: string[];
  objects: ConciergeObject[];
  bgColor: string;
  textColor: string;
}

const TodayBoardPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState<TodayBoardColumn[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedObjects, setSelectedObjects] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Initialize columns
  const initializeColumns = useCallback((): TodayBoardColumn[] => {
    return [
      {
        title: 'Overdue',
        status: ['overdue'],
        objects: [],
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
      },
      {
        title: 'Due Today',
        status: ['open', 'in_progress'],
        objects: [],
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-700',
      },
      {
        title: 'Upcoming',
        status: ['open'],
        objects: [],
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
      },
    ];
  }, []);

  // Load today's board data
  const loadTodayBoard = useCallback(async () => {
    try {
      setLoading(true);
      const response = await conciergeService.getTodayBoard();
      const boardData = response.data;
      
      const newColumns = initializeColumns();
      
      // Map board data to columns
      boardData.forEach(section => {
        const column = newColumns.find(col => col.title === section.title);
        if (column) {
          column.objects = section.objects;
        }
      });
      
      setColumns(newColumns);
    } catch (error) {
      console.error('Failed to load today board:', error);
      toastService.error('Failed to load today board data');
    } finally {
      setLoading(false);
    }
  }, [initializeColumns]);

  // Load users for assignment
  const loadUsers = useCallback(async () => {
    try {
      const response = await userService.getUsers({});
      setUsers(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }, []);

  useEffect(() => {
    loadTodayBoard();
    loadUsers();
  }, [loadTodayBoard, loadUsers]);

  const handleObjectClick = (objectId: string) => {
    setSelectedObjects(prev => {
      const isSelected = prev.includes(objectId);
      const newSelection = isSelected 
        ? prev.filter(id => id !== objectId)
        : [...prev, objectId];
      
      setShowBulkActions(newSelection.length > 0);
      return newSelection;
    });
  };

  const handleSelectAll = (columnObjects: ConciergeObject[]) => {
    const objectIds = columnObjects.map(obj => obj.id);
    setSelectedObjects(prev => {
      const allSelected = objectIds.every(id => prev.includes(id));
      const newSelection = allSelected
        ? prev.filter(id => !objectIds.includes(id))
        : [...new Set([...prev, ...objectIds])];
      
      setShowBulkActions(newSelection.length > 0);
      return newSelection;
    });
  };

  const handleBulkComplete = async () => {
    if (selectedObjects.length === 0) return;

    try {
      setLoading(true);
      await conciergeService.bulkComplete(selectedObjects, 'Completed via Today Board');
      toastService.actions.bulkOperation('Completed', selectedObjects.length, 'object');
      setSelectedObjects([]);
      setShowBulkActions(false);
      await loadTodayBoard();
    } catch (error: any) {
      console.error('Failed to bulk complete:', error);
      toastService.actions.operationFailed('bulk complete objects', error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAssign = async (userId: string) => {
    if (selectedObjects.length === 0) return;

    try {
      setLoading(true);
      await conciergeService.bulkAssign(selectedObjects, userId);
      const user = users.find(u => u.id === userId);
      toastService.actions.bulkOperation(`Assigned to ${user?.firstName} ${user?.lastName}`, selectedObjects.length, 'object');
      setSelectedObjects([]);
      setShowBulkActions(false);
      await loadTodayBoard();
    } catch (error: any) {
      console.error('Failed to bulk assign:', error);
      toastService.actions.operationFailed('bulk assign objects', error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteObject = async (objectId: string) => {
    try {
      await conciergeService.completeObject(objectId);
      toastService.success('Object completed');
      await loadTodayBoard();
    } catch (error: any) {
      console.error('Failed to complete object:', error);
      toastService.actions.operationFailed('complete object', error.response?.data?.message);
    }
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
      <span className={`px-2 py-1 rounded text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatDueDate = (date: Date | undefined) => {
    if (!date) return null;
    
    const now = new Date();
    const dueDate = new Date(date);
    const timeDiff = dueDate.getTime() - now.getTime();
    const hoursDiff = Math.round(timeDiff / (1000 * 3600));
    
    if (hoursDiff < 0) {
      return <span className="text-red-600 text-xs">Overdue by {Math.abs(hoursDiff)}h</span>;
    } else if (hoursDiff < 24) {
      return <span className="text-orange-600 text-xs">Due in {hoursDiff}h</span>;
    } else {
      return <span className="text-gray-600 text-xs">{dueDate.toLocaleDateString()}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <PermissionGate resource="concierge" action="read" scope="property">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-charcoal">Today Board</h1>
            <p className="text-gray-600">Concierge tasks organized by priority and timeline</p>
          </div>
          
          {selectedObjects.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-800 mb-2">
                {selectedObjects.length} object{selectedObjects.length > 1 ? 's' : ''} selected
              </p>
              <div className="flex gap-2">
                <PermissionGate resource="concierge" action="update" scope="property" hideOnDenied>
                  <button
                    onClick={handleBulkComplete}
                    className="btn btn-sm btn-primary"
                    disabled={loading}
                  >
                    ✅ Complete All
                  </button>
                </PermissionGate>
                <PermissionGate resource="concierge" action="update" scope="property" hideOnDenied>
                  <select
                    onChange={(e) => e.target.value && handleBulkAssign(e.target.value)}
                    className="form-input text-sm"
                    value=""
                  >
                    <option value="">👤 Assign to...</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </option>
                    ))}
                  </select>
                </PermissionGate>
                <button
                  onClick={() => {
                    setSelectedObjects([]);
                    setShowBulkActions(false);
                  }}
                  className="btn btn-sm btn-secondary"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Board Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px]">
          {columns.map((column) => (
            <div key={column.title} className={`${column.bgColor} rounded-lg border p-4`}>
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-semibold ${column.textColor}`}>
                  {column.title} ({column.objects.length})
                </h3>
                {column.objects.length > 0 && (
                  <button
                    onClick={() => handleSelectAll(column.objects)}
                    className="text-xs text-gray-600 hover:text-gray-800"
                  >
                    Select All
                  </button>
                )}
              </div>

              {/* Column Content */}
              <div className="space-y-3">
                {column.objects.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-3xl mb-2">🎉</div>
                    <p className="text-sm">No {column.title.toLowerCase()} tasks</p>
                  </div>
                ) : (
                  column.objects.map((object) => (
                    <div
                      key={object.id}
                      className={`bg-white border rounded-lg p-4 shadow-sm cursor-pointer transition-all duration-200 ${
                        selectedObjects.includes(object.id) ? 'border-blue-500 bg-blue-50' : 'hover:shadow-md'
                      }`}
                      onClick={() => handleObjectClick(object.id)}
                    >
                      {/* Object Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedObjects.includes(object.id)}
                            onChange={() => handleObjectClick(object.id)}
                            className="rounded"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <h4 className="font-medium text-gray-900 text-sm">
                            {object.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </h4>
                        </div>
                        {getStatusBadge(object.status)}
                      </div>

                      {/* Object Details */}
                      <div className="space-y-2 text-sm">
                        {object.guest && (
                          <p className="text-gray-700">
                            👤 {object.guest.firstName} {object.guest.lastName}
                          </p>
                        )}
                        
                        {object.reservation && (
                          <p className="text-gray-700">
                            🏨 {object.reservation.confirmationNumber}
                          </p>
                        )}

                        {object.dueAt && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">⏰ Due:</span>
                            {formatDueDate(object.dueAt)}
                          </div>
                        )}

                        {object.attributes && object.attributes.length > 0 && (
                          <div className="bg-gray-50 rounded p-2 mt-2">
                            <div className="text-xs text-gray-600 mb-1">Details:</div>
                            {object.attributes.slice(0, 2).map((attr) => (
                              <div key={attr.id} className="text-xs text-gray-700">
                                <span className="font-medium">{attr.fieldKey}:</span>{' '}
                                {attr.stringValue || attr.numberValue?.toString() || 
                                 (attr.booleanValue ? 'Yes' : 'No') || 'N/A'}
                              </div>
                            ))}
                            {object.attributes.length > 2 && (
                              <div className="text-xs text-gray-500 mt-1">
                                +{object.attributes.length - 2} more...
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div className="flex justify-end mt-3 space-x-2">
                        {object.status !== 'completed' && (
                          <PermissionGate resource="concierge" action="update" scope="property" hideOnDenied>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCompleteObject(object.id);
                              }}
                              className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                            >
                              ✅ Complete
                            </button>
                          </PermissionGate>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Today's Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            {columns.map((column) => (
              <div key={column.title}>
                <div className={`text-2xl font-bold ${column.textColor}`}>
                  {column.objects.length}
                </div>
                <div className="text-sm text-gray-600">{column.title}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PermissionGate>
  );
};

export default TodayBoardPage;