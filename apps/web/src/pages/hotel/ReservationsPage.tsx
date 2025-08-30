import React, { useState, useMemo } from 'react';
import { useReservations, useHotelStats, useTodayArrivals, useTodayDepartures } from '../../hooks/useHotel';
import { ReservationFilter, ReservationStatus, PaymentStatus, ReservationSource } from '../../types/hotel';
import ReservationCard from '../../components/hotel/ReservationCard';
import CreateReservationModal from '../../components/hotel/CreateReservationModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import PermissionGate from '../../components/PermissionGate';
import { Reservation } from '../../types/hotel';

const ReservationsPage: React.FC = () => {
  const [filter, setFilter] = useState<ReservationFilter>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'calendar'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const { data: reservationsResponse, isLoading, error } = useReservations(filter);
  const { data: hotelStats } = useHotelStats();
  const { data: todayArrivals } = useTodayArrivals();
  const { data: todayDepartures } = useTodayDepartures();

  const reservations = reservationsResponse?.data || [];
  const total = reservationsResponse?.total || 0;

  const safeNumber = (value: any, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  // Filter options
  const statusOptions: { value: ReservationStatus; label: string; color: string }[] = [
    { value: 'CONFIRMED', label: 'Confirmed', color: 'text-green-600' },
    { value: 'CHECKED_IN', label: 'Checked In', color: 'text-blue-600' },
    { value: 'CHECKED_OUT', label: 'Checked Out', color: 'text-gray-600' },
    { value: 'CANCELLED', label: 'Cancelled', color: 'text-red-600' },
    { value: 'NO_SHOW', label: 'No Show', color: 'text-orange-600' },
    { value: 'PENDING', label: 'Pending', color: 'text-yellow-600' },
  ];

  const paymentStatusOptions: { value: PaymentStatus; label: string }[] = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'PARTIAL', label: 'Partial' },
    { value: 'PAID', label: 'Paid' },
    { value: 'REFUNDED', label: 'Refunded' },
    { value: 'FAILED', label: 'Failed' },
  ];

  const sourceOptions: { value: ReservationSource; label: string }[] = [
    { value: 'DIRECT', label: 'Direct' },
    { value: 'BOOKING_COM', label: 'Booking.com' },
    { value: 'EXPEDIA', label: 'Expedia' },
    { value: 'AIRBNB', label: 'Airbnb' },
    { value: 'PHONE', label: 'Phone' },
    { value: 'WALK_IN', label: 'Walk-in' },
    { value: 'OTHER', label: 'Other' },
  ];

  // Stats
  const stats = useMemo(() => {
    if (!reservations.length) return null;

    const statusCounts = reservations.reduce((acc, reservation) => {
      acc[reservation.status] = (acc[reservation.status] || 0) + 1;
      return acc;
    }, {} as Record<ReservationStatus, number>);

    const totalRevenue = reservations
      .filter(r => !['CANCELLED', 'NO_SHOW'].includes(r.status))
      .reduce((sum, r) => sum + Number(r.totalAmount || 0), 0);

    return {
      total: Number(reservations.length || 0),
      confirmed: Number(statusCounts.CONFIRMED || 0),
      checkedIn: Number(statusCounts.CHECKED_IN || 0),
      checkedOut: Number(statusCounts.CHECKED_OUT || 0),
      cancelled: Number(statusCounts.CANCELLED || 0),
      totalRevenue: Number.isFinite(totalRevenue) ? totalRevenue : 0,
      arrivalsToday: Number(todayArrivals?.length || 0),
      departuresToday: Number(todayDepartures?.length || 0),
    };
  }, [reservations, todayArrivals, todayDepartures]);

  const handleFilterChange = (key: keyof ReservationFilter, value: any) => {
    setFilter(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleReservationClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowEditModal(true);
  };

  const clearFilters = () => {
    setFilter({});
  };

  const setDateRangeFilter = (type: 'today' | 'week' | 'month' | 'custom') => {
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    
    let dateRange;
    switch (type) {
      case 'today':
        dateRange = {
          start: startOfToday,
          end: new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)
        };
        break;
      case 'week':
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
        dateRange = {
          start: startOfWeek,
          end: new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000)
        };
        break;
      case 'month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        dateRange = {
          start: startOfMonth,
          end: endOfMonth
        };
        break;
      default:
        dateRange = undefined;
    }
    
    handleFilterChange('checkInDateRange', dateRange);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" text="Loading reservations..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">❌ Failed to load reservations</div>
        <button 
          onClick={() => window.location.reload()}
          className="btn btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reservations Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Manage bookings, check-ins, and guest stays
          </p>
        </div>
        <PermissionGate resource="reservation" action="create">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <span className="mr-2">📅</span>
            New Reservation
          </button>
        </PermissionGate>
      </div>

      {/* Hotel Stats */}
      {hotelStats && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Hotel Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{safeNumber(hotelStats?.occupancyRate)}%</div>
              <div className="text-sm text-gray-600">Occupancy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{safeNumber(hotelStats?.availableRooms)}</div>
              <div className="text-sm text-gray-600">Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{safeNumber(hotelStats?.checkInsToday)}</div>
              <div className="text-sm text-gray-600">Check-ins Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{safeNumber(hotelStats?.checkOutsToday)}</div>
              <div className="text-sm text-gray-600">Check-outs Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">${Number(hotelStats?.revenue?.today ?? 0).toLocaleString()}</div>
              <div className="text-sm text-gray-600">Today Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">${safeNumber(hotelStats?.averageRate).toLocaleString()}</div>
              <div className="text-sm text-gray-600">Avg. Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Reservation Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Reservations</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
            <div className="text-sm text-gray-600">Confirmed</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{stats.checkedIn}</div>
            <div className="text-sm text-gray-600">Checked In</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-600">{stats.checkedOut}</div>
            <div className="text-sm text-gray-600">Checked Out</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            <div className="text-sm text-gray-600">Cancelled</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-green-600">${Number(stats.totalRevenue || 0).toLocaleString()}</div>
            <div className="text-sm text-gray-600">Revenue</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-orange-600">{stats.arrivalsToday}</div>
            <div className="text-sm text-gray-600">Arrivals Today</div>
          </div>
        </div>
      )}

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setDateRangeFilter('today')}
          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors"
        >
          Today's Check-ins
        </button>
        <button
          onClick={() => handleFilterChange('status', ['CONFIRMED'])}
          className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm hover:bg-green-200 transition-colors"
        >
          Confirmed
        </button>
        <button
          onClick={() => handleFilterChange('status', ['CHECKED_IN'])}
          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors"
        >
          In-House
        </button>
        <button
          onClick={() => handleFilterChange('paymentStatus', ['PENDING'])}
          className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm hover:bg-yellow-200 transition-colors"
        >
          Payment Pending
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Guest name, confirmation..."
              value={filter.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filter.status?.[0] || ''}
              onChange={(e) => handleFilterChange('status', e.target.value ? [e.target.value as ReservationStatus] : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment
            </label>
            <select
              value={filter.paymentStatus?.[0] || ''}
              onChange={(e) => handleFilterChange('paymentStatus', e.target.value ? [e.target.value as PaymentStatus] : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Payments</option>
              {paymentStatusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Source Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source
            </label>
            <select
              value={filter.source?.[0] || ''}
              onChange={(e) => handleFilterChange('source', e.target.value ? [e.target.value as ReservationSource] : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Sources</option>
              {sourceOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <button
            onClick={clearFilters}
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Clear all filters
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">View:</span>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Showing {reservations.length} of {total} reservations
        </p>
      </div>

      {/* Reservations Grid/List */}
      {reservations.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reservations found</h3>
          <p className="text-gray-600 mb-6">
            {Object.keys(filter).length > 0 
              ? "Try adjusting your filters to see more results."
              : "Get started by creating your first reservation."}
          </p>
          <PermissionGate resource="reservation" action="create">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              Create First Reservation
            </button>
          </PermissionGate>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {reservations.map(reservation => (
            <ReservationCard
              key={reservation.id}
              reservation={reservation}
              onClick={handleReservationClick}
              compact={viewMode === 'list'}
            />
          ))}
        </div>
      )}

      {/* Create Reservation Modal */}
      <CreateReservationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        mode="create"
      />

      {/* Edit Reservation Modal */}
      <CreateReservationModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedReservation(null);
        }}
        reservation={selectedReservation || undefined}
        mode="edit"
      />
    </div>
  );
};

export default ReservationsPage;