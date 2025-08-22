import React, { useMemo } from 'react';
import EnhancedPagination, { PaginationConfig } from './EnhancedPagination';
import BulkActionBar, { BulkAction } from './BulkActionBar';
import EditableCell from './EditableCell';
import { useBulkSelection } from '../hooks/useBulkSelection';
import { useInlineEdit, InlineEditField } from '../hooks/useInlineEdit';
import LoadingSpinner from './LoadingSpinner';

export interface TableColumn<T = any> {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (value: any, item: T, index: number) => React.ReactNode;
  editable?: boolean;
  className?: string;
}

export interface EnhancedTableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  getItemId: (item: T) => string;
  
  // Pagination
  paginationConfig?: PaginationConfig;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  
  // Bulk operations
  bulkActions?: BulkAction[];
  onBulkAction?: (actionId: string, selectedItems: T[]) => void;
  enableBulkSelection?: boolean;
  
  // Inline editing
  inlineEditFields?: InlineEditField[];
  onInlineEdit?: (id: string, field: string, value: any) => Promise<void>;
  
  // Export
  exportConfig?: {
    filename?: string;
    customColumns?: string[];
  };
  onExport?: (selectedItems?: T[]) => void;
  
  // General
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  rowClassName?: (item: T, index: number) => string;
}

/**
 * Enhanced table component with pagination, bulk operations, and inline editing
 * Combines all Phase 2 UX improvements into a single reusable component
 */
const EnhancedTable = <T extends Record<string, any>>({
  data,
  columns,
  getItemId,
  
  paginationConfig,
  onPageChange,
  onLimitChange,
  
  bulkActions = [],
  onBulkAction,
  enableBulkSelection = false,
  
  inlineEditFields = [],
  onInlineEdit,
  
  loading = false,
  emptyMessage = 'No data available',
  className = '',
  rowClassName,
}: EnhancedTableProps<T>) => {
  
  const bulkSelection = useBulkSelection<T>();
  const inlineEdit = useInlineEdit({
    onUpdate: onInlineEdit || (async () => {}),
    fields: inlineEditFields,
  });

  // Calculate selection state for current page
  const currentPageIds = useMemo(() => 
    data.map(getItemId), [data, getItemId]
  );

  const isAllSelected = useMemo(() => 
    currentPageIds.length > 0 && currentPageIds.every(id => bulkSelection.isSelected(id)),
    [currentPageIds, bulkSelection.isSelected]
  );

  const isPartialSelection = useMemo(() => 
    currentPageIds.some(id => bulkSelection.isSelected(id)) && !isAllSelected,
    [currentPageIds, bulkSelection.isSelected, isAllSelected]
  );

  // Handle bulk actions
  const handleBulkAction = (actionId: string) => {
    if (!onBulkAction) return;
    
    const selectedItems = bulkSelection.getSelectedItems(data, getItemId);
    onBulkAction(actionId, selectedItems);
  };

  // Handle select all toggle
  const handleSelectAll = () => {
    bulkSelection.toggleAll(data, getItemId);
  };

  // Handle individual item selection
  const handleItemSelect = (item: T) => {
    const id = getItemId(item);
    bulkSelection.toggleItem(id, item);
  };

  // Render table header with selection checkbox
  const renderHeader = () => (
    <thead className="bg-gray-50 border-b border-gray-200">
      <tr>
        {enableBulkSelection && (
          <th className="px-6 py-3 text-left w-12">
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(input) => {
                if (input) {
                  input.indeterminate = isPartialSelection;
                }
              }}
              onChange={handleSelectAll}
              className="w-4 h-4 text-warm-gold border-gray-300 rounded focus:ring-warm-gold"
              disabled={loading}
            />
          </th>
        )}
        {columns.map((column) => (
          <th
            key={column.key}
            className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
              column.align === 'center' ? 'text-center' :
              column.align === 'right' ? 'text-right' : 'text-left'
            } ${column.className || ''}`}
            style={{ width: column.width }}
          >
            {column.label}
          </th>
        ))}
      </tr>
    </thead>
  );

  // Render table body
  const renderBody = () => (
    <tbody className="bg-white divide-y divide-gray-200">
      {data.map((item, index) => {
        const itemId = getItemId(item);
        const isSelected = bulkSelection.isSelected(itemId);
        
        return (
          <tr
            key={itemId}
            className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''} ${
              rowClassName ? rowClassName(item, index) : ''
            }`}
          >
            {enableBulkSelection && (
              <td className="px-6 py-4 w-12">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleItemSelect(item)}
                  className="w-4 h-4 text-warm-gold border-gray-300 rounded focus:ring-warm-gold"
                  disabled={loading}
                />
              </td>
            )}
            {columns.map((column) => {
              const value = item[column.key];
              const isEditable = column.editable && 
                                inlineEdit.canEdit(column.key) && 
                                onInlineEdit;
              
              return (
                <td
                  key={column.key}
                  className={`px-6 py-4 ${
                    column.align === 'center' ? 'text-center' :
                    column.align === 'right' ? 'text-right' : 'text-left'
                  } ${column.className || ''}`}
                >
                  {isEditable ? (
                    <EditableCell
                      value={value}
                      onSave={(newValue) => inlineEdit.saveEdit(itemId, column.key, newValue)}
                      type={inlineEdit.getFieldConfig(column.key)?.type}
                      options={inlineEdit.getFieldConfig(column.key)?.options}
                      validator={inlineEdit.getFieldConfig(column.key)?.validator}
                      displayFormatter={inlineEdit.getFieldConfig(column.key)?.displayFormatter}
                      disabled={loading || inlineEdit.isSaving(itemId, column.key)}
                    />
                  ) : column.render ? (
                    column.render(value, item, index)
                  ) : (
                    <span className="text-sm text-gray-900">{value}</span>
                  )}
                </td>
              );
            })}
          </tr>
        );
      })}
    </tbody>
  );

  // Render empty state
  const renderEmptyState = () => (
    <tbody>
      <tr>
        <td
          colSpan={columns.length + (enableBulkSelection ? 1 : 0)}
          className="px-6 py-12 text-center text-gray-500"
        >
          <div className="text-4xl mb-2">📋</div>
          <p>{emptyMessage}</p>
        </td>
      </tr>
    </tbody>
  );

  // Render loading state
  const renderLoadingState = () => (
    <tbody>
      <tr>
        <td
          colSpan={columns.length + (enableBulkSelection ? 1 : 0)}
          className="px-6 py-12 text-center"
        >
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 mt-4">Loading...</p>
        </td>
      </tr>
    </tbody>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {renderHeader()}
            {loading && data.length === 0 ? renderLoadingState() :
             data.length === 0 ? renderEmptyState() :
             renderBody()}
          </table>
        </div>
      </div>

      {/* Pagination */}
      {paginationConfig && onPageChange && onLimitChange && (
        <EnhancedPagination
          config={paginationConfig}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          loading={loading}
        />
      )}

      {/* Bulk action bar */}
      {enableBulkSelection && bulkActions.length > 0 && (
        <BulkActionBar
          selectedCount={bulkSelection.state.selectedCount}
          actions={bulkActions}
          onAction={handleBulkAction}
          onClearSelection={bulkSelection.clearSelection}
          loading={loading}
        />
      )}
    </div>
  );
};

export default EnhancedTable;