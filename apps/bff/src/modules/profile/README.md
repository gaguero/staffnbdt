# Profile Module

## Overview

The Profile module handles user profiles, emergency contacts, photo uploads, and ID document verification for Hotel Operations Hub. This module provides comprehensive profile management with role-based access control and audit logging.

## Features

### Core Profile Management
- **Profile Viewing**: Users can view their own profile, admins can view profiles in their scope
- **Profile Updates**: Users can update their own basic information (name, phone, position)
- **Department Integration**: Profile includes department information and relationships

### Emergency Contacts
- **Contact Management**: Up to 3 emergency contacts per user
- **Contact Validation**: Structured contact information with relationships
- **Primary Contact**: Designation of primary emergency contact
- **JSON Storage**: Contacts stored as JSON with metadata

### Profile Photo Management
- **Photo Upload**: 5MB limit, JPEG/PNG only
- **Photo Deletion**: Remove existing profile photos
- **File Validation**: MIME type and size validation
- **Unique Naming**: UUID-based file naming to prevent conflicts

### ID Document Management
- **Document Upload**: 10MB limit, JPEG/PNG/PDF support
- **Encryption**: Documents encrypted before storage for security
- **Verification Workflow**: Admin-only verification with status tracking
- **Department Scoping**: Department admins can only verify their department's documents
- **Status Tracking**: PENDING/VERIFIED/REJECTED/EXPIRED states

## API Endpoints

### Profile Management
```
GET    /api/profile              - Get current user profile
GET    /api/profile/:id          - Get user profile by ID (Admin only)
PUT    /api/profile              - Update current user profile
```

### Photo Management
```
POST   /api/profile/photo        - Upload profile photo
DELETE /api/profile/photo        - Delete profile photo
```

### ID Document Management
```
POST   /api/profile/id           - Upload ID document
GET    /api/profile/id/:userId   - Get ID document (Admin only)
POST   /api/profile/id/:userId/verify - Verify ID document (Admin only)
GET    /api/profile/id/status    - Get current user ID verification status
GET    /api/profile/id/:userId/status - Get user ID verification status (Admin only)
```

### Emergency Contacts
```
POST   /api/profile/emergency-contacts - Update emergency contacts
```

## File Structure

```
src/modules/profile/
├── config/
│   └── multer.config.ts          # File upload configuration
├── dto/
│   ├── emergency-contact.dto.ts  # Emergency contact DTOs
│   ├── id-verification.dto.ts    # ID verification DTOs
│   ├── profile.dto.ts           # Profile DTOs
│   └── index.ts                 # DTO exports
├── interfaces/
│   ├── emergency-contact.interface.ts # Emergency contact types
│   ├── id-document.interface.ts       # ID document types
│   └── index.ts                       # Interface exports
├── profile.controller.ts        # REST API endpoints
├── profile.service.ts          # Business logic
├── profile.module.ts           # Module configuration
├── profile.controller.spec.ts  # Controller tests
└── profile.service.spec.ts     # Service tests
```

## Security Features

### Access Control
- **Self-Service**: Users can only modify their own profiles
- **Admin Scoping**: Department admins limited to their department
- **Superadmin Access**: Full system access for superadmins
- **Role-Based Guards**: Implemented using NestJS guards

### Data Protection
- **ID Encryption**: ID documents encrypted before storage
- **File Validation**: Strict MIME type and size validation
- **Audit Logging**: All profile operations logged for compliance
- **Secure File Storage**: Files stored outside web root

### Input Validation
- **DTO Validation**: Class-validator decorators on all inputs
- **File Type Validation**: Multer filters for allowed file types
- **Size Limits**: Enforced file size limits (5MB photos, 10MB documents)
- **Emergency Contact Limits**: Maximum 3 contacts with validation

## Database Integration

### User Model Extensions
The module leverages existing User model fields:
- `emergencyContact`: JSON field for contact data
- `idDocument`: JSON field for encrypted document metadata
- `profilePhoto`: String field for photo path
- `phoneNumber`: String field for contact number

### Audit Integration
- All operations logged via AuditService
- Tracks old/new data for profile changes
- Records file operations and verifications
- Supports compliance and forensics

## File Handling

### Storage Configuration
- **Local Storage**: Files stored in `uploads/` directory
- **Profile Photos**: `uploads/profiles/` with UUID naming
- **ID Documents**: `uploads/id-documents/` with UUID naming
- **File Streaming**: Direct file streaming for downloads

### Encryption
- **AES-256-CBC**: Encryption for ID document paths
- **Environment Key**: Uses ENCRYPTION_KEY environment variable
- **Path Obfuscation**: Encrypted paths prevent direct access

## Testing

### Test Coverage
- **Unit Tests**: Service logic with mocked dependencies
- **Controller Tests**: API endpoint testing with mocked service
- **Integration Ready**: Tests structured for easy E2E extension
- **Error Scenarios**: Comprehensive error condition testing

### Mock Strategy
- **Prisma Mocking**: Jest mocks for database operations
- **Service Mocking**: Isolated controller testing
- **TypeScript Safe**: Proper typing for all mocks

## Usage Examples

### Basic Profile Update
```typescript
PUT /api/profile
{
  "firstName": "Jane",
  "lastName": "Smith",
  "phoneNumber": "+507 6000-1111"
}
```

### Emergency Contacts Update
```typescript
POST /api/profile/emergency-contacts
{
  "contacts": [
    {
      "name": "John Doe",
      "relationship": "Spouse",
      "phoneNumber": "+507 6000-2222",
      "email": "john@example.com",
      "isPrimary": true
    }
  ]
}
```

### ID Document Verification
```typescript
POST /api/profile/id/user123/verify
{
  "status": "VERIFIED",
  "notes": "Document approved - all information verified"
}
```

## Environment Variables

```bash
# Required for ID document encryption
ENCRYPTION_KEY=your-32-character-encryption-key

# File upload limits (optional, defaults in config)
MAX_PROFILE_PHOTO_SIZE=5242880  # 5MB
MAX_ID_DOCUMENT_SIZE=10485760   # 10MB
```

## Dependencies

### NestJS Modules
- `@nestjs/platform-express` - File upload handling
- `@nestjs/swagger` - API documentation
- `@nestjs/common` - Core framework features

### External Libraries
- `multer` - File upload middleware
- `uuid` - Unique file naming
- `crypto` - Document encryption
- `class-validator` - Input validation

### Internal Dependencies
- `PrismaService` - Database operations
- `AuditService` - Operation logging
- `StorageService` - File management utilities

## Error Handling

### Common Error Scenarios
- **File Too Large**: 400 Bad Request with size limit message
- **Invalid File Type**: 400 Bad Request with allowed types
- **Unauthorized Access**: 403 Forbidden for cross-user operations
- **Missing Files**: 404 Not Found for non-existent documents
- **Validation Errors**: 400 Bad Request with field-specific messages

### Error Response Format
```typescript
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information",
  "statusCode": 400
}
```

## Future Enhancements

### Planned Features
- **Photo Thumbnails**: Automatic thumbnail generation for profile photos
- **Document OCR**: Automatic text extraction from ID documents
- **Photo Cropping**: Client-side image cropping before upload
- **Bulk Operations**: Admin bulk profile updates
- **Export Features**: Profile data export capabilities

### Integration Opportunities
- **Notification Service**: Profile change notifications
- **Worker Queue**: Async document processing
- **CDN Integration**: Cached file serving
- **Backup Service**: Automated profile backup