import React, { useState, useMemo, useCallback } from 'react';
import {
  Sparkles as SparklesIcon,
  Search as MagnifyingGlassIcon,
  Tag as TagIcon,
  Users as UserGroupIcon,
  Clock as ClockIcon,
  CheckCircle as CheckCircleIcon,
  Star as StarIcon,
  Filter as FunnelIcon,
  Plus as PlusIcon,
  Eye as EyeIcon
} from 'lucide-react';

import { 
  PermissionTemplate, 
  RoleLevel, 
  ROLE_TEMPLATES 
} from '../../types/permissionEditor';

interface RoleTemplatesProps {
  onSelectTemplate: (template: PermissionTemplate) => void;
  onStartFromScratch: () => void;
  context?: 'role-management' | 'user-assignment' | 'audit';
  showSystemTemplates?: boolean;
  showCustomTemplates?: boolean;
  maxHeight?: number;
  className?: string;
}

// Extended template data with more examples
const EXTENDED_TEMPLATES: PermissionTemplate[] = [
  ...ROLE_TEMPLATES,
  {
    id: 'general-manager',
    name: 'General Manager',
    description: 'Comprehensive management access across all hotel operations',
    category: 'management',
    permissions: [
      'user.manage.property',
      'role.manage.property',
      'analytics.read.property',
      'document.manage.property',
      'schedule.manage.property',
      'payroll.read.property'
    ],
    roleLevel: RoleLevel.PROPERTY,
    tags: ['management', 'executive', 'full-access'],
    popularity: 90,
    isSystemTemplate: true
  },
  {
    id: 'night-auditor',
    name: 'Night Auditor',
    description: 'Specialized role for night shift operations and security',
    category: 'hospitality',
    permissions: [
      'guest.read.property',
      'security.monitor.property',
      'analytics.read.department',
      'document.read.department'
    ],
    roleLevel: RoleLevel.DEPARTMENT,
    tags: ['night-shift', 'security', 'audit'],
    popularity: 70,
    isSystemTemplate: true
  },
  {
    id: 'maintenance-lead',
    name: 'Maintenance Lead',
    description: 'Lead maintenance technician with team management capabilities',
    category: 'maintenance',
    permissions: [
      'maintenance.manage.department',
      'user.read.department',
      'schedule.manage.department',
      'document.create.department'
    ],
    roleLevel: RoleLevel.DEPARTMENT,
    tags: ['maintenance', 'supervisor', 'technical'],
    popularity: 65,
    isSystemTemplate: true
  },
  {
    id: 'guest-services-rep',
    name: 'Guest Services Representative',
    description: 'Customer-facing role with guest interaction capabilities',
    category: 'hospitality',
    permissions: [
      'guest.read.department',
      'booking.read.department',
      'document.read.department'
    ],
    roleLevel: RoleLevel.DEPARTMENT,
    tags: ['guest-services', 'customer-facing', 'support'],
    popularity: 80,
    isSystemTemplate: true
  },
  {
    id: 'hr-specialist',
    name: 'HR Specialist',
    description: 'Human resources specialist with employee management access',
    category: 'administration',
    permissions: [
      'user.read.property',
      'document.manage.department',
      'training.manage.department',
      'benefit.manage.department'
    ],
    roleLevel: RoleLevel.PROPERTY,
    tags: ['hr', 'administration', 'employee-focused'],
    popularity: 75,
    isSystemTemplate: true
  }
];

const CATEGORY_INFO = {
  hospitality: { name: 'Hospitality', color: 'blue', icon: '🏨' },
  management: { name: 'Management', color: 'purple', icon: '👔' },
  administration: { name: 'Administration', color: 'indigo', icon: '📋' },
  support: { name: 'Support', color: 'green', icon: '🛠️' },
  maintenance: { name: 'Maintenance', color: 'orange', icon: '🔧' },
  finance: { name: 'Finance', color: 'yellow', icon: '💰' },
  custom: { name: 'Custom', color: 'gray', icon: '⚙️' }
};

