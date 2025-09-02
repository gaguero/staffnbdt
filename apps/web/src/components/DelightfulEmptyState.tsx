import React from 'react';
import { getEmptyState, getHospitalityEmoji } from '../utils/whimsyHelpers';

interface DelightfulEmptyStateProps {
  type?: 'noTasks' | 'noVendors' | 'noEvents' | 'noResults' | 'allComplete';
  title?: string;
  subtitle?: string;
  icon?: string;
  actionText?: string;
  onAction?: () => void;
  showAction?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const DelightfulEmptyState: React.FC<DelightfulEmptyStateProps> = ({
  type = 'noTasks',
  title,
  subtitle,
  icon,
  actionText,
  onAction,
  showAction = true,
  className = '',
  size = 'md'
}) => {
  const emptyConfig = getEmptyState(type);
  const hospitalityEmoji = getHospitalityEmoji();

  const displayTitle = title || emptyConfig.title;
  const displaySubtitle = subtitle || emptyConfig.subtitle;
  const displayIcon = icon || emptyConfig.icon;
  const displayActionText = actionText || emptyConfig.action;

  const sizeClasses = {
    sm: {
      container: 'py-8',
      icon: 'text-4xl mb-3',
      title: 'text-lg font-bold',
      subtitle: 'text-sm',
      padding: 'p-4',
      maxWidth: 'max-w-xs'
    },
    md: {
      container: 'py-12',
      icon: 'text-6xl mb-4',
      title: 'text-xl font-bold',
      subtitle: 'text-base',
      padding: 'p-6',
      maxWidth: 'max-w-md'
    },
    lg: {
      container: 'py-16',
      icon: 'text-8xl mb-6',
      title: 'text-2xl font-bold',
      subtitle: 'text-lg',
      padding: 'p-8',
      maxWidth: 'max-w-lg'
    }
  };

  const classes = sizeClasses[size];

  const getBackgroundGradient = () => {
    switch (type) {
      case 'allComplete':
        return 'from-green-50 via-emerald-50 to-green-50';
      case 'noResults':
        return 'from-yellow-50 via-orange-50 to-yellow-50';
      case 'noVendors':
        return 'from-purple-50 via-pink-50 to-purple-50';
      case 'noEvents':
        return 'from-indigo-50 via-blue-50 to-indigo-50';
      default:
        return 'from-blue-50 via-cyan-50 to-blue-50';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'allComplete':
        return 'text-green-800';
      case 'noResults':
        return 'text-orange-800';
      case 'noVendors':
        return 'text-purple-800';
      case 'noEvents':
        return 'text-indigo-800';
      default:
        return 'text-blue-800';
    }
  };

  const getSubtextColor = () => {
    switch (type) {
      case 'allComplete':
        return 'text-green-600';
      case 'noResults':
        return 'text-orange-600';
      case 'noVendors':
        return 'text-purple-600';
      case 'noEvents':
        return 'text-indigo-600';
      default:
        return 'text-blue-600';
    }
  };

  const getButtonStyle = () => {
    switch (type) {
      case 'allComplete':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'noResults':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      case 'noVendors':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'noEvents':
        return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200';
      default:
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    }
  };

  return (
    <div className={`text-center ${classes.container} transform transition-all duration-300 hover:scale-105 ${className}`}>
      <div className={`bg-gradient-to-br ${getBackgroundGradient()} rounded-2xl ${classes.padding} ${classes.maxWidth} mx-auto border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300`}>
        {/* Main icon with floating animation */}
        <div className={`${classes.icon} animate-float`}>
          {displayIcon}
        </div>
        
        {/* Title */}
        <h3 className={`${classes.title} ${getTextColor()} mb-3`}>
          {displayTitle}
        </h3>
        
        {/* Subtitle */}
        <p className={`${getSubtextColor()} mb-6 leading-relaxed`}>
          {displaySubtitle}
        </p>
        
        {/* Decorative elements */}
        <div className="flex justify-center space-x-2 mb-4">
          <span className="text-lg animate-bounce" style={{ animationDelay: '0ms' }}>{hospitalityEmoji}</span>
          <span className="text-lg animate-bounce" style={{ animationDelay: '200ms' }}>✨</span>
          <span className="text-lg animate-bounce" style={{ animationDelay: '400ms' }}>{hospitalityEmoji}</span>
        </div>
        
        {/* Action button */}
        {showAction && onAction && (
          <button
            onClick={onAction}
            className={`inline-flex items-center space-x-2 px-6 py-3 rounded-full font-medium transition-all duration-200 hover:scale-105 hover:shadow-md ${getButtonStyle()}`}
          >
            <span>🚀</span>
            <span>{displayActionText}</span>
          </button>
        )}
        
        {/* Subtle status indicator */}
        <div className="mt-4 flex justify-center">
          <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${getButtonStyle()}`}>
            <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
            <span>
              {type === 'allComplete' ? 'Perfect Status' :
               type === 'noResults' ? 'Ready to Search' :
               type === 'noVendors' ? 'Ready to Connect' :
               type === 'noEvents' ? 'Ready to Begin' :
               'Ready for Action'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Floating decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full animate-float opacity-40"
            style={{
              left: `${20 + (i * 15)}%`,
              top: `${30 + (i * 10)}%`,
              animationDelay: `${i * 500}ms`,
              animationDuration: `${4 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default DelightfulEmptyState;