import React, { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { propertyService, Property, UpdatePropertyData } from '../services/propertyService';

interface EditPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  onSuccess: () => void;
}

const EditPropertyModal: React.FC<EditPropertyModalProps> = ({
  isOpen,
  onClose,
  property,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdatePropertyData>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data when property changes
  useEffect(() => {
    if (property) {
      // Convert address to nested structure for aligned interface
      const addressObj = property.address && typeof property.address === 'object'
        ? property.address
        : {
            line1: typeof property.address === 'string' ? property.address : '',
            line2: '',
            city: '',
            state: '',
            postalCode: '',
            country: ''
          };
        
      setFormData({
        name: property.name,
        slug: property.slug,
        description: property.description || '',
        address: addressObj,
        contactPhone: property.contactPhone || property.phone || '',
        contactEmail: property.contactEmail || property.email || '',
        website: property.website || '',
        propertyType: property.propertyType || property.type as any || undefined,
        timezone: property.timezone || '',
        settings: {
          modules: property.settings?.modules || [],
          defaultDepartments: property.settings?.defaultDepartments || [],
          additional: {
            checkInTime: property.settings?.additional?.checkInTime || property.settings?.checkInTime || '15:00',
            checkOutTime: property.settings?.additional?.checkOutTime || property.settings?.checkOutTime || '11:00',
            maxOccupancy: property.settings?.additional?.maxOccupancy || property.settings?.maxOccupancy || 2,
            currency: property.settings?.additional?.currency || property.currency || '',
            amenities: property.settings?.additional?.amenities || property.settings?.amenities || [],
            policies: property.settings?.additional?.policies || property.settings?.policies || {},
            ...(property.settings?.additional || {})
          },
        },
        branding: {
          inherit: property.branding?.inherit !== false,
          primaryColor: property.branding?.primaryColor || '#AA8E67',
          secondaryColor: property.branding?.secondaryColor || '#F5EBD7',
          accentColor: property.branding?.accentColor || '#4A4A4A',
          logoUrl: property.branding?.logoUrl || '',
          faviconUrl: property.branding?.faviconUrl || '',
        },
        isActive: property.isActive,
      });
      setHasChanges(false);
    }
  }, [property]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setHasChanges(true);

    if (name.includes('.')) {
      // Handle nested properties (address.city, settings.additional.checkInTime, branding.primaryColor, etc.)
      const nameParts = name.split('.');
      
      setFormData(prev => {
        const newData = { ...prev };
        let current = newData as any;
        
        // Navigate to the parent object, creating nested objects as needed
        for (let i = 0; i < nameParts.length - 1; i++) {
          const part = nameParts[i];
          if (!current[part] || typeof current[part] !== 'object') {
            current[part] = {};
          }
          current = current[part];
        }
        
        // Set the final value
        const finalKey = nameParts[nameParts.length - 1];
        current[finalKey] = type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                           type === 'number' ? parseInt(value) || 0 : value;
        
        return newData;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      }));
    }

    // Auto-generate slug from name
    if (name === 'name' && value) {
      const generatedSlug = propertyService.generateSlug(value);
      setFormData(prev => ({
        ...prev,
        slug: generatedSlug,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name?.trim()) {
        throw new Error('Property name is required');
      }

      // Validate slug
      if (formData.slug && !propertyService.validateSlug(formData.slug)) {
        throw new Error('Slug must be 2-100 characters long and contain only lowercase letters, numbers, and hyphens');
      }

      // Only send changed fields
      const changedData: UpdatePropertyData = {};
      Object.keys(formData).forEach(key => {
        const originalValue = property[key as keyof Property];
        const newValue = formData[key as keyof UpdatePropertyData];
        
        if (JSON.stringify(originalValue) !== JSON.stringify(newValue)) {
          (changedData as any)[key] = newValue;
        }
      });

      if (Object.keys(changedData).length === 0) {
        onClose();
        return;
      }

      await propertyService.updateProperty(property.id, changedData);
      onSuccess();
    } catch (error: any) {
      console.error('Failed to update property:', error);
      setError(error.response?.data?.message || error.message || 'Failed to update property');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const propertyTypes = propertyService.getPropertyTypes();
  const timezones = propertyService.getTimezones();
  const currencies = propertyService.getCurrencies();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Property: {property.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1">
                    Organization
                  </label>
                  <input
                    type="text"
                    id="organization"
                    value={property.organization?.name || 'Unknown'}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Organization cannot be changed after creation.
                  </p>
                </div>

                <div>
                  <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 mb-1">
                    Property Type
                  </label>
                  <select
                    id="propertyType"
                    name="propertyType"
                    value={formData.propertyType || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-transparent"
                  >
                    <option value="">Select Type</option>
                    {propertyTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Property Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Nayara Gardens"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    id="slug"
                    name="slug"
                    value={formData.slug || ''}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., nayara-gardens"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Automatically generated from name. Must be unique and URL-friendly.
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Brief description of the property..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-transparent"
                />
              </div>
            </div>

            {/* Location Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Location</h3>
              
              <div>
                <label htmlFor="address.line1" className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 1
                </label>
                <input
                  type="text"
                  id="address.line1"
                  name="address.line1"
                  value={formData.address?.line1 || ''}
                  onChange={handleInputChange}
                  placeholder="Street address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="address.line2" className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 2
                </label>
                <input
                  type="text"
                  id="address.line2"
                  name="address.line2"
                  value={formData.address?.line2 || ''}
                  onChange={handleInputChange}
                  placeholder="Apartment, suite, etc. (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="address.city" className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    id="address.city"
                    name="address.city"
                    value={formData.address?.city || ''}
                    onChange={handleInputChange}
                    placeholder="City"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="address.state" className="block text-sm font-medium text-gray-700 mb-1">
                    State/Province
                  </label>
                  <input
                    type="text"
                    id="address.state"
                    name="address.state"
                    value={formData.address?.state || ''}
                    onChange={handleInputChange}
                    placeholder="State or Province"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="address.country" className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    id="address.country"
                    name="address.country"
                    value={formData.address?.country || ''}
                    onChange={handleInputChange}
                    placeholder="Country"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="address.postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  id="address.postalCode"
                  name="address.postalCode"
                  value={formData.address?.postalCode || ''}
                  onChange={handleInputChange}
                  placeholder="Postal/ZIP code"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-transparent md:w-1/3"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="contactPhone"
                    name="contactPhone"
                    value={formData.contactPhone || ''}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="contactEmail"
                    name="contactEmail"
                    value={formData.contactEmail || ''}
                    onChange={handleInputChange}
                    placeholder="contact@property.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website || ''}
                  onChange={handleInputChange}
                  placeholder="https://www.property.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-transparent"
                />
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Property Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
                    Timezone
                  </label>
                  <select
                    id="timezone"
                    name="timezone"
                    value={formData.timezone || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-transparent"
                  >
                    <option value="">Select Timezone</option>
                    {timezones.map(tz => (
                      <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="settings.additional.currency" className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    id="settings.additional.currency"
                    name="settings.additional.currency"
                    value={formData.settings?.additional?.currency || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-transparent"
                  >
                    <option value="">Select Currency</option>
                    {currencies.map(curr => (
                      <option key={curr.value} value={curr.value}>{curr.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="settings.additional.checkInTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Check-in Time
                  </label>
                  <input
                    type="time"
                    id="settings.additional.checkInTime"
                    name="settings.additional.checkInTime"
                    value={formData.settings?.additional?.checkInTime || '15:00'}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="settings.additional.checkOutTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Check-out Time
                  </label>
                  <input
                    type="time"
                    id="settings.additional.checkOutTime"
                    name="settings.additional.checkOutTime"
                    value={formData.settings?.additional?.checkOutTime || '11:00'}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="settings.additional.maxOccupancy" className="block text-sm font-medium text-gray-700 mb-1">
                    Max Room Occupancy
                  </label>
                  <input
                    type="number"
                    id="settings.additional.maxOccupancy"
                    name="settings.additional.maxOccupancy"
                    value={formData.settings?.additional?.maxOccupancy || 2}
                    onChange={handleInputChange}
                    min="1"
                    max="20"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Branding */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Branding Colors</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="branding.primaryColor" className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Color
                  </label>
                  <input
                    type="color"
                    id="branding.primaryColor"
                    name="branding.primaryColor"
                    value={formData.branding?.primaryColor || '#AA8E67'}
                    onChange={handleInputChange}
                    className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="branding.secondaryColor" className="block text-sm font-medium text-gray-700 mb-1">
                    Secondary Color
                  </label>
                  <input
                    type="color"
                    id="branding.secondaryColor"
                    name="branding.secondaryColor"
                    value={formData.branding?.secondaryColor || '#F5EBD7'}
                    onChange={handleInputChange}
                    className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="branding.accentColor" className="block text-sm font-medium text-gray-700 mb-1">
                    Accent Color
                  </label>
                  <input
                    type="color"
                    id="branding.accentColor"
                    name="branding.accentColor"
                    value={formData.branding?.accentColor || '#4A4A4A'}
                    onChange={handleInputChange}
                    className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Status</h3>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive === true}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-warm-gold focus:ring-warm-gold border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Property is active
                </label>
              </div>
            </div>

            {/* Change Indicator */}
            {hasChanges && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
                You have unsaved changes. Click "Update Property" to save them.
              </div>
            )}
          </form>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-warm-gold focus:ring-offset-2 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-property-form"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-warm-gold border border-transparent rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-warm-gold focus:ring-offset-2 disabled:opacity-50 flex items-center"
          >
            {loading && <LoadingSpinner size="sm" className="mr-2" />}
            Update Property
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPropertyModal;