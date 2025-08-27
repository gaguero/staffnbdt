import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock, BarChart3 } from 'lucide-react';
import { RoleHistoryAnalytics as AnalyticsType } from '../../types/roleHistory';

interface HistoryAnalyticsProps {
  analytics: AnalyticsType | undefined;
  isLoading: boolean;
}

export function HistoryAnalytics({ analytics, isLoading }: HistoryAnalyticsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Role History Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          Role History Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <TrendingUp className="h-12 w-12 mx-auto mb-4" />
          <p>Role history analytics component implementation coming soon</p>
          <div className="mt-4 space-y-2">
            <Badge variant="secondary">Trends Analysis</Badge>
            <Badge variant="secondary">Pattern Detection</Badge>
            <Badge variant="secondary">Compliance Metrics</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}