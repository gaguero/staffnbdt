# Hotel Operations Hub - Module Specifications

## Module System Overview

Hotel Operations Hub implements a modular architecture where each operational area is a distinct module that can be enabled/disabled per property. This allows hotels to customize their platform based on their specific needs and scale from basic HR functionality to comprehensive hotel operations management.

## Core Platform Modules

### 1. Platform Core (Always Enabled)

**Purpose**: Essential platform functionality required by all tenants

**Components**:
- Multi-tenant management
- User authentication & authorization
- Permission system (RBAC + ABAC)
- White-label branding
- Multi-language support
- Audit logging
- Document management foundation

**Key Features**:
- Organization and property management
- User invitation and onboarding
- System health monitoring
- Base API framework
- Security layer (JWT, CORS, rate limiting)

**Dependencies**: None (core platform)

**Permissions Required**: Platform admin permissions for configuration

---

## Operational Modules

### 2. HR Module (Completed - 100%)

**Purpose**: Complete human resources management for hotel staff

**Components**:
- User profile management with photo uploads
- ID document verification workflow
- Department management with hierarchy
- Role-based access control
- Bulk user import/export
- Emergency contact management

**Key Features**:
```typescript
// User Management
- Create/edit/deactivate users
- Department assignment and transfers
- Role management (PLATFORM_ADMIN → STAFF)
- Bulk CSV import with validation
- Profile photo and ID document uploads
- Emergency contact management

// ID Verification
- Secure document upload (encrypted storage)
- Admin verification workflow
- Document approval/rejection
- Audit trail for compliance

// Department Management
- Hierarchical department structure
- Manager assignments
- Department statistics and reporting
- Cross-department user access
```

**API Endpoints**:
```typescript
// Users
GET    /api/users                    # List users (department-scoped)
POST   /api/users                    # Create user
GET    /api/users/:id                # Get user details
PUT    /api/users/:id                # Update user
DELETE /api/users/:id                # Deactivate user
PUT    /api/users/:id/role            # Change user role
PUT    /api/users/:id/department      # Transfer department
POST   /api/users/bulk-import         # CSV import
GET    /api/users/export              # CSV export

// Profiles
GET    /api/profile                   # Own profile
PUT    /api/profile                   # Update own profile
POST   /api/profile/photo             # Upload profile photo
POST   /api/profile/id-document       # Upload ID document
GET    /api/profile/id-status         # ID verification status

// Departments
GET    /api/departments               # List departments
POST   /api/departments               # Create department
PUT    /api/departments/:id           # Update department
GET    /api/departments/:id/stats     # Department statistics
```

**Permissions Required**:
- `users.create.department` - Create department users
- `users.read.department` - View department users
- `users.update.department` - Update department users
- `departments.create.property` - Create departments
- `id_verification.manage.property` - Manage ID verification

**Database Models**:
```typescript
User, Profile, Department, Document, AuditLog, UserInvitation
```

**Dependencies**: Platform Core

**Status**: ✅ Production Ready

---

### 3. Payroll Module (Completed - 90%)

**Purpose**: Payroll processing and payslip management

**Components**:
- CSV payroll import with validation
- Automated payslip generation (PDF)
- Multi-property payroll processing
- Payslip viewing and download
- Payroll statistics and reporting

**Key Features**:
```typescript
// Payroll Processing
- CSV import with row-level validation
- Idempotent processing (batch IDs)
- Multi-property support
- Error reporting and correction
- Automated PDF generation

// Payslip Management  
- Secure payslip storage (encrypted)
- Employee self-service viewing
- Download as PDF
- Historical payslip access
- Admin payroll overview
```

**API Endpoints**:
```typescript
// Payroll Import
POST   /api/payroll/import            # CSV payroll import
GET    /api/payroll/batches           # Import batch history
GET    /api/payroll/batch/:id         # Batch details

// Payslips
GET    /api/payslips                  # Own payslips (employees)
GET    /api/payslips/all              # All payslips (admin)
GET    /api/payslips/:id/download     # Download PDF
GET    /api/payroll/stats             # Payroll statistics
```

**Permissions Required**:
- `payroll.import.property` - Import payroll data
- `payroll.read.platform` - View all payroll (admin)
- `payroll.read.own` - View own payslips (employees)

**Database Models**:
```typescript
PayrollBatch, Payslip, PayrollError
```

**Dependencies**: HR Module (for user management)

**Status**: ✅ Production Ready (minor enhancements pending)

---

