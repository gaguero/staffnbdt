import React, { useState, useCallback, useRef, useEffect } from 'react';

export interface EditableCellProps {
  value: string | number | boolean;
  onSave: (newValue: any) => Promise<void>;
  type?: 'text' | 'number' | 'select' | 'boolean';
  options?: Array<{ value: any; label: string }>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  displayFormatter?: (value: any) => string;
  validator?: (value: any) => string | null;
  multiline?: boolean;
  maxLength?: number;
}

/**
 * Inline editable cell component
 * Part of Phase 2 UX improvements for inline editing capabilities
 */
const EditableCell: React.FC<EditableCellProps> = ({
  value,
  onSave,
  type = 'text',
  options = [],
  placeholder,
  disabled = false,
  className = '',
  displayFormatter,
  validator,
  multiline = false,
  maxLength,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

  const displayValue = displayFormatter ? displayFormatter(value) : String(value);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (type === 'text' && inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [isEditing, type]);

  const handleStartEdit = useCallback(() => {
    if (disabled) return;
    setIsEditing(true);
    setEditValue(value);
    setError(null);
  }, [disabled, value]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditValue(value);
    setError(null);
  }, [value]);

  const handleSave = useCallback(async () => {
    // Validate if validator provided
    if (validator) {
      const validationError = validator(editValue);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    // Don't save if value hasn't changed
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error: any) {
      setError(error.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }, [editValue, value, validator, onSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  }, [handleSave, handleCancel, multiline]);

  const renderEditInput = () => {
    const baseInputClass = `
      w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-transparent
      ${error ? 'border-red-500' : 'border-gray-300'}
    `;

    switch (type) {
      case 'select':
        return (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={baseInputClass}
            disabled={isSaving}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'boolean':
        return (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={editValue ? 'true' : 'false'}
            onChange={(e) => setEditValue(e.target.value === 'true')}
            onKeyDown={handleKeyDown}
            className={baseInputClass}
            disabled={isSaving}
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        );

      case 'number':
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(Number(e.target.value))}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={baseInputClass}
            disabled={isSaving}
          />
        );

      default:
        if (multiline) {
          return (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              maxLength={maxLength}
              className={`${baseInputClass} resize-none`}
              rows={3}
              disabled={isSaving}
            />
          );
        } else {
          return (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              maxLength={maxLength}
              className={baseInputClass}
              disabled={isSaving}
            />
          );
        }
    }
  };

  return (
    <div className={`relative group ${className}`}>
      {isEditing ? (
        <div className="space-y-1">
          {renderEditInput()}
          
          {error && (
            <div className="text-xs text-red-600">
              {error}
            </div>
          )}
          
          <div className="flex items-center gap-1">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              title="Save (Enter)"
            >
              {isSaving ? '...' : '✓'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
              title="Cancel (Esc)"
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={handleStartEdit}
          className={`
            cursor-pointer rounded px-2 py-1 min-h-[28px] flex items-center
            ${disabled 
              ? 'cursor-not-allowed opacity-50' 
              : 'hover:bg-gray-100 group-hover:bg-gray-100'
            }
          `}
          title={disabled ? undefined : 'Click to edit'}
        >
          <span className="flex-1">
            {displayValue || (
              <span className="text-gray-400 italic">
                {placeholder || 'Click to edit'}
              </span>
            )}
          </span>
          {!disabled && (
            <span className="opacity-0 group-hover:opacity-50 ml-2 text-xs">
              ✏️
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default EditableCell;