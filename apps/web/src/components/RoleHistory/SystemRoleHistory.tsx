import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronLeft, 
  ChevronRight,
  MoreHorizontal,
  User,
  Shield,
  Clock,
  MapPin,
  Eye,
  RotateCcw,
  CheckCircle,
  XCircle,
  Users,
  Zap,
  Calendar
} from 'lucide-react';
import { RoleAssignmentHistoryEntry } from '../../types/roleHistory';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePermissions } from '../../hooks/usePermissions';

interface SystemRoleHistoryProps {
  entries: RoleAssignmentHistoryEntry[];
  totalEntries: number;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onViewDetails?: (entry: RoleAssignmentHistoryEntry) => void;
  onRollback?: (entry: RoleAssignmentHistoryEntry) => void;
}

const ACTION_CONFIG = {
  ASSIGNED: {
    icon: CheckCircle,
    color: 'text-green-600 bg-green-50 border-green-200',
    label: 'Role Assigned',
  },
  REMOVED: {
    icon: XCircle,
    color: 'text-red-600 bg-red-50 border-red-200',
    label: 'Role Removed',
  },
  MODIFIED: {
    icon: Zap,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    label: 'Role Modified',
  },
  BULK_ASSIGNED: {
    icon: Users,
    color: 'text-green-600 bg-green-50 border-green-200',
    label: 'Bulk Assigned',
  },
  BULK_REMOVED: {
    icon: Users,
    color: 'text-red-600 bg-red-50 border-red-200',
    label: 'Bulk Removed',
  },
  EXPIRED: {
    icon: Clock,
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    label: 'Role Expired',
  },
};

const SOURCE_LABELS = {
  manual: 'Manual',
  bulk: 'Bulk Operation',
  template: 'Template',
  migration: 'Migration',
  automated: 'Automated',
  system: 'System',
};

