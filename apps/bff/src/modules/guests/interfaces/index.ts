import { Guest } from '@prisma/client';

export interface GuestWithReservations extends Guest {
  reservations?: any[];
}

export interface GuestStats {
  total: number;
  vipGuests: number;
  blacklistedGuests: number;
  newGuestsThisMonth: number;
  returningGuests: number;
  averageStayDuration: number;
  topNationalities: Array<{ nationality: string; count: number }>;
}

export interface GuestHistory {
  guestId: string;
  totalReservations: number;
  totalNights: number;
  totalSpent: number;
  averageRating: number;
  lastVisit: Date;
  firstVisit: Date;
  loyaltyPoints: number;
}