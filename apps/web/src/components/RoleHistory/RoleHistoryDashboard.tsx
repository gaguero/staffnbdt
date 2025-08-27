import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  History, 
  Download, 
  Filter, 
  Search,
  Calendar,
  Users,
  UserCheck,
  UserX,
  Clock,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Settings
} from 'lucide-react';
import { useRoleHistory } from '../../hooks/useRoleHistory';
import { useHistoryFilters } from '../../hooks/useHistoryFilters';
import { usePermissions } from '../../hooks/usePermissions';
import { RoleHistoryDashboardProps } from '../../types/roleHistory';
import { SystemRoleHistory } from './SystemRoleHistory';
import { HistoryTimeline } from './HistoryTimeline';
import { HistoryFilters } from './HistoryFilters';
import { HistoryExport } from './HistoryExport';
import { BulkOperationHistory } from './BulkOperationHistory';
import { AdminActivityHistory } from './AdminActivityHistory';
import { HistoryAnalytics } from './HistoryAnalytics';

export function RoleHistoryDashboard({
  initialFilters = {},
  showAnalytics = true,
  enableExport = true,
  enableRealTimeUpdates = false,
  height = '800px',
}: RoleHistoryDashboardProps) {
  const { hasPermission } = usePermissions();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Role history hook with options
  const {
    entries,
    totalEntries,
    currentPage,
    totalPages,
    summary,
    analytics,
    isLoading,
    isExporting,
    hasSelection,
    selectedCount,
    searchHistory,
    exportHistory,
    exportSelected,
    goToPage,
    changePageSize,
    enableRealTimeUpdates: enableRealTime,
  } = useRoleHistory({
    initialFilters,
    autoRefresh: enableRealTimeUpdates,
    enableRealTime: enableRealTimeUpdates,
  });

  // History filters hook
  const {
    filters,
    hasActiveFilters,
    filterSummary,
    presets,
    applyPreset,
    clearFilters,
    updateFilters,
    quickFilters,
  } = useHistoryFilters({ initialFilters });

  // Permission checks
  const canViewHistory = hasPermission('role.read.history');
  const canExportHistory = hasPermission('export.create');
  const canViewAnalytics = hasPermission('analytics.read');
  const canViewAdminActivity = hasPermission('audit.read');

  // Quick stats from summary
  const quickStats = useMemo(() => {
    if (!summary) return null;

    return [
      {
        label: 'Total Changes',
        value: summary.totalEntries.toLocaleString(),
        icon: History,
        color: 'text-blue-600',
      },
      {
        label: 'Today',
        value: summary.periodStats.today.toLocaleString(),
        icon: Calendar,
        color: 'text-green-600',
      },
      {
        label: 'This Week',
        value: summary.periodStats.thisWeek.toLocaleString(),
        icon: TrendingUp,
        color: 'text-purple-600',
      },
      {
        label: 'This Hour',
        value: summary.periodStats.thisHour.toLocaleString(),
        icon: Clock,
        color: 'text-orange-600',
      },
    ];
  }, [summary]);

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    searchHistory(term);
  };

  // Handle export
  const handleExport = (format: 'pdf' | 'csv' | 'excel' | 'json') => {
    if (hasSelection) {
      exportSelected(format);
    } else {
      exportHistory({
        format,
        includeMetadata: true,
        includePermissionChanges: true,
        includeAuditTrail: true,
        dateRange: {
          from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
          to: new Date(),
        },
      });
    }
    setShowExportModal(false);
  };

  if (!canViewHistory) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to view role assignment history.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6" style={{ height }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Role Assignment History</h2>
          <p className="text-muted-foreground">
            Complete audit trail of role assignments and changes
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {enableRealTimeUpdates && (
            <Button
              variant="outline"
              size="sm"
              onClick={enableRealTime}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Real-time Updates
            </Button>
          )}
          
          {enableExport && canExportHistory && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportModal(true)}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {Object.keys(filters).length - 2}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {quickStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                    <Icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Search and Quick Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search users, roles, or admins..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          {presets.slice(0, 4).map((preset) => (
            <Button
              key={preset.name}
              variant="outline"
              size="sm"
              onClick={() => applyPreset(preset.name)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
        
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <Alert>
          <Filter className="h-4 w-4" />
          <AlertDescription>
            Active filters: {filterSummary}
          </AlertDescription>
        </Alert>
      )}

      {/* Collapsible Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Advanced Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HistoryFilters
              filters={filters}
              onFiltersChange={updateFilters}
              onClearFilters={clearFilters}
              presets={presets}
              onApplyPreset={applyPreset}
            />
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
          {canViewAdminActivity && (
            <TabsTrigger value="admin">Admin Activity</TabsTrigger>
          )}
          {showAnalytics && canViewAnalytics && (
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          )}
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <SystemRoleHistory
            entries={entries}
            totalEntries={totalEntries}
            currentPage={currentPage}
            totalPages={totalPages}
            isLoading={isLoading}
            onPageChange={goToPage}
            onPageSizeChange={changePageSize}
          />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <HistoryTimeline
            entries={entries}
            groupBy="day"
            showDetails={true}
            enableFiltering={false} // Already filtered at dashboard level
          />
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <BulkOperationHistory
            filters={{ ...filters, showBulkOperations: true }}
          />
        </TabsContent>

        {canViewAdminActivity && (
          <TabsContent value="admin" className="space-y-4">
            <AdminActivityHistory
              showImpactMetrics={true}
              showSuspiciousActivity={true}
            />
          </TabsContent>
        )}

        {showAnalytics && canViewAnalytics && (
          <TabsContent value="analytics" className="space-y-4">
            <HistoryAnalytics
              analytics={analytics}
              isLoading={isLoading}
            />
          </TabsContent>
        )}

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                <p>Compliance reporting feature coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Modal */}
      {showExportModal && (
        <HistoryExport
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
          isExporting={isExporting}
          hasSelection={hasSelection}
          selectedCount={selectedCount}
          totalEntries={totalEntries}
        />
      )}
    </div>
  );
}