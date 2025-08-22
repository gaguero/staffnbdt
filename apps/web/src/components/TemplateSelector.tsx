import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookTemplateIcon, SearchIcon, StarIcon, CheckIcon } from 'lucide-react';
import { Template, TemplateCategory } from '../types/template';
import { templateService } from '../services/templateService';
import LoadingSpinner from './LoadingSpinner';

interface TemplateSelectorProps {
  categoryId?: string;
  onTemplateSelect: (template: Template | null) => void;
  onTemplateApply?: (template: Template, data: Record<string, any>) => void;
  selectedTemplateId?: string;
  showApplyButton?: boolean;
  showCreateOption?: boolean;
  onCreateNew?: () => void;
  compact?: boolean;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  categoryId,
  onTemplateSelect,
  onTemplateApply,
  selectedTemplateId,
  showApplyButton = false,
  showCreateOption = true,
  onCreateNew,
  compact = false,
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Load templates
  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const filter = {
        categoryId,
        search: searchQuery || undefined,
        isPublic: true, // Only show public templates in selector
      };
      
      const loadedTemplates = await templateService.getTemplates(filter);
      
      // Sort by popularity and default status
      const sorted = loadedTemplates.sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return b.usage.count - a.usage.count;
      });
      
      setTemplates(sorted);
    } catch (err) {
      console.error('Failed to load templates:', err);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [categoryId, searchQuery]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Set initial selection
  useEffect(() => {
    if (selectedTemplateId && templates.length > 0) {
      const template = templates.find(t => t.id === selectedTemplateId);
      if (template) {
        setSelectedTemplate(template);
        onTemplateSelect(template);
      }
    }
  }, [selectedTemplateId, templates, onTemplateSelect]);

  // Handle template selection
  const handleTemplateSelect = useCallback((template: Template | null) => {
    setSelectedTemplate(template);
    onTemplateSelect(template);
  }, [onTemplateSelect]);

  // Handle template apply
  const handleTemplateApply = useCallback(async (template: Template) => {
    if (!onTemplateApply) return;
    
    try {
      const appliedData = await templateService.applyTemplate(template.id);
      onTemplateApply(template, appliedData);
    } catch (err) {
      console.error('Failed to apply template:', err);
    }
  }, [onTemplateApply]);

  // Get template preview
  const getTemplatePreview = (template: Template) => {
    const data = template.data;
    
    // Generate preview based on template category
    switch (template.category.id) {
      case 'department-structure':
        const departments = data.departments || [];
        return departments.length > 0 
          ? `${departments.length} departments with roles`
          : 'Department structure template';
      
      case 'user-roles':
        const roles = data.roles || data.role || [];
        return Array.isArray(roles) 
          ? `${roles.length} roles defined`
          : 'User role template';
      
      case 'organization-setup':
        const settings = Object.keys(data.settings || data).length;
        return `${settings} configuration settings`;
      
      default:
        const keys = Object.keys(data).length;
        return `${keys} configuration${keys !== 1 ? 's' : ''}`;
    }
  };

  if (compact) {
    return (
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Template List */}
        <div className="max-h-64 overflow-y-auto space-y-2">
          {loading ? (
            <div className="p-4 text-center">
              <LoadingSpinner size="sm" />
            </div>
          ) : templates.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No templates found
            </div>
          ) : (
            <>
              {/* Create New Option */}
              {showCreateOption && (
                <button
                  onClick={onCreateNew}
                  className="w-full p-3 text-left border border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors duration-200"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 text-lg">+</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Create from scratch</p>
                      <p className="text-xs text-gray-500">Start with a blank template</p>
                    </div>
                  </div>
                </button>
              )}

              {/* Templates */}
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={`
                    w-full p-3 text-left border rounded-lg transition-colors duration-200
                    ${selectedTemplate?.id === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 text-lg">
                      {template.category.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <p className="font-medium text-gray-900 truncate">
                          {template.name}
                        </p>
                        {template.isDefault && (
                          <StarIcon className="w-3 h-3 text-yellow-500 fill-current ml-1 flex-shrink-0" />
                        )}
                        {selectedTemplate?.id === template.id && (
                          <CheckIcon className="w-4 h-4 text-blue-600 ml-auto flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {getTemplatePreview(template)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">Choose a Template</h4>
        {selectedTemplate && showApplyButton && (
          <button
            onClick={() => handleTemplateApply(selectedTemplate)}
            className="btn btn-primary btn-sm"
          >
            Apply Template
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="col-span-2 p-8 text-center">
            <LoadingSpinner size="lg" />
            <p className="text-gray-500 mt-2">Loading templates...</p>
          </div>
        ) : (
          <>
            {/* Create New Option */}
            {showCreateOption && (
              <motion.button
                onClick={onCreateNew}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors duration-200 text-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 text-2xl">+</span>
                </div>
                <h5 className="font-medium text-gray-900 mb-1">Create from scratch</h5>
                <p className="text-sm text-gray-500">Start with a blank configuration</p>
              </motion.button>
            )}

            {/* Templates */}
            <AnimatePresence>
              {templates.map((template) => (
                <motion.button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={`
                    p-4 border rounded-lg text-left transition-all duration-200
                    ${selectedTemplate?.id === template.id
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }
                  `}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <span className="text-xl mr-2">{template.category.icon}</span>
                      <h5 className="font-medium text-gray-900 line-clamp-1">
                        {template.name}
                      </h5>
                    </div>
                    <div className="flex items-center space-x-1">
                      {template.isDefault && (
                        <StarIcon className="w-4 h-4 text-yellow-500 fill-current" />
                      )}
                      {selectedTemplate?.id === template.id && (
                        <CheckIcon className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {template.description}
                  </p>

                  {/* Preview */}
                  <p className="text-xs text-gray-500">
                    {getTemplatePreview(template)}
                  </p>

                  {/* Usage count */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      Used {template.usage.count} times
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      template.category.id === 'department-structure' 
                        ? 'bg-blue-100 text-blue-700'
                        : template.category.id === 'user-roles'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {template.category.name}
                    </span>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>

            {templates.length === 0 && !loading && (
              <div className="col-span-2 p-8 text-center">
                <BookTemplateIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h5 className="text-lg font-medium text-gray-900 mb-2">No templates found</h5>
                <p className="text-gray-500">
                  {searchQuery 
                    ? 'No templates match your search criteria'
                    : 'No templates available for this category'
                  }
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TemplateSelector;