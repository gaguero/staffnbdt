import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { conciergeService } from '../../services/conciergeService';
import { ReservationChecklist, ChecklistItem } from '../../types/concierge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { PermissionGate } from '../../components';
import toastService from '../../services/toastService';
import CreateConciergeObjectModal from '../../components/concierge/CreateConciergeObjectModal';

interface Reservation360PageProps {
  reservationId?: string; // Optional prop, falls back to URL params
}

const Reservation360Page: React.FC<Reservation360PageProps> = ({ reservationId: propReservationId }) => {
  const { reservationId: urlReservationId } = useParams<{ reservationId: string }>();
  const reservationId = propReservationId || urlReservationId;
  
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState<ReservationChecklist | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // Mock reservation data - in real app this would come from API
  const mockReservation = {
    id: reservationId || 'res-001',
    confirmationNumber: 'RES-001',
    guest: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-123-4567',
    },
    checkIn: new Date(),
    checkOut: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    roomType: 'Ocean View Suite',
    numberOfGuests: 2,
    status: 'CONFIRMED',
  };

  // Load reservation checklist
  const loadChecklist = useCallback(async () => {
    if (!reservationId) return;
    
    try {
      setLoading(true);
      const response = await conciergeService.getReservationChecklist(reservationId);
      setChecklist(response.data);
    } catch (error) {
      console.error('Failed to load reservation checklist:', error);
      // Create mock checklist for demo purposes
      setChecklist({
        reservationId,
        items: [
          {
            id: '1',
            objectId: 'obj-1',
            type: 'room_preparation',
            title: 'Room Preparation',
            status: 'completed',
            dueAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
            isRequired: true,
            completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
          },
          {
            id: '2',
            objectId: 'obj-2',
            type: 'welcome_amenities',
            title: 'Welcome Amenities Setup',
            status: 'in_progress',
            dueAt: new Date(Date.now() + 1 * 60 * 60 * 1000),
            isRequired: true,
          },
          {
            id: '3',
            objectId: 'obj-3',
            type: 'transportation',
            title: 'Airport Transportation Confirmation',
            status: 'open',
            dueAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
            isRequired: false,
          },
          {
            id: '4',
            objectId: 'obj-4',
            type: 'restaurant_reservation',
            title: 'Restaurant Reservation',
            status: 'overdue',
            dueAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
            isRequired: false,
          },
        ],
        completedCount: 1,
        totalCount: 4,
      });
    } finally {
      setLoading(false);
    }
  }, [reservationId]);

  useEffect(() => {
    loadChecklist();
  }, [loadChecklist]);

  const handleCompleteItem = async (itemId: string) => {
    if (!checklist) return;
    
    const item = checklist.items.find(i => i.id === itemId);
    if (!item) return;

    try {
      await conciergeService.completeObject(item.objectId);
      toastService.success('Task completed successfully');
      await loadChecklist();
    } catch (error: any) {
      console.error('Failed to complete task:', error);
      toastService.actions.operationFailed('complete task', error.response?.data?.message);
    }
  };

  const handleCreateFromTemplate = (template: string) => {
    setSelectedTemplate(template);
    setShowCreateModal(true);
  };

  const getStatusIcon = (status: string) => {
    const statusConfig = {
      completed: '✅',
      in_progress: '🔄',
      open: '⏳',
      overdue: '🚨',
    };
    return statusConfig[status as keyof typeof statusConfig] || '❓';
  };

  const getStatusColor = (status: string) => {
    const statusConfig = {
      completed: 'text-green-600',
      in_progress: 'text-yellow-600',
      open: 'text-blue-600',
      overdue: 'text-red-600',
    };
    return statusConfig[status as keyof typeof statusConfig] || 'text-gray-600';
  };

  const formatDueTime = (dueAt: Date) => {
    const now = new Date();
    const timeDiff = dueAt.getTime() - now.getTime();
    const hoursDiff = Math.round(timeDiff / (1000 * 3600));
    
    if (hoursDiff < 0) {
      return <span className="text-red-600">Overdue by {Math.abs(hoursDiff)}h</span>;
    } else if (hoursDiff < 24) {
      return <span className="text-orange-600">Due in {hoursDiff}h</span>;
    } else {
      return <span className="text-gray-600">{dueAt.toLocaleDateString()}</span>;
    }
  };

  const completionPercentage = checklist ? Math.round((checklist.completedCount / checklist.totalCount) * 100) : 0;

  if (!reservationId) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏨</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Reservation Selected</h3>
        <p className="text-gray-600">Please select a reservation to view its 360-degree checklist.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <PermissionGate resource="concierge" action="read" scope="property">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-charcoal mb-2">Reservation 360°</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>📅 {mockReservation.confirmationNumber}</span>
                <span>👤 {mockReservation.guest.firstName} {mockReservation.guest.lastName}</span>
                <span>🏨 {mockReservation.roomType}</span>
                <span>👥 {mockReservation.numberOfGuests} guests</span>
              </div>
            </div>
            
            <div className="mt-4 lg:mt-0 text-right">
              <div className="text-lg font-semibold text-charcoal">{completionPercentage}% Complete</div>
              <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {checklist?.completedCount} of {checklist?.totalCount} tasks
              </div>
            </div>
          </div>
        </div>

        {/* Guest & Reservation Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border rounded-lg p-6">
            <h3 className="font-semibold text-charcoal mb-4">Guest Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{mockReservation.guest.firstName} {mockReservation.guest.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{mockReservation.guest.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-medium">{mockReservation.guest.phone}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h3 className="font-semibold text-charcoal mb-4">Reservation Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Check-in:</span>
                <span className="font-medium">{mockReservation.checkIn.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Check-out:</span>
                <span className="font-medium">{mockReservation.checkOut.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Room Type:</span>
                <span className="font-medium">{mockReservation.roomType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-green-600">{mockReservation.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Create Templates */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-semibold text-charcoal mb-4">Quick Create from Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { id: 'restaurant', label: 'Restaurant Booking', icon: '🍽️' },
              { id: 'transportation', label: 'Transportation', icon: '🚗' },
              { id: 'spa', label: 'Spa Appointment', icon: '💆' },
              { id: 'tour', label: 'Tour Booking', icon: '🗺️' },
            ].map(template => (
              <PermissionGate key={template.id} resource="concierge" action="create" scope="property" hideOnDenied>
                <button
                  onClick={() => handleCreateFromTemplate(template.id)}
                  className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-xl">{template.icon}</span>
                  <span className="text-sm font-medium">{template.label}</span>
                </button>
              </PermissionGate>
            ))}
          </div>
        </div>

        {/* Checklist Items */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-charcoal">Required Tasks & Checklist</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Filter:</span>
              <select className="form-input text-sm">
                <option value="">All Tasks</option>
                <option value="required">Required Only</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {checklist && checklist.items.length > 0 ? (
            <div className="space-y-4">
              {checklist.items.map((item) => (
                <div
                  key={item.id}
                  className={`border rounded-lg p-4 ${
                    item.status === 'completed' ? 'bg-green-50 border-green-200' :
                    item.status === 'overdue' ? 'bg-red-50 border-red-200' :
                    item.status === 'in_progress' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{getStatusIcon(item.status)}</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">{item.title}</h4>
                          {item.isRequired && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">
                              Required
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Type: {item.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        {item.dueAt && (
                          <div className="text-sm mt-2">
                            <span className="text-gray-600">Due: </span>
                            {formatDueTime(item.dueAt)}
                          </div>
                        )}
                        {item.completedAt && (
                          <div className="text-sm text-green-600 mt-1">
                            ✅ Completed {item.completedAt.toLocaleDateString()} at {item.completedAt.toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(item.status)}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                      {item.status !== 'completed' && (
                        <PermissionGate resource="concierge" action="update" scope="property" hideOnDenied>
                          <button
                            onClick={() => handleCompleteItem(item.id)}
                            className="btn btn-sm btn-primary"
                          >
                            Mark Complete
                          </button>
                        </PermissionGate>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📋</div>
              <p>No checklist items found for this reservation</p>
              <p className="text-sm mt-1">Tasks will appear here as they're created</p>
            </div>
          )}
        </div>

        {/* Exception Panel */}
        {checklist && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="font-semibold text-red-800 mb-4">🚨 Exceptions & Missing Requirements</h3>
            
            {checklist.items.filter(item => item.status === 'overdue').length > 0 ? (
              <div className="space-y-2">
                {checklist.items
                  .filter(item => item.status === 'overdue')
                  .map(item => (
                    <div key={item.id} className="flex items-center justify-between bg-white rounded p-3">
                      <div>
                        <span className="font-medium text-red-800">{item.title}</span>
                        <span className="text-sm text-red-600 ml-2">
                          (Overdue by {Math.abs(Math.round((new Date().getTime() - item.dueAt!.getTime()) / (1000 * 3600)))}h)
                        </span>
                      </div>
                      <PermissionGate resource="concierge" action="update" scope="property" hideOnDenied>
                        <button
                          onClick={() => handleCompleteItem(item.id)}
                          className="btn btn-sm bg-red-600 text-white hover:bg-red-700"
                        >
                          Resolve Now
                        </button>
                      </PermissionGate>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center text-green-700">
                <span className="text-2xl">✅</span>
                <p className="mt-2">No exceptions - all tasks are on track!</p>
              </div>
            )}
          </div>
        )}

        {/* Create Object Modal */}
        {showCreateModal && (
          <CreateConciergeObjectModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              loadChecklist();
            }}
          />
        )}
      </div>
    </PermissionGate>
  );
};

export default Reservation360Page;