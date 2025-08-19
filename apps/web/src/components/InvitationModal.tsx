import React, { useState, useEffect } from 'react';
import { invitationService, CreateInvitationData } from '../services/invitationService';
import { departmentService, Department } from '../services/departmentService';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

interface InvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const InvitationModal: React.FC<InvitationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<CreateInvitationData>({
    email: '',
    role: 'STAFF',
    departmentId: '',
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Load departments when modal opens
  useEffect(() => {
    if (isOpen) {
      loadDepartments();
      // Reset form when opening
      setFormData({
        email: '',
        role: 'STAFF',
        departmentId: '',
      });
      setErrors({});
    }
  }, [isOpen]);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const response = await departmentService.getDepartments();
      setDepartments(response.data || []);
    } catch (error) {
      console.error('Failed to load departments:', error);
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    // Department validation for specific roles
    if ((formData.role === 'STAFF' || formData.role === 'DEPARTMENT_ADMIN') && !formData.departmentId) {
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

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      
      const invitationData: CreateInvitationData = {
        email: formData.email.trim(),
        role: formData.role,
      };

      // Only include departmentId if role requires it
      if (formData.role !== 'PROPERTY_MANAGER' && formData.departmentId) {
        invitationData.departmentId = formData.departmentId;
      }

      await invitationService.createInvitation(invitationData);
      
      toast.success(`Invitation sent successfully to ${formData.email}`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to send invitation:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to send invitation';
      toast.error(errorMessage);
      
      // Set server-side errors
      if (error?.response?.data?.field) {
        setErrors({
          [error.response.data.field]: errorMessage,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      email: '',
      role: 'STAFF',
      departmentId: '',
    });
    setErrors({});
    onClose();
  };

  const availableRoles = [
    { value: 'STAFF', label: 'Staff' },
    { value: 'DEPARTMENT_ADMIN', label: 'Department Admin' },
    { value: 'PROPERTY_MANAGER', label: 'Property Manager' },
  ];

  const formatRole = (role: string) => {
    return role.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-sand">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-warm-gold text-white rounded-full flex items-center justify-center">
                <span className="text-lg">📧</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-charcoal">
                  Send Invitation
                </h2>
                <p className="text-sm text-gray-600">
                  Invite a new user to join the platform
                </p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              disabled={submitting}
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="py-8">
              <LoadingSpinner size="lg" text="Loading departments..." />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold transition-colors ${
                    errors.email 
                      ? 'border-red-300 focus:border-red-300 focus:ring-red-200' 
                      : 'border-gray-300 focus:border-warm-gold'
                  }`}
                  placeholder="user@example.com"
                  disabled={submitting}
                  required
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="mt-1 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Role Field */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold transition-colors ${
                    errors.role 
                      ? 'border-red-300 focus:border-red-300 focus:ring-red-200' 
                      : 'border-gray-300 focus:border-warm-gold'
                  }`}
                  disabled={submitting}
                  required
                  aria-describedby={errors.role ? 'role-error' : undefined}
                >
                  {availableRoles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                {errors.role && (
                  <p id="role-error" className="mt-1 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.role}
                  </p>
                )}
              </div>

              {/* Department Field - Only show for roles that need it */}
              {formData.role !== 'PROPERTY_MANAGER' && (
                <div>
                  <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700 mb-1">
                    Department {(formData.role === 'STAFF' || formData.role === 'DEPARTMENT_ADMIN') && '*'}
                  </label>
                  <select
                    id="departmentId"
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold transition-colors ${
                      errors.departmentId 
                        ? 'border-red-300 focus:border-red-300 focus:ring-red-200' 
                        : 'border-gray-300 focus:border-warm-gold'
                    }`}
                    disabled={submitting}
                    required={formData.role === 'STAFF' || formData.role === 'DEPARTMENT_ADMIN'}
                    aria-describedby={errors.departmentId ? 'department-error' : undefined}
                  >
                    <option value="">
                      {(formData.role === 'STAFF' || formData.role === 'DEPARTMENT_ADMIN') 
                        ? 'Select Department' 
                        : 'No Department'
                      }
                    </option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {'  '.repeat(dept.level || 0)}{dept.name}
                        {dept.parent ? ` (under ${dept.parent.name})` : ''}
                      </option>
                    ))}
                  </select>
                  {errors.departmentId && (
                    <p id="department-error" className="mt-1 text-sm text-red-600 flex items-center">
                      <span className="mr-1">⚠️</span>
                      {errors.departmentId}
                    </p>
                  )}
                </div>
              )}

              {/* Role Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600 text-sm">ℹ️</span>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">About {formatRole(formData.role)} Role:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      {formData.role === 'STAFF' && (
                        <>
                          <li>Basic access to assigned department resources</li>
                          <li>Can view and update own profile information</li>
                          <li>Limited administrative capabilities</li>
                        </>
                      )}
                      {formData.role === 'DEPARTMENT_ADMIN' && (
                        <>
                          <li>Manage users within assigned department</li>
                          <li>Access to department reports and analytics</li>
                          <li>Can assign tasks and manage schedules</li>
                        </>
                      )}
                      {formData.role === 'PROPERTY_MANAGER' && (
                        <>
                          <li>Full access to all hotel operations</li>
                          <li>Manage all departments and users</li>
                          <li>Access to comprehensive reporting</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Warning for Property Manager role */}
              {formData.role === 'PROPERTY_MANAGER' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <span className="text-yellow-600">⚠️</span>
                    <div className="text-sm text-yellow-800">
                      <strong>Note:</strong> Property Managers have full access to all hotel operations and don't belong to specific departments.
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={submitting}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={submitting || loading || !formData.email || !formData.role}
              className="px-6 py-2 bg-warm-gold text-white rounded-md hover:bg-opacity-90 disabled:opacity-50 font-medium transition-colors flex items-center"
            >
              {submitting ? (
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
        </div>
      </div>
    </div>
  );
};

export default InvitationModal;