import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusIcon, 
  SearchIcon, 
  FilterIcon, 
  DownloadIcon, 
  UploadIcon,
  StarIcon,
  CopyIcon,
  EditIcon,
  TrashIcon,
  EyeIcon,
  TagIcon,
  CalendarIcon,
  UsersIcon,
} from 'lucide-react';
import { Template, TemplateCategory, TemplateFilter, CreateTemplateData } from '../types/template';
import { templateService } from '../services/templateService';
import { toastService } from '../utils/toast';
import { usePermissions } from '../hooks/usePermissions';
import PermissionGate from './PermissionGate';
import LoadingSpinner from './LoadingSpinner';

interface TemplateManagerProps {
  categoryId?: string;
  onTemplateSelect?: (template: Template) => void;
  onTemplateApply?: (template: Template, data: Record<string, any>) => void;
  showActions?: boolean;
  selectable?: boolean;
  maxHeight?: string;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({
  categoryId,
  onTemplateSelect,
  onTemplateApply,
  showActions = true,
  selectable = false,
  maxHeight = '600px',
}) => {
  const { hasPermission } = usePermissions();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  // Filter state
  const [filter, setFilter] = useState<TemplateFilter>({
    categoryId: categoryId,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryId || '');
  const [showPublicOnly, setShowPublicOnly] = useState(false);

  // Load data
  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const currentFilter: TemplateFilter = {
        ...filter,
        search: searchQuery || undefined,
        categoryId: selectedCategory || undefined,
        isPublic: showPublicOnly ? true : undefined,
      };
      
      const loadedTemplates = await templateService.getTemplates(currentFilter);
      setTemplates(loadedTemplates);
    } catch (err: any) {
      console.error('Failed to load templates:', err);
      setError(err.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [filter, searchQuery, selectedCategory, showPublicOnly]);

  const loadCategories = useCallback(async () => {
    try {
      const loadedCategories = templateService.getCategories();
      setCategories(loadedCategories);
    } catch (err: any) {
      console.error('Failed to load categories:', err);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Template actions
  const handleTemplateSelect = useCallback((template: Template) => {
    setSelectedTemplate(template);
    onTemplateSelect?.(template);
  }, [onTemplateSelect]);

  const handleTemplateApply = useCallback(async (template: Template) => {
    try {
      const appliedData = await templateService.applyTemplate(template.id);
      onTemplateApply?.(template, appliedData);
      toastService.success(`Template "${template.name}" applied successfully`);
    } catch (err: any) {
      console.error('Failed to apply template:', err);
      toastService.error(err.message || 'Failed to apply template');
    }
  }, [onTemplateApply]);

  const handleTemplateDuplicate = useCallback(async (template: Template) => {
    try {
      await templateService.duplicateTemplate(template.id);
      toastService.success(`Template "${template.name}" duplicated`);
      await loadTemplates();
    } catch (err: any) {
      console.error('Failed to duplicate template:', err);
      toastService.error(err.message || 'Failed to duplicate template');
    }
  }, [loadTemplates]);

  const handleTemplateDelete = useCallback(async (template: Template) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) {
      return;
    }

    try {
      await templateService.deleteTemplate(template.id);
      toastService.success(`Template "${template.name}" deleted`);
      await loadTemplates();
    } catch (err: any) {
      console.error('Failed to delete template:', err);
      toastService.error(err.message || 'Failed to delete template');
    }
  }, [loadTemplates]);

  const handleTemplateExport = useCallback(async (template: Template) => {
    try {
      const exportData = await templateService.exportTemplate(template.id);
      
      // Create and download file
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name.replace(/[^a-zA-Z0-9]/g, '_')}_template.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toastService.success(`Template "${template.name}" exported`);
    } catch (err: any) {
      console.error('Failed to export template:', err);
      toastService.error(err.message || 'Failed to export template');
    }
  }, []);

  const handleTemplateImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      await templateService.importTemplate(content);
      toastService.success('Template imported successfully');
      await loadTemplates();
    } catch (err: any) {
      console.error('Failed to import template:', err);
      toastService.error(err.message || 'Failed to import template');
    }
    
    // Reset file input
    event.target.value = '';
  }, [loadTemplates]);

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get category badge color
  const getCategoryColor = (categoryId: string) => {
    const colors = {
      'department-structure': 'bg-blue-100 text-blue-800',
      'user-roles': 'bg-green-100 text-green-800',
      'organization-setup': 'bg-purple-100 text-purple-800',
      'property-config': 'bg-orange-100 text-orange-800',
      'workflow-automation': 'bg-gray-100 text-gray-800',
    };
    return colors[categoryId as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Template Library</h3>
          <p className="text-sm text-gray-600">
            Manage and apply pre-configured templates for quick setup
          </p>
        </div>
        
        {showActions && (
          <div className="flex items-center space-x-2">
            {/* Import Template */}
            <label className="btn btn-outline btn-sm cursor-pointer">
              <UploadIcon className="w-4 h-4 mr-1" />
              Import
              <input
                type="file"
                accept=".json"
                onChange={handleTemplateImport}
                className="hidden"
              />
            </label>
            
            {/* Create Template */}
            <PermissionGate permission="template.create">
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary btn-sm"
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Create Template
              </button>
            </PermissionGate>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>

          {/* Public Filter */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showPublicOnly}
              onChange={(e) => setShowPublicOnly(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Public only</span>
          </label>

          {/* Results count */}
          <div className="text-sm text-gray-500 flex items-center">
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              `${templates.length} template${templates.length !== 1 ? 's' : ''}`
            )}
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div 
        className="space-y-4 overflow-y-auto"
        style={{ maxHeight }}
      >
        {loading ? (
          <div className="p-8 text-center">
            <LoadingSpinner size="lg" />
            <p className="text-gray-500 mt-4">Loading templates...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="text-red-500 mb-4">⚠️</div>
            <p className="text-red-600">{error}</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">📋</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No templates found</h4>
            <p className="text-gray-500">
              {searchQuery || selectedCategory
                ? 'No templates match your search criteria'
                : 'No templates available yet'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AnimatePresence>
              {templates.map((template) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`
                    bg-white border rounded-lg p-4 hover:shadow-md transition-shadow duration-200
                    ${selectable ? 'cursor-pointer hover:border-blue-500' : ''}
                    ${selectedTemplate?.id === template.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}
                  `}
                  onClick={selectable ? () => handleTemplateSelect(template) : undefined}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{template.category.icon}</span>
                      <div>
                        <h4 className="font-medium text-gray-900 line-clamp-1">
                          {template.name}
                        </h4>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category.id)}`}>
                          {template.category.name}
                        </span>
                      </div>
                    </div>
                    
                    {template.isDefault && (
                      <StarIcon className="w-4 h-4 text-yellow-500 fill-current" />
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {template.description}
                  </p>

                  {/* Tags */}
                  {template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
                        >
                          <TagIcon className="w-3 h-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                      {template.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{template.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center">
                        <CalendarIcon className="w-3 h-3 mr-1" />
                        {formatDate(template.createdAt)}
                      </span>
                      <span className="flex items-center">
                        <UsersIcon className="w-3 h-3 mr-1" />
                        {template.usage.count} uses
                      </span>
                    </div>
                    {template.isPublic && (
                      <span className="text-green-600 font-medium">Public</span>
                    )}
                  </div>

                  {/* Actions */}
                  {showActions && (
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTemplate(template);
                            setShowPreviewModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                          title="Preview template"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTemplateDuplicate(template);
                          }}
                          className="text-green-600 hover:text-green-800 text-sm"
                          title="Duplicate template"
                        >
                          <CopyIcon className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTemplateExport(template);
                          }}
                          className="text-gray-600 hover:text-gray-800 text-sm"
                          title="Export template"
                        >
                          <DownloadIcon className="w-4 h-4" />
                        </button>
                        
                        {!template.isDefault && (
                          <PermissionGate permission="template.delete">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTemplateDelete(template);
                              }}
                              className="text-red-600 hover:text-red-800 text-sm"
                              title="Delete template"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </PermissionGate>
                        )}
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTemplateApply(template);
                        }}
                        className="btn btn-primary btn-sm"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateManager;