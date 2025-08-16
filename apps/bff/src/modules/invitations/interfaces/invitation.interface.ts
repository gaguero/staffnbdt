import { Department, User, Role } from '@prisma/client';

// Local interfaces until Prisma generates the types
interface Invitation {
  id: string;
  email: string;
  token: string;
  role: Role;
  departmentId: string | null;
  invitedBy: string;
  status: InvitationStatus;
  expiresAt: Date;
  acceptedAt: Date | null;
  acceptedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

export interface InvitationWithRelations extends Invitation {
  department?: Department;
  invitedByUser: User;
  acceptedUser?: User;
}

export interface InvitationStats {
  total: number;
  pending: number;
  accepted: number;
  expired: number;
  cancelled: number;
  byRole: Record<Role, number>;
  byDepartment: Record<string, number>;
}

export interface EmailTemplate {
  subject: string;
  html: string;
}

export interface InvitationEmailData {
  email: string;
  firstName?: string;
  inviterName: string;
  departmentName?: string;
  role: string;
  invitationUrl: string;
  expiryDays: number;
  message?: string;
}