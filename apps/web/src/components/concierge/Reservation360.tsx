import React, { useState } from 'react';
import { useReservationChecklist, useCreateConciergeObject, useCompleteConciergeObject, useObjectTypes } from '../../hooks/useConcierge';
import { ChecklistItem, CreateConciergeObjectInput } from '../../types/concierge';
import { Reservation } from '../../types/hotel';
import LoadingSpinner from '../LoadingSpinner';
import ErrorDisplay from '../ErrorDisplay';
import { format, getRelativeTime, isOverdue } from '../../utils/dateUtils';
import { toast } from 'react-hot-toast';

interface ReservationHeaderProps {
  reservation: Reservation;
}

const ReservationHeader: React.FC<ReservationHeaderProps> = ({ reservation }) => {
  const statusColors = {
    'CONFIRMED': 'bg-blue-100 text-blue-800',
    'CHECKED_IN': 'bg-green-100 text-green-800',
    'CHECKED_OUT': 'bg-gray-100 text-gray-800',
    'CANCELLED': 'bg-red-100 text-red-800',
    'NO_SHOW': 'bg-orange-100 text-orange-800',
    'PENDING': 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        {/* Reservation Info */}
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h2 className="text-xl font-semibold text-gray-900">
              {reservation.confirmationNumber}
            </h2>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
              statusColors[reservation.status] || 'bg-gray-100 text-gray-800'
            }`}>
              {reservation.status.replace('_', ' ')}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Guest</p>
              <p className="font-medium text-gray-900">
                {reservation.guest.firstName} {reservation.guest.lastName}
              </p>
            </div>
            
            <div>
              <p className="text-gray-500">Dates</p>
              <p className="font-medium text-gray-900">
                {format(reservation.checkInDate, 'MMM d')} - {format(reservation.checkOutDate, 'MMM d')}
              </p>
            </div>
            
            <div>
              <p className="text-gray-500">Room</p>
              <p className="font-medium text-gray-900">
                {reservation.room?.number || 'TBD'} ({reservation.roomType.name})
              </p>
            </div>
            
            <div>
              <p className="text-gray-500">Guests</p>
              <p className="font-medium text-gray-900">
                {reservation.adults} adults{reservation.children > 0 && `, ${reservation.children} children`}
              </p>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 lg:pl-6">
          <button className="btn btn-outline btn-sm">
            📞 Contact Guest
          </button>
          <button className="btn btn-outline btn-sm">
            📝 Add Note
          </button>
          <button className="btn btn-outline btn-sm">
            📄 View Details
          </button>
        </div>
      </div>
    </div>
  );
};

interface ChecklistItemCardProps {
  item: ChecklistItem;
  onComplete: (itemId: string) => void;
  onEdit: (item: ChecklistItem) => void;
  loading?: boolean;
}

const ChecklistItemCard: React.FC<ChecklistItemCardProps> = ({
  item,
  onComplete,
  onEdit,
  loading = false,
}) => {
  const statusColors = {
    open: 'bg-blue-50 border-blue-200',
    in_progress: 'bg-yellow-50 border-yellow-200',
    completed: 'bg-green-50 border-green-200',
    cancelled: 'bg-gray-50 border-gray-200',
    overdue: 'bg-red-50 border-red-200',
  };

  const statusIcons = {
    open: '⭕',
    in_progress: '🔄',
    completed: '✅',
    cancelled: '❌',
    overdue: '🚨',
  };

  const isItemOverdue = item.dueAt && isOverdue(item.dueAt);
  const actualStatus = isItemOverdue && item.status !== 'completed' ? 'overdue' : item.status;
  
  return (
    <div className={`${statusColors[actualStatus]} border rounded-lg p-4`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <span className="text-lg mt-0.5">{statusIcons[actualStatus]}</span>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-medium text-gray-900">{item.title}</h4>
              {item.isRequired && (
                <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full font-medium">
                  Required
                </span>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mb-2">{item.type.replace('_', ' ')}</p>
            
            {item.dueAt && (
              <p className={`text-xs ${
                isItemOverdue ? 'text-red-600 font-medium' : 'text-gray-500'
              }`}>
                Due: {format(item.dueAt, 'MMM d, h:mm a')} ({getRelativeTime(item.dueAt)})
              </p>
            )}
            
            {item.completedAt && (
              <p className="text-xs text-green-600">
                Completed: {format(item.completedAt, 'MMM d, h:mm a')}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2 ml-4">
          {item.status !== 'completed' && (
            <button
              onClick={() => onComplete(item.id)}
              disabled={loading}
              className="btn btn-sm btn-success flex items-center space-x-1 hover:scale-105 transition-transform duration-200 relative overflow-hidden"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin text-white">⚡</div>
                  <span>Completing...</span>
                </div>
              ) : (
                <>
                  <span className="hover:animate-bounce">✓</span>
                  <span>Complete</span>
                </>
              )}
            </button>
          )}
          
          <button
            onClick={() => onEdit(item)}
            className="btn btn-sm btn-outline"
          >
            ✏️ Edit
          </button>
        </div>
      </div>
    </div>
  );
};

interface ExceptionsPanelProps {
  items: ChecklistItem[];
}

const ExceptionsPanel: React.FC<ExceptionsPanelProps> = ({ items }) => {
  const exceptions = items.filter(item => {
    const isItemOverdue = item.dueAt && isOverdue(item.dueAt);
    return (isItemOverdue && item.status !== 'completed') || 
           (item.isRequired && item.status === 'open');
  });

  if (exceptions.length === 0) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 transform transition-all duration-300 hover:scale-105">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-3xl animate-bounce">🎆</div>
            <div>
              <h3 className="font-bold text-green-800 text-lg">Everything Perfect!</h3>
              <p className="text-sm text-green-600">All requirements met and nothing overdue. Outstanding work!</p>
            </div>
          </div>
          <div className="bg-green-100 px-3 py-1 rounded-full">
            <span className="text-xs font-medium text-green-800">✨ Flawless</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center space-x-3 mb-3">
        <span className="text-2xl">🚨</span>
        <div>
          <h3 className="font-medium text-red-800">Attention Required</h3>
          <p className="text-sm text-red-600">
            {exceptions.length} item{exceptions.length !== 1 ? 's' : ''} need{exceptions.length === 1 ? 's' : ''} attention
          </p>
        </div>
      </div>
      
      <div className="space-y-2">
        {exceptions.map(item => {
          const isItemOverdue = item.dueAt && isOverdue(item.dueAt);
          return (
            <div key={item.id} className="flex items-center space-x-3 text-sm">
              <span>{isItemOverdue ? '🔥' : '⚠️'}</span>
              <span className="flex-1">
                {item.title} - 
                {isItemOverdue ? ' Overdue!' : ' Required but not started'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservationId: string;
  onTaskCreated: () => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  reservationId,
  onTaskCreated,
}) => {
  const { data: objectTypes } = useObjectTypes();
  const createObject = useCreateConciergeObject();
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    dueAt: '',
    isRequired: false,
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.type || !formData.title) {
      toast.error('Please fill in required fields');
      return;
    }

    const input: CreateConciergeObjectInput = {
      type: formData.type,
      reservationId,
      dueAt: formData.dueAt ? new Date(formData.dueAt) : undefined,
      attributes: {
        title: formData.title,
        isRequired: formData.isRequired,
        notes: formData.notes,
      },
    };

    try {
      await createObject.mutateAsync(input);
      onTaskCreated();
      onClose();
      setFormData({
        type: '',
        title: '',
        dueAt: '',
        isRequired: false,
        notes: '',
      });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Create New Task</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select task type...</option>
              {objectTypes?.data?.map(type => (
                <option key={type.id} value={type.name}>
                  {type.name}
                </option>
              )) || [
                <option key="welcome_amenities" value="welcome_amenities">Welcome Amenities</option>,
                <option key="spa_booking" value="spa_booking">Spa Booking</option>,
                <option key="restaurant_reservation" value="restaurant_reservation">Restaurant Reservation</option>,
                <option key="transportation" value="transportation">Transportation</option>,
                <option key="special_request" value="special_request">Special Request</option>,
              ]}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Brief description of the task"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="datetime-local"
              value={formData.dueAt}
              onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isRequired"
              checked={formData.isRequired}
              onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isRequired" className="text-sm text-gray-700">
              Required task
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional details or instructions"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={createObject.isPending}
              className="flex-1 btn btn-primary"
            >
              {createObject.isPending ? <LoadingSpinner size="sm" /> : 'Create Task'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn btn-outline"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface Reservation360Props {
  reservation: Reservation;
}

const Reservation360: React.FC<Reservation360Props> = ({ reservation }) => {
  const { data: checklistData, isLoading, error, refetch } = useReservationChecklist(reservation.id);
  const completeObject = useCompleteConciergeObject();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [completingItems, setCompletingItems] = useState<Set<string>>(new Set());

  const handleCompleteItem = async (itemId: string) => {
    setCompletingItems(prev => new Set(prev).add(itemId));
    
    try {
      await completeObject.mutateAsync({ id: itemId });
    } finally {
      setCompletingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleEditItem = (_item: ChecklistItem) => {
    // This would open an edit modal in a real implementation
    toast('Edit functionality not implemented yet');
  };

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
        message="Failed to load reservation checklist"
        onRetry={refetch}
      />
    );
  }

  const checklist = checklistData?.data;
  const items = checklist?.items || [];
  const completedCount = checklist?.completedCount || 0;
  const totalCount = checklist?.totalCount || 0;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Reservation Header */}
      <ReservationHeader reservation={reservation} />

      {/* Progress Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Checklist Progress</h3>
            <p className="text-sm text-gray-600">
              {completedCount} of {totalCount} tasks completed
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{progressPercentage}%</p>
              <p className="text-xs text-gray-500">Complete</p>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary btn-sm flex items-center space-x-2 hover:scale-105 transition-transform duration-200"
            >
              <span className="hover:animate-pulse">✨</span>
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Progress Bar with Celebration */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden relative">
          <div
            className={`h-3 rounded-full transition-all duration-700 ease-out relative ${
              progressPercentage === 100 
                ? 'bg-gradient-to-r from-green-400 via-emerald-500 to-green-600 animate-pulse'
                : progressPercentage >= 75
                ? 'bg-gradient-to-r from-blue-400 to-blue-600'
                : progressPercentage >= 50
                ? 'bg-gradient-to-r from-yellow-400 to-blue-500' 
                : 'bg-gradient-to-r from-red-400 to-yellow-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          >
            {progressPercentage === 100 && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-ping"></div>
            )}
          </div>
          {progressPercentage === 100 && (
            <div className="absolute right-2 top-0 h-full flex items-center">
              <span className="text-xs animate-bounce">🎉</span>
            </div>
          )}
        </div>
      </div>

      {/* Exceptions Panel */}
      <ExceptionsPanel items={items} />

      {/* Checklist Items */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Required Items</h3>
          <p className="text-sm text-gray-600">Tasks and requirements for this reservation</p>
        </div>
        
        <div className="p-6">
          {items.length === 0 ? (
            <div className="text-center py-12 transform transition-all duration-300 hover:scale-105">
              <div className="text-6xl mb-4 animate-pulse">🌟</div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 max-w-md mx-auto">
                <h4 className="text-xl font-bold text-blue-800 mb-2">
                  Ready to Begin!
                </h4>
                <p className="text-blue-600 mb-6">
                  This reservation is waiting for its first task. Let's create something amazing for your guests!
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn btn-primary hover:scale-105 transition-transform duration-200 flex items-center space-x-2 mx-auto"
                >
                  <span>✨</span>
                  <span>Create First Task</span>
                  <span>🚀</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map(item => (
                <ChecklistItemCard
                  key={item.id}
                  item={item}
                  onComplete={handleCompleteItem}
                  onEdit={handleEditItem}
                  loading={completingItems.has(item.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        reservationId={reservation.id}
        onTaskCreated={() => refetch()}
      />
    </div>
  );
};

export default Reservation360;
