import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CreateRoomInput, RoomType } from '../../types/hotel';
import { useCreateRoom, useUpdateRoom, useRoomTypes } from '../../hooks/useHotel';
import { Room } from '../../types/hotel';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  room?: Room;
  mode?: 'create' | 'edit';
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  room,
  mode = 'create'
}) => {
  const [amenitiesInput, setAmenitiesInput] = useState('');
  
  const { data: roomTypes } = useRoomTypes();
  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<CreateRoomInput>();

  const watchedAmenities = watch('amenities', []);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && room) {
        setValue('number', room.number);
        setValue('typeId', room.type?.id || '');
        setValue('floor', room.floor);
        setValue('capacity', room.capacity);
        setValue('amenities', room.amenities || []);
        setValue('description', room.description || '');
        setValue('rate', room.rate);
        setAmenitiesInput((room.amenities || []).join(', '));
      } else {
        reset();
        setAmenitiesInput('');
      }
    }
  }, [isOpen, mode, room, setValue, reset]);

  const handleAmenitiesChange = (value: string) => {
    setAmenitiesInput(value);
    const amenitiesArray = value
      .split(',')
      .map(a => a.trim())
      .filter(a => a.length > 0);
    setValue('amenities', amenitiesArray);
  };

  const onSubmit = async (data: CreateRoomInput) => {
    try {
      if (mode === 'edit' && room) {
        await updateRoom.mutateAsync({
          id: room.id,
          room: data
        });
      } else {
        await createRoom.mutateAsync(data);
      }
      onClose();
      reset();
      setAmenitiesInput('');
    } catch (error) {
      console.error('Error saving room:', error);
    }
  };

  if (!isOpen) return null;

  const isLoading = createRoom.isPending || updateRoom.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'edit' ? 'Edit Room' : 'Create New Room'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Room Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Number *
              </label>
              <input
                type="text"
                {...register('number', { required: 'Room number is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 101, 201A"
              />
              {errors.number && (
                <p className="mt-1 text-sm text-red-600">{errors.number.message}</p>
              )}
            </div>

            {/* Room Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Type *
              </label>
              <select
                {...register('typeId', { required: 'Room type is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select room type</option>
                {roomTypes?.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} - ${type.baseRate}/night
                  </option>
                ))}
              </select>
              {errors.typeId && (
                <p className="mt-1 text-sm text-red-600">{errors.typeId.message}</p>
              )}
            </div>

            {/* Floor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Floor *
              </label>
              <input
                type="number"
                {...register('floor', { 
                  required: 'Floor is required',
                  min: { value: 1, message: 'Floor must be at least 1' },
                  max: { value: 50, message: 'Floor cannot exceed 50' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 1, 2, 3"
              />
              {errors.floor && (
                <p className="mt-1 text-sm text-red-600">{errors.floor.message}</p>
              )}
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacity *
              </label>
              <input
                type="number"
                {...register('capacity', { 
                  required: 'Capacity is required',
                  min: { value: 1, message: 'Capacity must be at least 1' },
                  max: { value: 10, message: 'Capacity cannot exceed 10' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 2, 4"
              />
              {errors.capacity && (
                <p className="mt-1 text-sm text-red-600">{errors.capacity.message}</p>
              )}
            </div>

            {/* Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rate per Night *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  {...register('rate', { 
                    required: 'Rate is required',
                    min: { value: 0.01, message: 'Rate must be greater than 0' }
                  })}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              {errors.rate && (
                <p className="mt-1 text-sm text-red-600">{errors.rate.message}</p>
              )}
            </div>
          </div>

          {/* Amenities */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amenities
            </label>
            <input
              type="text"
              value={amenitiesInput}
              onChange={(e) => handleAmenitiesChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Wi-Fi, Air Conditioning, TV, Minibar (comma-separated)"
            />
            {watchedAmenities.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {watchedAmenities.map((amenity, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Optional description of the room..."
            />
          </div>

          {/* Actions */}
          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : mode === 'edit' ? 'Update Room' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoomModal;