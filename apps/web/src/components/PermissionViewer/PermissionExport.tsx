import React, { useState } from 'react';
import {
  Download,
  FileText,
  Table,
  Code,
  File,
  Check,
} from 'lucide-react';
import { PermissionExportProps, PermissionExportOptions } from '../../types/permissionViewer';

export const PermissionExport: React.FC<PermissionExportProps> = ({
  permissions,
  selectedPermissions,
  onExport,
  className = '',
}) => {
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState<PermissionExportOptions>({
    format: 'json',
    includeDescriptions: true,
    includeRoleContext: false,
    includeUserContext: false,
    filterBySelection: false,
  });
  const [isExporting, setIsExporting] = useState(false);

  const formatOptions = [
    {
      value: 'json' as const,
      label: 'JSON',
      description: 'JavaScript Object Notation - structured data format',
      icon: Code,
      extension: '.json',
    },
    {
      value: 'csv' as const,
      label: 'CSV',
      description: 'Comma-Separated Values - spreadsheet compatible',
      icon: Table,
      extension: '.csv',
    },
    {
      value: 'yaml' as const,
      label: 'YAML',
      description: 'YAML Ain\'t Markup Language - human-readable format',
      icon: FileText,
      extension: '.yaml',
    },
    {
      value: 'markdown' as const,
      label: 'Markdown',
      description: 'Markdown format - documentation friendly',
      icon: File,
      extension: '.md',
    },
  ];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(exportOptions);
      setShowExportModal(false);
    } catch (error) {
      console.error('Export failed:', error);
      // Handle error (could show toast notification)
    } finally {
      setIsExporting(false);
    }
  };

  const getExportCount = () => {
    if (exportOptions.filterBySelection) {
      return selectedPermissions.length;
    }
    return permissions.length;
  };

  const getSelectedFormat = () => {
    return formatOptions.find(f => f.value === exportOptions.format)!;
  };

  return (
    <div className={className}>
      {/* Export Button */}
      <button
        onClick={() => setShowExportModal(true)}
        disabled={permissions.length === 0}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Download className="h-4 w-4" />
        <span>Export</span>
        {permissions.length > 0 && (
          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
            {permissions.length}
          </span>
        )}
      </button>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              {/* Header */}
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Export Permissions
                  </h3>
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mt-4 space-y-6">
                  {/* Format Selection */}
                  <div>
                    <label className="text-sm font-medium text-gray-900 block mb-3">
                      Export Format
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {formatOptions.map((format) => {
                        const Icon = format.icon;
                        return (
                          <button
                            key={format.value}
                            onClick={() => setExportOptions(prev => ({ ...prev, format: format.value }))}
                            className={`relative rounded-lg border p-3 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              exportOptions.format === format.value
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <Icon className="h-5 w-5 text-gray-400" />
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{format.label}</div>
                                <div className="text-xs text-gray-500 mt-1">{format.description}</div>
                              </div>
                              {exportOptions.format === format.value && (
                                <Check className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Export Scope */}
                  <div>
                    <label className="text-sm font-medium text-gray-900 block mb-3">
                      Export Scope
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="exportScope"
                          checked={!exportOptions.filterBySelection}
                          onChange={() => setExportOptions(prev => ({ ...prev, filterBySelection: false }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-3 text-sm text-gray-700">
                          All permissions ({permissions.length} items)
                        </span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="exportScope"
                          checked={exportOptions.filterBySelection}
                          onChange={() => setExportOptions(prev => ({ ...prev, filterBySelection: true }))}
                          disabled={selectedPermissions.length === 0}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 disabled:opacity-50"
                        />
                        <span className="ml-3 text-sm text-gray-700">
                          Selected permissions only ({selectedPermissions.length} items)
                          {selectedPermissions.length === 0 && (
                            <span className="text-gray-400 ml-1">(none selected)</span>
                          )}
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Additional Options */}
                  <div>
                    <label className="text-sm font-medium text-gray-900 block mb-3">
                      Include Additional Data
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={exportOptions.includeDescriptions}
                          onChange={(e) => setExportOptions(prev => ({ 
                            ...prev, 
                            includeDescriptions: e.target.checked 
                          }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700">Permission descriptions</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={exportOptions.includeRoleContext}
                          onChange={(e) => setExportOptions(prev => ({ 
                            ...prev, 
                            includeRoleContext: e.target.checked 
                          }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700">Role associations</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={exportOptions.includeUserContext}
                          onChange={(e) => setExportOptions(prev => ({ 
                            ...prev, 
                            includeUserContext: e.target.checked 
                          }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700">User assignments</span>
                      </label>
                    </div>
                  </div>

                  {/* Export Preview */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Export Preview</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Format: <span className="font-medium">{getSelectedFormat().label}</span></div>
                      <div>File: <span className="font-medium">permissions_{new Date().toISOString().split('T')[0]}{getSelectedFormat().extension}</span></div>
                      <div>Items: <span className="font-medium">{getExportCount()} permissions</span></div>
                      <div>Size: <span className="font-medium">~{Math.ceil(getExportCount() * 0.5)}KB</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleExport}
                  disabled={isExporting || getExportCount() === 0}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export {getExportCount()} Permissions
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowExportModal(false)}
                  disabled={isExporting}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionExport;