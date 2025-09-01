import React, { useState, useEffect } from 'react';
import { userService, User } from '../services/userService';
import { departmentService, Department } from '../services/departmentService';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSuccess: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    departmentId: '',
    position: '',
    phoneNumber: '',
    hireDate: '',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        departmentId: user.departmentId || '',
        position: user.position || '',
        phoneNumber: user.phoneNumber || '',
        hireDate: user.hireDate ? user.hireDate.split('T')[0] : '',
        emergencyContactName: user.emergencyContact?.name || '',
        emergencyContactRelationship: user.emergencyContact?.relationship || '',
        emergencyContactPhone: user.emergencyContact?.phoneNumber || '',
      });
      loadDepartments();
      setError('');
    }
  }, [isOpen, user]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      const updateData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        departmentId: formData.departmentId || null,
        position: formData.position || null,
        phoneNumber: formData.phoneNumber || null,
        hireDate: formData.hireDate || null,
      };

      // Add emergency contact if provided
      if (formData.emergencyContactName) {
        updateData.emergencyContact = {
          name: formData.emergencyContactName,
          relationship: formData.emergencyContactRelationship,
          phoneNumber: formData.emergencyContactPhone,
        };
      }

      await userService.updateUser(user.id, updateData);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to update user:', error);
      setError(error?.response?.data?.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const formatRole = (role: string) => {
    return role.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200" style={{ backgroundColor: 'var(--brand-background)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Avatar */}
              <div className="w-12 h-12 text-white rounded-full flex items-center justify-center font-medium text-lg" style={{ backgroundColor: 'var(--brand-primary)' }}>
                {formData.firstName[0] || '?'}{formData.lastName[0] || '?'}
              </div>
              <div>
                <h2 className="text-xl font-heading font-bold" style={{ color: 'var(--brand-text-primary)' }}>
                  Edit User Details
                </h2>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              disabled={saving}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-charcoal border-b border-gray-200 pb-2">
                Basic Information
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold"
                    disabled={saving}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold"
                    disabled={saving}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold"
                    disabled={saving}
                    required
                  />
                </div>

                {/* Role selection removed; manage roles and direct permissions via User Access modal */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold"
                    disabled={saving || loading}
                  >
                    <option value="">No Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold"
                    disabled={saving}
                    placeholder="e.g., Software Developer"
                  />
                </div>
              </div>
            </div>

            {/* Contact & Employment Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-charcoal border-b border-gray-200 pb-2">
                Contact & Employment
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold"
                    disabled={saving}
                    placeholder="+1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hire Date
                  </label>
                  <input
                    type="date"
                    name="hireDate"
                    value={formData.hireDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold"
                    disabled={saving}
                  />
                </div>

                {/* Emergency Contact */}
                <div className="space-y-2">
                  <h4 className="text-md font-medium text-gray-700">Emergency Contact</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      name="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold"
                      disabled={saving}
                      placeholder="Emergency contact name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Relationship
                    </label>
                    <input
                      type="text"
                      name="emergencyContactRelationship"
                      value={formData.emergencyContactRelationship}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold"
                      disabled={saving}
                      placeholder="e.g., Spouse, Parent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      name="emergencyContactPhone"
                      value={formData.emergencyContactPhone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold"
                      disabled={saving}
                      placeholder="+1234567890"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Role assignment warnings removed; access is managed in the dedicated modal */}

          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <div className="text-red-600">❌</div>
                <div className="text-sm text-red-800">{error}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !formData.firstName || !formData.lastName || !formData.email || !formData.role}
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

export default EditUserModal;