export function SystemRoleHistory({
  entries,
  totalEntries,
  currentPage,
  totalPages,
  isLoading,
  onPageChange,
  onPageSizeChange,
  onViewDetails,
  onRollback,
}: SystemRoleHistoryProps) {
  const { hasPermission } = usePermissions();
  const [hoveredEntry, setHoveredEntry] = useState<string | null>(null);

  const canRollback = hasPermission('role.rollback');
  const canViewDetails = hasPermission('role.read.history');

  const getActionConfig = (action: RoleAssignmentHistoryEntry['action']) => {
    return ACTION_CONFIG[action] || {
      icon: Clock,
      color: 'text-gray-600 bg-gray-50 border-gray-200',
      label: action,
    };
  };

  const formatTimeAgo = (timestamp: Date) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const formatFullDate = (timestamp: Date) => {
    return format(new Date(timestamp), 'PPpp');
  };

  const getUserInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const renderActionBadge = (entry: RoleAssignmentHistoryEntry) => {
    const config = getActionConfig(entry.action);
    const Icon = config.icon;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge 
              variant="outline" 
              className={`px-3 py-1 ${config.color} border`}
            >
              <Icon className="w-3 h-3 mr-1" />
              {config.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">{config.label}</p>
              <p className="text-sm text-muted-foreground">
                {formatFullDate(entry.timestamp)}
              </p>
              {entry.reason && (
                <p className="text-sm">Reason: {entry.reason}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const renderSourceBadge = (source: string) => {
    const label = SOURCE_LABELS[source as keyof typeof SOURCE_LABELS] || source;
    
    return (
      <Badge variant="secondary" className="text-xs">
        {label}
      </Badge>
    );
  };

  const renderUserInfo = (entry: RoleAssignmentHistoryEntry) => {
    const user = entry.metadata?.userDetails;
    if (!user) return null;

    return (
      <div className="flex items-center space-x-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.avatar} />
          <AvatarFallback className="text-xs">
            {getUserInitials(user.firstName, user.lastName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-sm text-gray-500 truncate">{user.email}</p>
          {user.department && (
            <p className="text-xs text-gray-400 truncate">{user.department}</p>
          )}
        </div>
      </div>
    );
  };

  const renderRoleInfo = (entry: RoleAssignmentHistoryEntry) => {
    const role = entry.metadata?.roleDetails;
    if (!role) return null;

    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2">
          <Shield className={`h-4 w-4 ${role.isSystemRole ? 'text-purple-600' : 'text-blue-600'}`} />
          <span className="font-medium text-sm">{role.name}</span>
        </div>
        {role.isSystemRole && (
          <Badge variant="outline" className="text-xs">
            System
          </Badge>
        )}
        <span className="text-xs text-gray-500">
          Level {role.level}
        </span>
        <span className="text-xs text-gray-400">
          {role.permissionCount} permissions
        </span>
      </div>
    );
  };

  const renderAdminInfo = (entry: RoleAssignmentHistoryEntry) => {
    const admin = entry.metadata?.adminDetails;
    if (!admin) return null;

    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <User className="h-3 w-3" />
        <span>by {admin.firstName} {admin.lastName}</span>
      </div>
    );
  };

  const renderContextInfo = (entry: RoleAssignmentHistoryEntry) => {
    const context = entry.context || {};
    const systemInfo = entry.metadata?.systemInfo;

    return (
      <div className="flex items-center space-x-4 text-xs text-gray-500">
        {renderSourceBadge(context.source)}
        
        {context.batchId && (
          <div className="flex items-center space-x-1">
            <span>Batch:</span>
            <code className="px-1 py-0.5 bg-gray-100 rounded text-xs">
              {context.batchId.split('-').slice(-1)[0]}
            </code>
          </div>
        )}
        
        {systemInfo?.tenantContext && (
          <div className="flex items-center space-x-1">
            <MapPin className="h-3 w-3" />
            <span>
              {systemInfo.tenantContext.propertyName || 'Property'}
            </span>
          </div>
        )}
        
        {entry.auditTrail?.ipAddress && (
          <div className="flex items-center space-x-1">
            <span>IP:</span>
            <code className="text-xs">{entry.auditTrail.ipAddress}</code>
          </div>
        )}
      </div>
    );
  };

  const renderEntryActions = (entry: RoleAssignmentHistoryEntry) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canViewDetails && onViewDetails && (
            <DropdownMenuItem onClick={() => onViewDetails(entry)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
          )}
          
          {canRollback && onRollback && (entry.action === 'ASSIGNED' || entry.action === 'REMOVED') && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onRollback(entry)}
                className="text-orange-600"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Rollback Action
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No History Found</h3>
            <p className="text-gray-600">
              No role assignment history matches your current filters.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                className={`p-4 rounded-lg border transition-all duration-200 ${
                  hoveredEntry === entry.id 
                    ? 'bg-gray-50 border-gray-300 shadow-sm' 
                    : 'bg-white border-gray-200'
                }`}
                onMouseEnter={() => setHoveredEntry(entry.id)}
                onMouseLeave={() => setHoveredEntry(null)}
              >
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {renderActionBadge(entry)}
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="h-3 w-3" />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <span>{formatTimeAgo(entry.timestamp)}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {formatFullDate(entry.timestamp)}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {renderAdminInfo(entry)}
                    {renderEntryActions(entry)}
                  </div>
                </div>

                {/* Main Content */}
                <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* User Information */}
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      User
                    </div>
                    {renderUserInfo(entry)}
                  </div>

                  {/* Role Information */}
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Role
                    </div>
                    {renderRoleInfo(entry)}
                  </div>
                </div>

                {/* Context Information */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  {renderContextInfo(entry)}
                </div>

                {/* Reason if provided */}
                {entry.reason && (
                  <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                    <span className="font-medium text-blue-900">Reason:</span>
                    <span className="text-blue-800 ml-2">{entry.reason}</span>
                  </div>
                )}

                {index < entries.length - 1 && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing page {currentPage} of {totalPages} ({totalEntries.toLocaleString()} total entries)
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm text-gray-600">
              {currentPage} / {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}