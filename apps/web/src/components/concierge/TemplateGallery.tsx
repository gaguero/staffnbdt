import React, { useState } from 'react';
import { TemplateData } from './TemplateMarketplaceHub';
import TemplateCard from './TemplateCard';

interface TemplateGalleryProps {
  templates: TemplateData[];
  onCloneTemplate: (template: TemplateData) => void;
  onPreviewTemplate?: (template: TemplateData) => void;
  viewMode?: 'grid' | 'list';
  searchTerm?: string;
}

const TemplateGallery: React.FC<TemplateGalleryProps> = ({ 
  templates, 
  onCloneTemplate, 
  onPreviewTemplate, 
  viewMode = 'grid',
  searchTerm = '' 
}) => {
  // Templates are already filtered and sorted by parent component
  const filteredTemplates = templates;

  return (
    <div className="space-y-6">

      {/* Templates Display */}
      {filteredTemplates.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onClone={() => onCloneTemplate(template)}
                onPreview={onPreviewTemplate ? () => onPreviewTemplate(template) : undefined}
                searchTerm={searchTerm}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTemplates.map((template) => (
              <TemplateListItem
                key={template.id}
                template={template}
                onClone={() => onCloneTemplate(template)}
                onPreview={onPreviewTemplate ? () => onPreviewTemplate(template) : undefined}
                searchTerm={searchTerm}
              />
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Templates Found
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm 
              ? 'Try adjusting your search terms or filters.'
              : 'No templates match your current filters.'
            }
          </p>
        </div>
      )}

    </div>
  );
};

// List view component for templates
interface TemplateListItemProps {
  template: TemplateData;
  onClone: () => void;
  onPreview?: () => void;
  searchTerm?: string;
}

const TemplateListItem: React.FC<TemplateListItemProps> = ({ template, onClone, onPreview, searchTerm }) => {
  const highlightText = (text: string, search: string) => {
    if (!search) return text;
    const regex = new RegExp(`(${search})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  };

  return (
    <div className="card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-start gap-4">
            {/* Template Icon */}
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-2xl flex-shrink-0">
              {template.category === 'Transportation' && '🚗'}
              {template.category === 'Dining' && '🍽️'}
              {template.category === 'Wellness' && '🧘'}
              {template.category === 'Activities' && '🎯'}
              {template.category === 'Services' && '🛎️'}
              {template.category === 'Events' && '🎉'}
              {!['Transportation', 'Dining', 'Wellness', 'Activities', 'Services', 'Events'].includes(template.category) && '📋'}
            </div>
            
            {/* Template Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 
                    className="font-semibold text-lg text-charcoal"
                    dangerouslySetInnerHTML={{ __html: highlightText(template.name, searchTerm || '') }}
                  />
                  <div className="flex items-center gap-3 mt-1">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                      {template.category}
                    </span>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <span>⭐</span>
                      <span>{template.rating}</span>
                      <span className="text-gray-400 mx-2">•</span>
                      <span>📊 {template.usageCount} uses</span>
                    </div>
                    {template.isOfficial && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        ✓ Official
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <p 
                className="text-gray-600 text-sm mb-3 line-clamp-2"
                dangerouslySetInnerHTML={{ __html: highlightText(template.description, searchTerm || '') }}
              />
              
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                {template.tags.slice(0, 4).map(tag => (
                  <span 
                    key={tag} 
                    className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                    dangerouslySetInnerHTML={{ __html: highlightText(`#${tag}`, searchTerm || '') }}
                  />
                ))}
                {template.tags.length > 4 && (
                  <span className="text-xs text-gray-500">
                    +{template.tags.length - 4} more
                  </span>
                )}
              </div>
              
              {/* Field Summary */}
              <div className="text-xs text-gray-500">
                {template.fieldsSchema.fields.length} field{template.fieldsSchema.fields.length !== 1 ? 's' : ''}: 
                {template.fieldsSchema.fields.slice(0, 3).map((field: any) => field.label).join(', ')}
                {template.fieldsSchema.fields.length > 3 && `, +${template.fieldsSchema.fields.length - 3} more`}
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2 ml-4">
          {onPreview && (
            <button
              onClick={onPreview}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              title="Preview template"
            >
              👁️ Preview
            </button>
          )}
          <button
            onClick={onClone}
            className="px-4 py-2 bg-warm-gold text-white rounded hover:bg-opacity-90 transition-colors text-sm font-medium"
          >
            🧬 Clone Template
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateGallery;