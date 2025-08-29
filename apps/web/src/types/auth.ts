import { UserType } from '@prisma/client';

// Re-export UserType from Prisma
export { UserType };

export interface ExternalUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  externalOrganizationId: string;
  accessPortal: string;
  externalReference?: string;
  profilePhoto?: string;
  phoneNumber?: string;
}

export interface InternalUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'PLATFORM_ADMIN' | 'ORGANIZATION_OWNER' | 'ORGANIZATION_ADMIN' | 'PROPERTY_MANAGER' | 'DEPARTMENT_ADMIN' | 'STAFF';
  userType: UserType;
  departmentId?: string;
  profilePhoto?: string;
  phoneNumber?: string;
  organizationId?: string;
  propertyId?: string;
  properties?: Property[];
}

export interface Property {
  id: string;
  name: string;
  code: string;
  address?: string;
  organizationId: string;
}

export type User = InternalUser | ExternalUser;

export interface AuthUser extends User {
  // Union of all possible user properties for backwards compatibility
  role?: 'PLATFORM_ADMIN' | 'ORGANIZATION_OWNER' | 'ORGANIZATION_ADMIN' | 'PROPERTY_MANAGER' | 'DEPARTMENT_ADMIN' | 'STAFF';
  departmentId?: string;
  organizationId?: string;
  propertyId?: string;
  properties?: Property[];
  externalOrganizationId?: string;
  accessPortal?: string;
  externalReference?: string;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  organization?: Organization;
  property?: Property;
  availableProperties?: Property[];
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  branding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

export interface TenantInfo {
  organizationId?: string;
  organization?: Organization;
  propertyId?: string;
  property?: Property;
  availableProperties?: Property[];
}

// User type predicates
export function isInternalUser(user: User): user is InternalUser {
  return user.userType === 'INTERNAL' && 'role' in user;
}

export function isExternalUser(user: User): user is ExternalUser {
  return user.userType !== 'INTERNAL' && 'externalOrganizationId' in user;
}

export function isClientUser(user: User): user is ExternalUser {
  return user.userType === 'CLIENT';
}

export function isVendorUser(user: User): user is ExternalUser {
  return user.userType === 'VENDOR';
}

export function isPartnerUser(user: User): user is ExternalUser {
  return user.userType === 'PARTNER';
}

// Role-based access helpers
export function hasAdminAccess(user: User): boolean {
  if (isInternalUser(user)) {
    return ['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN'].includes(user.role);
  }
  return false;
}

export function canManageModules(user: User): boolean {
  if (isInternalUser(user)) {
    return ['PLATFORM_ADMIN', 'ORGANIZATION_OWNER'].includes(user.role);
  }
  return false;
}

export function canViewAllOrganizations(user: User): boolean {
  if (isInternalUser(user)) {
    return user.role === 'PLATFORM_ADMIN';
  }
  return false;
}