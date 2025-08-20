import React, { useState, useEffect, useCallback } from 'react';
import { useTenant, usePropertySelector } from '../contexts/TenantContext';
import { useLanguage } from '../contexts/LanguageContext';

interface PropertySelectorProps {
  variant?: 'dropdown' | 'modal' | 'compact';
  showOrganization?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showPropertyCount?: boolean;
  onPropertyChange?: (propertyId: string) => void;
}

const PropertySelector: React.FC<PropertySelectorProps> = ({
  variant = 'dropdown',
  showOrganization = true,
  className = '',
  size = 'md',
  showPropertyCount = false,
  onPropertyChange,
}) => {
  const { isMultiProperty, getCurrentPropertyName, getCurrentOrganizationName } = useTenant();
  const { availableProperties, currentPropertyId, selectProperty, isLoading, error, clearError } = usePropertySelector();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [lastSwitchTime, setLastSwitchTime] = useState<number | null>(null);

  // Auto-retry on error with exponential backoff
  useEffect(() => {
    if (error && retryCount < 3) {
      const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        clearError();
      }, delay);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [error, retryCount, clearError]);

  // Reset retry count on successful property switch
  useEffect(() => {
    if (!error && !isLoading) {
      setRetryCount(0);
    }
  }, [error, isLoading]);

  // Filter properties based on search
  const filteredProperties = availableProperties.filter(property =>
    searchTerm === '' ||
    property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Keyboard navigation handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        break;
      case 'ArrowDown':
      case 'ArrowUp':
        // TODO: Implement keyboard navigation for property list
        e.preventDefault();
        break;
    }
  }, [isOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Helper function to format address safely
  const formatAddress = (address: string | { street?: string; city?: string; state?: string; country?: string; postalCode?: string; } | undefined): string => {
    if (!address) return '';
    
    if (typeof address === 'string') {
      return address;
    }
    
    if (typeof address === 'object') {
      const addressParts = [];
      if (address.street) addressParts.push(address.street);
      if (address.city) addressParts.push(address.city);
      if (address.state) addressParts.push(address.state);
      if (address.country) addressParts.push(address.country);
      if (address.postalCode) addressParts.push(address.postalCode);
      return addressParts.join(', ');
    }
    
    return '';
  };

  // Size-based styling
  const sizeClasses = {
    sm: {
      container: 'text-xs',
      button: 'px-2 py-1.5',
      avatar: 'w-6 h-6 text-xs',
      dropdown: 'text-xs'
    },
    md: {
      container: 'text-sm',
      button: 'px-3 py-2',
      avatar: 'w-8 h-8 text-sm',
      dropdown: 'text-sm'
    },
    lg: {
      container: 'text-base',
      button: 'px-4 py-3',
      avatar: 'w-10 h-10 text-base',
      dropdown: 'text-base'
    }
  };

  const currentSize = sizeClasses[size];

  // Clear search when closing
  const handleClose = () => {
    setIsOpen(false);
    setSearchTerm('');
  };

  const handlePropertySelect = async (propertyId: string) => {
    if (propertyId === currentPropertyId) {
      setIsOpen(false);
      return;
    }

    // Prevent rapid switching
    const now = Date.now();
    if (lastSwitchTime && (now - lastSwitchTime) < 2000) {
      return;
    }

    try {
      setLastSwitchTime(now);
      await selectProperty(propertyId);
      setIsOpen(false);
      setSearchTerm('');
      clearError();
      
      // Notify parent component
      onPropertyChange?.(propertyId);
      
      // Show success feedback
      const property = availableProperties.find(p => p.id === propertyId);
      if (property) {
        // Could add toast notification here
        console.log(`Switched to property: ${property.name}`);
      }
    } catch (err) {
      console.error('Property switch failed:', err);
      // Error is handled by the hook
    }
  };

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Don't render if user only has access to one property
  if (!isMultiProperty) {
    return showOrganization ? (
      <div className={`${currentSize.container} text-gray-600 ${className}`}>
        <div className="font-medium">{getCurrentOrganizationName()}</div>
        <div className="text-xs opacity-75">{getCurrentPropertyName()}</div>
        {showPropertyCount && (
          <div className="text-xs opacity-60">{availableProperties.length} property</div>
        )}
      </div>
    ) : null;
  }

  // Compact variant for tight spaces
  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className={`flex items-center space-x-1 ${currentSize.button} text-left rounded-md border border-gray-200 hover:border-warm-gold hover:bg-sand transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          title={`${getCurrentOrganizationName()} - ${getCurrentPropertyName()}`}
        >
          <div className={`${currentSize.avatar} bg-warm-gold text-white rounded-full flex items-center justify-center font-medium`}>
            {getCurrentPropertyName()[0]?.toUpperCase() || 'P'}
          </div>
          <span className={`text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
        </button>

        {/* Compact dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48 max-h-60 overflow-y-auto">
            {error && (
              <div className="p-2 bg-red-50 border-b border-red-100">
                <div className="text-red-800 text-xs">{error}</div>
              </div>
            )}
            
            {filteredProperties.map((property) => (
              <button
                key={property.id}
                onClick={() => handlePropertySelect(property.id)}
                disabled={isLoading}
                className={`w-full p-2 text-left hover:bg-sand transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${currentPropertyId === property.id ? 'bg-warm-gold bg-opacity-10 border-l-2 border-warm-gold' : ''}`}
              >
                <div className="text-xs font-medium text-charcoal truncate">{property.name}</div>
                <div className="text-xs text-gray-500 truncate">{property.code}</div>
              </button>
            ))}
          </div>
        )}

        {/* Click outside to close */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={handleClose}
          />
        )}
      </div>
    );
  }

  if (variant === 'modal') {
    return (
      <>
        {/* Trigger Button */}
        <button
          onClick={() => setIsOpen(true)}
          disabled={isLoading}
          className={`flex items-center space-x-2 px-3 py-2 text-left rounded-lg border border-gray-200 hover:border-warm-gold hover:bg-sand transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
          <div className="flex-1 min-w-0">
            {showOrganization && (
              <div className="text-xs text-gray-500 truncate">
                {getCurrentOrganizationName()}
              </div>
            )}
            <div className="text-sm font-medium text-charcoal truncate">
              {getCurrentPropertyName()}
            </div>
          </div>
          <div className="text-gray-400">
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-warm-gold border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="text-lg">🔄</span>
            )}
          </div>
        </button>

        {/* Modal */}
        {isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-charcoal">
                  {t('propertySelector.selectProperty')}
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-charcoal transition-colors"
                  aria-label="Close"
                >
                  <span className="text-xl">✕</span>
                </button>
              </div>

              {/* Search Input */}
              <div className="p-4 border-b border-gray-200">
                <input
                  type="text"
                  placeholder={t('common.search')}  
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-transparent"
                  autoFocus
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border-b border-red-100">
                  <div className="flex items-center justify-between">
                    <div className="text-red-800 text-sm">{error}</div>
                    {retryCount < 3 && (
                      <button
                        onClick={() => {
                          clearError();
                          setRetryCount(0);
                        }}
                        className="text-xs text-red-600 hover:text-red-800 underline"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                  {retryCount > 0 && (
                    <div className="text-xs text-red-600 mt-1">
                      Retry attempt {retryCount}/3
                    </div>
                  )}
                </div>
              )}

              {/* Property List */}
              <div className="max-h-60 overflow-y-auto">
                {filteredProperties.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <div className="text-4xl mb-2">🔍</div>
                    <p className="text-sm">
                      {searchTerm ? `No properties found for "${searchTerm}"` : 'No properties available'}
                    </p>
                  </div>
                ) : (
                  filteredProperties.map((property, index) => (
                    <button
                      key={property.id}
                      onClick={() => handlePropertySelect(property.id)}
                      disabled={isLoading}
                      className={`w-full p-4 text-left hover:bg-sand transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        currentPropertyId === property.id ? 'bg-warm-gold bg-opacity-10 border-l-4 border-warm-gold' : ''
                      } ${index === 0 ? 'rounded-t-lg' : ''} ${index === filteredProperties.length - 1 ? 'rounded-b-lg' : ''}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-warm-gold text-white rounded-full flex items-center justify-center text-sm font-medium">
                          {property.name[0]?.toUpperCase() || 'P'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-charcoal truncate">{property.name}</div>
                          <div className="text-sm text-gray-500 truncate">{property.code}</div>
                          {property.address && (
                            <div className="text-xs text-gray-400 mt-1 truncate">{formatAddress(property.address)}</div>
                          )}
                        </div>
                        {currentPropertyId === property.id && (
                          <div className="text-warm-gold">
                            <span className="text-lg">✓</span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full btn btn-outline"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Dropdown variant
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center justify-between w-full px-3 py-2 text-left rounded-lg border border-gray-200 hover:border-warm-gold hover:bg-sand transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex-1 min-w-0">
          {showOrganization && (
            <div className="text-xs text-gray-500 truncate">
              {getCurrentOrganizationName()}
            </div>
          )}
          <div className="text-sm font-medium text-charcoal truncate">
            {getCurrentPropertyName()}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isLoading && (
            <div className="w-4 h-4 border-2 border-warm-gold border-t-transparent rounded-full animate-spin" />
          )}
          <span className={`text-sm transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {/* Search for dropdown variant */}
          {availableProperties.length > 3 && (
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                placeholder={`Search ${availableProperties.length} properties...`}
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-warm-gold"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border-b border-red-100">
              <div className="flex items-center justify-between">
                <div className="text-red-800 text-sm">{error}</div>
                <button
                  onClick={() => {
                    clearError();
                    setRetryCount(0);
                  }}
                  className="text-xs text-red-600 hover:text-red-800 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
          
          {filteredProperties.length === 0 ? (
            <div className="p-3 text-center text-gray-500">
              <div className="text-2xl mb-1">🔍</div>
              <p className="text-xs">
                {searchTerm ? `No properties found for "${searchTerm}"` : 'No properties available'}
              </p>
            </div>
          ) : (
            filteredProperties.map((property, index) => (
              <button
                key={property.id}
                onClick={() => handlePropertySelect(property.id)}
                disabled={isLoading}
                className={`w-full p-3 text-left hover:bg-sand transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  currentPropertyId === property.id ? 'bg-warm-gold bg-opacity-10 border-l-4 border-warm-gold' : ''
                } ${index === 0 ? 'first:rounded-t-lg' : ''} ${index === filteredProperties.length - 1 ? 'last:rounded-b-lg' : ''}`}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-warm-gold text-white rounded-full flex items-center justify-center text-xs font-medium">
                    {property.name[0]?.toUpperCase() || 'P'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-charcoal truncate">{property.name}</div>
                    <div className="text-sm text-gray-500 truncate">{property.code}</div>
                    {property.address && (
                      <div className="text-xs text-gray-400 mt-1 truncate">{formatAddress(property.address)}</div>
                    )}
                  </div>
                  {currentPropertyId === property.id && (
                    <div className="text-warm-gold">
                      <span className="text-sm">✓</span>
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={handleClose}
        />
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-warm-gold border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-600">{t('propertySelector.loading')}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertySelector;