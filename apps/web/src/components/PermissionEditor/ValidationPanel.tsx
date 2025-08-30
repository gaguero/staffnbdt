import React, { useState, useMemo, useCallback } from 'react';
import {
  AlertTriangle as ExclamationTriangleIcon,
  Info as InformationCircleIcon,
  CheckCircle as CheckCircleIcon,
  X as XMarkIcon,
  Wrench as WrenchScrewdriverIcon,
  Lightbulb as LightBulbIcon,
  ChevronDown as ChevronDownIcon,
  ChevronRight as ChevronRightIcon,
  RotateCcw as ArrowPathIcon,
  ShieldAlert as ShieldExclamationIcon,
  Zap as BoltIcon
} from 'lucide-react';

import { 
  ValidationPanelProps, 
  ValidationError, 
  ValidationSuggestion 
} from '../../types/permissionEditor';

const ValidationPanel: React.FC<ValidationPanelProps> = ({
  errors,
  suggestions,
  onApplySuggestion,
  onDismissError,
  className = '',
  showAutoFix = true
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['errors']));
  const [dismissedErrors, setDismissedErrors] = useState<Set<string>>(new Set());
  const [isApplyingFix, setIsApplyingFix] = useState<string | null>(null);

  // Filter out dismissed errors
  const visibleErrors = useMemo(() => {
    return errors.filter(error => !dismissedErrors.has(error.code));
  }, [errors, dismissedErrors]);

  // Group errors by type and severity
  const groupedErrors = useMemo(() => {
    const groups = {
      errors: visibleErrors.filter(e => e.type === 'error'),
      warnings: visibleErrors.filter(e => e.type === 'warning'),
      info: visibleErrors.filter(e => e.type === 'info')
    };

    return groups;
  }, [visibleErrors]);

  // Get error icon and styling
  const getErrorStyling = useCallback((type: ValidationError['type']) => {
    switch (type) {
      case 'error':
        return {
          icon: ExclamationTriangleIcon,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-500'
        };
      case 'warning':
        return {
          icon: ExclamationTriangleIcon,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-500'
        };
      case 'info':
        return {
          icon: InformationCircleIcon,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-500'
        };
      default:
        return {
          icon: InformationCircleIcon,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          iconColor: 'text-gray-500'
        };
    }
  }, []);

  // Toggle section expansion
  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  }, []);

  // Handle error dismissal
  const handleDismissError = useCallback((error: ValidationError) => {
    setDismissedErrors(prev => new Set([...prev, error.code]));
    onDismissError?.(error);
  }, [onDismissError]);

  // Handle suggestion application
  const handleApplySuggestion = useCallback(async (suggestion: ValidationSuggestion) => {
    setIsApplyingFix(suggestion.message);
    try {
      await onApplySuggestion(suggestion);
      setTimeout(() => setIsApplyingFix(null), 1000);
    } catch (error) {
      console.error('Failed to apply suggestion:', error);
      setIsApplyingFix(null);
    }
  }, [onApplySuggestion]);

  // Render error item
  const renderErrorItem = useCallback((error: ValidationError, index: number) => {
    const styling = getErrorStyling(error.type);
    const IconComponent = styling.icon;

    return (
      <div
        key={`${error.code}-${index}`}
        className={`p-3 border rounded-lg ${styling.bgColor} ${styling.borderColor}`}
      >
        <div className="flex items-start space-x-3">
          <IconComponent className={`h-5 w-5 ${styling.iconColor} flex-shrink-0 mt-0.5`} />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className={`text-sm font-medium ${styling.textColor}`}>
                  {error.message}
                </p>
                
                {error.field && (
                  <p className="text-xs text-gray-600 mt-1">
                    Field: <span className="font-mono">{error.field}</span>
                  </p>
                )}
                
                {error.permissionIds && error.permissionIds.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 mb-1">Affected permissions:</p>
                    <div className="flex flex-wrap gap-1">
                      {error.permissionIds.slice(0, 3).map((permId, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-2 py-0.5 text-xs bg-white bg-opacity-60 rounded"
                        >
                          {permId}
                        </span>
                      ))}
                      {error.permissionIds.length > 3 && (
                        <span className="text-xs text-gray-600">
                          +{error.permissionIds.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {error.suggestions && error.suggestions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 mb-1">Suggestions:</p>
                    <ul className="text-xs space-y-0.5">
                      {error.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="flex items-start space-x-1">
                          <span className="text-gray-400">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => handleDismissError(error)}
                className={`p-1 ${styling.iconColor} hover:bg-white hover:bg-opacity-60 rounded transition-colors duration-200`}
                title="Dismiss this error"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }, [getErrorStyling, handleDismissError]);

  // Render suggestion item
  const renderSuggestionItem = useCallback((suggestion: ValidationSuggestion, index: number) => {
    const isApplying = isApplyingFix === suggestion.message;

    return (
      <div
        key={index}
        className="p-3 bg-green-50 border border-green-200 rounded-lg"
      >
        <div className="flex items-start space-x-3">
          <LightBulbIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">
                  {suggestion.message}
                </p>
                
                {suggestion.permissionIds && suggestion.permissionIds.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-green-700 mb-1">Will affect:</p>
                    <div className="flex flex-wrap gap-1">
                      {suggestion.permissionIds.map((permId, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded"
                        >
                          {permId}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => handleApplySuggestion(suggestion)}
                disabled={isApplying}
                className="flex items-center space-x-1 px-3 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors duration-200 disabled:opacity-50"
                title="Apply this suggestion"
              >
                {isApplying ? (
                  <>
                    <ArrowPathIcon className="h-3 w-3 animate-spin" />
                    <span>Applying...</span>
                  </>
                ) : (
                  <>
                    <BoltIcon className="h-3 w-3" />
                    <span>Apply</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }, [isApplyingFix, handleApplySuggestion]);

  // Render section
  const renderSection = useCallback((
    title: string,
    items: any[],
    sectionKey: string,
    renderItem: (item: any, index: number) => React.ReactNode,
    icon: React.ComponentType<{ className?: string }>
  ) => {
    if (items.length === 0) return null;

    const isExpanded = expandedSections.has(sectionKey);
    const IconComponent = icon;

    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left transition-colors duration-200"
        >
          <div className="flex items-center space-x-3">
            <IconComponent className="h-5 w-5 text-gray-500" />
            <span className="font-medium text-gray-900">
              {title} ({items.length})
            </span>
          </div>
          
          {isExpanded ? (
            <ChevronDownIcon className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronRightIcon className="h-4 w-4 text-gray-500" />
          )}
        </button>
        
        {isExpanded && (
          <div className="p-4 space-y-3 bg-white">
            {items.map((item, index) => renderItem(item, index))}
          </div>
        )}
      </div>
    );
  }, [expandedSections, toggleSection]);

  // Show nothing if no errors or suggestions
  if (visibleErrors.length === 0 && suggestions.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white border-t border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShieldExclamationIcon className="h-5 w-5 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900">Validation Results</h3>
            
            {/* Quick Stats */}
            <div className="flex items-center space-x-3 text-sm">
              {groupedErrors.errors.length > 0 && (
                <span className="flex items-center space-x-1 text-red-600">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <span>{groupedErrors.errors.length} errors</span>
                </span>
              )}
              
              {groupedErrors.warnings.length > 0 && (
                <span className="flex items-center space-x-1 text-yellow-600">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <span>{groupedErrors.warnings.length} warnings</span>
                </span>
              )}
              
              {groupedErrors.info.length > 0 && (
                <span className="flex items-center space-x-1 text-blue-600">
                  <InformationCircleIcon className="h-4 w-4" />
                  <span>{groupedErrors.info.length} info</span>
                </span>
              )}
              
              {suggestions.length > 0 && (
                <span className="flex items-center space-x-1 text-green-600">
                  <LightBulbIcon className="h-4 w-4" />
                  <span>{suggestions.length} suggestions</span>
                </span>
              )}
            </div>
          </div>

          {/* Auto-fix button */}
          {showAutoFix && suggestions.length > 0 && (
            <button
              onClick={() => {
                suggestions.forEach(suggestion => handleApplySuggestion(suggestion));
              }}
              className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors duration-200"
            >
              <WrenchScrewdriverIcon className="h-4 w-4" />
              <span>Auto-fix All</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {/* Errors */}
        {renderSection(
          'Critical Errors',
          groupedErrors.errors,
          'errors',
          renderErrorItem,
          ExclamationTriangleIcon
        )}

        {/* Warnings */}
        {renderSection(
          'Warnings',
          groupedErrors.warnings,
          'warnings',
          renderErrorItem,
          ExclamationTriangleIcon
        )}

        {/* Suggestions */}
        {renderSection(
          'Suggestions',
          suggestions,
          'suggestions',
          renderSuggestionItem,
          LightBulbIcon
        )}

        {/* Info */}
        {renderSection(
          'Information',
          groupedErrors.info,
          'info',
          renderErrorItem,
          InformationCircleIcon
        )}

        {/* All Good State */}
        {visibleErrors.length === 0 && suggestions.length === 0 && (
          <div className="flex items-center justify-center py-8 text-green-600">
            <div className="text-center">
              <CheckCircleIcon className="h-12 w-12 mx-auto mb-3" />
              <h4 className="text-lg font-medium">All Validation Checks Passed!</h4>
              <p className="text-sm text-gray-600 mt-1">
                Your role configuration looks good and is ready to save.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer with action summary */}
      {(visibleErrors.length > 0 || suggestions.length > 0) && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>
                Total: {visibleErrors.length} issues, {suggestions.length} suggestions
              </span>
              {dismissedErrors.size > 0 && (
                <span className="text-gray-500">
                  {dismissedErrors.size} dismissed
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {groupedErrors.errors.length === 0 && (
                <span className="flex items-center space-x-1 text-green-600">
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>Ready to save</span>
                </span>
              )}
              
              {groupedErrors.errors.length > 0 && (
                <span className="flex items-center space-x-1 text-red-600">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <span>Fix errors before saving</span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationPanel;