import React, { useState, useCallback } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { ObjectFieldDefinition, AttributeFieldType } from '../../types/concierge';
import toastService from '../../services/toastService';

interface FieldBuilderProps {
  fields: ObjectFieldDefinition[];
  onChange: (fields: ObjectFieldDefinition[]) => void;
  draggedIndex: number | null;
}

interface FieldTypeOption {
  value: AttributeFieldType;
  label: string;
  icon: string;
  description: string;
}

const FIELD_TYPES: FieldTypeOption[] = [
  { value: 'string', label: 'Text', icon: '📝', description: 'Single line text input' },
  { value: 'number', label: 'Number', icon: '🔢', description: 'Numeric values with validation' },
  { value: 'boolean', label: 'Yes/No', icon: '✅', description: 'Toggle or checkbox field' },
  { value: 'date', label: 'Date/Time', icon: '📅', description: 'Date and time picker' },
  { value: 'json', label: 'Rich Data', icon: '📊', description: 'Complex structured data' },
];

const FieldBuilder: React.FC<FieldBuilderProps> = ({ fields, onChange, draggedIndex }) => {
  const [editingField, setEditingField] = useState<ObjectFieldDefinition | null>(null);
  const [showAddField, setShowAddField] = useState(false);
  const [newField, setNewField] = useState<ObjectFieldDefinition>({
    key: '',
    type: 'string',
    label: '',
    required: false,
    defaultValue: '',
    options: [],
    validation: {},
  });

  const handleAddField = useCallback(() => {
    if (!newField.key || !newField.label) {
      toastService.error('Field key and label are required');
      return;
    }

    // Check for duplicate keys
    if (fields.some(f => f.key === newField.key)) {
      toastService.error('Field key must be unique');
      return;
    }

    const updatedFields = [...fields, { ...newField }];
    onChange(updatedFields);
    
    // Reset new field form
    setNewField({
      key: '',
      type: 'string',
      label: '',
      required: false,
      defaultValue: '',
      options: [],
      validation: {},
    });
    setShowAddField(false);
    
    toastService.success('Field added successfully');
  }, [fields, newField, onChange]);

  const handleEditField = useCallback((field: ObjectFieldDefinition, index: number) => {
    const updatedFields = [...fields];
    updatedFields[index] = field;
    onChange(updatedFields);
    setEditingField(null);
    toastService.success('Field updated successfully');
  }, [fields, onChange]);

  const handleDeleteField = useCallback((index: number) => {
    const field = fields[index];
    if (window.confirm(`Are you sure you want to delete the "${field.label}" field?`)) {
      const updatedFields = fields.filter((_, i) => i !== index);
      onChange(updatedFields);
      toastService.success('Field removed successfully');
    }
  }, [fields, onChange]);

  const handleDuplicateField = useCallback((index: number) => {
    const originalField = fields[index];
    const duplicatedField: ObjectFieldDefinition = {
      ...originalField,
      key: `${originalField.key}_copy`,
      label: `${originalField.label} (Copy)`,
    };
    
    const updatedFields = [...fields];
    updatedFields.splice(index + 1, 0, duplicatedField);
    onChange(updatedFields);
    toastService.success('Field duplicated successfully');
  }, [fields, onChange]);

  const generateKeyFromLabel = useCallback((label: string) => {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30);
  }, []);

  const getFieldTypeIcon = (type: AttributeFieldType) => {
    return FIELD_TYPES.find(ft => ft.value === type)?.icon || '📝';
  };

  const renderFieldPreview = (field: ObjectFieldDefinition) => {
    switch (field.type) {
      case 'string':
        if (field.options && field.options.length > 0) {
          return (
            <select className="form-input text-sm" disabled>
              <option>Choose an option...</option>
              {field.options.map((option, idx) => (
                <option key={idx}>{option}</option>
              ))}
            </select>
          );
        }
        return <input type="text" className="form-input text-sm" placeholder={field.label} disabled />;
      
      case 'number':
        return <input type="number" className="form-input text-sm" placeholder="Enter number" disabled />;
      
      case 'boolean':
        return (
          <div className="flex items-center">
            <input type="checkbox" className="mr-2" disabled />
            <span className="text-sm text-gray-600">{field.label}</span>
          </div>
        );
      
      case 'date':
        return <input type="datetime-local" className="form-input text-sm" disabled />;
      
      case 'json':
        return (
          <textarea 
            className="form-input text-sm h-20 resize-none" 
            placeholder="JSON data will be entered here..."
            disabled
          />
        );
      
      default:
        return <input type="text" className="form-input text-sm" disabled />;
    }
  };

  const renderFieldEditor = (field: ObjectFieldDefinition, isNew = false) => {
    const currentField = isNew ? newField : field;
    const setField = isNew ? setNewField : 
      (updatedField: ObjectFieldDefinition) => setEditingField(updatedField);

    return (
      <div className="space-y-4 bg-gray-50 border-2 border-warm-gold rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Field Label *</label>
            <input
              type="text"
              value={currentField.label}
              onChange={(e) => {
                const label = e.target.value;
                setField({
                  ...currentField,
                  label,
                  key: currentField.key || generateKeyFromLabel(label),
                });
              }}
              className="form-input"
              placeholder="Field Label"
              autoFocus
            />
          </div>
          
          <div>
            <label className="form-label">Field Key *</label>
            <input
              type="text"
              value={currentField.key}
              onChange={(e) => setField({
                ...currentField,
                key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
              })}
              className="form-input font-mono text-sm"
              placeholder="field_key"
            />
          </div>
          
          <div>
            <label className="form-label">Field Type</label>
            <select
              value={currentField.type}
              onChange={(e) => setField({
                ...currentField,
                type: e.target.value as AttributeFieldType,
                options: e.target.value === 'string' ? currentField.options : [],
              })}
              className="form-input"
            >
              {FIELD_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="form-label">Default Value</label>
            <input
              type="text"
              value={currentField.defaultValue || ''}
              onChange={(e) => setField({
                ...currentField,
                defaultValue: e.target.value,
              })}
              className="form-input"
              placeholder="Optional default value"
            />
          </div>
          
          {currentField.type === 'string' && (
            <div className="md:col-span-2">
              <label className="form-label">Options (for dropdown)</label>
              <input
                type="text"
                value={currentField.options?.join(', ') || ''}
                onChange={(e) => setField({
                  ...currentField,
                  options: e.target.value
                    .split(',')
                    .map(opt => opt.trim())
                    .filter(opt => opt.length > 0),
                })}
                className="form-input"
                placeholder="Option 1, Option 2, Option 3"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty for free text input, or provide comma-separated options for dropdown
              </p>
            </div>
          )}
          
          {(currentField.type === 'string' || currentField.type === 'number') && (
            <div className="md:col-span-2">
              <label className="form-label">Validation Rules</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder={currentField.type === 'string' ? 'Min length' : 'Min value'}
                  value={currentField.validation?.min || ''}
                  onChange={(e) => setField({
                    ...currentField,
                    validation: {
                      ...currentField.validation,
                      min: e.target.value ? (currentField.type === 'string' ? parseInt(e.target.value) : parseFloat(e.target.value)) : undefined,
                    },
                  })}
                  className="form-input"
                />
                <input
                  type="number"
                  placeholder={currentField.type === 'string' ? 'Max length' : 'Max value'}
                  value={currentField.validation?.max || ''}
                  onChange={(e) => setField({
                    ...currentField,
                    validation: {
                      ...currentField.validation,
                      max: e.target.value ? (currentField.type === 'string' ? parseInt(e.target.value) : parseFloat(e.target.value)) : undefined,
                    },
                  })}
                  className="form-input"
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={currentField.required}
              onChange={(e) => setField({
                ...currentField,
                required: e.target.checked,
              })}
              className="mr-2"
            />
            <label className="text-sm font-medium">Required field</label>
          </div>
          
          <div className="flex space-x-2">
            {isNew ? (
              <>
                <button
                  onClick={() => setShowAddField(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddField}
                  className="btn btn-primary btn-sm"
                  disabled={!currentField.key || !currentField.label}
                >
                  Add Field
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditingField(null)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const index = fields.findIndex(f => f.key === field.key);
                    if (index !== -1) {
                      handleEditField(currentField, index);
                    }
                  }}
                  className="btn btn-primary btn-sm"
                  disabled={!currentField.key || !currentField.label}
                >
                  Save Changes
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-charcoal">Field Configuration</h3>
          <p className="text-gray-600 text-sm">
            Design the data structure for your object type. Drag fields to reorder them.
          </p>
        </div>
        
        {!showAddField && !editingField && (
          <button
            onClick={() => setShowAddField(true)}
            className="btn btn-primary"
          >
            <span className="mr-2">➕</span>
            Add Field
          </button>
        )}
      </div>

      {/* Add New Field Form */}
      {showAddField && renderFieldEditor(newField, true)}

      {/* Existing Fields */}
      {fields.length > 0 ? (
        <Droppable droppableId="fields">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`space-y-3 ${
                snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg p-2' : ''
              }`}
            >
              {fields.map((field, index) => (
                <Draggable key={field.key} draggableId={field.key} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`border border-gray-200 rounded-lg bg-white transition-shadow ${
                        snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-md'
                      } ${draggedIndex === index ? 'ring-2 ring-warm-gold' : ''}`}
                    >
                      {editingField?.key === field.key ? (
                        renderFieldEditor(editingField)
                      ) : (
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div
                                {...provided.dragHandleProps}
                                className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing p-1"
                              >
                                ⋮⋮
                              </div>
                              <div className="text-2xl">
                                {getFieldTypeIcon(field.type)}
                              </div>
                              <div>
                                <h4 className="font-semibold text-charcoal flex items-center">
                                  {field.label}
                                  {field.required && (
                                    <span className="text-red-500 ml-1">*</span>
                                  )}
                                </h4>
                                <p className="text-xs text-gray-500 font-mono">
                                  {field.key} • {FIELD_TYPES.find(ft => ft.value === field.type)?.label}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleDuplicateField(index)}
                                className="text-blue-600 hover:text-blue-800 text-sm p-1"
                                title="Duplicate field"
                              >
                                📋
                              </button>
                              <button
                                onClick={() => setEditingField(field)}
                                className="text-blue-600 hover:text-blue-800 text-sm p-1"
                                title="Edit field"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteField(index)}
                                className="text-red-600 hover:text-red-800 text-sm p-1"
                                title="Delete field"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          
                          {/* Field Preview */}
                          <div className="bg-gray-50 rounded p-3">
                            <p className="text-xs text-gray-600 mb-2 font-medium">Field Preview:</p>
                            {renderFieldPreview(field)}
                          </div>
                          
                          {/* Field Details */}
                          <div className="mt-3 flex flex-wrap gap-2">
                            {field.defaultValue && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                Default: {field.defaultValue}
                              </span>
                            )}
                            {field.options && field.options.length > 0 && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                {field.options.length} options
                              </span>
                            )}
                            {field.validation && Object.keys(field.validation).length > 0 && (
                              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                Validation rules
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-4xl mb-4">🏗️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Fields Yet</h3>
          <p className="text-gray-600 mb-4">
            Add your first field to define the data structure for this object type.
          </p>
          {!showAddField && (
            <button
              onClick={() => setShowAddField(true)}
              className="btn btn-primary"
            >
              Add First Field
            </button>
          )}
        </div>
      )}

      {/* Field Type Reference */}
      {fields.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">🎯 Field Types Reference</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
            {FIELD_TYPES.map(type => (
              <div key={type.value} className="flex items-center text-blue-800">
                <span className="mr-2">{type.icon}</span>
                <span className="font-medium mr-2">{type.label}:</span>
                <span className="text-blue-600">{type.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldBuilder;