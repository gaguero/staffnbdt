import React from 'react';
import { Room, RoomStatus, HousekeepingStatus } from '../../types/hotel';
import { useUpdateRoomStatus } from '../../hooks/useHotel';

interface RoomCardProps {
  room: Room;
  onClick?: (room: Room) => void;
  compact?: boolean;
}

const statusColors: Record<RoomStatus, string> = {
  AVAILABLE: 'bg-green-100 text-green-800 border-green-200',
  OCCUPIED: 'bg-blue-100 text-blue-800 border-blue-200',
  OUT_OF_ORDER: 'bg-red-100 text-red-800 border-red-200',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CLEANING: 'bg-purple-100 text-purple-800 border-purple-200',
  RESERVED: 'bg-orange-100 text-orange-800 border-orange-200',
};

const housekeepingColors: Record<HousekeepingStatus, string> = {
  CLEAN: 'bg-green-50 text-green-700',
  DIRTY: 'bg-red-50 text-red-700',
  INSPECTED: 'bg-blue-50 text-blue-700',
  OUT_OF_ORDER: 'bg-gray-50 text-gray-700',
};

const RoomCard: React.FC<RoomCardProps> = ({ room, onClick, compact = false }) => {
  const updateStatus = useUpdateRoomStatus();

  const handleStatusChange = async (e: React.MouseEvent, newStatus: RoomStatus) => {
    e.stopPropagation();
    if (room.status !== newStatus) {
      await updateStatus.mutateAsync({ id: room.id, status: newStatus });
    }
  };

  const getStatusIcon = (status: RoomStatus) => {
    switch (status) {
      case 'AVAILABLE': return '✅';
      case 'OCCUPIED': return '🏠';
      case 'OUT_OF_ORDER': return '🚫';
      case 'MAINTENANCE': return '🔧';
      case 'CLEANING': return '🧹';
      case 'RESERVED': return '📅';
      default: return '❓';
    }
  };

  if (compact) {
    return (
      <div
        className={`
          p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md
          ${statusColors[room.status]}
        `}
        onClick={() => onClick?.(room)}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-lg">{room.number || room.unitNumber}</div>
            <div className="text-sm opacity-75">Floor {room.floor || 'N/A'}</div>
          </div>
          <div className="text-right">
            <div className="text-2xl mb-1">{getStatusIcon(room.status)}</div>
            <div className="text-xs">{room.type?.name || 'Standard'}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={() => onClick?.(room)}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-semibold text-gray-900">Room {room.number || room.unitNumber}</h3>
          <span className={`
            px-3 py-1 rounded-full text-xs font-medium border
            ${statusColors[room.status]}
          `}>
            {getStatusIcon(room.status)} {room.status ? room.status.replace('_', ' ') : 'Unknown'}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Floor {room.floor || 'N/A'}</span>
          <span>•</span>
          <span>{room.type?.name || room.unitType || 'Standard'}</span>
          <span>•</span>
          <span>Capacity: {room.capacity || room.maxOccupancy}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Housekeeping Status */}
        {room.housekeepingStatus && (
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Housekeeping:</span>
            <span className={`
              px-2 py-1 rounded text-xs font-medium
              ${housekeepingColors[room.housekeepingStatus] || 'bg-gray-50 text-gray-700'}
            `}>
              {room.housekeepingStatus.replace('_', ' ')}
            </span>
          </div>
        )}

        {/* Rate */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Rate:</span>
          <span className="text-lg font-semibold text-green-600">
            ${room.rate || room.dailyRate || 0}/night
          </span>
        </div>

        {/* Amenities */}
        {room.amenities && room.amenities.length > 0 && (
          <div className="mb-3">
            <span className="text-sm font-medium text-gray-700 mb-2 block">Amenities:</span>
            <div className="flex flex-wrap gap-1">
              {room.amenities.slice(0, 3).map((amenity, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                >
                  {amenity}
                </span>
              ))}
              {room.amenities.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                  +{room.amenities.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Maintenance Issues */}
        {room.maintenanceIssues && room.maintenanceIssues.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 text-orange-600">
              <span className="text-sm font-medium">⚠️ {room.maintenanceIssues.length} Issue(s)</span>
            </div>
          </div>
        )}

        {/* Last Cleaned */}
        {room.lastCleaned && (
          <div className="text-xs text-gray-500">
            Last cleaned: {new Date(room.lastCleaned).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-lg">
        <div className="flex gap-2">
          {room.status !== 'AVAILABLE' && (
            <button
              className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
              onClick={(e) => handleStatusChange(e, 'AVAILABLE')}
              disabled={updateStatus.isPending}
            >
              Mark Available
            </button>
          )}
          {room.status !== 'CLEANING' && (
            <button
              className="px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 transition-colors"
              onClick={(e) => handleStatusChange(e, 'CLEANING')}
              disabled={updateStatus.isPending}
            >
              Mark Cleaning
            </button>
          )}
          {room.status !== 'MAINTENANCE' && (
            <button
              className="px-3 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700 transition-colors"
              onClick={(e) => handleStatusChange(e, 'MAINTENANCE')}
              disabled={updateStatus.isPending}
            >
              Maintenance
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomCard;