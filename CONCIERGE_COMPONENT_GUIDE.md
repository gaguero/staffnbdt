# Concierge Components - Developer Guide

## 🚀 Quick Start

```typescript
import { 
  OperationalDashboard, 
  TodayBoard, 
  Reservation360, 
  QuickActions, 
  GuestTimeline 
} from '../components/concierge';

// Full operational dashboard
<OperationalDashboard defaultView="dashboard" />

// Individual components
<TodayBoard onObjectClick={(task) => console.log(task)} />
<QuickActions compact reservationId="res-123" onTaskCreated={() => refetch()} />
<Reservation360 reservation={reservationData} />
<GuestTimeline guest={guestData} />
```

## 📋 Component APIs

### OperationalDashboard
**Main hub component with tabbed navigation**

```typescript
interface OperationalDashboardProps {
  defaultView?: 'dashboard' | 'today' | 'reservations' | 'guests';
}
```

**Features:**
- Unified navigation between all views
- Real-time performance metrics
- Context switching between guest/reservation views
- Mobile-responsive layout

### TodayBoard
**Kanban-style task management board**

```typescript
interface TodayBoardProps {
  onObjectClick?: (object: ConciergeObject) => void;
}
```

**Features:**
- Three-column layout (Overdue, Due Today, Upcoming)
- Bulk selection and operations
- Real-time updates every 60 seconds
- Mobile-first responsive columns

### QuickActions  
**Template-based task creation interface**

```typescript
interface QuickActionsProps {
  reservationId?: string;
  guestId?: string;
  onTaskCreated?: () => void;
  compact?: boolean; // Shows only 4 templates + "More" button
}
```

**Features:**
- 8 pre-configured templates by category
- One-click task creation with smart defaults
- Custom task form with attributes
- Compact mode for embedding

### Reservation360
**Comprehensive reservation management view**

```typescript
interface Reservation360Props {
  reservation: Reservation;
}
```

**Features:**
- Guest information header with VIP status
- Interactive checklist with progress tracking  
- Exception panel for overdue items
- Quick task creation modal

### GuestTimeline
**Chronological guest interaction history**

```typescript
interface GuestTimelineProps {
  guest: Guest;
}
```

**Features:**
- Timeline with grouped events by date
- Advanced filtering (type, status, date range)
- Visual event cards with metadata
- Export capabilities

## 🎨 Styling & Theming

### CSS Variables Used
```css
:root {
  --brand-primary: #AA8E67;        /* Primary action color */
  --brand-text-primary: #4A4A4A;   /* Main text color */
  --brand-radius-md: .75rem;       /* Border radius */
  --brand-shadow-soft: 0 2px 15px -3px rgba(0,0,0,.07); /* Shadows */
}
```

### Status Color Coding
- **Overdue**: `bg-red-50 border-red-200 text-red-800`
- **Due Today**: `bg-yellow-50 border-yellow-200 text-yellow-800`  
- **Upcoming**: `bg-green-50 border-green-200 text-green-800`
- **In Progress**: `bg-blue-50 border-blue-200 text-blue-800`
- **Completed**: `bg-green-50 border-green-200 text-green-800`

## 🔧 Data Dependencies

### Required Hooks
```typescript
import { 
  useTodayBoard,
  useReservationChecklist, 
  useGuestTimeline,
  useConciergeStats,
  useCreateConciergeObject 
} from '../hooks/useConcierge';
```

### Required Services
```typescript
import { conciergeService } from '../services/conciergeService';

// Available methods:
conciergeService.getTodayBoard()
conciergeService.getReservationChecklist(reservationId)  
conciergeService.getGuestTimeline(guestId)
conciergeService.createObject(input)
conciergeService.bulkUpdateStatus(objectIds, status)
```

### Type Definitions
```typescript
import {
  ConciergeObject,
  TodayBoardSection,
  ReservationChecklist,
  GuestTimelineEvent,
  CreateConciergeObjectInput
} from '../types/concierge';
```

## 📱 Mobile Optimization

### Responsive Breakpoints
- **Mobile**: `< 768px` - Single column, bottom actions
- **Tablet**: `768px - 1024px` - Two columns, optimized for touch
- **Desktop**: `> 1024px` - Full layout with three columns

### Touch-Friendly Features
- Minimum 44px touch targets
- Swipe gestures for navigation
- Long-press for bulk selection
- Haptic feedback simulation with animations

## 🔒 Permission Integration

### Required Permissions
```typescript
// Reading concierge data
'concierge.read.property'

// Creating tasks  
'concierge.create.property'

// Updating tasks
'concierge.update.property'

// Bulk operations
'concierge.bulk.property'
```

### Usage Pattern
```typescript
import { PermissionGate } from '../components';

<PermissionGate resource="concierge" action="create" scope="property">
  <QuickActions />
</PermissionGate>
```

## ⚡ Performance Considerations

### Query Optimization
- **TodayBoard**: Refreshes every 60 seconds
- **Timeline**: Refreshes every minute, cached for 30s
- **Stats**: Refreshes every 2 minutes, stale after 1 minute
- **Reservation Checklist**: Refreshes every 30 seconds

### Bundle Size
- Core components: ~45KB gzipped
- Lazy load individual components to reduce initial bundle
- Icons use emoji (no icon font dependency)

## 🛠️ Development Tips

### Testing Components
```typescript
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

const TestWrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}  
  </QueryClientProvider>
);

test('renders dashboard', () => {
  render(<OperationalDashboard />, { wrapper: TestWrapper });
  expect(screen.getByText('Today\'s Board')).toBeInTheDocument();
});
```

### Debugging Real-time Updates
```typescript
// Enable query devtools
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Add to app
<ReactQueryDevtools initialIsOpen={false} />
```

### Custom Template Creation
```typescript
const customTemplate: QuickActionTemplate = {
  id: 'custom-spa',
  name: 'Custom Spa Service',
  icon: '🧘‍♀️',
  category: 'Wellness',
  description: 'Book custom spa treatment',
  type: 'spa_booking',
  defaultAttributes: {
    service_type: 'custom',
    duration: 90
  },
  estimatedTime: '15 min',
  priority: 'medium'
};
```

## 📈 Analytics & Monitoring

### Key Metrics to Track
- Task creation time (target: <30 seconds)
- Completion rate (target: >95%)
- Time to complete tasks (track by type)
- Mobile usage percentage
- Error rates and retry attempts

### Performance Monitoring
```typescript
// Add performance tracking
const startTime = performance.now();
// ... component operation
const endTime = performance.now();
console.log(`Operation took ${endTime - startTime} milliseconds`);
```

## 🚨 Troubleshooting

### Common Issues

**1. Permission Errors**
- Ensure user has required concierge permissions
- Check PermissionGate configuration
- Verify tenant context is properly set

**2. Real-time Updates Not Working**  
- Check query key dependencies include tenantKey
- Verify refetchInterval configuration
- Ensure network connection for polling

**3. Mobile Layout Issues**
- Test on actual devices, not just browser devtools
- Check touch target sizes (minimum 44px)
- Verify responsive breakpoints

**4. Performance Issues**
- Monitor query cache size
- Check for unnecessary re-renders
- Optimize image and icon loading

### Debug Commands
```typescript
// Force query refetch
queryClient.invalidateQueries(['concierge']);

// Check cache state
console.log(queryClient.getQueryCache());

// Reset all queries  
queryClient.resetQueries();
```

---

This guide provides developers with everything needed to integrate, customize, and troubleshoot the Concierge operational excellence components.