### 4. Training Module (Completed - 85%)

**Purpose**: Staff training and development management

**Components**:
- Modular training session builder
- Content blocks (text, video, files, quizzes)
- Progress tracking and completion rules
- Certificate generation
- Department-specific training assignments

**Key Features**:
```typescript
// Training Content
- Versioned training sessions
- Multiple content block types:
  - TEXT: Rich text content
  - FILE: Document attachments
  - VIDEO: Video links/embeds
  - LINK: External resources
  - FORM: Interactive quizzes
- Completion requirements
- Grading and scoring

// Progress Tracking
- Individual progress monitoring
- Completion certificates
- Department-wide analytics
- Training compliance reporting
```

**API Endpoints**:
```typescript
// Training Sessions
GET    /api/training                  # Available training
GET    /api/training/:id              # Training details
POST   /api/training/:id/enroll       # Enroll in training
PUT    /api/training/:id/progress     # Update progress
POST   /api/training/:id/complete     # Mark complete

// Administration
POST   /api/training                  # Create training (admin)
PUT    /api/training/:id              # Update training
GET    /api/training/stats            # Training statistics
```

**Permissions Required**:
- `training.read.department` - View department training
- `training.complete.own` - Complete own training
- `training.admin.property` - Training administration

**Database Models**:
```typescript
TrainingSession, TrainingEnrollment, TrainingProgress, TrainingCompletion
```

**Dependencies**: HR Module, Document Module

**Status**: 🔄 Near Complete (certificate generation pending)

---

### 5. Benefits Module (Completed - 95%)

**Purpose**: Commercial benefits and partner directory management

**Components**:
- Partner benefits directory
- Category-based organization (Dining, Wellness, Hotels, Shopping)
- Usage tracking and analytics
- Department-specific benefits
- Admin management interface

**Key Features**:
```typescript
// Benefits Directory
- Commercial partner listings
- Discount codes and offers
- Category filtering (Dining, Wellness, Hotels, etc.)
- Location-based filtering
- Usage tracking (anonymous)

// Administration
- Partner management
- Benefit creation/editing
- Usage analytics
- Department-specific assignments
```

**API Endpoints**:
```typescript
// Benefits Directory
GET    /api/benefits                  # List available benefits
GET    /api/benefits/:id              # Benefit details
POST   /api/benefits/:id/track        # Track usage

// Administration
POST   /api/benefits                  # Create benefit (admin)
PUT    /api/benefits/:id              # Update benefit
DELETE /api/benefits/:id              # Remove benefit
GET    /api/benefits/stats            # Usage statistics
```

**Permissions Required**:
- `benefits.read.property` - View property benefits
- `benefits.create.platform` - Create benefits (admin)
- `benefits.admin.platform` - Full benefits administration

**Database Models**:
```typescript
CommercialBenefit, BenefitUsage, BenefitCategory
```

**Dependencies**: Platform Core

**Status**: ✅ Production Ready

---

### 6. Documents Module (Completed - 80%)

**Purpose**: Centralized document management with scoped access

**Components**:
- Hierarchical document organization
- Department/property-scoped access
- Document versioning
- Secure file storage (R2)
- Metadata management and search

**Key Features**:
```typescript
// Document Management
- Secure file upload/download
- Tenant-scoped storage (org/property/dept)
- Document categorization
- Version control
- Access control per document

// Search & Organization
- Metadata-based search
- Category filtering
- Recent documents
- Document sharing within scope
```

**API Endpoints**:
```typescript
// Document Access
GET    /api/documents                 # List accessible documents
GET    /api/documents/:id             # Document details
GET    /api/documents/:id/download    # Download document
POST   /api/documents                 # Upload document

// Management
PUT    /api/documents/:id             # Update document
DELETE /api/documents/:id             # Delete document
GET    /api/documents/search          # Search documents
```

**Permissions Required**:
- `documents.read.department` - View department documents
- `documents.read.property` - View property documents
- `documents.read.platform` - View all documents (admin)

**Database Models**:
```typescript
Document, DocumentVersion, DocumentAccess
```

**Dependencies**: Platform Core (file storage)

**Status**: 🔄 Core functionality complete (search enhancements pending)

---

### 7. Vacation Module (Completed - 70%)

**Purpose**: Vacation request and approval workflow management

**Components**:
- Vacation request submission
- Approval workflow (manager → admin)
- Balance tracking and calculation
- Calendar integration
- Department coverage planning

