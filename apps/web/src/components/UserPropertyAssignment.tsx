import React, { useState, useEffect, useMemo } from 'react';
import { useTenant, useTenantPermissions } from '../contexts/TenantContext';
import { useLanguage } from '../contexts/LanguageContext';
import { propertyService, Property } from '../services/propertyService';
import { userService, User } from '../services/userService';

interface UserPropertyAssignmentProps {
  user?: User;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface PropertyAssignment {
  property: Property;
  isAssigned: boolean;
  canModify: boolean;
}

const UserPropertyAssignment: React.FC<UserPropertyAssignmentProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { availableProperties, organizationId } = useTenant();
  const { canManageProperty } = useTenantPermissions();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [userProperties, setUserProperties] = useState<string[]>([]);
  const [pendingChanges, setPendingChanges] = useState<Set<string>>(new Set());

  // Load all properties for the organization
  useEffect(() => {
    if (isOpen && organizationId) {
      loadProperties();
    }
  }, [isOpen, organizationId]);

  // Load user's current property assignments
  useEffect(() => {
    if (isOpen && user) {
      loadUserProperties();
    }
  }, [isOpen, user]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await propertyService.getProperties({
        organizationId: organizationId,
        isActive: true
      });
      setAllProperties(response.data || []);
    } catch (err) {
      console.error('Failed to load properties:', err);
      setError('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const loadUserProperties = async () => {
    if (!user) return;
    
    try {
      // This would typically come from a user-properties endpoint
      // For now, we'll use the user's available properties
      const properties = user.properties || [];
      setUserProperties(properties.map(p => p.id));
    } catch (err) {
      console.error('Failed to load user properties:', err);
      setError('Failed to load user properties');
    }
  };

  // Create property assignments with current state
  const propertyAssignments: PropertyAssignment[] = useMemo(() => {
    return allProperties.map(property => ({
      property,
      isAssigned: pendingChanges.has(property.id) 
        ? !userProperties.includes(property.id)
        : userProperties.includes(property.id),
      canModify: canManageProperty(property.id)
    }));
  }, [allProperties, userProperties, pendingChanges, canManageProperty]);

  const handleToggleProperty = (propertyId: string) => {
    setPendingChanges(prev => {
      const newSet = new Set(prev);
      if (newSet.has(propertyId)) {
        newSet.delete(propertyId);
      } else {
        newSet.add(propertyId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    if (!user || pendingChanges.size === 0) return;

    setSaving(true);
    setError(null);

    try {
      // Calculate final assignments
      const finalAssignments = [...userProperties];
      
      for (const propertyId of pendingChanges) {
        const index = finalAssignments.indexOf(propertyId);
        if (index > -1) {
          finalAssignments.splice(index, 1); // Remove
        } else {
          finalAssignments.push(propertyId); // Add
        }
      }

      // Update user property assignments
      // This would typically call a specific endpoint for managing user-property assignments
      await userService.updateUser(user.id, {
        propertyIds: finalAssignments
      });

      setPendingChanges(new Set());
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to update property assignments:', err);
      setError('Failed to update property assignments');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setPendingChanges(new Set());
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const hasChanges = pendingChanges.size > 0;
  const assignedCount = propertyAssignments.filter(pa => pa.isAssigned).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-sand">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-heading font-bold text-charcoal">
                Property Access Management
              </h2>
              {user && (
                <p className="text-sm text-gray-600 mt-1">
                  Managing access for {user.firstName} {user.lastName}
                </p>
              )}
            </div>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              disabled={saving}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>{assignedCount} assigned</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                <span>{allProperties.length - assignedCount} available</span>
              </div>
            </div>
            {hasChanges && (
              <div className="flex items-center space-x-2 text-orange-600">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                <span>{pendingChanges.size} pending changes</span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <div className="text-red-600">❌</div>
                <div className="text-sm text-red-800">{error}</div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-2 border-warm-gold border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600">Loading properties...</span>
              </div>
            </div>
          ) : allProperties.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🏢</div>
              <h3 className="text-lg font-semibold text-charcoal mb-2">
                No Properties Available
              </h3>
              <p className="text-gray-600">
                No properties found for this organization.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {propertyAssignments.map((assignment) => {
                const isChanged = pendingChanges.has(assignment.property.id);
                const willBeAssigned = isChanged ? !assignment.isAssigned : assignment.isAssigned;

                return (
                  <div
                    key={assignment.property.id}
                    className={`border rounded-lg p-4 transition-colors ${
                      isChanged ? 'border-orange-200 bg-orange-50' : 'border-gray-200'
                    } ${!assignment.canModify ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-warm-gold text-white rounded-full flex items-center justify-center font-medium">
                          {assignment.property.name[0]?.toUpperCase() || 'P'}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-charcoal">
                            {assignment.property.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {assignment.property.code}
                          </p>
                          {assignment.property.address && (
                            <p className="text-xs text-gray-400 mt-1">
                              {typeof assignment.property.address === 'string' 
                                ? assignment.property.address
                                : `${assignment.property.address.city || ''}, ${assignment.property.address.country || ''}`
                              }
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {isChanged && (
                          <span className="text-xs text-orange-600 font-medium">
                            {willBeAssigned ? '+ Adding' : '- Removing'}
                          </span>
                        )}
                        
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={willBeAssigned}
                            onChange={() => handleToggleProperty(assignment.property.id)}
                            disabled={!assignment.canModify || saving}
                            className="w-5 h-5 text-warm-gold border-gray-300 rounded focus:ring-warm-gold disabled:opacity-50"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            {willBeAssigned ? 'Assigned' : 'Not Assigned'}
                          </span>
                        </label>
                      </div>
                    </div>

                    {!assignment.canModify && (
                      <div className="mt-2 text-xs text-gray-500">
                        ⚠️ You don't have permission to modify access to this property
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {hasChanges ? (
                <span className="text-orange-600">
                  {pendingChanges.size} unsaved change{pendingChanges.size !== 1 ? 's' : ''}
                </span>
              ) : (
                <span>No changes to save</span>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="px-4 py-2 bg-warm-gold text-white rounded-md hover:bg-opacity-90 disabled:opacity-50 font-medium"
              >
                {saving ? (
                  <span className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </span>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPropertyAssignment;