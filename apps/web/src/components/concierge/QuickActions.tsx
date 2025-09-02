import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { conciergeService } from '../../services/conciergeService';
import { conciergeQueryKeys, CreateConciergeObjectInput } from '../../types/concierge';
import LoadingSpinner from '../LoadingSpinner';
import PermissionGate from '../PermissionGate';
import { toast } from 'react-hot-toast';

interface QuickActionTemplate {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  type: string;
  defaultAttributes: Record<string, any>;
  estimatedTime?: string;
  priority: 'low' | 'medium' | 'high';
}

interface QuickActionsProps {
  reservationId?: string;
  guestId?: string;
  onTaskCreated?: () => void;
  compact?: boolean;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  reservationId,
  guestId,
  onTaskCreated,
  compact = false
}) => {
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<QuickActionTemplate | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueAt: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    assignedTo: '',
    specialInstructions: ''
  });

  // Quick action templates - in real app, these would come from API
  const quickActionTemplates: QuickActionTemplate[] = [
    {
      id: 'welcome-amenities',
      name: 'Welcome Amenities',
      icon: '🍾',
      category: 'Guest Experience',
      description: 'Prepare and deliver welcome amenities to guest room',
      type: 'welcome_amenities',
      defaultAttributes: {
        items: ['champagne', 'flowers', 'welcome_note'],
        location: 'guest_room'
      },
      estimatedTime: '15 min',
      priority: 'medium'
    },
    {
      id: 'restaurant-reservation',
      name: 'Restaurant Reservation',
      icon: '🍽️',
      category: 'Dining',
      description: 'Book restaurant table for guest',
      type: 'restaurant_reservation',
      defaultAttributes: {
        venue: 'main_restaurant',
        party_size: 2
      },
      estimatedTime: '5 min',
      priority: 'medium'
    },
    {
      id: 'spa-booking',
      name: 'Spa Appointment',
      icon: '🧘',
      category: 'Wellness',
      description: 'Schedule spa treatment for guest',
      type: 'spa_booking',
      defaultAttributes: {
        service_type: 'massage',
        duration: 60
      },
      estimatedTime: '10 min',
      priority: 'low'
    },
    {
      id: 'transportation',
      name: 'Transportation',
      icon: '🚗',
      category: 'Transport',
      description: 'Arrange pickup or transfer service',
      type: 'transportation',
      defaultAttributes: {
        service_type: 'airport_transfer',
        pickup_time: ''
      },
      estimatedTime: '10 min',
      priority: 'high'
    },
    {
      id: 'special-request',
      name: 'Special Request',
      icon: '⭐',
      category: 'Custom',
      description: 'Handle custom guest request',
      type: 'special_request',
      defaultAttributes: {},
      estimatedTime: '20 min',
      priority: 'high'
    },
    {
      id: 'room-service',
      name: 'Room Service',
      icon: '🍴',
      category: 'Dining',
      description: 'Process room service order',
      type: 'room_service',
      defaultAttributes: {
        order_type: 'meal',
        delivery_time: ''
      },
      estimatedTime: '30 min',
      priority: 'medium'
    },
    {
      id: 'maintenance',
      name: 'Maintenance Request',
      icon: '🔧',
      category: 'Operations',
      description: 'Submit maintenance work order',
      type: 'maintenance',
      defaultAttributes: {
        urgency: 'normal',
        category: 'general'
      },
      estimatedTime: '45 min',
      priority: 'high'
    },
    {
      id: 'housekeeping',
      name: 'Housekeeping',
      icon: '🧹',
      category: 'Operations',
      description: 'Schedule additional housekeeping service',
      type: 'housekeeping',
      defaultAttributes: {
        service_type: 'turnover',
        priority: 'normal'
      },
      estimatedTime: '60 min',
      priority: 'medium'
    }
  ];

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (data: CreateConciergeObjectInput) => conciergeService.createObject(data),
    onSuccess: () => {
      toast.success('Task created successfully! 🎉');
      setShowModal(false);
      setSelectedTemplate(null);
      setFormData({
        title: '',
        description: '',
        dueAt: '',
        priority: 'medium',
        assignedTo: '',
        specialInstructions: ''
      });
      onTaskCreated?.();
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: conciergeQueryKeys.objects.lists() });
      queryClient.invalidateQueries({ queryKey: conciergeQueryKeys.todayBoard() });
      if (reservationId) {
        queryClient.invalidateQueries({ queryKey: conciergeQueryKeys.reservationChecklist(reservationId) });
      }
      if (guestId) {
        queryClient.invalidateQueries({ queryKey: conciergeQueryKeys.guestTimeline(guestId) });
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create task');
    }
  });

  const handleQuickAction = (template: QuickActionTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      title: template.name,
      description: template.description,
      dueAt: '',
      priority: template.priority,
      assignedTo: '',
      specialInstructions: ''
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate || !formData.title) return;

    const taskData: CreateConciergeObjectInput = {
      type: selectedTemplate.type,
      reservationId,
      guestId,
      dueAt: formData.dueAt ? new Date(formData.dueAt) : undefined,
      assignments: formData.assignedTo ? { assignedTo: formData.assignedTo } : undefined,
      attributes: {
        ...selectedTemplate.defaultAttributes,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        specialInstructions: formData.specialInstructions,
        estimatedTime: selectedTemplate.estimatedTime
      }
    };

    createTaskMutation.mutate(taskData);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const groupedTemplates = quickActionTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, QuickActionTemplate[]>);

  if (compact) {
    return (
      <PermissionGate resource="concierge" action="create" scope="property" hideOnDenied>
        <div className="flex gap-2 flex-wrap">
          {quickActionTemplates.slice(0, 4).map((template) => (
            <button
              key={template.id}
              onClick={() => handleQuickAction(template)}
              className="btn btn-sm btn-outline flex items-center gap-1 hover:scale-105 transition-transform duration-200"
            >
              <span>{template.icon}</span>
              <span className="hidden sm:inline">{template.name}</span>
            </button>
          ))}
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-sm btn-primary flex items-center gap-1"
          >
            <span>➕</span>
            <span className="hidden sm:inline">More</span>
          </button>
        </div>
      </PermissionGate>
    );
  }

  return (
    <PermissionGate resource="concierge" action="create" scope="property" hideOnDenied>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              ⚡ Quick Actions
            </h3>
            <p className="text-sm text-gray-600">Create common tasks with one click</p>
          </div>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedTemplates).map(([category, templates]) => (
            <div key={category}>
              <h4 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">
                {category}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleQuickAction(template)}
                    className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md hover:-translate-y-1 transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-2xl group-hover:animate-bounce">{template.icon}</span>
                      <div className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(template.priority)}`}>
                        {template.priority}
                      </div>
                    </div>
                    <h5 className="font-medium text-gray-900 mb-1 group-hover:text-blue-600">
                      {template.name}
                    </h5>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {template.description}
                    </p>
                    {template.estimatedTime && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <span>⏱️</span>
                        <span>~{template.estimatedTime}</span>
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Create Task Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    {selectedTemplate?.icon} {selectedTemplate ? `Create ${selectedTemplate.name}` : 'Create Custom Task'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedTemplate(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {!selectedTemplate && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Template</label>
                      <select
                        onChange={(e) => {
                          const template = quickActionTemplates.find(t => t.id === e.target.value);
                          if (template) {
                            setSelectedTemplate(template);
                            setFormData({
                              title: template.name,
                              description: template.description,
                              dueAt: '',
                              priority: template.priority,
                              assignedTo: '',
                              specialInstructions: ''
                            });
                          }
                        }}
                        className="form-input w-full"
                        required
                      >
                        <option value="">Select a template...</option>
                        {quickActionTemplates.map(template => (
                          <option key={template.id} value={template.id}>
                            {template.icon} {template.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="form-input w-full"
                      placeholder="Task title"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="form-input w-full"
                      rows={3}
                      placeholder="Detailed description..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Priority</label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
                        className="form-input w-full"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Due Date</label>
                      <input
                        type="datetime-local"
                        value={formData.dueAt}
                        onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
                        className="form-input w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Assigned To</label>
                    <input
                      type="text"
                      value={formData.assignedTo}
                      onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                      className="form-input w-full"
                      placeholder="Staff member name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Special Instructions</label>
                    <textarea
                      value={formData.specialInstructions}
                      onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                      className="form-input w-full"
                      rows={2}
                      placeholder="Any special notes or requirements..."
                    />
                  </div>

                  <div className="flex gap-4 pt-4 border-t">
                    <button
                      type="submit"
                      className="btn btn-primary flex-1"
                      disabled={createTaskMutation.isPending}
                    >
                      {createTaskMutation.isPending ? <LoadingSpinner size="sm" /> : 'Create Task'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setSelectedTemplate(null);
                      }}
                      className="btn btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGate>
  );
};

export default QuickActions;