**Key Features**:
```typescript
// Vacation Requests
- Employee request submission
- Manager approval workflow
- Balance calculation
- Conflict detection
- Email notifications

// Management
- Department vacation calendar
- Coverage planning
- Approval queue for managers
- Vacation policy configuration
```

**API Endpoints**:
```typescript
// Vacation Requests
GET    /api/vacation/requests         # Own requests (employee)
POST   /api/vacation/requests         # Create request
PUT    /api/vacation/requests/:id     # Update request

// Management
GET    /api/vacation/pending          # Pending approvals (manager)
PUT    /api/vacation/requests/:id/approve  # Approve request
GET    /api/vacation/calendar         # Department calendar
```

**Permissions Required**:
- `vacation.create.own` - Create vacation requests
- `vacation.approve.department` - Approve department requests
- `vacation.admin.property` - Vacation administration

**Database Models**:
```typescript
VacationRequest, VacationBalance, VacationPolicy
```

**Dependencies**: HR Module

**Status**: 🔄 Basic functionality complete (calendar integration pending)

---

## Hotel Operations Modules (Planned)

### 8. Front Desk Module (Planned - 0%)

**Purpose**: Complete front desk operations for guest management

**Components**:
- Guest registration and check-in/out
- Reservation management
- Room assignment and status
- Guest services coordination
- Front desk reporting

**Key Features**:
```typescript
// Guest Management
- Guest profile creation
- ID verification and registration
- Special requests tracking
- Guest history and preferences

// Reservations
- Reservation creation/modification
- Room assignment optimization
- Check-in/check-out processing
- No-show and cancellation handling

// Room Management
- Real-time room status
- Housekeeping coordination
- Maintenance requests
- Room type management
```

**Planned API Endpoints**:
```typescript
// Guests
GET    /api/guests                    # Guest directory
POST   /api/guests                    # Create guest profile
GET    /api/guests/:id                # Guest details
PUT    /api/guests/:id                # Update guest info

// Reservations
GET    /api/reservations              # Reservation list
POST   /api/reservations              # Create reservation
PUT    /api/reservations/:id          # Update reservation
POST   /api/reservations/:id/checkin  # Check-in guest
POST   /api/reservations/:id/checkout # Check-out guest

// Rooms/Units
GET    /api/units                     # Room inventory
PUT    /api/units/:id/status          # Update room status
GET    /api/units/availability        # Availability check
```

**Required Permissions**:
- `guests.create.property` - Create guest profiles
- `reservations.checkin.property` - Check-in guests
- `units.update.property` - Update room status
- `front_desk.reports.property` - Front desk reporting

**Database Models**:
```typescript
Guest, Reservation, Unit, RoomType, CheckInOut, GuestRequest
```

**Dependencies**: Platform Core, HR Module (for staff assignments)

**Estimated Timeline**: 6-8 weeks

---

### 9. Housekeeping Module (Planned - 0%)

**Purpose**: Housekeeping operations and room maintenance

**Components**:
- Room cleaning schedules
- Housekeeping assignments
- Inventory management (linens, supplies)
- Quality control checklists
- Maintenance coordination

**Key Features**:
```typescript
// Room Status Management
- Room cleaning assignments
- Status tracking (dirty, clean, inspected, ready)
- Priority room handling
- Quality control checklists

// Inventory Control
- Housekeeping supply tracking
- Linen and amenity management
- Automatic reorder alerts
- Department inventory reports

// Staff Coordination
- Housekeeper assignments
- Shift scheduling
- Task completion tracking
- Performance metrics
```

**Planned API Endpoints**:
```typescript
// Room Tasks
GET    /api/housekeeping/tasks        # Daily assignments
POST   /api/housekeeping/tasks        # Create task
PUT    /api/housekeeping/tasks/:id    # Update task status

// Inventory
GET    /api/housekeeping/inventory    # Supply levels
PUT    /api/housekeeping/inventory/:id # Update inventory
POST   /api/housekeeping/orders       # Create supply order

// Quality Control
GET    /api/housekeeping/checklists   # QC checklists
POST   /api/housekeeping/inspections  # Room inspection
```

**Required Permissions**:
- `housekeeping.tasks.department` - Manage housekeeping tasks
- `housekeeping.inventory.property` - Inventory management
- `housekeeping.reports.property` - Housekeeping reports

**Database Models**:
```typescript
HousekeepingTask, RoomStatus, InventoryItem, SupplyOrder, QualityChecklist
```

**Dependencies**: Front Desk Module (room status), HR Module

