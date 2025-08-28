import React, { useState, useMemo } from 'react';

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

const Button = ({ children, onClick, className = '', variant = 'default', size = 'default', disabled = false, ...props }: any) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
  const variants = {
    default: 'bg-slate-900 text-slate-50 hover:bg-slate-900/90',
    outline: 'border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900',
    ghost: 'hover:bg-slate-100 hover:text-slate-900'
  };
  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-11 rounded-md px-8'
  };
  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

const Badge = ({ children, variant = 'default', className = '' }: any) => {
  const variants = {
    default: 'bg-slate-900 text-slate-50 hover:bg-slate-900/80',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-100/80',
    outline: 'text-slate-950 border border-slate-200 bg-transparent hover:bg-slate-100'
  };
  return (
    <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 ${variants[variant]} ${className}`}>
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

// Simple Collapsible components
const Collapsible = ({ children, open, onOpenChange }: any) => (
  <div className="w-full">
    {React.Children.map(children, (child) =>
      React.isValidElement(child)
        ? React.cloneElement(child, { open, onOpenChange })
        : child
    )}
  </div>
);
const CollapsibleTrigger = ({ children, asChild, onClick }: any) => (
  <div onClick={onClick} className="cursor-pointer">
    {children}
  </div>
);
const CollapsibleContent = ({ children, open }: any) => (
  <div className={`overflow-hidden transition-all ${open ? 'block' : 'hidden'}`}>
    {children}
  </div>
);

import { 
  ChevronDown, 
  ChevronUp,
  Clock,
  User,
  Users,
  Shield,
  CheckCircle,
  XCircle,
  Zap,
  Calendar,
  MoreHorizontal
} from 'lucide-react';
import { format, startOfDay, subDays } from 'date-fns';
import { RoleAssignmentHistoryEntry, TimelineEntry, TimelineGroup } from '../../types/roleHistory';

interface HistoryTimelineProps {
  entries: RoleAssignmentHistoryEntry[];
  groupBy?: 'hour' | 'day' | 'week' | 'month';
  showDetails?: boolean;
  enableFiltering?: boolean;
  onEntryClick?: (entry: RoleAssignmentHistoryEntry) => void;
  maxGroups?: number;
}

const ACTION_COLORS = {
  ASSIGNED: 'border-green-500 bg-green-50',
  REMOVED: 'border-red-500 bg-red-50',
  MODIFIED: 'border-blue-500 bg-blue-50',
  BULK_ASSIGNED: 'border-green-600 bg-green-100',
  BULK_REMOVED: 'border-red-600 bg-red-100',
  EXPIRED: 'border-orange-500 bg-orange-50',
};

const ACTION_ICONS = {
  ASSIGNED: CheckCircle,
  REMOVED: XCircle,
  MODIFIED: Zap,
  BULK_ASSIGNED: Users,
  BULK_REMOVED: Users,
  EXPIRED: Clock,
};

export function HistoryTimeline({
  entries,
  groupBy = 'day',
  enableFiltering = true,
  onEntryClick,
  maxGroups = 50,
}: HistoryTimelineProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set());

  // Group entries by time period
  const groupedEntries = useMemo(() => {
    const groups = new Map<string, TimelineEntry[]>();

    entries.forEach(entry => {
      const date = new Date(entry.timestamp);
      let groupKey: string;

      switch (groupBy) {
        case 'hour':
          groupKey = format(date, 'yyyy-MM-dd HH:00');
          break;
        case 'week':
          const weekStart = startOfDay(subDays(date, date.getDay()));
          groupKey = format(weekStart, 'yyyy-MM-dd');
          break;
        case 'month':
          groupKey = format(date, 'yyyy-MM');
          break;
        default: // day
          groupKey = format(date, 'yyyy-MM-dd');
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }

      groups.get(groupKey)!.push({
        ...entry,
        groupKey,
      });
    });

    // Convert to timeline groups and sort by date
    const timelineGroups: TimelineGroup[] = Array.from(groups.entries())
      .map(([groupKey, groupEntries]) => {
        // Sort entries within group by timestamp
        groupEntries.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        // Calculate summary
        const actionCounts = groupEntries.reduce((acc, entry) => {
          acc[entry.action] = (acc[entry.action] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const primaryAction = Object.entries(actionCounts)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || 'ASSIGNED';

        const uniqueUsers = new Set(groupEntries.map(e => e.userId)).size;
        const uniqueRoles = new Set(groupEntries.map(e => e.roleId)).size;
        const primaryAdmin = groupEntries[0]?.metadata?.adminDetails;

        return {
          groupKey,
          timestamp: new Date(groupKey + (groupBy === 'hour' ? ':00' : '')),
          entries: groupEntries,
          summary: {
            action: primaryAction,
            affectedUsers: uniqueUsers,
            affectedRoles: uniqueRoles,
            adminName: primaryAdmin ? 
              `${primaryAdmin.firstName} ${primaryAdmin.lastName}` : 
              'Unknown',
          },
        };
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, maxGroups);

    return timelineGroups;
  }, [entries, groupBy, maxGroups]);

  // Filter groups if action filtering is enabled
  const filteredGroups = useMemo(() => {
    if (!enableFiltering || selectedActions.size === 0) {
      return groupedEntries;
    }

    return groupedEntries.filter(group =>
      group.entries.some(entry => selectedActions.has(entry.action))
    );
  }, [groupedEntries, selectedActions, enableFiltering]);

  const toggleGroupExpansion = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const toggleActionFilter = (action: string) => {
    const newSelected = new Set(selectedActions);
    if (newSelected.has(action)) {
      newSelected.delete(action);
    } else {
      newSelected.add(action);
    }
    setSelectedActions(newSelected);
  };

  const formatGroupDate = (date: Date) => {
    switch (groupBy) {
      case 'hour':
        return format(date, 'MMM d, yyyy h:mm a');
      case 'week':
        return `Week of ${format(date, 'MMM d, yyyy')}`;
      case 'month':
        return format(date, 'MMMM yyyy');
      default: // day
        return format(date, 'EEEE, MMMM d, yyyy');
    }
  };

  const getActionColor = (action: string) => {
    return ACTION_COLORS[action as keyof typeof ACTION_COLORS] || 'border-gray-500 bg-gray-50';
  };

  const getActionIcon = (action: string) => {
    return ACTION_ICONS[action as keyof typeof ACTION_ICONS] || Clock;
  };

  const renderTimelineEntry = (entry: TimelineEntry) => {
    const Icon = getActionIcon(entry.action);
    const user = entry.metadata?.userDetails;
    const role = entry.metadata?.roleDetails;
    const admin = entry.metadata?.adminDetails;

    return (
      <div
        key={entry.id}
        className={`relative flex items-start space-x-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
          getActionColor(entry.action)
        }`}
        onClick={() => onEntryClick?.(entry)}
      >
        {/* Timeline connector */}
        <div className="flex-shrink-0">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${getActionColor(entry.action)}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {entry.action.replace('_', ' ')}
              </Badge>
              <span className="text-xs text-gray-500">
                {format(new Date(entry.timestamp), 'h:mm a')}
              </span>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* User */}
            {user && (
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="text-xs">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
            )}

            {/* Role */}
            {role && (
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{role.name}</p>
                  <p className="text-xs text-gray-500">Level {role.level}</p>
                </div>
              </div>
            )}

            {/* Admin */}
            {admin && (
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-600" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-600">
                    by {admin.firstName} {admin.lastName}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Reason */}
          {entry.reason && (
            <div className="mt-2 text-sm text-gray-700 bg-white/50 rounded p-2">
              <span className="font-medium">Reason:</span> {entry.reason}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTimelineGroup = (group: TimelineGroup) => {
    const isExpanded = expandedGroups.has(group.groupKey);
    const primaryIcon = getActionIcon(group.summary.action);
    const PrimaryIcon = primaryIcon;

    return (
      <Card key={group.groupKey} className="mb-6">
        <Collapsible open={isExpanded} onOpenChange={() => toggleGroupExpansion(group.groupKey)}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => toggleGroupExpansion(group.groupKey)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${getActionColor(group.summary.action)}`}>
                    <PrimaryIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {formatGroupDate(group.timestamp)}
                    </CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{group.entries.length} changes</span>
                      <span>{group.summary.affectedUsers} users</span>
                      <span>{group.summary.affectedRoles} roles</span>
                      <span>by {group.summary.adminName}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">
                    {group.entries.length} entries
                  </Badge>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent open={isExpanded}>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {group.entries.map(entry => renderTimelineEntry(entry))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  };

  // Get available actions for filtering
  const availableActions = useMemo(() => {
    const actions = new Set(entries.map(entry => entry.action));
    return Array.from(actions).sort();
  }, [entries]);

  if (filteredGroups.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Timeline Data</h3>
            <p className="text-gray-600">
              No role assignment history found for the selected time period.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timeline Header and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Role Assignment Timeline
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Chronological view of role assignments grouped by {groupBy}
              </p>
            </div>

            {enableFiltering && availableActions.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Filter by action:</span>
                {availableActions.map(action => (
                  <Button
                    key={action}
                    variant={selectedActions.has(action) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleActionFilter(action)}
                    className="text-xs"
                  >
                    {action.replace('_', ' ')}
                  </Button>
                ))}
                {selectedActions.size > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedActions(new Set())}
                  >
                    Clear
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Timeline Groups */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />
        
        {/* Timeline entries */}
        <div className="space-y-0">
          {filteredGroups.map(group => renderTimelineGroup(group))}
        </div>
      </div>

      {/* Load More / Summary */}
      {groupedEntries.length > maxGroups && (
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-600 mb-3">
              Showing {maxGroups} most recent time periods out of {groupedEntries.length} total
            </p>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4 mr-2" />
              Load More History
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}