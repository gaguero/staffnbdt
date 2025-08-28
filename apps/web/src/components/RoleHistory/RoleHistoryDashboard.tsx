import { useState, useMemo, useEffect } from 'react';

// Inline UI components
const Card = ({ children, className = '' }: any) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>{children}</div>
);
const CardHeader = ({ children, className = '' }: any) => (
  <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>{children}</div>
);
const CardTitle = ({ children, className = '' }: any) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>{children}</h3>
);
const CardContent = ({ children, className = '' }: any) => (
  <div className={`px-6 py-4 ${className}`}>{children}</div>
);

const Tabs = ({ children, className = '' }: any) => (
  <div className={`${className}`}>{children}</div>
);
const TabsList = ({ children, className = '' }: any) => (
  <div className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 ${className}`}>{children}</div>
);
const TabsTrigger = ({ value, children, className = '' }: any) => (
  <button className={`inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm ${className}`}>{children}</button>
);
const TabsContent = ({ value, children, className = '' }: any) => (
  <div className={`mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 ${className}`}>{children}</div>
);

const Button = ({ children, onClick, className = '', variant = 'default', size = 'default', disabled = false, ...props }: any) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
  const variants: { [key: string]: string } = {
    default: 'bg-slate-900 text-slate-50 hover:bg-slate-900/90',
    outline: 'border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900',
    ghost: 'hover:bg-slate-100 hover:text-slate-900'
  };
  const sizes: { [key: string]: string } = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-11 rounded-md px-8'
  };
  return (
    <button 
      className={`${baseClasses} ${variants[variant] || variants.default} ${sizes[size] || sizes.default} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ className = '', ...props }: any) => (
  <input 
    className={`flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
);

const Badge = ({ children, variant = 'default', className = '' }: any) => {
  const variants: { [key: string]: string } = {
    default: 'bg-slate-900 text-slate-50 hover:bg-slate-900/80',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-100/80',
    outline: 'text-slate-950 border border-slate-200 bg-transparent hover:bg-slate-100'
  };
  return (
    <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 ${variants[variant] || variants.default} ${className}`}>
      {children}
    </div>
  );
};

const Alert = ({ children, className = '' }: any) => (
  <div className={`relative w-full rounded-lg border border-slate-200 p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-slate-950 ${className}`}>
    {children}
  </div>
);
const AlertDescription = ({ children, className = '' }: any) => (
  <div className={`text-sm [&_p]:leading-relaxed ${className}`}>{children}</div>
);

import { 
  History, 
  Download, 
  Filter, 
  Search,
  Calendar,
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
    // quickFilters,
  } = useHistoryFilters({ initialFilters });

  // Permission checks
  const [permissions, setPermissions] = useState({
    canViewHistory: false,
    canExportHistory: false,
    canViewAnalytics: false,
    canViewAdminActivity: false
  });

  useEffect(() => {
    const checkPermissions = async () => {
      const [canViewHistory, canExportHistory, canViewAnalytics, canViewAdminActivity] = await Promise.all([
        hasPermission('role', 'read', 'history'),
        hasPermission('export', 'create'),
        hasPermission('analytics', 'read'),
        hasPermission('audit', 'read')
      ]);
      setPermissions({ canViewHistory, canExportHistory, canViewAnalytics, canViewAdminActivity });
    };
    checkPermissions();
  }, [hasPermission]);

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

  if (!permissions.canViewHistory) {
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
          
          {enableExport && permissions.canExportHistory && (
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
          {permissions.canViewAdminActivity && (
            <TabsTrigger value="admin">Admin Activity</TabsTrigger>
          )}
          {showAnalytics && permissions.canViewAnalytics && (
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

        {permissions.canViewAdminActivity && (
          <TabsContent value="admin" className="space-y-4">
            <AdminActivityHistory
              showImpactMetrics={true}
              showSuspiciousActivity={true}
            />
          </TabsContent>
        )}

        {showAnalytics && permissions.canViewAnalytics && (
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