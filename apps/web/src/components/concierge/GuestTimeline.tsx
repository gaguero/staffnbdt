import React, { useState, useMemo } from 'react';
import { useGuestTimeline } from '../../hooks/useConcierge';
import { GuestTimelineEvent } from '../../types/concierge';
import { Guest } from '../../types/hotel';
import LoadingSpinner from '../LoadingSpinner';
import ErrorDisplay from '../ErrorDisplay';
import { format, getRelativeTime, isToday, isTomorrow } from '../../utils/dateUtils';

interface TimelineEventCardProps {
  event: GuestTimelineEvent;
  isLast: boolean;
}

const TimelineEventCard: React.FC<TimelineEventCardProps> = ({ event, isLast }) => {
  const eventTypeConfig = {
    concierge_object: {
      icon: '🔔',
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200',
    },
    note: {
      icon: '📝',
      bgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      borderColor: 'border-yellow-200',
    },
    file: {
      icon: '📄',
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200',
    },
    notification: {
      icon: '📧',
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200',
    },
  };

  const config = eventTypeConfig[event.type] || eventTypeConfig.concierge_object;
  
  const statusBadge = event.status && (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
      event.status === 'completed' ? 'bg-green-100 text-green-800' :
      event.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
      event.status === 'overdue' ? 'bg-red-100 text-red-800' :
      'bg-gray-100 text-gray-800'
    }`}>
      {event.status.replace('_', ' ')}
    </span>
  );

  return (
    <div className="relative flex items-start space-x-4">
      {/* Timeline Line */}
      {!isLast && (
        <div className="absolute left-6 top-12 w-0.5 h-full bg-gray-200 -translate-x-px" />
      )}
      
      {/* Event Icon */}
      <div className={`flex-shrink-0 w-12 h-12 rounded-full ${config.bgColor} flex items-center justify-center border-2 ${config.borderColor} bg-white hover:scale-110 transition-transform duration-200`}>
        <span className={`text-lg ${config.iconColor} hover:animate-bounce`}>{config.icon}</span>
      </div>
      
      {/* Event Content */}
      <div className="flex-1 min-w-0 bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-medium text-gray-900">{event.title}</h4>
              {statusBadge}
            </div>
            
            <p className="text-sm text-gray-600 mb-2">{event.description}</p>
            
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>{format(event.timestamp, 'MMM d, h:mm a')}</span>
              <span>•</span>
              <span>{getRelativeTime(event.timestamp)}</span>
              <span>•</span>
              <span className="capitalize">{event.type.replace('_', ' ')}</span>
            </div>
            
            {/* Metadata */}
            {event.metadata && Object.keys(event.metadata).length > 0 && (
              <div className="mt-3 p-2 bg-gray-50 rounded border">
                <p className="text-xs text-gray-500 mb-1">Details:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(event.metadata).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-gray-500">{key}:</span>
                      <span className="ml-1 text-gray-700">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface TimelineFiltersProps {
  filters: {
    type: string;
    status: string;
    dateRange: string;
  };
  onFiltersChange: (filters: any) => void;
}

const TimelineFilters: React.FC<TimelineFiltersProps> = ({ filters, onFiltersChange }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <h3 className="font-medium text-gray-900 mb-3">Filters</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Event Type
          </label>
          <select
            value={filters.type}
            onChange={(e) => onFiltersChange({ ...filters, type: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="concierge_object">Concierge Tasks</option>
            <option value="note">Notes</option>
            <option value="file">Files</option>
            <option value="notification">Notifications</option>
          </select>
        </div>
        
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        
        {/* Date Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date Range
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => onFiltersChange({ ...filters, dateRange: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="stay">Current Stay</option>
          </select>
        </div>
      </div>
    </div>
  );
};

interface GuestHeaderProps {
  guest: Guest;
}

const GuestHeader: React.FC<GuestHeaderProps> = ({ guest }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
      <div className="flex items-center space-x-4">
        {/* Guest Avatar */}
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-xl font-semibold text-blue-600">
            {guest.firstName[0]}{guest.lastName[0]}
          </span>
        </div>
        
        {/* Guest Info */}
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h2 className="text-xl font-semibold text-gray-900">
              {guest.firstName} {guest.lastName}
            </h2>
            {guest.vipStatus && (
              <span className="bg-gold-100 text-gold-800 px-2 py-1 rounded-full text-xs font-medium">
                VIP
              </span>
            )}
            {guest.blacklisted && (
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                Flagged
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{guest.email}</p>
            </div>
            <div>
              <p className="text-gray-500">Phone</p>
              <p className="font-medium text-gray-900">{guest.phone}</p>
            </div>
            <div>
              <p className="text-gray-500">Total Stays</p>
              <p className="font-medium text-gray-900">{guest.totalStays}</p>
            </div>
            <div>
              <p className="text-gray-500">Total Spent</p>
              <p className="font-medium text-gray-900">${guest.totalSpent.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-col space-y-2">
          <button className="btn btn-outline btn-sm hover:scale-105 transition-transform duration-200">
            <span className="hover:animate-pulse">📞</span> Contact
          </button>
          <button className="btn btn-outline btn-sm hover:scale-105 transition-transform duration-200">
            <span className="hover:animate-bounce">📝</span> Add Note
          </button>
        </div>
      </div>
    </div>
  );
};

interface GuestTimelineProps {
  guest: Guest;
}

const GuestTimeline: React.FC<GuestTimelineProps> = ({ guest }) => {
  const { data, isLoading, error, refetch } = useGuestTimeline(guest.id);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    dateRange: 'all',
  });

  // Filter events based on current filters
  const filteredEvents = useMemo(() => {
    if (!data?.data) return [];
    
    let events = [...data.data];
    
    // Filter by type
    if (filters.type !== 'all') {
      events = events.filter(event => event.type === filters.type);
    }
    
    // Filter by status
    if (filters.status !== 'all') {
      events = events.filter(event => event.status === filters.status);
    }
    
    // Filter by date range
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      events = events.filter(event => {
        const eventDate = new Date(event.timestamp);
        
        switch (filters.dateRange) {
          case 'today':
            return eventDate >= todayStart;
          case 'week':
            return eventDate >= weekStart;
          case 'month':
            return eventDate >= monthStart;
          case 'stay':
            // This would filter for current stay period
            // For now, just show all events
            return true;
          default:
            return true;
        }
      });
    }
    
    // Sort by timestamp (newest first)
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [data?.data, filters]);

  // Group events by date for better organization
  const groupedEvents = useMemo(() => {
    const groups: { [key: string]: GuestTimelineEvent[] } = {};
    
    filteredEvents.forEach(event => {
      const eventDate = new Date(event.timestamp);
      let groupKey: string;
      
      if (isToday(eventDate)) {
        groupKey = 'Today';
      } else if (isTomorrow(eventDate)) {
        groupKey = 'Yesterday';
      } else {
        groupKey = format(eventDate, 'MMM d');
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(event);
    });
    
    return groups;
  }, [filteredEvents]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDisplay
        message="Failed to load guest timeline"
        onRetry={refetch}
      />
    );
  }

  const totalEvents = data?.data?.length || 0;
  const filteredCount = filteredEvents.length;

  return (
    <div className="space-y-6">
      {/* Guest Header */}
      <GuestHeader guest={guest} />
      
      {/* Filters */}
      <TimelineFilters filters={filters} onFiltersChange={setFilters} />
      
      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Timeline ({filteredCount} of {totalEvents} events)
          </h3>
          <p className="text-sm text-gray-600">
            Chronological history of guest interactions and activities
          </p>
        </div>
        
        <button
          onClick={() => refetch()}
          className="btn btn-outline btn-sm flex items-center space-x-2 hover:scale-105 transition-transform duration-200"
        >
          <span className="hover:animate-spin transition-transform">🔄</span>
          <span>Refresh</span>
        </button>
      </div>
      
      {/* Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {Object.keys(groupedEvents).length === 0 ? (
          <div className="text-center py-16 transform transition-all duration-300 hover:scale-105">
            <div className="text-6xl mb-6 animate-pulse">
              {totalEvents === 0 ? '🌟' : '🔍'}
            </div>
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-8 max-w-md mx-auto">
              <h4 className="text-xl font-bold text-gray-800 mb-3">
                {totalEvents === 0 ? 'Fresh Start!' : 'Refine Your Search'}
              </h4>
              <p className="text-gray-600 mb-4">
                {totalEvents === 0 
                  ? 'This guest\'s journey is just beginning. New interactions will appear here as they happen.'
                  : 'Try adjusting your filters to discover the perfect events. Every guest has a story to tell!'
                }
              </p>
              {totalEvents === 0 && (
                <div className="inline-flex items-center space-x-2 bg-blue-100 px-4 py-2 rounded-full">
                  <span className="text-sm font-medium text-blue-800">Ready for Action</span>
                  <span className="text-blue-600">🚀</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6">
            {Object.entries(groupedEvents).map(([dateGroup, events], groupIndex) => (
              <div key={dateGroup} className={groupIndex > 0 ? 'mt-8' : ''}>
                {/* Date Group Header */}
                <div className="flex items-center mb-4">
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                    {dateGroup}
                  </span>
                  <div className="flex-1 h-px bg-gray-200 ml-4" />
                </div>
                
                {/* Events in this group */}
                <div className="space-y-6">
                  {events.map((event, eventIndex) => (
                    <TimelineEventCard
                      key={event.id}
                      event={event}
                      isLast={groupIndex === Object.keys(groupedEvents).length - 1 && 
                             eventIndex === events.length - 1}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestTimeline;
