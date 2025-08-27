import { Unit } from '@prisma/client';

export interface UnitWithReservations extends Unit {
  reservations?: any[];
}

export interface UnitAvailability {
  unitId: string;
  unit: Unit;
  isAvailable: boolean;
  conflictingReservations?: any[];
  availableFrom?: Date;
  availableUntil?: Date;
}

export interface UnitStats {
  total: number;
  available: number;
  occupied: number;
  maintenance: number;
  outOfOrder: number;
  reserved: number;
  occupancyRate: number;
  averageDailyRate: number;
}