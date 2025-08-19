import React, { useState, useEffect } from 'react';
import { profileService, EmergencyContactsData } from '../services/profileService';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
}

interface EmergencyContactsFormProps {
  initialData?: EmergencyContactsData | null;
  onSave?: (data: EmergencyContactsData) => void;
  onCancel?: () => void;
  isEditing: boolean;
  className?: string;
}

const EmergencyContactsForm: React.FC<EmergencyContactsFormProps> = ({
  initialData,
  onSave,
  onCancel,
  isEditing,
  className = '',
}) => {
  const [formData, setFormData] = useState<EmergencyContactsData>({
    primaryContact: {
      name: '',
      relationship: '',
      phoneNumber: '',
      email: '',
    },
    secondaryContact: {
      name: '',
      relationship: '',
      phoneNumber: '',
      email: '',
    },
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      setFormData({
        primaryContact: {
          name: initialData.primaryContact?.name || '',
          relationship: initialData.primaryContact?.relationship || '',
          phoneNumber: initialData.primaryContact?.phoneNumber || '',
          email: initialData.primaryContact?.email || '',
        },
        secondaryContact: {
          name: initialData.secondaryContact?.name || '',
          relationship: initialData.secondaryContact?.relationship || '',
          phoneNumber: initialData.secondaryContact?.phoneNumber || '',
          email: initialData.secondaryContact?.email || '',
        },
      });
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Primary contact validation
    if (!formData.primaryContact?.name?.trim()) {
      newErrors['primaryContact.name'] = 'Primary contact name is required';
    }

    if (!formData.primaryContact?.phoneNumber?.trim()) {
      newErrors['primaryContact.phoneNumber'] = 'Primary contact phone number is required';
    } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(formData.primaryContact.phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
      newErrors['primaryContact.phoneNumber'] = 'Please enter a valid phone number';
    }

    if (!formData.primaryContact?.relationship?.trim()) {
      newErrors['primaryContact.relationship'] = 'Relationship is required';
    }

    // Primary contact email validation (optional but if provided must be valid)
    if (formData.primaryContact?.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.primaryContact.email)) {
      newErrors['primaryContact.email'] = 'Please enter a valid email address';
    }

    // Secondary contact validation (optional but if name is provided, phone is required)
    if (formData.secondaryContact?.name?.trim()) {
      if (!formData.secondaryContact?.phoneNumber?.trim()) {
        newErrors['secondaryContact.phoneNumber'] = 'Phone number is required when name is provided';
      } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(formData.secondaryContact.phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
        newErrors['secondaryContact.phoneNumber'] = 'Please enter a valid phone number';
      }

      if (!formData.secondaryContact?.relationship?.trim()) {
        newErrors['secondaryContact.relationship'] = 'Relationship is required when name is provided';
      }

      // Secondary contact email validation (optional but if provided must be valid)
      if (formData.secondaryContact?.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.secondaryContact.email)) {
        newErrors['secondaryContact.email'] = 'Please enter a valid email address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (contactType: 'primaryContact' | 'secondaryContact', field: keyof EmergencyContact, value: string) => {
    setFormData(prev => ({
      ...prev,
      [contactType]: {
        ...prev[contactType],
        [field]: value,
      },
    }));

    // Clear error when user starts typing
    const errorKey = `${contactType}.${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: '',
      }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before saving');
      return;
    }

    try {
      setLoading(true);

      // Prepare data for API
      const dataToSave: EmergencyContactsData = {};

      // Always include primary contact if it has data
      if (formData.primaryContact?.name?.trim()) {
        dataToSave.primaryContact = {
          name: formData.primaryContact.name.trim(),
          relationship: formData.primaryContact.relationship.trim(),
          phoneNumber: formData.primaryContact.phoneNumber.trim(),
          email: formData.primaryContact.email?.trim() || undefined,
        };
      }

      // Include secondary contact only if it has data
      if (formData.secondaryContact?.name?.trim()) {
        dataToSave.secondaryContact = {
          name: formData.secondaryContact.name.trim(),
          relationship: formData.secondaryContact.relationship.trim(),
          phoneNumber: formData.secondaryContact.phoneNumber.trim(),
          email: formData.secondaryContact.email?.trim() || undefined,
        };
      }

      await profileService.updateEmergencyContacts(dataToSave);
      toast.success('Emergency contacts updated successfully!');
      
      if (onSave) {
        onSave(dataToSave);
      }
    } catch (error: any) {
      console.error('Failed to update emergency contacts:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to update emergency contacts';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to initial data
    if (initialData) {
      setFormData({
        primaryContact: {
          name: initialData.primaryContact?.name || '',
          relationship: initialData.primaryContact?.relationship || '',
          phoneNumber: initialData.primaryContact?.phoneNumber || '',
          email: initialData.primaryContact?.email || '',
        },
        secondaryContact: {
          name: initialData.secondaryContact?.name || '',
          relationship: initialData.secondaryContact?.relationship || '',
          phoneNumber: initialData.secondaryContact?.phoneNumber || '',
          email: initialData.secondaryContact?.email || '',
        },
      });
    }
    setErrors({});
    
    if (onCancel) {
      onCancel();
    }
  };

  const relationshipOptions = [
    'Spouse',
    'Parent',
    'Child',
    'Sibling',
    'Friend',
    'Colleague',
    'Other',
  ];

  const ContactSection: React.FC<{
    contactType: 'primaryContact' | 'secondaryContact';
    title: string;
    required: boolean;
    contact: EmergencyContact;
  }> = ({ contactType, title, required, contact }) => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <h4 className="text-lg font-semibold text-charcoal">
          {title}
        </h4>
        {required && (
          <span className="text-red-500 text-sm">*</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name {required && '*'}
          </label>
          <input
            type="text"
            value={contact.name}
            onChange={(e) => handleInputChange(contactType, 'name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold transition-colors ${
              !isEditing ? 'bg-gray-50' : 'bg-white'
            } ${
              errors[`${contactType}.name`] 
                ? 'border-red-300 focus:border-red-300 focus:ring-red-200' 
                : 'border-gray-300 focus:border-warm-gold'
            }`}
            placeholder="Contact's full name"
            disabled={!isEditing || loading}
            required={required}
          />
          {errors[`${contactType}.name`] && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <span className="mr-1">⚠️</span>
              {errors[`${contactType}.name`]}
            </p>
          )}
        </div>

        {/* Relationship */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Relationship {(required || contact.name) && '*'}
          </label>
          <select
            value={contact.relationship}
            onChange={(e) => handleInputChange(contactType, 'relationship', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold transition-colors ${
              !isEditing ? 'bg-gray-50' : 'bg-white'
            } ${
              errors[`${contactType}.relationship`] 
                ? 'border-red-300 focus:border-red-300 focus:ring-red-200' 
                : 'border-gray-300 focus:border-warm-gold'
            }`}
            disabled={!isEditing || loading}
            required={required || !!contact.name}
          >
            <option value="">Select relationship</option>
            {relationshipOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors[`${contactType}.relationship`] && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <span className="mr-1">⚠️</span>
              {errors[`${contactType}.relationship`]}
            </p>
          )}
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number {(required || contact.name) && '*'}
          </label>
          <input
            type="tel"
            value={contact.phoneNumber}
            onChange={(e) => handleInputChange(contactType, 'phoneNumber', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold transition-colors ${
              !isEditing ? 'bg-gray-50' : 'bg-white'
            } ${
              errors[`${contactType}.phoneNumber`] 
                ? 'border-red-300 focus:border-red-300 focus:ring-red-200' 
                : 'border-gray-300 focus:border-warm-gold'
            }`}
            placeholder="+1 (555) 123-4567"
            disabled={!isEditing || loading}
            required={required || !!contact.name}
          />
          {errors[`${contactType}.phoneNumber`] && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <span className="mr-1">⚠️</span>
              {errors[`${contactType}.phoneNumber`]}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email (Optional)
          </label>
          <input
            type="email"
            value={contact.email || ''}
            onChange={(e) => handleInputChange(contactType, 'email', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold transition-colors ${
              !isEditing ? 'bg-gray-50' : 'bg-white'
            } ${
              errors[`${contactType}.email`] 
                ? 'border-red-300 focus:border-red-300 focus:ring-red-200' 
                : 'border-gray-300 focus:border-warm-gold'
            }`}
            placeholder="contact@example.com"
            disabled={!isEditing || loading}
          />
          {errors[`${contactType}.email`] && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <span className="mr-1">⚠️</span>
              {errors[`${contactType}.email`]}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-600">🚨</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-charcoal">
              Emergency Contacts
            </h3>
            <p className="text-sm text-gray-600">
              Provide contact information for emergencies
            </p>
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <span className="text-red-600 flex-shrink-0">ℹ️</span>
          <div className="text-sm text-red-800">
            <p className="font-medium mb-1">Important:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>At least one primary emergency contact is required</li>
              <li>These contacts will be notified in case of workplace emergencies</li>
              <li>Please ensure contact information is current and accurate</li>
              <li>Secondary contact is optional but recommended</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Primary Contact */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <ContactSection
          contactType="primaryContact"
          title="Primary Emergency Contact"
          required={true}
          contact={formData.primaryContact!}
        />
      </div>

      {/* Secondary Contact */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <ContactSection
          contactType="secondaryContact"
          title="Secondary Emergency Contact"
          required={false}
          contact={formData.secondaryContact!}
        />
      </div>

      {/* Action Buttons */}
      {isEditing && (
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-warm-gold text-white py-3 px-6 rounded-lg font-medium hover:bg-warm-gold/90 transition-colors focus:ring-2 focus:ring-warm-gold focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : (
              <>
                <span className="mr-2">💾</span>
                Save Emergency Contacts
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 sm:flex-none bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default EmergencyContactsForm;