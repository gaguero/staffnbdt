import React, { useState, useMemo } from 'react';
import { useRooms, useRoomTypes } from '../../hooks/useHotel';
import { RoomFilter, RoomStatus, HousekeepingStatus } from '../../types/hotel';
import RoomCard from '../../components/hotel/RoomCard';
import CreateRoomModal from '../../components/hotel/CreateRoomModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import PermissionGate from '../../components/PermissionGate';
import { Room } from '../../types/hotel';

const RoomsPage: React.FC = () => {
  const [filter, setFilter] = useState<RoomFilter>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const { data: roomsResponse, isLoading, error } = useRooms(filter);
  const { data: roomTypes } = useRoomTypes();

  const rooms = roomsResponse?.data || [];
  const total = roomsResponse?.total || 0;

  // Filter options
  const statusOptions: { value: RoomStatus; label: string; color: string }[] = [
    { value: 'AVAILABLE', label: 'Available', color: 'text-green-600' },
    { value: 'OCCUPIED', label: 'Occupied', color: 'text-blue-600' },
    { value: 'OUT_OF_ORDER', label: 'Out of Order', color: 'text-red-600' },
    { value: 'MAINTENANCE', label: 'Maintenance', color: 'text-yellow-600' },
    { value: 'CLEANING', label: 'Cleaning', color: 'text-purple-600' },
    { value: 'RESERVED', label: 'Reserved', color: 'text-orange-600' },
  ];

  const housekeepingOptions: { value: HousekeepingStatus; label: string }[] = [
    { value: 'CLEAN', label: 'Clean' },
    { value: 'DIRTY', label: 'Dirty' },
    { value: 'INSPECTED', label: 'Inspected' },
    { value: 'OUT_OF_ORDER', label: 'Out of Order' },
  ];

  // Stats
  const stats = useMemo(() => {
    if (!rooms.length) return null;

    const statusCounts = rooms.reduce((acc, room) => {
      acc[room.status] = (acc[room.status] || 0) + 1;
      return acc;
    }, {} as Record<RoomStatus, number>);

    const occupancyRate = rooms.length > 0 
      ? ((statusCounts.OCCUPIED || 0) / rooms.length) * 100 
      : 0;

    return {
      total: rooms.length,
      available: statusCounts.AVAILABLE || 0,
      occupied: statusCounts.OCCUPIED || 0,
      outOfOrder: statusCounts.OUT_OF_ORDER || 0,
      maintenance: statusCounts.MAINTENANCE || 0,
      cleaning: statusCounts.CLEANING || 0,
      occupancyRate: Math.round(occupancyRate),
    };
  }, [rooms]);

  const handleFilterChange = (key: keyof RoomFilter, value: any) => {
    setFilter(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setShowEditModal(true);
  };

  const clearFilters = () => {
    setFilter({});
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" text="Loading rooms..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">❌ Failed to load rooms</div>
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
          <h1 className="text-3xl font-bold text-gray-900">Rooms Management</h1>
          <p className="text-gray-600 mt-1">
            Manage room inventory, status, and availability
          </p>
        </div>
        <PermissionGate resource="room" action="create">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <span className="mr-2">➕</span>
            Add Room
          </button>
        </PermissionGate>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Rooms</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
            <div className="text-sm text-gray-600">Available</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{stats.occupied}</div>
            <div className="text-sm text-gray-600">Occupied</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-red-600">{stats.outOfOrder}</div>
            <div className="text-sm text-gray-600">Out of Order</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-yellow-600">{stats.maintenance}</div>
            <div className="text-sm text-gray-600">Maintenance</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">{stats.cleaning}</div>
            <div className="text-sm text-gray-600">Cleaning</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-indigo-600">{stats.occupancyRate}%</div>
            <div className="text-sm text-gray-600">Occupancy</div>
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
              placeholder="Room number, type..."
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
              onChange={(e) => handleFilterChange('status', e.target.value ? [e.target.value as RoomStatus] : undefined)}
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

          {/* Room Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Room Type
            </label>
            <select
              value={filter.type || ''}
              onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {roomTypes?.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Floor Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Floor
            </label>
            <select
              value={filter.floor || ''}
              onChange={(e) => handleFilterChange('floor', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Floors</option>
              {[...Array(20)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  Floor {i + 1}
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
          Showing {rooms.length} of {total} rooms
        </p>
      </div>

      {/* Rooms Grid/List */}
      {rooms.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🏨</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms found</h3>
          <p className="text-gray-600 mb-6">
            {Object.keys(filter).length > 0 
              ? "Try adjusting your filters to see more results."
              : "Get started by adding your first room."}
          </p>
          <PermissionGate resource="room" action="create">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              Add First Room
            </button>
          </PermissionGate>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }>
          {rooms.map(room => (
            <RoomCard
              key={room.id}
              room={room}
              onClick={handleRoomClick}
              compact={viewMode === 'list'}
            />
          ))}
        </div>
      )}

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        mode="create"
      />

      {/* Edit Room Modal */}
      <CreateRoomModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedRoom(null);
        }}
        room={selectedRoom || undefined}
        mode="edit"
      />
    </div>
  );
};

export default RoomsPage;