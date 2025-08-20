import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { organizationService, CreateOrganizationData } from '../services/organizationService';

interface CreateOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateOrganizationModal: React.FC<CreateOrganizationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateOrganizationData>({
    name: '',
    slug: '',
    description: '',
    timezone: '',
    website: '',
    contactEmail: '',
    contactPhone: '',
    settings: {
      defaultLanguage: 'en',
      supportedLanguages: ['en'],
      theme: 'default',
    },
    branding: {
      primaryColor: '#AA8E67',
      secondaryColor: '#F5EBD7',
      accentColor: '#4A4A4A',
    },
    isActive: true,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties (settings.defaultLanguage, branding.primaryColor, etc.)
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof CreateOrganizationData] as any),
          [child]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      }));
    }

    // Auto-generate slug from name if slug is empty
    if (name === 'name' && !formData.slug) {
      const generatedSlug = organizationService.generateSlug(value);
      setFormData(prev => ({
        ...prev,
        slug: generatedSlug,
      }));
    }
  };

  const handleLanguageChange = (languages: string[]) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        supportedLanguages: languages,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Organization name is required');
      }

      if (formData.slug && !organizationService.validateSlug(formData.slug)) {
        throw new Error('Invalid slug format. Use only lowercase letters, numbers, and hyphens.');
      }

      // Clean up form data
      const submitData: CreateOrganizationData = {
        name: formData.name.trim(),
        isActive: formData.isActive ?? true,
      };

      // Only include optional fields if they have values
      if (formData.slug?.trim()) submitData.slug = formData.slug.trim();
      if (formData.description?.trim()) submitData.description = formData.description.trim();
      if (formData.timezone?.trim()) submitData.timezone = formData.timezone.trim();
      if (formData.website?.trim()) submitData.website = formData.website.trim();
      if (formData.contactEmail?.trim()) submitData.contactEmail = formData.contactEmail.trim();
      if (formData.contactPhone?.trim()) submitData.contactPhone = formData.contactPhone.trim();

      // Include settings if any are set
      if (formData.settings) {
        submitData.settings = formData.settings;
      }

      // Include branding if any colors are set
      if (formData.branding) {
        submitData.branding = formData.branding;
      }

      await organizationService.createOrganization(submitData);
      onSuccess();
    } catch (error: any) {
      console.error('Failed to create organization:', error);
      setError(error.response?.data?.message || error.message || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        slug: '',
        description: '',
        timezone: '',
        website: '',
        contactEmail: '',
        contactPhone: '',
        settings: {
          defaultLanguage: 'en',
          supportedLanguages: ['en'],
          theme: 'default',
        },
        branding: {
          primaryColor: '#AA8E67',
          secondaryColor: '#F5EBD7',
          accentColor: '#4A4A4A',
        },
        isActive: true,
      });
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-charcoal">
              Create New Organization
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-charcoal border-b pb-2">Basic Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Organization Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="e.g., Nayara Hotel Group"
                    required
                  />
                </div>
                
                <div>
                  <label className="form-label">URL Slug</label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="e.g., nayara-hotel-group"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-generated from name. Use lowercase letters, numbers, and hyphens only.
                  </p>
                </div>
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="form-input"
                  rows={3}
                  placeholder="Brief description of the organization"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Timezone</label>
                  <select
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleInputChange}
                    className="form-input"
                  >
                    <option value="">Select timezone</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="America/Costa_Rica">Costa Rica Time</option>
                    <option value="Europe/London">London Time (GMT)</option>
                    <option value="Europe/Paris">Central European Time</option>
                    <option value="Asia/Tokyo">Japan Time</option>
                    <option value="Australia/Sydney">Sydney Time</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Status</label>
                  <select
                    name="isActive"
                    value={formData.isActive?.toString() ?? 'true'}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
                    className="form-input"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-charcoal border-b pb-2">Contact Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Contact Email</label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="contact@organization.com"
                  />
                </div>

                <div>
                  <label className="form-label">Contact Phone</label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="https://www.organization.com"
                />
              </div>
            </div>

            {/* Branding */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-charcoal border-b pb-2">Brand Colors</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Primary Color</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      name="branding.primaryColor"
                      value={formData.branding?.primaryColor || '#AA8E67'}
                      onChange={handleInputChange}
                      className="w-12 h-10 rounded border border-gray-300"
                    />
                    <input
                      type="text"
                      name="branding.primaryColor"
                      value={formData.branding?.primaryColor || '#AA8E67'}
                      onChange={handleInputChange}
                      className="form-input flex-1"
                      placeholder="#AA8E67"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Secondary Color</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      name="branding.secondaryColor"
                      value={formData.branding?.secondaryColor || '#F5EBD7'}
                      onChange={handleInputChange}
                      className="w-12 h-10 rounded border border-gray-300"
                    />
                    <input
                      type="text"
                      name="branding.secondaryColor"
                      value={formData.branding?.secondaryColor || '#F5EBD7'}
                      onChange={handleInputChange}
                      className="form-input flex-1"
                      placeholder="#F5EBD7"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Accent Color</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      name="branding.accentColor"
                      value={formData.branding?.accentColor || '#4A4A4A'}
                      onChange={handleInputChange}
                      className="w-12 h-10 rounded border border-gray-300"
                    />
                    <input
                      type="text"
                      name="branding.accentColor"
                      value={formData.branding?.accentColor || '#4A4A4A'}
                      onChange={handleInputChange}
                      className="form-input flex-1"
                      placeholder="#4A4A4A"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-charcoal border-b pb-2">Settings</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Default Language</label>
                  <select
                    name="settings.defaultLanguage"
                    value={formData.settings?.defaultLanguage || 'en'}
                    onChange={handleInputChange}
                    className="form-input"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Theme</label>
                  <select
                    name="settings.theme"
                    value={formData.settings?.theme || 'default'}
                    onChange={handleInputChange}
                    className="form-input"
                  >
                    <option value="default">Default</option>
                    <option value="luxury">Luxury</option>
                    <option value="minimal">Minimal</option>
                    <option value="corporate">Corporate</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Supported Languages</label>
                <div className="space-y-2">
                  {['en', 'es'].map(lang => (
                    <label key={lang} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.settings?.supportedLanguages?.includes(lang) || false}
                        onChange={(e) => {
                          const current = formData.settings?.supportedLanguages || [];
                          if (e.target.checked) {
                            handleLanguageChange([...current, lang]);
                          } else {
                            handleLanguageChange(current.filter(l => l !== lang));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">
                        {lang === 'en' ? 'English' : 'Spanish'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex space-x-4 pt-4 border-t">
              <button
                type="submit"
                className="btn btn-primary flex-1"
                disabled={loading}
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  'Create Organization'
                )}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="btn btn-secondary flex-1"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateOrganizationModal;