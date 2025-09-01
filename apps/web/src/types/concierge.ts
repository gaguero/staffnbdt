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
    all: ['concierge', 'objects'] as const,
    lists: () => ['concierge', 'objects', 'list'] as const,
    list: (filter?: ConciergeObjectFilter) => ['concierge', 'objects', 'list', { filter }] as const,
    details: () => ['concierge', 'objects', 'detail'] as const,
    detail: (id: string) => ['concierge', 'objects', 'detail', id] as const,
  },
  objectTypes: {
    all: ['concierge', 'objectTypes'] as const,
    lists: () => ['concierge', 'objectTypes', 'list'] as const,
    list: (filter?: any) => ['concierge', 'objectTypes', 'list', { filter }] as const,
  },
  playbooks: {
    all: ['concierge', 'playbooks'] as const,
    lists: () => ['concierge', 'playbooks', 'list'] as const,
    list: (filter?: any) => ['concierge', 'playbooks', 'list', { filter }] as const,
  },
  todayBoard: () => ['concierge', 'todayBoard'] as const,
  reservationChecklist: (reservationId: string) => ['concierge', 'reservationChecklist', reservationId] as const,
  guestTimeline: (guestId: string) => ['concierge', 'guestTimeline', guestId] as const,
  stats: () => ['concierge', 'stats'] as const,
};