**Estimated Timeline**: 4-6 weeks

---

### 10. Maintenance Module (Planned - 0%)

**Purpose**: Property maintenance and asset management

**Components**:
- Work order management
- Preventive maintenance scheduling
- Asset tracking and lifecycle
- Vendor management
- Maintenance inventory

**Key Features**:
```typescript
// Work Orders
- Maintenance request submission
- Priority assignment and routing
- Technician assignment
- Progress tracking and completion
- Cost tracking and reporting

// Preventive Maintenance
- Scheduled maintenance tasks
- Equipment lifecycle tracking
- Automatic work order generation
- Compliance tracking

// Asset Management
- Equipment inventory
- Warranty tracking
- Service history
- Replacement planning
```

**Planned API Endpoints**:
```typescript
// Work Orders
GET    /api/maintenance/work-orders   # Work order list
POST   /api/maintenance/work-orders   # Create work order
PUT    /api/maintenance/work-orders/:id # Update work order

// Assets
GET    /api/maintenance/assets        # Asset inventory
POST   /api/maintenance/assets        # Add asset
GET    /api/maintenance/assets/:id/history # Service history

// Preventive Maintenance
GET    /api/maintenance/schedules     # PM schedules
POST   /api/maintenance/schedules     # Create PM schedule
```

**Required Permissions**:
- `maintenance.requests.own` - Submit maintenance requests
- `maintenance.workorders.department` - Manage work orders
- `maintenance.assets.property` - Asset management

**Database Models**:
```typescript
WorkOrder, MaintenanceAsset, PreventiveMaintenance, MaintenanceSchedule, Vendor
```

**Dependencies**: HR Module, Document Module (for manuals/warranties)

**Estimated Timeline**: 6-8 weeks

---

### 11. Inventory Module (Planned - 0%)

**Purpose**: Comprehensive inventory management across all departments

**Components**:
- Multi-department inventory tracking
- Purchase order management
- Supplier relationship management
- Cost tracking and budgeting
- Automatic reorder points

**Key Features**:
```typescript
// Inventory Control
- Real-time stock levels
- Multi-location tracking
- Category-based organization
- Barcode scanning support
- Loss and waste tracking

// Procurement
- Purchase order creation
- Supplier management
- Cost comparison and budgeting
- Receiving and quality control
- Invoice matching

// Analytics
- Usage patterns and forecasting
- Cost analysis and optimization
- Vendor performance tracking
- Budget vs. actual reporting
```

**Planned API Endpoints**:
```typescript
// Inventory
GET    /api/inventory/items           # Inventory list
POST   /api/inventory/items           # Add item
PUT    /api/inventory/items/:id       # Update item
GET    /api/inventory/low-stock       # Low stock alerts

// Purchase Orders
GET    /api/inventory/purchase-orders # PO list
POST   /api/inventory/purchase-orders # Create PO
PUT    /api/inventory/purchase-orders/:id # Update PO

// Suppliers
GET    /api/inventory/suppliers       # Supplier directory
POST   /api/inventory/suppliers       # Add supplier
```

**Required Permissions**:
- `inventory.read.department` - View department inventory
- `inventory.orders.property` - Manage purchase orders
- `inventory.suppliers.property` - Supplier management

**Database Models**:
```typescript
InventoryItem, PurchaseOrder, Supplier, InventoryTransaction, StockLevel
```

**Dependencies**: HR Module, Document Module

**Estimated Timeline**: 8-10 weeks

---

### 12. F&B Module (Planned - 0%)

**Purpose**: Food and beverage operations management

**Components**:
- Restaurant/bar management
- Menu and pricing management
- Inventory integration (food/beverage)
- Room service coordination
- Event and banquet management

**Key Features**:
```typescript
// Menu Management
- Digital menu creation
- Pricing and cost analysis
- Seasonal menu updates
- Dietary restriction tracking
- Recipe and ingredient management

// Service Operations
- Table management and reservations
- Order processing and kitchen coordination
- Room service delivery
- Event planning and execution
- Staff scheduling for F&B

// Integration
- POS system integration
- Inventory consumption tracking
- Revenue reporting
- Guest preferences and history
```

**Database Models**:
```typescript
MenuItem, Recipe, FBInventory, Order, Reservation, Event, FBTransaction
```

**Dependencies**: Front Desk Module, Inventory Module

**Estimated Timeline**: 10-12 weeks

---

## Module Integration Patterns

### Inter-Module Communication

