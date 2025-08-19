import React, { useState } from 'react';
import { useTenant } from '../contexts/TenantContext';
import { useLanguage } from '../contexts/LanguageContext';
import PropertySelector from './PropertySelector';

interface TenantSwitcherProps {
  showAsModal?: boolean;
  showOrganizationInfo?: boolean;
  className?: string;
}

/**
 * Advanced tenant switcher component with organization and property context
 * Includes feedback, error handling, and responsive design
 */
const TenantSwitcher: React.FC<TenantSwitcherProps> = ({
  showAsModal = false,
  showOrganizationInfo = true,
  className = '',
}) => {
  const { 
    isMultiProperty, 
    hasOrganization, 
    getCurrentPropertyName, 
    getCurrentOrganizationName 
  } = useTenant();
  const { t } = useLanguage();
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Clear notification after delay
  React.useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [notification]);

  if (!hasOrganization) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        <span>{t('propertySelector.noProperties')}</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Notification Banner */}
      {notification && (
        <div className={`absolute top-full left-0 right-0 mt-2 p-3 rounded-lg text-sm font-medium z-50 ${
          notification.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Organization Info (if enabled) */}
      {showOrganizationInfo && (
        <div className="mb-2 p-2 bg-gray-50 rounded-md">
          <div className="text-xs text-gray-500 uppercase tracking-wide">
            {t('propertySelector.currentProperty')}
          </div>
          <div className="text-sm font-medium text-charcoal">
            {getCurrentOrganizationName()}
          </div>
        </div>
      )}

      {/* Property Selector */}
      <PropertySelector
        variant={showAsModal ? 'modal' : 'dropdown'}
        showOrganization={!showOrganizationInfo}
      />

      {/* Tenant Context Display */}
      {!isMultiProperty && (
        <div className="mt-2 text-xs text-gray-500">
          <span className="inline-flex items-center">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
            {getCurrentPropertyName()}
          </span>
        </div>
      )}
    </div>
  );
};

export default TenantSwitcher;