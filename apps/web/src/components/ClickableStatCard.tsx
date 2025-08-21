import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRightIcon } from 'lucide-react';

export interface StatCardData {
  id: string;
  title: string;
  value: number | string;
  icon?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    period?: string;
  };
  subtitle?: string;
  description?: string;
  drillDownable?: boolean;
  filterCriteria?: Record<string, any>;
}

interface ClickableStatCardProps {
  stat: StatCardData;
  onClick?: (stat: StatCardData) => void;
  onDrillDown?: (stat: StatCardData) => void;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50 hover:bg-blue-100',
    border: 'border-blue-200 hover:border-blue-300',
    text: 'text-blue-600',
    value: 'text-blue-700',
    icon: 'text-blue-500',
  },
  green: {
    bg: 'bg-green-50 hover:bg-green-100',
    border: 'border-green-200 hover:border-green-300',
    text: 'text-green-600',
    value: 'text-green-700',
    icon: 'text-green-500',
  },
  yellow: {
    bg: 'bg-yellow-50 hover:bg-yellow-100',
    border: 'border-yellow-200 hover:border-yellow-300',
    text: 'text-yellow-600',
    value: 'text-yellow-700',
    icon: 'text-yellow-500',
  },
  red: {
    bg: 'bg-red-50 hover:bg-red-100',
    border: 'border-red-200 hover:border-red-300',
    text: 'text-red-600',
    value: 'text-red-700',
    icon: 'text-red-500',
  },
  purple: {
    bg: 'bg-purple-50 hover:bg-purple-100',
    border: 'border-purple-200 hover:border-purple-300',
    text: 'text-purple-600',
    value: 'text-purple-700',
    icon: 'text-purple-500',
  },
  gray: {
    bg: 'bg-gray-50 hover:bg-gray-100',
    border: 'border-gray-200 hover:border-gray-300',
    text: 'text-gray-600',
    value: 'text-gray-700',
    icon: 'text-gray-500',
  },
};

const sizeClasses = {
  sm: {
    container: 'p-3',
    icon: 'text-lg mb-1',
    title: 'text-xs',
    value: 'text-lg',
    subtitle: 'text-xs',
    trend: 'text-xs',
  },
  md: {
    container: 'p-4',
    icon: 'text-2xl mb-2',
    title: 'text-sm',
    value: 'text-xl',
    subtitle: 'text-sm',
    trend: 'text-xs',
  },
  lg: {
    container: 'p-6',
    icon: 'text-3xl mb-3',
    title: 'text-base',
    value: 'text-2xl',
    subtitle: 'text-base',
    trend: 'text-sm',
  },
};

export const ClickableStatCard: React.FC<ClickableStatCardProps> = ({
  stat,
  onClick,
  onDrillDown,
  className = '',
  disabled = false,
  size = 'md',
}) => {
  const colors = colorClasses[stat.color || 'gray'];
  const sizes = sizeClasses[size];
  const isClickable = (onClick || onDrillDown) && !disabled;

  const handleClick = () => {
    if (disabled) return;
    
    if (onDrillDown && stat.drillDownable) {
      onDrillDown(stat);
    } else if (onClick) {
      onClick(stat);
    }
  };

  const formatValue = (value: number | string): string => {
    if (typeof value === 'number') {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
      }
      return value.toLocaleString();
    }
    return value.toString();
  };

  const getTrendIcon = (direction: 'up' | 'down' | 'neutral') => {
    switch (direction) {
      case 'up':
        return '↗️';
      case 'down':
        return '↘️';
      default:
        return '→';
    }
  };

  const getTrendColor = (direction: 'up' | 'down' | 'neutral') => {
    switch (direction) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <motion.div
      whileHover={isClickable ? { scale: 1.02, y: -2 } : undefined}
      whileTap={isClickable ? { scale: 0.98 } : undefined}
      className={`
        relative rounded-lg border transition-all duration-200
        ${colors.bg} ${colors.border}
        ${isClickable ? 'cursor-pointer shadow-sm hover:shadow-md' : 'cursor-default'}
        ${disabled ? 'opacity-50' : ''}
        ${className}
      `}
      onClick={handleClick}
    >
      <div className={`text-center ${sizes.container}`}>
        {/* Icon */}
        {stat.icon && (
          <div className={`${sizes.icon} ${colors.icon}`}>
            {stat.icon}
          </div>
        )}

        {/* Title */}
        <p className={`${sizes.title} ${colors.text} mb-1 font-medium`}>
          {stat.title}
        </p>

        {/* Value */}
        <p className={`${sizes.value} ${colors.value} font-bold`}>
          {formatValue(stat.value)}
        </p>

        {/* Subtitle */}
        {stat.subtitle && (
          <p className={`${sizes.subtitle} text-gray-500 mt-1`}>
            {stat.subtitle}
          </p>
        )}

        {/* Trend */}
        {stat.trend && (
          <div className={`${sizes.trend} mt-2 flex items-center justify-center space-x-1`}>
            <span className={getTrendColor(stat.trend.direction)}>
              {getTrendIcon(stat.trend.direction)}
            </span>
            <span className={getTrendColor(stat.trend.direction)}>
              {Math.abs(stat.trend.value)}%
            </span>
            {stat.trend.period && (
              <span className="text-gray-500">
                {stat.trend.period}
              </span>
            )}
          </div>
        )}

        {/* Drill-down indicator */}
        {isClickable && stat.drillDownable && (
          <div className="absolute top-2 right-2">
            <ChevronRightIcon className={`w-4 h-4 ${colors.text} opacity-60`} />
          </div>
        )}

        {/* Click hint */}
        {isClickable && (
          <div className="absolute inset-0 rounded-lg border-2 border-transparent hover:border-blue-300 transition-colors duration-200" />
        )}
      </div>

      {/* Tooltip on hover */}
      {stat.description && isClickable && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
          {stat.description}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </motion.div>
  );
};

interface StatsDashboardProps {
  stats: StatCardData[];
  onStatClick?: (stat: StatCardData) => void;
  onStatDrillDown?: (stat: StatCardData) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  columns?: number;
  loading?: boolean;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({
  stats,
  onStatClick,
  onStatDrillDown,
  className = '',
  size = 'md',
  columns = 5,
  loading = false,
}) => {
  const getGridCols = () => {
    switch (columns) {
      case 2:
        return 'grid-cols-1 md:grid-cols-2';
      case 3:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 4:
        return 'grid-cols-2 md:grid-cols-4';
      case 5:
        return 'grid-cols-2 md:grid-cols-5';
      case 6:
        return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6';
      default:
        return 'grid-cols-2 md:grid-cols-5';
    }
  };

  if (loading) {
    return (
      <div className={`grid ${getGridCols()} gap-4 ${className}`}>
        {Array.from({ length: columns }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-24" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid ${getGridCols()} gap-4 ${className}`}>
      {stats.map((stat) => (
        <ClickableStatCard
          key={stat.id}
          stat={stat}
          onClick={onStatClick}
          onDrillDown={onStatDrillDown}
          size={size}
        />
      ))}
    </div>
  );
};

export default ClickableStatCard;