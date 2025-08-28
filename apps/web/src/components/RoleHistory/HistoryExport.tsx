import React, { useState } from 'react';

// Inline UI components
const Dialog = ({ children, open, onOpenChange: _onOpenChange }: any) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};
const DialogContent = ({ children, className = '' }: any) => (
  <div className={`p-6 ${className}`}>{children}</div>
);
const DialogHeader = ({ children, className = '' }: any) => (
  <div className={`mb-4 ${className}`}>{children}</div>
);
const DialogTitle = ({ children, className = '' }: any) => (
  <h2 className={`text-lg font-semibold ${className}`}>{children}</h2>
);
const DialogDescription = ({ children, className = '' }: any) => (
  <p className={`text-sm text-gray-600 mt-2 ${className}`}>{children}</p>
);
const DialogFooter = ({ children, className = '' }: any) => (
  <div className={`mt-6 flex justify-end space-x-3 ${className}`}>{children}</div>
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

const Label = ({ children, className = '', htmlFor, ...props }: any) => (
  <label className={`text-sm font-medium text-gray-700 ${className}`} htmlFor={htmlFor} {...props}>
    {children}
  </label>
);

const Checkbox = ({ checked, onCheckedChange, className = '', id, ...props }: any) => (
  <input
    type="checkbox"
    checked={checked}
    onChange={(e) => onCheckedChange?.(e.target.checked)}
    className={`rounded border-gray-300 ${className}`}
    id={id}
    {...props}
  />
);

const RadioGroup = ({ children, value, onValueChange, className = '' }: any) => (
  <div className={`grid gap-2 ${className}`}>
    {React.Children.map(children, (child) =>
      React.isValidElement(child)
        ? React.cloneElement(child, { groupValue: value, onGroupChange: onValueChange } as any)
        : child
    )}
  </div>
);
const RadioGroupItem = ({ value, ...props }: any) => (
  <input
    type="radio"
    value={value}
    className="rounded-full border-gray-300"
    {...props}
  />
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

import { 
  Download,
  FileText,
  Table,
  FileSpreadsheet,
  Code,
  Loader2,
  CheckCircle,
  Users,
  Calendar
} from 'lucide-react';

interface HistoryExportProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'pdf' | 'csv' | 'excel' | 'json') => void;
  isExporting: boolean;
  hasSelection: boolean;
  selectedCount: number;
  totalEntries: number;
}

const FORMAT_OPTIONS = [
  {
    value: 'pdf',
    label: 'PDF Report',
    description: 'Professional formatted report',
    icon: FileText,
    color: 'text-red-600',
  },
  {
    value: 'csv',
    label: 'CSV File',
    description: 'Comma-separated values for analysis',
    icon: Table,
    color: 'text-green-600',
  },
  {
    value: 'excel',
    label: 'Excel Workbook',
    description: 'Spreadsheet with charts and formatting',
    icon: FileSpreadsheet,
    color: 'text-blue-600',
  },
  {
    value: 'json',
    label: 'JSON Data',
    description: 'Machine-readable structured data',
    icon: Code,
    color: 'text-purple-600',
  },
];

export function HistoryExport({
  isOpen,
  onClose,
  onExport,
  isExporting,
  hasSelection,
  selectedCount,
  totalEntries,
}: HistoryExportProps) {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'csv' | 'excel' | 'json'>('pdf');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includePermissionChanges, setIncludePermissionChanges] = useState(false);
  const [includeAuditTrail, setIncludeAuditTrail] = useState(true);

  const handleExport = () => {
    onExport(selectedFormat);
  };

  const getEntriesText = () => {
    if (hasSelection) {
      return `${selectedCount} selected entries`;
    }
    return `${totalEntries.toLocaleString()} total entries`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Export Role History
          </DialogTitle>
          <DialogDescription>
            Export role assignment history data in your preferred format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Scope */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Export Scope</Label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {hasSelection ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Users className="h-4 w-4 text-blue-600" />
                  )}
                  <span className="text-sm font-medium">
                    {getEntriesText()}
                  </span>
                </div>
                <Badge variant={hasSelection ? 'default' : 'secondary'}>
                  {hasSelection ? 'Selected' : 'All Filtered'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <RadioGroup value={selectedFormat} onValueChange={setSelectedFormat as any}>
              <div className="grid grid-cols-1 gap-3">
                {FORMAT_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <div
                      key={option.value}
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedFormat === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedFormat(option.value as any)}
                    >
                      <RadioGroupItem value={option.value} />
                      <Icon className={`h-5 w-5 ${option.color}`} />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </RadioGroup>
          </div>

          {/* Export Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Include Additional Data</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="metadata"
                  checked={includeMetadata}
                  onCheckedChange={setIncludeMetadata}
                />
                <Label
                  htmlFor="metadata"
                  className="text-sm font-normal cursor-pointer"
                >
                  User and role metadata
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="permissions"
                  checked={includePermissionChanges}
                  onCheckedChange={setIncludePermissionChanges}
                />
                <Label
                  htmlFor="permissions"
                  className="text-sm font-normal cursor-pointer"
                >
                  Permission changes details
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="audit"
                  checked={includeAuditTrail}
                  onCheckedChange={setIncludeAuditTrail}
                />
                <Label
                  htmlFor="audit"
                  className="text-sm font-normal cursor-pointer"
                >
                  Audit trail information
                </Label>
              </div>
            </div>
          </div>

          {/* Export Preview */}
          {selectedFormat && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Export Preview
                </span>
              </div>
              <div className="text-xs text-blue-700 mt-1">
                {FORMAT_OPTIONS.find(opt => opt.value === selectedFormat)?.description}
              </div>
              <div className="text-xs text-blue-600 mt-2">
                File size: ~{Math.ceil((hasSelection ? selectedCount : totalEntries) * 0.5)}KB
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export {selectedFormat.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}