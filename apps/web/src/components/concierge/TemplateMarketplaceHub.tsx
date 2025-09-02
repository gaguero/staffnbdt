import React, { useState, useEffect } from 'react';
import { ObjectType } from '../../types/concierge';
import conciergeService from '../../services/conciergeService';
import toastService from '../../services/toastService';
import LoadingSpinner from '../LoadingSpinner';
import TemplateGallery from './TemplateGallery';
import CreateFromTemplateModal from './CreateFromTemplateModal';

interface TemplateMarketplaceHubProps {
  onTemplateCreated?: () => void;
}

export interface TemplateData {
  id: string;
  name: string;
  category: string;
  description: string;
  fieldsSchema: any;
  usageCount: number;
  rating: number;
  tags: string[];
  isOfficial: boolean;
  createdBy?: string;
  organization?: string;
  property?: string;
}

const SAMPLE_TEMPLATES: TemplateData[] = [
  {
    id: 'template-airport-transfer',
    name: 'Airport Transfer',
    category: 'Transportation',
    description: 'Complete airport transfer request with pickup time, flight details, and special requirements.',
    fieldsSchema: {
      fields: [
        { key: 'pickup_time', type: 'date', label: 'Pickup Time', required: true },
        { key: 'flight_number', type: 'string', label: 'Flight Number', required: true },
        { key: 'passenger_count', type: 'number', label: 'Number of Passengers', required: true },
        { key: 'special_requests', type: 'string', label: 'Special Requests', required: false },
        { key: 'contact_number', type: 'string', label: 'Contact Number', required: true }
      ]
    },
    usageCount: 245,
    rating: 4.8,
    tags: ['transportation', 'airport', 'transfer'],
    isOfficial: true
  },
  {
    id: 'template-spa-booking',
    name: 'Spa Booking',
    category: 'Wellness',
    description: 'Spa appointment booking with treatment selection, preferred time, and special preferences.',
    fieldsSchema: {
      fields: [
        { key: 'treatment_type', type: 'string', label: 'Treatment Type', required: true, options: ['Massage', 'Facial', 'Body Treatment', 'Couples Massage'] },
        { key: 'preferred_time', type: 'date', label: 'Preferred Time', required: true },
        { key: 'duration', type: 'number', label: 'Duration (minutes)', required: true },
        { key: 'therapist_gender', type: 'string', label: 'Therapist Preference', required: false, options: ['Male', 'Female', 'No Preference'] },
        { key: 'allergies', type: 'string', label: 'Allergies/Medical Conditions', required: false }
      ]
    },
    usageCount: 189,
    rating: 4.6,
    tags: ['spa', 'wellness', 'booking'],
    isOfficial: true
  },
  {
    id: 'template-restaurant-reservation',
    name: 'Restaurant Reservation',
    category: 'Dining',
    description: 'Restaurant booking with party size, dietary restrictions, and seating preferences.',
    fieldsSchema: {
      fields: [
        { key: 'restaurant_name', type: 'string', label: 'Restaurant', required: true },
        { key: 'party_size', type: 'number', label: 'Party Size', required: true },
        { key: 'date_time', type: 'date', label: 'Date & Time', required: true },
        { key: 'dietary_restrictions', type: 'string', label: 'Dietary Restrictions', required: false },
        { key: 'seating_preference', type: 'string', label: 'Seating Preference', required: false, options: ['Indoor', 'Outdoor', 'Window', 'Private'] },
        { key: 'special_occasion', type: 'string', label: 'Special Occasion', required: false }
      ]
    },
    usageCount: 156,
    rating: 4.7,
    tags: ['dining', 'restaurant', 'reservation'],
    isOfficial: true
  },
  {
    id: 'template-excursion-booking',
    name: 'Excursion Booking',
    category: 'Activities',
    description: 'Tour and excursion booking with activity details, group size, and equipment needs.',
    fieldsSchema: {
      fields: [
        { key: 'activity_name', type: 'string', label: 'Activity/Tour Name', required: true },
        { key: 'date', type: 'date', label: 'Date', required: true },
        { key: 'group_size', type: 'number', label: 'Group Size', required: true },
        { key: 'fitness_level', type: 'string', label: 'Fitness Level Required', required: false, options: ['Easy', 'Moderate', 'Challenging'] },
        { key: 'equipment_needed', type: 'boolean', label: 'Equipment Rental Needed', required: false },
        { key: 'pickup_location', type: 'string', label: 'Pickup Location', required: false }
      ]
    },
    usageCount: 92,
    rating: 4.5,
    tags: ['activities', 'tours', 'excursions'],
    isOfficial: true
  },
  {
    id: 'template-room-service',
    name: 'Room Service Request',
    category: 'Dining',
    description: 'In-room dining request with menu selection, delivery time, and special instructions.',
    fieldsSchema: {
      fields: [
        { key: 'delivery_time', type: 'date', label: 'Delivery Time', required: true },
        { key: 'menu_items', type: 'string', label: 'Menu Items', required: true },
        { key: 'special_instructions', type: 'string', label: 'Special Instructions', required: false },
        { key: 'dietary_notes', type: 'string', label: 'Dietary Notes', required: false },
        { key: 'utensils_needed', type: 'boolean', label: 'Extra Utensils Needed', required: false }
      ]
    },
    usageCount: 134,
    rating: 4.4,
    tags: ['dining', 'room-service', 'delivery'],
    isOfficial: true
  },
  {
    id: 'template-maintenance-request',
    name: 'Maintenance Request',
    category: 'Services',
    description: 'Guest maintenance request for room issues, equipment problems, or facility concerns.',
    fieldsSchema: {
      fields: [
        { key: 'issue_type', type: 'string', label: 'Issue Type', required: true, options: ['Plumbing', 'Electrical', 'Air Conditioning', 'Furniture', 'Other'] },
        { key: 'urgency', type: 'string', label: 'Urgency Level', required: true, options: ['Low', 'Medium', 'High', 'Emergency'] },
        { key: 'description', type: 'string', label: 'Description', required: true },
        { key: 'preferred_time', type: 'date', label: 'Preferred Service Time', required: false },
        { key: 'guest_present', type: 'boolean', label: 'Guest Present During Service', required: false }
      ]
    },
    usageCount: 67,
    rating: 4.3,
    tags: ['maintenance', 'services', 'repairs'],
    isOfficial: true
  }
];

