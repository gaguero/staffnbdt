import { useState, useCallback } from 'react';
import { toastService } from '../utils/toast';

export interface ExportConfig {
  filename?: string;
  format?: 'csv' | 'xlsx' | 'json';
  includeHeaders?: boolean;
  selectedColumns?: string[];
  customColumnMapping?: Record<string, string>;
}

export interface ExportOptions {
  respectFilters?: boolean;
  selectedOnly?: boolean;
  customFilename?: string;
}

export interface UseExportReturn {
  isExporting: boolean;
  exportData: (
    data: any[],
    config?: ExportConfig,
    options?: ExportOptions
  ) => Promise<void>;
  exportFromService: (
    serviceCall: () => Promise<Blob>,
    filename?: string
  ) => Promise<void>;
}

/**
 * Custom hook for enhanced export functionality
 * Part of Phase 2 UX improvements for export enhancement
 */
export const useExport = (): UseExportReturn => {
  const [isExporting, setIsExporting] = useState(false);

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, []);

  const generateFilename = useCallback((prefix: string, format: string) => {
    const timestamp = new Date().toISOString().split('T')[0];
    return `${prefix}-${timestamp}.${format}`;
  }, []);

  const convertToCSV = useCallback((data: any[], config: ExportConfig) => {
    if (data.length === 0) {
      throw new Error('No data to export');
    }

    const {
      includeHeaders = true,
      selectedColumns,
      customColumnMapping = {},
    } = config;

    // Determine columns to include
    const firstItem = data[0];
    const allColumns = Object.keys(firstItem);
    const columnsToInclude = selectedColumns || allColumns;

    // Generate CSV content
    const rows: string[] = [];

    // Add headers if requested
    if (includeHeaders) {
      const headers = columnsToInclude.map(col => 
        customColumnMapping[col] || col.charAt(0).toUpperCase() + col.slice(1)
      );
      rows.push(headers.map(h => `"${h}"`).join(','));
    }

    // Add data rows
    data.forEach(item => {
      const row = columnsToInclude.map(col => {
        let value = item[col];
        
        // Handle nested objects
        if (typeof value === 'object' && value !== null) {
          if (value.name) value = value.name;
          else if (value.label) value = value.label;
          else value = JSON.stringify(value);
        }
        
        // Handle null/undefined
        if (value == null) value = '';
        
        // Handle dates
        if (value instanceof Date) {
          value = value.toISOString().split('T')[0];
        }
        
        // Escape quotes and wrap in quotes
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      rows.push(row.join(','));
    });

    return rows.join('\n');
  }, []);

  const exportData = useCallback(async (
    data: any[],
    config: ExportConfig = {},
    options: ExportOptions = {}
  ) => {
    if (!data || data.length === 0) {
      toastService.error('No data to export');
      return;
    }

    const {
      filename,
      format = 'csv',
    } = config;

    const {
      customFilename,
    } = options;

    setIsExporting(true);
    const loadingToast = toastService.loading('Preparing export...');

    try {
      let blob: Blob;
      let fileExtension = format;
      
      switch (format) {
        case 'csv':
          const csvContent = convertToCSV(data, config);
          blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          break;
          
        case 'json':
          const jsonContent = JSON.stringify(data, null, 2);
          blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
          fileExtension = 'json';
          break;
          
        default:
          throw new Error(`Export format "${format}" is not supported`);
      }

      const finalFilename = customFilename || 
                           filename || 
                           generateFilename('export', fileExtension);

      downloadBlob(blob, finalFilename);
      
      toastService.dismiss(loadingToast);
      toastService.success(`Export completed: ${finalFilename}`);
      
    } catch (error: any) {
      console.error('Export failed:', error);
      toastService.dismiss(loadingToast);
      toastService.error(error.message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  }, [convertToCSV, downloadBlob, generateFilename]);

  const exportFromService = useCallback(async (
    serviceCall: () => Promise<Blob>,
    filename?: string
  ) => {
    setIsExporting(true);
    const loadingToast = toastService.loading('Exporting data...');

    try {
      const blob = await serviceCall();
      const finalFilename = filename || generateFilename('export', 'csv');
      
      downloadBlob(blob, finalFilename);
      
      toastService.dismiss(loadingToast);
      toastService.success(`Export completed: ${finalFilename}`);
      
    } catch (error: any) {
      console.error('Export failed:', error);
      toastService.dismiss(loadingToast);
      toastService.error(error.message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  }, [downloadBlob, generateFilename]);

  return {
    isExporting,
    exportData,
    exportFromService,
  };
};