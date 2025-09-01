// Define UserType enum for frontend use (matches backend Prisma schema)
export enum UserType {
  INTERNAL = 'INTERNAL',
  CLIENT = 'CLIENT',
  VENDOR = 'VENDOR',
  PARTNER = 'PARTNER'
}

export interface ExternalUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType.CLIENT | UserType.VENDOR | UserType.PARTNER;
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
  role: 'PLATFORM_ADMIN' | 'ORGANIZATION_OWNER' | 'ORGANIZATION_ADMIN' | 'PROPERTY_MANAGER' | 'DEPARTMENT_ADMIN' | 'STAFF' | 'CLIENT' | 'VENDOR';
  userType: UserType.INTERNAL;
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

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  profilePhoto?: string;
  phoneNumber?: string;
  
  // Union of all possible user properties for backwards compatibility
  role?: 'PLATFORM_ADMIN' | 'ORGANIZATION_OWNER' | 'ORGANIZATION_ADMIN' | 'PROPERTY_MANAGER' | 'DEPARTMENT_ADMIN' | 'STAFF' | 'CLIENT' | 'VENDOR';
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

// User type predicates with proper type narrowing
export function isInternalUser(user: AuthUser | User | null | undefined): user is InternalUser {
  return !!user && user.userType === UserType.INTERNAL && 'role' in user;
}

export function isExternalUser(user: AuthUser | User | null | undefined): user is ExternalUser {
  return !!user && user.userType !== UserType.INTERNAL && 'externalOrganizationId' in user;
}

export function isClientUser(user: AuthUser | User | null | undefined): user is ExternalUser {
  return !!user && user.userType === UserType.CLIENT;
}

export function isVendorUser(user: AuthUser | User | null | undefined): user is ExternalUser {
  return !!user && user.userType === UserType.VENDOR;
}

export function isPartnerUser(user: AuthUser | User | null | undefined): user is ExternalUser {
  return !!user && user.userType === UserType.PARTNER;
}

// Role-based access helpers
export function hasAdminAccess(user: AuthUser | User | null | undefined): boolean {
  if (isInternalUser(user)) {
    return ['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN'].includes(user.role);
  }
  return false;
}

export function canManageModules(user: AuthUser | User | null | undefined): boolean {
  if (isInternalUser(user)) {
    return ['PLATFORM_ADMIN', 'ORGANIZATION_OWNER'].includes(user.role);
  }
  return false;
}

export function canViewAllOrganizations(user: AuthUser | User | null | undefined): boolean {
  if (isInternalUser(user)) {
    return user.role === 'PLATFORM_ADMIN';
  }
  return false;
}