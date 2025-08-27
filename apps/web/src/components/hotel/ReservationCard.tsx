import React from 'react';
import { Reservation, ReservationStatus, PaymentStatus } from '../../types/hotel';
import { useCheckIn, useCheckOut, useCancelReservation } from '../../hooks/useHotel';

interface ReservationCardProps {
  reservation: Reservation;
  onClick?: (reservation: Reservation) => void;
  compact?: boolean;
}

const statusColors: Record<ReservationStatus, string> = {
  CONFIRMED: 'bg-green-100 text-green-800 border-green-200',
  CHECKED_IN: 'bg-blue-100 text-blue-800 border-blue-200',
  CHECKED_OUT: 'bg-gray-100 text-gray-800 border-gray-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  NO_SHOW: 'bg-orange-100 text-orange-800 border-orange-200',
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
};

const paymentColors: Record<PaymentStatus, string> = {
  PENDING: 'text-yellow-600',
  PARTIAL: 'text-orange-600',
  PAID: 'text-green-600',
  REFUNDED: 'text-blue-600',
  FAILED: 'text-red-600',
};

const ReservationCard: React.FC<ReservationCardProps> = ({ reservation, onClick, compact = false }) => {
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const cancelReservation = useCancelReservation();

  const handleCheckIn = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to check in this guest?')) {
      await checkIn.mutateAsync({ id: reservation.id, roomId: reservation.roomId });
    }
  };

  const handleCheckOut = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to check out this guest?')) {
      await checkOut.mutateAsync(reservation.id);
    }
  };

  const handleCancel = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const reason = window.prompt('Please provide a cancellation reason:');
    if (reason) {
      await cancelReservation.mutateAsync({ id: reservation.id, reason });
    }
  };

  const getStatusIcon = (status: ReservationStatus) => {
    switch (status) {
      case 'CONFIRMED': return '✅';
      case 'CHECKED_IN': return '🏠';
      case 'CHECKED_OUT': return '🚪';
      case 'CANCELLED': return '❌';
      case 'NO_SHOW': return '👻';
      case 'PENDING': return '⏳';
      default: return '❓';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  const getDuration = () => {
    const checkIn = new Date(reservation.checkInDate);
    const checkOut = new Date(reservation.checkOutDate);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    return nights;
  };

  if (compact) {
    return (
      <div
        className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onClick?.(reservation)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
              {reservation.guest.firstName[0]}{reservation.guest.lastName[0]}
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {reservation.guest.firstName} {reservation.guest.lastName}
              </div>
              <div className="text-sm text-gray-600">
                {reservation.confirmationNumber}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className={`
              px-2 py-1 rounded-full text-xs font-medium border
              ${statusColors[reservation.status]}
            `}>
              {getStatusIcon(reservation.status)} {reservation.status.replace('_', ' ')}
            </span>
            <div className="text-sm text-gray-600 mt-1">
              {formatDate(reservation.checkInDate)} - {formatDate(reservation.checkOutDate)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={() => onClick?.(reservation)}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              {reservation.guest.firstName[0]}{reservation.guest.lastName[0]}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {reservation.guest.firstName} {reservation.guest.lastName}
              </h3>
              <p className="text-sm text-gray-600">
                {reservation.confirmationNumber}
              </p>
            </div>
          </div>
          <span className={`
            px-3 py-1 rounded-full text-xs font-medium border
            ${statusColors[reservation.status]}
          `}>
            {getStatusIcon(reservation.status)} {reservation.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Dates and Duration */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm font-medium text-gray-700">Check-in</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatDate(reservation.checkInDate)}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700">Check-out</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatDate(reservation.checkOutDate)}
            </div>
          </div>
        </div>

        {/* Room and Guests */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm font-medium text-gray-700">Room</div>
            <div className="font-semibold text-gray-900">
              {reservation.room?.number || 'TBD'} ({reservation.roomType.name})
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700">Guests</div>
            <div className="font-semibold text-gray-900">
              {reservation.adults} adults{reservation.children > 0 && `, ${reservation.children} children`}
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm font-medium text-gray-700">Total Amount</div>
            <div className="text-xl font-bold text-green-600">
              ${reservation.totalAmount.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              ${reservation.rate}/night × {getDuration()} nights
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700">Payment Status</div>
            <div className={`font-semibold ${paymentColors[reservation.paymentStatus]}`}>
              {reservation.paymentStatus}
            </div>
            <div className="text-xs text-gray-500">
              Paid: ${reservation.paidAmount.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Source and Special Requests */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
            {reservation.source.replace('_', ' ')}
          </span>
          {reservation.specialRequests.slice(0, 2).map((request, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
            >
              {request}
            </span>
          ))}
          {reservation.specialRequests.length > 2 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
              +{reservation.specialRequests.length - 2} more
            </span>
          )}
        </div>

        {/* Contact Info */}
        <div className="text-sm text-gray-600">
          <div>📧 {reservation.guest.email}</div>
          <div>📱 {reservation.guest.phone}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-lg">
        <div className="flex gap-2">
          {reservation.status === 'CONFIRMED' && (
            <button
              className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
              onClick={handleCheckIn}
              disabled={checkIn.isPending}
            >
              Check In
            </button>
          )}
          {reservation.status === 'CHECKED_IN' && (
            <button
              className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
              onClick={handleCheckOut}
              disabled={checkOut.isPending}
            >
              Check Out
            </button>
          )}
          {['CONFIRMED', 'PENDING'].includes(reservation.status) && (
            <button
              className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
              onClick={handleCancel}
              disabled={cancelReservation.isPending}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReservationCard;