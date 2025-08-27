import api from './api';
import {
  Room,
  Guest,
  Reservation,
  RoomFilter,
  GuestFilter,
  ReservationFilter,
  CreateRoomInput,
  UpdateRoomInput,
  CreateGuestInput,
  CreateReservationInput,
  HotelStats,
  RoomAvailability,
  RoomType,
} from '../types/hotel';

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class HotelService {
  // Room Management
  async getRooms(filter?: RoomFilter): Promise<ApiResponse<PaginatedResponse<Room>>> {
    const params = new URLSearchParams();
    if (filter?.status) params.append('status', filter.status.join(','));
    if (filter?.type) params.append('type', filter.type);
    if (filter?.floor) params.append('floor', filter.floor.toString());
    if (filter?.housekeepingStatus) params.append('housekeepingStatus', filter.housekeepingStatus.join(','));
    if (filter?.search) params.append('search', filter.search);
    if (filter?.available !== undefined) params.append('available', filter.available.toString());
    if (filter?.dateRange) {
      params.append('startDate', filter.dateRange.start.toISOString());
      params.append('endDate', filter.dateRange.end.toISOString());
    }

    const response = await api.get(`/hotel/rooms?${params.toString()}`);
    return response.data;
  }

  async getRoom(id: string): Promise<ApiResponse<Room>> {
    const response = await api.get(`/hotel/rooms/${id}`);
    return response.data;
  }

  async createRoom(room: CreateRoomInput): Promise<ApiResponse<Room>> {
    const response = await api.post('/hotel/rooms', room);
    return response.data;
  }

  async updateRoom(id: string, room: UpdateRoomInput): Promise<ApiResponse<Room>> {
    const response = await api.patch(`/hotel/rooms/${id}`, room);
    return response.data;
  }

  async deleteRoom(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/hotel/rooms/${id}`);
    return response.data;
  }

  async updateRoomStatus(id: string, status: string): Promise<ApiResponse<Room>> {
    const response = await api.patch(`/hotel/rooms/${id}/status`, { status });
    return response.data;
  }

  async getRoomTypes(): Promise<ApiResponse<RoomType[]>> {
    const response = await api.get('/hotel/room-types');
    return response.data;
  }

  async getRoomAvailability(startDate: Date, endDate: Date): Promise<ApiResponse<RoomAvailability[]>> {
    const response = await api.get(`/hotel/rooms/availability?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
    return response.data;
  }

  // Guest Management
  async getGuests(filter?: GuestFilter): Promise<ApiResponse<PaginatedResponse<Guest>>> {
    const params = new URLSearchParams();
    if (filter?.search) params.append('search', filter.search);
    if (filter?.vipStatus !== undefined) params.append('vipStatus', filter.vipStatus.toString());
    if (filter?.nationality) params.append('nationality', filter.nationality);
    if (filter?.blacklisted !== undefined) params.append('blacklisted', filter.blacklisted.toString());
    if (filter?.lastStayDateRange) {
      params.append('lastStayStart', filter.lastStayDateRange.start.toISOString());
      params.append('lastStayEnd', filter.lastStayDateRange.end.toISOString());
    }

    const response = await api.get(`/hotel/guests?${params.toString()}`);
    return response.data;
  }

  async getGuest(id: string): Promise<ApiResponse<Guest>> {
    const response = await api.get(`/hotel/guests/${id}`);
    return response.data;
  }

  async createGuest(guest: CreateGuestInput): Promise<ApiResponse<Guest>> {
    const response = await api.post('/hotel/guests', guest);
    return response.data;
  }

  async updateGuest(id: string, guest: Partial<CreateGuestInput>): Promise<ApiResponse<Guest>> {
    const response = await api.patch(`/hotel/guests/${id}`, guest);
    return response.data;
  }

  async deleteGuest(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/hotel/guests/${id}`);
    return response.data;
  }

  async getGuestHistory(id: string): Promise<ApiResponse<Reservation[]>> {
    const response = await api.get(`/hotel/guests/${id}/history`);
    return response.data;
  }

  // Reservation Management
  async getReservations(filter?: ReservationFilter): Promise<ApiResponse<PaginatedResponse<Reservation>>> {
    const params = new URLSearchParams();
    if (filter?.status) params.append('status', filter.status.join(','));
    if (filter?.source) params.append('source', filter.source.join(','));
    if (filter?.paymentStatus) params.append('paymentStatus', filter.paymentStatus.join(','));
    if (filter?.search) params.append('search', filter.search);
    if (filter?.guestId) params.append('guestId', filter.guestId);
    if (filter?.roomId) params.append('roomId', filter.roomId);
    if (filter?.dateRange) {
      params.append('startDate', filter.dateRange.start.toISOString());
      params.append('endDate', filter.dateRange.end.toISOString());
    }
    if (filter?.checkInDateRange) {
      params.append('checkInStart', filter.checkInDateRange.start.toISOString());
      params.append('checkInEnd', filter.checkInDateRange.end.toISOString());
    }
    if (filter?.checkOutDateRange) {
      params.append('checkOutStart', filter.checkOutDateRange.start.toISOString());
      params.append('checkOutEnd', filter.checkOutDateRange.end.toISOString());
    }

    const response = await api.get(`/hotel/reservations?${params.toString()}`);
    return response.data;
  }

  async getReservation(id: string): Promise<ApiResponse<Reservation>> {
    const response = await api.get(`/hotel/reservations/${id}`);
    return response.data;
  }

  async createReservation(reservation: CreateReservationInput): Promise<ApiResponse<Reservation>> {
    const response = await api.post('/hotel/reservations', reservation);
    return response.data;
  }

  async updateReservation(id: string, reservation: Partial<CreateReservationInput>): Promise<ApiResponse<Reservation>> {
    const response = await api.patch(`/hotel/reservations/${id}`, reservation);
    return response.data;
  }

  async cancelReservation(id: string, reason: string): Promise<ApiResponse<Reservation>> {
    const response = await api.patch(`/hotel/reservations/${id}/cancel`, { reason });
    return response.data;
  }

  async checkIn(id: string, roomId?: string): Promise<ApiResponse<Reservation>> {
    const response = await api.patch(`/hotel/reservations/${id}/check-in`, roomId ? { roomId } : {});
    return response.data;
  }

  async checkOut(id: string): Promise<ApiResponse<Reservation>> {
    const response = await api.patch(`/hotel/reservations/${id}/check-out`);
    return response.data;
  }

  async noShow(id: string): Promise<ApiResponse<Reservation>> {
    const response = await api.patch(`/hotel/reservations/${id}/no-show`);
    return response.data;
  }

  // Dashboard Stats
  async getHotelStats(): Promise<ApiResponse<HotelStats>> {
    const response = await api.get('/hotel/stats');
    return response.data;
  }

  async getTodayArrivals(): Promise<ApiResponse<Reservation[]>> {
    const response = await api.get('/hotel/arrivals/today');
    return response.data;
  }

  async getTodayDepartures(): Promise<ApiResponse<Reservation[]>> {
    const response = await api.get('/hotel/departures/today');
    return response.data;
  }

  async getInHouseGuests(): Promise<ApiResponse<Reservation[]>> {
    const response = await api.get('/hotel/in-house');
    return response.data;
  }

  // Utilities
  async searchGuests(query: string): Promise<ApiResponse<Guest[]>> {
    const response = await api.get(`/hotel/guests/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  async searchRooms(query: string, startDate?: Date, endDate?: Date): Promise<ApiResponse<Room[]>> {
    const params = new URLSearchParams();
    params.append('q', query);
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());
    
    const response = await api.get(`/hotel/rooms/search?${params.toString()}`);
    return response.data;
  }
}

export const hotelService = new HotelService();
export default hotelService;