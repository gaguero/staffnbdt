import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CreateReservationInput, Reservation, ReservationSource } from '../../types/hotel';
import { useCreateReservation, useUpdateReservation } from '../../hooks/useHotel';
import { hotelService } from '../../services/hotelService';

// Form data type that matches HTML form inputs
interface ReservationFormData {
  guestId?: string;
  guest?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  roomTypeId: string;
  roomId?: string;
  checkInDate: string; // HTML date input returns string
  checkOutDate: string; // HTML date input returns string
  adults: number;
  children?: number;
  rate: number;
  source: ReservationSource;
  paymentMethod?: string;
  specialRequests?: string; // Form handles as string, will convert to array
  notes?: string; // Form handles as string, will convert to array
}

interface CreateReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation?: Reservation;
  mode?: 'create' | 'edit';
}

const CreateReservationModal: React.FC<CreateReservationModalProps> = ({
  isOpen,
  onClose,
  reservation,
  mode = 'create'
}) => {
  const [step, setStep] = useState<'guest' | 'booking'>('guest');
  const [useExistingGuest, setUseExistingGuest] = useState(false);
  const [guestSearchResults, setGuestSearchResults] = useState<any[]>([]);
  const [selectedGuestId, setSelectedGuestId] = useState<string>('');
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [calculatedRate, setCalculatedRate] = useState<number>(0);
  
  const createReservation = useCreateReservation();
  const updateReservation = useUpdateReservation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<ReservationFormData>();

  const watchedCheckIn = watch('checkInDate');
  const watchedCheckOut = watch('checkOutDate');
  const watchedRoomTypeId = watch('roomTypeId');

  // Load room types on mount and handle availability checks
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        // Always load room types when modal opens
        await loadRoomTypes();
        
        // If editing, load guest data
        if (mode === 'edit' && reservation) {
          // Set form values for editing
          setValue('checkInDate', new Date(reservation.checkInDate).toISOString().split('T')[0]);
          setValue('checkOutDate', new Date(reservation.checkOutDate).toISOString().split('T')[0]);
          setValue('roomTypeId', reservation.roomType?.id || '');
          setValue('roomId', reservation.room?.id || '');
          setValue('adults', reservation.adults);
          setValue('children', reservation.children || 0);
          setValue('source', reservation.source);
          setValue('rate', reservation.rate);
          
          if (reservation.guest) {
            setSelectedGuestId(reservation.guest.id);
            setUseExistingGuest(true);
            setValue('guestId', reservation.guest.id);
          }
        } else {
          // Reset form for new reservation
          reset();
          setStep('guest');
          setUseExistingGuest(false);
          setSelectedGuestId('');
        }
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };

    loadData();
  }, [isOpen, mode, reservation, setValue, reset]);

  // Calculate rate and available rooms when dates/room type change
  useEffect(() => {
    if (isOpen && watchedCheckIn && watchedCheckOut && watchedRoomTypeId) {
      loadAvailableRooms();
    }
  }, [isOpen, watchedCheckIn, watchedCheckOut, watchedRoomTypeId]);

  const loadRoomTypes = async () => {
    try {
      const response = await hotelService.getRoomTypes();
      setRoomTypes(response.data || []);
    } catch (error) {
      console.error('Failed to load room types:', error);
      setRoomTypes([]); // Ensure we always have a fallback
      // Could add toast notification here for better user feedback
    }
  };

  const loadAvailableRooms = async () => {
    if (!watchedCheckIn || !watchedCheckOut || !watchedRoomTypeId) return;

    try {
      const response = await hotelService.searchRooms(
        watchedRoomTypeId,
        new Date(watchedCheckIn),
        new Date(watchedCheckOut)
      );
      setAvailableRooms(response.data || []);
      
      // Calculate rate based on room type
      const selectedRoomType = roomTypes.find(rt => rt.id === watchedRoomTypeId);
      if (selectedRoomType) {
        setCalculatedRate(selectedRoomType.baseRate);
        setValue('rate', selectedRoomType.baseRate);
      }
    } catch (error) {
      console.error('Failed to load available rooms:', error);
      setAvailableRooms([]);
      setCalculatedRate(0);
      // Could add toast notification here for better user feedback
    }
  };

  const searchGuests = async (query: string) => {
    if (query.length < 2) {
      setGuestSearchResults([]);
      return;
    }

    try {
      const response = await hotelService.searchGuests(query);
      setGuestSearchResults(response.data || []);
    } catch (error) {
      console.error('Failed to search guests:', error);
      setGuestSearchResults([]);
      // Could add toast notification here for better user feedback
    }
  };

  const handleGuestSelect = (guest: any) => {
    setSelectedGuestId(guest.id);
    setValue('guestId', guest.id);
    setGuestSearchResults([]);
  };

  const calculateTotal = () => {
    if (!watchedCheckIn || !watchedCheckOut || !calculatedRate) return 0;
    
    const checkIn = new Date(watchedCheckIn);
    const checkOut = new Date(watchedCheckOut);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    return nights * calculatedRate;
  };

  const onSubmit = async (data: ReservationFormData) => {
    try {
      const submissionData: CreateReservationInput = {
        guestId: data.guestId,
        guest: data.guest && data.guest.firstName ? {
          firstName: data.guest.firstName,
          lastName: data.guest.lastName || '',
          email: data.guest.email || '',
          phone: data.guest.phone || '',
          preferences: {
            smoking: false,
            specialRequests: [],
            dietaryRestrictions: [],
            communicationPreferences: {
              email: true,
              sms: false,
              phone: false
            }
          }
        } : undefined,
        roomTypeId: data.roomTypeId,
        roomId: data.roomId,
        checkInDate: new Date(data.checkInDate),
        checkOutDate: new Date(data.checkOutDate),
        numberOfGuests: (data.adults || 1) + (data.children || 0),
        adults: data.adults,
        children: data.children || 0,
        rate: data.rate,
        source: data.source,
        paymentMethod: data.paymentMethod,
        specialRequests: data.specialRequests ? (data.specialRequests.trim() ? data.specialRequests.trim().split('\n').map(req => req.trim()).filter(req => req.length > 0) : []) : [],
        notes: data.notes ? (data.notes.trim() ? data.notes.trim().split('\n').map(note => note.trim()).filter(note => note.length > 0) : []) : []
      };

      if (mode === 'edit' && reservation) {
        await updateReservation.mutateAsync({
          id: reservation.id,
          reservation: submissionData
        });
      } else {
        await createReservation.mutateAsync(submissionData);
      }
      
      onClose();
      // Reset all form and component state
      reset();
      setStep('guest');
      setUseExistingGuest(false);
      setSelectedGuestId('');
      setGuestSearchResults([]);
      setRoomTypes([]);
      setAvailableRooms([]);
      setCalculatedRate(0);
    } catch (error) {
      console.error('Error saving reservation:', error);
      // Could add toast notification here for better user feedback
      // toastService.error('Failed to save reservation. Please try again.');
    }
  };

  if (!isOpen) return null;

  const isLoading = createReservation.isPending || updateReservation.isPending;
  const totalAmount = calculateTotal();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'edit' ? 'Edit Reservation' : 'Create New Reservation'}
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

          {/* Step Indicator */}
          <div className="flex items-center mt-4">
            <div className={`flex items-center ${step === 'guest' ? 'text-blue-600' : 'text-green-600'}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                step === 'guest' ? 'border-blue-600 bg-blue-600 text-white' : 'border-green-600 bg-green-600 text-white'
              }`}>
                1
              </div>
              <span className="ml-2 font-medium">Guest Information</span>
            </div>
            <div className="flex-1 h-px bg-gray-300 mx-4" />
            <div className={`flex items-center ${step === 'booking' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                step === 'booking' ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
              }`}>
                2
              </div>
              <span className="ml-2 font-medium">Booking Details</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          {step === 'guest' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Guest Information</h3>
              
              {/* Guest Selection */}
              <div className="flex items-center gap-4 mb-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!useExistingGuest}
                    onChange={() => setUseExistingGuest(false)}
                    className="text-blue-600"
                  />
                  <span className="ml-2">New Guest</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={useExistingGuest}
                    onChange={() => setUseExistingGuest(true)}
                    className="text-blue-600"
                  />
                  <span className="ml-2">Existing Guest</span>
                </label>
              </div>

              {useExistingGuest ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Guest
                  </label>
                  <input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    onChange={(e) => searchGuests(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {guestSearchResults.length > 0 && (
                    <div className="mt-2 border border-gray-200 rounded-md max-h-40 overflow-y-auto">
                      {guestSearchResults.map((guest) => (
                        <button
                          key={guest.id}
                          type="button"
                          onClick={() => handleGuestSelect(guest)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                        >
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                            {guest.firstName[0]}{guest.lastName[0]}
                          </div>
                          <div>
                            <div className="font-medium">{guest.firstName} {guest.lastName}</div>
                            <div className="text-sm text-gray-600">{guest.email}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      {...register('guest.firstName', { 
                        required: !useExistingGuest ? 'First name is required' : false 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {!useExistingGuest && errors.guest?.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.guest.firstName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      {...register('guest.lastName', { 
                        required: !useExistingGuest ? 'Last name is required' : false 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {!useExistingGuest && errors.guest?.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.guest.lastName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      {...register('guest.email', { 
                        required: !useExistingGuest ? 'Email is required' : false,
                        pattern: !useExistingGuest ? {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: 'Please enter a valid email address'
                        } : undefined
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {!useExistingGuest && errors.guest?.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.guest.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      {...register('guest.phone', { 
                        required: !useExistingGuest ? 'Phone number is required' : false 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {!useExistingGuest && errors.guest?.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.guest.phone.message}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep('booking')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={(useExistingGuest && !selectedGuestId) || isLoading}
                >
                  {isLoading ? 'Loading...' : 'Next: Booking Details'}
                </button>
              </div>
            </div>
          )}

          {step === 'booking' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Booking Details</h3>
                <button
                  type="button"
                  onClick={() => setStep('guest')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  ← Back to Guest
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Check-in Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check-in Date *
                  </label>
                  <input
                    type="date"
                    {...register('checkInDate', { required: 'Check-in date is required' })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.checkInDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.checkInDate.message}</p>
                  )}
                </div>

                {/* Check-out Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check-out Date *
                  </label>
                  <input
                    type="date"
                    {...register('checkOutDate', { required: 'Check-out date is required' })}
                    min={watchedCheckIn ? (typeof watchedCheckIn === 'string' ? watchedCheckIn : new Date(watchedCheckIn).toISOString().split('T')[0]) : ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.checkOutDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.checkOutDate.message}</p>
                  )}
                </div>

                {/* Room Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Type *
                  </label>
                  <select
                    {...register('roomTypeId', { required: 'Room type is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select room type</option>
                    {roomTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name} - ${type.baseRate}/night
                      </option>
                    ))}
                  </select>
                  {errors.roomTypeId && (
                    <p className="mt-1 text-sm text-red-600">{errors.roomTypeId.message}</p>
                  )}
                </div>

                {/* Specific Room */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specific Room (Optional)
                  </label>
                  <select
                    {...register('roomId')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Auto-assign on check-in</option>
                    {availableRooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        Room {room.number} (Floor {room.floor})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Adults */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adults *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    {...register('adults', { 
                      required: 'Number of adults is required',
                      min: { value: 1, message: 'At least 1 adult required' }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.adults && (
                    <p className="mt-1 text-sm text-red-600">{errors.adults.message}</p>
                  )}
                </div>

                {/* Children */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Children
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    {...register('children')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Source */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Booking Source *
                  </label>
                  <select
                    {...register('source', { required: 'Booking source is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select source</option>
                    <option value="DIRECT">Direct</option>
                    <option value="BOOKING_COM">Booking.com</option>
                    <option value="EXPEDIA">Expedia</option>
                    <option value="AIRBNB">Airbnb</option>
                    <option value="PHONE">Phone</option>
                    <option value="WALK_IN">Walk-in</option>
                    <option value="OTHER">Other</option>
                  </select>
                  {errors.source && (
                    <p className="mt-1 text-sm text-red-600">{errors.source.message}</p>
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
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {errors.rate && (
                    <p className="mt-1 text-sm text-red-600">{errors.rate.message}</p>
                  )}
                </div>
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Requests
                </label>
                <textarea
                  {...register('specialRequests')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any special requests or notes..."
                />
              </div>

              {/* Total Summary */}
              {totalAmount > 0 && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium text-gray-900 mb-2">Booking Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Dates:</span>
                      <span>
                        {watchedCheckIn && new Date(watchedCheckIn).toLocaleDateString()} - 
                        {watchedCheckOut && new Date(watchedCheckOut).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rate per night:</span>
                      <span>${calculatedRate}</span>
                    </div>
                    <div className="flex justify-between font-medium text-base pt-2 border-t">
                      <span>Total Amount:</span>
                      <span className="text-green-600">${totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading || totalAmount === 0}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    mode === 'edit' ? 'Update Reservation' : 'Create Reservation'
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateReservationModal;