import React, { useState, useMemo } from 'react';
import { ObjectType, ObjectFieldDefinition } from '../../types/concierge';

interface TemplatePreviewProps {
  objectType: ObjectType;
  parentObjectType?: ObjectType;
}

interface PreviewMode {
  id: 'form' | 'card' | 'list' | 'mobile';
  label: string;
  icon: string;
}

const PREVIEW_MODES: PreviewMode[] = [
  { id: 'form', label: 'Form View', icon: '📝' },
  { id: 'card', label: 'Card View', icon: '🃏' },
  { id: 'list', label: 'List View', icon: '📋' },
  { id: 'mobile', label: 'Mobile View', icon: '📱' },
];

const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  objectType,
  parentObjectType,
}) => {
  const [previewMode, setPreviewMode] = useState<PreviewMode['id']>('form');
  const [sampleData, setSampleData] = useState<Record<string, any>>({});

  // Generate sample data based on field types
  const generateSampleData = useMemo(() => {
    const data: Record<string, any> = {};
    
    objectType.fieldsSchema.fields.forEach(field => {
      switch (field.type) {
        case 'string':
          if (field.options && field.options.length > 0) {
            data[field.key] = field.options[0];
          } else {
            data[field.key] = field.defaultValue || getSampleStringValue(field.key, field.label);
          }
          break;
        case 'number':
          data[field.key] = field.defaultValue || getSampleNumberValue(field.key);
          break;
        case 'boolean':
          data[field.key] = field.defaultValue ?? getSampleBooleanValue(field.key);
          break;
        case 'date':
          data[field.key] = field.defaultValue || new Date().toISOString().split('T')[0];
          break;
        case 'json':
          data[field.key] = field.defaultValue || getSampleJsonValue(field.key);
          break;
        default:
          data[field.key] = field.defaultValue || '';
      }
    });
    
    return data;
  }, [objectType.fieldsSchema.fields]);

  // Update sample data when generated data changes
  React.useEffect(() => {
    setSampleData(generateSampleData);
  }, [generateSampleData]);

  function getSampleStringValue(key: string, label: string): string {
    const lowerKey = key.toLowerCase();
    const lowerLabel = label.toLowerCase();
    
    if (lowerKey.includes('name') || lowerLabel.includes('name')) {
      return 'John Smith';
    }
    if (lowerKey.includes('email') || lowerLabel.includes('email')) {
      return 'john.smith@email.com';
    }
    if (lowerKey.includes('phone') || lowerLabel.includes('phone')) {
      return '(555) 123-4567';
    }
    if (lowerKey.includes('room') || lowerLabel.includes('room')) {
      return '101A';
    }
    if (lowerKey.includes('table') || lowerLabel.includes('table')) {
      return 'Table 5';
    }
    if (lowerKey.includes('request') || lowerLabel.includes('request')) {
      return 'Extra towels and late checkout';
    }
    if (lowerKey.includes('note') || lowerLabel.includes('note')) {
      return 'Guest prefers quiet room away from elevator';
    }
    return `Sample ${label}`;
  }

  function getSampleNumberValue(key: string): number {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('room')) return 101;
    if (lowerKey.includes('table')) return 5;
    if (lowerKey.includes('guest') || lowerKey.includes('person')) return 2;
    if (lowerKey.includes('price') || lowerKey.includes('cost')) return 150;
    if (lowerKey.includes('time') || lowerKey.includes('hour')) return 14;
    return 42;
  }

  function getSampleBooleanValue(key: string): boolean {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('urgent') || lowerKey.includes('priority')) return true;
    if (lowerKey.includes('complete') || lowerKey.includes('done')) return false;
    if (lowerKey.includes('active') || lowerKey.includes('enable')) return true;
    return Math.random() > 0.5;
  }

  function getSampleJsonValue(key: string): any {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('preference')) {
      return { dietary: 'vegetarian', allergies: ['nuts'], specialRequests: ['quiet room'] };
    }
    if (lowerKey.includes('contact') || lowerKey.includes('info')) {
      return { emergency: { name: 'Jane Smith', phone: '(555) 987-6543' } };
    }
    if (lowerKey.includes('assignment') || lowerKey.includes('staff')) {
      return { primaryStaff: 'Maria Garcia', backupStaff: 'Carlos Rodriguez' };
    }
    return { sampleKey: 'Sample Value', anotherKey: 123 };
  }

  const handleSampleDataChange = (key: string, value: any) => {
    setSampleData(prev => ({ ...prev, [key]: value }));
  };

  const renderFieldPreview = (field: ObjectFieldDefinition, value: any, compact = false) => {
    const inputClasses = compact ? 'form-input text-sm' : 'form-input';
    const labelClasses = compact ? 'form-label text-xs' : 'form-label';

    switch (field.type) {
      case 'string':
        if (field.options && field.options.length > 0) {
          return (
            <div>
              {!compact && <label className={labelClasses}>{field.label}</label>}
              <select
                value={value || ''}
                onChange={(e) => handleSampleDataChange(field.key, e.target.value)}
                className={inputClasses}
              >
                {field.options.map((option, idx) => (
                  <option key={idx} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          );
        }
        return (
          <div>
            {!compact && <label className={labelClasses}>{field.label}</label>}
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handleSampleDataChange(field.key, e.target.value)}
              className={inputClasses}
              placeholder={field.label}
            />
          </div>
        );
      
      case 'number':
        return (
          <div>
            {!compact && <label className={labelClasses}>{field.label}</label>}
            <input
              type="number"
              value={value || ''}
              onChange={(e) => handleSampleDataChange(field.key, parseFloat(e.target.value) || 0)}
              className={inputClasses}
              placeholder={field.label}
            />
          </div>
        );
      
      case 'boolean':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleSampleDataChange(field.key, e.target.checked)}
              className="mr-2"
            />
            <label className={compact ? 'text-sm' : 'text-base'}>{field.label}</label>
          </div>
        );
      
      case 'date':
        return (
          <div>
            {!compact && <label className={labelClasses}>{field.label}</label>}
            <input
              type="datetime-local"
              value={value || ''}
              onChange={(e) => handleSampleDataChange(field.key, e.target.value)}
              className={inputClasses}
            />
          </div>
        );
      
      case 'json':
        return (
          <div>
            {!compact && <label className={labelClasses}>{field.label}</label>}
            <textarea
              value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value || ''}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleSampleDataChange(field.key, parsed);
                } catch {
                  handleSampleDataChange(field.key, e.target.value);
                }
              }}
              className={`${inputClasses} h-20 font-mono text-xs`}
              placeholder="Enter JSON data..."
            />
          </div>
        );
      
      default:
        return (
          <div>
            {!compact && <label className={labelClasses}>{field.label}</label>}
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handleSampleDataChange(field.key, e.target.value)}
              className={inputClasses}
            />
          </div>
        );
    }
  };

  const renderFormView = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-charcoal">{objectType.name}</h3>
          {parentObjectType && (
            <p className="text-sm text-gray-600 mt-1">
              Child of: <span className="font-medium">{parentObjectType.name}</span>
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Draft</span>
          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
            Due: {new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString()}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {objectType.fieldsSchema.fields.map((field) => (
          <div key={field.key}>
            {renderFieldPreview(field, sampleData[field.key])}
            {field.required && (
              <span className="text-red-500 text-xs mt-1">* Required</span>
            )}
          </div>
        ))}
      </div>
      
      <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
        <button className="btn btn-secondary">Save Draft</button>
        <button className="btn btn-primary">Complete Task</button>
      </div>
    </div>
  );

  const renderCardView = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-charcoal">{objectType.name}</h4>
          <p className="text-xs text-gray-500 mt-1">
            ID: OBJ-{Math.random().toString(36).substr(2, 6).toUpperCase()}
          </p>
        </div>
        <div className="flex items-center space-x-1">
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">In Progress</span>
        </div>
      </div>
      
      <div className="space-y-2 text-sm">
        {objectType.fieldsSchema.fields.slice(0, 3).map((field) => (
          <div key={field.key} className="flex justify-between">
            <span className="text-gray-600 font-medium">{field.label}:</span>
            <span className="text-charcoal">
              {field.type === 'boolean' 
                ? (sampleData[field.key] ? '✅' : '❌')
                : sampleData[field.key]?.toString() || 'Not set'
              }
            </span>
          </div>
        ))}
        {objectType.fieldsSchema.fields.length > 3 && (
          <p className="text-xs text-gray-500">
            +{objectType.fieldsSchema.fields.length - 3} more fields...
          </p>
        )}
      </div>
      
      {parentObjectType && (
        <div className="mt-3 pt-2 border-t border-gray-100">
          <p className="text-xs text-blue-600">
            📎 Related to: {parentObjectType.name}
          </p>
        </div>
      )}
      
      <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-500">
          Due: {new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString()}
        </span>
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          View Details
        </button>
      </div>
    </div>
  );

  const renderListView = () => (
    <div className="bg-white border border-gray-200 rounded">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-12 gap-3 text-xs font-semibold text-gray-700 uppercase tracking-wide">
          <div className="col-span-3">Object</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-4">Key Fields</div>
          <div className="col-span-2">Due Date</div>
          <div className="col-span-1">Actions</div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-12 gap-3 items-center text-sm">
          <div className="col-span-3">
            <div>
              <div className="font-medium text-charcoal">{objectType.name}</div>
              <div className="text-xs text-gray-500">
                OBJ-{Math.random().toString(36).substr(2, 6).toUpperCase()}
              </div>
              {parentObjectType && (
                <div className="text-xs text-blue-600">↳ {parentObjectType.name}</div>
              )}
            </div>
          </div>
          
          <div className="col-span-2">
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
              In Progress
            </span>
          </div>
          
          <div className="col-span-4">
            <div className="space-y-1">
              {objectType.fieldsSchema.fields.slice(0, 2).map((field) => (
                <div key={field.key} className="text-xs">
                  <span className="text-gray-600">{field.label}:</span>
                  <span className="ml-1 text-charcoal">
                    {field.type === 'boolean' 
                      ? (sampleData[field.key] ? '✅' : '❌')
                      : sampleData[field.key]?.toString() || 'Not set'
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="col-span-2">
            <span className="text-sm text-gray-600">
              {new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString()}
            </span>
          </div>
          
          <div className="col-span-1">
            <button className="text-blue-600 hover:text-blue-800 text-sm">
              •••
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMobileView = () => (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden max-w-sm mx-auto">
      {/* Mobile Header */}
      <div className="bg-warm-gold text-white p-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold truncate">{objectType.name}</h4>
          <span className="px-2 py-1 bg-white bg-opacity-20 text-xs rounded">
            In Progress
          </span>
        </div>
        {parentObjectType && (
          <p className="text-primary-100 text-xs mt-1">
            Related to: {parentObjectType.name}
          </p>
        )}
      </div>
      
      {/* Mobile Content */}
      <div className="p-4 space-y-3">
        {objectType.fieldsSchema.fields.slice(0, 4).map((field) => (
          <div key={field.key}>
            {renderFieldPreview(field, sampleData[field.key], true)}
          </div>
        ))}
        
        {objectType.fieldsSchema.fields.length > 4 && (
          <button className="text-blue-600 text-sm font-medium">
            View {objectType.fieldsSchema.fields.length - 4} more fields...
          </button>
        )}
      </div>
      
      {/* Mobile Actions */}
      <div className="bg-gray-50 p-4 flex space-x-2">
        <button className="btn btn-secondary btn-sm flex-1">Save</button>
        <button className="btn btn-primary btn-sm flex-1">Complete</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-charcoal mb-2">Live Preview</h3>
        <p className="text-gray-600 text-sm">
          See how your object type will look and function in different views. 
          Edit the sample data to test different scenarios.
        </p>
      </div>

      {/* Preview Mode Selector */}
      <div className="flex flex-wrap gap-2">
        {PREVIEW_MODES.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setPreviewMode(mode.id)}
            className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              previewMode === mode.id
                ? 'bg-warm-gold text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="mr-2">{mode.icon}</span>
            {mode.label}
          </button>
        ))}
      </div>

      {/* Preview Content */}
      <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300">
        <div className="mb-4">
          <h4 className="font-medium text-gray-700 mb-1">
            {PREVIEW_MODES.find(m => m.id === previewMode)?.label} Preview
          </h4>
          <p className="text-xs text-gray-600">
            This is how staff will interact with objects of type "{objectType.name}"
          </p>
        </div>
        
        <div className={previewMode === 'mobile' ? 'flex justify-center' : ''}>
          {previewMode === 'form' && renderFormView()}
          {previewMode === 'card' && renderCardView()}
          {previewMode === 'list' && renderListView()}
          {previewMode === 'mobile' && renderMobileView()}
        </div>
      </div>

      {/* Sample Data Editor */}
      {objectType.fieldsSchema.fields.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-700 mb-3">🎮 Sample Data Controls</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {objectType.fieldsSchema.fields.map((field) => (
              <div key={field.key} className="bg-gray-50 rounded p-3">
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  {field.label} ({field.type})
                </label>
                {renderFieldPreview(field, sampleData[field.key], true)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Object Type Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">📊 Object Type Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="font-semibold text-blue-800">{objectType.fieldsSchema.fields.length}</div>
            <div className="text-blue-600">Total Fields</div>
          </div>
          <div>
            <div className="font-semibold text-blue-800">
              {objectType.fieldsSchema.fields.filter(f => f.required).length}
            </div>
            <div className="text-blue-600">Required Fields</div>
          </div>
          <div>
            <div className="font-semibold text-blue-800">
              {objectType.fieldsSchema.fields.filter(f => f.options && f.options.length > 0).length}
            </div>
            <div className="text-blue-600">Dropdown Fields</div>
          </div>
          <div>
            <div className="font-semibold text-blue-800">
              {parentObjectType ? 'Yes' : 'No'}
            </div>
            <div className="text-blue-600">Has Parent</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreview;