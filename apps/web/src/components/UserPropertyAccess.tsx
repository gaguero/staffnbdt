import React, { useState } from 'react';
import { User } from '../services/userService';
import { Property } from '../services/propertyService';
import { useTenantPermissions } from '../contexts/TenantContext';
import UserPropertyAssignment from './UserPropertyAssignment';

interface UserPropertyAccessProps {
  user: User;
  compact?: boolean;
  showManageButton?: boolean;
  onUpdate?: () => void;
}

const UserPropertyAccess: React.FC<UserPropertyAccessProps> = ({
  user,
  compact = false,
  showManageButton = true,
  onUpdate
}) => {
  const { canManageProperty } = useTenantPermissions();
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  const userProperties = user.properties || [];
  const hasAccess = userProperties.length > 0;
  const canManage = canManageProperty() && showManageButton;

  // Helper function to format address
  const formatAddress = (address: Property['address']): string => {
    if (!address) return '';
    
    if (typeof address === 'string') {
      return address;
    }
    
    if (typeof address === 'object') {
      const parts = [];
      if (address.city) parts.push(address.city);
      if (address.state) parts.push(address.state);
      if (address.country) parts.push(address.country);
      return parts.join(', ');
    }
    
    return '';
  };

  if (compact) {
    return (
      <div className="inline-flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          {hasAccess ? (
            <>
              <span className="text-sm text-gray-900">
                {userProperties.length} {userProperties.length === 1 ? 'property' : 'properties'}
              </span>
              {userProperties.length <= 2 ? (
                <div className="flex space-x-1">
                  {userProperties.map((property) => (
                    <span
                      key={property.id}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-warm-gold bg-opacity-10 text-warm-gold"
                      title={property.name}
                    >
                      {property.code || property.name}
                    </span>
                  ))}
                </div>
              ) : (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-warm-gold bg-opacity-10 text-warm-gold cursor-help"
                  title={userProperties.map(p => p.name).join(', ')}
                >
                  {userProperties.slice(0, 2).map(p => p.code || p.name.charAt(0)).join(', ')} +{userProperties.length - 2}
                </span>
              )}
            </>
          ) : (
            <span className="text-sm text-gray-500">No access</span>
          )}
        </div>
        
        {canManage && (
          <button
            onClick={() => setShowAssignmentModal(true)}
            className="text-xs text-warm-gold hover:text-opacity-80 underline"
            title="Manage property access"
          >
            Manage
          </button>
        )}

        <UserPropertyAssignment
          user={user}
          isOpen={showAssignmentModal}
          onClose={() => setShowAssignmentModal(false)}
          onSuccess={() => {
            setShowAssignmentModal(false);
            onUpdate?.();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">
          Property Access
        </h4>
        {canManage && (
          <button
            onClick={() => setShowAssignmentModal(true)}
            className="text-sm text-warm-gold hover:text-opacity-80 font-medium"
          >
            Manage Access
          </button>
        )}
      </div>

      {hasAccess ? (
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>{userProperties.length} {userProperties.length === 1 ? 'property' : 'properties'} assigned</span>
          </div>
          
          <div className="grid gap-2">
            {userProperties.map((property) => (
              <div
                key={property.id}
                className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div className="w-8 h-8 bg-warm-gold text-white rounded-full flex items-center justify-center text-xs font-medium">
                  {property.name[0]?.toUpperCase() || 'P'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {property.name}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{property.code}</span>
                    {formatAddress(property.address) && (
                      <>
                        <span>•</span>
                        <span className="truncate">{formatAddress(property.address)}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-green-600">
                  <span className="text-xs">✓</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-4 bg-gray-50 rounded-lg border border-gray-100">
          <div className="text-2xl mb-1">🏢</div>
          <p className="text-sm text-gray-500 mb-2">
            No property access assigned
          </p>
          {canManage && (
            <button
              onClick={() => setShowAssignmentModal(true)}
              className="text-sm text-warm-gold hover:text-opacity-80 underline"
            >
              Assign Properties
            </button>
          )}
        </div>
      )}

      <UserPropertyAssignment
        user={user}
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        onSuccess={() => {
          setShowAssignmentModal(false);
          onUpdate?.();
        }}
      />
    </div>
  );
};

export default UserPropertyAccess;