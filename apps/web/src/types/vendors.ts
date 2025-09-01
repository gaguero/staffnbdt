// Vendors Module Types

export interface Vendor {
  id: string;
  organizationId: string;
  propertyId: string;
  name: string;
  email?: string;
  phone?: string;
  category: VendorCategory;
  policies?: VendorPolicies;
  performance?: VendorPerformance;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  links: VendorLink[];
}

export type VendorCategory = 
  | 'transportation'
  | 'tours'
  | 'restaurants'
  | 'spa'
  | 'events'
  | 'shopping'
  | 'emergency'
  | 'maintenance'
  | 'other';

export interface VendorPolicies {
  responseTime: number; // hours
  cancellationPolicy: string;
  paymentTerms: string;
  specialInstructions?: string;
  requiresConfirmation: boolean;
  allowsModification: boolean;
  channels: VendorChannel[];
}

export type VendorChannel = 'email' | 'sms' | 'phone' | 'whatsapp';

export interface VendorPerformance {
  averageResponseTime: number; // hours
  confirmationRate: number; // percentage
  totalBookings: number;
  lastBookingDate?: Date;
  rating?: number; // 1-5 stars
  notes?: string[];
}

export interface VendorLink {
  id: string;
  vendorId: string;
  objectId: string;
  objectType: string;
  policyRef?: string;
  status: VendorLinkStatus;
  confirmationAt?: Date;
  expiresAt?: Date;
  portalToken?: string;
  notificationChannels: VendorChannel[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  vendor?: Vendor; // Expanded in API responses
}

export type VendorLinkStatus = 
  | 'pending'
  | 'confirmed'
  | 'declined'
  | 'expired'
  | 'cancelled';

export interface VendorPortalSession {
  token: string;
  vendorId: string;
  organizationId: string;
  propertyId: string;
  permissions: string[];
  expiresAt: Date;
  metadata: {
    linkId: string;
    objectType: string;
    objectId: string;
  };
}

// Form Types
export interface CreateVendorInput {
  name: string;
  email?: string;
  phone?: string;
  category: VendorCategory;
  policies?: Partial<VendorPolicies>;
}

export interface UpdateVendorInput extends Partial<CreateVendorInput> {
  isActive?: boolean;
  performance?: Partial<VendorPerformance>;
}

export interface CreateVendorLinkInput {
  vendorId: string;
  objectId: string;
  objectType: string;
  policyRef?: string;
  expiresAt?: Date;
  notificationChannels: VendorChannel[];
  metadata?: Record<string, any>;
}

export interface ConfirmVendorLinkInput {
  status: 'confirmed' | 'declined';
  notes?: string;
  estimatedTime?: Date;
  modifications?: Record<string, any>;
}

export interface GenerateMagicLinkInput {
  vendorId: string;
  linkId: string;
  expirationHours?: number;
}

// Filter Types
export interface VendorFilter {
  category?: VendorCategory[];
  search?: string;
  isActive?: boolean;
  hasActiveLinks?: boolean;
  performanceRating?: {
    min: number;
    max: number;
  };
}

export interface VendorLinkFilter {
  status?: VendorLinkStatus[];
  vendorId?: string;
  objectType?: string;
  search?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  expiringWithinHours?: number;
}

// View Types
export interface VendorDirectory {
  vendors: Vendor[];
  totalCount: number;
  categories: {
    category: VendorCategory;
    count: number;
  }[];
}

export interface VendorLinkTracking {
  linkId: string;
  vendor: Vendor;
  status: VendorLinkStatus;
  createdAt: Date;
  confirmationAt?: Date;
  expiresAt?: Date;
  notificationsSent: number;
  lastNotificationAt?: Date;
  portalAccessCount: number;
  lastPortalAccessAt?: Date;
}

export interface VendorPortalData {
  vendor: Vendor;
  link: VendorLink;
  objectDetails: {
    type: string;
    title: string;
    description: string;
    dueAt?: Date;
    metadata: Record<string, any>;
  };
  allowedActions: string[];
}

// Notification Types
export interface VendorNotification {
  id: string;
  linkId: string;
  channel: VendorChannel;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sentAt?: Date;
  deliveredAt?: Date;
  failureReason?: string;
  retryCount: number;
  nextRetryAt?: Date;
}

// API Response Types
export interface VendorStats {
  totalVendors: number;
  activeVendors: number;
  totalLinks: number;
  pendingConfirmations: number;
  expiringSoon: number;
  averageResponseTime: number;
  overallConfirmationRate: number;
  categoryBreakdown: {
    category: VendorCategory;
    count: number;
    averageRating?: number;
  }[];
}

// TanStack Query Keys
export const vendorsQueryKeys = {
  all: ['vendors'] as const,
  vendors: {
    all: [...vendorsQueryKeys.all, 'vendors'] as const,
    lists: () => [...vendorsQueryKeys.vendors.all, 'list'] as const,
    list: (filter?: VendorFilter) => [...vendorsQueryKeys.vendors.lists(), { filter }] as const,
    details: () => [...vendorsQueryKeys.vendors.all, 'detail'] as const,
    detail: (id: string) => [...vendorsQueryKeys.vendors.details(), id] as const,
  },
  links: {
    all: [...vendorsQueryKeys.all, 'links'] as const,
    lists: () => [...vendorsQueryKeys.links.all, 'list'] as const,
    list: (filter?: VendorLinkFilter) => [...vendorsQueryKeys.links.lists(), { filter }] as const,
    details: () => [...vendorsQueryKeys.links.all, 'detail'] as const,
    detail: (id: string) => [...vendorsQueryKeys.links.details(), id] as const,
    tracking: (id: string) => [...vendorsQueryKeys.links.all, 'tracking', id] as const,
  },
  portal: {
    all: [...vendorsQueryKeys.all, 'portal'] as const,
    session: (token: string) => [...vendorsQueryKeys.portal.all, 'session', token] as const,
  },
  directory: () => [...vendorsQueryKeys.all, 'directory'] as const,
  stats: () => [...vendorsQueryKeys.all, 'stats'] as const,
};
