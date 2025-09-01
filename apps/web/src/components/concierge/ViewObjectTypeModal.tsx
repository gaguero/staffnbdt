import React from 'react';
import { ObjectType } from '../../services/conciergeService';

interface ViewObjectTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  objectType: ObjectType;
}

const ViewObjectTypeModal: React.FC<ViewObjectTypeModalProps> = ({
  isOpen,
  onClose,
  objectType,
}) => {
  if (!isOpen) return null;

  const getFieldTypeIcon = (type: string) => {
    const typeIcons = {
      string: '📝',
      number: '🔢',
      boolean: '☑️',
      date: '📅',
      json: '🔧',
    };
    return typeIcons[type as keyof typeof typeIcons] || '❓';
  };

  const getFieldTypeBadge = (type: string) => {
    const typeColors = {
      string: 'bg-blue-100 text-blue-800',
      number: 'bg-green-100 text-green-800',
      boolean: 'bg-purple-100 text-purple-800',
      date: 'bg-orange-100 text-orange-800',
      json: 'bg-gray-100 text-gray-800',
    };
    
    const colorClass = typeColors[type as keyof typeof typeColors] || 'bg-gray-100 text-gray-800';
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colorClass}`}>
        {type.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-semibold text-charcoal mb-2">
                {objectType.name}
              </h3>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  objectType.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {objectType.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="text-sm text-gray-500">
                  {objectType.fieldsSchema.fields.length} field{objectType.fieldsSchema.fields.length !== 1 ? 's' : ''}
                </span>
                <span className="text-sm text-gray-500">ID: {objectType.id}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Fields Schema */}
              <div className="card p-4">
                <h4 className="font-medium text-charcoal mb-4 border-b pb-2">Fields Schema</h4>
                {objectType.fieldsSchema.fields.length > 0 ? (
                  <div className="space-y-4">
                    {objectType.fieldsSchema.fields.map((field, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{getFieldTypeIcon(field.type)}</span>
                            <div>
                              <h5 className="font-medium text-gray-900">{field.label}</h5>
                              <p className="text-sm text-gray-500">Key: {field.key}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getFieldTypeBadge(field.type)}
                            {field.required && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                                Required
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {field.defaultValue && (
                            <div>
                              <p className="text-gray-500">Default Value</p>
                              <p className="font-medium text-gray-900">{field.defaultValue}</p>
                            </div>
                          )}
                          
                          {field.options && field.options.length > 0 && (
                            <div>
                              <p className="text-gray-500">Options</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {field.options.map((option, optIndex) => (
                                  <span key={optIndex} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                                    {option}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {field.validation && Object.keys(field.validation).length > 0 && (
                            <div className="md:col-span-2">
                              <p className="text-gray-500 mb-2">Validation Rules</p>
                              <div className="bg-gray-50 rounded p-3">
                                <div className="grid grid-cols-1 gap-1">
                                  {Object.entries(field.validation).map(([key, value]) => (
                                    <div key={key} className="flex justify-between text-xs">
                                      <span className="font-medium text-gray-700">{key.replace('_', ' ')}:</span>
                                      <span className="text-gray-900">{JSON.stringify(value)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📝</div>
                    <p>No fields configured</p>
                    <p className="text-sm mt-1">This object type has no defined fields</p>
                  </div>
                )}
              </div>

              {/* JSON Schema Preview */}
              <div className="card p-4">
                <h4 className="font-medium text-charcoal mb-4 border-b pb-2">JSON Schema Preview</h4>
                <pre className="bg-gray-50 rounded-lg p-4 text-sm overflow-x-auto">
                  {JSON.stringify(objectType.fieldsSchema, null, 2)}
                </pre>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="card p-4">
                <h4 className="font-medium text-charcoal mb-4 border-b pb-2">Object Type Details</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium text-gray-900">{objectType.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ID</p>
                    <p className="font-medium text-gray-900 text-xs font-mono">{objectType.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <div className="mt-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        objectType.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {objectType.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fields Count</p>
                    <p className="font-medium text-gray-900">{objectType.fieldsSchema.fields.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Required Fields</p>
                    <p className="font-medium text-gray-900">
                      {objectType.fieldsSchema.fields.filter(f => f.required).length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Field Types Summary */}
              <div className="card p-4">
                <h4 className="font-medium text-charcoal mb-4 border-b pb-2">Field Types</h4>
                <div className="space-y-2">
                  {['string', 'number', 'boolean', 'date', 'json'].map(type => {
                    const count = objectType.fieldsSchema.fields.filter(f => f.type === type).length;
                    if (count === 0) return null;
                    
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span>{getFieldTypeIcon(type)}</span>
                          <span className="text-sm capitalize">{type}</span>
                        </div>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Validations */}
              {objectType.validations && Object.keys(objectType.validations).length > 0 && (
                <div className="card p-4">
                  <h4 className="font-medium text-charcoal mb-4 border-b pb-2">Global Validations</h4>
                  <div className="bg-gray-50 rounded p-3">
                    <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                      {JSON.stringify(objectType.validations, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* UI Hints */}
              {objectType.uiHints && Object.keys(objectType.uiHints).length > 0 && (
                <div className="card p-4">
                  <h4 className="font-medium text-charcoal mb-4 border-b pb-2">UI Hints</h4>
                  <div className="bg-gray-50 rounded p-3">
                    <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                      {JSON.stringify(objectType.uiHints, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Usage Stats */}
              <div className="card p-4">
                <h4 className="font-medium text-charcoal mb-4 border-b pb-2">Usage Statistics</h4>
                <div className="text-center py-4">
                  <div className="text-2xl font-bold text-gray-400">N/A</div>
                  <div className="text-sm text-gray-500">Usage stats not available</div>
                  <div className="text-xs text-gray-400 mt-1">
                    This feature would show how many objects use this type
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-6 border-t">
            <button onClick={onClose} className="btn btn-primary">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewObjectTypeModal;