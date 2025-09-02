import React, { useState } from 'react';
import { TemplateData } from './TemplateMarketplaceHub';

interface TemplateCardProps {
  template: TemplateData;
  onClone: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onClone }) => {
  const [showPreview, setShowPreview] = useState(false);

  const getCategoryIcon = (category: string) => {
    const icons = {
      'Transportation': '🚗',
      'Dining': '🍽️',
      'Wellness': '🧘',
      'Activities': '🎯',
      'Services': '🛎️',
      'Events': '🎉'
    } as Record<string, string>;
    return icons[category] || '📋';
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center space-x-0.5">
        {/* Full stars */}
        {Array.from({ length: fullStars }, (_, i) => (
          <span key={`full-${i}`} className="text-yellow-400 text-sm">★</span>
        ))}
        {/* Half star */}
        {hasHalfStar && (
          <span className="text-yellow-400 text-sm">☆</span>
        )}
        {/* Empty stars */}
        {Array.from({ length: emptyStars }, (_, i) => (
          <span key={`empty-${i}`} className="text-gray-300 text-sm">★</span>
        ))}
        <span className="text-xs text-gray-500 ml-2">({rating})</span>
      </div>
    );
  };

  return (
    <div className="card p-6 hover:shadow-md transition-shadow relative">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3">
          <div className="text-3xl">{getCategoryIcon(template.category)}</div>
          <div>
            <h3 className="font-semibold text-charcoal text-lg leading-tight">{template.name}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-warm-gold bg-warm-gold bg-opacity-10 px-2 py-1 rounded-full">
                {template.category}
              </span>
              {template.isOfficial && (
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  ✓ Official
                </span>
              )}
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title={showPreview ? 'Hide preview' : 'Show preview'}
        >
          {showPreview ? '👁️' : '👁️‍🗨️'}
        </button>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{template.description}</p>

      {/* Field Preview (when expanded) */}
      {showPreview && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Fields Preview:</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {template.fieldsSchema.fields.slice(0, 6).map((field: any, index: number) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{field.label}</span>
                  {field.required && (
                    <span className="text-red-500">*</span>
                  )}
                </div>
                <span className="text-gray-500 capitalize px-2 py-0.5 bg-white rounded">
                  {field.type}
                </span>
              </div>
            ))}
            {template.fieldsSchema.fields.length > 6 && (
              <div className="text-xs text-gray-500 text-center py-1 border-t">
                +{template.fieldsSchema.fields.length - 6} more fields...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tags */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-1">
          {template.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded"
            >
              {tag}
            </span>
          ))}
          {template.tags.length > 3 && (
            <span className="text-xs text-gray-500">
              +{template.tags.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between mb-4 text-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1 text-gray-600">
            <span className="text-sm">📊</span>
            <span>{template.usageCount} uses</span>
          </div>
          <div className="flex items-center space-x-1">
            {renderStars(template.rating)}
          </div>
        </div>
        
        <div className="text-xs text-gray-500">
          {template.fieldsSchema.fields.length} field{template.fieldsSchema.fields.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-2 pt-4 border-t border-gray-200">
        <button
          onClick={onClone}
          className="btn btn-primary flex-1"
        >
          Clone Template
        </button>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="btn btn-secondary px-4"
        >
          {showPreview ? 'Hide' : 'Preview'}
        </button>
      </div>

      {/* Creator Info */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <div>
            {template.isOfficial ? (
              <span>Official Template</span>
            ) : (
              <span>
                {template.createdBy ? `By ${template.createdBy}` : 'Community Template'}
              </span>
            )}
          </div>
          {template.organization && (
            <span className="truncate ml-2" title={template.organization}>
              {template.organization}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateCard;