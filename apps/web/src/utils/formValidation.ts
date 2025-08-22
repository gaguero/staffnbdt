import React from 'react';
import { z } from 'zod';

/**
 * Form validation schemas and utilities
 * Provides standardized validation rules and error messages
 */

// Common validation patterns
export const commonValidation = {
  email: z.string().email('Please enter a valid email address'),
  
  phone: z.string().optional().or(
    z.string().regex(
      /^[\+]?[\s\-\(\)]?[\d\s\-\(\)]{10,}$/,
      'Please enter a valid phone number'
    )
  ),
  
  url: z.string().optional().or(
    z.string().url('Please enter a valid URL (including http:// or https://)')
  ),
  
  slug: z.string().regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug must contain only lowercase letters, numbers, and hyphens'
  ),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  
  required: (fieldName: string) => 
    z.string().min(1, `${fieldName} is required`),
  
  optionalString: z.string().optional().or(z.literal('')),
};

// Organization validation schema
export const organizationValidationSchema = z.object({
  name: commonValidation.required('Organization name'),
  slug: commonValidation.slug.optional(),
  description: commonValidation.optionalString,
  timezone: commonValidation.optionalString,
  website: commonValidation.url,
  contactEmail: commonValidation.email.optional().or(z.literal('')),
  contactPhone: commonValidation.phone,
  isActive: z.boolean(),
  settings: z.object({
    defaultLanguage: z.enum(['en', 'es']),
    supportedLanguages: z.array(z.enum(['en', 'es'])),
    theme: z.enum(['default', 'luxury', 'minimal', 'corporate']),
  }).optional(),
  branding: z.object({
    primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
    secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
    accentColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
  }).optional(),
});

// User validation schema
export const userValidationSchema = z.object({
  firstName: commonValidation.required('First name'),
  lastName: commonValidation.required('Last name'),
  email: commonValidation.email,
  phone: commonValidation.phone,
  role: z.enum(['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'PROPERTY_MANAGER', 'DEPARTMENT_ADMIN', 'STAFF']),
  isActive: z.boolean(),
  organizationId: z.string().min(1, 'Organization is required'),
  propertyId: z.string().optional(),
  departmentId: z.string().optional(),
});

// Property validation schema
export const propertyValidationSchema = z.object({
  name: commonValidation.required('Property name'),
  slug: commonValidation.slug.optional(),
  description: commonValidation.optionalString,
  address: commonValidation.optionalString,
  phone: commonValidation.phone,
  email: commonValidation.email.optional().or(z.literal('')),
  website: commonValidation.url,
  isActive: z.boolean(),
  organizationId: z.string().min(1, 'Organization is required'),
});

// Department validation schema
export const departmentValidationSchema = z.object({
  name: commonValidation.required('Department name'),
  slug: commonValidation.slug.optional(),
  description: commonValidation.optionalString,
  isActive: z.boolean(),
  organizationId: z.string().min(1, 'Organization is required'),
  propertyId: z.string().min(1, 'Property is required'),
  parentDepartmentId: z.string().optional(),
});

// Export types for TypeScript
export type OrganizationFormData = z.infer<typeof organizationValidationSchema>;
export type UserFormData = z.infer<typeof userValidationSchema>;
export type PropertyFormData = z.infer<typeof propertyValidationSchema>;
export type DepartmentFormData = z.infer<typeof departmentValidationSchema>;

/**
 * Form validation error formatter
 * Converts Zod errors to user-friendly messages
 */
export const formatValidationErrors = (errors: z.ZodError) => {
  const formattedErrors: Record<string, string> = {};
  
  errors.errors.forEach((error) => {
    const path = error.path.join('.');
    formattedErrors[path] = error.message;
  });
  
  return formattedErrors;
};

/**
 * Real-time field validation
 * Validates a single field and returns error message if any
 */
export const validateField = (
  schema: z.ZodSchema,
  fieldName: string,
  value: any,
  formData: any
): string | null => {
  try {
    // Create a partial object with just the field we're validating
    schema.parse({ [fieldName]: value });
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldError = error.errors.find(e => e.path.includes(fieldName));
      return fieldError?.message || null;
    }
    return null;
  }
};

/**
 * Debounced validation hook for real-time validation
 */
export const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};