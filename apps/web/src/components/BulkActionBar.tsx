import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface BulkAction {
  id: string;
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  permission?: string;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

interface BulkActionBarProps {
  selectedCount: number;
  actions: BulkAction[];
  onAction: (actionId: string) => void;
  onClearSelection: () => void;
  loading?: boolean;
  className?: string;
}

/**
 * Bulk action bar that appears when items are selected
 * Part of Phase 2 UX improvements for bulk operations framework
 */
const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  actions,
  onAction,
  onClearSelection,
  loading = false,
  className = '',
}) => {
  const handleAction = (action: BulkAction) => {
    if (action.requiresConfirmation) {
      const message = action.confirmationMessage || 
        `Are you sure you want to ${action.label.toLowerCase()} ${selectedCount} item${selectedCount > 1 ? 's' : ''}?`;
      
      if (window.confirm(message)) {
        onAction(action.id);
      }
    } else {
      onAction(action.id);
    }
  };

  const getActionButtonClass = (variant: BulkAction['variant'] = 'secondary') => {
    const baseClass = 'px-3 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2';
    
    switch (variant) {
      case 'primary':
        return `${baseClass} bg-warm-gold text-white hover:bg-opacity-90`;
      case 'danger':
        return `${baseClass} bg-red-600 text-white hover:bg-red-700`;
      case 'success':
        return `${baseClass} bg-green-600 text-white hover:bg-green-700`;
      default:
        return `${baseClass} bg-gray-600 text-white hover:bg-gray-700`;
    }
  };

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 ${className}`}
        >
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-96">
            <div className="flex items-center justify-between">
              {/* Selection info */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-warm-gold rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {selectedCount}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {selectedCount} item{selectedCount > 1 ? 's' : ''} selected
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {actions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action)}
                    disabled={loading}
                    className={getActionButtonClass(action.variant)}
                    title={action.label}
                  >
                    {action.icon && <span>{action.icon}</span>}
                    <span className="hidden sm:inline">{action.label}</span>
                  </button>
                ))}
                
                {/* Clear selection */}
                <button
                  onClick={onClearSelection}
                  disabled={loading}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  title="Clear selection"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BulkActionBar;