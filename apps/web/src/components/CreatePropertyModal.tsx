import React, { useEffect, useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { propertyService, CreatePropertyData } from '../services/propertyService';
import { useTenant } from '../contexts/TenantContext';

interface CreatePropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  organizations: Array<{id: string; name: string}>;
}

const CreatePropertyModal: React.FC<CreatePropertyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  organizations,
}) => {
  const { organizationId: activeOrganizationId } = useTenant();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreatePropertyData>({
    name: '',
    slug: '',
    description: '',
    organizationId: '',
    propertyType: 'HOTEL',
    timezone: 'America/Costa_Rica',
    website: '',
    contactEmail: '',
    contactPhone: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
    settings: {
      modules: ['HR'],
      defaultDepartments: ['Front Desk', 'Housekeeping'],
      additional: {},
    },
    branding: {
      inherit: true,
      primaryColor: '#AA8E67',
      secondaryColor: '#F5EBD7',
      accentColor: '#4A4A4A',
    },
    isActive: true,
  });

  // Prefill organization from active tenant when modal opens
  useEffect(() => {
    if (isOpen && activeOrganizationId && !formData.organizationId) {
      setFormData(prev => ({ ...prev, organizationId: activeOrganizationId }));
    }
  }, [isOpen, activeOrganizationId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties (settings.checkInTime, branding.primaryColor, etc.)
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof CreatePropertyData] as any),
          [child]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                  type === 'number' ? parseInt(value) || 0 : value,
        },
      }));
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
      if (!formData.name.trim()) {
        throw new Error('Property name is required');
      }
      if (!formData.organizationId) {
        throw new Error('Organization is required');
      }

      // Validate slug
      if (formData.slug && !propertyService.validateSlug(formData.slug)) {
        throw new Error('Slug must be 2-100 characters long and contain only lowercase letters, numbers, and hyphens');
      }

      // Normalize payload for backend enum/JSON expectations
      const payload: CreatePropertyData = {
        ...formData,
        propertyType: formData.propertyType ? (formData.propertyType as any).toString().toUpperCase() as any : undefined,
        address: formData.address ? (formData.address as any) : undefined,
        settings: formData.settings ? (formData.settings as any) : undefined,
        branding: formData.branding ? (formData.branding as any) : undefined,
      };

      await propertyService.createProperty(payload);
      onSuccess();
    } catch (error: any) {
      console.error('Failed to create property:', error);
      setError(error.response?.data?.message || error.message || 'Failed to create property');
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
          <h2 className="text-xl font-semibold text-gray-900">Create New Property</h2>
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

          <form id="create-property-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="organizationId" className="block text-sm font-medium text-gray-700 mb-1">
                    Organization *
                  </label>
                  <select
                    id="organizationId"
                    name="organizationId"
                    value={formData.organizationId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-transparent"
                  >
                    <option value="">Select Organization</option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                    Property Type
                  </label>
                  <select
                    id="propertyType"
                    name="propertyType"
                    value={formData.propertyType}
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
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Paradise Resort"
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
                    value={formData.slug}
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
                  value={formData.description}
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
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address.line1"
                  value={formData.address?.line1 || ''}
                  onChange={handleInputChange}
                  placeholder="Street address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="address.city"
                    value={formData.address?.city || ''}
                    onChange={handleInputChange}
                    placeholder="City"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                    State/Province
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="address.state"
                    value={formData.address?.state || ''}
                    onChange={handleInputChange}
                    placeholder="State or Province"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="address.country"
                    value={formData.address?.country || ''}
                    onChange={handleInputChange}
                    placeholder="Country"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  id="postalCode"
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
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="contactPhone"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="contactEmail"
                    name="contactEmail"
                    value={formData.contactEmail}
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
                  value={formData.website}
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
                    value={formData.timezone}
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
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    id="currency"
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
                  <label htmlFor="settings.checkInTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Check-in Time
                  </label>
                  <input
                    type="time"
                    id="settings.checkInTime"
                    name="settings.checkInTime"
                    value={formData.settings?.additional?.checkInTime || '15:00'}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="settings.checkOutTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Check-out Time
                  </label>
                  <input
                    type="time"
                    id="settings.checkOutTime"
                    name="settings.checkOutTime"
                    value={formData.settings?.additional?.checkOutTime || '11:00'}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="settings.maxOccupancy" className="block text-sm font-medium text-gray-700 mb-1">
                    Max Room Occupancy
                  </label>
                  <input
                    type="number"
                    id="settings.maxOccupancy"
                    name="settings.maxOccupancy"
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
                  checked={formData.isActive?.toString() === 'true'}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-warm-gold focus:ring-warm-gold border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Property is active
                </label>
              </div>
            </div>
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
            form="create-property-form"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-warm-gold border border-transparent rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-warm-gold focus:ring-offset-2 disabled:opacity-50 flex items-center"
          >
            {loading && <LoadingSpinner size="sm" className="mr-2" />}
            Create Property
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePropertyModal;