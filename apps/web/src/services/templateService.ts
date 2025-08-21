import { 
  Template, 
  TemplateCategory, 
  CreateTemplateData, 
  UpdateTemplateData, 
  TemplateFilter,
  TemplatePreset,
  DEFAULT_TEMPLATES,
  TEMPLATE_CATEGORIES
} from '../types/template';

class TemplateService {
  private readonly storageKey = 'hotel-ops-templates';
  private readonly presetsKey = 'hotel-ops-template-presets';

  // Load templates from localStorage (simulating API)
  async getTemplates(filter: TemplateFilter = {}): Promise<Template[]> {
    const stored = localStorage.getItem(this.storageKey);
    let templates: Template[] = [];

    if (stored) {
      try {
        templates = JSON.parse(stored);
      } catch (error) {
        console.warn('Failed to parse stored templates:', error);
      }
    }

    // If no templates exist, initialize with defaults
    if (templates.length === 0) {
      templates = await this.initializeDefaultTemplates();
    }

    // Apply filters
    return this.applyFilters(templates, filter);
  }

  // Get template by ID
  async getTemplate(id: string): Promise<Template | null> {
    const templates = await this.getTemplates();
    return templates.find(t => t.id === id) || null;
  }

  // Create new template
  async createTemplate(data: CreateTemplateData): Promise<Template> {
    const templates = await this.getTemplates();
    
    const newTemplate: Template = {
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      description: data.description,
      category: TEMPLATE_CATEGORIES.find(c => c.id === data.categoryId) || TEMPLATE_CATEGORIES[0],
      data: data.data,
      isPublic: data.isPublic || false,
      isDefault: data.isDefault || false,
      createdBy: 'current-user', // In real app, get from auth context
      createdAt: new Date(),
      updatedAt: new Date(),
      usage: {
        count: 0,
        lastUsed: null,
        users: [],
      },
      tags: data.tags || [],
      version: '1.0.0',
    };

    templates.push(newTemplate);
    await this.saveTemplates(templates);
    
    return newTemplate;
  }

  // Update template
  async updateTemplate(id: string, data: UpdateTemplateData): Promise<Template> {
    const templates = await this.getTemplates();
    const index = templates.findIndex(t => t.id === id);
    
    if (index === -1) {
      throw new Error('Template not found');
    }

    const updated: Template = {
      ...templates[index],
      ...data,
      category: data.categoryId 
        ? TEMPLATE_CATEGORIES.find(c => c.id === data.categoryId) || templates[index].category
        : templates[index].category,
      updatedAt: new Date(),
    };

    templates[index] = updated;
    await this.saveTemplates(templates);
    
    return updated;
  }

  // Delete template
  async deleteTemplate(id: string): Promise<void> {
    const templates = await this.getTemplates();
    const filtered = templates.filter(t => t.id !== id);
    await this.saveTemplates(filtered);
  }

  // Apply template to create new entity
  async applyTemplate(templateId: string, overrides: Record<string, any> = {}): Promise<Record<string, any>> {
    const template = await this.getTemplate(templateId);
    
    if (!template) {
      throw new Error('Template not found');
    }

    // Track usage
    await this.recordTemplateUsage(templateId);

    // Merge template data with overrides
    const appliedData = {
      ...template.data,
      ...overrides,
    };

    return appliedData;
  }

  // Record template usage
  async recordTemplateUsage(templateId: string): Promise<void> {
    const templates = await this.getTemplates();
    const template = templates.find(t => t.id === templateId);
    
    if (template) {
      template.usage.count += 1;
      template.usage.lastUsed = new Date();
      
      const currentUser = 'current-user'; // In real app, get from auth context
      if (!template.usage.users.includes(currentUser)) {
        template.usage.users.push(currentUser);
      }
      
      await this.saveTemplates(templates);
    }
  }

  // Get template categories
  getCategories(): TemplateCategory[] {
    return TEMPLATE_CATEGORIES;
  }

  // Get popular templates
  async getPopularTemplates(limit: number = 5): Promise<Template[]> {
    const templates = await this.getTemplates();
    return templates
      .filter(t => t.isPublic)
      .sort((a, b) => b.usage.count - a.usage.count)
      .slice(0, limit);
  }