const TemplateMarketplaceHub: React.FC<TemplateMarketplaceHubProps> = ({ onTemplateCreated }) => {
  const [activeTab, setActiveTab] = useState<'myTemplates' | 'gallery' | 'categories'>('gallery');
  const [myTemplates, setMyTemplates] = useState<ObjectType[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateData | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  const handlePreviewTemplate = (template: TemplateData) => {
    setSelectedTemplate(template);
    setShowPreviewModal(true);
  };
  
  // Enhanced search and filtering state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'usage' | 'recent'>('rating');
  const [minRating, setMinRating] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Load user's existing object types
  const loadMyTemplates = async () => {
    try {
      setLoading(true);
      const response = await conciergeService.getObjectTypes();
      setMyTemplates(response.data || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'myTemplates') {
      loadMyTemplates();
    }
  }, [activeTab]);

  const handleCloneTemplate = (template: TemplateData) => {
    setSelectedTemplate(template);
    setShowCreateModal(true);
  };

  const handleTemplateCreated = () => {
    setShowCreateModal(false);
    setSelectedTemplate(null);
    if (activeTab === 'myTemplates') {
      loadMyTemplates();
    }
    onTemplateCreated?.();
    toastService.success('Template cloned successfully!');
  };

  // Filter and search logic
  const getFilteredTemplates = () => {
    let filtered = SAMPLE_TEMPLATES;
    
    // Search by name, description, or tags
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(search) ||
        template.description.toLowerCase().includes(search) ||
        template.category.toLowerCase().includes(search) ||
        template.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => 
        template.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    
    // Filter by rating
    if (minRating > 0) {
      filtered = filtered.filter(template => template.rating >= minRating);
    }
    
    // Filter by selected tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(template => 
        selectedTags.some(tag => template.tags.includes(tag))
      );
    }
    
    // Sort results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
          return b.rating - a.rating;
        case 'usage':
          return b.usageCount - a.usageCount;
        case 'recent':
          return b.id.localeCompare(a.id); // Mock recent sort
        default:
          return 0;
      }
    });
    
    return filtered;
  };
  
  const getUniqueCategories = () => {
    return Array.from(new Set(SAMPLE_TEMPLATES.map(t => t.category)));
  };
  
  const getAllTags = () => {
    const allTags = SAMPLE_TEMPLATES.flatMap(t => t.tags);
    return Array.from(new Set(allTags)).sort();
  };
  
  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setMinRating(0);
    setSelectedTags([]);
  };
  
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };
  
  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedCategory !== 'all') count++;
    if (minRating > 0) count++;
    if (selectedTags.length > 0) count += selectedTags.length;
    return count;
  };

  const tabs = [
    { id: 'gallery' as const, name: 'Template Gallery', icon: '🏪', count: SAMPLE_TEMPLATES.length },
    { id: 'myTemplates' as const, name: 'My Templates', icon: '📋', count: myTemplates.length },
    { id: 'categories' as const, name: 'Categories', icon: '📂', count: 6 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-charcoal">Template Marketplace</h2>
          <p className="text-gray-600">
            Discover and clone pre-built object types to streamline your concierge operations
          </p>
        </div>
        
        {/* Template Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <span className="text-lg">📊</span>
            <span>{SAMPLE_TEMPLATES.length} templates</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-lg">⭐</span>
            <span>{(SAMPLE_TEMPLATES.reduce((sum, t) => sum + t.rating, 0) / SAMPLE_TEMPLATES.length).toFixed(1)} avg rating</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-lg">🔥</span>
            <span>{SAMPLE_TEMPLATES.reduce((sum, t) => sum + t.usageCount, 0).toLocaleString()} uses</span>
          </div>
        </div>
      </div>
      
      {/* Enhanced Search and Filters for Gallery Tab */}
      {activeTab === 'gallery' && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          {/* Search Bar */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search templates by name, category, or tags..."
                className="w-full form-input pl-10 pr-4"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex bg-white rounded-lg border p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded text-sm ${viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
              >
                ⊞ Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded text-sm ${viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
              >
                ☰ List
              </button>
            </div>
          </div>
          
          {/* Filters Row */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Category:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="form-input text-sm"
              >
                <option value="all">All Categories</option>
                {getUniqueCategories().map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            {/* Sort By */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="form-input text-sm"
              >
                <option value="rating">⭐ Rating</option>
                <option value="usage">🔥 Most Used</option>
                <option value="name">📝 Name</option>
                <option value="recent">🆕 Recent</option>
              </select>
            </div>
            
            {/* Rating Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Min Rating:</label>
              <select
                value={minRating}
                onChange={(e) => setMinRating(parseFloat(e.target.value))}
                className="form-input text-sm"
              >
                <option value={0}>Any Rating</option>
                <option value={4}>4⭐+ and above</option>
                <option value={4.5}>4.5⭐+ and above</option>
              </select>
            </div>
            
            {/* Clear Filters */}
            {getActiveFiltersCount() > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
              >
                🗑️ Clear ({getActiveFiltersCount()})
              </button>
            )}
          </div>
          
          {/* Tags Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Filter by tags:</label>
            <div className="flex flex-wrap gap-2">
              {getAllTags().map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm border ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
          
          {/* Results Count */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Showing {getFilteredTemplates().length} of {SAMPLE_TEMPLATES.length} templates</span>
            {getActiveFiltersCount() > 0 && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                {getActiveFiltersCount()} filter{getActiveFiltersCount() !== 1 ? 's' : ''} applied
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${activeTab === tab.id
                  ? 'border-warm-gold text-warm-gold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'gallery' && (
          <TemplateGallery
            templates={getFilteredTemplates()}
            onCloneTemplate={handleCloneTemplate}
            onPreviewTemplate={handlePreviewTemplate}
            viewMode={viewMode}
            searchTerm={searchTerm}
          />
        )}

        {activeTab === 'myTemplates' && (
          <div>
            {loading && myTemplates.length === 0 ? (
              <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="lg" />
              </div>
            ) : myTemplates.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Templates Created Yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Start by cloning templates from the gallery or create your own object types.
                </p>
                <button
                  onClick={() => setActiveTab('gallery')}
                  className="btn btn-primary"
                >
                  Browse Template Gallery
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myTemplates.map((template) => (
                  <div key={template.id} className="card p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-charcoal text-lg">{template.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            template.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {template.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {template.fieldsSchema.fields.length} field{template.fieldsSchema.fields.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Fields:</h4>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {template.fieldsSchema.fields.slice(0, 3).map((field: any, index: number) => (
                          <div key={index} className="flex items-center justify-between text-xs bg-gray-50 rounded px-2 py-1">
                            <span className="font-medium">{field.label}</span>
                            <span className="text-gray-500 capitalize">{field.type}</span>
                          </div>
                        ))}
                        {template.fieldsSchema.fields.length > 3 && (
                          <div className="text-xs text-gray-500 text-center py-1">
                            +{template.fieldsSchema.fields.length - 3} more fields...
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <span className="text-sm text-gray-500">
                        Created by you
                      </span>
                      <span className="text-xs text-gray-400">
                        Custom Template
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'Transportation', count: 3, icon: '🚗', description: 'Airport transfers, shuttles, and transport bookings' },
              { name: 'Dining', count: 8, description: 'Restaurant reservations, room service, and catering', icon: '🍽️' },
              { name: 'Wellness', count: 5, description: 'Spa bookings, fitness classes, and wellness services', icon: '🧘' },
              { name: 'Activities', count: 12, description: 'Tours, excursions, and recreational activities', icon: '🎯' },
              { name: 'Services', count: 6, description: 'Maintenance, housekeeping, and guest services', icon: '🛎️' },
              { name: 'Events', count: 4, description: 'Special occasions, celebrations, and group events', icon: '🎉' }
            ].map((category) => (
              <div key={category.name} className="card p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="text-center">
                  <div className="text-4xl mb-3">{category.icon}</div>
                  <h3 className="font-semibold text-charcoal text-lg mb-2">{category.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{category.description}</p>
                  <div className="inline-flex items-center space-x-2 text-sm text-warm-gold">
                    <span>{category.count} templates</span>
                    <span>→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create From Template Modal */}
      {showCreateModal && selectedTemplate && (
        <CreateFromTemplateModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedTemplate(null);
          }}
          template={selectedTemplate}
          onSuccess={handleTemplateCreated}
        />
      )}
      
      {/* Template Preview Modal */}
      {showPreviewModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-charcoal">{selectedTemplate.name}</h3>
                  <p className="text-gray-600 mt-1">{selectedTemplate.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {selectedTemplate.category}
                    </span>
                    <span className="flex items-center gap-1">
                      ⭐ {selectedTemplate.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      📊 {selectedTemplate.usageCount} uses
                    </span>
                    {selectedTemplate.isOfficial && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                        ✓ Official
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Fields Preview */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Fields ({selectedTemplate.fieldsSchema.fields.length})</h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {selectedTemplate.fieldsSchema.fields.map((field: any, index: number) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{field.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded capitalize">
                              {field.type}
                            </span>
                            {field.required && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                Required
                              </span>
                            )}
                          </div>
                        </div>
                        {field.options && (
                          <div className="text-xs text-gray-600">
                            Options: {field.options.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Template Details */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Template Details</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Tags</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedTemplate.tags.map(tag => (
                          <span key={tag} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Usage Statistics</label>
                      <div className="mt-1 space-y-1 text-sm text-gray-600">
                        <div>• {selectedTemplate.usageCount} total clones</div>
                        <div>• {selectedTemplate.rating}/5.0 average rating</div>
                        <div>• {selectedTemplate.fieldsSchema.fields.length} field definitions</div>
                      </div>
                    </div>
                    
                    {selectedTemplate.isOfficial && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-green-600">✓</span>
                          <span className="text-sm font-medium text-green-800">Official Template</span>
                        </div>
                        <p className="text-xs text-green-700 mt-1">
                          This template is maintained by our team and follows best practices.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="btn btn-secondary"
                >
                  Close Preview
                </button>
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    handleCloneTemplate(selectedTemplate);
                  }}
                  className="btn btn-primary"
                >
                  🧬 Clone This Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateMarketplaceHub;