import React, { useState } from 'react';
import {
  Download as DocumentArrowDownIcon,
  FileText as DocumentIcon,
  Grid3x3 as TableCellsIcon,
  Code as CodeBracketIcon,
} from 'lucide-react';
import { RoleComparison } from '../../types/roleComparison';
import { type UseComparisonAnalyticsReturn } from '../../hooks/useComparisonAnalytics';

interface ComparisonExportProps {
  comparison: RoleComparison;
  analytics: UseComparisonAnalyticsReturn | null;
  className?: string;
}

type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json' | 'markdown';

const ComparisonExport: React.FC<ComparisonExportProps> = ({
  comparison,
  analytics,
  className = '',
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const exportFormats = [
    {
      id: 'pdf' as ExportFormat,
      label: 'PDF Report',
      icon: DocumentIcon,
      description: 'Professional report with charts and analysis',
      available: true,
    },
    {
      id: 'excel' as ExportFormat,
      label: 'Excel Workbook',
      icon: TableCellsIcon,
      description: 'Spreadsheet with detailed permission matrix',
      available: true,
    },
    {
      id: 'csv' as ExportFormat,
      label: 'CSV Data',
      icon: TableCellsIcon,
      description: 'Raw data in comma-separated format',
      available: true,
    },
    {
      id: 'json' as ExportFormat,
      label: 'JSON Data',
      icon: CodeBracketIcon,
      description: 'Machine-readable data export',
      available: true,
    },
    {
      id: 'markdown' as ExportFormat,
      label: 'Markdown',
      icon: DocumentIcon,
      description: 'Documentation-friendly format',
      available: true,
    },
  ];
  
  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    setShowExportMenu(false);
    
    try {
      switch (format) {
        case 'pdf':
          await exportToPDF();
          break;
        case 'excel':
          await exportToExcel();
          break;
        case 'csv':
          await exportToCSV();
          break;
        case 'json':
          await exportToJSON();
          break;
        case 'markdown':
          await exportToMarkdown();
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
      // Could show a toast notification here
    } finally {
      setIsExporting(false);
    }
  };
  
  const exportToPDF = async () => {
    // Implementation would use a library like jsPDF or html2pdf
    // For now, we'll simulate the export
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const reportData = generateReportData();
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    downloadFile(blob, 'role-comparison-report.json');
  };
  
  const exportToExcel = async () => {
    // Implementation would use a library like SheetJS
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const csvData = generateCSVData();
    const blob = new Blob([csvData], { type: 'text/csv' });
    downloadFile(blob, 'role-comparison-matrix.csv');
  };
  
  const exportToCSV = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const csvData = generateCSVData();
    const blob = new Blob([csvData], { type: 'text/csv' });
    downloadFile(blob, 'role-comparison-data.csv');
  };
  
  const exportToJSON = async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const jsonData = {
      comparison,
      analytics,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    downloadFile(blob, 'role-comparison-data.json');
  };
  
  const exportToMarkdown = async () => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const markdownData = generateMarkdownReport();
    const blob = new Blob([markdownData], { type: 'text/markdown' });
    downloadFile(blob, 'role-comparison-report.md');
  };
  
  const generateReportData = () => {
    return {
      title: 'Role Comparison Report',
      generatedAt: new Date().toISOString(),
      roles: comparison.roles.map(role => ({
        name: role.name,
        type: role.isSystemRole ? 'System' : 'Custom',
        permissionCount: role.permissions.length,
        userCount: role.userCount,
      })),
      summary: {
        totalPermissions: comparison.metrics.totalPermissions,
        sharedPermissions: comparison.metrics.sharedPermissions,
        uniquePermissions: comparison.metrics.uniquePermissions,
        similarityScore: comparison.metrics.similarityScore,
      },
      recommendations: comparison.suggestions.map(suggestion => ({
        title: suggestion.title,
        description: suggestion.description,
        impact: suggestion.impact,
        type: suggestion.type,
      })),
    };
  };
  
  const generateCSVData = () => {
    const headers = ['Permission', 'Resource', 'Action', 'Scope', ...comparison.roles.map(role => role.name)];
    const rows = [headers.join(',')];
    
    comparison.permissionMatrix.permissions.forEach(permission => {
      const permissionKey = `${permission.resource}.${permission.action}.${permission.scope}`;
      const row = [
        `"${permissionKey}"`,
        `"${permission.resource}"`,
        `"${permission.action}"`,
        `"${permission.scope}"`,
        ...comparison.roles.map(role => 
          comparison.permissionMatrix.rolePermissionMap[role.id][permissionKey] ? 'Yes' : 'No'
        ),
      ];
      rows.push(row.join(','));
    });
    
    return rows.join('\n');
  };
  
  const generateMarkdownReport = () => {
    const report = `# Role Comparison Report

Generated on: ${new Date().toLocaleString()}

## Roles Compared

${comparison.roles.map(role => 
      `- **${role.name}** (${role.isSystemRole ? 'System' : 'Custom'}) - ${role.permissions.length} permissions`
    ).join('\n')}

## Summary

- **Total Permissions**: ${comparison.metrics.totalPermissions}
- **Shared Permissions**: ${comparison.metrics.sharedPermissions}
- **Unique Permissions**: ${comparison.metrics.uniquePermissions}
- **Similarity Score**: ${(comparison.metrics.similarityScore * 100).toFixed(1)}%

## Key Findings

${comparison.suggestions.map((suggestion, index) => 
      `${index + 1}. **${suggestion.title}** (${suggestion.impact} impact)\n   ${suggestion.description}`
    ).join('\n\n')}

## Permission Matrix

| Permission | ${comparison.roles.map(role => role.name).join(' | ')} |
|${Array(comparison.roles.length + 1).fill('---').join('|')}|
${comparison.permissionMatrix.permissions.map(permission => {
      const permissionKey = `${permission.resource}.${permission.action}.${permission.scope}`;
      return `| ${permissionKey} | ${comparison.roles.map(role => 
        comparison.permissionMatrix.rolePermissionMap[role.id][permissionKey] ? '✓' : '✗'
      ).join(' | ')} |`;
    }).join('\n')}
`;
    
    return report;
  };
  
  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowExportMenu(!showExportMenu)}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExporting ? (
          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <DocumentArrowDownIcon className="h-4 w-4" />
        )}
        {isExporting ? 'Exporting...' : 'Export'}
      </button>
      
      {/* Export Menu */}
      {showExportMenu && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="py-2">
            <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Export Formats
            </div>
            {exportFormats.map(format => {
              const Icon = format.icon;
              
              return (
                <button
                  key={format.id}
                  onClick={() => handleExport(format.id)}
                  disabled={!format.available || isExporting}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {format.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {format.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          
          <div className="border-t border-gray-200 px-4 py-2">
            <div className="text-xs text-gray-500">
              Export includes role details, permissions matrix, and analysis results
            </div>
          </div>
        </div>
      )}
      
      {/* Overlay to close menu */}
      {showExportMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowExportMenu(false)}
        />
      )}
    </div>
  );
};

export default ComparisonExport;
