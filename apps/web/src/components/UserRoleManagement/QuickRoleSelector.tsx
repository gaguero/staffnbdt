import React, { useState, useRef, useEffect } from 'react';
import { UserRole } from '../../hooks/useUserRoleManagement';
import RoleBadge from '../RoleBadge';

interface Role {
  id: string;
  name: string;
  description?: string;
  level?: number;
  isSystem: boolean;
}

interface QuickRoleSelectorProps {
  availableRoles: Role[];
  currentRoles: UserRole[];
  onRoleSelect: (roleId: string) => void;
  canAssignRole: (roleId: string) => boolean;
  placeholder?: string;
  size?: 'sm' | 'md';
  maxHeight?: string;
  className?: string;
}

const QuickRoleSelector: React.FC<QuickRoleSelectorProps> = ({
  availableRoles,
  currentRoles,
  onRoleSelect,
  canAssignRole,
  placeholder = "Add role...",
  size = 'md',
  maxHeight = '200px',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter roles that can be assigned and aren't already assigned
  const assignableRoles = React.useMemo(() => {
    const currentRoleIds = currentRoles.map(ur => ur.roleId);
    
    return availableRoles.filter(role => {
      // Not already assigned
      if (currentRoleIds.includes(role.id)) return false;
      
      // User has permission to assign
      if (!canAssignRole(role.id)) return false;
      
      // Matches search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return role.name.toLowerCase().includes(searchLower) ||
               (role.description?.toLowerCase().includes(searchLower));
      }
      
      return true;
    });
  }, [availableRoles, currentRoles, canAssignRole, searchTerm]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < assignableRoles.length - 1 ? prev + 1 : prev
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
        
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < assignableRoles.length) {
          handleRoleSelect(assignableRoles[focusedIndex].id);
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
        break;
    }
  };

  const handleRoleSelect = (roleId: string) => {
    onRoleSelect(roleId);
    setIsOpen(false);
    setSearchTerm('');
    setFocusedIndex(-1);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setFocusedIndex(-1);
    if (!isOpen) setIsOpen(true);
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          input: 'px-2 py-1 text-sm',
          button: 'px-2 py-1 text-sm',
          dropdown: 'text-sm'
        };
      case 'md':
      default:
        return {
          input: 'px-3 py-2 text-sm',
          button: 'px-3 py-2 text-sm',
          dropdown: 'text-sm'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  if (assignableRoles.length === 0) {
    return (
      <div className={`text-gray-400 ${sizeClasses.input} ${className}`}>
        No roles available
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`
            ${sizeClasses.input}
            bg-white border border-gray-300 rounded-md
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            hover:border-gray-400 transition-colors
            pr-8
          `}
          autoComplete="off"
        />
        
        {/* Dropdown Arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg 
            className={`w-4 h-4 text-gray-400 transform transition-transform ${
              isOpen ? 'rotate-180' : 'rotate-0'
            }`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className={`
            absolute top-full left-0 right-0 mt-1 z-50
            bg-white border border-gray-200 rounded-md shadow-lg
            ${sizeClasses.dropdown}
          `}
          style={{ maxHeight }}
        >
          <div className="overflow-y-auto">
            {assignableRoles.length > 0 ? (
              <div className="py-1">
                {assignableRoles.map((role, index) => (
                  <button
                    key={role.id}
                    onClick={() => handleRoleSelect(role.id)}
                    className={`
                      w-full text-left px-3 py-2 transition-colors
                      hover:bg-blue-50 focus:bg-blue-50 focus:outline-none
                      ${index === focusedIndex ? 'bg-blue-50' : 'bg-white'}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <RoleBadge 
                          role={role.name} 
                          size="sm"
                          showTooltip={false}
                        />
                        <span className="font-medium text-gray-900">{role.name}</span>
                      </div>
                      
                      {role.isSystem && (
                        <span className="text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                          System
                        </span>
                      )}
                    </div>
                    
                    {role.description && (
                      <p className="text-xs text-gray-600 mt-1 truncate">
                        {role.description}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-3 py-4 text-center text-gray-500">
                {searchTerm ? (
                  <span>No roles found matching "{searchTerm}"</span>
                ) : (
                  <span>No roles available for assignment</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickRoleSelector;