// Hotel Operations Types

export interface Room {
  id: string;
  unitNumber: string; // Backend field name
  number?: string; // For backward compatibility
  unitType?: string; // Backend field name
  type?: RoomType; // For backward compatibility  
  building?: string;
  floor?: number;
  bedrooms?: number;
  bathrooms?: number;
  maxOccupancy: number; // Backend field name
  capacity?: number; // For backward compatibility
  size?: number;
  amenities: string[];
  status: RoomStatus;
  isActive: boolean;
  description?: string;
  notes?: string;
  dailyRate?: number; // Backend field name
  rate?: number; // For backward compatibility
  housekeepingStatus?: HousekeepingStatus; // Optional since backend doesn't have this
  lastCleaned?: Date;
  maintenanceIssues?: MaintenanceIssue[]; // Optional since backend might not include this
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  propertyId: string;
}

export interface RoomType {
  id: string;
  name: string;
  description: string;
  baseRate: number;
  maxCapacity: number;
  amenities: string[];
  image?: string;
}

export type RoomStatus = 
  | 'AVAILABLE' 
  | 'OCCUPIED' 
  | 'OUT_OF_ORDER' 
  | 'MAINTENANCE' 
  | 'CLEANING'
  | 'RESERVED';

export type HousekeepingStatus = 
  | 'CLEAN' 
  | 'DIRTY' 
  | 'INSPECTED' 
  | 'OUT_OF_ORDER';

export interface MaintenanceIssue {
  id: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'REPORTED' | 'IN_PROGRESS' | 'RESOLVED';
  reportedBy: string;
  reportedAt: Date;
  resolvedAt?: Date;
}

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: Date;
  nationality?: string;
  idType?: string;
  idNumber?: string;
  address?: Address;
  preferences: GuestPreferences;
  vipStatus: boolean;
  blacklisted: boolean;
  notes: string[];
  totalStays: number;
  totalSpent: number;
  lastStayDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface GuestPreferences {
  roomType?: string;
  floor?: string;
  smoking: boolean;
  bedType?: string;
  specialRequests: string[];
  dietaryRestrictions: string[];
  communicationPreferences: {
    email: boolean;
    sms: boolean;
    phone: boolean;
  };
}

export interface Reservation {
  id: string;
  confirmationNumber: string;
  guest: Guest;
  guestId: string;
  room?: Room;
  roomId?: string;
  roomType: RoomType;
  checkInDate: Date;
  checkOutDate: Date;
  numberOfGuests: number;
  adults: number;
  children: number;
  status: ReservationStatus;
  source: ReservationSource;
  rate: number;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  specialRequests: string[];
  notes: string[];
  checkedInAt?: Date;
  checkedInBy?: string;
  checkedOutAt?: Date;
  checkedOutBy?: string;
  cancelledAt?: Date;
  cancellationReason?: string;
  noShowAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  propertyId: string;
}

export type ReservationStatus = 
  | 'CONFIRMED' 
  | 'CHECKED_IN' 
  | 'CHECKED_OUT' 
  | 'CANCELLED' 
  | 'NO_SHOW'
  | 'PENDING';

export type ReservationSource = 
  | 'DIRECT' 
  | 'BOOKING_COM' 
  | 'EXPEDIA' 
  | 'AIRBNB'
  | 'PHONE' 
  | 'WALK_IN'
  | 'OTHER';

export type PaymentStatus = 
  | 'PENDING' 
  | 'PARTIAL' 
  | 'PAID' 
  | 'REFUNDED' 
  | 'FAILED';

// Filter and Search Types
export interface RoomFilter {
  status?: RoomStatus[];
  type?: string;
  floor?: number;
  housekeepingStatus?: HousekeepingStatus[];
  search?: string;
  available?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface GuestFilter {
  search?: string;
  vipStatus?: boolean;
  nationality?: string;
  blacklisted?: boolean;
  lastStayDateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ReservationFilter {
  status?: ReservationStatus[];
  source?: ReservationSource[];
  paymentStatus?: PaymentStatus[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  checkInDateRange?: {
    start: Date;
    end: Date;
  };
  checkOutDateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
  guestId?: string;
  roomId?: string;
}

// API Response Types
export interface HotelStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  outOfOrderRooms: number;
  occupancyRate: number;
  averageRate: number;
  revenue: {
    today: number;
    week: number;
    month: number;
  };
  totalGuests: number;
  totalReservations: number;
  checkInsToday: number;
  checkOutsToday: number;
}

export interface RoomAvailability {
  date: string;
  available: number;
  occupied: number;
  outOfOrder: number;
  rate: number;
}

// Form Types
export interface CreateRoomInput {
  number: string;
  typeId: string;
  floor: number;
  capacity: number;
  amenities: string[];
  description?: string;
  rate: number;
}

export interface UpdateRoomInput extends Partial<CreateRoomInput> {
  status?: RoomStatus;
  housekeepingStatus?: HousekeepingStatus;
}

export interface CreateGuestInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: Date;
  nationality?: string;
  idType?: string;
  idNumber?: string;
  address?: Address;
  preferences: Partial<GuestPreferences>;
  notes?: string[];
}

export interface CreateReservationInput {
  guestId?: string;
  guest?: CreateGuestInput;
  roomTypeId: string;
  roomId?: string;
  checkInDate: Date;
  checkOutDate: Date;
  numberOfGuests: number;
  adults: number;
  children: number;
  rate: number;
  source: ReservationSource;
  paymentMethod?: string;
  specialRequests?: string[];
  notes?: string[];
}

// View Configuration Types
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'reservation' | 'maintenance' | 'cleaning';
  data: Reservation | MaintenanceIssue | any;
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  render?: (value: any, item: any) => React.ReactNode;
}