```typescript
// Event-driven architecture for module integration
interface ModuleEvent {
  type: string;
  module: string;
  tenantContext: TenantContext;
  payload: any;
  timestamp: Date;
}

// Example: Guest check-in triggers multiple modules
@EventHandler(GuestCheckedInEvent)
export class GuestCheckedInHandler {
  async handle(event: GuestCheckedInEvent) {
    // Update housekeeping (clean room status)
    await this.housekeepingModule.updateRoomStatus(
      event.roomId, 
      'occupied'
    );
    
    // Create maintenance inspection task
    await this.maintenanceModule.scheduleRoomInspection(
      event.roomId,
      event.checkInDate
    );
    
    // Log in audit trail
    await this.auditService.logGuestCheckIn(event);
  }
}
```

### Module Dependencies

```typescript
// Module dependency graph
const moduleDependencies = {
  'platform-core': [],
  'hr': ['platform-core'],
  'payroll': ['platform-core', 'hr'],
  'training': ['platform-core', 'hr', 'documents'],
  'benefits': ['platform-core'],
  'documents': ['platform-core'],
  'vacation': ['platform-core', 'hr'],
  'front-desk': ['platform-core', 'hr'],
  'housekeeping': ['platform-core', 'hr', 'front-desk'],
  'maintenance': ['platform-core', 'hr', 'documents'],
  'inventory': ['platform-core', 'hr', 'documents'],
  'f-b': ['platform-core', 'hr', 'front-desk', 'inventory'],
};
```

### Module Marketplace System

```typescript
// Module subscription and enablement
interface ModuleSubscription {
  organizationId: string;
  propertyId?: string;
  moduleId: string;
  enabled: boolean;
  tier: 'basic' | 'standard' | 'premium';
  features: string[];
  billing: {
    plan: string;
    pricePerUser: number;
    billingCycle: 'monthly' | 'annual';
  };
}

// Property-level module configuration
@Controller('api/modules')
export class ModuleController {
  
  @Get()
  @RequirePermission('modules.read.property')
  async getAvailableModules(@TenantContext() context: TenantContext) {
    return this.moduleService.getAvailableModules(context.propertyId);
  }
  
  @Post(':moduleId/enable')
  @RequirePermission('modules.manage.property')
  async enableModule(
    @Param('moduleId') moduleId: string,
    @TenantContext() context: TenantContext
  ) {
    return this.moduleService.enableModule(moduleId, context.propertyId);
  }
}
```

## Module Development Guidelines

### Creating New Modules

1. **Module Structure**
```
apps/bff/src/modules/[module-name]/
├── dto/                    # Data Transfer Objects
├── entities/              # Database entities
├── controllers/           # API controllers
├── services/             # Business logic
├── guards/               # Custom guards
├── [module-name].module.ts
└── README.md
```

2. **Permission Integration**
```typescript
// Define module permissions
const MODULE_PERMISSIONS = [
  { resource: 'module_entity', action: 'create', scope: 'property' },
  { resource: 'module_entity', action: 'read', scope: 'department' },
  { resource: 'module_entity', action: 'update', scope: 'own' },
];

// Apply permissions to controllers
@Controller('api/module')
export class ModuleController {
  
  @Post()
  @RequirePermission('module_entity.create.property')
  async create(@Body() dto: CreateDto) {
    return this.moduleService.create(dto);
  }
}
```

3. **Event Integration**
```typescript
// Emit events for other modules
@Injectable()
export class ModuleService {
  
  async createEntity(data: CreateDto): Promise<Entity> {
    const entity = await this.repository.create(data);
    
    // Emit event for other modules
    await this.eventBus.publish(new EntityCreatedEvent(entity));
    
    return entity;
  }
}
```

### Testing Strategy

```typescript
// Module integration tests
describe('ModuleIntegration', () => {
  it('should handle cross-module events', async () => {
    // Create entity in module A
    const entityA = await moduleAService.create(testData);
    
    // Verify module B received event
    await waitFor(() => {
      expect(moduleBService.getRelatedEntities()).toContain(entityA.id);
    });
  });
  
  it('should enforce module permissions', async () => {
    const user = createTestUser({ role: 'STAFF' });
    
    await expect(
      moduleController.adminAction(user)
    ).rejects.toThrow('Insufficient permissions');
  });
});
```

This modular architecture enables Hotels Operations Hub to scale from basic HR functionality to comprehensive hotel operations management, with each module providing specialized functionality while maintaining seamless integration and consistent user experience.