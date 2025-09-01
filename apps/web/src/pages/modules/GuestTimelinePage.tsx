import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { conciergeService } from '../../services/conciergeService';
import { GuestTimelineEvent } from '../../types/concierge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { PermissionGate } from '../../components';
import toastService from '../../services/toastService';

interface GuestTimelinePageProps {
  guestId?: string; // Optional prop, falls back to URL params
}

const GuestTimelinePage: React.FC<GuestTimelinePageProps> = ({ guestId: propGuestId }) => {
  const { guestId: urlGuestId } = useParams<{ guestId: string }>();
  const guestId = propGuestId || urlGuestId;
  
  const [loading, setLoading] = useState(true);
  const [timelineEvents, setTimelineEvents] = useState<GuestTimelineEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<GuestTimelineEvent[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Mock guest data - in real app this would come from API
  const mockGuest = {
    id: guestId || 'guest-001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-123-4567',
    vipStatus: false,
    totalStays: 3,
    totalSpent: 2500,
    memberSince: new Date('2022-01-15'),
    preferences: ['Ocean View', 'Late Check-out', 'Spa Services'],
  };

  // Load guest timeline
  const loadTimeline = useCallback(async () => {
    if (!guestId) return;
    
    try {
      setLoading(true);
      const response = await conciergeService.getGuestTimeline(guestId);
      setTimelineEvents(response.data);
    } catch (error) {
      console.error('Failed to load guest timeline:', error);
      // Create mock timeline data for demo purposes
      const mockEvents: GuestTimelineEvent[] = [
        {
          id: '1',
          type: 'concierge_object',
          title: 'Restaurant Reservation Completed',
          description: 'Dinner reservation at Ocean View Restaurant for 2 guests confirmed',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          status: 'completed',
          metadata: { restaurantName: 'Ocean View Restaurant', partySize: 2, time: '7:00 PM' },
        },
        {
          id: '2',
          type: 'note',
          title: 'Guest Preference Noted',
          description: 'Guest prefers late check-out due to evening flight',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          metadata: { category: 'preference', source: 'front_desk' },
        },
        {
          id: '3',
          type: 'concierge_object',
          title: 'Transportation Request',
          description: 'Airport pickup arranged for arrival at 3:00 PM',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          status: 'in_progress',
          metadata: { pickup_time: '3:00 PM', destination: 'Airport', vehicle: 'Luxury Sedan' },
        },
        {
          id: '4',
          type: 'file',
          title: 'ID Verification Uploaded',
          description: 'Guest uploaded passport copy for verification',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
          metadata: { filename: 'passport_john_doe.pdf', fileType: 'document' },
        },
        {
          id: '5',
          type: 'notification',
          title: 'Welcome Message Sent',
          description: 'Pre-arrival welcome message sent via email with check-in instructions',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          metadata: { channel: 'email', template: 'pre_arrival_welcome' },
        },
        {
          id: '6',
          type: 'concierge_object',
          title: 'Spa Appointment Booked',
          description: 'Couples massage booked for tomorrow at 2:00 PM',
          timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000),
          status: 'completed',
          metadata: { service: 'Couples Massage', duration: '90 minutes', therapists: 2 },
        },
        {
          id: '7',
          type: 'note',
          title: 'Special Request',
          description: 'Guest celebrating anniversary - arranged rose petals and champagne in room',
          timestamp: new Date(Date.now() - 30 * 60 * 60 * 1000),
          metadata: { category: 'special_occasion', occasion: 'anniversary' },
        },
        {
          id: '8',
          type: 'concierge_object',
          title: 'Room Upgrade Processed',
          description: 'Upgraded from Standard Ocean View to Premium Suite due to availability',
          timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
          status: 'completed',
          metadata: { from_room: 'Standard Ocean View', to_room: 'Premium Suite', reason: 'availability' },
        },
      ];
      setTimelineEvents(mockEvents);
    } finally {
      setLoading(false);
    }
  }, [guestId]);

  // Filter and search events
  useEffect(() => {
    let filtered = timelineEvents;

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(event => event.type === filterType);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    setFilteredEvents(filtered);
  }, [timelineEvents, filterType, searchTerm]);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  const getEventIcon = (type: string, status?: string) => {
    const typeIcons = {
      concierge_object: status === 'completed' ? '✅' : status === 'in_progress' ? '🔄' : '📋',
      note: '📝',
      file: '📎',
      notification: '📧',
    };
    return typeIcons[type as keyof typeof typeIcons] || '📌';
  };

  const getEventColor = (type: string, status?: string) => {
    if (type === 'concierge_object') {
      return status === 'completed' ? 'border-green-200 bg-green-50' :
             status === 'in_progress' ? 'border-yellow-200 bg-yellow-50' :
             'border-blue-200 bg-blue-50';
    }
    
    const typeColors = {
      note: 'border-purple-200 bg-purple-50',
      file: 'border-gray-200 bg-gray-50',
      notification: 'border-indigo-200 bg-indigo-50',
    };
    return typeColors[type as keyof typeof typeColors] || 'border-gray-200 bg-gray-50';
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const timeDiff = now.getTime() - timestamp.getTime();
    const hoursDiff = Math.floor(timeDiff / (1000 * 3600));
    const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));

    if (hoursDiff < 1) {
      return 'Just now';
    } else if (hoursDiff < 24) {
      return `${hoursDiff}h ago`;
    } else if (daysDiff < 7) {
      return `${daysDiff}d ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  const renderEventMetadata = (metadata: Record<string, any>) => {
    if (!metadata || Object.keys(metadata).length === 0) return null;

    return (
      <div className="mt-3 bg-white/60 rounded p-3 border border-white">
        <div className="text-xs text-gray-600 mb-1">Details:</div>
        <div className="grid grid-cols-1 gap-1">
          {Object.entries(metadata).map(([key, value]) => (
            <div key={key} className="flex justify-between text-xs">
              <span className="font-medium text-gray-700">{key.replace('_', ' ')}:</span>
              <span className="text-gray-900">{JSON.stringify(value)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!guestId) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">👤</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Guest Selected</h3>
        <p className="text-gray-600">Please select a guest to view their timeline.</p>
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
        {/* Header - Guest Information */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {mockGuest.firstName[0]}{mockGuest.lastName[0]}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-charcoal">
                  {mockGuest.firstName} {mockGuest.lastName}
                  {mockGuest.vipStatus && (
                    <span className="ml-2 px-2 py-1 bg-gold text-white text-sm font-medium rounded">VIP</span>
                  )}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                  <span>📧 {mockGuest.email}</span>
                  <span>📞 {mockGuest.phone}</span>
                  <span>🏨 {mockGuest.totalStays} stays</span>
                  <span>💰 ${mockGuest.totalSpent}</span>
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  Member since {mockGuest.memberSince.toLocaleDateString()}
                </div>
              </div>
            </div>
            
            <div className="mt-4 lg:mt-0">
              <div className="text-right">
                <div className="text-lg font-semibold text-charcoal">{filteredEvents.length} Events</div>
                <div className="text-sm text-gray-600">in timeline</div>
              </div>
            </div>
          </div>

          {/* Guest Preferences */}
          {mockGuest.preferences && mockGuest.preferences.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-2">Preferences & Notes:</div>
              <div className="flex flex-wrap gap-2">
                {mockGuest.preferences.map((pref, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                    {pref}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Filters and Search */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search timeline events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input w-full"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="form-input"
              >
                <option value="all">All Events</option>
                <option value="concierge_object">Concierge Tasks</option>
                <option value="note">Notes</option>
                <option value="file">Files</option>
                <option value="notification">Notifications</option>
              </select>
              <button
                onClick={loadTimeline}
                className="btn btn-secondary"
                disabled={loading}
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-semibold text-charcoal mb-6">Guest Activity Timeline</h3>
          
          {filteredEvents.length > 0 ? (
            <div className="space-y-4">
              {filteredEvents.map((event, index) => (
                <div key={event.id} className="flex items-start space-x-4">
                  {/* Timeline connector */}
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-lg">
                      {getEventIcon(event.type, event.status)}
                    </div>
                    {index < filteredEvents.length - 1 && (
                      <div className="w-px h-16 bg-gray-200 mt-2"></div>
                    )}
                  </div>

                  {/* Event content */}
                  <div className={`flex-1 border rounded-lg p-4 ${getEventColor(event.type, event.status)}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{event.title}</h4>
                        <p className="text-sm text-gray-700 mt-1">{event.description}</p>
                        {event.status && (
                          <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded ${
                            event.status === 'completed' ? 'bg-green-100 text-green-800' :
                            event.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {event.status.replace('_', ' ')}
                          </span>
                        )}
                        {renderEventMetadata(event.metadata || {})}
                      </div>
                      <div className="text-right text-xs text-gray-500 ml-4">
                        <div>{formatTimestamp(event.timestamp)}</div>
                        <div className="mt-1">{event.timestamp.toLocaleString()}</div>
                        <div className="mt-1 capitalize px-2 py-1 bg-white/60 rounded">
                          {event.type.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">
                {searchTerm || filterType !== 'all' ? '🔍' : '📅'}
              </div>
              <h3 className="font-medium text-gray-900 mb-2">
                {searchTerm || filterType !== 'all' ? 'No matching events found' : 'No timeline events'}
              </h3>
              <p className="text-sm">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Timeline events will appear here as guest interactions are recorded'
                }
              </p>
              {(searchTerm || filterType !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('all');
                  }}
                  className="btn btn-secondary mt-4"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Events',
              value: timelineEvents.length,
              icon: '📊',
              color: 'text-blue-600',
            },
            {
              label: 'Concierge Tasks',
              value: timelineEvents.filter(e => e.type === 'concierge_object').length,
              icon: '✅',
              color: 'text-green-600',
            },
            {
              label: 'Notes & Files',
              value: timelineEvents.filter(e => ['note', 'file'].includes(e.type)).length,
              icon: '📝',
              color: 'text-purple-600',
            },
            {
              label: 'Notifications',
              value: timelineEvents.filter(e => e.type === 'notification').length,
              icon: '📧',
              color: 'text-indigo-600',
            },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </PermissionGate>
  );
};

export default GuestTimelinePage;