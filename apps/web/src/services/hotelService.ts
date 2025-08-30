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
  // Helper function to transform backend Unit to frontend Room
  private transformUnitToRoom(unit: any): Room {
    return {
      ...unit,
      number: unit.unitNumber || unit.number, // Map unitNumber to number
      capacity: unit.maxOccupancy || unit.capacity, // Map maxOccupancy to capacity
      rate: unit.dailyRate || unit.rate || 0, // Map dailyRate to rate
      type: unit.type || (unit.unitType ? { name: unit.unitType } : undefined), // Handle type mapping
      housekeepingStatus: unit.housekeepingStatus || 'CLEAN', // Default housekeeping status
      maintenanceIssues: unit.maintenanceIssues || [], // Default to empty array
    };
  }

  // Room Management (Units)
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

    const response = await api.get(`/units?${params.toString()}`);
    
    // Transform the backend units data to match frontend Room interface
    const transformedData = {
      ...response.data,
      data: {
        ...response.data.data,
        data: response.data.data.data.map((unit: any) => this.transformUnitToRoom(unit))
      }
    };
    
    return transformedData;
  }

  async getRoom(id: string): Promise<ApiResponse<Room>> {
    const response = await api.get(`/units/${id}`);
    
    // Transform the backend unit data to match frontend Room interface
    const transformedData = {
      ...response.data,
      data: this.transformUnitToRoom(response.data.data)
    };
    
    return transformedData;
  }

  async createRoom(room: CreateRoomInput): Promise<ApiResponse<Room>> {
    const response = await api.post('/units', room);
    
    // Transform the backend unit data to match frontend Room interface
    const transformedData = {
      ...response.data,
      data: this.transformUnitToRoom(response.data.data)
    };
    
    return transformedData;
  }

  async updateRoom(id: string, room: UpdateRoomInput): Promise<ApiResponse<Room>> {
    const response = await api.patch(`/units/${id}`, room);
    
    // Transform the backend unit data to match frontend Room interface
    const transformedData = {
      ...response.data,
      data: this.transformUnitToRoom(response.data.data)
    };
    
    return transformedData;
  }

  async deleteRoom(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/units/${id}`);
    return response.data;
  }

  async updateRoomStatus(id: string, status: string): Promise<ApiResponse<Room>> {
    const response = await api.patch(`/units/${id}/status`, { status });
    
    // Transform the backend unit data to match frontend Room interface
    const transformedData = {
      ...response.data,
      data: this.transformUnitToRoom(response.data.data)
    };
    
    return transformedData;
  }

  async getRoomTypes(): Promise<ApiResponse<RoomType[]>> {
    // Room types are handled through unit filtering - return empty for now
    // TODO: Implement unit types endpoint or derive from units
    return {
      data: [],
      message: 'Room types endpoint not implemented',
      success: true
    };
  }

  async getRoomAvailability(startDate: Date, endDate: Date): Promise<ApiResponse<RoomAvailability[]>> {
    const response = await api.get(`/units/availability?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
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

    const response = await api.get(`/guests?${params.toString()}`);
    return response.data;
  }

  async getGuest(id: string): Promise<ApiResponse<Guest>> {
    const response = await api.get(`/guests/${id}`);
    return response.data;
  }

  async createGuest(guest: CreateGuestInput): Promise<ApiResponse<Guest>> {
    const response = await api.post('/guests', guest);
    return response.data;
  }

  async updateGuest(id: string, guest: Partial<CreateGuestInput>): Promise<ApiResponse<Guest>> {
    const response = await api.patch(`/guests/${id}`, guest);
    return response.data;
  }

  async deleteGuest(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/guests/${id}`);
    return response.data;
  }

  async getGuestHistory(id: string): Promise<ApiResponse<Reservation[]>> {
    const response = await api.get(`/guests/${id}/history`);
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
    if (filter?.roomId) params.append('unitId', filter.roomId); // Backend uses unitId instead of roomId
    if (filter?.dateRange) {
      params.append('startDate', filter.dateRange.start.toISOString());
      params.append('endDate', filter.dateRange.end.toISOString());
    }
    if (filter?.checkInDateRange) {
      params.append('checkInDateFrom', filter.checkInDateRange.start.toISOString());
      params.append('checkInDateTo', filter.checkInDateRange.end.toISOString());
    }
    if (filter?.checkOutDateRange) {
      params.append('checkOutDateFrom', filter.checkOutDateRange.start.toISOString());
      params.append('checkOutDateTo', filter.checkOutDateRange.end.toISOString());
    }

    const response = await api.get(`/reservations?${params.toString()}`);
    return response.data;
  }

  async getReservation(id: string): Promise<ApiResponse<Reservation>> {
    const response = await api.get(`/reservations/${id}`);
    return response.data;
  }

  async createReservation(reservation: CreateReservationInput): Promise<ApiResponse<Reservation>> {
    const response = await api.post('/reservations', reservation);
    return response.data;
  }

  async updateReservation(id: string, reservation: Partial<CreateReservationInput>): Promise<ApiResponse<Reservation>> {
    const response = await api.patch(`/reservations/${id}`, reservation);
    return response.data;
  }

  async cancelReservation(id: string, reason: string): Promise<ApiResponse<Reservation>> {
    const response = await api.post(`/reservations/${id}/cancel`, { reason });
    return response.data;
  }

  async checkIn(id: string, roomId?: string): Promise<ApiResponse<Reservation>> {
    const response = await api.post(`/reservations/${id}/check-in`, roomId ? { unitId: roomId } : {});
    return response.data;
  }

  async checkOut(id: string): Promise<ApiResponse<Reservation>> {
    const response = await api.post(`/reservations/${id}/check-out`);
    return response.data;
  }

  async noShow(id: string): Promise<ApiResponse<Reservation>> {
    // No-show functionality may need to be implemented or handled through status updates
    const response = await api.patch(`/reservations/${id}`, { status: 'NO_SHOW' });
    return response.data;
  }

  // Dashboard Stats - Aggregate from individual controllers
  async getHotelStats(): Promise<ApiResponse<HotelStats>> {
    try {
      // Get stats from all modules
      const [unitStats, guestStats, reservationStats] = await Promise.all([
        api.get('/units/stats'),
        api.get('/guests/stats'), 
        api.get('/reservations/stats')
      ]);
      
      // Combine into hotel stats format
      const hotelStats: HotelStats = {
        // Map the individual stats to expected format
        totalRooms: unitStats.data.data?.total || 0,
        occupiedRooms: unitStats.data.data?.occupied || 0,
        availableRooms: unitStats.data.data?.available || 0,
        outOfOrderRooms: unitStats.data.data?.outOfOrder || 0,
        totalGuests: guestStats.data.data?.total || 0,
        totalReservations: reservationStats.data.data?.total || 0,
        checkInsToday: reservationStats.data.data?.checkInsToday || 0,
        checkOutsToday: reservationStats.data.data?.checkOutsToday || 0,
        occupancyRate: unitStats.data.data?.occupancyRate || 0,
        averageRate: reservationStats.data.data?.averageRate || 0,
        revenue: {
          today: reservationStats.data.data?.revenueToday || 0,
          week: reservationStats.data.data?.revenueWeek || 0,
          month: reservationStats.data.data?.revenueMonth || 0
        }
      };
      
      return {
        data: hotelStats,
        message: 'Hotel statistics retrieved successfully',
        success: true
      };
    } catch (error) {
      console.error('Error aggregating hotel stats:', error);
      // Return empty stats if error
      return {
        data: {
          totalRooms: 0,
          occupiedRooms: 0,
          availableRooms: 0,
          outOfOrderRooms: 0,
          totalGuests: 0,
          totalReservations: 0,
          checkInsToday: 0,
          checkOutsToday: 0,
          occupancyRate: 0,
          averageRate: 0,
          revenue: {
            today: 0,
            week: 0,
            month: 0
          }
        },
        message: 'Failed to retrieve hotel statistics',
        success: false
      };
    }
  }

  async getTodayArrivals(): Promise<ApiResponse<Reservation[]>> {
    // Filter reservations for today's check-ins
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    const params = new URLSearchParams();
    params.append('checkInDateFrom', startOfDay.toISOString());
    params.append('checkInDateTo', endOfDay.toISOString());
    params.append('status', 'CONFIRMED');
    
    const response = await api.get(`/reservations?${params.toString()}`);
    return {
      data: response.data.data?.data || [],
      message: 'Today\'s arrivals retrieved successfully',
      success: true
    };
  }

  async getTodayDepartures(): Promise<ApiResponse<Reservation[]>> {
    // Filter reservations for today's check-outs
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    const params = new URLSearchParams();
    params.append('checkOutDateFrom', startOfDay.toISOString());
    params.append('checkOutDateTo', endOfDay.toISOString());
    params.append('status', 'CHECKED_IN');
    
    const response = await api.get(`/reservations?${params.toString()}`);
    return {
      data: response.data.data?.data || [],
      message: 'Today\'s departures retrieved successfully',
      success: true
    };
  }

  async getInHouseGuests(): Promise<ApiResponse<Reservation[]>> {
    // Filter for currently checked-in reservations
    const params = new URLSearchParams();
    params.append('status', 'CHECKED_IN');
    
    const response = await api.get(`/reservations?${params.toString()}`);
    return {
      data: response.data.data?.data || [],
      message: 'In-house guests retrieved successfully',
      success: true
    };
  }

  // Utilities
  async searchGuests(query: string): Promise<ApiResponse<Guest[]>> {
    // Use the main guests endpoint with search filter
    const params = new URLSearchParams();
    params.append('search', query);
    
    const response = await api.get(`/guests?${params.toString()}`);
    return {
      data: response.data.data?.data || [],
      message: 'Guest search completed successfully',
      success: true
    };
  }

  async searchRooms(query: string, startDate?: Date, endDate?: Date): Promise<ApiResponse<Room[]>> {
    // Use the main units endpoint with search filter and availability check
    const params = new URLSearchParams();
    params.append('search', query);
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());
    
    const response = await api.get(`/units?${params.toString()}`);
    return {
      data: response.data.data?.data || [],
      message: 'Room search completed successfully',
      success: true
    };
  }
}

export const hotelService = new HotelService();
export default hotelService;