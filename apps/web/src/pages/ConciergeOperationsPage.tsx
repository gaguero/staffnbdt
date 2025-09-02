import React from 'react';
import { OperationalDashboard } from '../components/concierge';

/**
 * Concierge Operations Page
 * 
 * This page provides hotel staff with a comprehensive operational interface
 * for managing daily concierge tasks, guest requests, and service coordination.
 * 
 * Features:
 * - Today's Board: Kanban-style task management with due dates
 * - Reservation 360: Complete guest checklist and requirements
 * - Guest Timeline: Historical interaction tracking
 * - Quick Actions: One-click task creation from templates
 * - Real-time stats and performance metrics
 * 
 * Mobile-optimized for tablet use by operational staff.
 */
const ConciergeOperationsPage: React.FC = () => {
  return <OperationalDashboard defaultView="dashboard" />;
};

export default ConciergeOperationsPage;