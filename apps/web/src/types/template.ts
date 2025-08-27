export interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  data: Record<string, any>;
  isPublic: boolean;
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  usage: TemplateUsage;
  tags: string[];
  version: string;
}

export interface TemplateCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  allowedFields: string[];
  schema?: Record<string, any>;
}

export interface TemplateUsage {
  count: number;
  lastUsed: Date | null;
  users: string[];
}

export interface CreateTemplateData {
  name: string;
  description: string;
  categoryId: string;
  data: Record<string, any>;
  isPublic?: boolean;
  isDefault?: boolean;
  tags?: string[];
}

export interface UpdateTemplateData extends Partial<CreateTemplateData> {}

export interface TemplateFilter {
  categoryId?: string;
  search?: string;
  isPublic?: boolean;
  createdBy?: string;
  tags?: string[];
}

export interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  filters: TemplateFilter;
  sortBy: 'name' | 'usage' | 'created' | 'updated';
  sortOrder: 'asc' | 'desc';
}

export interface SavedQuery {
  id: string;
  name: string;
  description?: string;
  query: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Predefined template categories
export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    id: 'department-structure',
    name: 'Department Structure',
    icon: '🏢',
    description: 'Pre-configured department hierarchies and role assignments',
    allowedFields: ['name', 'description', 'roles', 'permissions', 'structure'],
  },
  {
    id: 'user-roles',
    name: 'User Roles',
    icon: '👥',
    description: 'Common user role configurations with permissions',
    allowedFields: ['role', 'permissions', 'department', 'responsibilities'],
  },
  {
    id: 'organization-setup',
    name: 'Organization Setup',
    icon: '🏨',
    description: 'Complete organization configurations for hotel chains',
    allowedFields: ['settings', 'branding', 'policies', 'structure'],
  },
  {
    id: 'property-config',
    name: 'Property Configuration',
    icon: '🏨',
    description: 'Property-specific settings and configurations',
    allowedFields: ['amenities', 'services', 'rooms', 'policies'],
  },
  {
    id: 'workflow-automation',
    name: 'Workflow Automation',
    icon: '⚙️',
    description: 'Automated workflow templates for common processes',
    allowedFields: ['triggers', 'actions', 'conditions', 'notifications'],
  },
];

export const DEFAULT_TEMPLATES: Partial<Template>[] = [
  {
    name: 'Boutique Hotel Department Structure',
    description: 'Standard department structure for boutique hotels (50-100 rooms)',
    category: TEMPLATE_CATEGORIES[0],
    data: {
      departments: [
        { name: 'Front Desk', roles: ['Manager', 'Agent', 'Night Auditor'] },
        { name: 'Housekeeping', roles: ['Manager', 'Supervisor', 'Attendant'] },
        { name: 'Food & Beverage', roles: ['Manager', 'Server', 'Cook', 'Bartender'] },
        { name: 'Maintenance', roles: ['Manager', 'Technician'] },
        { name: 'Administration', roles: ['Manager', 'Assistant'] },
      ],
    },
    isPublic: true,
    isDefault: true,
    tags: ['boutique', 'small-hotel', 'standard'],
  },
  {
    name: 'Resort Department Structure',
    description: 'Comprehensive department structure for resort properties',
    category: TEMPLATE_CATEGORIES[0],
    data: {
      departments: [
        { name: 'Front Office', roles: ['Manager', 'Agent', 'Concierge', 'Bell Staff'] },
        { name: 'Housekeeping', roles: ['Manager', 'Supervisor', 'Attendant', 'Laundry Staff'] },
        { name: 'Food & Beverage', roles: ['Director', 'Restaurant Manager', 'Bar Manager', 'Chef', 'Server', 'Bartender'] },
        { name: 'Recreation', roles: ['Manager', 'Activities Coordinator', 'Lifeguard'] },
        { name: 'Spa & Wellness', roles: ['Manager', 'Therapist', 'Attendant'] },
        { name: 'Maintenance', roles: ['Manager', 'Technician', 'Groundskeeper'] },
        { name: 'Security', roles: ['Manager', 'Officer'] },
        { name: 'Sales & Marketing', roles: ['Director', 'Sales Manager', 'Coordinator'] },
      ],
    },
    isPublic: true,
    isDefault: true,
    tags: ['resort', 'large-hotel', 'comprehensive'],
  },
  {
    name: 'City Business Hotel',
    description: 'Department structure optimized for business travelers',
    category: TEMPLATE_CATEGORIES[0],
    data: {
      departments: [
        { name: 'Front Office', roles: ['Manager', 'Agent', 'Business Center Staff'] },
        { name: 'Housekeeping', roles: ['Manager', 'Supervisor', 'Attendant'] },
        { name: 'Food & Beverage', roles: ['Manager', 'Server', 'Banquet Staff'] },
        { name: 'Conference Services', roles: ['Manager', 'Coordinator', 'AV Technician'] },
        { name: 'Maintenance', roles: ['Manager', 'Technician'] },
        { name: 'Administration', roles: ['Manager', 'Assistant', 'Accountant'] },
      ],
    },
    isPublic: true,
    isDefault: true,
    tags: ['business-hotel', 'city', 'corporate'],
  },
];