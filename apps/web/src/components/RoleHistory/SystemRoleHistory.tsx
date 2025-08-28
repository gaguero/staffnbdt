import { useState, useEffect } from 'react';

// Inline UI components
const Card = ({ children, className = '' }: any) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>{children}</div>
);
const CardContent = ({ children, className = '' }: any) => (
  <div className={`px-6 py-4 ${className}`}>{children}</div>
);

const Button = ({ children, onClick, className = '', variant = 'default', size = 'default', disabled = false, ...props }: any) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
  const variants: Record<string, string> = {
    default: 'bg-slate-900 text-slate-50 hover:bg-slate-900/90',
    outline: 'border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900',
    ghost: 'hover:bg-slate-100 hover:text-slate-900'
  };
  const sizes: Record<string, string> = {
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

const Badge = ({ children, variant = 'default', className = '' }: any) => {
  const variants: Record<string, string> = {
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

// Simple Avatar component
const Avatar = ({ children, className = '' }: any) => (
  <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}>
    {children}
  </div>
);
const AvatarFallback = ({ children, className = '' }: any) => (
  <div className={`flex h-full w-full items-center justify-center rounded-full bg-slate-100 ${className}`}>
    {children}
  </div>
);
const AvatarImage = ({ src, className = '' }: any) => (
  src ? <img src={src} className={`aspect-square h-full w-full ${className}`} alt="Avatar" /> : null
);

// Simple Separator component
const Separator = ({ className = '' }: any) => (
  <hr className={`shrink-0 bg-slate-200 h-[1px] w-full ${className}`} />
);

// Simple Tooltip components
const TooltipProvider = ({ children }: any) => <div>{children}</div>;
const Tooltip = ({ children }: any) => <div className="relative group">{children}</div>;
const TooltipTrigger = ({ children }: any) => <div>{children}</div>;
const TooltipContent = ({ children, className = '' }: any) => (
  <div className={`absolute z-50 hidden group-hover:block bg-slate-900 text-slate-50 px-3 py-1.5 text-sm rounded-md shadow-md -translate-y-full -translate-x-1/2 left-1/2 bottom-full mb-1 ${className}`}>
    {children}
  </div>
);

// Simple Dropdown components
const DropdownMenu = ({ children }: any) => <div className="relative">{children}</div>;
const DropdownMenuTrigger = ({ children, asChild, ...props }: any) => (
  <div {...props}>{children}</div>
);
const DropdownMenuContent = ({ children, align = 'start', className = '' }: any) => (
  <div className={`hidden group-hover:block absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 shadow-md ${align === 'end' ? 'right-0' : 'left-0'} ${className}`}>
    {children}
  </div>
);
const DropdownMenuItem = ({ children, onClick, className = '' }: any) => (
  <div className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-slate-100 focus:bg-slate-100 ${className}`} onClick={onClick}>
    {children}
  </div>
);
const DropdownMenuSeparator = ({ className = '' }: any) => (
  <div className={`-mx-1 my-1 h-px bg-slate-100 ${className}`} />
);

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
  onPageSizeChange: _onPageSizeChange,
  onViewDetails,
  onRollback,
}: SystemRoleHistoryProps) {
  const { hasPermission } = usePermissions();
  const [hoveredEntry, setHoveredEntry] = useState<string | null>(null);
  const [permissions, setPermissions] = useState({
    canRollback: false,
    canViewDetails: false
  });

  useEffect(() => {
    const checkPermissions = async () => {
      const [canRollback, canViewDetails] = await Promise.all([
        hasPermission('role', 'rollback'),
        hasPermission('role', 'read', 'history')
      ]);
      setPermissions({ canRollback, canViewDetails });
    };
    checkPermissions();
  }, [hasPermission]);

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
          {permissions.canViewDetails && onViewDetails && (
            <DropdownMenuItem onClick={() => onViewDetails(entry)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
          )}
          
          {permissions.canRollback && onRollback && (entry.action === 'ASSIGNED' || entry.action === 'REMOVED') && (
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