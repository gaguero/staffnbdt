import React, { useState } from 'react';
import { useTodayBoard, useBulkUpdateStatus, useBulkAssign, useBulkComplete } from '../../hooks/useConcierge';
import { ConciergeObject, ConciergeObjectStatus } from '../../types/concierge';
import LoadingSpinner from '../LoadingSpinner';
import ErrorDisplay from '../ErrorDisplay';
import BulkActionBar from '../BulkActionBar';
import { useBulkSelection } from '../../hooks/useBulkSelection';
import { format, isOverdue } from '../../utils/dateUtils';
import { toast } from 'react-hot-toast';

interface TodayBoardSectionProps {
  title: string;
  status: ConciergeObjectStatus[];
  objects: ConciergeObject[];
  count: number;
  variant: 'overdue' | 'today' | 'upcoming';
  onObjectClick: (object: ConciergeObject) => void;
  selectedObjects: Set<string>;
  onObjectSelect: (objectId: string, selected: boolean) => void;
  onSelectAll: (objectIds: string[], selected: boolean) => void;
}

const TodayBoardSection: React.FC<TodayBoardSectionProps> = ({
  title,
  objects,
  count,
  variant,
  onObjectClick,
  selectedObjects,
  onObjectSelect,
  onSelectAll,
}) => {
  const sectionColors = {
    overdue: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      header: 'bg-red-100 text-red-800',
      badge: 'bg-red-500 text-white'
    },
    today: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200', 
      header: 'bg-yellow-100 text-yellow-800',
      badge: 'bg-yellow-500 text-white'
    },
    upcoming: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      header: 'bg-green-100 text-green-800',
      badge: 'bg-green-500 text-white'
    }
  };

  const colors = sectionColors[variant];
  const allObjectIds = objects.map(obj => obj.id);
  const allSelected = allObjectIds.length > 0 && allObjectIds.every(id => selectedObjects.has(id));
  const someSelected = allObjectIds.some(id => selectedObjects.has(id));

  return (
    <div className={`${colors.bg} ${colors.border} border rounded-lg overflow-hidden`}>
      {/* Section Header */}
      <div className={`${colors.header} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected && !allSelected;
            }}
            onChange={(e) => onSelectAll(allObjectIds, e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <h3 className="font-semibold text-lg">{title}</h3>
          <span className={`${colors.badge} px-2 py-1 rounded-full text-xs font-medium`}>
            {count}
          </span>
        </div>
      </div>

      {/* Objects List */}
      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {objects.length === 0 ? (
          <div className="text-center py-8 text-gray-500 transform transition-all duration-300 hover:scale-105">
            <div className="text-4xl mb-3 animate-bounce">
              {variant === 'overdue' ? '🎉' : variant === 'today' ? '☀️' : '🌟'}
            </div>
            <p className="font-medium text-gray-700 mb-1">
              {variant === 'overdue' ? 'Amazing! No overdue items' : 
               variant === 'today' ? 'Ready for a productive day!' : 
               'Future tasks are planned ahead'}
            </p>
            <p className="text-sm text-gray-500">
              {variant === 'overdue' ? 'Keep up the excellent work!' : 
               variant === 'today' ? 'New tasks will appear here as they arrive' : 
               'Stay ahead of the game!'}
            </p>
          </div>
        ) : (
          objects.map((object) => (
            <ConciergeObjectCard
              key={object.id}
              object={object}
              selected={selectedObjects.has(object.id)}
              onSelect={(selected) => onObjectSelect(object.id, selected)}
              onClick={() => onObjectClick(object)}
            />
          ))
        )}
      </div>
    </div>
  );
};

interface ConciergeObjectCardProps {
  object: ConciergeObject;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onClick: () => void;
}

const ConciergeObjectCard: React.FC<ConciergeObjectCardProps> = ({
  object,
  selected,
  onSelect,
  onClick,
}) => {
  const statusColors = {
    open: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
    overdue: 'bg-red-100 text-red-800',
  };

  const priorityIcon = object.dueAt && isOverdue(object.dueAt) ? '🚨' : '📋';
  
  return (
    <div 
      className={`bg-white border rounded-lg p-3 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
        selected ? 'ring-2 ring-blue-500 border-blue-300 shadow-md' : 'border-gray-200 hover:border-blue-200'
      }`}
      onClick={(e) => {
        if ((e.target as HTMLInputElement).type !== 'checkbox') {
          onClick();
        }
      }}
    >
      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect(e.target.checked);
          }}
          className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-lg">{priorityIcon}</span>
            <h4 className="font-medium text-gray-900 truncate">
              {object.type.replace('_', ' ')}
            </h4>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[object.status]}`}>
              {object.status.replace('_', ' ')}
            </span>
          </div>
          
          {object.reservationId && (
            <p className="text-sm text-gray-600 mb-1">
              Reservation: {object.reservationId}
            </p>
          )}
          
          {object.guestId && (
            <p className="text-sm text-gray-600 mb-1">
              Guest: {object.guest?.firstName} {object.guest?.lastName}
            </p>
          )}
          
          {object.dueAt && (
            <p className={`text-xs ${
              isOverdue(object.dueAt) ? 'text-red-600 font-medium' : 'text-gray-500'
            }`}>
              Due: {format(object.dueAt, 'MMM d, h:mm a')}
            </p>
          )}
          
          {object.assignments && Object.keys(object.assignments).length > 0 && (
            <p className="text-xs text-gray-500">
              Assigned: {Object.values(object.assignments).join(', ')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

interface TodayBoardProps {
  onObjectClick?: (object: ConciergeObject) => void;
}

const TodayBoard: React.FC<TodayBoardProps> = ({ onObjectClick = () => {} }) => {
  const { data, isLoading, error, refetch } = useTodayBoard();
  const bulkUpdateStatus = useBulkUpdateStatus();
  const bulkAssign = useBulkAssign();
  const bulkComplete = useBulkComplete();
  const bulkSelection = useBulkSelection<ConciergeObject>();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleBulkAction = async (actionId: string, selectedObjects: ConciergeObject[]) => {
    const objectIds = selectedObjects.map(obj => obj.id);
    
    try {
      switch (actionId) {
        case 'complete':
          await bulkComplete.mutateAsync({ objectIds });
          // Celebration for bulk completion
          if (objectIds.length > 1) {
            setTimeout(() => {
              toast.success(`🎉 Amazing! ${objectIds.length} tasks completed at once!`, {
                duration: 4000,
                icon: '🏆'
              });
            }, 500);
          }
          break;
        case 'in_progress':
          await bulkUpdateStatus.mutateAsync({ objectIds, status: 'in_progress' });
          break;
        case 'assign':
          // This would need a user selection dialog in a real implementation
          toast.error('User assignment dialog not implemented yet');
          return;
        default:
          return;
      }
      
      // Clear selection after successful action
      bulkSelection.clearSelection();
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDisplay 
        message="Failed to load today's board"
        onRetry={refetch}
      />
    );
  }

  const sections = data?.data || [];
  const selectedCount = bulkSelection.state.selectedCount;
  const selectedObjects = sections.flatMap(section => section.objects)
    .filter(obj => bulkSelection.isSelected(obj.id));

  const bulkActions = [
    {
      id: 'complete',
      label: 'Complete',
      icon: '✅',
      variant: 'success' as const,
    },
    {
      id: 'in_progress',
      label: 'Mark In Progress',
      icon: '🔄',
      variant: 'primary' as const,
    },
    {
      id: 'assign',
      label: 'Assign',
      icon: '👤',
      variant: 'secondary' as const,
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-2 text-gray-900">Today's Board</h1>
          <p className="text-gray-600">Manage today's concierge tasks and priorities</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn btn-outline btn-sm flex items-center space-x-2 hover:scale-105 transition-transform duration-200"
          >
            {isRefreshing ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin text-blue-500">⚡</div>
                <span>Syncing...</span>
              </div>
            ) : (
              <>
                <span className="hover:animate-spin transition-transform">🔄</span>
                <span>Refresh</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedCount > 0 && (
        <BulkActionBar
          selectedCount={selectedCount}
          actions={bulkActions}
          onAction={(actionId) => handleBulkAction(actionId, selectedObjects)}
          onClearSelection={bulkSelection.clearSelection}
          loading={bulkUpdateStatus.isPending || bulkComplete.isPending || bulkAssign.isPending}
        />
      )}

      {/* Board Sections - Mobile First Layout */}
      <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-6">
        {sections.map((section, index) => {
          const variant = index === 0 ? 'overdue' : index === 1 ? 'today' : 'upcoming';
          return (
            <TodayBoardSection
              key={section.title}
              title={section.title}
              status={section.status}
              objects={section.objects}
              count={section.count}
              variant={variant}
              onObjectClick={onObjectClick}
              selectedObjects={new Set(bulkSelection.state.selectedItems.map((obj: any) => obj.id))}
              onObjectSelect={(objectId, selected) => {
                const object = sections.flatMap(s => s.objects).find(obj => obj.id === objectId);
                if (object) {
                  if (selected) {
                    bulkSelection.toggleItem(object.id, object);
                  } else {
                    bulkSelection.toggleItem(objectId);
                  }
                }
              }}
              onSelectAll={(objectIds, selected) => {
                const objects = sections.flatMap(s => s.objects)
                  .filter(obj => objectIds.includes(obj.id));
                if (selected) {
                  objects.forEach(obj => bulkSelection.toggleItem(obj.id, obj));
                } else {
                  objects.forEach(obj => bulkSelection.toggleItem(obj.id));
                }
              }}
            />
          );
        })}
      </div>

      {/* Empty State - Celebration Moment */}
      {sections.every(section => section.objects.length === 0) && (
        <div className="text-center py-12 transform transition-all duration-500 hover:scale-105">
          <div className="text-6xl mb-4 animate-pulse">✨</div>
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-8 mx-auto max-w-md border border-green-200">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-xl font-bold text-green-800 mb-3">
              Outstanding Performance!
            </h3>
            <p className="text-green-700 mb-4">
              Your team is on top of everything. All tasks are complete and no items are overdue.
            </p>
            <div className="inline-flex items-center space-x-2 bg-green-100 px-4 py-2 rounded-full">
              <span className="text-sm font-medium text-green-800">Perfect Score</span>
              <span className="text-green-600">💯</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodayBoard;
