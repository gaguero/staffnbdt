import React, { useState, useMemo } from 'react';
import { useGuests } from '../../hooks/useHotel';
import { GuestFilter } from '../../types/hotel';
import GuestCard from '../../components/hotel/GuestCard';
import CreateGuestModal from '../../components/hotel/CreateGuestModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import PermissionGate from '../../components/PermissionGate';
import { Guest } from '../../types/hotel';

const GuestsPage: React.FC = () => {
  const [filter, setFilter] = useState<GuestFilter>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const { data: guestsResponse, isLoading, error } = useGuests(filter);

  const guests = guestsResponse?.data || [];
  const total = guestsResponse?.total || 0;

  // Stats
  const stats = useMemo(() => {
    if (!guests.length) return null;

    const vipCount = guests.filter(guest => guest.vipStatus).length;
    const blacklistedCount = guests.filter(guest => guest.blacklisted).length;
    const totalStays = guests.reduce((sum, guest) => sum + guest.totalStays, 0);
    const totalSpent = guests.reduce((sum, guest) => sum + guest.totalSpent, 0);
    const averageStays = guests.length > 0 ? Math.round(totalStays / guests.length) : 0;

    return {
      total: guests.length,
      vip: vipCount,
      blacklisted: blacklistedCount,
      totalStays,
      totalSpent,
      averageStays,
    };
  }, [guests]);

  const handleFilterChange = (key: keyof GuestFilter, value: any) => {
    setFilter(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleGuestClick = (guest: Guest) => {
    setSelectedGuest(guest);
    setShowEditModal(true);
  };

  const clearFilters = () => {
    setFilter({});
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" text="Loading guests..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">❌ Failed to load guests</div>
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
          <h1 className="text-3xl font-bold text-gray-900">Guest Directory</h1>
          <p className="text-gray-600 mt-1">
            Manage guest profiles, preferences, and history
          </p>
        </div>
        <PermissionGate resource="guest" action="create">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <span className="mr-2">➕</span>
            Add Guest
          </button>
        </PermissionGate>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Guests</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-yellow-600">{stats.vip}</div>
            <div className="text-sm text-gray-600">VIP Guests</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-red-600">{stats.blacklisted}</div>
            <div className="text-sm text-gray-600">Blacklisted</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{stats.totalStays.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Stays</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-green-600">${stats.totalSpent.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">{stats.averageStays}</div>
            <div className="text-sm text-gray-600">Avg. Stays</div>
          </div>
        </div>
      )}

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
              placeholder="Name, email, phone..."
              value={filter.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* VIP Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filter.vipStatus !== undefined ? (filter.vipStatus ? 'vip' : 'regular') : 'all'}
              onChange={(e) => {
                const value = e.target.value;
                if (value === 'all') {
                  handleFilterChange('vipStatus', undefined);
                } else {
                  handleFilterChange('vipStatus', value === 'vip');
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Guests</option>
              <option value="vip">VIP Only</option>
              <option value="regular">Regular Only</option>
            </select>
          </div>

          {/* Nationality Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nationality
            </label>
            <input
              type="text"
              placeholder="e.g., American, British"
              value={filter.nationality || ''}
              onChange={(e) => handleFilterChange('nationality', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Blacklisted Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Access
            </label>
            <select
              value={filter.blacklisted !== undefined ? (filter.blacklisted ? 'blacklisted' : 'allowed') : 'all'}
              onChange={(e) => {
                const value = e.target.value;
                if (value === 'all') {
                  handleFilterChange('blacklisted', undefined);
                } else {
                  handleFilterChange('blacklisted', value === 'blacklisted');
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Access</option>
              <option value="allowed">Allowed Only</option>
              <option value="blacklisted">Blacklisted Only</option>
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
          Showing {guests.length} of {total} guests
        </p>
      </div>

      {/* Guests Grid/List */}
      {guests.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">👥</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No guests found</h3>
          <p className="text-gray-600 mb-6">
            {Object.keys(filter).length > 0 
              ? "Try adjusting your filters to see more results."
              : "Get started by adding your first guest."}
          </p>
          <PermissionGate resource="guest" action="create">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              Add First Guest
            </button>
          </PermissionGate>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {guests.map(guest => (
            <GuestCard
              key={guest.id}
              guest={guest}
              onClick={handleGuestClick}
              compact={viewMode === 'list'}
            />
          ))}
        </div>
      )}

      {/* Create Guest Modal */}
      <CreateGuestModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        mode="create"
      />

      {/* Edit Guest Modal */}
      <CreateGuestModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedGuest(null);
        }}
        guest={selectedGuest || undefined}
        mode="edit"
      />
    </div>
  );
};

export default GuestsPage;