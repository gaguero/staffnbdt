# Roles Management Module

This module provides complete role and user role assignment management for the Hotel Operations Hub system.

## 🚀 Features

### Role Management
- ✅ **CRUD Operations**: Create, read, update, and delete custom roles
- ✅ **Permission Assignment**: Assign specific permissions to roles
- ✅ **Tenant Isolation**: Organization and property-level role scoping
- ✅ **System Role Protection**: Prevents modification of system-defined roles
- ✅ **Role Statistics**: Analytics and usage metrics

### User Role Assignments
- ✅ **Role Assignment**: Assign roles to users with conditions and expiration
- ✅ **Bulk Operations**: Bulk assign and remove role assignments
- ✅ **Assignment History**: Track who assigned roles and when
- ✅ **Active Status Management**: Enable/disable role assignments

### Security & Permissions
- ✅ **Permission-Based Access**: Integration with advanced RBAC system
- ✅ **Tenant Filtering**: Automatic filtering based on user's organization/property
- ✅ **Audit Logging**: Complete audit trail for all role operations
- ✅ **Permission Cache Invalidation**: Automatic cache clearing when roles change

## 📋 API Endpoints

### Roles Management (`/api/roles`)

| Method | Endpoint | Description | Permissions Required |
|--------|----------|-------------|---------------------|
| `GET` | `/roles` | Get all roles with filtering | `role.read.*` |
| `POST` | `/roles` | Create new role | `role.create.organization/property` |
| `GET` | `/roles/stats` | Get role statistics | `role.read.*` |
| `GET` | `/roles/:id` | Get role by ID | `role.read.*` |
| `PATCH` | `/roles/:id` | Update role | `role.update.organization/property` |
| `DELETE` | `/roles/:id` | Delete role | `role.delete.organization/property` |

### User Role Assignments (`/api/user-roles`)

| Method | Endpoint | Description | Permissions Required |
|--------|----------|-------------|---------------------|
| `GET` | `/user-roles` | Get user role assignments | `role.read.*` |
| `POST` | `/user-roles` | Assign role to user | `role.assign.*` |
| `DELETE` | `/user-roles/:id` | Remove role assignment | `role.assign.*` |
| `POST` | `/user-roles/bulk` | Bulk assign roles | `role.assign.*` |
| `DELETE` | `/user-roles/bulk` | Bulk remove assignments | `role.assign.*` |

## 🔧 Usage Examples

### Creating a Role
```typescript
POST /api/roles
{
  "name": "Guest Services Manager",
  "description": "Manages guest services and customer satisfaction",
  "priority": 500,
  "permissions": ["guest.read.property", "guest.update.property"],
  "organizationId": "org-123",
  "propertyId": "prop-456"
}
```

### Assigning Role to User
```typescript
POST /api/user-roles
{
  "userId": "user-123",
  "roleId": "role-456",
  "expiresAt": "2024-12-31T23:59:59Z",
  "metadata": {
    "assignmentReason": "Temporary project lead"
  }
}
```

### Getting Role Statistics
```typescript
GET /api/roles/stats
// Returns:
{
  "data": {
    "totalRoles": 15,
    "totalAssignments": 42,
    "assignmentsByRole": {
      "role-123": 5,
      "role-456": 8
    },
    "assignmentsByLevel": {
      "Management": 8,
      "Staff": 34
    },
    "recentAssignments": [...]
  }
}
```

## 🏗️ Database Schema Integration

The module integrates with these Prisma models:
- `CustomRole` - Role definitions
- `UserCustomRole` - Role assignments to users
- `RolePermission` - Permissions assigned to roles
- `Permission` - System permissions
- `User` - User accounts

## 🔒 Security Features

### Permission System
- Uses the advanced RBAC + ABAC permission system
- Automatic tenant isolation based on user context
- Permission caching with automatic invalidation

### Role Protection
- System roles cannot be modified or deleted
- Roles in use cannot be deleted
- Audit trail for all role changes

### Access Control
- Organization/Property-level role scoping
- User can only manage roles within their tenant context
- Permission-based endpoint access control

## 🚦 Error Handling

The module provides comprehensive error handling:
- `NotFoundException` - When roles or assignments are not found
- `ConflictException` - When role names conflict in same tenant
- `BadRequestException` - For invalid operations (e.g., modifying system roles)
- `ForbiddenException` - For insufficient permissions

## 🎯 Frontend Integration

The module returns data in the exact format expected by the frontend `roleService.ts`:

```typescript
interface Role {
  id: string;
  name: string;
  description: string;
  level: number; // Maps to priority
  permissions: Permission[];
  userCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  user: { id, firstName, lastName, email, avatar };
  role: Role;
  assignedAt: Date;
  assignedBy: string;
}
```

## 📈 Performance Optimizations

- **Efficient Queries**: Optimized Prisma queries with proper includes
- **Pagination**: Built-in pagination for large datasets
- **Caching**: Permission cache integration and invalidation
- **Bulk Operations**: Efficient bulk assignment/removal operations
- **Database Indexes**: Leverages existing database indexes

## 🧪 Testing

Basic test structure provided in `roles.spec.ts` with:
- Service and controller initialization
- Mock dependencies for unit testing
- Test framework setup for Jest

## 🔄 Integration Status

✅ **Complete Integration**:
- App module registration
- Database service integration  
- Permission system integration
- Audit logging integration
- Tenant isolation system
- Error handling and responses

The roles management module is now fully integrated and ready for production use!