# Hotel Core Operations Frontend Architecture

## Executive Summary

This document defines the complete frontend architecture for Hotel Operations Hub's core hotel management modules. Building on the established multi-tenant platform, this architecture extends the existing React-based system to support comprehensive hotel operations including front desk management, housekeeping, maintenance, guest services, and inventory management.

The architecture leverages existing patterns from the HR management system while introducing hotel-specific components, real-time updates, and mobile-optimized interfaces for operational staff.

## Table of Contents

1. [Page Architecture Overview](#page-architecture-overview)
2. [Component Hierarchy](#component-hierarchy)  
3. [State Management Strategy](#state-management-strategy)
4. [API Service Layer](#api-service-layer)
5. [Routing Structure](#routing-structure)
6. [Form Handling Approach](#form-handling-approach)
7. [Permission Integration](#permission-integration)
8. [Real-time Features](#real-time-features)
9. [Mobile Responsive Design](#mobile-responsive-design)
10. [Performance Optimization](#performance-optimization)
11. [Integration with Existing Systems](#integration-with-existing-systems)
12. [Component Specifications](#component-specifications)
13. [Implementation Timeline](#implementation-timeline)

---

## Page Architecture Overview

### Hotel Operations Pages Structure

Following the existing pattern from `UsersPage.tsx`, each hotel operation module will have a dedicated page component with the following architecture:

```typescript
interface HotelOperationPageProps {
  // Standard page props following existing patterns
}

const HotelOperationPage: React.FC<HotelOperationPageProps> = () => {
  // State management using useState and custom hooks
  // Data fetching with TanStack Query patterns
  // Permission checking with usePermissions hook
  // Form handling with controlled components
  // Real-time updates with polling/WebSocket
  
  return (
    <div className="space-y-6">
      {/* Header with actions and stats */}
      {/* Filters and search */}
      {/* Main data display (table/grid/calendar) */}
      {/* Modals for CRUD operations */}
    </div>
  );
};
```

### Core Hotel Operations Pages

#### 1. Front Desk Dashboard (`/front-desk`)
**Primary Purpose**: Real-time operations overview and quick actions
**Components**: 
- Live occupancy grid
- Today's arrivals/departures
- Room status board
- Quick check-in/out forms
- Guest communication center

#### 2. Room Management (`/rooms`)
**Primary Purpose**: Comprehensive room status and assignment management
**Components**:
- Visual room status grid
- Room assignment interface
- Maintenance status tracking
- Housekeeping coordination
- Room history and notes

#### 3. Reservations (`/reservations`)
**Primary Purpose**: Booking management and calendar interface
**Components**:
- Calendar view (monthly/weekly/daily)
- Reservation search and filters
- Guest profile integration
- Rate and availability management
- Waitlist and overbooking tools

#### 4. Guest Management (`/guests`)
**Primary Purpose**: Complete guest profile and relationship management
**Components**:
- Guest profile cards
- Stay history and preferences
- Communication log
- Document management
- VIP and loyalty program integration

#### 5. Housekeeping Operations (`/housekeeping`)
**Primary Purpose**: Cleaning schedules and inventory management
**Components**:
- Assignment dashboard
- Room cleaning checklist
- Inventory tracking
- Staff performance metrics
- Maintenance request integration

#### 6. Maintenance Management (`/maintenance`)
**Primary Purpose**: Work order and asset management
**Components**:
- Work order kanban board
- Asset tracking interface
- Preventive maintenance scheduler
- Vendor management
- Cost tracking dashboard

---

## Component Hierarchy

### Core Hotel Components Library

Following the existing component patterns, we'll create a comprehensive library of hotel-specific components:

```typescript
// Core Hotel Components
├── RoomStatusGrid/
│   ├── RoomStatusGrid.tsx          // Main grid component
│   ├── RoomCard.tsx                // Individual room display
│   ├── RoomStatusIndicator.tsx     // Visual status indicator
│   └── RoomQuickActions.tsx        // Action buttons overlay
│
├── ReservationCalendar/
│   ├── ReservationCalendar.tsx     // Main calendar component
│   ├── CalendarDateCell.tsx        // Individual date cell
│   ├── ReservationBlock.tsx        // Reservation timeline block
│   └── CalendarControls.tsx        // Navigation and view controls
│
├── GuestProfile/
│   ├── GuestProfileCard.tsx        // Guest summary card
│   ├── GuestDetailsModal.tsx       // Detailed guest information
│   ├── StayHistoryList.tsx         // Past and upcoming stays
│   └── GuestPreferences.tsx        // Preferences and notes
│
├── CheckInOutWizard/
│   ├── CheckInWizard.tsx           // Multi-step check-in process
│   ├── CheckOutWizard.tsx          // Multi-step check-out process
│   ├── DocumentUpload.tsx          // ID and document handling
│   └── PaymentProcessing.tsx       // Payment integration
│
├── WorkOrderBoard/
│   ├── WorkOrderBoard.tsx          // Kanban-style board
│   ├── WorkOrderCard.tsx           // Individual work order
│   ├── WorkOrderModal.tsx          // Detailed work order view
│   └── MaintenanceAssets.tsx       // Asset management interface
│
└── HousekeepingDashboard/
    ├── HousekeepingDashboard.tsx   // Main dashboard
    ├── CleaningAssignments.tsx     // Staff assignment interface
    ├── InventoryTracker.tsx        // Supplies and inventory
    └── QualityChecklist.tsx        // Cleaning quality control
```

### Shared Components (Extended)

Building on existing shared components, we'll extend with hotel-specific functionality:

```typescript
// Extended Shared Components
├── DataTable/                      // Enhanced from existing table
│   ├── ReservationTable.tsx        // Specialized for reservations
│   ├── GuestTable.tsx              // Specialized for guest data
│   └── MaintenanceTable.tsx        // Specialized for work orders
│
├── FilterBar/                      // Enhanced filtering
│   ├── DateRangeFilter.tsx         // Hotel date operations
│   ├── RoomTypeFilter.tsx          // Room classification
│   └── StatusMultiSelect.tsx       // Multiple status selection
│
├── StatusBadge/                    // Enhanced status indicators
│   ├── RoomStatusBadge.tsx         // Room status styling
│   ├── ReservationStatusBadge.tsx  // Reservation status styling
│   └── MaintenanceStatusBadge.tsx  // Work order status styling
│
└── Layout/
    ├── DashboardLayout.tsx         // Specialized dashboard layout
    ├── OperationalLayout.tsx       // Mobile-friendly operations
    └── CalendarLayout.tsx          // Calendar-specific layout
```

---

## State Management Strategy

### TanStack Query Implementation

Following the established patterns from the existing codebase, we'll use TanStack Query for server state management with hotel-specific optimizations:

```typescript
// Hotel-specific query keys and patterns
export const hotelQueryKeys = {
  // Room management
  rooms: {
    all: ['rooms'] as const,
    lists: () => [...hotelQueryKeys.rooms.all, 'list'] as const,
    list: (filters: RoomFilter) => [...hotelQueryKeys.rooms.lists(), filters] as const,
    details: () => [...hotelQueryKeys.rooms.all, 'detail'] as const,
    detail: (id: string) => [...hotelQueryKeys.rooms.details(), id] as const,
    status: () => [...hotelQueryKeys.rooms.all, 'status'] as const,
  },
  
  // Reservation management
  reservations: {
    all: ['reservations'] as const,
    lists: () => [...hotelQueryKeys.reservations.all, 'list'] as const,
    list: (filters: ReservationFilter) => [...hotelQueryKeys.reservations.lists(), filters] as const,
    calendar: (date: string) => [...hotelQueryKeys.reservations.all, 'calendar', date] as const,
    availability: (dates: DateRange) => [...hotelQueryKeys.reservations.all, 'availability', dates] as const,
  },
  
  // Guest management
  guests: {
    all: ['guests'] as const,
    lists: () => [...hotelQueryKeys.guests.all, 'list'] as const,
    list: (filters: GuestFilter) => [...hotelQueryKeys.guests.lists(), filters] as const,
    detail: (id: string) => [...hotelQueryKeys.guests.all, 'detail', id] as const,
    history: (id: string) => [...hotelQueryKeys.guests.all, 'history', id] as const,
  },
  
  // Housekeeping operations
  housekeeping: {
    all: ['housekeeping'] as const,
    assignments: (date: string) => [...hotelQueryKeys.housekeeping.all, 'assignments', date] as const,
    inventory: () => [...hotelQueryKeys.housekeeping.all, 'inventory'] as const,
    checklists: () => [...hotelQueryKeys.housekeeping.all, 'checklists'] as const,
  },
  
  // Maintenance operations
  maintenance: {
    all: ['maintenance'] as const,
    workOrders: () => [...hotelQueryKeys.maintenance.all, 'work-orders'] as const,
    assets: () => [...hotelQueryKeys.maintenance.all, 'assets'] as const,
    schedule: () => [...hotelQueryKeys.maintenance.all, 'schedule'] as const,
  },
} as const;
```

### Custom Hooks for Hotel Operations

```typescript
// Room management hooks
export const useRooms = (filters: RoomFilter) => {
  return useQuery({
    queryKey: hotelQueryKeys.rooms.list(filters),
    queryFn: () => roomService.getRooms(filters),
    staleTime: 30000, // 30 seconds for operational data
  });
};

export const useRoomStatus = () => {
  return useQuery({
    queryKey: hotelQueryKeys.rooms.status(),
    queryFn: () => roomService.getRoomStatus(),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });
};

// Reservation management hooks
export const useReservationCalendar = (date: string) => {
  return useQuery({
    queryKey: hotelQueryKeys.reservations.calendar(date),
    queryFn: () => reservationService.getCalendarData(date),
    staleTime: 60000, // 1 minute for calendar data
  });
};

// Guest management hooks
export const useGuestProfile = (guestId: string) => {
  return useQuery({
    queryKey: hotelQueryKeys.guests.detail(guestId),
    queryFn: () => guestService.getGuest(guestId),
    staleTime: 300000, // 5 minutes for guest profiles
  });
};

// Housekeeping hooks
export const useHousekeepingAssignments = (date: string) => {
  return useQuery({
    queryKey: hotelQueryKeys.housekeeping.assignments(date),
    queryFn: () => housekeepingService.getAssignments(date),
    refetchInterval: 120000, // Auto-refresh every 2 minutes
  });
};

// Maintenance hooks
export const useWorkOrders = (filters: WorkOrderFilter) => {
  return useQuery({
    queryKey: hotelQueryKeys.maintenance.workOrders(),
    queryFn: () => maintenanceService.getWorkOrders(filters),
    staleTime: 60000,
  });
};
```

### Real-time Data Synchronization

```typescript
// Real-time hooks for critical operations
export const useRealTimeRoomStatus = () => {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({
        queryKey: hotelQueryKeys.rooms.status(),
      });
    }, 15000); // Refresh every 15 seconds
    
    return () => clearInterval(interval);
  }, [queryClient]);
};

// WebSocket integration for live updates
export const useWebSocketUpdates = () => {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const ws = new WebSocket(getWebSocketUrl());
    
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      
      switch (update.type) {
        case 'ROOM_STATUS_UPDATE':
          queryClient.setQueryData(
            hotelQueryKeys.rooms.status(),
            (old: any) => updateRoomStatus(old, update.data)
          );
          break;
          
        case 'RESERVATION_UPDATE':
          queryClient.invalidateQueries({
            queryKey: hotelQueryKeys.reservations.all,
          });
          break;
          
        case 'MAINTENANCE_UPDATE':
          queryClient.invalidateQueries({
            queryKey: hotelQueryKeys.maintenance.all,
          });
          break;
      }
    };
    
    return () => ws.close();
  }, [queryClient]);
};
```

---

## API Service Layer

### Hotel Operations Services

Following the established pattern from `userService.ts`, we'll create comprehensive service classes for each hotel operation:

```typescript
// Room Service
export interface Room {
  id: string;
  number: string;
  type: RoomType;
  status: RoomStatus;
  floor: number;
  block: string;
  features: RoomFeature[];
  currentGuest?: Guest;
  lastCleaned?: string;
  maintenanceStatus?: MaintenanceStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

class RoomService {
  async getRooms(filter?: RoomFilter) {
    const params = new URLSearchParams();
    if (filter?.status) params.append('status', filter.status);
    if (filter?.type) params.append('type', filter.type);
    if (filter?.floor) params.append('floor', filter.floor.toString());
    
    const response = await api.get(`/hotel/rooms?${params.toString()}`);
    return response.data;
  }
  
  async updateRoomStatus(roomId: string, status: RoomStatus) {
    const response = await api.patch(`/hotel/rooms/${roomId}/status`, { status });
    return response.data;
  }
  
  async assignRoom(roomId: string, guestId: string, reservationId: string) {
    const response = await api.post(`/hotel/rooms/${roomId}/assign`, {
      guestId,
      reservationId,
    });
    return response.data;
  }
  
  async getRoomHistory(roomId: string) {
    const response = await api.get(`/hotel/rooms/${roomId}/history`);
    return response.data;
  }
}

// Reservation Service
export interface Reservation {
  id: string;
  confirmationNumber: string;
  guest: Guest;
  roomType: RoomType;
  assignedRoom?: Room;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  status: ReservationStatus;
  rate: ReservationRate;
  specialRequests: string;
  source: BookingSource;
  createdAt: string;
  updatedAt: string;
}

class ReservationService {
  async getReservations(filter?: ReservationFilter) {
    const params = new URLSearchParams();
    if (filter?.dateRange) {
      params.append('startDate', filter.dateRange.start);
      params.append('endDate', filter.dateRange.end);
    }
    if (filter?.status) params.append('status', filter.status);
    if (filter?.guestId) params.append('guestId', filter.guestId);
    
    const response = await api.get(`/hotel/reservations?${params.toString()}`);
    return response.data;
  }
  
  async getCalendarData(date: string) {
    const response = await api.get(`/hotel/reservations/calendar/${date}`);
    return response.data;
  }
  
  async checkIn(reservationId: string, checkInData: CheckInData) {
    const response = await api.post(`/hotel/reservations/${reservationId}/check-in`, checkInData);
    return response.data;
  }
  
  async checkOut(reservationId: string, checkOutData: CheckOutData) {
    const response = await api.post(`/hotel/reservations/${reservationId}/check-out`, checkOutData);
    return response.data;
  }
  
  async getAvailability(dateRange: DateRange, roomType?: string) {
    const response = await api.post('/hotel/reservations/availability', {
      startDate: dateRange.start,
      endDate: dateRange.end,
      roomType,
    });
    return response.data;
  }
}

// Guest Service
export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: Address;
  idDocument?: Document;
  preferences: GuestPreference[];
  vipStatus?: VipLevel;
  loyaltyProgram?: LoyaltyMembership;
  stayHistory: Stay[];
  communicationHistory: Communication[];
  createdAt: string;
  updatedAt: string;
}

class GuestService {
  async getGuests(filter?: GuestFilter) {
    const params = new URLSearchParams();
    if (filter?.search) params.append('search', filter.search);
    if (filter?.vipStatus) params.append('vipStatus', filter.vipStatus);
    
    const response = await api.get(`/hotel/guests?${params.toString()}`);
    return response.data;
  }
  
  async getGuest(guestId: string) {
    const response = await api.get(`/hotel/guests/${guestId}`);
    return response.data;
  }
  
  async updateGuest(guestId: string, data: Partial<Guest>) {
    const response = await api.patch(`/hotel/guests/${guestId}`, data);
    return response.data;
  }
  
  async getGuestStayHistory(guestId: string) {
    const response = await api.get(`/hotel/guests/${guestId}/stays`);
    return response.data;
  }
  
  async addGuestNote(guestId: string, note: string) {
    const response = await api.post(`/hotel/guests/${guestId}/notes`, { note });
    return response.data;
  }
}

// Housekeeping Service
export interface HousekeepingAssignment {
  id: string;
  date: string;
  staffMember: User;
  rooms: Room[];
  status: AssignmentStatus;
  startTime?: string;
  completedTime?: string;
  notes: string;
  checklist?: ChecklistItem[];
}

class HousekeepingService {
  async getAssignments(date: string) {
    const response = await api.get(`/hotel/housekeeping/assignments/${date}`);
    return response.data;
  }
  
  async createAssignment(assignmentData: CreateAssignmentData) {
    const response = await api.post('/hotel/housekeeping/assignments', assignmentData);
    return response.data;
  }
  
  async updateAssignmentStatus(assignmentId: string, status: AssignmentStatus) {
    const response = await api.patch(`/hotel/housekeeping/assignments/${assignmentId}/status`, { status });
    return response.data;
  }
  
  async getInventory() {
    const response = await api.get('/hotel/housekeeping/inventory');
    return response.data;
  }
  
  async updateInventory(itemId: string, quantity: number) {
    const response = await api.patch(`/hotel/housekeeping/inventory/${itemId}`, { quantity });
    return response.data;
  }
}

// Maintenance Service
export interface WorkOrder {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: WorkOrderStatus;
  category: MaintenanceCategory;
  location: string;
  assignedTo?: User;
  requestedBy: User;
  estimatedCost?: number;
  actualCost?: number;
  scheduledDate?: string;
  completedDate?: string;
  notes: string;
  attachments: Document[];
  createdAt: string;
  updatedAt: string;
}

class MaintenanceService {
  async getWorkOrders(filter?: WorkOrderFilter) {
    const params = new URLSearchParams();
    if (filter?.status) params.append('status', filter.status);
    if (filter?.priority) params.append('priority', filter.priority);
    if (filter?.assignedTo) params.append('assignedTo', filter.assignedTo);
    
    const response = await api.get(`/hotel/maintenance/work-orders?${params.toString()}`);
    return response.data;
  }
  
  async createWorkOrder(workOrderData: CreateWorkOrderData) {
    const response = await api.post('/hotel/maintenance/work-orders', workOrderData);
    return response.data;
  }
  
  async updateWorkOrder(workOrderId: string, data: Partial<WorkOrder>) {
    const response = await api.patch(`/hotel/maintenance/work-orders/${workOrderId}`, data);
    return response.data;
  }
  
  async getAssets() {
    const response = await api.get('/hotel/maintenance/assets');
    return response.data;
  }
  
  async getMaintenanceSchedule() {
    const response = await api.get('/hotel/maintenance/schedule');
    return response.data;
  }
}

// Export service instances
export const roomService = new RoomService();
export const reservationService = new ReservationService();
export const guestService = new GuestService();
export const housekeepingService = new HousekeepingService();
export const maintenanceService = new MaintenanceService();
```

---

## Routing Structure

### New Routes for Hotel Operations

Following the existing routing pattern in `App.tsx`, we'll add new routes for hotel operations:

```typescript
// Additional routes to be added to App.tsx
const hotelOperationRoutes = [
  {
    path: '/front-desk',
    component: FrontDeskDashboard,
    roles: ['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'PROPERTY_MANAGER', 'DEPARTMENT_ADMIN'],
  },
  {
    path: '/rooms',
    component: RoomManagementPage,
    roles: ['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'PROPERTY_MANAGER', 'DEPARTMENT_ADMIN'],
  },
  {
    path: '/reservations',
    component: ReservationsPage,
    roles: ['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'PROPERTY_MANAGER', 'DEPARTMENT_ADMIN'],
  },
  {
    path: '/guests',
    component: GuestManagementPage,
    roles: ['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'PROPERTY_MANAGER', 'DEPARTMENT_ADMIN'],
  },
  {
    path: '/housekeeping',
    component: HousekeepingPage,
    roles: ['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'PROPERTY_MANAGER', 'DEPARTMENT_ADMIN'],
  },
  {
    path: '/maintenance',
    component: MaintenancePage,
    roles: ['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'PROPERTY_MANAGER', 'DEPARTMENT_ADMIN'],
  },
  {
    path: '/inventory',
    component: InventoryPage,
    roles: ['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'PROPERTY_MANAGER', 'DEPARTMENT_ADMIN'],
  },
];

// Navigation items to be added to Layout.tsx
const hotelNavigationItems: NavItem[] = [
  {
    label: 'nav.frontDesk',
    path: '/front-desk',
    icon: '🏨',
    roles: ['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'PROPERTY_MANAGER', 'DEPARTMENT_ADMIN']
  },
  {
    label: 'nav.rooms',
    path: '/rooms',
    icon: '🛏️',
    roles: ['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'PROPERTY_MANAGER', 'DEPARTMENT_ADMIN']
  },
  {
    label: 'nav.reservations',
    path: '/reservations',
    icon: '📅',
    roles: ['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'PROPERTY_MANAGER', 'DEPARTMENT_ADMIN']
  },
  {
    label: 'nav.guests',
    path: '/guests',
    icon: '👥',
    roles: ['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'PROPERTY_MANAGER', 'DEPARTMENT_ADMIN']
  },
  {
    label: 'nav.housekeeping',
    path: '/housekeeping',
    icon: '🧹',
    roles: ['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'PROPERTY_MANAGER', 'DEPARTMENT_ADMIN']
  },
  {
    label: 'nav.maintenance',
    path: '/maintenance',
    icon: '🔧',
    roles: ['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'PROPERTY_MANAGER', 'DEPARTMENT_ADMIN']
  },
  {
    label: 'nav.inventory',
    path: '/inventory',
    icon: '📦',
    roles: ['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'PROPERTY_MANAGER', 'DEPARTMENT_ADMIN']
  },
];
```

### Nested Route Structure

For complex operations, we'll implement nested routing:

```typescript
// Front Desk nested routes
const frontDeskRoutes = [
  { path: '', component: FrontDeskDashboard }, // /front-desk
  { path: 'check-in/:reservationId', component: CheckInWizard }, // /front-desk/check-in/123
  { path: 'check-out/:reservationId', component: CheckOutWizard }, // /front-desk/check-out/123
  { path: 'walk-in', component: WalkInRegistration }, // /front-desk/walk-in
];

// Room management nested routes
const roomRoutes = [
  { path: '', component: RoomManagementPage }, // /rooms
  { path: ':roomId', component: RoomDetailPage }, // /rooms/101
  { path: ':roomId/history', component: RoomHistoryPage }, // /rooms/101/history
  { path: ':roomId/maintenance', component: RoomMaintenancePage }, // /rooms/101/maintenance
];

// Guest management nested routes
const guestRoutes = [
  { path: '', component: GuestManagementPage }, // /guests
  { path: ':guestId', component: GuestProfilePage }, // /guests/123
  { path: ':guestId/stays', component: GuestStayHistory }, // /guests/123/stays
  { path: ':guestId/preferences', component: GuestPreferences }, // /guests/123/preferences
];
```

---

## Form Handling Approach

### React Hook Form Implementation

Following the existing patterns, we'll use controlled components with validation:

```typescript
// Room assignment form example
interface RoomAssignmentFormData {
  roomId: string;
  guestId: string;
  checkInDate: string;
  checkOutDate: string;
  specialRequests: string;
  rate: number;
}

const RoomAssignmentForm: React.FC<RoomAssignmentFormProps> = ({
  reservation,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<RoomAssignmentFormData>({
    roomId: '',
    guestId: reservation.guestId,
    checkInDate: reservation.checkInDate,
    checkOutDate: reservation.checkOutDate,
    specialRequests: reservation.specialRequests || '',
    rate: reservation.rate.amount,
  });
  
  const [loading, setLoading] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  
  // Load available rooms
  useEffect(() => {
    const loadAvailableRooms = async () => {
      try {
        const rooms = await roomService.getAvailableRooms({
          startDate: formData.checkInDate,
          endDate: formData.checkOutDate,
          roomType: reservation.roomType.id,
        });
        setAvailableRooms(rooms);
      } catch (error) {
        console.error('Failed to load available rooms:', error);
      }
    };
    
    loadAvailableRooms();
  }, [formData.checkInDate, formData.checkOutDate, reservation.roomType.id]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await roomService.assignRoom(formData.roomId, formData.guestId, reservation.id);
      onSubmit();
    } catch (error) {
      console.error('Room assignment failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="form-label">Available Rooms</label>
        <select
          name="roomId"
          value={formData.roomId}
          onChange={handleInputChange}
          className="form-input"
          required
        >
          <option value="">Select Room</option>
          {availableRooms.map(room => (
            <option key={room.id} value={room.id}>
              Room {room.number} - {room.type.name} - Floor {room.floor}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="form-label">Special Requests</label>
        <textarea
          name="specialRequests"
          value={formData.specialRequests}
          onChange={handleInputChange}
          className="form-input"
          rows={3}
          placeholder="Any special requests or notes..."
        />
      </div>
      
      <div className="flex space-x-4">
        <button
          type="submit"
          disabled={loading || !formData.roomId}
          className="btn btn-primary flex-1"
        >
          {loading ? <LoadingSpinner size="sm" /> : 'Assign Room'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary flex-1"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
```

### Multi-Step Form Wizards

For complex operations like check-in/check-out:

```typescript
// Check-in wizard example
interface CheckInStep {
  id: string;
  title: string;
  component: React.ComponentType<CheckInStepProps>;
  isValid: (data: CheckInData) => boolean;
}

const checkInSteps: CheckInStep[] = [
  {
    id: 'guest-verification',
    title: 'Guest Verification',
    component: GuestVerificationStep,
    isValid: (data) => data.guestVerified,
  },
  {
    id: 'room-assignment',
    title: 'Room Assignment',
    component: RoomAssignmentStep,
    isValid: (data) => !!data.assignedRoom,
  },
  {
    id: 'documents',
    title: 'Documents & ID',
    component: DocumentsStep,
    isValid: (data) => !!data.idDocument,
  },
  {
    id: 'payment',
    title: 'Payment & Deposit',
    component: PaymentStep,
    isValid: (data) => data.paymentProcessed,
  },
  {
    id: 'confirmation',
    title: 'Confirmation',
    component: ConfirmationStep,
    isValid: () => true,
  },
];

const CheckInWizard: React.FC<CheckInWizardProps> = ({ reservationId }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [checkInData, setCheckInData] = useState<CheckInData>({});
  
  const canProceed = checkInSteps[currentStep].isValid(checkInData);
  const isLastStep = currentStep === checkInSteps.length - 1;
  
  const handleNext = () => {
    if (canProceed && !isLastStep) {
      setCurrentStep(prev => prev + 1);
    }
  };
  
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  const handleComplete = async () => {
    try {
      await reservationService.checkIn(reservationId, checkInData);
      // Navigate to confirmation page
    } catch (error) {
      console.error('Check-in failed:', error);
    }
  };
  
  const CurrentStepComponent = checkInSteps[currentStep].component;
  
  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {checkInSteps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center ${
                index < checkInSteps.length - 1 ? 'flex-1' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index <= currentStep
                    ? 'bg-brand-primary text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {index + 1}
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">
                {step.title}
              </span>
              {index < checkInSteps.length - 1 && (
                <div
                  className={`flex-1 h-px ml-4 ${
                    index < currentStep ? 'bg-brand-primary' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Step content */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-6">
          {checkInSteps[currentStep].title}
        </h2>
        
        <CurrentStepComponent
          data={checkInData}
          onChange={setCheckInData}
          reservationId={reservationId}
        />
        
        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="btn btn-secondary"
          >
            Back
          </button>
          
          {isLastStep ? (
            <button
              onClick={handleComplete}
              disabled={!canProceed}
              className="btn btn-primary"
            >
              Complete Check-In
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className="btn btn-primary"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
```

---

## Permission Integration

### Hotel-Specific Permissions

Following the existing `PermissionGate.tsx` pattern, we'll define hotel-specific permissions:

```typescript
// Hotel operation permissions
export const HOTEL_PERMISSIONS = {
  // Front desk operations
  FRONT_DESK_ACCESS: { resource: 'front_desk', action: 'access', scope: 'property' },
  CHECK_IN_GUEST: { resource: 'reservation', action: 'check_in', scope: 'property' },
  CHECK_OUT_GUEST: { resource: 'reservation', action: 'check_out', scope: 'property' },
  MODIFY_RESERVATION: { resource: 'reservation', action: 'update', scope: 'property' },
  
  // Room management
  VIEW_ROOMS: { resource: 'room', action: 'view', scope: 'property' },
  UPDATE_ROOM_STATUS: { resource: 'room', action: 'update_status', scope: 'property' },
  ASSIGN_ROOM: { resource: 'room', action: 'assign', scope: 'property' },
  VIEW_ROOM_HISTORY: { resource: 'room', action: 'view_history', scope: 'property' },
  
  // Guest management
  VIEW_GUEST_DATA: { resource: 'guest', action: 'view', scope: 'property' },
  UPDATE_GUEST_PROFILE: { resource: 'guest', action: 'update', scope: 'property' },
  VIEW_GUEST_HISTORY: { resource: 'guest', action: 'view_history', scope: 'property' },
  
  // Housekeeping operations
  VIEW_HOUSEKEEPING: { resource: 'housekeeping', action: 'view', scope: 'department' },
  MANAGE_ASSIGNMENTS: { resource: 'housekeeping', action: 'assign', scope: 'department' },
  UPDATE_INVENTORY: { resource: 'inventory', action: 'update', scope: 'department' },
  
  // Maintenance operations
  VIEW_MAINTENANCE: { resource: 'maintenance', action: 'view', scope: 'property' },
  CREATE_WORK_ORDER: { resource: 'work_order', action: 'create', scope: 'property' },
  ASSIGN_WORK_ORDER: { resource: 'work_order', action: 'assign', scope: 'department' },
  VIEW_MAINTENANCE_COSTS: { resource: 'maintenance', action: 'view_costs', scope: 'property' },
} as const;
```

### Permission-Protected Components

```typescript
// Room status grid with permissions
const RoomStatusGrid: React.FC = () => {
  return (
    <PermissionGate commonPermission={HOTEL_PERMISSIONS.VIEW_ROOMS}>
      <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-2">
        {rooms.map(room => (
          <RoomCard
            key={room.id}
            room={room}
            onStatusUpdate={(roomId, status) => (
              <PermissionGate commonPermission={HOTEL_PERMISSIONS.UPDATE_ROOM_STATUS}>
                <button onClick={() => updateRoomStatus(roomId, status)}>
                  Update Status
                </button>
              </PermissionGate>
            )}
          />
        ))}
      </div>
    </PermissionGate>
  );
};

// Check-in button with permission check
const CheckInButton: React.FC<{ reservationId: string }> = ({ reservationId }) => {
  return (
    <PermissionGate 
      commonPermission={HOTEL_PERMISSIONS.CHECK_IN_GUEST}
      unauthorized={
        <span className="text-gray-400 text-sm">
          No permission to check in guests
        </span>
      }
    >
      <button 
        onClick={() => initiateCheckIn(reservationId)}
        className="btn btn-primary"
      >
        Check In
      </button>
    </PermissionGate>
  );
};

// Maintenance cost display with permission
const MaintenanceCostDisplay: React.FC<{ workOrder: WorkOrder }> = ({ workOrder }) => {
  const { hasPermission } = usePermissions();
  const [canViewCosts, setCanViewCosts] = useState(false);
  
  useEffect(() => {
    const checkCostPermission = async () => {
      const allowed = await hasPermission('maintenance', 'view_costs', 'property');
      setCanViewCosts(allowed);
    };
    checkCostPermission();
  }, [hasPermission]);
  
  return (
    <div>
      <h3>Work Order Details</h3>
      <p>Status: {workOrder.status}</p>
      <p>Priority: {workOrder.priority}</p>
      
      {canViewCosts ? (
        <div>
          <p>Estimated Cost: ${workOrder.estimatedCost}</p>
          <p>Actual Cost: ${workOrder.actualCost}</p>
        </div>
      ) : (
        <p className="text-gray-500 text-sm">
          Cost information restricted
        </p>
      )}
    </div>
  );
};
```

---

## Real-time Features

### WebSocket Integration

For critical hotel operations that require real-time updates:

```typescript
// WebSocket service for real-time updates
class HotelWebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Function[]> = new Map();
  
  connect() {
    const wsUrl = `${getWebSocketBaseUrl()}/hotel-operations`;
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('Hotel operations WebSocket connected');
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
    
    this.ws.onclose = () => {
      console.log('Hotel operations WebSocket disconnected');
      // Attempt to reconnect
      setTimeout(() => this.connect(), 5000);
    };
  }
  
  private handleMessage(message: any) {
    const listeners = this.listeners.get(message.type) || [];
    listeners.forEach(listener => listener(message.data));
  }
  
  subscribe(eventType: string, callback: Function) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)?.push(callback);
  }
  
  unsubscribe(eventType: string, callback: Function) {
    const listeners = this.listeners.get(eventType) || [];
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }
  
  sendMessage(type: string, data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    }
  }
}

export const hotelWebSocket = new HotelWebSocketService();

// Hook for WebSocket integration
export const useHotelWebSocket = (eventType: string, callback: Function) => {
  useEffect(() => {
    hotelWebSocket.subscribe(eventType, callback);
    return () => hotelWebSocket.unsubscribe(eventType, callback);
  }, [eventType, callback]);
};
```

### Real-time Components

```typescript
// Real-time room status component
const RealTimeRoomStatus: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const queryClient = useQueryClient();
  
  // WebSocket updates for room status
  useHotelWebSocket('ROOM_STATUS_UPDATE', useCallback((update: RoomStatusUpdate) => {
    setRooms(prevRooms => 
      prevRooms.map(room => 
        room.id === update.roomId 
          ? { ...room, status: update.status, lastUpdated: update.timestamp }
          : room
      )
    );
    
    // Update query cache
    queryClient.setQueryData(
      hotelQueryKeys.rooms.status(),
      (oldData: any) => updateRoomInList(oldData, update)
    );
  }, [queryClient]));
  
  // Real-time notifications
  useHotelWebSocket('URGENT_MAINTENANCE', useCallback((alert: MaintenanceAlert) => {
    toast.error(`Urgent maintenance required: Room ${alert.roomNumber}`);
  }, []));
  
  // Initial data load
  const { data: initialRooms } = useRoomStatus();
  
  useEffect(() => {
    if (initialRooms) {
      setRooms(initialRooms);
    }
  }, [initialRooms]);
  
  return (
    <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
      {rooms.map(room => (
        <RoomCard
          key={room.id}
          room={room}
          showLastUpdated={true}
          onStatusChange={(newStatus) => {
            // Optimistic update
            setRooms(prev => prev.map(r => 
              r.id === room.id ? { ...r, status: newStatus } : r
            ));
            
            // Send WebSocket update
            hotelWebSocket.sendMessage('UPDATE_ROOM_STATUS', {
              roomId: room.id,
              status: newStatus,
            });
          }}
        />
      ))}
    </div>
  );
};

// Real-time housekeeping assignments
const RealTimeAssignments: React.FC = () => {
  const [assignments, setAssignments] = useState<HousekeepingAssignment[]>([]);
  
  // Listen for assignment updates
  useHotelWebSocket('ASSIGNMENT_UPDATE', useCallback((update: AssignmentUpdate) => {
    setAssignments(prev => prev.map(assignment =>
      assignment.id === update.assignmentId
        ? { ...assignment, ...update.changes }
        : assignment
    ));
  }, []));
  
  // Listen for new assignments
  useHotelWebSocket('NEW_ASSIGNMENT', useCallback((newAssignment: HousekeepingAssignment) => {
    setAssignments(prev => [...prev, newAssignment]);
  }, []));
  
  return (
    <div className="space-y-4">
      {assignments.map(assignment => (
        <AssignmentCard
          key={assignment.id}
          assignment={assignment}
          onStatusUpdate={(assignmentId, status) => {
            // Optimistic update
            setAssignments(prev => prev.map(a =>
              a.id === assignmentId ? { ...a, status } : a
            ));
            
            // Send update via WebSocket
            hotelWebSocket.sendMessage('UPDATE_ASSIGNMENT', {
              assignmentId,
              status,
            });
          }}
        />
      ))}
    </div>
  );
};
```

### Polling for Non-Critical Updates

For less critical updates, we'll use intelligent polling:

```typescript
// Smart polling hook
export const useSmartPolling = (
  queryKey: any[],
  queryFn: () => Promise<any>,
  options: {
    interval?: number;
    enabled?: boolean;
    priority: 'high' | 'medium' | 'low';
  }
) => {
  const intervals = {
    high: 15000,    // 15 seconds
    medium: 60000,  // 1 minute
    low: 300000,    // 5 minutes
  };
  
  return useQuery({
    queryKey,
    queryFn,
    refetchInterval: options.interval || intervals[options.priority],
    enabled: options.enabled,
    staleTime: intervals[options.priority] / 2,
  });
};

// Usage in components
const GuestArrivals = () => {
  const { data: arrivals } = useSmartPolling(
    ['guest-arrivals', format(new Date(), 'yyyy-MM-dd')],
    () => reservationService.getTodaysArrivals(),
    { priority: 'high' }
  );
  
  return (
    <div>
      {arrivals?.map(arrival => (
        <ArrivalCard key={arrival.id} reservation={arrival} />
      ))}
    </div>
  );
};
```

---

## Mobile Responsive Design

### Mobile-First Components

All hotel operation components will be designed mobile-first for operational staff who work on tablets and phones:

```typescript
// Responsive room status grid
const ResponsiveRoomGrid: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  useEffect(() => {
    // Auto-switch to list view on mobile for better usability
    if (isMobile && viewMode === 'grid') {
      setViewMode('list');
    }
  }, [isMobile, viewMode]);
  
  return (
    <div>
      {/* View mode switcher - hidden on mobile */}
      <div className="hidden md:flex justify-end mb-4">
        <div className="btn-group">
          <button
            onClick={() => setViewMode('grid')}
            className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Grid View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
          >
            List View
          </button>
        </div>
      </div>
      
      {/* Responsive grid */}
      <div className={
        viewMode === 'grid'
          ? 'grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12 gap-2'
          : 'space-y-2'
      }>
        {rooms.map(room => (
          <RoomCard
            key={room.id}
            room={room}
            variant={viewMode === 'grid' ? 'compact' : 'detailed'}
            showQuickActions={!isMobile}
          />
        ))}
      </div>
    </div>
  );
};

// Mobile-optimized check-in form
const MobileCheckInForm: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Mobile-friendly form layout */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="form-label text-lg">Guest Name</label>
          <input
            type="text"
            className="form-input text-lg py-3" // Larger touch targets
            placeholder="Enter guest name"
          />
        </div>
        
        <div>
          <label className="form-label text-lg">Room Assignment</label>
          <select className="form-input text-lg py-3">
            <option>Select Available Room</option>
            {availableRooms.map(room => (
              <option key={room.id} value={room.id}>
                Room {room.number} - {room.type.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Mobile-optimized button layout */}
      <div className="grid grid-cols-1 gap-3">
        <button className="btn btn-primary btn-lg py-4 text-lg">
          Complete Check-In
        </button>
        <button className="btn btn-secondary btn-lg py-4 text-lg">
          Save Draft
        </button>
      </div>
    </div>
  );
};
```

### Touch-Friendly Interactions

```typescript
// Touch-optimized room card
const TouchOptimizedRoomCard: React.FC<{ room: Room }> = ({ room }) => {
  const [showActions, setShowActions] = useState(false);
  
  return (
    <div
      className="relative bg-white rounded-lg shadow-md border-2 transition-all duration-200"
      style={{
        borderColor: getRoomStatusColor(room.status),
        minHeight: '80px', // Minimum touch target size
      }}
      onTouchStart={() => setShowActions(true)}
      onTouchEnd={() => setTimeout(() => setShowActions(false), 3000)}
    >
      {/* Room basic info */}
      <div className="p-3">
        <div className="font-bold text-lg">{room.number}</div>
        <div className="text-sm text-gray-600">{room.type.name}</div>
        <div className="text-xs text-gray-500">{room.status}</div>
      </div>
      
      {/* Touch-activated quick actions */}
      {showActions && (
        <div className="absolute inset-0 bg-black bg-opacity-75 rounded-lg flex items-center justify-center">
          <div className="flex space-x-2">
            <button className="btn btn-sm btn-primary">
              Clean
            </button>
            <button className="btn btn-sm btn-secondary">
              Inspect
            </button>
            <button className="btn btn-sm btn-accent">
              Maintenance
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Swipe-enabled assignment cards
const SwipeableAssignmentCard: React.FC<{ assignment: HousekeepingAssignment }> = ({ assignment }) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    // Store initial touch position
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    // Calculate swipe offset
  };
  
  const handleTouchEnd = () => {
    if (swipeOffset > 100) {
      // Complete assignment
      completeAssignment(assignment.id);
    } else if (swipeOffset < -100) {
      // Mark as issue
      reportIssue(assignment.id);
    }
    setSwipeOffset(0);
  };
  
  return (
    <div
      className="relative bg-white rounded-lg shadow-md p-4 transform transition-transform duration-200"
      style={{ transform: `translateX(${swipeOffset}px)` }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Assignment content */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">
            Rooms: {assignment.rooms.map(r => r.number).join(', ')}
          </h3>
          <p className="text-gray-600">
            Assigned to: {assignment.staffMember.firstName} {assignment.staffMember.lastName}
          </p>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-500">Status</div>
          <StatusBadge status={assignment.status} />
        </div>
      </div>
      
      {/* Swipe indicators */}
      <div className="absolute inset-y-0 left-0 flex items-center pl-2 opacity-50">
        <span className="text-green-500">✓ Complete</span>
      </div>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 opacity-50">
        <span className="text-red-500">⚠ Issue</span>
      </div>
    </div>
  );
};
```

### Tablet Optimization

```typescript
// Tablet-optimized layout for front desk operations
const TabletFrontDeskLayout: React.FC = () => {
  return (
    <div className="h-screen flex flex-col lg:flex-row">
      {/* Left panel - Room status */}
      <div className="flex-1 lg:w-2/3 p-4">
        <div className="bg-white rounded-lg shadow-lg h-full p-6">
          <h2 className="text-xl font-bold mb-4">Room Status</h2>
          <ResponsiveRoomGrid />
        </div>
      </div>
      
      {/* Right panel - Today's operations */}
      <div className="flex-1 lg:w-1/3 p-4 space-y-4">
        {/* Check-ins */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h3 className="font-semibold text-lg mb-3 text-green-600">
            Today's Check-ins ({todaysCheckins.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {todaysCheckins.map(checkin => (
              <CheckInCard key={checkin.id} reservation={checkin} compact />
            ))}
          </div>
        </div>
        
        {/* Check-outs */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h3 className="font-semibold text-lg mb-3 text-blue-600">
            Today's Check-outs ({todaysCheckouts.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {todaysCheckouts.map(checkout => (
              <CheckOutCard key={checkout.id} reservation={checkout} compact />
            ))}
          </div>
        </div>
        
        {/* Quick actions */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h3 className="font-semibold text-lg mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn btn-primary btn-lg">
              Walk-in Registration
            </button>
            <button className="btn btn-secondary btn-lg">
              Room Search
            </button>
            <button className="btn btn-accent btn-lg">
              Guest Lookup
            </button>
            <button className="btn btn-info btn-lg">
              Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

## Performance Optimization

### Code Splitting and Lazy Loading

```typescript
// Lazy load hotel operation pages
const FrontDeskDashboard = lazy(() => import('./pages/FrontDeskDashboard'));
const RoomManagementPage = lazy(() => import('./pages/RoomManagementPage'));
const ReservationsPage = lazy(() => import('./pages/ReservationsPage'));
const GuestManagementPage = lazy(() => import('./pages/GuestManagementPage'));
const HousekeepingPage = lazy(() => import('./pages/HousekeepingPage'));
const MaintenancePage = lazy(() => import('./pages/MaintenancePage'));

// Route-based code splitting
const HotelOperationsRoutes: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" text="Loading..." />}>
      <Routes>
        <Route path="/front-desk" element={<FrontDeskDashboard />} />
        <Route path="/rooms" element={<RoomManagementPage />} />
        <Route path="/reservations" element={<ReservationsPage />} />
        <Route path="/guests" element={<GuestManagementPage />} />
        <Route path="/housekeeping" element={<HousekeepingPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
      </Routes>
    </Suspense>
  );
};
```

### Virtualization for Large Data Sets

```typescript
// Virtualized room grid for properties with many rooms
import { FixedSizeGrid } from 'react-window';

const VirtualizedRoomGrid: React.FC<{ rooms: Room[] }> = ({ rooms }) => {
  const ITEM_WIDTH = 100;
  const ITEM_HEIGHT = 80;
  const ITEMS_PER_ROW = Math.floor(window.innerWidth / ITEM_WIDTH);
  
  const RoomCell = ({ columnIndex, rowIndex, style }: any) => {
    const roomIndex = rowIndex * ITEMS_PER_ROW + columnIndex;
    const room = rooms[roomIndex];
    
    if (!room) return <div style={style} />;
    
    return (
      <div style={style} className="p-1">
        <RoomCard room={room} compact />
      </div>
    );
  };
  
  return (
    <FixedSizeGrid
      columnCount={ITEMS_PER_ROW}
      columnWidth={ITEM_WIDTH}
      height={600}
      rowCount={Math.ceil(rooms.length / ITEMS_PER_ROW)}
      rowHeight={ITEM_HEIGHT}
      width="100%"
    >
      {RoomCell}
    </FixedSizeGrid>
  );
};

// Virtualized guest list
const VirtualizedGuestList: React.FC<{ guests: Guest[] }> = ({ guests }) => {
  const Row = ({ index, style }: any) => (
    <div style={style} className="border-b border-gray-200">
      <GuestCard guest={guests[index]} compact />
    </div>
  );
  
  return (
    <FixedSizeList
      height={600}
      itemCount={guests.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};
```

### Caching Strategies

```typescript
// Service worker for offline caching
const HOTEL_CACHE_NAME = 'hotel-operations-v1';
const CRITICAL_RESOURCES = [
  '/front-desk',
  '/rooms',
  '/api/hotel/rooms/status',
  '/api/hotel/reservations/today',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(HOTEL_CACHE_NAME)
      .then(cache => cache.addAll(CRITICAL_RESOURCES))
  );
});

// Intelligent cache invalidation
const useCacheInvalidation = () => {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // Invalidate room status every 30 seconds
    const roomStatusInterval = setInterval(() => {
      queryClient.invalidateQueries({
        queryKey: hotelQueryKeys.rooms.status(),
      });
    }, 30000);
    
    // Invalidate reservations every 2 minutes
    const reservationsInterval = setInterval(() => {
      queryClient.invalidateQueries({
        queryKey: hotelQueryKeys.reservations.all,
      });
    }, 120000);
    
    return () => {
      clearInterval(roomStatusInterval);
      clearInterval(reservationsInterval);
    };
  }, [queryClient]);
};

// Memory-efficient data handling
const useOptimizedRoomData = () => {
  return useMemo(() => {
    // Only keep essential room data in memory
    return rooms.map(room => ({
      id: room.id,
      number: room.number,
      status: room.status,
      type: room.type.name,
      floor: room.floor,
    }));
  }, [rooms]);
};
```

### Bundle Size Optimization

```typescript
// Webpack bundle analyzer configuration
// webpack.config.js additions for hotel operations
module.exports = {
  optimization: {
    splitChunks: {
      cacheGroups: {
        hotelOperations: {
          name: 'hotel-operations',
          chunks: 'all',
          test: /[\\/]hotel[\\/]/,
          priority: 30,
        },
        hotelComponents: {
          name: 'hotel-components',
          chunks: 'all',
          test: /[\\/]components[\\/]hotel[\\/]/,
          priority: 25,
        },
      },
    },
  },
};

// Tree shaking optimization
// Export only used components
export {
  RoomStatusGrid,
  ReservationCalendar,
  GuestProfile,
  CheckInWizard,
} from './components/hotel';

// Avoid importing entire libraries
import { format } from 'date-fns/format'; // Instead of entire date-fns
import { debounce } from 'lodash/debounce'; // Instead of entire lodash
```

---

## Integration with Existing Systems

### Theme Integration

```typescript
// Hotel-specific theme extensions
const hotelThemeExtensions = {
  colors: {
    roomStatus: {
      vacant: 'var(--brand-success)',
      occupied: 'var(--brand-primary)',
      dirty: 'var(--brand-warning)',
      maintenance: 'var(--brand-error)',
      outOfOrder: 'var(--brand-error-dark)',
    },
    reservationStatus: {
      confirmed: 'var(--brand-success)',
      pending: 'var(--brand-warning)',
      checkedIn: 'var(--brand-primary)',
      checkedOut: 'var(--brand-info)',
      cancelled: 'var(--brand-error)',
    },
    priority: {
      low: 'var(--brand-info)',
      medium: 'var(--brand-warning)',
      high: 'var(--brand-error)',
      urgent: 'var(--brand-error-dark)',
    },
  },
  spacing: {
    roomCard: '8px',
    calendarCell: '4px',
    operationalPadding: '16px',
  },
  borderRadius: {
    roomCard: '8px',
    operationalCard: '12px',
  },
};

// Use in hotel components
const RoomCard: React.FC<{ room: Room }> = ({ room }) => {
  return (
    <div
      className="rounded-lg p-3 shadow-md transition-all"
      style={{
        backgroundColor: 'var(--brand-surface)',
        borderLeft: `4px solid ${hotelThemeExtensions.colors.roomStatus[room.status]}`,
        borderRadius: hotelThemeExtensions.borderRadius.roomCard,
      }}
    >
      {/* Room content */}
    </div>
  );
};
```

### Multi-tenant Context Integration

```typescript
// Hotel operations with tenant context
const useHotelTenantContext = () => {
  const { currentOrganization, currentProperty } = useTenant();
  
  // Hotel-specific tenant context
  const hotelConfig = useMemo(() => {
    return {
      organizationId: currentOrganization?.id,
      propertyId: currentProperty?.id,
      roomCount: currentProperty?.roomCount || 0,
      amenities: currentProperty?.amenities || [],
      checkInTime: currentProperty?.checkInTime || '15:00',
      checkOutTime: currentProperty?.checkOutTime || '11:00',
      timezone: currentProperty?.timezone || 'UTC',
    };
  }, [currentOrganization, currentProperty]);
  
  return hotelConfig;
};

// Tenant-scoped API calls
class HotelTenantService {
  private getTenantHeaders() {
    const { currentOrganization, currentProperty } = getTenantContext();
    return {
      'X-Organization-ID': currentOrganization?.id,
      'X-Property-ID': currentProperty?.id,
    };
  }
  
  async getRooms() {
    return api.get('/hotel/rooms', {
      headers: this.getTenantHeaders(),
    });
  }
  
  async getReservations(filter?: ReservationFilter) {
    return api.get('/hotel/reservations', {
      headers: this.getTenantHeaders(),
      params: filter,
    });
  }
}
```

### Branding Integration

```typescript
// White-label hotel components
const BrandedHotelHeader: React.FC = () => {
  const { currentProperty } = useTenant();
  const { brandConfig } = useTheme();
  
  return (
    <header
      className="p-6 rounded-lg mb-6"
      style={{
        backgroundColor: brandConfig.colors.primary,
        color: brandConfig.colors.onPrimary,
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: brandConfig.fonts.heading }}>
            {currentProperty?.name} Operations
          </h1>
          <p className="opacity-90">
            Today is {format(new Date(), 'EEEE, MMMM do, yyyy')}
          </p>
        </div>
        
        <div className="text-right">
          <div className="text-sm opacity-90">Property Code</div>
          <div className="text-lg font-mono">{currentProperty?.code}</div>
        </div>
      </div>
    </header>
  );
};

// Branded status indicators
const BrandedRoomStatusBadge: React.FC<{ status: RoomStatus }> = ({ status }) => {
  const { brandConfig } = useTheme();
  
  const statusConfig = {
    vacant: { color: brandConfig.colors.success, label: 'Available' },
    occupied: { color: brandConfig.colors.primary, label: 'Occupied' },
    dirty: { color: brandConfig.colors.warning, label: 'Needs Cleaning' },
    maintenance: { color: brandConfig.colors.error, label: 'Maintenance' },
  };
  
  const config = statusConfig[status];
  
  return (
    <span
      className="px-2 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: `${config.color}20`,
        color: config.color,
        border: `1px solid ${config.color}`,
      }}
    >
      {config.label}
    </span>
  );
};
```

### Permission System Integration

```typescript
// Hotel-specific permission mappings
const HOTEL_ROLE_PERMISSIONS = {
  FRONT_DESK_AGENT: [
    HOTEL_PERMISSIONS.FRONT_DESK_ACCESS,
    HOTEL_PERMISSIONS.CHECK_IN_GUEST,
    HOTEL_PERMISSIONS.CHECK_OUT_GUEST,
    HOTEL_PERMISSIONS.VIEW_GUEST_DATA,
    HOTEL_PERMISSIONS.UPDATE_ROOM_STATUS,
  ],
  
  HOUSEKEEPING_SUPERVISOR: [
    HOTEL_PERMISSIONS.VIEW_HOUSEKEEPING,
    HOTEL_PERMISSIONS.MANAGE_ASSIGNMENTS,
    HOTEL_PERMISSIONS.UPDATE_INVENTORY,
    HOTEL_PERMISSIONS.VIEW_ROOMS,
    HOTEL_PERMISSIONS.UPDATE_ROOM_STATUS,
  ],
  
  MAINTENANCE_MANAGER: [
    HOTEL_PERMISSIONS.VIEW_MAINTENANCE,
    HOTEL_PERMISSIONS.CREATE_WORK_ORDER,
    HOTEL_PERMISSIONS.ASSIGN_WORK_ORDER,
    HOTEL_PERMISSIONS.VIEW_MAINTENANCE_COSTS,
  ],
};

// Context-aware permission checking
const useHotelPermissions = () => {
  const { hasPermission } = usePermissions();
  const { currentProperty } = useTenant();
  
  const hasHotelPermission = useCallback(
    async (permission: HotelPermission) => {
      return hasPermission(
        permission.resource,
        permission.action,
        permission.scope,
        {
          propertyId: currentProperty?.id,
          organizationId: currentProperty?.organizationId,
        }
      );
    },
    [hasPermission, currentProperty]
  );
  
  return { hasHotelPermission };
};
```

---

## Component Specifications

### RoomStatusGrid Component

```typescript
interface RoomStatusGridProps {
  rooms: Room[];
  viewMode?: 'grid' | 'list' | 'floor-plan';
  onRoomSelect?: (room: Room) => void;
  onStatusUpdate?: (roomId: string, status: RoomStatus) => void;
  showQuickActions?: boolean;
  groupBy?: 'floor' | 'type' | 'status' | 'none';
  filterBy?: RoomFilter;
  realTimeUpdates?: boolean;
}

const RoomStatusGrid: React.FC<RoomStatusGridProps> = ({
  rooms,
  viewMode = 'grid',
  onRoomSelect,
  onStatusUpdate,
  showQuickActions = true,
  groupBy = 'none',
  filterBy,
  realTimeUpdates = true,
}) => {
  // Component implementation
  return (
    <div className="room-status-grid">
      {/* Implementation */}
    </div>
  );
};
```

### ReservationCalendar Component

```typescript
interface ReservationCalendarProps {
  view: 'month' | 'week' | 'day';
  date: Date;
  reservations: Reservation[];
  onDateChange: (date: Date) => void;
  onReservationSelect?: (reservation: Reservation) => void;
  onTimeSlotSelect?: (date: Date, hour: number) => void;
  showAvailability?: boolean;
  roomTypes?: RoomType[];
  editable?: boolean;
}

const ReservationCalendar: React.FC<ReservationCalendarProps> = ({
  view,
  date,
  reservations,
  onDateChange,
  onReservationSelect,
  onTimeSlotSelect,
  showAvailability = true,
  roomTypes,
  editable = false,
}) => {
  // Component implementation
  return (
    <div className="reservation-calendar">
      {/* Calendar implementation */}
    </div>
  );
};
```

### GuestProfileCard Component

```typescript
interface GuestProfileCardProps {
  guest: Guest;
  variant?: 'detailed' | 'compact' | 'summary';
  showActions?: boolean;
  onEdit?: () => void;
  onViewHistory?: () => void;
  onSendMessage?: () => void;
  showPreferences?: boolean;
  showVipStatus?: boolean;
}

const GuestProfileCard: React.FC<GuestProfileCardProps> = ({
  guest,
  variant = 'detailed',
  showActions = true,
  onEdit,
  onViewHistory,
  onSendMessage,
  showPreferences = true,
  showVipStatus = true,
}) => {
  // Component implementation
  return (
    <div className="guest-profile-card">
      {/* Guest profile implementation */}
    </div>
  );
};
```

### CheckInWizard Component

```typescript
interface CheckInWizardProps {
  reservationId: string;
  onComplete: (result: CheckInResult) => void;
  onCancel: () => void;
  skipSteps?: string[];
  customSteps?: CheckInStep[];
  autoSave?: boolean;
}

const CheckInWizard: React.FC<CheckInWizardProps> = ({
  reservationId,
  onComplete,
  onCancel,
  skipSteps = [],
  customSteps,
  autoSave = true,
}) => {
  // Wizard implementation
  return (
    <div className="check-in-wizard">
      {/* Multi-step wizard implementation */}
    </div>
  );
};
```

### WorkOrderBoard Component

```typescript
interface WorkOrderBoardProps {
  workOrders: WorkOrder[];
  columns: WorkOrderColumn[];
  onWorkOrderMove: (workOrderId: string, newStatus: WorkOrderStatus) => void;
  onWorkOrderSelect?: (workOrder: WorkOrder) => void;
  onCreateWorkOrder?: () => void;
  groupBy?: 'priority' | 'assignee' | 'category';
  filterBy?: WorkOrderFilter;
}

const WorkOrderBoard: React.FC<WorkOrderBoardProps> = ({
  workOrders,
  columns,
  onWorkOrderMove,
  onWorkOrderSelect,
  onCreateWorkOrder,
  groupBy,
  filterBy,
}) => {
  // Kanban board implementation
  return (
    <div className="work-order-board">
      {/* Draggable kanban board implementation */}
    </div>
  );
};
```

---

## Implementation Timeline

### Phase 1: Foundation (Weeks 1-4)
**Core Infrastructure & Basic Components**

#### Week 1: Project Setup & Base Architecture
- Set up hotel operations module structure
- Create base TypeScript interfaces and types
- Implement API service layer foundation
- Set up TanStack Query hooks architecture

#### Week 2: Core Components
- Implement base room status components
- Create basic reservation calendar
- Build guest profile components
- Develop permission integration layer

#### Week 3: Data Layer & State Management
- Implement room service with full CRUD
- Create reservation service
- Build guest service
- Set up real-time data synchronization

#### Week 4: Basic UI Pages
- Create Front Desk Dashboard (basic version)
- Implement Room Management page
- Build Guest Management page
- Add routing and navigation

### Phase 2: Core Operations (Weeks 5-8)
**Essential Hotel Operations Features**

#### Week 5: Room Management
- Complete room status grid with real-time updates
- Implement room assignment functionality
- Add room history tracking
- Build maintenance request integration

#### Week 6: Reservation Management
- Full calendar implementation (month/week/day views)
- Check-in/check-out wizard components
- Reservation search and filtering
- Availability management

#### Week 7: Guest Services
- Complete guest profile management
- Stay history and preferences
- Guest communication features
- VIP and loyalty program integration

#### Week 8: Testing & Optimization
- Comprehensive testing of core features
- Performance optimization
- Mobile responsiveness testing
- User acceptance testing with hotel staff

### Phase 3: Advanced Operations (Weeks 9-12)
**Housekeeping & Maintenance Systems**

#### Week 9: Housekeeping Module
- Assignment dashboard and scheduling
- Inventory tracking system
- Quality control checklists
- Staff performance metrics

#### Week 10: Maintenance Management
- Work order kanban board
- Asset management system
- Preventive maintenance scheduling
- Vendor management integration

#### Week 11: Advanced Features
- Real-time WebSocket integration
- Advanced reporting dashboards
- Bulk operations and batch processing
- Integration with existing PMS systems

#### Week 12: Polish & Deployment
- Final UI/UX refinements
- Performance optimization
- Production deployment
- Training documentation

### Phase 4: Enhancement & Scale (Weeks 13-16)
**Mobile Optimization & Advanced Features**

#### Week 13: Mobile Optimization
- Touch-friendly interface refinements
- Tablet-specific layouts
- Offline capability implementation
- Progressive Web App features

#### Week 14: Advanced Analytics
- Operational metrics dashboard
- Revenue management integration
- Business intelligence reporting
- Custom report builder

#### Week 15: Integration & Automation
- Channel manager integration
- Automated workflows
- Email/SMS notifications
- Third-party service integration

#### Week 16: Training & Documentation
- Comprehensive user documentation
- Video training materials
- Admin configuration guides
- Ongoing support setup

### Implementation Milestones

#### Milestone 1 (End of Week 4): Foundation Complete
- ✅ Basic architecture and components implemented
- ✅ Core services and API integration working
- ✅ Permission system integrated
- ✅ Basic pages functional

#### Milestone 2 (End of Week 8): Core Operations Live
- ✅ Room management fully operational
- ✅ Reservation system functional
- ✅ Guest management complete
- ✅ Check-in/check-out processes working

#### Milestone 3 (End of Week 12): Full Operations Suite
- ✅ Housekeeping operations functional
- ✅ Maintenance management operational
- ✅ Real-time updates working
- ✅ Advanced features implemented

#### Milestone 4 (End of Week 16): Production Ready
- ✅ Mobile optimization complete
- ✅ Advanced analytics operational
- ✅ Integration with external systems
- ✅ Training and documentation complete

### Success Criteria

#### Technical Success Criteria
- Page load times under 2 seconds
- Real-time updates with <5 second latency
- Mobile responsiveness on all major devices
- 99.9% uptime during operational hours
- Concurrent user support (50+ users per property)

#### User Experience Success Criteria
- Intuitive interfaces requiring minimal training
- Touch-friendly mobile operations
- Consistent branding across all hotel operations
- Accessibility compliance (WCAG 2.1 AA)
- Multi-language support (English/Spanish)

#### Business Success Criteria
- Reduced check-in/check-out processing time by 40%
- Improved room turnover efficiency by 25%
- Enhanced guest satisfaction through faster service
- Streamlined housekeeping and maintenance operations
- Comprehensive operational reporting and analytics

---

## Conclusion

This comprehensive frontend architecture provides a solid foundation for implementing hotel core operations within the existing Hotel Operations Hub platform. By building on established patterns and extending with hotel-specific functionality, we can deliver a powerful, scalable, and user-friendly system that meets the demanding requirements of hotel operations while maintaining consistency with the overall platform architecture.

The phased implementation approach ensures steady progress with regular deliverables, allowing for continuous feedback and refinement throughout the development process. The focus on mobile optimization, real-time updates, and operational efficiency addresses the critical needs of hotel staff who rely on these systems for daily operations.

The architecture's integration with existing multi-tenant, white-label, and permission systems ensures that the hotel operations features will work seamlessly across different properties and organizational structures while maintaining security and data isolation requirements.