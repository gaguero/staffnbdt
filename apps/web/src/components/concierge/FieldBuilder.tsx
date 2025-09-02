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
  { value: 'number', label: 'Number', icon: '🔢', description: 'Numeric values' },
  { value: 'boolean', label: 'Yes/No', icon: '✅', description: 'Toggle or checkbox' },
  { value: 'date', label: 'Date/Time', icon: '📅', description: 'Date and time picker' },
  { value: 'relationship', label: 'Link to...', icon: '🔗', description: 'Link to guests, reservations, units, etc.' },
  { value: 'select', label: 'Dropdown', icon: '📋', description: 'Single choice from options' },
  { value: 'multiselect', label: 'Multi-Select', icon: '☑️', description: 'Multiple choices' },
  { value: 'quantity', label: 'Quantity', icon: '📏', description: 'Numbers with units (kg, cm, etc.)' },
  { value: 'money', label: 'Money', icon: '💰', description: 'Currency amounts' },
  { value: 'file', label: 'File Upload', icon: '📎', description: 'File attachments' },
  { value: 'url', label: 'Website Link', icon: '🌐', description: 'Web URLs' },
  { value: 'email', label: 'Email', icon: '📧', description: 'Email addresses' },
  { value: 'phone', label: 'Phone', icon: '📞', description: 'Phone numbers' },
  { value: 'location', label: 'Location', icon: '📍', description: 'Address or coordinates' },
  { value: 'richtext', label: 'Rich Text', icon: '📄', description: 'Formatted text editor' },
  { value: 'rating', label: 'Rating', icon: '⭐', description: 'Star ratings or scores' },
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
        
      case 'select':
        return (
          <select className="form-input text-sm" disabled>
            <option>Choose an option...</option>
            {field.options?.map((option, idx) => (
              <option key={idx}>{option}</option>
            ))}
          </select>
        );
        
      case 'multiselect':
        return (
          <div className="form-input text-sm bg-gray-50 min-h-[2.5rem] flex flex-wrap gap-1 p-2">
            {field.options?.slice(0, 2).map((option, idx) => (
              <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                {option}
              </span>
            ))}
            {field.options && field.options.length > 2 && (
              <span className="text-gray-500 text-xs">+{field.options.length - 2} more</span>
            )}
          </div>
        );
        
      case 'relationship':
        const relType = field.config?.relationshipType || 'guest';
        const relIcon = {
          guest: '👤',
          reservation: '📅',
          unit: '🏠',
          vendor: '🏪',
          object: '📋'
        }[relType];
        return (
          <div className="form-input text-sm bg-gray-50 flex items-center text-gray-600">
            <span className="mr-2">{relIcon}</span>
            Select {relType}(s)...
            {field.config?.multiple && <span className="ml-auto text-xs">(multiple)</span>}
          </div>
        );
        
      case 'quantity':
        const units = field.config?.units || ['kg', 'g', 'lbs'];
        return (
          <div className="flex gap-2">
            <input type="number" className="form-input text-sm flex-1" placeholder="Amount" disabled />
            <select className="form-input text-sm w-20" disabled>
              {units.slice(0, 3).map((unit, idx) => (
                <option key={idx}>{unit}</option>
              ))}
            </select>
          </div>
        );
        
      case 'money':
        const currencies = field.config?.currencies || ['USD', 'EUR'];
        return (
          <div className="flex gap-2">
            <select className="form-input text-sm w-20" disabled>
              {currencies.slice(0, 2).map((currency, idx) => (
                <option key={idx}>{currency}</option>
              ))}
            </select>
            <input type="number" className="form-input text-sm flex-1" placeholder="0.00" step="0.01" disabled />
          </div>
        );
        
      case 'file':
        return (
          <div className="form-input text-sm bg-gray-50 border-dashed flex items-center justify-center py-4 text-gray-500">
            <span className="mr-2">📎</span>
            Click to upload or drag and drop
          </div>
        );
        
      case 'url':
        return <input type="url" className="form-input text-sm" placeholder="https://example.com" disabled />;
        
      case 'email':
        return <input type="email" className="form-input text-sm" placeholder="user@example.com" disabled />;
        
      case 'phone':
        return <input type="tel" className="form-input text-sm" placeholder="+1 (555) 123-4567" disabled />;
        
      case 'location':
        return (
          <div className="form-input text-sm bg-gray-50 flex items-center text-gray-600">
            <span className="mr-2">📍</span>
            Enter address or coordinates...
          </div>
        );
        
      case 'richtext':
        return (
          <div className="border rounded text-sm">
            <div className="bg-gray-100 border-b px-3 py-2 flex gap-2">
              <span className="text-xs text-gray-500">B I U</span>
            </div>
            <div className="p-3 h-20 text-gray-500">
              Rich text content...
            </div>
          </div>
        );
        
      case 'rating':
        const maxRating = field.config?.maxRating || 5;
        const ratingType = field.config?.ratingType || 'stars';
        
        if (ratingType === 'stars') {
          return (
            <div className="flex items-center gap-1">
              {Array.from({ length: maxRating }).map((_, idx) => (
                <span key={idx} className="text-yellow-400">⭐</span>
              ))}
            </div>
          );
        } else if (ratingType === 'slider') {
          return <input type="range" min="1" max={maxRating} className="form-input text-sm" disabled />;
        } else {
          return (
            <div className="flex gap-2">
              <span className="text-green-500">👍</span>
              <span className="text-red-500">👎</span>
            </div>
          );
        }
      
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
          
          {(currentField.type === 'string' || currentField.type === 'select' || currentField.type === 'multiselect') && (
            <div className="md:col-span-2">
              <label className="form-label">
                Options {currentField.type !== 'string' && '(required)'}
              </label>
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
                required={currentField.type === 'select' || currentField.type === 'multiselect'}
              />
              <p className="text-xs text-gray-500 mt-1">
                {currentField.type === 'string' 
                  ? 'Leave empty for free text input, or provide comma-separated options for dropdown'
                  : 'Comma-separated list of available options'
                }
              </p>
            </div>
          )}
          
          {/* Field Type Specific Configuration */}
          {currentField.type === 'relationship' && (
            <div className="md:col-span-2">
              <label className="form-label">Relationship Configuration</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={currentField.config?.relationshipType || 'guest'}
                  onChange={(e) => setField({
                    ...currentField,
                    config: {
                      ...currentField.config,
                      relationshipType: e.target.value as any,
                    },
                  })}
                  className="form-input"
                >
                  <option value="guest">👤 Guest</option>
                  <option value="reservation">📅 Reservation</option>
                  <option value="unit">🏠 Unit/Room</option>
                  <option value="vendor">🏪 Vendor</option>
                  <option value="object">📋 Other Object</option>
                </select>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={currentField.config?.multiple || false}
                    onChange={(e) => setField({
                      ...currentField,
                      config: {
                        ...currentField.config,
                        multiple: e.target.checked,
                      },
                    })}
                    className="mr-2"
                  />
                  Allow multiple selections
                </label>
              </div>
            </div>
          )}
          
          {currentField.type === 'quantity' && (
            <div className="md:col-span-2">
              <label className="form-label">Quantity Units</label>
              <input
                type="text"
                value={currentField.config?.units?.join(', ') || 'kg, g, lbs'}
                onChange={(e) => setField({
                  ...currentField,
                  config: {
                    ...currentField.config,
                    units: e.target.value.split(',').map(u => u.trim()),
                  },
                })}
                className="form-input"
                placeholder="kg, g, lbs, cm, m, ft, in"
              />
              <p className="text-xs text-gray-500 mt-1">
                Comma-separated list of available units
              </p>
            </div>
          )}
          
          {currentField.type === 'money' && (
            <div className="md:col-span-2">
              <label className="form-label">Currency Options</label>
              <input
                type="text"
                value={currentField.config?.currencies?.join(', ') || 'USD, EUR, GBP'}
                onChange={(e) => setField({
                  ...currentField,
                  config: {
                    ...currentField.config,
                    currencies: e.target.value.split(',').map(c => c.trim().toUpperCase()),
                  },
                })}
                className="form-input"
                placeholder="USD, EUR, GBP, CAD, AUD"
              />
            </div>
          )}
          
          {currentField.type === 'file' && (
            <div className="md:col-span-2">
              <label className="form-label">File Configuration</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={currentField.config?.acceptedTypes?.join(', ') || ''}
                  onChange={(e) => setField({
                    ...currentField,
                    config: {
                      ...currentField.config,
                      acceptedTypes: e.target.value.split(',').map(t => t.trim()),
                    },
                  })}
                  className="form-input"
                  placeholder="pdf, jpg, png, docx"
                />
                <input
                  type="number"
                  value={currentField.config?.maxSize || ''}
                  onChange={(e) => setField({
                    ...currentField,
                    config: {
                      ...currentField.config,
                      maxSize: e.target.value ? parseInt(e.target.value) : undefined,
                    },
                  })}
                  className="form-input"
                  placeholder="Max size (MB)"
                />
              </div>
            </div>
          )}
          
          {currentField.type === 'rating' && (
            <div className="md:col-span-2">
              <label className="form-label">Rating Configuration</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={currentField.config?.maxRating || 5}
                  onChange={(e) => setField({
                    ...currentField,
                    config: {
                      ...currentField.config,
                      maxRating: parseInt(e.target.value) || 5,
                    },
                  })}
                  className="form-input"
                  placeholder="Max rating (1-10)"
                />
                <select
                  value={currentField.config?.ratingType || 'stars'}
                  onChange={(e) => setField({
                    ...currentField,
                    config: {
                      ...currentField.config,
                      ratingType: e.target.value as any,
                    },
                  })}
                  className="form-input"
                >
                  <option value="stars">⭐ Stars</option>
                  <option value="slider">🎚️ Slider</option>
                  <option value="thumbs">👍 Thumbs</option>
                </select>
              </div>
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
                  disabled={!currentField.key || !currentField.label || 
                    (['select', 'multiselect'].includes(currentField.type) && (!currentField.options || currentField.options.length === 0))}
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
                  disabled={!currentField.key || !currentField.label || 
                    (['select', 'multiselect'].includes(currentField.type) && (!currentField.options || currentField.options.length === 0))}
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