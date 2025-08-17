import React, { useState, useEffect } from 'react';
import { departmentService, Department } from '../services/departmentService';
import { userService, User } from '../services/userService';

interface ChangeDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSuccess: () => void;
}

const ChangeDepartmentModal: React.FC<ChangeDepartmentModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadDepartments();
      setSelectedDepartmentId(user.departmentId || '');
      setError('');
    }
  }, [isOpen, user.departmentId]);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const response = await departmentService.getDepartments();
      setDepartments(response.data || []);
    } catch (error) {
      console.error('Failed to load departments:', error);
      setError('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      if (selectedDepartmentId === user.departmentId) {
        onClose();
        return;
      }

      if (selectedDepartmentId) {
        // Change to new department
        await userService.changeUserDepartment(user.id, selectedDepartmentId);
      } else {
        // Remove from department
        await userService.removeFromDepartment(user.id);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to change department:', error);
      setError(error?.response?.data?.message || 'Failed to change department');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFromDepartment = async () => {
    try {
      setSaving(true);
      setError('');

      await userService.removeFromDepartment(user.id);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to remove from department:', error);
      setError(error?.response?.data?.message || 'Failed to remove from department');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const canRemoveFromDepartment = user.role !== 'DEPARTMENT_ADMIN' && user.role !== 'STAFF';
  const currentDepartmentName = user.department?.name || 'No Department';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-sand">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-heading font-bold text-charcoal">
              Change Department
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900">
              {user.firstName} {user.lastName}
            </h3>
            <p className="text-sm text-gray-600">{user.email}</p>
            <p className="text-xs text-gray-500 capitalize">{user.role.toLowerCase()}</p>
            <p className="text-sm text-warm-gold font-medium mt-1">
              Current: {currentDepartmentName}
            </p>
          </div>

          {/* Department Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Department
            </label>
            {loading ? (
              <div className="text-sm text-gray-500">Loading departments...</div>
            ) : (
              <select
                value={selectedDepartmentId}
                onChange={(e) => setSelectedDepartmentId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold"
                disabled={saving}
              >
                <option value="">-- Select Department --</option>
                {departments.map((dept) => (
                  <option 
                    key={dept.id} 
                    value={dept.id}
                    disabled={dept.id === user.departmentId}
                  >
                    {dept.name}
                    {dept.id === user.departmentId ? ' (Current)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Role Warning */}
          {user.role === 'SUPERADMIN' && selectedDepartmentId && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <div className="text-yellow-600">⚠️</div>
                <div className="text-sm text-yellow-800">
                  <strong>Warning:</strong> Superadmins typically don't belong to specific departments.
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <div className="text-red-600">❌</div>
                <div className="text-sm text-red-800">{error}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between">
          <div>
            {canRemoveFromDepartment && user.departmentId && (
              <button
                onClick={handleRemoveFromDepartment}
                disabled={saving}
                className="px-4 py-2 text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
              >
                Remove from Department
              </button>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading || selectedDepartmentId === user.departmentId}
              className="px-4 py-2 bg-warm-gold text-white rounded-md hover:bg-opacity-90 disabled:opacity-50 font-medium"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangeDepartmentModal;