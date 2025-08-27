import { useState, useCallback, useEffect } from 'react';
import { 
  Template, 
  TemplateCategory, 
  CreateTemplateData, 
  UpdateTemplateData,
  TemplateFilter
} from '../types/template';
import { templateService } from '../services/templateService';
import { toastService } from '../utils/toast';

interface UseTemplatesOptions {
  categoryId?: string;
  autoLoad?: boolean;
  enableSearch?: boolean;
  enableLocalStorage?: boolean;
}

interface UseTemplatesReturn {
  // State
  templates: Template[];
  categories: TemplateCategory[];
  loading: boolean;
  error: string | null;
  selectedTemplate: Template | null;
  
  // Actions
  loadTemplates: (filter?: TemplateFilter) => Promise<void>;
  createTemplate: (data: CreateTemplateData) => Promise<Template>;
  updateTemplate: (id: string, data: UpdateTemplateData) => Promise<Template>;
  deleteTemplate: (id: string) => Promise<void>;
  duplicateTemplate: (id: string, newName?: string) => Promise<Template>;
  applyTemplate: (id: string, overrides?: Record<string, any>) => Promise<Record<string, any>>;
  
  // Selection
  selectTemplate: (template: Template | null) => void;
  
  // Search & Filter
  searchTemplates: (query: string) => void;
  filterByCategory: (categoryId: string) => void;
  getTemplatesByCategory: (categoryId: string) => Template[];
  getPopularTemplates: (limit?: number) => Promise<Template[]>;
  
  // Import/Export
  exportTemplate: (id: string) => Promise<void>;
  importTemplate: (templateJson: string) => Promise<Template>;
  
  // Utilities
  getTemplatePreview: (template: Template) => string;
  validateTemplateData: (data: Record<string, any>, categoryId: string) => boolean;
  generateTemplateFromData: (name: string, data: Record<string, any>, categoryId: string) => CreateTemplateData;
}