  // Get templates by category
  async getTemplatesByCategory(categoryId: string): Promise<Template[]> {
    return this.getTemplates({ categoryId });
  }

  // Duplicate template
  async duplicateTemplate(templateId: string, newName?: string): Promise<Template> {
    const template = await this.getTemplate(templateId);
    
    if (!template) {
      throw new Error('Template not found');
    }

    const duplicated = await this.createTemplate({
      name: newName || `${template.name} (Copy)`,
      description: template.description,
      categoryId: template.category.id,
      data: JSON.parse(JSON.stringify(template.data)), // Deep clone
      isPublic: false, // Duplicates start as private
      tags: [...template.tags],
    });

    return duplicated;
  }

  // Import/Export templates
  async exportTemplate(templateId: string): Promise<string> {
    const template = await this.getTemplate(templateId);
    
    if (!template) {
      throw new Error('Template not found');
    }

    const exportData = {
      ...template,
      exportedAt: new Date().toISOString(),
      exportedBy: 'current-user',
    };

    return JSON.stringify(exportData, null, 2);
  }

  async importTemplate(templateJson: string): Promise<Template> {
    try {
      const importData = JSON.parse(templateJson);
      
      // Validate imported data
      if (!importData.name || !importData.data || !importData.category) {
        throw new Error('Invalid template format');
      }

      // Create new template from imported data
      const newTemplate = await this.createTemplate({
        name: `${importData.name} (Imported)`,
        description: importData.description || 'Imported template',
        categoryId: importData.category.id || TEMPLATE_CATEGORIES[0].id,
        data: importData.data,
        isPublic: false, // Imported templates start as private
        tags: importData.tags || [],
      });

      return newTemplate;
    } catch (error) {
      throw new Error(`Failed to import template: ${error}`);
    }
  }

  // Template presets management
  async savePreset(preset: Omit<TemplatePreset, 'id'>): Promise<TemplatePreset> {
    const presets = await this.getPresets();
    
    const newPreset: TemplatePreset = {
      ...preset,
      id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    presets.push(newPreset);
    localStorage.setItem(this.presetsKey, JSON.stringify(presets));
    
    return newPreset;
  }

  async getPresets(): Promise<TemplatePreset[]> {
    const stored = localStorage.getItem(this.presetsKey);
    return stored ? JSON.parse(stored) : [];
  }

  async deletePreset(presetId: string): Promise<void> {
    const presets = await this.getPresets();
    const filtered = presets.filter(p => p.id !== presetId);
    localStorage.setItem(this.presetsKey, JSON.stringify(filtered));
  }

  // Private helper methods
  private async initializeDefaultTemplates(): Promise<Template[]> {
    const templates: Template[] = DEFAULT_TEMPLATES.map((template, index) => ({
      id: `default_template_${index}`,
      name: template.name!,
      description: template.description!,
      category: template.category!,
      data: template.data!,
      isPublic: true,
      isDefault: true,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      usage: {
        count: 0,
        lastUsed: null,
        users: [],
      },
      tags: template.tags || [],
      version: '1.0.0',
    }));

    await this.saveTemplates(templates);
    return templates;
  }

  private async saveTemplates(templates: Template[]): Promise<void> {
    localStorage.setItem(this.storageKey, JSON.stringify(templates));
  }

  private applyFilters(templates: Template[], filter: TemplateFilter): Template[] {
    let filtered = [...templates];

    if (filter.categoryId) {
      filtered = filtered.filter(t => t.category.id === filter.categoryId);
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    if (filter.isPublic !== undefined) {
      filtered = filtered.filter(t => t.isPublic === filter.isPublic);
    }

    if (filter.createdBy) {
      filtered = filtered.filter(t => t.createdBy === filter.createdBy);
    }

    if (filter.tags && filter.tags.length > 0) {
      filtered = filtered.filter(t => 
        filter.tags!.some(tag => t.tags.includes(tag))
      );
    }

    return filtered;
  }
}

export const templateService = new TemplateService();