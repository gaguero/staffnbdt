import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { DashboardFilters } from '../../../types/roleStats';

interface TimeRangeFilterProps {
  value: DashboardFilters['timeRange'];
  onChange: (timeRange: DashboardFilters['timeRange']) => void;
}

const TimeRangeFilter: React.FC<TimeRangeFilterProps> = ({
  value,
  onChange
}) => {
  const [isCustom, setIsCustom] = useState(value.preset === 'custom');

  const presets = [
    { key: 'today', label: 'Today', days: 1 },
    { key: 'week', label: 'Last 7 days', days: 7 },
    { key: 'month', label: 'Last 30 days', days: 30 },
    { key: 'quarter', label: 'Last 3 months', days: 90 },
    { key: 'year', label: 'Last year', days: 365 },
    { key: 'custom', label: 'Custom range', days: 0 }
  ];

  const handlePresetChange = (preset: string) => {
    if (preset === 'custom') {
      setIsCustom(true);
      onChange({
        ...value,
        preset: 'custom'
      });
    } else {
      setIsCustom(false);
      const selectedPreset = presets.find(p => p.key === preset);
      if (selectedPreset) {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - selectedPreset.days);
        
        onChange({
          start,
          end,
          preset: preset as any
        });
      }
    }
  };

  const handleCustomDateChange = (field: 'start' | 'end', dateString: string) => {
    const date = new Date(dateString);
    onChange({
      ...value,
      [field]: date,
      preset: 'custom'
    });
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Preset Selector */}
      <div className="flex-shrink-0">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Time Range
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={value.preset || 'month'}
            onChange={(e) => handlePresetChange(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[150px]"
          >
            {presets.map(preset => (
              <option key={preset.key} value={preset.key}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Custom Date Inputs */}
      {isCustom && (
        <div className="flex gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={formatDate(value.start)}
              onChange={(e) => handleCustomDateChange('start', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={formatDate(value.end)}
              onChange={(e) => handleCustomDateChange('end', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeRangeFilter;