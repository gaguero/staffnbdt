import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock } from 'lucide-react';
import { RoleHistoryFilter } from '../../types/roleHistory';

interface BulkOperationHistoryProps {
  filters: RoleHistoryFilter;
}

export function BulkOperationHistory({ filters }: BulkOperationHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Bulk Operation History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-4" />
          <p>Bulk operation history component implementation coming soon</p>
          <div className="mt-4 space-y-2">
            {filters.showBulkOperations && <Badge variant="secondary">Bulk Operations Filter</Badge>}
            {filters.groupByBatch && <Badge variant="secondary">Grouped by Batch</Badge>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}