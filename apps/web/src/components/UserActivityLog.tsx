import React, { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import PermissionGate from './PermissionGate';
import { COMMON_PERMISSIONS } from '../types/permission';
import toast from 'react-hot-toast';

interface ActivityLogEntry {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  userId: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

interface UserActivityLogProps {
  userId: string;
  className?: string;
  maxEntries?: number;
}

const UserActivityLog: React.FC<UserActivityLogProps> = ({
  userId,
  className = '',
  maxEntries = 50,
}) => {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'LOGIN' | 'PROFILE' | 'DOCUMENTS' | 'PERMISSIONS'>('ALL');

  useEffect(() => {
    loadActivities();
  }, [userId, filter]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      
      // Mock API call - replace with actual service call
      // const response = await auditService.getUserActivities(userId, { filter, limit: maxEntries });
      
      // Mock data for demonstration
      const mockActivities: ActivityLogEntry[] = [
        {
          id: '1',
          action: 'LOGIN',
          resource: 'AUTH',
          resourceId: userId,
          userId: userId,
          user: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com'
          },
          details: { loginMethod: 'password' },
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
        },
        {
          id: '2',
          action: 'UPDATE_PROFILE',
          resource: 'PROFILE',
          resourceId: userId,
          userId: userId,
          user: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com'
          },
          details: { 
            changed_fields: ['phoneNumber', 'position'],
            old_values: { phoneNumber: '+507 1234-5678', position: 'Developer' },
            new_values: { phoneNumber: '+507 8765-4321', position: 'Senior Developer' }
          },
          ipAddress: '192.168.1.100',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
        },
        {
          id: '3',
          action: 'UPLOAD_DOCUMENT',
          resource: 'DOCUMENTS',
          resourceId: 'doc-123',
          userId: userId,
          user: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com'
          },
          details: { 
            document_type: 'ID_VERIFICATION',
            filename: 'passport.jpg',
            size: 2048576
          },
          ipAddress: '192.168.1.100',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
        },
        {
          id: '4',
          action: 'PASSWORD_CHANGE',
          resource: 'AUTH',
          resourceId: userId,
          userId: userId,
          user: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com'
          },
          details: { method: 'self_service' },
          ipAddress: '192.168.1.100',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString() // 3 days ago
        }
      ];

      // Filter activities based on selected filter
      const filteredActivities = filter === 'ALL' 
        ? mockActivities
        : mockActivities.filter(activity => {
            switch (filter) {
              case 'LOGIN':
                return activity.action.includes('LOGIN') || activity.action.includes('LOGOUT');
              case 'PROFILE':
                return activity.resource === 'PROFILE';
              case 'DOCUMENTS':
                return activity.resource === 'DOCUMENTS';
              case 'PERMISSIONS':
                return activity.resource === 'PERMISSIONS' || activity.action.includes('PERMISSION');
              default:
                return true;
            }
          });

      setActivities(filteredActivities);
    } catch (error) {
      console.error('Failed to load user activities:', error);
      toast.error('Failed to load activity log');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string): string => {
    if (action.includes('LOGIN')) return '🔐';
    if (action.includes('LOGOUT')) return '🚪';
    if (action.includes('UPDATE') || action.includes('EDIT')) return '✏️';
    if (action.includes('CREATE')) return '➕';
    if (action.includes('DELETE')) return '🗑️';
    if (action.includes('UPLOAD')) return '📤';
    if (action.includes('DOWNLOAD')) return '📥';
    if (action.includes('PASSWORD')) return '🔑';
    if (action.includes('PERMISSION')) return '🛡️';
    if (action.includes('VIEW')) return '👁️';
    return '📋';
  };

  const getActionColor = (action: string): string => {
    if (action.includes('LOGIN')) return 'text-green-600 bg-green-50';
    if (action.includes('LOGOUT')) return 'text-blue-600 bg-blue-50';
    if (action.includes('DELETE')) return 'text-red-600 bg-red-50';
    if (action.includes('PASSWORD')) return 'text-purple-600 bg-purple-50';
    if (action.includes('PERMISSION')) return 'text-orange-600 bg-orange-50';
    if (action.includes('UPLOAD') || action.includes('CREATE')) return 'text-indigo-600 bg-indigo-50';
    return 'text-gray-600 bg-gray-50';
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatActionDescription = (activity: ActivityLogEntry): string => {
    const action = activity.action.toLowerCase().replace(/_/g, ' ');
    const resource = activity.resource.toLowerCase();
    
    switch (activity.action) {
      case 'LOGIN':
        return `Logged into the system${activity.details?.loginMethod ? ` via ${activity.details.loginMethod}` : ''}`;
      case 'LOGOUT':
        return 'Logged out of the system';
      case 'UPDATE_PROFILE':
        const changedFields = activity.details?.changed_fields;
        return `Updated profile${changedFields ? ` (${changedFields.join(', ')})` : ''}`;
      case 'UPLOAD_DOCUMENT':
        const docType = activity.details?.document_type?.replace(/_/g, ' ').toLowerCase();
        return `Uploaded ${docType || 'document'}${activity.details?.filename ? ` (${activity.details.filename})` : ''}`;
      case 'PASSWORD_CHANGE':
        return 'Changed password';
      default:
        return `${action.charAt(0).toUpperCase() + action.slice(1)} ${resource}`;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <PermissionGate 
      commonPermission={COMMON_PERMISSIONS.VIEW_ALL_USERS}
      fallback={
        <div className="text-center p-8 text-gray-500">
          <div className="text-4xl mb-3">🔒</div>
          <p>You don't have permission to view user activity logs.</p>
        </div>
      }
    >
      <div className={`space-y-4 ${className}`}>
      {/* Header with Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 text-sm">📋</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-charcoal">Activity Log</h3>
            <p className="text-sm text-gray-600">Recent user activities and actions</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Filter:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-warm-gold"
          >
            <option value="ALL">All Activities</option>
            <option value="LOGIN">Login/Logout</option>
            <option value="PROFILE">Profile Changes</option>
            <option value="DOCUMENTS">Documents</option>
            <option value="PERMISSIONS">Permissions</option>
          </select>
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-8">
            <LoadingSpinner size="lg" text="Loading activity log..." />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">📋</div>
            <h4 className="text-lg font-medium text-charcoal mb-2">No activities found</h4>
            <p className="text-gray-600">
              {filter === 'ALL' 
                ? 'No activities recorded for this user yet'
                : `No ${filter.toLowerCase()} activities found`
              }
            </p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start space-x-3">
                {/* Action Icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActionColor(activity.action)}`}>
                  <span className="text-sm">{getActionIcon(activity.action)}</span>
                </div>

                {/* Activity Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-charcoal">
                      {formatActionDescription(activity)}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>

                  {/* Additional Details */}
                  {activity.details && (
                    <div className="mt-2 space-y-1">
                      {activity.action === 'UPDATE_PROFILE' && activity.details.changed_fields && (
                        <div className="text-xs text-gray-600 bg-gray-50 rounded p-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {activity.details.changed_fields.map((field: string) => (
                              <div key={field} className="flex flex-col">
                                <span className="font-medium">{field}:</span>
                                <span className="text-red-600">- {activity.details?.old_values?.[field] || 'N/A'}</span>
                                <span className="text-green-600">+ {activity.details?.new_values?.[field] || 'N/A'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {activity.action === 'UPLOAD_DOCUMENT' && (
                        <div className="text-xs text-gray-600 bg-gray-50 rounded p-2">
                          <div className="grid grid-cols-2 gap-2">
                            <span>Type: {activity.details.document_type?.replace(/_/g, ' ')}</span>
                            <span>Size: {formatFileSize(activity.details.size)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    {activity.ipAddress && (
                      <span className="flex items-center space-x-1">
                        <span>🌐</span>
                        <span>{activity.ipAddress}</span>
                      </span>
                    )}
                    <span className="flex items-center space-x-1">
                      <span>🕒</span>
                      <span>{new Date(activity.timestamp).toLocaleString()}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More Button (for pagination) */}
      {activities.length >= maxEntries && (
        <div className="text-center pt-4">
          <button
            onClick={() => {
              // Implement load more functionality
              toast('Load more functionality would be implemented here');
            }}
            className="px-4 py-2 text-warm-gold hover:text-orange-600 border border-warm-gold hover:border-orange-600 rounded-md transition-colors"
          >
            Load More Activities
          </button>
        </div>
      )}
      </div>
    </PermissionGate>
  );
};

export default UserActivityLog;