const RoleTemplates: React.FC<RoleTemplatesProps> = ({
  onSelectTemplate,
  onStartFromScratch,
  context = 'role-management',
  showSystemTemplates = true,
  showCustomTemplates = false,
  maxHeight = 600,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'popularity' | 'name' | 'category'>('popularity');
  const [showDetails, setShowDetails] = useState<string | null>(null);

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let templates = EXTENDED_TEMPLATES.filter(template => {
      // Show system templates if enabled
      if (!showSystemTemplates && template.isSystemTemplate) return false;
      
      // Show custom templates if enabled  
      if (!showCustomTemplates && !template.isSystemTemplate) return false;

      // Apply search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matches = template.name.toLowerCase().includes(query) ||
                       template.description.toLowerCase().includes(query) ||
                       template.category.toLowerCase().includes(query) ||
                       template.tags.some(tag => tag.toLowerCase().includes(query));
        if (!matches) return false;
      }

      // Apply category filter
      if (selectedCategory && template.category !== selectedCategory) {
        return false;
      }

      return true;
    });

    // Sort templates
    switch (sortBy) {
      case 'popularity':
        templates.sort((a, b) => b.popularity - a.popularity);
        break;
      case 'name':
        templates.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'category':
        templates.sort((a, b) => a.category.localeCompare(b.category));
        break;
    }

    return templates;
  }, [searchQuery, selectedCategory, sortBy, showSystemTemplates, showCustomTemplates]);

  // Group templates by category
  const groupedTemplates = useMemo(() => {
    const groups: Record<string, PermissionTemplate[]> = {};
    
    filteredTemplates.forEach(template => {
      if (!groups[template.category]) {
        groups[template.category] = [];
      }
      groups[template.category].push(template);
    });

    return groups;
  }, [filteredTemplates]);

  // Get unique categories from filtered templates
  const availableCategories = useMemo(() => {
    const categories = [...new Set(filteredTemplates.map(t => t.category))];
    return categories.map(cat => ({
      id: cat,
      ...CATEGORY_INFO[cat as keyof typeof CATEGORY_INFO]
    }));
  }, [filteredTemplates]);

  // Handle template selection
  const handleTemplateSelect = useCallback((template: PermissionTemplate) => {
    onSelectTemplate(template);
  }, [onSelectTemplate]);

  // Render template card
  const renderTemplateCard = useCallback((template: PermissionTemplate) => {
    const categoryInfo = CATEGORY_INFO[template.category as keyof typeof CATEGORY_INFO];
    const isShowingDetails = showDetails === template.id;

    return (
      <div
        key={template.id}
        className={`group relative bg-white border border-gray-200 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-blue-300 hover:shadow-md ${
          isShowingDetails ? 'border-blue-500 shadow-md' : ''
        }`}
        onClick={() => handleTemplateSelect(template)}
      >
        {/* Template Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className={`p-2 bg-${categoryInfo?.color || 'gray'}-100 text-${categoryInfo?.color || 'gray'}-600 rounded-lg flex-shrink-0`}>
              <span className="text-lg">{categoryInfo?.icon || '⚙️'}</span>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {template.name}
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                {categoryInfo?.name || template.category}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(isShowingDetails ? null : template.id);
              }}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors duration-200"
              title="View details"
            >
              <EyeIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Template Description */}
        <p className="text-sm text-gray-700 mb-3 line-clamp-2">
          {template.description}
        </p>

        {/* Template Stats */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <UserGroupIcon className="h-3 w-3" />
              <span>{template.permissions.length} permissions</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <StarIcon className="h-3 w-3" />
              <span>{template.popularity}% popularity</span>
            </div>

            <div className="flex items-center space-x-1">
              <span className={`inline-block px-1.5 py-0.5 text-xs rounded-full bg-${categoryInfo?.color || 'gray'}-100 text-${categoryInfo?.color || 'gray'}-700`}>
                {template.roleLevel}
              </span>
            </div>
          </div>

          {template.isSystemTemplate && (
            <div className="flex items-center space-x-1 text-blue-600">
              <SparklesSolidIcon className="h-3 w-3" />
              <span className="text-xs">System</span>
            </div>
          )}
        </div>

        {/* Template Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {template.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full"
            >
              {tag}
            </span>
          ))}
          {template.tags.length > 3 && (
            <span className="text-xs text-gray-500">
              +{template.tags.length - 3} more
            </span>
          )}
        </div>

        {/* Expanded Details */}
        {isShowingDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-gray-900 mb-2">Included Permissions:</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {template.permissions.map((permission, index) => (
                    <div key={index} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded font-mono">
                      {permission}
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-xs font-semibold text-gray-900 mb-2">All Tags:</h4>
                <div className="flex flex-wrap gap-1">
                  {template.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Use Template Button */}
        <div className="mt-4">
          <div className="w-full px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors duration-200 text-center">
            Use This Template
          </div>
        </div>
      </div>
    );
  }, [handleTemplateSelect, showDetails]);

  return (
    <div className={`flex flex-col h-full bg-white ${className}`} style={{ maxHeight }}>
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Choose a Template</h2>
            <p className="text-sm text-gray-600 mt-1">
              Start with a pre-configured role template or build from scratch
            </p>
          </div>

          {/* Quick Stats */}
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{filteredTemplates.length}</div>
            <div className="text-xs text-gray-500">templates available</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Category Filter */}
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {availableCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="popularity">Most Popular</option>
                <option value="name">Name A-Z</option>
                <option value="category">Category</option>
              </select>
            </div>

            {/* Start from Scratch */}
            <button
              onClick={onStartFromScratch}
              className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Start from Scratch</span>
            </button>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredTemplates.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <SparklesIcon className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Found</h3>
            <p className="text-gray-600 text-center max-w-sm mb-4">
              No templates match your current search and filter criteria. Try adjusting your filters or search terms.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          /* Templates Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map(template => renderTemplateCard(template))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>{filteredTemplates.length} templates shown</span>
            {selectedCategory && (
              <span>• Category: {CATEGORY_INFO[selectedCategory as keyof typeof CATEGORY_INFO]?.name}</span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <SparklesIcon className="h-4 w-4" />
            <span>Templates save time</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleTemplates;