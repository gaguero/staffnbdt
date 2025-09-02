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
  | 'json'
  | 'relationship'
  | 'select'
  | 'multiselect'
  | 'quantity'
  | 'money'
  | 'file'
  | 'url'
  | 'email'
  | 'phone'
  | 'location'
  | 'richtext'
  | 'rating';

export interface ObjectType {
  id: string;
  organizationId: string;
  propertyId: string;
  name: string;
  fieldsSchema: ObjectTypeSchema;
  validations?: Record<string, any>;
  uiHints?: Record<string, any>;
  isActive: boolean;
  // Template system fields
  isTemplate?: boolean;
  parentId?: string;
  templateMetadata?: TemplateMetadata;
  // Relations
  parent?: Partial<ObjectType>;
  children?: Partial<ObjectType>[];
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
  // Enhanced field configuration
  config?: {
    // For relationship fields
    relationshipType?: 'guest' | 'reservation' | 'unit' | 'vendor' | 'object';
    multiple?: boolean;
    // For quantity fields
    unit?: string;
    units?: string[];
    // For money fields
    currency?: string;
    currencies?: string[];
    // For file fields
    acceptedTypes?: string[];
    maxSize?: number;
    // For rating fields
    maxRating?: number;
    ratingType?: 'stars' | 'slider' | 'thumbs' | 'numeric';
    // For rich text
    toolbar?: string[];
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
  // Visual builder support
  flowData?: PlaybookFlowData;
}

export interface PlaybookFlowData {
  nodes: PlaybookNode[];
  edges: PlaybookEdge[];
  viewport?: { x: number; y: number; zoom: number };
}

export interface PlaybookNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'enforcement';
  position: { x: number; y: number };
  data: PlaybookNodeData;
}

export interface PlaybookNodeData {
  label: string;
  nodeType: 'trigger' | 'condition' | 'action' | 'enforcement';
  config: PlaybookTrigger | PlaybookCondition | PlaybookAction | PlaybookEnforcement;
  isValid?: boolean;
  errors?: string[];
}

export interface PlaybookEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
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

// Template Types
export interface TemplateMetadata {
  usageCount?: number;
  rating?: number;
  ratingCount?: number;
  category?: string;
  tags?: string[];
  description?: string;
  author?: string;
  version?: string;
  createdAt?: string;
  updatedAt?: string;
  clonedFrom?: string;
  clonedAt?: string;
  clonedBy?: string;
  basedOn?: string;
}

export interface MarketplaceTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  rating: number;
  ratingCount: number;
  usageCount: number;
  author?: string;
  version: string;
  isSystem: boolean;
  fieldCount: number;
  hasChildren: boolean;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateAnalytics {
  totalTemplates: number;
  myTemplates: number;
  totalClones: number;
  popularTemplates: PopularTemplate[];
}

export interface PopularTemplate {
  id: string;
  name: string;
  usageCount: number;
  rating: number;
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
  isActive?: boolean;
  // Template fields
  isTemplate?: boolean;
  parentId?: string;
  templateMetadata?: TemplateMetadata;
}

export interface CloneTemplateInput {
  name?: string;
  fieldsSchema?: ObjectTypeSchema;
  description?: string;
  category?: string;
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  isPublic?: boolean;
}

export interface TemplateFilters {
  category?: string;
  minRating?: number;
  tags?: string[];
}

export interface ExecutePlaybookInput {
  playbookId: string;
  triggerData: Record<string, any>;
}

export interface CreatePlaybookInput {
  name: string;
  trigger: PlaybookTrigger;
  conditions?: PlaybookCondition[];
  actions?: PlaybookAction[];
  enforcements?: PlaybookEnforcement[];
  isActive?: boolean;
  flowData?: PlaybookFlowData;
}

export interface PlaybookValidationResult {
  isValid: boolean;
  errors: PlaybookValidationError[];
  warnings: PlaybookValidationWarning[];
}

export interface PlaybookValidationError {
  nodeId?: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface PlaybookValidationWarning {
  nodeId?: string;
  field: string;
  message: string;
  suggestion?: string;
}

export interface PlaybookPreviewResult {
  estimatedExecutionTime: number;
  expectedActions: PlaybookPreviewAction[];
  potentialIssues: string[];
  resourceRequirements: Record<string, any>;
}

export interface PlaybookPreviewAction {
  stepNumber: number;
  actionType: string;
  description: string;
  estimatedDuration: number;
  requiredResources: string[];
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
