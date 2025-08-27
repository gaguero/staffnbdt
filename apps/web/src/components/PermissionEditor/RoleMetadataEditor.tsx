import React, { useState, useCallback } from 'react';
import {
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TagIcon,
  SwatchIcon,
  AdjustmentsHorizontalIcon,
  ExclamationTriangleIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

import { 
  RoleMetadataEditorProps, 
  RoleLevel, 
  ValidationError 
} from '../../types/permissionEditor';
import RoleBadge from '../RoleBadge';

const ROLE_LEVELS = [
  { 
    value: RoleLevel.INDIVIDUAL, 
    label: 'Individual', 
    description: 'Personal access only', 
    icon: '👤',
    scope: 'Can only access own resources'
  },
  { 
    value: RoleLevel.DEPARTMENT, 
    label: 'Department', 
    description: 'Department-level access', 
    icon: '🏬',
    scope: 'Can access department resources'
  },
  { 
    value: RoleLevel.PROPERTY, 
    label: 'Property', 
    description: 'Property-wide access', 
    icon: '🏨',
    scope: 'Can access property-wide resources'
  },
  { 
    value: RoleLevel.ORGANIZATION, 
    label: 'Organization', 
    description: 'Organization-wide access', 
    icon: '🏢',
    scope: 'Can access organization-wide resources'
  },
  { 
    value: RoleLevel.PLATFORM, 
    label: 'Platform', 
    description: 'Platform-wide access', 
    icon: '🌐',
    scope: 'Can access platform-wide resources'
  }
];

const ROLE_CATEGORIES = [
  { value: 'hospitality', label: 'Hospitality', color: 'blue' },
  { value: 'management', label: 'Management', color: 'purple' },
  { value: 'administration', label: 'Administration', color: 'indigo' },
  { value: 'support', label: 'Support', color: 'green' },
  { value: 'finance', label: 'Finance', color: 'yellow' },
  { value: 'custom', label: 'Custom', color: 'gray' }
];

const ROLE_COLORS = [
  { value: 'blue', label: 'Blue', class: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'indigo', label: 'Indigo', class: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { value: 'green', label: 'Green', class: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'yellow', label: 'Yellow', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'red', label: 'Red', class: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'gray', label: 'Gray', class: 'bg-gray-100 text-gray-800 border-gray-200' }
];

const COMMON_TAGS = [
  'front-desk', 'housekeeping', 'maintenance', 'security', 'management',
  'supervisor', 'admin', 'staff', 'temporary', 'seasonal', 'full-time',
  'part-time', 'contractor', 'guest-services', 'food-beverage'
];

const RoleMetadataEditor: React.FC<RoleMetadataEditorProps> = ({
  role,
  onChange,
  errors = [],
  className = '',
  showAdvanced = true
}) => {
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  // Get field errors
  const getFieldErrors = useCallback((field: string): ValidationError[] => {
    return errors.filter(error => error.field === field);
  }, [errors]);

  // Check if field has errors
  const hasFieldError = useCallback((field: string): boolean => {
    return getFieldErrors(field).some(e => e.type === 'error');
  }, [getFieldErrors]);

  // Get error class for input
  const getInputErrorClass = useCallback((field: string): string => {
    return hasFieldError(field) ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';
  }, [hasFieldError]);

  // Handle role name change
  const handleNameChange = useCallback((name: string) => {
    onChange({
      name,
      displayName: role.displayName || name
    });
  }, [onChange, role.displayName]);

  // Handle tag addition
  const handleAddTag = useCallback((tag: string) => {
    if (!tag.trim() || role.metadata.tags.includes(tag.trim().toLowerCase())) return;

    const newTags = [...role.metadata.tags, tag.trim().toLowerCase()];
    onChange({
      metadata: {
        ...role.metadata,
        tags: newTags
      }
    });

    setNewTag('');
    setShowTagSuggestions(false);
  }, [role.metadata, onChange]);

  // Handle tag removal
  const handleRemoveTag = useCallback((tagToRemove: string) => {
    const newTags = role.metadata.tags.filter(tag => tag !== tagToRemove);
    onChange({
      metadata: {
        ...role.metadata,
        tags: newTags
      }
    });
  }, [role.metadata, onChange]);

  // Handle role level change
  const handleLevelChange = useCallback((level: RoleLevel) => {
    onChange({ level });
  }, [onChange]);

  // Handle category change
  const handleCategoryChange = useCallback((category: string) => {
    onChange({
      metadata: {
        ...role.metadata,
        category
      }
    });
  }, [role.metadata, onChange]);

  // Handle color change
  const handleColorChange = useCallback((color: string) => {
    onChange({
      metadata: {
        ...role.metadata,
        color
      }
    });
  }, [role.metadata, onChange]);

  // Filter tag suggestions
  const tagSuggestions = COMMON_TAGS.filter(tag => 
    tag.toLowerCase().includes(newTag.toLowerCase()) && 
    !role.metadata.tags.includes(tag.toLowerCase())
  ).slice(0, 8);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Role Name */}
        <div>
          <label htmlFor="role-name" className="block text-sm font-medium text-gray-700 mb-1">
            Role Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="role-name"
            value={role.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 ${getInputErrorClass('name')}`}
            placeholder="Enter role name..."
            maxLength={50}
          />
          {getFieldErrors('name').map((error, index) => (
            <div key={index} className="mt-1 flex items-center space-x-1 text-sm text-red-600">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <span>{error.message}</span>
            </div>
          ))}
          <div className="mt-1 text-xs text-gray-500">
            {role.name.length}/50 characters
          </div>
        </div>

        {/* Display Name */}
        <div>
          <label htmlFor="display-name" className="block text-sm font-medium text-gray-700 mb-1">
            Display Name
            <span className="ml-1 text-gray-400" title="Optional friendly name for display">
              <InformationCircleIcon className="h-4 w-4 inline" />
            </span>
          </label>
          <input
            type="text"
            id="display-name"
            value={role.displayName || ''}
            onChange={(e) => onChange({ displayName: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-500"
            placeholder="Friendly display name..."
            maxLength={60}
          />
          <div className="mt-1 text-xs text-gray-500">
            Optional: Used in user interfaces when available
          </div>
        </div>
      </div>

      {/* Role Description */}
      <div>
        <label htmlFor="role-description" className="block text-sm font-medium text-gray-700 mb-1">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="role-description"
          value={role.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
          className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 ${getInputErrorClass('description')}`}
          placeholder="Describe what this role can do and its intended use..."
          maxLength={500}
        />
        {getFieldErrors('description').map((error, index) => (
          <div key={index} className="mt-1 flex items-center space-x-1 text-sm text-red-600">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <span>{error.message}</span>
          </div>
        ))}
        <div className="mt-1 text-xs text-gray-500">
          {role.description.length}/500 characters
        </div>
      </div>

      {/* Role Level */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Role Level <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          {ROLE_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => handleLevelChange(level.value)}
              className={`p-3 text-left border rounded-lg transition-all duration-200 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                role.level === level.value
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-lg">{level.icon}</span>
                <span className="font-medium text-sm">{level.label}</span>
              </div>
              <div className="text-xs text-gray-600">{level.scope}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Role Preview */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900">Role Preview</h4>
          <div className="flex items-center space-x-2">
            <UserGroupIcon className="h-4 w-4 text-gray-500" />
            <span className="text-xs text-gray-500">
              {role.metadata.usage?.userCount || 0} users
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <RoleBadge
            role={role.name || 'Untitled Role'}
            isCustomRole={role.isCustomRole}
            size="lg"
            showTooltip={false}
          />
          <div className="text-sm text-gray-600">
            {role.description || 'No description provided'}
          </div>
        </div>
      </div>

      {/* Advanced Options Toggle */}
      {showAdvanced && (
        <div>
          <button
            type="button"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 focus:outline-none focus:text-gray-900"
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
            <span>Advanced Options</span>
            {showAdvancedOptions ? (
              <ChevronUpIcon className="h-4 w-4" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" />
            )}
          </button>

          {showAdvancedOptions && (
            <div className="mt-4 space-y-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {ROLE_CATEGORIES.map((category) => (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() => handleCategoryChange(category.value)}
                      className={`p-2 text-xs font-medium border rounded-md transition-colors duration-200 ${
                        role.metadata.category === category.value
                          ? `bg-${category.color}-100 text-${category.color}-800 border-${category.color}-300`
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <SwatchIcon className="h-4 w-4 inline mr-1" />
                  Badge Color
                </label>
                <div className="flex items-center space-x-2">
                  {ROLE_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => handleColorChange(color.value)}
                      className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                        role.metadata.color === color.value
                          ? 'border-gray-900 scale-110'
                          : 'border-gray-300 hover:border-gray-500'
                      } ${color.class.split(' ')[0]}`}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <TagIcon className="h-4 w-4 inline mr-1" />
                  Tags
                </label>
                
                {/* Existing Tags */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {role.metadata.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add New Tag */}
                <div className="relative">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => {
                      setNewTag(e.target.value);
                      setShowTagSuggestions(e.target.value.length > 0);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag(newTag);
                      }
                    }}
                    onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Add tags to categorize this role..."
                  />

                  {/* Tag Suggestions */}
                  {showTagSuggestions && tagSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                      {tagSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => handleAddTag(suggestion)}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="mt-1 text-xs text-gray-500">
                  Press Enter to add a tag, or click on suggestions above
                </div>
              </div>

              {/* Template Option */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is-template"
                  checked={role.metadata.isTemplate}
                  onChange={(e) => onChange({
                    metadata: {
                      ...role.metadata,
                      isTemplate: e.target.checked
                    }
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is-template" className="ml-2 text-sm text-gray-700">
                  Save as template
                  <span className="ml-1 text-gray-500">(can be reused for creating new roles)</span>
                </label>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RoleMetadataEditor;