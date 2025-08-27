import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserCheck, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { AdminActivityHistoryProps } from '../../types/roleHistory';

export function AdminActivityHistory({
  adminId,
  showImpactMetrics = false,
  showSuspiciousActivity = false,
  maxEntries = 100,
}: AdminActivityHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <UserCheck className="h-5 w-5 mr-2" />
          Administrator Activity History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-4" />
          <p>Admin activity history component implementation coming soon</p>
          <div className="mt-4 space-y-2">
            {adminId && <Badge variant="outline">Admin ID: {adminId}</Badge>}
            <Badge variant="outline">Max Entries: {maxEntries}</Badge>
            {showImpactMetrics && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Impact Metrics
              </Badge>
            )}
            {showSuspiciousActivity && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Suspicious Activity
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}