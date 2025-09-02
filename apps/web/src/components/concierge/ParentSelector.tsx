import React, { useState, useMemo } from 'react';
import { ObjectType } from '../../types/concierge';

interface ParentSelectorProps {
  allObjectTypes: ObjectType[];
  currentObjectTypeId?: string;
  selectedParentId: string | null;
  onParentChange: (parentId: string | null) => void;
}

interface ParentOption {
  id: string;
  name: string;
  isActive: boolean;
  level: number;
  path: string[];
  canBeParent: boolean;
  reason?: string;
}

const ParentSelector: React.FC<ParentSelectorProps> = ({
  allObjectTypes,
  currentObjectTypeId,
  selectedParentId,
  onParentChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  // Build parent options with hierarchy information
  const parentOptions = useMemo(() => {
    const options: ParentOption[] = [];
    const processedIds = new Set<string>();

    // Helper function to check if an object type can be a parent
    const canBeParent = (objectType: ObjectType): { can: boolean; reason?: string } => {
      // Can't select self as parent
      if (objectType.id === currentObjectTypeId) {
        return { can: false, reason: 'Cannot select self as parent' };
      }

      // Check for circular dependencies
      const wouldCreateCircle = (potentialParentId: string, visited = new Set<string>()): boolean => {
        if (visited.has(potentialParentId)) return true;
        if (potentialParentId === currentObjectTypeId) return true;
        
        visited.add(potentialParentId);
        
        const potentialParent = allObjectTypes.find(ot => ot.id === potentialParentId);
        if (potentialParent?.uiHints?.parentObjectTypeId) {
          return wouldCreateCircle(potentialParent.uiHints.parentObjectTypeId, visited);
        }
        
        return false;
      };

      if (wouldCreateCircle(objectType.id)) {
        return { can: false, reason: 'Would create circular dependency' };
      }

      // Inactive object types should be flagged
      if (!objectType.isActive) {
        return { can: true, reason: 'Object type is inactive' };
      }

      return { can: true };
    };

    // Build hierarchical structure and determine levels
    const buildHierarchy = (objectType: ObjectType, level = 0, path: string[] = []): ParentOption => {
      if (processedIds.has(objectType.id)) {
        // Return a simplified option to prevent infinite recursion
        const parentCheck = canBeParent(objectType);
        return {
          id: objectType.id,
          name: objectType.name,
          isActive: objectType.isActive,
          level: level,
          path: [...path],
          canBeParent: parentCheck.can,
          reason: parentCheck.reason,
        };
      }

      processedIds.add(objectType.id);

      const parentCheck = canBeParent(objectType);
      const option: ParentOption = {
        id: objectType.id,
        name: objectType.name,
        isActive: objectType.isActive,
        level: level,
        path: [...path],
        canBeParent: parentCheck.can,
        reason: parentCheck.reason,
      };

      return option;
    };

    // Process all object types
    allObjectTypes.forEach(objectType => {
      const option = buildHierarchy(objectType);
      options.push(option);
    });

    // Sort by name
    options.sort((a, b) => a.name.localeCompare(b.name));

    return options;
  }, [allObjectTypes, currentObjectTypeId]);

  // Filter options based on search and settings
  const filteredOptions = useMemo(() => {
    let filtered = parentOptions;

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(option =>
        option.name.toLowerCase().includes(search)
      );
    }

    // Filter by active status
    if (!showInactive) {
      filtered = filtered.filter(option => option.isActive);
    }

    return filtered;
  }, [parentOptions, searchTerm, showInactive]);

  const selectedOption = parentOptions.find(option => option.id === selectedParentId);

  const handleSelectionChange = (parentId: string | null) => {
    onParentChange(parentId);
  };

  const renderOptionIcon = (option: ParentOption) => {
    if (!option.canBeParent) {
      return '🚫';
    }
    if (!option.isActive) {
      return '⏸️';
    }
    if (option.id === selectedParentId) {
      return '✅';
    }
    return '📦';
  };

  const renderOptionDescription = (option: ParentOption) => {
    const parts = [];
    
    if (option.path.length > 0) {
      parts.push(`Path: ${option.path.join(' → ')}`);
    }
    
    if (option.reason) {
      parts.push(option.reason);
    }
    
    if (parts.length === 0 && option.canBeParent) {
      parts.push('Available as parent');
    }
    
    return parts.join(' • ');
  };

  return (
    <div className="space-y-4">
      {/* Current Selection Display */}
      {selectedParentId && selectedOption && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-lg mr-2">✅</span>
              <div>
                <div className="font-medium text-green-900">
                  Selected Parent: {selectedOption.name}
                </div>
                <div className="text-sm text-green-700">
                  {renderOptionDescription(selectedOption)}
                </div>
              </div>
            </div>
            <button
              onClick={() => handleSelectionChange(null)}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search object types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="show-inactive"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="show-inactive" className="text-sm text-gray-700">
            Show inactive types
          </label>
        </div>
      </div>

      {/* Available Options */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredOptions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🔍</div>
            <p>No object types found matching your criteria</p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-blue-600 hover:text-blue-800 text-sm mt-2"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          filteredOptions.map(option => (
            <div
              key={option.id}
              className={`border rounded-lg p-3 transition-colors cursor-pointer ${
                !option.canBeParent
                  ? 'border-red-200 bg-red-50 cursor-not-allowed'
                  : !option.isActive
                  ? 'border-gray-200 bg-gray-50'
                  : option.id === selectedParentId
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-warm-gold hover:bg-warm-gold hover:bg-opacity-10'
              }`}
              onClick={() => option.canBeParent && handleSelectionChange(
                option.id === selectedParentId ? null : option.id
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <span className="text-xl mt-0.5">
                    {renderOptionIcon(option)}
                  </span>
                  
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h4 className={`font-medium ${
                        !option.canBeParent
                          ? 'text-red-700'
                          : !option.isActive
                          ? 'text-gray-600'
                          : 'text-charcoal'
                      }`}>
                        {option.name}
                      </h4>
                      {option.id === selectedParentId && (
                        <span className="ml-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                          Selected
                        </span>
                      )}
                    </div>
                    
                    <p className={`text-sm mt-1 ${
                      !option.canBeParent
                        ? 'text-red-600'
                        : !option.isActive
                        ? 'text-gray-500'
                        : 'text-gray-600'
                    }`}>
                      {renderOptionDescription(option)}
                    </p>
                  </div>
                </div>
                
                {option.canBeParent && (
                  <div className="flex items-center text-sm text-gray-400">
                    {option.id === selectedParentId ? (
                      <span className="text-green-600">Selected</span>
                    ) : (
                      <span>Click to select</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* No Parent Option */}
      <div className="border-t border-gray-200 pt-4">
        <div
          className={`border rounded-lg p-3 transition-colors cursor-pointer ${
            selectedParentId === null
              ? 'border-blue-300 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
          }`}
          onClick={() => handleSelectionChange(null)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-xl">🏠</span>
              <div>
                <h4 className="font-medium text-charcoal">No Parent (Root Level)</h4>
                <p className="text-sm text-gray-600">
                  This will be a top-level object type with no parent relationship
                </p>
              </div>
            </div>
            {selectedParentId === null && (
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
                Selected
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <h4 className="font-medium text-blue-900 text-sm mb-2">💡 Parent Selection Tips</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• <strong>Logical hierarchy:</strong> Choose parents that logically contain this object type</li>
          <li>• <strong>Workflow order:</strong> Parents are typically completed before children</li>
          <li>• <strong>Data inheritance:</strong> Child objects can reference parent object data</li>
          <li>• <strong>No circular dependencies:</strong> An object type cannot be its own ancestor</li>
        </ul>
      </div>

      {/* Statistics */}
      <div className="flex justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
        <span>
          {filteredOptions.filter(o => o.canBeParent && o.isActive).length} available parents
        </span>
        <span>
          {filteredOptions.filter(o => !o.canBeParent).length} unavailable
        </span>
      </div>
    </div>
  );
};

export default ParentSelector;