import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelService } from '../services/hotelService';
import {
  RoomFilter,
  GuestFilter,
  ReservationFilter,
  CreateRoomInput,
  UpdateRoomInput,
  CreateGuestInput,
  CreateReservationInput,
} from '../types/hotel';
import { toast } from 'react-hot-toast';

// Query Keys
export const hotelQueryKeys = {
  all: ['hotel'] as const,
  rooms: () => [...hotelQueryKeys.all, 'rooms'] as const,
  roomsList: (filters?: RoomFilter) => [...hotelQueryKeys.rooms(), 'list', filters] as const,
  room: (id: string) => [...hotelQueryKeys.rooms(), 'detail', id] as const,
  roomTypes: () => [...hotelQueryKeys.rooms(), 'types'] as const,
  roomAvailability: (startDate: Date, endDate: Date) => [...hotelQueryKeys.rooms(), 'availability', startDate.toISOString(), endDate.toISOString()] as const,
  
  guests: () => [...hotelQueryKeys.all, 'guests'] as const,
  guestsList: (filters?: GuestFilter) => [...hotelQueryKeys.guests(), 'list', filters] as const,
  guest: (id: string) => [...hotelQueryKeys.guests(), 'detail', id] as const,
  guestHistory: (id: string) => [...hotelQueryKeys.guests(), 'history', id] as const,
  
  reservations: () => [...hotelQueryKeys.all, 'reservations'] as const,
  reservationsList: (filters?: ReservationFilter) => [...hotelQueryKeys.reservations(), 'list', filters] as const,
  reservation: (id: string) => [...hotelQueryKeys.reservations(), 'detail', id] as const,
  
  stats: () => [...hotelQueryKeys.all, 'stats'] as const,
  arrivals: () => [...hotelQueryKeys.all, 'arrivals'] as const,
  departures: () => [...hotelQueryKeys.all, 'departures'] as const,
  inHouse: () => [...hotelQueryKeys.all, 'in-house'] as const,
};

// Room Hooks
export function useRooms(filters?: RoomFilter) {
  return useQuery({
    queryKey: hotelQueryKeys.roomsList(filters),
    queryFn: () => hotelService.getRooms(filters),
    select: (data) => data.data,
  });
}

export function useRoom(id: string) {
  return useQuery({
    queryKey: hotelQueryKeys.room(id),
    queryFn: () => hotelService.getRoom(id),
    select: (data) => data.data,
    enabled: !!id,
  });
}

export function useRoomTypes() {
  return useQuery({
    queryKey: hotelQueryKeys.roomTypes(),
    queryFn: () => hotelService.getRoomTypes(),
    select: (data) => data.data,
  });
}

export function useRoomAvailability(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: hotelQueryKeys.roomAvailability(startDate, endDate),
    queryFn: () => hotelService.getRoomAvailability(startDate, endDate),
    select: (data) => data.data,
    enabled: !!startDate && !!endDate,
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (room: CreateRoomInput) => hotelService.createRoom(room),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hotelQueryKeys.rooms() });
      toast.success('Room created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create room');
    },
  });
}

export function useUpdateRoom() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, room }: { id: string; room: UpdateRoomInput }) => 
      hotelService.updateRoom(id, room),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: hotelQueryKeys.rooms() });
      queryClient.invalidateQueries({ queryKey: hotelQueryKeys.room(variables.id) });
      toast.success('Room updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update room');
    },
  });
}

export function useUpdateRoomStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      hotelService.updateRoomStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: hotelQueryKeys.rooms() });
      queryClient.invalidateQueries({ queryKey: hotelQueryKeys.room(variables.id) });
      toast.success('Room status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update room status');
    },
  });
}

// Guest Hooks
export function useGuests(filters?: GuestFilter) {
  return useQuery({
    queryKey: hotelQueryKeys.guestsList(filters),
    queryFn: () => hotelService.getGuests(filters),
    select: (data) => data.data,
  });
}

export function useGuest(id: string) {
  return useQuery({
    queryKey: hotelQueryKeys.guest(id),
    queryFn: () => hotelService.getGuest(id),
    select: (data) => data.data,
    enabled: !!id,
  });
}

