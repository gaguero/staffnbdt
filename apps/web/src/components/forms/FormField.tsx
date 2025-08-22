import React, { useState, useRef } from 'react';
import { UseFormRegisterReturn, FieldError } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';

interface FormFieldProps {
  label: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'textarea' | 'select' | 'color';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: FieldError | string;
  helperText?: string;
  className?: string;
  register?: UseFormRegisterReturn;
  children?: React.ReactNode; // For select options
  rows?: number; // For textarea
  success?: boolean; // Show success state
  validating?: boolean; // Show validating state
  icon?: React.ReactNode;
  onBlur?: () => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  value?: string; // For controlled components
}

/**
 * Enhanced form field with real-time validation feedback
 * Provides visual indicators for validation states and smooth animations
 */
const FormField: React.FC<FormFieldProps> = ({
  label,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  error,
  helperText,
  className = '',
  register,
  children,
  rows = 3,
  success = false,
  validating = false,
  icon,
  onBlur,
  onChange,
  value,
}) => {
  const [, setIsFocused] = useState(false);
  const fieldRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

  const errorMessage = typeof error === 'string' ? error : error?.message;
  const hasError = !!errorMessage;
  const showSuccess = success && !hasError && !validating;

  // Generate field ID for accessibility
  const fieldId = `field-${label.toLowerCase().replace(/\s+/g, '-')}`;

  const baseInputClasses = `
    form-input
    transition-all duration-200
    ${hasError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
    ${showSuccess ? 'border-green-300 focus:border-green-500 focus:ring-green-500' : ''}
    ${validating ? 'border-yellow-300' : ''}
    ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}
    ${icon ? 'pl-10' : ''}
  `;

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    onChange?.(e);
  };

  const renderField = () => {
    const commonProps = {
      id: fieldId,
      placeholder,
      disabled,
      className: `${baseInputClasses} ${className}`,
      onFocus: handleFocus,
      onBlur: handleBlur,
      onChange: handleChange,
      ref: fieldRef,
      'aria-invalid': hasError,
      'aria-describedby': `${fieldId}-help`,
      ...(value !== undefined && { value }),
      ...register,
    };

    switch (type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={rows}
            ref={fieldRef as React.RefObject<HTMLTextAreaElement>}
          />
        );

      case 'select':
        return (
          <select
            {...commonProps}
            ref={fieldRef as React.RefObject<HTMLSelectElement>}
          >
            {children}
          </select>
        );

      default:
        return (
          <input
            {...commonProps}
            type={type}
            ref={fieldRef as React.RefObject<HTMLInputElement>}
          />
        );
    }
  };

  return (
    <div className="space-y-1">
      {/* Label */}
      <label
        htmlFor={fieldId}
        className={`form-label flex items-center ${
          required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''
        }`}
      >
        {label}
        {validating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="ml-2"
          >
            <div className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin" />
          </motion.div>
        )}
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="ml-2 text-green-500"
          >
            ✓
          </motion.div>
        )}
      </label>

      {/* Field wrapper */}
      <div className="relative">
        {/* Icon */}
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-gray-400">
              {icon}
            </div>
          </div>
        )}

        {/* Input field */}
        {renderField()}

        {/* Validation indicator */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <AnimatePresence mode="wait">
            {validating && (
              <motion.div
                key="validating"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="w-4 h-4 border border-yellow-400 border-t-transparent rounded-full animate-spin"
              />
            )}
            {showSuccess && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-green-500 text-lg"
              >
                ✓
              </motion.div>
            )}
            {hasError && !validating && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-red-500 text-lg"
              >
                ⚠
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Help text and error message */}
      <AnimatePresence mode="wait">
        {errorMessage && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-red-600"
            id={`${fieldId}-help`}
          >
            {errorMessage}
          </motion.div>
        )}
        {!errorMessage && helperText && (
          <motion.div
            key="help"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-gray-500"
            id={`${fieldId}-help`}
          >
            {helperText}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FormField;