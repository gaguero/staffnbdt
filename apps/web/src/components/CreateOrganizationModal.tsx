import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import LoadingSpinner from './LoadingSpinner';
import { FormField } from './forms';
import { toastService } from '../utils/toast';
import { organizationValidationSchema, OrganizationFormData } from '../utils/formValidation';
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
  
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isValid, isValidating },
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationValidationSchema),
    mode: 'onChange', // Enable real-time validation
    defaultValues: {
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
    },
  });
  
  // Watch form values for auto-generation
  const watchedName = watch('name');
  const watchedSlug = watch('slug');

  // Auto-generate slug when name changes
  React.useEffect(() => {
    if (watchedName && !watchedSlug) {
      const generatedSlug = organizationService.generateSlug(watchedName);
      setValue('slug', generatedSlug);
    }
  }, [watchedName, watchedSlug, setValue]);


  const onSubmit = async (data: OrganizationFormData) => {
    setLoading(true);

    const loadingToast = toastService.loading('Creating organization...');

    try {
      // Clean up form data - only include fields with values
      const submitData: CreateOrganizationData = {
        name: data.name.trim(),
        isActive: data.isActive,
      };

      // Only include optional fields if they have values
      if (data.slug?.trim()) submitData.slug = data.slug.trim();
      if (data.description?.trim()) submitData.description = data.description.trim();
      if (data.timezone?.trim()) submitData.timezone = data.timezone.trim();
      if (data.website?.trim()) submitData.website = data.website.trim();
      if (data.contactEmail?.trim()) submitData.contactEmail = data.contactEmail.trim();
      if (data.contactPhone?.trim()) submitData.contactPhone = data.contactPhone.trim();

      // Include settings and branding
      if (data.settings) submitData.settings = data.settings;
      if (data.branding) submitData.branding = data.branding;

      await organizationService.createOrganization(submitData);
      
      toastService.dismiss(loadingToast);
      toastService.actions.created('Organization', data.name);
      onSuccess();
    } catch (error: any) {
      console.error('Failed to create organization:', error);
      toastService.dismiss(loadingToast);
      toastService.actions.operationFailed(
        'create organization',
        error.response?.data?.message || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      reset();
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


          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-charcoal border-b pb-2">Basic Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Organization Name"
                  placeholder="e.g., Paradise Hotel Group"
                  required
                  register={register('name', { required: 'Organization name is required' })}
                  error={errors.name}
                  success={!!watchedName && !errors.name}
                  validating={isValidating}
                />
                
                <FormField
                  label="URL Slug"
                  placeholder="e.g., paradise-hotel-group"
                  register={register('slug')}
                  error={errors.slug}
                  helperText="Auto-generated from name. Use lowercase letters, numbers, and hyphens only."
                  success={!!watchedSlug && !errors.slug}
                />
              </div>

              <FormField
                label="Description"
                type="textarea"
                placeholder="Brief description of the organization"
                register={register('description')}
                error={errors.description}
                rows={3}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Timezone"
                  type="select"
                  register={register('timezone')}
                  error={errors.timezone}
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
                </FormField>

                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="form-label">Status</label>
                      <select
                        {...field}
                        value={field.value?.toString() ?? 'true'}
                        onChange={(e) => field.onChange(e.target.value === 'true')}
                        className="form-select"
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                      {errors.isActive && (
                        <p className="text-red-500 text-sm mt-1">{errors.isActive.message}</p>
                      )}
                    </div>
                  )}
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-charcoal border-b pb-2">Contact Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Contact Email"
                  type="email"
                  placeholder="contact@organization.com"
                  register={register('contactEmail')}
                  error={errors.contactEmail}
                  success={!!watch('contactEmail') && !errors.contactEmail}
                />

                <FormField
                  label="Contact Phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  register={register('contactPhone')}
                  error={errors.contactPhone}
                  success={!!watch('contactPhone') && !errors.contactPhone}
                />
              </div>

              <FormField
                label="Website"
                type="url"
                placeholder="https://www.organization.com"
                register={register('website')}
                error={errors.website}
                success={!!watch('website') && !errors.website}
              />
            </div>

            {/* Branding */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-charcoal border-b pb-2">Brand Colors</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Primary Color</label>
                  <div className="flex items-center space-x-2">
                    <Controller
                      name="branding.primaryColor"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="color"
                          value={field.value || '#AA8E67'}
                          onChange={field.onChange}
                          className="w-12 h-10 rounded border border-gray-300"
                        />
                      )}
                    />
                    <FormField
                      label=""
                      placeholder="#AA8E67"
                      register={register('branding.primaryColor')}
                      error={errors.branding?.primaryColor}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Secondary Color</label>
                  <div className="flex items-center space-x-2">
                    <Controller
                      name="branding.secondaryColor"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="color"
                          value={field.value || '#F5EBD7'}
                          onChange={field.onChange}
                          className="w-12 h-10 rounded border border-gray-300"
                        />
                      )}
                    />
                    <FormField
                      label=""
                      placeholder="#F5EBD7"
                      register={register('branding.secondaryColor')}
                      error={errors.branding?.secondaryColor}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Accent Color</label>
                  <div className="flex items-center space-x-2">
                    <Controller
                      name="branding.accentColor"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="color"
                          value={field.value || '#4A4A4A'}
                          onChange={field.onChange}
                          className="w-12 h-10 rounded border border-gray-300"
                        />
                      )}
                    />
                    <FormField
                      label=""
                      placeholder="#4A4A4A"
                      register={register('branding.accentColor')}
                      error={errors.branding?.accentColor}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-charcoal border-b pb-2">Settings</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Default Language"
                  type="select"
                  register={register('settings.defaultLanguage')}
                  error={errors.settings?.defaultLanguage}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                </FormField>

                <FormField
                  label="Theme"
                  type="select"
                  register={register('settings.theme')}
                  error={errors.settings?.theme}
                >
                  <option value="default">Default</option>
                  <option value="luxury">Luxury</option>
                  <option value="minimal">Minimal</option>
                  <option value="corporate">Corporate</option>
                </FormField>
              </div>

              <div>
                <label className="form-label">Supported Languages</label>
                <div className="space-y-2">
                  {['en', 'es'].map(lang => (
                    <label key={lang} className="flex items-center">
                      <Controller
                        name="settings.supportedLanguages"
                        control={control}
                        render={({ field }) => (
                          <input
                            type="checkbox"
                            checked={field.value?.includes(lang as 'en' | 'es') || false}
                            onChange={(e) => {
                              const current = field.value || [];
                              if (e.target.checked) {
                                field.onChange([...current, lang]);
                              } else {
                                field.onChange(current.filter(l => l !== lang));
                              }
                            }}
                            className="mr-2"
                          />
                        )}
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
                className={`btn btn-primary flex-1 ${
                  !isValid || loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={!isValid || loading}
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