import React, { useState } from 'react';
import LoadingSpinner from '../LoadingSpinner';
import conciergeService from '../../services/conciergeService';
import { CreateObjectTypeInput, ObjectFieldDefinition, AttributeFieldType } from '../../types/concierge';
import { TemplateData } from './TemplateMarketplaceHub';
import toastService from '../../services/toastService';

interface CreateFromTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: TemplateData;
  onSuccess: () => void;
}

const CreateFromTemplateModal: React.FC<CreateFromTemplateModalProps> = ({
  isOpen,
  onClose,
  template,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'customize' | 'preview' | 'confirm'>('customize');
  
  const [formData, setFormData] = useState<CreateObjectTypeInput>({
    name: template.name,
    fieldsSchema: { fields: [...template.fieldsSchema.fields] },
    validations: {},
    uiHints: {},
    isActive: true,
  });

  const [customizations, setCustomizations] = useState({
    addPrefix: true,
    prefix: 'My ',
    modifyFields: false,
    addDescription: false,
    description: template.description
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleCustomizationChange = (key: string, value: any) => {
    const newCustomizations = { ...customizations, [key]: value };
    setCustomizations(newCustomizations);

    // Auto-update form data based on customizations
    if (key === 'addPrefix' || key === 'prefix') {
      if (newCustomizations.addPrefix && newCustomizations.prefix) {
        const baseName = template.name.replace(/^My /, ''); // Remove existing prefix
        setFormData({
          ...formData,
          name: newCustomizations.prefix + baseName
        });
      } else {
        setFormData({
          ...formData,
          name: template.name
        });
      }
    }
  };

  const handleFieldChange = (index: number, field: keyof ObjectFieldDefinition, value: any) => {
    const updatedFields = [...formData.fieldsSchema.fields];
    updatedFields[index] = { ...updatedFields[index], [field]: value };
    setFormData({
      ...formData,
      fieldsSchema: { ...formData.fieldsSchema, fields: updatedFields }
    });
  };

  const addField = () => {
    const newField: ObjectFieldDefinition = {
      key: `custom_field_${Date.now()}`,
      type: 'string',
      label: 'New Field',
      required: false,
      defaultValue: '',
      options: [],
      validation: {},
    };

    setFormData({
      ...formData,
      fieldsSchema: {
        ...formData.fieldsSchema,
        fields: [...formData.fieldsSchema.fields, newField]
      }
    });
  };

  const removeField = (index: number) => {
    setFormData({
      ...formData,
      fieldsSchema: {
        ...formData.fieldsSchema,
        fields: formData.fieldsSchema.fields.filter((_, i) => i !== index)
      }
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Object type name is required');
      }

      if (formData.fieldsSchema.fields.length === 0) {
        throw new Error('At least one field is required');
      }

      await conciergeService.createObjectType(formData);
      onSuccess();
    } catch (error: any) {
      console.error('Failed to create object type from template:', error);
      setError(error.response?.data?.message || error.message || 'Failed to create object type');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      setStep('customize');
      onClose();
    }
  };

  if (!isOpen) return null;

  const getCategoryIcon = (category: string) => {
    const icons = {
      'Transportation': '🚗',
      'Dining': '🍽️',
      'Wellness': '🧘',
      'Activities': '🎯',
      'Services': '🛎️',
      'Events': '🎉'
    } as Record<string, string>;
    return icons[category] || '📋';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">{getCategoryIcon(template.category)}</div>
              <div>
                <h3 className="text-lg font-semibold text-charcoal">
                  Clone Template: {template.name}
                </h3>
                <p className="text-sm text-gray-600">{template.category} • {template.fieldsSchema.fields.length} fields</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              ✕
            </button>
          </div>

          {/* Steps */}
          <div className="flex items-center mb-6 space-x-4">
            {[
              { key: 'customize', label: 'Customize', icon: '⚙️' },
              { key: 'preview', label: 'Preview', icon: '👁️' },
              { key: 'confirm', label: 'Create', icon: '✅' }
            ].map((stepItem, index) => (
              <div key={stepItem.key} className="flex items-center">
                <div className={`
                  flex items-center space-x-2 px-3 py-2 rounded-full text-sm
                  ${step === stepItem.key 
                    ? 'bg-warm-gold text-white' 
                    : 'bg-gray-100 text-gray-600'
                  }
                `}>
                  <span>{stepItem.icon}</span>
                  <span>{stepItem.label}</span>
                </div>
                {index < 2 && <div className="w-8 h-0.5 bg-gray-300 mx-2" />}
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Step Content */}
          {step === 'customize' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-md font-medium text-charcoal mb-4">Customize Your Template</h4>
                
                {/* Basic Customizations */}
                <div className="space-y-4">
                  <div>
                    <label className="form-label">Template Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Enter custom name"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={customizations.addPrefix}
                      onChange={(e) => handleCustomizationChange('addPrefix', e.target.checked)}
                      className="rounded"
                    />
                    <label className="text-sm text-gray-700">Add custom prefix:</label>
                    {customizations.addPrefix && (
                      <input
                        type="text"
                        value={customizations.prefix}
                        onChange={(e) => handleCustomizationChange('prefix', e.target.value)}
                        className="form-input w-24"
                        placeholder="My "
                      />
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={customizations.modifyFields}
                      onChange={(e) => handleCustomizationChange('modifyFields', e.target.checked)}
                      className="rounded"
                    />
                    <label className="text-sm text-gray-700">Allow field modifications</label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded"
                    />
                    <label className="text-sm text-gray-700">Make active immediately</label>
                  </div>
                </div>
              </div>

              {/* Field Modifications */}
              {customizations.modifyFields && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Modify Fields:</h5>
                  <div className="space-y-3 max-h-64 overflow-y-auto border border-gray-200 rounded p-3">
                    {formData.fieldsSchema.fields.map((field, index) => (
                      <div key={index} className="flex items-center justify-between space-x-3 p-2 bg-gray-50 rounded">
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => handleFieldChange(index, 'label', e.target.value)}
                          className="form-input flex-1 text-sm"
                        />
                        <select
                          value={field.type}
                          onChange={(e) => handleFieldChange(index, 'type', e.target.value as AttributeFieldType)}
                          className="form-input w-24 text-sm"
                        >
                          <option value="string">Text</option>
                          <option value="number">Number</option>
                          <option value="boolean">Yes/No</option>
                          <option value="date">Date</option>
                          <option value="json">JSON</option>
                        </select>
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => handleFieldChange(index, 'required', e.target.checked)}
                          className="rounded"
                          title="Required"
                        />
                        <button
                          onClick={() => removeField(index)}
                          className="text-red-600 hover:text-red-800 text-sm px-2"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addField}
                      className="w-full py-2 text-sm text-warm-gold border border-warm-gold border-dashed rounded hover:bg-warm-gold hover:bg-opacity-5"
                    >
                      + Add Custom Field
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-6">
              <h4 className="text-md font-medium text-charcoal mb-4">Preview Your Object Type</h4>
              
              <div className="card p-4 bg-gray-50">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h5 className="font-semibold text-charcoal text-lg">{formData.name}</h5>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        formData.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {formData.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formData.fieldsSchema.fields.length} field{formData.fieldsSchema.fields.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h6 className="text-sm font-medium text-gray-700 mb-2">Fields:</h6>
                  <div className="space-y-2">
                    {formData.fieldsSchema.fields.map((field, index) => (
                      <div key={index} className="flex items-center justify-between text-sm bg-white rounded px-3 py-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{field.label}</span>
                          {field.required && <span className="text-red-500 text-xs">*</span>}
                        </div>
                        <span className="text-gray-500 capitalize text-xs bg-gray-100 px-2 py-1 rounded">
                          {field.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="text-blue-600 text-lg">💡</div>
                  <div>
                    <h6 className="font-medium text-blue-800 mb-1">Template Information</h6>
                    <p className="text-sm text-blue-700">
                      This object type is based on the "{template.name}" template from the {template.category} category. 
                      You can further customize it after creation if needed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-6">
              <h4 className="text-md font-medium text-charcoal mb-4">Ready to Create</h4>
              
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎉</div>
                <h5 className="text-lg font-semibold text-charcoal mb-2">
                  "{formData.name}" is ready to be created!
                </h5>
                <p className="text-gray-600 mb-6">
                  Your new object type will be available immediately and can be used to create concierge objects.
                </p>
                
                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto text-sm">
                  <div className="text-center">
                    <div className="text-2xl mb-1">📋</div>
                    <div className="font-medium">{formData.fieldsSchema.fields.length}</div>
                    <div className="text-gray-500">Fields</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">✅</div>
                    <div className="font-medium">{formData.fieldsSchema.fields.filter(f => f.required).length}</div>
                    <div className="text-gray-500">Required</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">{formData.isActive ? '🟢' : '🔴'}</div>
                    <div className="font-medium">{formData.isActive ? 'Active' : 'Inactive'}</div>
                    <div className="text-gray-500">Status</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex space-x-4 pt-6 border-t">
            {step === 'customize' && (
              <>
                <button
                  onClick={() => setStep('preview')}
                  className="btn btn-primary flex-1"
                >
                  Preview Template
                </button>
                <button
                  onClick={handleClose}
                  className="btn btn-secondary flex-1"
                  disabled={loading}
                >
                  Cancel
                </button>
              </>
            )}

            {step === 'preview' && (
              <>
                <button
                  onClick={() => setStep('confirm')}
                  className="btn btn-primary flex-1"
                >
                  Looks Good!
                </button>
                <button
                  onClick={() => setStep('customize')}
                  className="btn btn-secondary flex-1"
                >
                  Back to Customize
                </button>
              </>
            )}

            {step === 'confirm' && (
              <>
                <button
                  onClick={handleSubmit}
                  className="btn btn-primary flex-1"
                  disabled={loading}
                >
                  {loading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    'Create Object Type'
                  )}
                </button>
                <button
                  onClick={() => setStep('preview')}
                  className="btn btn-secondary flex-1"
                  disabled={loading}
                >
                  Back to Preview
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateFromTemplateModal;