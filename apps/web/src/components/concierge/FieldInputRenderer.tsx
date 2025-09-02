import React from 'react';
import { ObjectFieldDefinition } from '../../types/concierge';
import {
  RelationshipFieldInput,
  QuantityInput,
  MoneyInput,
  FileUploadInput,
  RatingInput,
  LocationInput,
  RichTextInput,
  MultiSelectInput,
} from './inputs';

interface FieldInputRendererProps {
  field: ObjectFieldDefinition;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
  onFieldFocus?: (fieldKey: string) => void;
  onFieldBlur?: (fieldKey: string) => void;
}

const FieldInputRenderer: React.FC<FieldInputRendererProps> = ({
  field,
  value,
  onChange,
  error,
  disabled = false,
  onFieldFocus,
  onFieldBlur,
}) => {

  const handleFocus = () => {
    onFieldFocus?.(field.key);
  };

  const handleBlur = () => {
    onFieldBlur?.(field.key);
  };

  // Render specialized input components based on field type
  switch (field.type) {
    case 'relationship':
      return (
        <div onFocus={handleFocus} onBlur={handleBlur}>
          <RelationshipFieldInput
            field={field}
            value={value}
            onChange={onChange}
            error={error}
            disabled={disabled}
          />
        </div>
      );

    case 'quantity':
      return (
        <div onFocus={handleFocus} onBlur={handleBlur}>
          <QuantityInput
            field={field}
            value={value}
            onChange={onChange}
            error={error}
            disabled={disabled}
          />
        </div>
      );

    case 'money':
      return (
        <div onFocus={handleFocus} onBlur={handleBlur}>
          <MoneyInput
            field={field}
            value={value}
            onChange={onChange}
            error={error}
            disabled={disabled}
          />
        </div>
      );

    case 'file':
      return (
        <div onFocus={handleFocus} onBlur={handleBlur}>
          <FileUploadInput
            field={field}
            value={value}
            onChange={onChange}
            error={error}
            disabled={disabled}
          />
        </div>
      );

    case 'rating':
      return (
        <div onFocus={handleFocus} onBlur={handleBlur}>
          <RatingInput
            field={field}
            value={value}
            onChange={onChange}
            error={error}
            disabled={disabled}
          />
        </div>
      );

    case 'location':
      return (
        <div onFocus={handleFocus} onBlur={handleBlur}>
          <LocationInput
            field={field}
            value={value}
            onChange={onChange}
            error={error}
            disabled={disabled}
          />
        </div>
      );

    case 'richtext':
      return (
        <div onFocus={handleFocus} onBlur={handleBlur}>
          <RichTextInput
            field={field}
            value={value}
            onChange={onChange}
            error={error}
            disabled={disabled}
          />
        </div>
      );

    case 'select':
      return (
        <div onFocus={handleFocus} onBlur={handleBlur}>
          <label className="form-label flex items-center">
            📋 {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`form-input ${error ? 'border-red-500' : ''}`}
            disabled={disabled}
            required={field.required}
          >
            <option value="">Choose an option...</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
      );

    case 'multiselect':
      return (
        <div onFocus={handleFocus} onBlur={handleBlur}>
          <MultiSelectInput
            field={field}
            value={value}
            onChange={onChange}
            error={error}
            disabled={disabled}
          />
        </div>
      );

    case 'string':
      return (
        <div onFocus={handleFocus} onBlur={handleBlur}>
          <label className="form-label flex items-center">
            📝 {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.label}
            className={`form-input ${error ? 'border-red-500' : ''}`}
            disabled={disabled}
            required={field.required}
            minLength={field.validation?.min}
            maxLength={field.validation?.max}
            pattern={field.validation?.pattern}
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          {field.validation?.max && (
            <p className="text-xs text-gray-500 mt-1">
              {(value || '').length}/{field.validation.max} characters
            </p>
          )}
        </div>
      );

    case 'number':
      return (
        <div onFocus={handleFocus} onBlur={handleBlur}>
          <label className="form-label flex items-center">
            🔢 {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : '')}
            placeholder="Enter number"
            className={`form-input ${error ? 'border-red-500' : ''}`}
            disabled={disabled}
            required={field.required}
            min={field.validation?.min}
            max={field.validation?.max}
            step="any"
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          {(field.validation?.min !== undefined || field.validation?.max !== undefined) && (
            <p className="text-xs text-gray-500 mt-1">
              Range: {field.validation?.min ?? '−∞'} to {field.validation?.max ?? '∞'}
            </p>
          )}
        </div>
      );

    case 'boolean':
      return (
        <div onFocus={handleFocus} onBlur={handleBlur}>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              className="mr-3"
              disabled={disabled}
              required={field.required}
            />
            <label className="form-label flex items-center mb-0">
              ✅ {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
      );

    case 'date':
      return (
        <div onFocus={handleFocus} onBlur={handleBlur}>
          <label className="form-label flex items-center">
            📅 {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="datetime-local"
            value={value ? new Date(value).toISOString().slice(0, 16) : ''}
            onChange={(e) => onChange(e.target.value ? new Date(e.target.value) : '')}
            className={`form-input ${error ? 'border-red-500' : ''}`}
            disabled={disabled}
            required={field.required}
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
      );

    case 'url':
      return (
        <div onFocus={handleFocus} onBlur={handleBlur}>
          <label className="form-label flex items-center">
            🌐 {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="url"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://example.com"
            className={`form-input ${error ? 'border-red-500' : ''}`}
            disabled={disabled}
            required={field.required}
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          {value && (
            <p className="text-xs text-blue-600 mt-1">
              <a href={value} target="_blank" rel="noopener noreferrer" className="hover:underline">
                🔗 Open link
              </a>
            </p>
          )}
        </div>
      );

    case 'email':
      return (
        <div onFocus={handleFocus} onBlur={handleBlur}>
          <label className="form-label flex items-center">
            📧 {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="email"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="email@example.com"
            className={`form-input ${error ? 'border-red-500' : ''}`}
            disabled={disabled}
            required={field.required}
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          {value && (
            <p className="text-xs text-blue-600 mt-1">
              <a href={`mailto:${value}`} className="hover:underline">
                ✉️ Send email
              </a>
            </p>
          )}
        </div>
      );

    case 'phone':
      return (
        <div onFocus={handleFocus} onBlur={handleBlur}>
          <label className="form-label flex items-center">
            📞 {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="tel"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="+1 (555) 123-4567"
            className={`form-input ${error ? 'border-red-500' : ''}`}
            disabled={disabled}
            required={field.required}
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          {value && (
            <p className="text-xs text-blue-600 mt-1">
              <a href={`tel:${value}`} className="hover:underline">
                📱 Call number
              </a>
            </p>
          )}
        </div>
      );

    case 'json':
      return (
        <div onFocus={handleFocus} onBlur={handleBlur}>
          <label className="form-label flex items-center">
            📊 {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <textarea
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                onChange(parsed);
              } catch {
                onChange(e.target.value);
              }
            }}
            placeholder="Enter JSON data..."
            className={`form-input h-32 resize-vertical font-mono text-sm ${error ? 'border-red-500' : ''}`}
            disabled={disabled}
            required={field.required}
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          <p className="text-xs text-gray-500 mt-1">
            Enter valid JSON data. Use proper formatting for complex objects.
          </p>
        </div>
      );

    default:
      return (
        <div onFocus={handleFocus} onBlur={handleBlur}>
          <label className="form-label flex items-center">
            ❓ {field.label} <span className="text-xs text-gray-500 ml-2">(Unknown type: {field.type})</span>
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.label}
            className={`form-input ${error ? 'border-red-500' : ''}`}
            disabled={disabled}
            required={field.required}
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          <p className="text-xs text-orange-500 mt-1">
            Warning: Unknown field type "{field.type}". Using text input as fallback.
          </p>
        </div>
      );
  }
};

export default FieldInputRenderer;