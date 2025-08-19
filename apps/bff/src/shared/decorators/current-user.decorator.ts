import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User, Role } from '@prisma/client';

export interface CurrentUser {
  // Core user identification
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  
  // Multi-tenant context
  organizationId?: string | null;
  propertyId?: string | null;
  departmentId?: string | null;
  
  // Additional profile fields
  position?: string | null;
  hireDate?: Date | null;
  phoneNumber?: string | null;
  emergencyContact?: any;
  idDocument?: string | null;
  profilePhoto?: string | null;
  
  // Additional properties that might be added during authentication
  permissions?: string[]; // Runtime permissions cache
  sessionId?: string;
  lastLoginAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);