export function useGuestHistory(id: string) {
  return useQuery({
    queryKey: hotelQueryKeys.guestHistory(id),
    queryFn: () => hotelService.getGuestHistory(id),
    select: (data) => data.data,
    enabled: !!id,
  });
}

export function useCreateGuest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (guest: CreateGuestInput) => hotelService.createGuest(guest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hotelQueryKeys.guests() });
      toast.success('Guest created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create guest');
    },
  });
}

export function useUpdateGuest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, guest }: { id: string; guest: Partial<CreateGuestInput> }) => 
      hotelService.updateGuest(id, guest),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: hotelQueryKeys.guests() });
      queryClient.invalidateQueries({ queryKey: hotelQueryKeys.guest(variables.id) });
      toast.success('Guest updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update guest');
    },
  });
}

// Reservation Hooks
export function useReservations(filters?: ReservationFilter) {
  return useQuery({
    queryKey: hotelQueryKeys.reservationsList(filters),
    queryFn: () => hotelService.getReservations(filters),
    select: (data) => data.data,
  });
}

export function useReservation(id: string) {
  return useQuery({
    queryKey: hotelQueryKeys.reservation(id),
    queryFn: () => hotelService.getReservation(id),
    select: (data) => data.data,
    enabled: !!id,
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (reservation: CreateReservationInput) => hotelService.createReservation(reservation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hotelQueryKeys.reservations() });
      queryClient.invalidateQueries({ queryKey: hotelQueryKeys.stats() });
      toast.success('Reservation created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create reservation');
    },
  });
}

export function useUpdateReservation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, reservation }: { id: string; reservation: Partial<CreateReservationInput> }) => 
      hotelService.updateReservation(id, reservation),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: hotelQueryKeys.reservations() });
      queryClient.invalidateQueries({ queryKey: hotelQueryKeys.reservation(variables.id) });
      queryClient.invalidateQueries({ queryKey: hotelQueryKeys.stats() });
      toast.success('Reservation updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update reservation');
    },
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, roomId }: { id: string; roomId?: string }) => 
      hotelService.checkIn(id, roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hotelQueryKeys.reservations() });
      queryClient.invalidateQueries({ queryKey: hotelQueryKeys.rooms() });
      queryClient.invalidateQueries({ queryKey: hotelQueryKeys.stats() });
      queryClient.invalidateQueries({ queryKey: hotelQueryKeys.inHouse() });
      toast.success('Guest checked in successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to check in guest');
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => hotelService.checkOut(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hotelQueryKeys.reservations() });
      queryClient.invalidateQueries({ queryKey: hotelQueryKeys.rooms() });
      queryClient.invalidateQueries({ queryKey: hotelQueryKeys.stats() });
      queryClient.invalidateQueries({ queryKey: hotelQueryKeys.inHouse() });
      toast.success('Guest checked out successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to check out guest');
    },
  });
}

export function useCancelReservation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => 
      hotelService.cancelReservation(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hotelQueryKeys.reservations() });
      queryClient.invalidateQueries({ queryKey: hotelQueryKeys.stats() });
      toast.success('Reservation cancelled successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel reservation');
    },
  });
}

// Dashboard Hooks
export function useHotelStats() {
  return useQuery({
    queryKey: hotelQueryKeys.stats(),
    queryFn: () => hotelService.getHotelStats(),
    select: (data) => data.data,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useTodayArrivals() {
  return useQuery({
    queryKey: hotelQueryKeys.arrivals(),
    queryFn: () => hotelService.getTodayArrivals(),
    select: (data) => data.data,
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useTodayDepartures() {
  return useQuery({
    queryKey: hotelQueryKeys.departures(),
    queryFn: () => hotelService.getTodayDepartures(),
    select: (data) => data.data,
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useInHouseGuests() {
  return useQuery({
    queryKey: hotelQueryKeys.inHouse(),
    queryFn: () => hotelService.getInHouseGuests(),
    select: (data) => data.data,
    refetchInterval: 60000, // Refetch every minute
  });
}