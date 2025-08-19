import React, { useState } from 'react';
import { useTenant, usePropertySelector } from '../contexts/TenantContext';
import { useLanguage } from '../contexts/LanguageContext';

interface PropertySelectorProps {
  variant?: 'dropdown' | 'modal';
  showOrganization?: boolean;
  className?: string;
}

const PropertySelector: React.FC<PropertySelectorProps> = ({
  variant = 'dropdown',
  showOrganization = true,
  className = '',
}) => {
  const { isMultiProperty, getCurrentPropertyName, getCurrentOrganizationName } = useTenant();
  const { availableProperties, currentPropertyId, selectProperty, isLoading, error, clearError } = usePropertySelector();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  // Don't render if user only has access to one property
  if (!isMultiProperty) {
    return showOrganization ? (
      <div className={`text-sm text-gray-600 ${className}`}>
        <div className="font-medium">{getCurrentOrganizationName()}</div>
        <div className="text-xs">{getCurrentPropertyName()}</div>
      </div>
    ) : null;
  }

  const handlePropertySelect = async (propertyId: string) => {
    try {
      await selectProperty(propertyId);
      setIsOpen(false);
      clearError();
    } catch (err) {
      // Error is handled by the hook
    }
  };

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

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border-b border-red-100">
                  <div className="text-red-800 text-sm">{error}</div>
                </div>
              )}

              {/* Property List */}
              <div className="max-h-60 overflow-y-auto">
                {availableProperties.map((property) => (
                  <button
                    key={property.id}
                    onClick={() => handlePropertySelect(property.id)}
                    disabled={isLoading}
                    className={`w-full p-4 text-left hover:bg-sand transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      currentPropertyId === property.id ? 'bg-warm-gold bg-opacity-10 border-l-4 border-warm-gold' : ''
                    }`}
                  >
                    <div className="font-medium text-charcoal">{property.name}</div>
                    <div className="text-sm text-gray-500">{property.code}</div>
                    {property.address && (
                      <div className="text-xs text-gray-400 mt-1">{property.address}</div>
                    )}
                  </button>
                ))}
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
          {error && (
            <div className="p-3 bg-red-50 border-b border-red-100">
              <div className="text-red-800 text-sm">{error}</div>
            </div>
          )}
          
          {availableProperties.map((property) => (
            <button
              key={property.id}
              onClick={() => handlePropertySelect(property.id)}
              disabled={isLoading}
              className={`w-full p-3 text-left hover:bg-sand transition-colors first:rounded-t-lg last:rounded-b-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                currentPropertyId === property.id ? 'bg-warm-gold bg-opacity-10 border-l-4 border-warm-gold' : ''
              }`}
            >
              <div className="font-medium text-charcoal">{property.name}</div>
              <div className="text-sm text-gray-500">{property.code}</div>
              {property.address && (
                <div className="text-xs text-gray-400 mt-1 truncate">{property.address}</div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default PropertySelector;