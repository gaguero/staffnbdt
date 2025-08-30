import React from 'react';
import { BulkActionBarProps } from '../../types/userRoleMatrix';
import LoadingSpinner from '../LoadingSpinner';

const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedUsers,
  selectedRoles,
  onBulkAssign,
  onBulkUnassign,
  onClearSelection,
  isLoading,
  className = '',
}) => {
  const userCount = selectedUsers.size;
  const roleCount = selectedRoles.size;
  const hasSelection = userCount > 0 || roleCount > 0;
  const canPerformBulkActions = userCount > 0 && roleCount > 0;

  if (!hasSelection) {
    return null;
  }

  const getActionDescription = () => {
    if (userCount === 1 && roleCount === 1) {
      return 'Assign/unassign 1 role to 1 user';
    } else if (userCount === 1) {
      return `Assign/unassign ${roleCount} roles to 1 user`;
    } else if (roleCount === 1) {
      return `Assign/unassign 1 role to ${userCount} users`;
    } else {
      return `Assign/unassign ${roleCount} roles to ${userCount} users`;
    }
  };

  const getTotalOperations = () => {
    return userCount * roleCount;
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 transform transition-all duration-300 
                    ${hasSelection ? 'translate-y-0' : 'translate-y-full'} ${className}`}>
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-10" />
      
      {/* Action bar */}
      <div className="relative bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {/* Selection summary */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-gray-900">
                  Bulk Operations Active
                </span>
              </div>
              
              <div className="text-sm text-gray-600">
                {userCount > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full
                                 text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                    {userCount} {userCount === 1 ? 'user' : 'users'}
                  </span>
                )}
                
                {roleCount > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full
                                 text-xs font-medium bg-green-100 text-green-800">
                    {roleCount} {roleCount === 1 ? 'role' : 'roles'}
                  </span>
                )}
              </div>
              
              {canPerformBulkActions && (
                <div className="text-xs text-gray-500">
                  {getActionDescription()} ({getTotalOperations()} operations)
                </div>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center space-x-3">
              {!canPerformBulkActions && (
                <div className="text-sm text-amber-600 flex items-center space-x-1">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>Select both users and roles to perform bulk actions</span>
                </div>
              )}
              
              {canPerformBulkActions && (
                <>
                  <button
                    onClick={onBulkAssign}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent
                             text-sm font-medium rounded-md text-white bg-green-600
                             hover:bg-green-700 focus:outline-none focus:ring-2
                             focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50
                             disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {isLoading ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Assigning...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Assign Roles
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={onBulkUnassign}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 border border-gray-300
                             text-sm font-medium rounded-md text-gray-700 bg-white
                             hover:bg-gray-50 focus:outline-none focus:ring-2
                             focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50
                             disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {isLoading ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Unassigning...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                        Unassign Roles
                      </>
                    )}
                  </button>
                </>
              )}
              
              <button
                onClick={onClearSelection}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-2 border border-gray-300
                         text-sm font-medium rounded-md text-gray-700 bg-white
                         hover:bg-gray-50 focus:outline-none focus:ring-2
                         focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50
                         disabled:cursor-not-allowed transition-colors duration-200"
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            </div>
          </div>
        </div>
        
        {/* Progress bar for bulk operations */}
        {isLoading && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
            <div className="h-full bg-blue-600 animate-pulse" style={{ width: '100%' }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkActionBar;
