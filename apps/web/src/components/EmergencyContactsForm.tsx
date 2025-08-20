import React, { useState, useEffect } from 'react';
import { profileService, LegacyEmergencyContactsData } from '../services/profileService';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

interface EmergencyContactsFormProps {
  initialData?: LegacyEmergencyContactsData;
  onSuccess?: (data: LegacyEmergencyContactsData) => void;
  onCancel?: () => void;
  className?: string;
  standalone?: boolean; // Whether this is a standalone form or part of a larger form
  isEditing?: boolean;
  onSave?: (data: any) => void;
}

interface ContactData {
  name: string;
  relationship: string;
  phoneNumber: string;
  email: string;
}

const EmergencyContactsForm: React.FC<EmergencyContactsFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
  className = '',
  standalone = false,
}) => {
  const [primaryContact, setPrimaryContact] = useState<ContactData>({
    name: '',
    relationship: '',
    phoneNumber: '',
    email: '',
  });

  const [secondaryContact, setSecondaryContact] = useState<ContactData>({
    name: '',
    relationship: '',
    phoneNumber: '',
    email: '',
  });

  const [hasSecondaryContact, setHasSecondaryContact] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      if (initialData.primaryContact) {
        setPrimaryContact({
          name: initialData.primaryContact.name || '',
          relationship: initialData.primaryContact.relationship || '',
          phoneNumber: initialData.primaryContact.phoneNumber || '',
          email: initialData.primaryContact.email || '',
        });
      }

      if (initialData.secondaryContact) {
        setSecondaryContact({
          name: initialData.secondaryContact.name || '',
          relationship: initialData.secondaryContact.relationship || '',
          phoneNumber: initialData.secondaryContact.phoneNumber || '',
          email: initialData.secondaryContact.email || '',
        });
        setHasSecondaryContact(true);
      }
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Primary contact validation
    if (!primaryContact.name.trim()) {
      newErrors.primaryName = 'Primary contact name is required';
    }

    if (!primaryContact.relationship.trim()) {
      newErrors.primaryRelationship = 'Primary contact relationship is required';
    }

    if (!primaryContact.phoneNumber.trim()) {
      newErrors.primaryPhoneNumber = 'Primary contact phone number is required';
    } else if (!/^[\+]?[0-9\s\-\(\)]+$/.test(primaryContact.phoneNumber.trim())) {
      newErrors.primaryPhoneNumber = 'Please enter a valid phone number';
    }

    // Email validation for primary contact (optional but must be valid if provided)
    if (primaryContact.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(primaryContact.email.trim())) {
      newErrors.primaryEmail = 'Please enter a valid email address';
    }

    // Secondary contact validation (if enabled)
    if (hasSecondaryContact) {
      if (!secondaryContact.name.trim()) {
        newErrors.secondaryName = 'Secondary contact name is required';
      }

      if (!secondaryContact.relationship.trim()) {
        newErrors.secondaryRelationship = 'Secondary contact relationship is required';
      }

      if (!secondaryContact.phoneNumber.trim()) {
        newErrors.secondaryPhoneNumber = 'Secondary contact phone number is required';
      } else if (!/^[\+]?[0-9\s\-\(\)]+$/.test(secondaryContact.phoneNumber.trim())) {
        newErrors.secondaryPhoneNumber = 'Please enter a valid phone number';
      }

      // Email validation for secondary contact (optional but must be valid if provided)
      if (secondaryContact.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(secondaryContact.email.trim())) {
        newErrors.secondaryEmail = 'Please enter a valid email address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContactChange = (
    type: 'primary' | 'secondary',
    field: keyof ContactData,
    value: string
  ) => {
    const setter = type === 'primary' ? setPrimaryContact : setSecondaryContact;
    
    setter(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    const errorKey = `${type}${field.charAt(0).toUpperCase() + field.slice(1)}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!validateForm()) {
      return false;
    }

    try {
      setLoading(true);

      const emergencyContactsData: LegacyEmergencyContactsData = {
        primaryContact: {
          name: primaryContact.name.trim(),
          relationship: primaryContact.relationship.trim(),
          phoneNumber: primaryContact.phoneNumber.trim(),
          email: primaryContact.email.trim() || undefined,
        },
      };

      if (hasSecondaryContact && secondaryContact.name.trim()) {
        emergencyContactsData.secondaryContact = {
          name: secondaryContact.name.trim(),
          relationship: secondaryContact.relationship.trim(),
          phoneNumber: secondaryContact.phoneNumber.trim(),
          email: secondaryContact.email.trim() || undefined,
        };
      }

      if (standalone) {
        await profileService.updateEmergencyContacts(emergencyContactsData);
        toast.success('Emergency contacts updated successfully');
      }

      if (onSuccess) {
        onSuccess(emergencyContactsData);
      }

      return true;
    } catch (error: any) {
      console.error('Failed to update emergency contacts:', error);
      console.error('Error response:', error?.response);
      console.error('Error data:', error?.response?.data);
      
      let errorMessage = 'Failed to update emergency contacts';
      
      if (error?.response?.data) {
        const errorData = error.response.data;
        if (errorData.validationErrors && Array.isArray(errorData.validationErrors)) {
          errorMessage = `Validation errors: ${errorData.validationErrors.join(', ')}`;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const relationshipOptions = [
    'Spouse',
    'Parent',
    'Child',
    'Sibling',
    'Friend',
    'Colleague',
    'Other Family Member',
    'Guardian',
    'Partner',
    'Other',
  ];

  const ContactSection = ({
    title,
    contact,
    type,
    canRemove = false,
    onRemove,
  }: {
    title: string;
    contact: ContactData;
    type: 'primary' | 'secondary';
    canRemove?: boolean;
    onRemove?: () => void;
  }) => (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-charcoal flex items-center">
          <span className="mr-2">{type === 'primary' ? '👤' : '👥'}</span>
          {title}
        </h4>
        {canRemove && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Remove
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            value={contact.name}
            onChange={(e) => handleContactChange(type, 'name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-warm-gold ${
              errors[`${type}Name`] ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Full name"
            disabled={loading}
          />
          {errors[`${type}Name`] && (
            <p className="mt-1 text-xs text-red-600">{errors[`${type}Name`]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Relationship *
          </label>
          <select
            value={contact.relationship}
            onChange={(e) => handleContactChange(type, 'relationship', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-warm-gold ${
              errors[`${type}Relationship`] ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={loading}
          >
            <option value="">Select relationship</option>
            {relationshipOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors[`${type}Relationship`] && (
            <p className="mt-1 text-xs text-red-600">{errors[`${type}Relationship`]}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            value={contact.phoneNumber}
            onChange={(e) => handleContactChange(type, 'phoneNumber', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-warm-gold ${
              errors[`${type}PhoneNumber`] ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="+1 (555) 123-4567"
            disabled={loading}
          />
          {errors[`${type}PhoneNumber`] && (
            <p className="mt-1 text-xs text-red-600">{errors[`${type}PhoneNumber`]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email (Optional)
          </label>
          <input
            type="email"
            value={contact.email}
            onChange={(e) => handleContactChange(type, 'email', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-warm-gold ${
              errors[`${type}Email`] ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="contact@example.com"
            disabled={loading}
          />
          {errors[`${type}Email`] && (
            <p className="mt-1 text-xs text-red-600">{errors[`${type}Email`]}</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {standalone && (
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-600 text-lg">🚨</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-charcoal">
              Emergency Contacts
            </h3>
            <p className="text-sm text-gray-600">
              People to contact in case of emergency
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Primary Contact */}
        <ContactSection
          title="Primary Emergency Contact"
          contact={primaryContact}
          type="primary"
        />

        {/* Secondary Contact */}
        {hasSecondaryContact ? (
          <ContactSection
            title="Secondary Emergency Contact"
            contact={secondaryContact}
            type="secondary"
            canRemove
            onRemove={() => {
              setHasSecondaryContact(false);
              setSecondaryContact({
                name: '',
                relationship: '',
                phoneNumber: '',
                email: '',
              });
              // Clear secondary contact errors
              const newErrors = { ...errors };
              Object.keys(newErrors).forEach(key => {
                if (key.startsWith('secondary')) {
                  delete newErrors[key];
                }
              });
              setErrors(newErrors);
            }}
          />
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <div className="text-gray-400 text-4xl mb-3">👥</div>
            <h4 className="text-sm font-medium text-gray-600 mb-2">
              Add Secondary Emergency Contact
            </h4>
            <p className="text-xs text-gray-500 mb-4">
              Having a backup contact ensures we can always reach someone in an emergency
            </p>
            <button
              type="button"
              onClick={() => setHasSecondaryContact(true)}
              disabled={loading}
              className="px-4 py-2 text-warm-gold hover:text-orange-600 border border-warm-gold hover:border-orange-600 rounded-md transition-colors disabled:opacity-50"
            >
              + Add Secondary Contact
            </button>
          </div>
        )}

        {/* Important Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex items-start space-x-3">
            <div className="text-yellow-600 text-lg">⚠️</div>
            <div className="text-sm text-yellow-800">
              <h4 className="font-medium mb-1">Important</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Emergency contacts should be available 24/7</li>
                <li>Make sure they know they're listed as your emergency contact</li>
                <li>Keep this information updated when contacts change</li>
                <li>At least one contact should live locally or be easily reachable</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons (only for standalone form) */}
        {standalone && (
          <div className="flex space-x-3 pt-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-warm-gold text-white rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center"
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
          </div>
        )}
      </form>
    </div>
  );
};

export default EmergencyContactsForm;