import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../LoadingSpinner';
import conciergeService from '../../services/conciergeService';
import { CreateObjectTypeInput, ObjectFieldDefinition, AttributeFieldType, ObjectType } from '../../types/concierge';
import toastService from '../../services/toastService';

interface EditObjectTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  objectType: ObjectType;
  onSuccess: () => void;
}

const EditObjectTypeModal: React.FC<EditObjectTypeModalProps> = ({
  isOpen,
  onClose,
  objectType,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CreateObjectTypeInput>>({
    name: objectType.name,
    fieldsSchema: objectType.fieldsSchema,
    validations: objectType.validations || {},
    uiHints: objectType.uiHints || {},
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

  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);

  // Initialize form data when object type changes
  useEffect(() => {
    if (objectType) {
      setFormData({
        name: objectType.name,
        fieldsSchema: objectType.fieldsSchema,
        validations: objectType.validations || {},
        uiHints: objectType.uiHints || {},
      });
    }
  }, [objectType]);

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

    if (!formData.fieldsSchema) {
      setFormData({
        ...formData,
        fieldsSchema: { fields: [] },
      });
    }

    // Check for duplicate keys (excluding the field being edited)
    const existingFields = formData.fieldsSchema?.fields || [];
    if (existingFields.some((f, index) => f.key === currentField.key && index !== editingFieldIndex)) {
      toastService.error('Field key must be unique');
      return;
    }

    const updatedFields = [...existingFields];
    if (editingFieldIndex !== null) {
      // Editing existing field
      updatedFields[editingFieldIndex] = { ...currentField };
      setEditingFieldIndex(null);
    } else {
      // Adding new field
      updatedFields.push({ ...currentField });
    }

    setFormData({
      ...formData,
      fieldsSchema: {
        ...formData.fieldsSchema,
        fields: updatedFields,
      },
    });

    // Reset current field
    resetCurrentField();
  };

  const editField = (index: number) => {
    const field = formData.fieldsSchema?.fields[index];
    if (field) {
      setCurrentField({ ...field });
      setEditingFieldIndex(index);
    }
  };

  const removeField = (index: number) => {
    if (!formData.fieldsSchema) return;
    
    setFormData({
      ...formData,
      fieldsSchema: {
        ...formData.fieldsSchema,
        fields: formData.fieldsSchema.fields.filter((_, i) => i !== index),
      },
    });

    // Reset if we're editing the field being removed
    if (editingFieldIndex === index) {
      resetCurrentField();
      setEditingFieldIndex(null);
    }
  };

  const resetCurrentField = () => {
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

  const cancelEdit = () => {
    resetCurrentField();
    setEditingFieldIndex(null);
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
      if (!formData.name?.trim()) {
        throw new Error('Object type name is required');
      }

      if (!formData.fieldsSchema?.fields || formData.fieldsSchema.fields.length === 0) {
        throw new Error('At least one field is required');
      }

      // Only send changed fields
      const updateData: Partial<CreateObjectTypeInput> = {};
      
      if (formData.name !== objectType.name) {
        updateData.name = formData.name;
      }
      
      if (JSON.stringify(formData.fieldsSchema) !== JSON.stringify(objectType.fieldsSchema)) {
        updateData.fieldsSchema = formData.fieldsSchema;
      }
      
      if (JSON.stringify(formData.validations) !== JSON.stringify(objectType.validations)) {
        updateData.validations = formData.validations;
      }
      
      if (JSON.stringify(formData.uiHints) !== JSON.stringify(objectType.uiHints)) {
        updateData.uiHints = formData.uiHints;
      }

      // Only proceed if there are changes
      if (Object.keys(updateData).length === 0) {
        toastService.info('No changes to save');
        onSuccess();
        return;
      }

      await conciergeService.updateObjectType(objectType.id, updateData);
      toastService.actions.updated('Object Type', formData.name || objectType.name);
      onSuccess();
    } catch (error: any) {
      console.error('Failed to update object type:', error);
      setError(error.response?.data?.message || error.message || 'Failed to update object type');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      resetCurrentField();
      setEditingFieldIndex(null);
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
              Edit Object Type: {objectType.name}
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
                  value={formData.name || ''}
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
              {formData.fieldsSchema?.fields && formData.fieldsSchema.fields.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-700">Configured Fields:</h5>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded">
                    {formData.fieldsSchema.fields.map((field, index) => (
                      <div key={index} className={`flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0 ${editingFieldIndex === index ? 'bg-blue-50' : ''}`}>
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
                        <div className="flex items-center space-x-2">
                          {editingFieldIndex === index ? (
                            <span className="text-xs text-blue-600 font-medium">Editing</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => editField(index)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Edit
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeField(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add/Edit Field */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-700 mb-3">
                  {editingFieldIndex !== null ? 'Edit Field:' : 'Add New Field:'}
                </h5>
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
                
                <div className="mt-4 flex space-x-2">
                  <button
                    type="button"
                    onClick={addField}
                    className="btn btn-secondary"
                    disabled={!currentField.key || !currentField.label}
                  >
                    {editingFieldIndex !== null ? 'Update Field' : 'Add Field'}
                  </button>
                  {editingFieldIndex !== null && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="btn btn-outline"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex space-x-4 pt-4 border-t">
              <button
                type="submit"
                className="btn btn-primary flex-1"
                disabled={loading || !formData.fieldsSchema?.fields || formData.fieldsSchema.fields.length === 0}
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  'Update Object Type'
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

export default EditObjectTypeModal;