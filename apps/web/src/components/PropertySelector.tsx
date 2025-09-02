import React, { useState, useEffect, useCallback } from 'react';
import { useTenant, usePropertySelector } from '../contexts/TenantContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { propertyService } from '../services/propertyService';

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
  const { user: _user } = useAuth();
  const { hasPermission } = usePermissions();
  const isPlatformAdmin = hasPermission('property', 'manage', 'platform') || hasPermission('organization', 'manage', 'platform');
  const { organizationId, setAdminOverride } = useTenant();
  const [adminProperties, setAdminProperties] = useState<any[]>([]);
  const [loadingAdminProps, setLoadingAdminProps] = useState(false);
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

  // Load properties for Platform Admin by current organization
  useEffect(() => {
    let mounted = true;
    async function loadAdminProps() {
      if (!(hasPermission('property', 'manage', 'platform') || hasPermission('organization', 'manage', 'platform')) || !organizationId) { if (mounted) setAdminProperties([]); return; }
      try {
        setLoadingAdminProps(true);
        const resp = await propertyService.getProperties({ organizationId, isActive: true, limit: 200 });
        const data = Array.isArray((resp as any)?.data) ? (resp as any).data : [];
        if (mounted) setAdminProperties(data);
      } catch {
        if (mounted) setAdminProperties([]);
      } finally {
        if (mounted) setLoadingAdminProps(false);
      }
    }
    loadAdminProps();
    return () => { mounted = false; };
  }, [isPlatformAdmin, organizationId]);

  // Normalize and filter properties based on search with defensive guards
  const displayProperties = (isPlatformAdmin && adminProperties.length > 0 ? adminProperties : availableProperties) || [];
  const safeProperties = displayProperties.filter((property: any) => property && typeof property === 'object');
  const filteredProperties = safeProperties.filter((property: any) => {
    if (searchTerm === '') return true;
    const q = searchTerm.toLowerCase();
    const name = (property?.name || '').toString().toLowerCase();
    const code = (property?.code || '').toString().toLowerCase();
    return name.includes(q) || code.includes(q);
  });

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
      if (hasPermission('property', 'manage', 'platform') || hasPermission('organization', 'manage', 'platform')) {
        setAdminOverride(undefined, propertyId, 'platform-admin');
        window.location.reload();
        return;
      }
      await selectProperty(propertyId);
      setIsOpen(false);
      setSearchTerm('');
      clearError();
      onPropertyChange?.(propertyId);
      const property = displayProperties.find((p: any) => p.id === propertyId);
      if (property) console.log(`Switched to property: ${property.name}`);
    } catch (err) {
      console.error('Property switch failed:', err);
    }
  };

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Don't render if user only has access to one property
  if (!isMultiProperty && !(hasPermission('property', 'manage', 'platform') || hasPermission('organization', 'manage', 'platform'))) {
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
          className={`flex items-center space-x-1 ${currentSize.button} text-left rounded-md border border-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--brand-primary)';
            e.currentTarget.style.backgroundColor = 'var(--brand-surface-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#d1d5db';
            e.currentTarget.style.backgroundColor = '';
          }}
          title={`${getCurrentOrganizationName()} - ${getCurrentPropertyName()}`}
        >
          <div className={`${currentSize.avatar} text-white rounded-full flex items-center justify-center font-medium`} style={{ backgroundColor: 'var(--brand-primary)' }}>
            {getCurrentPropertyName()?.[0]?.toUpperCase() || 'P'}
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
                className={`w-full p-2 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${currentPropertyId === property.id ? 'border-l-2' : ''}`}
                style={{
                  backgroundColor: currentPropertyId === property.id ? 'var(--brand-primary-50)' : 'transparent',
                  borderLeftColor: currentPropertyId === property.id ? 'var(--brand-primary)' : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = 'var(--brand-surface-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = currentPropertyId === property.id ? 'var(--brand-primary-50)' : 'transparent';
                  }
                }}
              >
                <div className="text-xs font-medium truncate" style={{ color: 'var(--brand-text-primary)' }}>{property?.name || 'Unnamed Property'}</div>
                <div className="text-xs text-gray-500 truncate">{property?.code || '-'}</div>
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
          className={`flex items-center space-x-2 px-3 py-2 text-left rounded-lg border border-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.borderColor = 'var(--brand-primary)';
              e.currentTarget.style.backgroundColor = 'var(--brand-surface-hover)';
            }
          }}
          onMouseLeave={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.backgroundColor = '';
            }
          }}
        >
          <div className="flex-1 min-w-0">
            {showOrganization && (
              <div className="text-xs text-gray-500 truncate">
                {getCurrentOrganizationName()}
              </div>
            )}
            <div className="text-sm font-medium truncate" style={{ color: 'var(--brand-text-primary)' }}>
              {getCurrentPropertyName()}
            </div>
          </div>
          <div className="text-gray-400">
            {(isLoading || loadingAdminProps) && (
              <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--brand-primary)', borderTopColor: 'transparent' }} />
            )}
          </div>
        </button>

        {/* Modal */}
        {isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--brand-text-primary)' }}>
                  {t('propertySelector.selectProperty')}
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 transition-colors"
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--brand-text-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--brand-primary)';
                    e.currentTarget.style.boxShadow = `0 0 0 2px rgba(170, 142, 103, 0.2)`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.boxShadow = '';
                  }}
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
                      className={`w-full p-4 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        currentPropertyId === property.id ? 'border-l-4' : ''
                      } ${index === 0 ? 'rounded-t-lg' : ''} ${index === filteredProperties.length - 1 ? 'rounded-b-lg' : ''}`}
                      style={{
                        backgroundColor: currentPropertyId === property.id ? 'var(--brand-primary-50)' : 'transparent',
                        borderLeftColor: currentPropertyId === property.id ? 'var(--brand-primary)' : 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        if (!e.currentTarget.disabled) {
                          e.currentTarget.style.backgroundColor = 'var(--brand-surface-hover)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!e.currentTarget.disabled) {
                          e.currentTarget.style.backgroundColor = currentPropertyId === property.id ? 'var(--brand-primary-50)' : 'transparent';
                        }
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 text-white rounded-full flex items-center justify-center text-sm font-medium" style={{ backgroundColor: 'var(--brand-primary)' }}>
                          {property?.name?.[0]?.toUpperCase() || 'P'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate" style={{ color: 'var(--brand-text-primary)' }}>{property?.name || 'Unnamed Property'}</div>
                          <div className="text-sm text-gray-500 truncate">{property?.code || '-'}</div>
                          {property.address && (
                            <div className="text-xs text-gray-400 mt-1 truncate">{formatAddress(property.address)}</div>
                          )}
                        </div>
                        {currentPropertyId === property.id && (
                          <div style={{ color: 'var(--brand-primary)' }}>
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
        className="flex items-center justify-between w-full px-3 py-2 text-left rounded-lg border border-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--brand-primary)';
          e.currentTarget.style.backgroundColor = 'var(--brand-surface-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#d1d5db';
          e.currentTarget.style.backgroundColor = '';
        }}
      >
        <div className="flex-1 min-w-0">
          {showOrganization && (
            <div className="text-xs text-gray-500 truncate">
              {getCurrentOrganizationName()}
            </div>
          )}
          <div className="text-sm font-medium truncate" style={{ color: 'var(--brand-text-primary)' }}>
            {getCurrentPropertyName()}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {(isLoading || loadingAdminProps) && (
            <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--brand-primary)', borderTopColor: 'transparent' }} />
          )}
          <span className={`text-sm transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {/* Search for dropdown variant */}
          {displayProperties.length > 3 && (
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                placeholder={`Search ${displayProperties.length} properties...`}
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--brand-primary)';
                  e.currentTarget.style.boxShadow = `0 0 0 1px var(--brand-primary)`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.boxShadow = '';
                }}
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
                className={`w-full p-3 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  currentPropertyId === property.id ? 'border-l-4' : ''
                } ${index === 0 ? 'first:rounded-t-lg' : ''} ${index === filteredProperties.length - 1 ? 'last:rounded-b-lg' : ''}`}
                style={{
                  backgroundColor: currentPropertyId === property.id ? 'var(--brand-primary-50)' : 'transparent',
                  borderLeftColor: currentPropertyId === property.id ? 'var(--brand-primary)' : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = 'var(--brand-surface-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = currentPropertyId === property.id ? 'var(--brand-primary-50)' : 'transparent';
                  }
                }}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 text-white rounded-full flex items-center justify-center text-xs font-medium" style={{ backgroundColor: 'var(--brand-primary)' }}>
                    {property?.name?.[0]?.toUpperCase() || 'P'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate" style={{ color: 'var(--brand-text-primary)' }}>{property?.name || 'Unnamed Property'}</div>
                    <div className="text-sm text-gray-500 truncate">{property?.code || '-'}</div>
                    {property.address && (
                      <div className="text-xs text-gray-400 mt-1 truncate">{formatAddress(property.address)}</div>
                    )}
                  </div>
                  {currentPropertyId === property.id && (
                    <div style={{ color: 'var(--brand-primary)' }}>
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
      {(isLoading || loadingAdminProps) && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--brand-primary)', borderTopColor: 'transparent' }}></div>
            <span className="text-sm text-gray-600">{t('propertySelector.loading')}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertySelector;