import React, { useState } from 'react';
import { TemplateData } from './TemplateMarketplaceHub';
import TemplateCard from './TemplateCard';

interface TemplateGalleryProps {
  templates: TemplateData[];
  onCloneTemplate: (template: TemplateData) => void;
}

const TemplateGallery: React.FC<TemplateGalleryProps> = ({ templates, onCloneTemplate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'rating'>('usage');

  // Get unique categories
  const categories = Array.from(new Set(templates.map(t => t.category))).sort();

  // Filter and sort templates
  const filteredTemplates = templates
    .filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'usage':
          return b.usageCount - a.usageCount;
        case 'rating':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search templates by name, description, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input w-full"
            />
          </div>
          
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="form-input lg:w-48"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'usage' | 'rating')}
            className="form-input lg:w-48"
          >
            <option value="usage">Most Used</option>
            <option value="rating">Highest Rated</option>
            <option value="name">Alphabetical</option>
          </select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <p className="text-gray-600">
          {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
          {searchTerm && ` for "${searchTerm}"`}
          {selectedCategory !== 'all' && ` in ${selectedCategory}`}
        </p>
        
        {(searchTerm || selectedCategory !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
            }}
            className="text-sm text-warm-gold hover:text-opacity-80"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onClone={() => onCloneTemplate(template)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Templates Found
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedCategory !== 'all'
              ? 'Try adjusting your search terms or filters.'
              : 'No templates are available at the moment.'
            }
          </p>
          {(searchTerm || selectedCategory !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="btn btn-secondary"
            >
              Show All Templates
            </button>
          )}
        </div>
      )}

      {/* Featured Categories Section */}
      {!searchTerm && selectedCategory === 'all' && (
        <div className="mt-12">
          <h3 className="text-xl font-semibold text-charcoal mb-6">Browse by Category</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map(category => {
              const categoryTemplates = templates.filter(t => t.category === category);
              const categoryIcons = {
                'Transportation': '🚗',
                'Dining': '🍽️',
                'Wellness': '🧘',
                'Activities': '🎯',
                'Services': '🛎️',
                'Events': '🎉'
              } as Record<string, string>;
              
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className="card p-4 text-center hover:shadow-md transition-shadow group"
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    {categoryIcons[category] || '📋'}
                  </div>
                  <h4 className="font-medium text-charcoal text-sm mb-1">{category}</h4>
                  <p className="text-xs text-gray-500">
                    {categoryTemplates.length} template{categoryTemplates.length !== 1 ? 's' : ''}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateGallery;