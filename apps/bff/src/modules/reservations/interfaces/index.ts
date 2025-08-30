import { Reservation, Unit, Guest } from '@prisma/client';

export interface ReservationWithDetails extends Reservation {
  unit: Unit;
  guest: Guest;
}

export interface ReservationStats {
  total: number;
  confirmed: number;
  checkedIn: number;
  checkedOut: number;
  cancelled: number;
  pending: number;
  totalRevenue: number;
  averageNightlyRate: number;
  occupancyRate: number;
  averageStayDuration: number;
}

export interface RevenueAnalytics {
  period: string;
  totalRevenue: number;
  totalReservations: number;
  averageDailyRate: number;
  revenuePaid: number;
  revenuePending: number;
}

export interface OccupancyAnalytics {
  date: string;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number;
  revenue: number;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictingReservations: Reservation[];
  suggestedUnits: Unit[];
}