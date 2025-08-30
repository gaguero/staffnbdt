import React from 'react';
import { Guest } from '../../types/hotel';

interface GuestCardProps {
  guest: Guest;
  onClick?: (guest: Guest) => void;
  compact?: boolean;
}

const GuestCard: React.FC<GuestCardProps> = ({ guest, onClick, compact = false }) => {
  const getInitials = (firstName?: string, lastName?: string) => {
    const firstInitial = (firstName || '').charAt(0);
    const lastInitial = (lastName || '').charAt(0);
    const initials = `${firstInitial}${lastInitial}`.toUpperCase();
    return initials || '?';
  };

  const getStatusBadge = () => {
    if (guest.blacklisted) {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
          ⚠️ Blacklisted
        </span>
      );
    }
    if (guest.vipStatus) {
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
          ⭐ VIP
        </span>
      );
    }
    return null;
  };

  if (compact) {
    return (
      <div
        className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onClick?.(guest)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
            {getInitials(guest.firstName, guest.lastName)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900 truncate">
                {guest.firstName} {guest.lastName}
              </h3>
              {getStatusBadge()}
            </div>
            <p className="text-sm text-gray-600 truncate">{guest.email}</p>
          </div>
          <div className="text-right text-sm">
            <div className="font-medium text-gray-900">{guest.totalStays} stays</div>
            <div className="text-gray-600">${Number(guest.totalSpent ?? 0).toLocaleString()}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={() => onClick?.(guest)}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
            {getInitials(guest.firstName, guest.lastName)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-semibold text-gray-900">
                {guest.firstName} {guest.lastName}
              </h3>
              {getStatusBadge()}
            </div>
            <p className="text-gray-600">{guest.email}</p>
            {guest.phone && (
              <p className="text-sm text-gray-500">{guest.phone}</p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm font-medium text-gray-700">Total Stays</div>
            <div className="text-2xl font-bold text-blue-600">{guest.totalStays}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700">Total Spent</div>
            <div className="text-2xl font-bold text-green-600">
              ${Number(guest.totalSpent ?? 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Guest Info */}
        <div className="space-y-2 text-sm">
          {guest.nationality && (
            <div className="flex justify-between">
              <span className="text-gray-600">Nationality:</span>
              <span className="font-medium">{guest.nationality}</span>
            </div>
          )}
          {guest.dateOfBirth && (
            <div className="flex justify-between">
              <span className="text-gray-600">Date of Birth:</span>
              <span className="font-medium">
                {new Date(guest.dateOfBirth).toLocaleDateString()}
              </span>
            </div>
          )}
          {guest.lastStayDate && (
            <div className="flex justify-between">
              <span className="text-gray-600">Last Stay:</span>
              <span className="font-medium">
                {new Date(guest.lastStayDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Preferences */}
        {(guest.preferences?.roomType || 
          guest.preferences?.specialRequests?.length || 
          guest.preferences?.dietaryRestrictions?.length) && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Preferences</h4>
            <div className="flex flex-wrap gap-1">
              {guest.preferences.roomType && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  {guest.preferences.roomType}
                </span>
              )}
              {guest.preferences.smoking && (
                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                  Smoking
                </span>
              )}
              {guest.preferences.specialRequests?.slice(0, 2).map((request, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                >
                  {request}
                </span>
              ))}
              {(guest.preferences.specialRequests?.length || 0) > 2 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                  +{(guest.preferences.specialRequests?.length || 0) - 2} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {guest.notes && guest.notes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
              {guest.notes[0]}
              {guest.notes.length > 1 && (
                <span className="text-xs text-gray-500 ml-1">
                  (+{guest.notes.length - 1} more)
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 rounded-b-lg">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>
            Member since {new Date(guest.createdAt).toLocaleDateString()}
          </span>
          <span>
            Updated {new Date(guest.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GuestCard;