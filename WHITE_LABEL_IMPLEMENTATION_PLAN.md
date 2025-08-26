# White-Label Branding System - Implementation Plan
**Branch**: `feature/white-label-branding`  
**Date**: August 26, 2025  
**Status**: Implementation Started  

## Project Overview
Complete white-label branding system allowing organizations and properties to customize the Hotel Operations Hub appearance with their own logos, colors, typography, and styling.

## Decision Summary (User Choices)

### Database & Schema Decisions
- **1-A**: Single `branding_configs` table with JSON fields for flexibility
- **2-A**: JSON field with nested color palettes (Prisma Json type)
- **3-A**: Nullable `property_id` field (NULL = org-level branding)
- **4-A**: Yes, with `branding_history` table for rollback capability

### Backend API Decisions
- **5-A**: ORG_ADMIN for org-level, PROPERTY_MANAGER for property-level permissions
- **6-A**: Direct to R2 with pre-signed URLs for asset uploads
- **7-A**: WCAG AA contrast validation + format validation
- **8-A**: Yes, with Redis caching and 5-minute TTL

### Frontend Theme Decisions
- **9-A**: Runtime injection via React Context + CSS variables
- **10-A**: `--brand-{category}-{property}` naming convention
- **11-A**: Instant switch without page reload
- **12-A**: Platform defaults → Org branding → Property branding hierarchy

### Brand Studio UI Decisions
- **13-A**: Guided mode (presets) + Advanced mode (full control)
- **14-A**: Yes, split-screen with live preview
- **15-A**: react-colorful with palette suggestions
- **16-A**: Sandboxed CSS editor with validation

### Testing & Integration Decisions
- **17-C**: Manual testing checklist (instead of Playwright automation)
- **18-C**: Use platform defaults for all existing properties
- **19-A**: Yes, as JSON configuration files for export/import
- **20-A**: Theme switch < 100ms, First paint < 50ms performance targets

### Architecture Decisions
- **21**: One theme per organization, child properties can override
- **22-A**: Inline styles generated from theme for emails/PDFs
- **23-A**: Generate React Native theme from web config
- **24**: AI suggestions inspired by logo analysis

## Implementation Phases

### Phase 1: Database Schema & Models ✅ NEXT
**Priority**: P0 - Foundation
**Agent**: backend-architect
**Duration**: 4-6 hours

#### Tasks:
1. Create `BrandingConfig` Prisma model with JSON fields
2. Create `BrandingAsset` model for logo/file management
3. Create `BrandingHistory` model for version control
4. Add proper indexes and constraints
5. Generate and run database migration

#### Technical Specifications:
```prisma
model BrandingConfig {
  id             String   @id @default(uuid())
  organizationId String
  propertyId     String?  // NULL = organization-level
  
  // Brand Identity
  brandName        String?
  brandDescription String?
  
  // Asset URLs (stored in R2)
  logoLightUrl String?
  logoDarkUrl  String?
  logoIconUrl  String?
  
  // JSON Configuration Fields
  colors     Json @default("{}")  // Color palette
  typography Json @default("{}")  // Font configuration  
  components Json @default("{}")  // Component styling
  customCSS  String?              // Advanced CSS
  
  // Status & Versioning
  status      BrandingStatus @default(DRAFT)
  version     Int            @default(1)
  
  // Audit Fields
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdBy   String
  publishedAt DateTime?
  publishedBy String?
  
  // Relations
  organization Organization @relation(fields: [organizationId], references: [id])
  property     Property?    @relation(fields: [propertyId], references: [id])
  assets       BrandingAsset[]
  history      BrandingHistory[]
  
  @@unique([organizationId, propertyId])
  @@map("branding_configs")
}
```

### Phase 2: Backend API Implementation
**Priority**: P0 - Core Services
**Agent**: backend-architect
**Duration**: 6-8 hours

#### Tasks:
1. `BrandingService` with CRUD operations
2. `BrandingController` with proper permissions
3. R2 integration for asset uploads
4. Redis caching implementation
5. WCAG contrast validation
6. Branding inheritance logic

### Phase 3: Frontend Theme System
**Priority**: P0 - User Experience
**Agent**: frontend-developer  
**Duration**: 8-10 hours

#### Tasks:
1. `ThemeProvider` React context
2. CSS variables injection system
3. `useTheme` hook for components
4. Theme switching without reload
5. Fallback hierarchy implementation

### Phase 4: Brand Studio Interface
**Priority**: P1 - Admin Tools
**Agent**: frontend-developer
**Duration**: 10-12 hours

#### Tasks:
1. Main Brand Studio page
2. Color editor with react-colorful
3. Typography editor
4. Asset management interface
5. Live preview split-screen
6. Guided + Advanced modes

### Phase 5: Testing & Integration
**Priority**: P1 - Quality Assurance
**Agent**: test-writer-fixer
**Duration**: 4-6 hours

#### Tasks:
1. Manual testing checklist
2. Theme switching validation
3. Performance benchmarks
4. Cross-tenant isolation testing
5. Railway deployment testing

## Technical Architecture

### Color Configuration Schema
```typescript
interface ColorConfig {
  primary: { 50: string; 100: string; ... 900: string };
  secondary: { 50: string; 100: string; ... 900: string };
  accent: { 50: string; 100: string; ... 900: string };
  semantic: { success: string; warning: string; error: string; info: string };
  neutral: { white: string; gray: {...}; black: string };
  background: { primary: string; secondary: string; elevated: string };
  text: { primary: string; secondary: string; disabled: string };
  border: { light: string; medium: string; heavy: string };
}
```

### CSS Variables Convention
- `--brand-color-primary-500` (Base primary color)
- `--brand-color-text-primary` (Primary text color)
- `--brand-typography-heading` (Heading font family)
- `--brand-component-border-radius` (Component border radius)

### Permission Requirements
- **Organization Branding**: `branding.manage.organization`
- **Property Branding**: `branding.manage.property` 
- **Asset Upload**: `branding.upload.assets`
- **Theme Publishing**: `branding.publish.theme`

### Performance Targets
- Theme switch: < 100ms
- CSS variable injection: < 50ms
- Asset loading: < 200ms
- Brand Studio load: < 1s

### Integration Points
- **R2 Storage**: Asset uploads with tenant-scoped paths
- **Redis Cache**: 5-minute TTL for branding configs
- **Permission System**: Role-based access control
- **Multi-tenant**: Organization/Property isolation
- **Email Templates**: Inline style generation
- **React Native**: Theme export capability

## Risk Mitigation
- **Database Migration**: Test on staging first
- **Performance Impact**: Monitor CSS variable injection overhead
- **Browser Compatibility**: Test CSS custom property support
- **Memory Usage**: Limit custom CSS size
- **Security**: Validate and sanitize custom CSS
- **Accessibility**: Enforce WCAG AA contrast ratios

## Success Criteria
✅ Organizations can fully customize brand appearance  
✅ Properties can override organization branding  
✅ Theme changes apply instantly without reload  
✅ WCAG AA accessibility compliance maintained  
✅ Performance targets met (< 100ms theme switch)  
✅ Multi-tenant isolation preserved  
✅ Asset uploads work with R2 integration  
✅ Manual testing checklist passes completely  

---

**Next Action**: Launch backend-architect agent to implement Phase 1 - Database Schema & Models