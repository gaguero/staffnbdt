import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ObjectType } from '../../types/concierge';
import conciergeService from '../../services/conciergeService';
import toastService from '../../services/toastService';
import LoadingSpinner from '../LoadingSpinner';
import { PermissionGate } from '../index';
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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'myTemplates' | 'gallery' | 'categories'>('gallery');
  const [myTemplates, setMyTemplates] = useState<ObjectType[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateData | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

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
      </div>

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
            templates={SAMPLE_TEMPLATES}
            onCloneTemplate={handleCloneTemplate}
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
    </div>
  );
};

export default TemplateMarketplaceHub;