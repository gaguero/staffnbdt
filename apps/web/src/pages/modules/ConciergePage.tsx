import React, { useState } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { useConciergeStats } from '../../hooks/useConcierge';
import { ConciergeObject } from '../../types/concierge';
import PermissionGate from '../../components/PermissionGate';
import TodayBoard from '../../components/concierge/TodayBoard';
import Reservation360 from '../../components/concierge/Reservation360';
import GuestTimeline from '../../components/concierge/GuestTimeline';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Reservation, Guest } from '../../types/hotel';

type ViewMode = 'today' | 'reservation360' | 'timeline';

interface ConciergeStatsCardsProps {
  onViewChange: (view: ViewMode) => void;
}

const ConciergeStatsCards: React.FC<ConciergeStatsCardsProps> = ({ onViewChange }) => {
  const { data: stats, isLoading } = useConciergeStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
            <LoadingSpinner size="sm" />
          </div>
        ))}
      </div>
    );
  }

  const statsData = stats?.data || {
    totalObjects: 0,
    openObjects: 0,
    overdueObjects: 0,
    completedToday: 0,
    averageCompletionTime: 0,
  };

  const cards = [
    {
      title: 'Open Tasks',
      value: statsData.openObjects,
      icon: '📋',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      onClick: () => onViewChange('today'),
    },
    {
      title: 'Overdue',
      value: statsData.overdueObjects,
      icon: '🚨',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      onClick: () => onViewChange('today'),
    },
    {
      title: 'Completed Today',
      value: statsData.completedToday,
      icon: '✅',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      onClick: () => onViewChange('today'),
    },
    {
      title: 'Avg. Completion',
      value: `${Math.round(statsData.averageCompletionTime)}h`,
      icon: '⏱️',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      onClick: () => onViewChange('today'),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`${card.bgColor} border border-gray-200 rounded-lg p-6 cursor-pointer hover:shadow-md transition-shadow`}
          onClick={card.onClick}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
            <span className="text-2xl">{card.icon}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

interface ObjectDetailsModalProps {
  object: ConciergeObject | null;
  isOpen: boolean;
  onClose: () => void;
}

const ObjectDetailsModal: React.FC<ObjectDetailsModalProps> = ({ object, isOpen, onClose }) => {
  if (!isOpen || !object) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {object.type.replace('_', ' ')}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Status</p>
                <p className="font-medium text-gray-900">{object.status.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-gray-500">Created</p>
                <p className="font-medium text-gray-900">
                  {new Date(object.createdAt).toLocaleDateString()}
                </p>
              </div>
              {object.dueAt && (
                <div>
                  <p className="text-gray-500">Due Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(object.dueAt).toLocaleDateString()}
                  </p>
                </div>
              )}
              {object.reservationId && (
                <div>
                  <p className="text-gray-500">Reservation</p>
                  <p className="font-medium text-gray-900">{object.reservationId}</p>
                </div>
              )}
            </div>
            
            {object.attributes && object.attributes.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Attributes</h4>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  {object.attributes.map((attr) => (
                    <div key={attr.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{attr.fieldKey}:</span>
                      <span className="text-gray-900">
                        {attr.stringValue || attr.numberValue || (attr.booleanValue ? 'Yes' : 'No') || 
                         (attr.dateValue && new Date(attr.dateValue).toLocaleDateString()) ||
                         JSON.stringify(attr.jsonValue) || 'N/A'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {object.assignments && Object.keys(object.assignments).length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Assignments</h4>
                <div className="bg-gray-50 rounded-lg p-3">
                  <pre className="text-sm text-gray-600">
                    {JSON.stringify(object.assignments, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button onClick={onClose} className="btn btn-outline">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const ConciergePage: React.FC = () => {
  const { getCurrentPropertyName } = useTenant();
  const [currentView, setCurrentView] = useState<ViewMode>('today');
  const [selectedObject, setSelectedObject] = useState<ConciergeObject | null>(null);
  const [showObjectModal, setShowObjectModal] = useState(false);
  
  // Mock data for demonstration - in a real app, this would come from route params or selection
  const mockReservation: Reservation = {
    id: '1',
    confirmationNumber: 'RES-001',
    guestId: 'guest-1',
    guest: {
      id: 'guest-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-123-4567',
      preferences: {
        smoking: false,
        specialRequests: [],
        dietaryRestrictions: [],
        communicationPreferences: {
          email: true,
          sms: false,
          phone: false,
        },
      },
      vipStatus: false,
      blacklisted: false,
      notes: [],
      totalStays: 3,
      totalSpent: 2500,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Guest,
    roomType: {
      id: 'rt-1',
      name: 'Ocean View Suite',
      description: 'Luxurious suite with ocean views',
      baseRate: 299,
      maxCapacity: 4,
      amenities: ['Ocean View', 'Balcony', 'King Bed'],
    },
    checkInDate: new Date(),
    checkOutDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    numberOfGuests: 2,
    adults: 2,
    children: 0,
    status: 'CONFIRMED',
    source: 'DIRECT',
    rate: 299,
    totalAmount: 897,
    paidAmount: 0,
    paymentStatus: 'PENDING',
    specialRequests: [],
    notes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-1',
    propertyId: 'prop-1',
  } as Reservation;

  const mockGuest: Guest = mockReservation.guest;

  const handleObjectClick = (object: ConciergeObject) => {
    setSelectedObject(object);
    setShowObjectModal(true);
  };

  const propertyName = getCurrentPropertyName();
  const requiresPropertySelection = !propertyName || propertyName === 'Select Property';

  if (requiresPropertySelection) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏨</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Property Selection Required
        </h3>
        <p className="text-gray-600">
          Please select a property to access the Concierge module.
        </p>
      </div>
    );
  }

  return (
    <PermissionGate permission="concierge.objects.read.property">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="heading-2">Concierge</h1>
            <p className="text-gray-600">Guest experience orchestration for {propertyName}</p>
          </div>
          
          {/* View Toggles */}
          <div className="mt-4 lg:mt-0">
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
              <button
                onClick={() => setCurrentView('today')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'today'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📋 Today Board
              </button>
              <button
                onClick={() => setCurrentView('reservation360')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'reservation360'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🏨 Reservation 360
              </button>
              <button
                onClick={() => setCurrentView('timeline')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'timeline'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📅 Guest Timeline
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <ConciergeStatsCards onViewChange={setCurrentView} />

        {/* Main Content */}
        <div className="min-h-[600px]">
          {currentView === 'today' && (
            <TodayBoard onObjectClick={handleObjectClick} />
          )}
          
          {currentView === 'reservation360' && (
            <PermissionGate permission="concierge.reservations.read.property">
              <Reservation360 reservation={mockReservation} />
            </PermissionGate>
          )}
          
          {currentView === 'timeline' && (
            <PermissionGate permission="concierge.guests.read.property">
              <GuestTimeline guest={mockGuest} />
            </PermissionGate>
          )}
        </div>

        {/* Object Details Modal */}
        <ObjectDetailsModal
          object={selectedObject}
          isOpen={showObjectModal}
          onClose={() => setShowObjectModal(false)}
        />
      </div>
    </PermissionGate>
  );
};

export default ConciergePage;


