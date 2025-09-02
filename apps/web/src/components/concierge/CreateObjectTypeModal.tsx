import React, { useState } from 'react';
import LoadingSpinner from '../LoadingSpinner';
import conciergeService from '../../services/conciergeService';
import { CreateObjectTypeInput, ObjectFieldDefinition, AttributeFieldType } from '../../types/concierge';
import toastService from '../../services/toastService';

interface CreateObjectTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateObjectTypeModal: React.FC<CreateObjectTypeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateObjectTypeInput>({
    name: '',
    fieldsSchema: { fields: [] },
    validations: {},
    uiHints: {},
  });

  const [currentField, setCurrentField] = useState<ObjectFieldDefinition>({
    key: '',
    type: 'string',
    label: '',
    required: false,
    defaultValue: '',
    options: [],
    validation: {},
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleFieldChange = (field: keyof ObjectFieldDefinition, value: any) => {
    setCurrentField({
      ...currentField,
      [field]: value,
    });
  };

  const addField = () => {
    if (!currentField.key || !currentField.label) {
      toastService.error('Field key and label are required');
      return;
    }

    // Check for duplicate keys
    if (formData.fieldsSchema.fields.some(f => f.key === currentField.key)) {
      toastService.error('Field key must be unique');
      return;
    }

    setFormData({
      ...formData,
      fieldsSchema: {
        ...formData.fieldsSchema,
        fields: [...formData.fieldsSchema.fields, { ...currentField }],
      },
    });

    // Reset current field
    setCurrentField({
      key: '',
      type: 'string',
      label: '',
      required: false,
      defaultValue: '',
      options: [],
      validation: {},
    });
  };

  const removeField = (index: number) => {
    setFormData({
      ...formData,
      fieldsSchema: {
        ...formData.fieldsSchema,
        fields: formData.fieldsSchema.fields.filter((_, i) => i !== index),
      },
    });
  };

  const handleOptionsChange = (options: string) => {
    const optionArray = options.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0);
    setCurrentField({
      ...currentField,
      options: optionArray,
    });
  };

  const handleValidationChange = (validationType: string, value: any) => {
    setCurrentField({
      ...currentField,
      validation: {
        ...currentField.validation,
        [validationType]: value,
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      toastService.actions.created('Object Type', formData.name);
      onSuccess();
    } catch (error: any) {
      console.error('Failed to create object type:', error);
      setError(error.response?.data?.message || error.message || 'Failed to create object type');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      setFormData({
        name: '',
        fieldsSchema: { fields: [] },
        validations: {},
        uiHints: {},
      });
      setCurrentField({
        key: '',
        type: 'string',
        label: '',
        required: false,
        defaultValue: '',
        options: [],
        validation: {},
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-charcoal">
              Create Object Type
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
              
              <div>
                <label className="form-label">Object Type Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="e.g., Restaurant Reservation"
                  required
                />
              </div>
            </div>

            {/* Fields Schema */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-charcoal border-b pb-2">Fields Schema</h4>
              
              {/* Existing Fields */}
              {formData.fieldsSchema.fields.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-700">Configured Fields:</h5>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded">
                    {formData.fieldsSchema.fields.map((field, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0">
                        <div>
                          <span className="font-medium">{field.label}</span>
                          <span className="text-sm text-gray-500 ml-2">({field.key})</span>
                          <div className="text-xs text-gray-600">
                            Type: {field.type} | Required: {field.required ? 'Yes' : 'No'}
                            {field.options && field.options.length > 0 && (
                              <span> | Options: {field.options.join(', ')}</span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeField(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Field */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-700 mb-3">Add New Field:</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Field Key *</label>
                    <input
                      type="text"
                      value={currentField.key}
                      onChange={(e) => handleFieldChange('key', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                      className="form-input"
                      placeholder="field_key"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Field Label *</label>
                    <input
                      type="text"
                      value={currentField.label}
                      onChange={(e) => handleFieldChange('label', e.target.value)}
                      className="form-input"
                      placeholder="Field Label"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Field Type</label>
                    <select
                      value={currentField.type}
                      onChange={(e) => handleFieldChange('type', e.target.value as AttributeFieldType)}
                      className="form-input"
                    >
                      <option value="string">Text</option>
                      <option value="number">Number</option>
                      <option value="boolean">Yes/No</option>
                      <option value="date">Date/Time</option>
                      <option value="json">JSON Data</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="form-label">Default Value</label>
                    <input
                      type="text"
                      value={currentField.defaultValue || ''}
                      onChange={(e) => handleFieldChange('defaultValue', e.target.value)}
                      className="form-input"
                      placeholder="Optional default value"
                    />
                  </div>
                  
                  {currentField.type === 'string' && (
                    <div className="md:col-span-2">
                      <label className="form-label">Options (comma-separated)</label>
                      <input
                        type="text"
                        value={currentField.options?.join(', ') || ''}
                        onChange={(e) => handleOptionsChange(e.target.value)}
                        className="form-input"
                        placeholder="Option 1, Option 2, Option 3"
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave empty for free text input</p>
                    </div>
                  )}
                  
                  {(currentField.type === 'string' || currentField.type === 'number') && (
                    <div className="md:col-span-2">
                      <label className="form-label">Validation Rules</label>
                      <div className="grid grid-cols-2 gap-2">
                        {currentField.type === 'string' && (
                          <>
                            <input
                              type="number"
                              placeholder="Min length"
                              value={currentField.validation?.min || ''}
                              onChange={(e) => handleValidationChange('min', parseInt(e.target.value) || undefined)}
                              className="form-input"
                            />
                            <input
                              type="number"
                              placeholder="Max length"
                              value={currentField.validation?.max || ''}
                              onChange={(e) => handleValidationChange('max', parseInt(e.target.value) || undefined)}
                              className="form-input"
                            />
                          </>
                        )}
                        {currentField.type === 'number' && (
                          <>
                            <input
                              type="number"
                              placeholder="Min value"
                              value={currentField.validation?.min || ''}
                              onChange={(e) => handleValidationChange('min', parseFloat(e.target.value) || undefined)}
                              className="form-input"
                            />
                            <input
                              type="number"
                              placeholder="Max value"
                              value={currentField.validation?.max || ''}
                              onChange={(e) => handleValidationChange('max', parseFloat(e.target.value) || undefined)}
                              className="form-input"
                            />
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="md:col-span-2 flex items-center">
                    <input
                      type="checkbox"
                      checked={currentField.required}
                      onChange={(e) => handleFieldChange('required', e.target.checked)}
                      className="mr-2"
                    />
                    <label className="text-sm">Required field</label>
                  </div>
                </div>
                
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={addField}
                    className="btn btn-secondary"
                    disabled={!currentField.key || !currentField.label}
                  >
                    Add Field
                  </button>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex space-x-4 pt-4 border-t">
              <button
                type="submit"
                className="btn btn-primary flex-1"
                disabled={loading || formData.fieldsSchema.fields.length === 0}
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  'Create Object Type'
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

export default CreateObjectTypeModal;