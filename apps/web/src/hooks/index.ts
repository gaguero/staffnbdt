export { usePermissions, default as usePermissionsDefault } from './usePermissions';
export { useUsers, default as useUsersDefault } from './useUsers';
export { useHotelStats, useTodayArrivals, useTodayDepartures, useInHouseGuests, useRooms, useGuests, useReservations } from './useHotel';
export { useRoles, useUserRoles, useRoleStats } from './useRoles';

// Phase 2 UX Improvements - List Operations Hooks
export { usePagination } from './usePagination';
export { useBulkSelection } from './useBulkSelection';
export { useExport } from './useExport';
export { useInlineEdit, type InlineEditField } from './useInlineEdit';

// Phase 3 UX Improvements - Advanced Features Hooks
export { useAdvancedSearch } from './useAdvancedSearch';
export { useFilters } from './useFilters';
export { useStatsDrillDown } from './useStatsDrillDown';

// Phase 4 UX Improvements - Efficiency Features Hooks
export { useQuickAssign } from './useQuickAssign';
export { useTemplates } from './useTemplates';
export { useQueryBuilder } from './useQueryBuilder';