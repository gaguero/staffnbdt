import React from 'react';
import { RoleHistoryDashboard } from '../components/RoleHistory';
import { PermissionGate } from '../components/PermissionGate';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export function RoleHistoryPage() {
  return (
    <PermissionGate permission="role.read.history">
      <div className="container mx-auto py-6">
        <RoleHistoryDashboard
          initialFilters={{
            timeRange: '7d',
            limit: 50,
            sortBy: 'timestamp',
            sortDirection: 'desc',
          }}
          showAnalytics={true}
          enableExport={true}
          enableRealTimeUpdates={true}
          height="900px"
        />
      </div>
      
      {/* Fallback for users without permission */}
      <div className="hidden">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to view role assignment history. Please contact your administrator.
          </AlertDescription>
        </Alert>
      </div>
    </PermissionGate>
  );
}