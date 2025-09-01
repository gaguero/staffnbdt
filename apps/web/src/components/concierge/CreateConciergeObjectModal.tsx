import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../LoadingSpinner';
import { conciergeService, ObjectType } from '../../services/conciergeService';
import { CreateConciergeObjectInput, ObjectFieldDefinition } from '../../types/concierge';
import toastService from '../../services/toastService';

interface CreateConciergeObjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateConciergeObjectModal: React.FC<CreateConciergeObjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [objectTypes, setObjectTypes] = useState<ObjectType[]>([]);
  const [selectedType, setSelectedType] = useState<ObjectType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateConciergeObjectInput>({
    type: '',
    reservationId: '',
    guestId: '',
    dueAt: undefined,
    assignments: {},
    attributes: {},
  });

  // Load object types
  useEffect(() => {
    if (isOpen) {
      loadObjectTypes();
    }
  }, [isOpen]);

  const loadObjectTypes = async () => {
    try {
      const response = await conciergeService.getObjectTypes();
      setObjectTypes(response.data || []);
    } catch (error) {
      console.error('Failed to load object types:', error);
      toastService.error('Failed to load object types');
    }
  };

  const handleTypeChange = (typeId: string) => {
    const selectedObjectType = objectTypes.find(ot => ot.id === typeId);
    setSelectedType(selectedObjectType || null);
    setFormData({
      ...formData,
      type: typeId,
      attributes: {}, // Reset attributes when type changes
    });
  };

  const handleAttributeChange = (fieldKey: string, value: any, fieldType: string) => {
    setFormData({
      ...formData,
      attributes: {
        ...formData.attributes,
        [fieldKey]: value,
      },
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'datetime-local' ? (value ? new Date(value) : undefined) : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.type) {
        throw new Error('Object type is required');
      }

      // Validate required attributes based on schema
      if (selectedType) {
        const requiredFields = selectedType.fieldsSchema.fields.filter(field => field.required);
        for (const field of requiredFields) {
          if (!formData.attributes[field.key]) {
            throw new Error(`${field.label} is required`);
          }
        }
      }

      await conciergeService.createObject(formData);
      toastService.actions.created('Concierge Object');
      onSuccess();
    } catch (error: any) {
      console.error('Failed to create concierge object:', error);
      setError(error.response?.data?.message || error.message || 'Failed to create concierge object');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      setFormData({
        type: '',
        reservationId: '',
        guestId: '',
        dueAt: undefined,
        assignments: {},
        attributes: {},
      });
      setSelectedType(null);
      onClose();
    }
  };

  const renderAttributeField = (field: ObjectFieldDefinition) => {
    const value = formData.attributes[field.key] || field.defaultValue || '';

    switch (field.type) {
      case 'string':
        if (field.options && field.options.length > 0) {
          return (
            <select
              key={field.key}
              value={value}
              onChange={(e) => handleAttributeChange(field.key, e.target.value, field.type)}
              className="form-input"
              required={field.required}
            >
              <option value="">Select {field.label}</option>
              {field.options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          );
        }
        return (
          <input
            key={field.key}
            type="text"
            value={value}
            onChange={(e) => handleAttributeChange(field.key, e.target.value, field.type)}
            className="form-input"
            placeholder={field.label}
            required={field.required}
            minLength={field.validation?.min}
            maxLength={field.validation?.max}
            pattern={field.validation?.pattern}
          />
        );

      case 'number':
        return (
          <input
            key={field.key}
            type="number"
            value={value}
            onChange={(e) => handleAttributeChange(field.key, parseFloat(e.target.value) || 0, field.type)}
            className="form-input"
            placeholder={field.label}
            required={field.required}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      case 'boolean':
        return (
          <div key={field.key} className="flex items-center">
            <input
              type="checkbox"
              checked={value === true}
              onChange={(e) => handleAttributeChange(field.key, e.target.checked, field.type)}
              className="mr-2"
              required={field.required}
            />
            <label className="text-sm">{field.label}</label>
          </div>
        );

      case 'date':
        return (
          <input
            key={field.key}
            type="datetime-local"
            value={value ? new Date(value).toISOString().slice(0, 16) : ''}
            onChange={(e) => handleAttributeChange(field.key, e.target.value ? new Date(e.target.value) : null, field.type)}
            className="form-input"
            required={field.required}
          />
        );

      case 'json':
        return (
          <textarea
            key={field.key}
            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
            onChange={(e) => {
              try {
                const jsonValue = JSON.parse(e.target.value);
                handleAttributeChange(field.key, jsonValue, field.type);
              } catch {
                handleAttributeChange(field.key, e.target.value, field.type);
              }
            }}
            className="form-input"
            placeholder={`${field.label} (JSON format)`}
            rows={4}
            required={field.required}
          />
        );

      default:
        return (
          <input
            key={field.key}
            type="text"
            value={value}
            onChange={(e) => handleAttributeChange(field.key, e.target.value, field.type)}
            className="form-input"
            placeholder={field.label}
            required={field.required}
          />
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-charcoal">
              Create Concierge Object
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
                <label className="form-label">Object Type *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="form-input"
                  required
                >
                  <option value="">Select Object Type</option>
                  {objectTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Reservation ID</label>
                  <input
                    type="text"
                    name="reservationId"
                    value={formData.reservationId || ''}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Optional reservation ID"
                  />
                </div>
                
                <div>
                  <label className="form-label">Guest ID</label>
                  <input
                    type="text"
                    name="guestId"
                    value={formData.guestId || ''}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Optional guest ID"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Due Date</label>
                <input
                  type="datetime-local"
                  name="dueAt"
                  value={formData.dueAt ? new Date(formData.dueAt).toISOString().slice(0, 16) : ''}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>

            {/* Dynamic Attributes */}
            {selectedType && selectedType.fieldsSchema.fields.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-md font-medium text-charcoal border-b pb-2">
                  {selectedType.name} Details
                </h4>
                
                <div className="grid grid-cols-1 gap-4">
                  {selectedType.fieldsSchema.fields.map(field => (
                    <div key={field.key}>
                      <label className="form-label">
                        {field.label}
                        {field.required && ' *'}
                      </label>
                      {renderAttributeField(field)}
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                  'Create Object'
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

export default CreateConciergeObjectModal;