export const useTemplates = (options: UseTemplatesOptions = {}): UseTemplatesReturn => {
  const {
    categoryId,
    autoLoad = true,
    enableSearch = true,
  } = options;

  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [currentFilter, setCurrentFilter] = useState<TemplateFilter>({ categoryId });

  // Load templates
  const loadTemplates = useCallback(async (filter: TemplateFilter = currentFilter) => {
    try {
      setLoading(true);
      setError(null);
      
      const loadedTemplates = await templateService.getTemplates(filter);
      setTemplates(loadedTemplates);
      setCurrentFilter(filter);
      
    } catch (err: any) {
      console.error('Failed to load templates:', err);
      setError(err.message || 'Failed to load templates');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [currentFilter]);

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      const loadedCategories = templateService.getCategories();
      setCategories(loadedCategories);
    } catch (err: any) {
      console.error('Failed to load categories:', err);
    }
  }, []);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadTemplates();
      loadCategories();
    }
  }, [autoLoad, loadTemplates, loadCategories]);

  // Create template
  const createTemplate = useCallback(async (data: CreateTemplateData): Promise<Template> => {
    try {
      const newTemplate = await templateService.createTemplate(data);
      setTemplates(prev => [newTemplate, ...prev]);
      toastService.success(`Template "${data.name}" created successfully`);
      return newTemplate;
    } catch (err: any) {
      console.error('Failed to create template:', err);
      toastService.error(err.message || 'Failed to create template');
      throw err;
    }
  }, []);

  // Update template
  const updateTemplate = useCallback(async (id: string, data: UpdateTemplateData): Promise<Template> => {
    try {
      const updatedTemplate = await templateService.updateTemplate(id, data);
      setTemplates(prev => prev.map(t => t.id === id ? updatedTemplate : t));
      toastService.success(`Template "${updatedTemplate.name}" updated successfully`);
      return updatedTemplate;
    } catch (err: any) {
      console.error('Failed to update template:', err);
      toastService.error(err.message || 'Failed to update template');
      throw err;
    }
  }, []);

  // Delete template
  const deleteTemplate = useCallback(async (id: string): Promise<void> => {
    const template = templates.find(t => t.id === id);
    if (!template) return;

    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) {
      return;
    }

    try {
      await templateService.deleteTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      
      if (selectedTemplate?.id === id) {
        setSelectedTemplate(null);
      }
      
      toastService.success(`Template "${template.name}" deleted successfully`);
    } catch (err: any) {
      console.error('Failed to delete template:', err);
      toastService.error(err.message || 'Failed to delete template');
    }
  }, [templates, selectedTemplate]);

  // Duplicate template
  const duplicateTemplate = useCallback(async (id: string, newName?: string): Promise<Template> => {
    try {
      const duplicated = await templateService.duplicateTemplate(id, newName);
      setTemplates(prev => [duplicated, ...prev]);
      toastService.success(`Template duplicated successfully`);
      return duplicated;
    } catch (err: any) {
      console.error('Failed to duplicate template:', err);
      toastService.error(err.message || 'Failed to duplicate template');
      throw err;
    }
  }, []);

  // Apply template
  const applyTemplate = useCallback(async (
    id: string, 
    overrides: Record<string, any> = {}
  ): Promise<Record<string, any>> => {
    try {
      const appliedData = await templateService.applyTemplate(id, overrides);
      
      // Update usage count locally
      setTemplates(prev => prev.map(t => 
        t.id === id 
          ? { ...t, usage: { ...t.usage, count: t.usage.count + 1, lastUsed: new Date() } }
          : t
      ));
      
      return appliedData;
    } catch (err: any) {
      console.error('Failed to apply template:', err);
      toastService.error(err.message || 'Failed to apply template');
      throw err;
    }
  }, []);

  // Selection
  const selectTemplate = useCallback((template: Template | null) => {
    setSelectedTemplate(template);
  }, []);

  // Search templates
  const searchTemplates = useCallback(async (query: string) => {
    if (!enableSearch) return;
    
    await loadTemplates({
      ...currentFilter,
      search: query || undefined,
    });
  }, [enableSearch, loadTemplates, currentFilter]);

  // Filter by category
  const filterByCategory = useCallback(async (categoryId: string) => {
    await loadTemplates({
      ...currentFilter,
      categoryId: categoryId || undefined,
    });
  }, [loadTemplates, currentFilter]);

  // Get templates by category
  const getTemplatesByCategory = useCallback((categoryId: string): Template[] => {
    return templates.filter(t => t.category.id === categoryId);
  }, [templates]);

  // Get popular templates
  const getPopularTemplates = useCallback(async (limit: number = 5): Promise<Template[]> => {
    try {
      return await templateService.getPopularTemplates(limit);
    } catch (err: any) {
      console.error('Failed to get popular templates:', err);
      return [];
    }
  }, []);

  // Export template
  const exportTemplate = useCallback(async (id: string): Promise<void> => {
    try {
      const template = templates.find(t => t.id === id);
      if (!template) throw new Error('Template not found');
      
      const exportData = await templateService.exportTemplate(id);
      
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
      
      toastService.success(`Template "${template.name}" exported successfully`);
    } catch (err: any) {
      console.error('Failed to export template:', err);
      toastService.error(err.message || 'Failed to export template');
    }
  }, [templates]);

  // Import template
  const importTemplate = useCallback(async (templateJson: string): Promise<Template> => {
    try {
      const imported = await templateService.importTemplate(templateJson);
      setTemplates(prev => [imported, ...prev]);
      toastService.success(`Template "${imported.name}" imported successfully`);
      return imported;
    } catch (err: any) {
      console.error('Failed to import template:', err);
      toastService.error(err.message || 'Failed to import template');
      throw err;
    }
  }, []);

  // Get template preview
  const getTemplatePreview = useCallback((template: Template): string => {
    const data = template.data;
    
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
      
      case 'property-config':
        const configs = Object.keys(data).length;
        return `${configs} property configurations`;
      
      case 'workflow-automation':
        const workflows = data.workflows || data.triggers || [];
        return Array.isArray(workflows)
          ? `${workflows.length} automated workflows`
          : 'Workflow automation template';
      
      default:
        const keys = Object.keys(data).length;
        return `${keys} configuration${keys !== 1 ? 's' : ''}`;
    }
  }, []);

  // Validate template data
  const validateTemplateData = useCallback((data: Record<string, any>, categoryId: string): boolean => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return false;

    // Check if data contains allowed fields
    const dataKeys = Object.keys(data);
    const allowedFields = category.allowedFields;
    
    return dataKeys.some(key => allowedFields.includes(key));
  }, [categories]);

  // Generate template from data
  const generateTemplateFromData = useCallback((
    name: string, 
    data: Record<string, any>, 
    categoryId: string
  ): CreateTemplateData => {
    return {
      name,
      description: `Auto-generated template from ${name}`,
      categoryId,
      data,
      isPublic: false,
      tags: ['auto-generated'],
    };
  }, []);

  return {
    templates,
    categories,
    loading,
    error,
    selectedTemplate,
    
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    applyTemplate,
    
    selectTemplate,
    
    searchTemplates,
    filterByCategory,
    getTemplatesByCategory,
    getPopularTemplates,
    
    exportTemplate,
    importTemplate,
    
    getTemplatePreview,
    validateTemplateData,
    generateTemplateFromData,
  };
};