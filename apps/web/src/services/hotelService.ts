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

  // Normalize Reservation shape and fields for frontend
  private transformReservation = (reservation: any): Reservation => {
    const rawSpecial = reservation?.specialRequests;
    const specialRequests: string[] = Array.isArray(rawSpecial)
      ? rawSpecial.filter((s: any) => typeof s === 'string' && s.trim().length > 0)
      : typeof rawSpecial === 'string'
        ? rawSpecial
            .split(/\r?\n|,|;/)
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [];

    const rawNotes = reservation?.notes;
    const notes: string[] = Array.isArray(rawNotes)
      ? rawNotes.filter((n: any) => typeof n === 'string' && n.trim().length > 0)
      : typeof rawNotes === 'string'
        ? rawNotes
            .split(/\r?\n|,|;/)
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [];

    return {
      ...reservation,
      specialRequests,
      notes,
      rate: Number(reservation?.rate ?? 0),
      totalAmount: Number(reservation?.totalAmount ?? 0),
      paidAmount: Number(reservation?.paidAmount ?? 0),
      adults: Number(reservation?.adults ?? 0),
      children: Number(reservation?.children ?? 0),
      numberOfGuests: Number(
        reservation?.numberOfGuests ?? (Number(reservation?.adults ?? 0) + Number(reservation?.children ?? 0))
      ),
    } as Reservation;
  };

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
    // Map frontend CreateRoomInput to backend CreateUnitDto
    const enumValues = ['STANDARD','DELUXE','SUITE','PRESIDENTIAL','FAMILY','ACCESSIBLE','STUDIO','APARTMENT','VILLA','OTHER'];
    const isEnum = enumValues.includes(room.typeId);
    const payload: any = {
      unitNumber: room.number,
      unitType: (isEnum ? room.typeId : 'STANDARD') as any,
      roomTypeId: !isEnum ? room.typeId : undefined,
      building: undefined,
      floor: room.floor ?? 1,
      bedrooms: 1,
      bathrooms: 1,
      maxOccupancy: room.capacity,
      size: undefined,
      amenities: room.amenities || [],
      status: 'AVAILABLE',
      isActive: true,
      description: room.description || undefined,
      notes: undefined,
      dailyRate: room.rate,
    };

    const response = await api.post('/units', payload);
    
    // Transform the backend unit data to match frontend Room interface
    const transformedData = {
      ...response.data,
      data: this.transformUnitToRoom(response.data.data)
    };
    
    return transformedData;
  }

  async updateRoom(id: string, room: UpdateRoomInput): Promise<ApiResponse<Room>> {
    // Map partial frontend fields to backend UpdateUnitDto
    const enumValues = ['STANDARD','DELUXE','SUITE','PRESIDENTIAL','FAMILY','ACCESSIBLE','STUDIO','APARTMENT','VILLA','OTHER'];
    const payload: any = {};
    if (room.number !== undefined) payload.unitNumber = room.number;
    if (room.typeId !== undefined) {
      const isEnum = enumValues.includes(room.typeId);
      payload.unitType = (isEnum ? room.typeId : 'STANDARD') as any;
      payload.roomTypeId = !isEnum ? room.typeId : undefined;
    }
    if (room.floor !== undefined) payload.floor = room.floor;
    if (room.capacity !== undefined) payload.maxOccupancy = room.capacity;
    if (room.amenities !== undefined) payload.amenities = room.amenities;
    if (room.description !== undefined) payload.description = room.description;
    if (room.rate !== undefined) payload.dailyRate = room.rate;
    if ((room as any).status !== undefined) payload.status = (room as any).status;
    
    const response = await api.patch(`/units/${id}`, payload);
    
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
    try {
      const resp = await api.get('/room-types');
      if (Array.isArray(resp?.data?.data)) {
        const normalized = resp.data.data.map((rt: any) => ({
          id: rt.id,
          name: rt.name,
          description: rt.description || '',
          baseRate: Number(rt.baseRate ?? 0),
          maxCapacity: Number(rt.maxCapacity ?? 2),
          amenities: Array.isArray(rt.amenities) ? rt.amenities : [],
        }));
        return { data: normalized, message: 'Room types retrieved', success: true };
      }
    } catch (e) {
      // Fallback to enum-derived if endpoint not present yet
    }
    const enumValues = ['STANDARD','DELUXE','SUITE','PRESIDENTIAL','FAMILY','ACCESSIBLE','STUDIO','APARTMENT','VILLA','OTHER'];
    const toLabel = (v: string) => v.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    const types: RoomType[] = enumValues.map(v => ({ id: v, name: toLabel(v), description: '', baseRate: 0, maxCapacity: 2, amenities: [] }));
    return { data: types, message: 'Derived from UnitType enum', success: true };
  }

  async createRoomType(input: any): Promise<ApiResponse<RoomType>> {
    const resp = await api.post('/room-types', input);
    const rt = resp.data?.data;
    return { data: { ...rt, baseRate: Number(rt?.baseRate ?? 0) }, message: 'Created', success: true };
  }

  async updateRoomType(id: string, input: any): Promise<ApiResponse<RoomType>> {
    const resp = await api.patch(`/room-types/${id}`, input);
    const rt = resp.data?.data;
    return { data: { ...rt, baseRate: Number(rt?.baseRate ?? 0) }, message: 'Updated', success: true };
  }

  async deleteRoomType(id: string): Promise<ApiResponse<void>> {
    const resp = await api.delete(`/room-types/${id}`);
    return resp.data;
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
    const data = response.data?.data;
    const normalized = {
      ...response.data,
      data: {
        ...data,
        data: (data?.data || []).map((r: any) => this.transformReservation(r))
      }
    };
    return normalized;
  }

  async getReservation(id: string): Promise<ApiResponse<Reservation>> {
    const response = await api.get(`/reservations/${id}`);
    return {
      ...response.data,
      data: this.transformReservation(response.data?.data)
    };
  }

  async createReservation(reservation: CreateReservationInput): Promise<ApiResponse<Reservation>> {
    const response = await api.post('/reservations', reservation);
    return {
      ...response.data,
      data: this.transformReservation(response.data?.data)
    };
  }

  async updateReservation(id: string, reservation: Partial<CreateReservationInput>): Promise<ApiResponse<Reservation>> {
    const response = await api.patch(`/reservations/${id}`, reservation);
    return {
      ...response.data,
      data: this.transformReservation(response.data?.data)
    };
  }

  async cancelReservation(id: string, reason: string): Promise<ApiResponse<Reservation>> {
    const response = await api.post(`/reservations/${id}/cancel`, { reason });
    return {
      ...response.data,
      data: this.transformReservation(response.data?.data)
    };
  }

  async checkIn(id: string, roomId?: string): Promise<ApiResponse<Reservation>> {
    const response = await api.post(`/reservations/${id}/check-in`, roomId ? { unitId: roomId } : {});
    return {
      ...response.data,
      data: this.transformReservation(response.data?.data)
    };
  }

  async checkOut(id: string): Promise<ApiResponse<Reservation>> {
    const response = await api.post(`/reservations/${id}/check-out`);
    return {
      ...response.data,
      data: this.transformReservation(response.data?.data)
    };
  }

  async noShow(id: string): Promise<ApiResponse<Reservation>> {
    // No-show functionality may need to be implemented or handled through status updates
    const response = await api.patch(`/reservations/${id}`, { status: 'NO_SHOW' });
    return {
      ...response.data,
      data: this.transformReservation(response.data?.data)
    };
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