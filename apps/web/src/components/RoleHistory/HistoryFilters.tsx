import React, { useState } from 'react';

// Inline utility function
const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

// Inline UI components
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

const Input = ({ className = '', ...props }: any) => (
  <input 
    className={`flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
);

const Label = ({ children, className = '', htmlFor, ...props }: any) => (
  <label className={`text-sm font-medium text-gray-700 ${className}`} htmlFor={htmlFor} {...props}>
    {children}
  </label>
);

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

const Separator = ({ className = '' }: any) => (
  <hr className={`shrink-0 bg-slate-200 h-[1px] w-full ${className}`} />
);

const Calendar = ({ mode: _mode, selected, onSelect, initialFocus: _initialFocus, className = '' }: any) => {
  const [currentDate, setCurrentDate] = useState(selected || new Date());
  const handleDateClick = (date: Date) => {
    setCurrentDate(date);
    onSelect?.(date);
  };
  return (
    <div className={`p-3 ${className}`}>
      <input 
        type="date" 
        value={currentDate?.toISOString().split('T')[0] || ''}
        onChange={(e: any) => handleDateClick(new Date(e.target.value))}
        className="w-full p-2 border border-gray-300 rounded"
      />
    </div>
  );
};

const Popover = ({ children, open, onOpenChange }: any) => {
  return (
    <div className="relative">
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child, { popoverOpen: open, onPopoverChange: onOpenChange } as any)
          : child
      )}
    </div>
  );
};
const PopoverTrigger = ({ children, asChild: _asChild, popoverOpen, onPopoverChange, ...props }: any) => (
  <div onClick={() => onPopoverChange?.(!popoverOpen)} {...props}>{children}</div>
);
const PopoverContent = ({ children, className = '', popoverOpen }: any) => {
  if (!popoverOpen) return null;
  return (
    <div className={`absolute z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-2 ${className}`}>
      {children}
    </div>
  );
};

import { 
  CalendarIcon,
  X,
  Clock,
  Users,
  UserCheck,
  Zap,
  RotateCcw
} from 'lucide-react';
import { format } from 'date-fns';
import { RoleHistoryFilter } from '../../types/roleHistory';

interface HistoryFiltersProps {
  filters: RoleHistoryFilter;
  onFiltersChange: (filters: Partial<RoleHistoryFilter>) => void;
  onClearFilters: () => void;
  presets?: Array<{
    name: string;
    label: string;
    filters: Partial<RoleHistoryFilter>;
    icon?: string;
  }>;
  onApplyPreset?: (presetName: string) => void;
}

const TIME_RANGE_OPTIONS = [
  { value: '1h', label: 'Last Hour', icon: Clock },
  { value: '24h', label: 'Last 24 Hours', icon: Clock },
  { value: '7d', label: 'Last 7 Days', icon: Clock },
  { value: '30d', label: 'Last 30 Days', icon: Clock },
  { value: '90d', label: 'Last 90 Days', icon: Clock },
  { value: 'custom', label: 'Custom Range', icon: CalendarIcon },
];

const ACTION_OPTIONS = [
  { value: 'ASSIGNED', label: 'Role Assigned', icon: UserCheck },
  { value: 'REMOVED', label: 'Role Removed', icon: X },
  { value: 'MODIFIED', label: 'Role Modified', icon: Zap },
  { value: 'BULK_ASSIGNED', label: 'Bulk Assigned', icon: Users },
  { value: 'BULK_REMOVED', label: 'Bulk Removed', icon: Users },
  { value: 'EXPIRED', label: 'Role Expired', icon: Clock },
];

const SOURCE_OPTIONS = [
  { value: 'manual', label: 'Manual' },
  { value: 'bulk', label: 'Bulk Operation' },
  { value: 'template', label: 'Template' },
  { value: 'migration', label: 'Migration' },
  { value: 'automated', label: 'Automated' },
  { value: 'system', label: 'System' },
];

export function HistoryFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  presets = [],
  onApplyPreset,
}: HistoryFiltersProps) {
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);

  const updateFilter = <K extends keyof RoleHistoryFilter>(
    key: K,
    value: RoleHistoryFilter[K]
  ) => {
    onFiltersChange({ [key]: value });
  };

  const toggleArrayFilter = <K extends keyof RoleHistoryFilter>(
    key: K,
    value: string,
    currentArray: string[] = []
  ) => {
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    updateFilter(key, newArray.length > 0 ? newArray : undefined as any);
  };

  const removeFilter = (key: keyof RoleHistoryFilter) => {
    onFiltersChange({ [key]: undefined });
  };

  const hasActiveFilters = Object.keys(filters).some(key => {
    if (key === 'page' || key === 'limit') return false;
    return filters[key as keyof RoleHistoryFilter] !== undefined;
  });

  return (
    <div className="space-y-6">
      {/* Quick Presets */}
      {presets.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Quick Filters</Label>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                size="sm"
                onClick={() => onApplyPreset?.(preset.name)}
                className="h-8"
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Time Range Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Time Range</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {TIME_RANGE_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <Button
                key={option.value}
                variant={filters.timeRange === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  if (option.value === 'custom') {
                    updateFilter('timeRange', 'custom');
                  } else {
                    updateFilter('timeRange', option.value as any);
                    updateFilter('dateFrom', undefined);
                    updateFilter('dateTo', undefined);
                  }
                }}
                className="justify-start h-9"
              >
                <Icon className="h-4 w-4 mr-2" />
                {option.label}
              </Button>
            );
          })}
        </div>

        {/* Custom Date Range */}
        {filters.timeRange === 'custom' && (
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="space-y-2">
              <Label className="text-xs">From Date</Label>
              <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateFrom ? (
                      format(filters.dateFrom, "MMM d, yyyy")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={(date: Date | undefined) => {
                      updateFilter('dateFrom', date);
                      setDateFromOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">To Date</Label>
              <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateTo ? (
                      format(filters.dateTo, "MMM d, yyyy")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={(date: Date | undefined) => {
                      updateFilter('dateTo', date);
                      setDateToOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Action Type Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Action Types</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {ACTION_OPTIONS.map((action) => {
            const Icon = action.icon;
            const isSelected = filters.actions?.includes(action.value as any) || false;
            
            return (
              <Button
                key={action.value}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleArrayFilter('actions', action.value, filters.actions)}
                className="justify-start h-9"
              >
                <Icon className="h-4 w-4 mr-2" />
                {action.label}
              </Button>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Source Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Change Source</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {SOURCE_OPTIONS.map((source) => {
            const isSelected = filters.sources?.includes(source.value as any) || false;
            
            return (
              <Button
                key={source.value}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleArrayFilter('sources', source.value, filters.sources)}
                className="justify-start h-9"
              >
                {source.label}
              </Button>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Search Filter */}
      <div className="space-y-2">
        <Label htmlFor="search" className="text-sm font-medium">Search</Label>
        <Input
          id="search"
          placeholder="Search users, roles, or admins..."
          value={filters.searchTerm || ''}
          onChange={(e: any) => updateFilter('searchTerm', e.target.value || undefined)}
        />
      </div>

      {/* Bulk Operations Toggle */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Bulk Operations</Label>
        <div className="flex items-center space-x-4">
          <Button
            variant={filters.showBulkOperations ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateFilter('showBulkOperations', !filters.showBulkOperations)}
          >
            <Users className="h-4 w-4 mr-2" />
            Show Bulk Operations
          </Button>
          
          {filters.showBulkOperations && (
            <Button
              variant={filters.groupByBatch ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateFilter('groupByBatch', !filters.groupByBatch)}
            >
              Group by Batch
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Active Filters</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-8"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {/* Time Range */}
            {filters.timeRange && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {filters.timeRange === 'custom' 
                  ? 'Custom Range' 
                  : TIME_RANGE_OPTIONS.find(opt => opt.value === filters.timeRange)?.label
                }
                <button
                  onClick={() => removeFilter('timeRange')}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {/* Actions */}
            {filters.actions?.map(action => (
              <Badge key={action} variant="secondary" className="flex items-center gap-1">
                {ACTION_OPTIONS.find(opt => opt.value === action)?.label}
                <button
                  onClick={() => toggleArrayFilter('actions', action, filters.actions)}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}

            {/* Sources */}
            {filters.sources?.map(source => (
              <Badge key={source} variant="secondary" className="flex items-center gap-1">
                {SOURCE_OPTIONS.find(opt => opt.value === source)?.label}
                <button
                  onClick={() => toggleArrayFilter('sources', source, filters.sources)}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}

            {/* Search Term */}
            {filters.searchTerm && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: "{filters.searchTerm}"
                <button
                  onClick={() => removeFilter('searchTerm')}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {/* Bulk Operations */}
            {filters.showBulkOperations && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                Bulk Operations
                <button
                  onClick={() => removeFilter('showBulkOperations')}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}