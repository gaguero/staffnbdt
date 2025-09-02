import React, { useState, useEffect } from 'react';
import { ObjectFieldDefinition } from '../../../types/concierge';
import { useQuery } from '@tanstack/react-query';
import toastService from '../../../services/toastService';

interface RelationshipFieldInputProps {
  field: ObjectFieldDefinition;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
}

interface RelationshipOption {
  id: string;
  label: string;
  subtitle?: string;
  avatar?: string;
}

const RelationshipFieldInput: React.FC<RelationshipFieldInputProps> = ({
  field,
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<RelationshipOption[]>([]);

  const relationshipType = field.config?.relationshipType || 'guest';
  const multiple = field.config?.multiple || false;

  // Mock API call - replace with actual API endpoints
  const { data: options, isLoading } = useQuery({
    queryKey: ['relationship-options', relationshipType, searchTerm],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const mockData: Record<string, RelationshipOption[]> = {
        guest: [
          { id: '1', label: 'John Smith', subtitle: 'Room 102', avatar: '🧑‍💼' },
          { id: '2', label: 'Sarah Johnson', subtitle: 'Room 205', avatar: '👩‍💼' },
          { id: '3', label: 'Mike Brown', subtitle: 'Room 314', avatar: '👨‍💼' },
        ],
        reservation: [
          { id: '1', label: 'RES-2025-001', subtitle: 'Jan 15-18, 2025', avatar: '📅' },
          { id: '2', label: 'RES-2025-002', subtitle: 'Jan 20-25, 2025', avatar: '📅' },
        ],
        unit: [
          { id: '1', label: 'Room 102', subtitle: 'Deluxe King', avatar: '🏨' },
          { id: '2', label: 'Room 205', subtitle: 'Suite Ocean View', avatar: '🏨' },
        ],
        vendor: [
          { id: '1', label: 'Fresh Flowers Co.', subtitle: 'Floral arrangements', avatar: '🌸' },
          { id: '2', label: 'Elite Catering', subtitle: 'Food & Beverage', avatar: '🍽️' },
        ],
        object: [
          { id: '1', label: 'Welcome Amenity', subtitle: 'Concierge Object', avatar: '🎁' },
          { id: '2', label: 'Transportation Request', subtitle: 'Concierge Object', avatar: '🚗' },
        ],
      };

      return mockData[relationshipType]?.filter(item =>
        item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
      ) || [];
    },
    enabled: isOpen,
  });

  useEffect(() => {
    if (value) {
      if (multiple && Array.isArray(value)) {
        // Load selected items for multiple selection
        setSelectedItems(value.map((item: any) => ({
          id: item.id || item,
          label: item.label || item.id || item,
          subtitle: item.subtitle,
          avatar: item.avatar,
        })));
      } else if (!multiple && value) {
        // Load selected item for single selection
        setSelectedItems([{
          id: value.id || value,
          label: value.label || value.id || value,
          subtitle: value.subtitle,
          avatar: value.avatar,
        }]);
      }
    }
  }, [value, multiple]);

  const handleSelect = (option: RelationshipOption) => {
    if (multiple) {
      const isAlreadySelected = selectedItems.some(item => item.id === option.id);
      if (isAlreadySelected) {
        const updated = selectedItems.filter(item => item.id !== option.id);
        setSelectedItems(updated);
        onChange(updated.map(item => ({ id: item.id, label: item.label })));
      } else {
        const updated = [...selectedItems, option];
        setSelectedItems(updated);
        onChange(updated.map(item => ({ id: item.id, label: item.label })));
      }
    } else {
      setSelectedItems([option]);
      onChange({ id: option.id, label: option.label });
      setIsOpen(false);
    }
    setSearchTerm('');
  };

  const handleRemove = (optionId: string) => {
    if (multiple) {
      const updated = selectedItems.filter(item => item.id !== optionId);
      setSelectedItems(updated);
      onChange(updated.map(item => ({ id: item.id, label: item.label })));
    } else {
      setSelectedItems([]);
      onChange(null);
    }
  };

  const handleCreateNew = () => {
    if (searchTerm.trim()) {
      const newItem: RelationshipOption = {
        id: `new_${Date.now()}`,
        label: searchTerm.trim(),
        subtitle: 'New entry',
        avatar: getRelationshipIcon(relationshipType),
      };
      handleSelect(newItem);
      toastService.success(`New ${relationshipType} created: ${searchTerm}`);
    }
  };

  const getRelationshipIcon = (type: string) => {
    const icons = {
      guest: '🧑‍💼',
      reservation: '📅',
      unit: '🏨',
      vendor: '🤝',
      object: '📋',
    };
    return icons[type as keyof typeof icons] || '🔗';
  };

  const getRelationshipLabel = (type: string) => {
    const labels = {
      guest: 'Guests',
      reservation: 'Reservations',
      unit: 'Units/Rooms',
      vendor: 'Vendors',
      object: 'Objects',
    };
    return labels[type as keyof typeof labels] || 'Items';
  };

  return (
    <div className="relative">
      <label className="form-label flex items-center">
        {getRelationshipIcon(relationshipType)} Link to {getRelationshipLabel(relationshipType)}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Selected Items Display */}
      {selectedItems.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {selectedItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
            >
              <span className="mr-1">{item.avatar}</span>
              <span className="font-medium">{item.label}</span>
              {item.subtitle && (
                <span className="text-blue-600 ml-1">({item.subtitle})</span>
              )}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                  title="Remove"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            // Delay close to allow for clicks on options
            setTimeout(() => setIsOpen(false), 200);
          }}
          placeholder={`Search ${getRelationshipLabel(relationshipType).toLowerCase()}...`}
          className={`form-input ${error ? 'border-red-500' : ''}`}
          disabled={disabled}
        />
        
        {/* Search/Clear Icon */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {searchTerm ? (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setIsOpen(false);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          ) : (
            <span className="text-gray-400">🔍</span>
          )}
        </div>
      </div>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
              Loading...
            </div>
          ) : options && options.length > 0 ? (
            <>
              {options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center border-b border-gray-100 last:border-b-0 ${
                    selectedItems.some(item => item.id === option.id)
                      ? 'bg-blue-50 text-blue-800'
                      : 'text-gray-700'
                  }`}
                >
                  <span className="text-lg mr-3">{option.avatar}</span>
                  <div className="flex-1">
                    <div className="font-medium">{option.label}</div>
                    {option.subtitle && (
                      <div className="text-sm text-gray-500">{option.subtitle}</div>
                    )}
                  </div>
                  {selectedItems.some(item => item.id === option.id) && (
                    <span className="text-blue-600">✓</span>
                  )}
                </button>
              ))}
            </>
          ) : searchTerm ? (
            <div className="p-4">
              <div className="text-gray-500 text-center mb-2">
                No {getRelationshipLabel(relationshipType).toLowerCase()} found for "{searchTerm}"
              </div>
              <button
                type="button"
                onClick={handleCreateNew}
                className="w-full bg-blue-50 text-blue-700 py-2 px-4 rounded text-sm hover:bg-blue-100"
              >
                + Create new {relationshipType}: "{searchTerm}"
              </button>
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              Start typing to search {getRelationshipLabel(relationshipType).toLowerCase()}...
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      {!disabled && (
        <div className="mt-2 flex gap-2 text-sm">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="text-blue-600 hover:text-blue-800"
          >
            🔍 Browse all
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setIsOpen(true);
            }}
            className="text-green-600 hover:text-green-800"
          >
            + Create new
          </button>
          {selectedItems.length > 0 && multiple && (
            <button
              type="button"
              onClick={() => {
                setSelectedItems([]);
                onChange([]);
              }}
              className="text-red-600 hover:text-red-800"
            >
              🗑️ Clear all
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}

      {/* Help Text */}
      <p className="text-xs text-gray-500 mt-1">
        {multiple
          ? `Select multiple ${getRelationshipLabel(relationshipType).toLowerCase()}. Click to add or remove.`
          : `Select a ${relationshipType} to link to this object.`
        }
      </p>
    </div>
  );
};

export default RelationshipFieldInput;