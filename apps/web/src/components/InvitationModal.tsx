import React, { useState, useEffect } from 'react';
import { invitationService, CreateInvitationData } from '../services/invitationService';
import { departmentService, Department } from '../services/departmentService';
import LoadingSpinner from './LoadingSpinner';
import PermissionGate from './PermissionGate';
import { COMMON_PERMISSIONS } from '../types/permission';
import toast from 'react-hot-toast';

interface InvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  prefilledData?: Partial<CreateInvitationData>;
}

const InvitationModal: React.FC<InvitationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  prefilledData = {},
}) => {
  const [formData, setFormData] = useState<CreateInvitationData>({
    email: '',
    role: 'STAFF',
    departmentId: '',
    propertyId: '',
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        email: prefilledData.email || '',
        role: prefilledData.role || 'STAFF',
        departmentId: prefilledData.departmentId || '',
        propertyId: prefilledData.propertyId || '',
      });
      setErrors({});
      loadDepartments();
    }
  }, [isOpen, prefilledData]);

  const loadDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const response = await departmentService.getDepartments();
      setDepartments(response.data || []);
    } catch (error) {
      console.error('Failed to load departments:', error);
      toast.error('Failed to load departments');
    } finally {
      setLoadingDepartments(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    // Department validation for non-super admin roles
    if (['STAFF', 'DEPARTMENT_ADMIN'].includes(formData.role) && !formData.departmentId) {
      newErrors.departmentId = 'Department is required for this role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const invitationData: CreateInvitationData = {
        email: formData.email.trim(),
        role: formData.role,
        departmentId: formData.departmentId || undefined,
        propertyId: formData.propertyId || undefined,
      };

      await invitationService.createInvitation(invitationData);
      
      toast.success(`Invitation sent to ${invitationData.email}`);
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error: any) {
      console.error('Failed to send invitation:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to send invitation';
      
      // Handle specific errors
      if (errorMessage.includes('already exists')) {
        setErrors({ email: 'A user with this email already exists' });
      } else if (errorMessage.includes('pending invitation')) {
        setErrors({ email: 'A pending invitation already exists for this email' });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const availableRoles = [
    { value: 'STAFF', label: 'Staff', description: 'Basic user access' },
    { value: 'DEPARTMENT_ADMIN', label: 'Department Admin', description: 'Manage department users' },
    { value: 'PROPERTY_MANAGER', label: 'Property Manager', description: 'Manage entire property' },
    { value: 'ORGANIZATION_ADMIN', label: 'Organization Admin', description: 'Manage organization settings' },
    { value: 'ORGANIZATION_OWNER', label: 'Organization Owner', description: 'Full organization access' },
  ];

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <PermissionGate 
          commonPermission={COMMON_PERMISSIONS.CREATE_USER}
          fallback={
            <div className="p-6 text-center">
              <div className="text-4xl mb-3">🔒</div>
              <h3 className="text-lg font-bold text-charcoal mb-2">Access Denied</h3>
              <p className="text-gray-600 mb-4">You don't have permission to send user invitations.</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          }
        >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-sand">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-warm-gold text-white rounded-full flex items-center justify-center">
                <span className="text-lg">📧</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-charcoal">
                  Send User Invitation
                </h3>
                <p className="text-sm text-gray-600">
                  Invite a new user to join the platform
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-warm-gold ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="user@example.com"
              disabled={loading}
              required
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Role *
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-warm-gold ${
                errors.role ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
              required
            >
              {availableRoles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role}</p>
            )}
            {formData.role && (
              <p className="mt-1 text-xs text-gray-500">
                {availableRoles.find(r => r.value === formData.role)?.description}
              </p>
            )}
          </div>

          {/* Department (required for STAFF and DEPARTMENT_ADMIN) */}
          {['STAFF', 'DEPARTMENT_ADMIN'].includes(formData.role) && (
            <div>
              <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700 mb-2">
                Department *
              </label>
              {loadingDepartments ? (
                <div className="flex items-center justify-center py-2">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2 text-sm text-gray-600">Loading departments...</span>
                </div>
              ) : (
                <select
                  id="departmentId"
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-warm-gold ${
                    errors.departmentId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loading}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {'  '.repeat(dept.level || 0)}{dept.name}
                      {dept.parent ? ` (under ${dept.parent.name})` : ''}
                    </option>
                  ))}
                </select>
              )}
              {errors.departmentId && (
                <p className="mt-1 text-sm text-red-600">{errors.departmentId}</p>
              )}
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-start space-x-3">
              <div className="text-blue-600 text-lg">ℹ️</div>
              <div className="text-sm text-blue-700">
                <h4 className="font-medium mb-1">What happens next?</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>An invitation email will be sent to the provided address</li>
                  <li>The recipient can accept the invitation within 7 days</li>
                  <li>They'll be prompted to set up their password and profile</li>
                  <li>You can track invitation status in the User Management page</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-warm-gold text-white rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <span className="mr-2">📧</span>
                  Send Invitation
                </>
              )}
            </button>
          </div>
        </form>
        </PermissionGate>
      </div>
    </div>
  );
};

export default InvitationModal;