import React from 'react';
import { useUserRoleManagement } from '../../hooks/useUserRoleManagement';
import RoleBadge from '../RoleBadge';

interface UserRoleHistoryProps {
  userId: string;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
  maxEntries?: number;
}

const UserRoleHistory: React.FC<UserRoleHistoryProps> = ({
  userId,
  userName,
  isOpen,
  onClose,
  maxEntries = 50
}) => {
  const { roleHistory, isLoadingHistory } = useUserRoleManagement(userId);

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'ASSIGNED':
        return '✅';
      case 'REMOVED':
        return '❌';
      case 'EXPIRED':
        return '⏰';
      default:
        return '📝';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'ASSIGNED':
        return 'text-green-600';
      case 'REMOVED':
        return 'text-red-600';
      case 'EXPIRED':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Role Assignment History
              </h2>
              <p className="text-sm text-gray-600">{userName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: '60vh' }}>
          {isLoadingHistory ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex space-x-4">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : roleHistory && roleHistory.length > 0 ? (
            <div className="p-6">
              <div className="space-y-4">
                {roleHistory.slice(0, maxEntries).map((entry, index) => (
                  <div key={entry.id} className="relative">
                    {/* Timeline Line */}
                    {index < roleHistory.length - 1 && (
                      <div className="absolute left-4 top-8 bottom-0 w-px bg-gray-200"></div>
                    )}
                    
                    {/* Timeline Item */}
                    <div className="flex space-x-4">
                      {/* Icon */}
                      <div className="flex-shrink-0 w-8 h-8 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm">{getActionIcon(entry.action)}</span>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className={`font-medium ${getActionColor(entry.action)}`}>
                                {entry.action === 'ASSIGNED' ? 'Assigned' :
                                 entry.action === 'REMOVED' ? 'Removed' :
                                 entry.action === 'EXPIRED' ? 'Expired' : entry.action}
                              </span>
                              <RoleBadge 
                                role={entry.roleName} 
                                variant="custom" 
                                size="sm"
                                showTooltip={false}
                              />
                            </div>
                            
                            <div className="mt-1 text-sm text-gray-600">
                              <div>{formatDate(entry.assignedAt)}</div>
                              
                              {entry.assignedBy && (
                                <div className="mt-1">
                                  by {entry.assignedBy.firstName} {entry.assignedBy.lastName}
                                </div>
                              )}
                              
                              {entry.reason && (
                                <div className="mt-1 italic text-gray-500">
                                  "{entry.reason}"
                                </div>
                              )}
                              
                              {entry.removedAt && (
                                <div className="mt-1 text-red-600">
                                  Removed: {formatDate(entry.removedAt)}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Duration Badge */}
                          {entry.assignedAt && entry.removedAt && (
                            <div className="flex-shrink-0">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {Math.ceil(
                                  (new Date(entry.removedAt).getTime() - new Date(entry.assignedAt).getTime()) / (1000 * 60 * 60 * 24)
                                )} days
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Metadata */}
                        {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                            <div className="font-medium text-gray-700 mb-1">Additional Information:</div>
                            {Object.entries(entry.metadata).map(([key, value]) => (
                              <div key={key} className="text-gray-600">
                                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span> {String(value)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Show More Button */}
              {roleHistory.length > maxEntries && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => {/* Implement load more functionality */}}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    Show {roleHistory.length - maxEntries} more entries
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">📜</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Role History
              </h3>
              <p className="text-gray-600">
                No role assignment history found for this user.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {roleHistory && roleHistory.length > 0 && (
                <span>Showing {Math.min(maxEntries, roleHistory.length)} of {roleHistory.length} entries</span>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRoleHistory;