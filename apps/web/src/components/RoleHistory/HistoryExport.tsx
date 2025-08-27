import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { 
  Download,
  FileText,
  Table,
  FileSpreadsheet,
  Code,
  Loader2,
  CheckCircle,
  Users,
  Calendar,
  Shield
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