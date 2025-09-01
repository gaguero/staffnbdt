// Concierge Module Types

export interface ConciergeObject {
  id: string;
  organizationId: string;
  propertyId: string;
  type: string;
  reservationId?: string;
  guestId?: string;
  status: ConciergeObjectStatus;
  dueAt?: Date;
  assignments?: Record<string, any>;
  files?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  attributes: ConciergeAttribute[];
  reservation?: any; // Expanded in API responses
  guest?: any; // Expanded in API responses
}

export interface ConciergeAttribute {
  id: string;
  objectId: string;
  fieldKey: string;
  fieldType: AttributeFieldType;
  stringValue?: string;
  numberValue?: number;
  booleanValue?: boolean;
  dateValue?: Date;
  jsonValue?: any;
}

export type ConciergeObjectStatus = 
  | 'open'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'overdue';

export type AttributeFieldType = 
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'json';

export interface ObjectType {
  id: string;
  organizationId: string;
  propertyId: string;
  name: string;
  fieldsSchema: ObjectTypeSchema;
  validations?: Record<string, any>;
  uiHints?: Record<string, any>;
  isActive: boolean;
}

export interface ObjectTypeSchema {
  fields: ObjectFieldDefinition[];
}

export interface ObjectFieldDefinition {
  key: string;
  type: AttributeFieldType;
  label: string;
  required: boolean;
  defaultValue?: any;
  options?: string[]; // For select fields
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface Playbook {
  id: string;
  organizationId: string;
  propertyId: string;
  name: string;
  trigger: PlaybookTrigger;
  conditions: PlaybookCondition[];
  actions: PlaybookAction[];
  enforcements?: PlaybookEnforcement[];
  isActive: boolean;
}

export type PlaybookTrigger = 
  | 'reservation.created'
  | 'concierge.object.completed'
  | 'manual';

export interface PlaybookCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

export interface PlaybookAction {
  type: 'create_object' | 'send_notification' | 'update_status' | 'assign_user';
  parameters: Record<string, any>;
}

export interface PlaybookEnforcement {
  type: 'sla' | 'dependency';
  parameters: {
    dueHours?: number;
    dependsOn?: string[];
  };
}

// Form Types
export interface CreateConciergeObjectInput {
  type: string;
  reservationId?: string;
  guestId?: string;
  dueAt?: Date;
  assignments?: Record<string, any>;
  attributes: Record<string, any>;
}

export interface UpdateConciergeObjectInput extends Partial<CreateConciergeObjectInput> {
  status?: ConciergeObjectStatus;
}

export interface CreateObjectTypeInput {
  name: string;
  fieldsSchema: ObjectTypeSchema;
  validations?: Record<string, any>;
  uiHints?: Record<string, any>;
}

export interface ExecutePlaybookInput {
  playbookId: string;
  triggerData: Record<string, any>;
}

// Filter Types
export interface ConciergeObjectFilter {
  type?: string[];
  status?: ConciergeObjectStatus[];
  search?: string;
  reservationId?: string;
  guestId?: string;
  assignedTo?: string;
  dueRange?: {
    start: Date;
    end: Date;
  };
  overdue?: boolean;
}

// View Types
export interface TodayBoardSection {
  title: string;
  status: ConciergeObjectStatus[];
  objects: ConciergeObject[];
  count: number;
}

export interface ReservationChecklist {
  reservationId: string;
  items: ChecklistItem[];
  completedCount: number;
  totalCount: number;
}

export interface ChecklistItem {
  id: string;
  objectId: string;
  type: string;
  title: string;
  status: ConciergeObjectStatus;
  dueAt?: Date;
  isRequired: boolean;
  completedAt?: Date;
}

export interface GuestTimelineEvent {
  id: string;
  type: 'concierge_object' | 'note' | 'file' | 'notification';
  title: string;
  description: string;
  timestamp: Date;
  status?: string;
  metadata?: Record<string, any>;
}

// API Response Types
export interface ConciergeStats {
  totalObjects: number;
  openObjects: number;
  overdueObjects: number;
  completedToday: number;
  averageCompletionTime: number;
}

// TanStack Query Keys
export const conciergeQueryKeys = {
  all: ['concierge'] as const,
  objects: {
    all: [...conciergeQueryKeys.all, 'objects'] as const,
    lists: () => [...conciergeQueryKeys.objects.all, 'list'] as const,
    list: (filter?: ConciergeObjectFilter) => [...conciergeQueryKeys.objects.lists(), { filter }] as const,
    details: () => [...conciergeQueryKeys.objects.all, 'detail'] as const,
    detail: (id: string) => [...conciergeQueryKeys.objects.details(), id] as const,
  },
  objectTypes: {
    all: [...conciergeQueryKeys.all, 'objectTypes'] as const,
    lists: () => [...conciergeQueryKeys.objectTypes.all, 'list'] as const,
    list: (filter?: any) => [...conciergeQueryKeys.objectTypes.lists(), { filter }] as const,
  },
  playbooks: {
    all: [...conciergeQueryKeys.all, 'playbooks'] as const,
    lists: () => [...conciergeQueryKeys.playbooks.all, 'list'] as const,
    list: (filter?: any) => [...conciergeQueryKeys.playbooks.lists(), { filter }] as const,
  },
  todayBoard: () => [...conciergeQueryKeys.all, 'todayBoard'] as const,
  reservationChecklist: (reservationId: string) => [...conciergeQueryKeys.all, 'reservationChecklist', reservationId] as const,
  guestTimeline: (guestId: string) => [...conciergeQueryKeys.all, 'guestTimeline', guestId] as const,
  stats: () => [...conciergeQueryKeys.all, 'stats'] as const,
};
