import React, { useState } from 'react';
import { ObjectFieldDefinition } from '../../../types/concierge';

interface RatingInputProps {
  field: ObjectFieldDefinition;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
}

const RatingInput: React.FC<RatingInputProps> = ({
  field,
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  
  const maxRating = field.config?.maxRating || 5;
  const ratingType = field.config?.ratingType || 'stars';
  const currentValue = value || 0;

  const handleStarClick = (rating: number) => {
    onChange(rating);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseInt(e.target.value));
  };

  const handleThumbsClick = (isPositive: boolean) => {
    onChange(isPositive ? 1 : -1);
  };

  const getRatingLabel = (rating: number): string => {
    if (ratingType === 'thumbs') {
      return rating > 0 ? 'Positive' : rating < 0 ? 'Negative' : 'Not rated';
    }

    const labels: Record<number, string> = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent',
    };

    if (maxRating === 10) {
      const extendedLabels: Record<number, string> = {
        1: 'Terrible', 2: 'Poor', 3: 'Below Average', 4: 'Fair', 5: 'Average',
        6: 'Above Average', 7: 'Good', 8: 'Very Good', 9: 'Excellent', 10: 'Outstanding'
      };
      return extendedLabels[rating] || 'Not rated';
    }

    return labels[rating] || 'Not rated';
  };

  const renderStarRating = () => (
    <div className="flex items-center space-x-1">
      {Array.from({ length: maxRating }, (_, index) => {
        const starValue = index + 1;
        const isActive = (hoveredValue || currentValue) >= starValue;
        
        return (
          <button
            key={starValue}
            type="button"
            onClick={() => !disabled && handleStarClick(starValue)}
            onMouseEnter={() => !disabled && setHoveredValue(starValue)}
            onMouseLeave={() => !disabled && setHoveredValue(null)}
            className={`text-2xl transition-colors ${
              disabled 
                ? 'cursor-not-allowed opacity-50' 
                : 'cursor-pointer hover:scale-110 transform'
            }`}
            disabled={disabled}
            title={`${starValue} star${starValue !== 1 ? 's' : ''}`}
          >
            <span className={isActive ? 'text-yellow-400' : 'text-gray-300'}>
              ⭐
            </span>
          </button>
        );
      })}
      
      {(currentValue > 0 || hoveredValue) && (
        <div className="ml-3 text-sm">
          <span className="font-medium text-gray-700">
            {hoveredValue || currentValue}/{maxRating}
          </span>
          <span className="text-gray-500 ml-2">
            {getRatingLabel(hoveredValue || currentValue)}
          </span>
        </div>
      )}
    </div>
  );

  const renderSliderRating = () => (
    <div className="space-y-2">
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-500 w-6">0</span>
        <div className="flex-1 relative">
          <input
            type="range"
            min="0"
            max={maxRating}
            step="1"
            value={currentValue}
            onChange={handleSliderChange}
            disabled={disabled}
            className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentValue / maxRating) * 100}%, #e5e7eb ${(currentValue / maxRating) * 100}%, #e5e7eb 100%)`
            }}
          />
          {/* Custom thumb styling would go in CSS */}
        </div>
        <span className="text-sm text-gray-500 w-6">{maxRating}</span>
      </div>
      
      {currentValue > 0 && (
        <div className="text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
            <span className="font-medium mr-2">{currentValue}/{maxRating}</span>
            <span>{getRatingLabel(currentValue)}</span>
          </div>
        </div>
      )}
    </div>
  );

  const renderThumbsRating = () => (
    <div className="flex items-center justify-center space-x-4">
      <button
        type="button"
        onClick={() => !disabled && handleThumbsClick(false)}
        className={`p-3 rounded-full transition-all ${
          currentValue === -1 
            ? 'bg-red-100 text-red-600 ring-2 ring-red-300' 
            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
        } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110 transform'}`}
        disabled={disabled}
        title="Thumbs Down"
      >
        <span className="text-2xl">👎</span>
      </button>
      
      <div className="text-sm text-gray-500 min-w-20 text-center">
        {getRatingLabel(currentValue)}
      </div>
      
      <button
        type="button"
        onClick={() => !disabled && handleThumbsClick(true)}
        className={`p-3 rounded-full transition-all ${
          currentValue === 1 
            ? 'bg-green-100 text-green-600 ring-2 ring-green-300' 
            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
        } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110 transform'}`}
        disabled={disabled}
        title="Thumbs Up"
      >
        <span className="text-2xl">👍</span>
      </button>
    </div>
  );

  const renderNumericRating = () => (
    <div className="flex items-center space-x-2">
      <div className="grid grid-cols-5 gap-1">
        {Array.from({ length: Math.min(maxRating, 10) }, (_, index) => {
          const numValue = index + 1;
          const isSelected = currentValue === numValue;
          
          return (
            <button
              key={numValue}
              type="button"
              onClick={() => !disabled && onChange(numValue)}
              className={`w-8 h-8 rounded text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-105 transform'}`}
              disabled={disabled}
              title={`Rating: ${numValue}`}
            >
              {numValue}
            </button>
          );
        })}
      </div>
      
      {currentValue > 0 && (
        <div className="ml-4 text-sm">
          <span className="font-medium text-gray-700">
            {currentValue}/{maxRating}
          </span>
          <span className="text-gray-500 block">
            {getRatingLabel(currentValue)}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <label className="form-label flex items-center">
        ⭐ {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="p-4 border border-gray-200 rounded-lg bg-white">
        {ratingType === 'stars' && renderStarRating()}
        {ratingType === 'slider' && renderSliderRating()}
        {ratingType === 'thumbs' && renderThumbsRating()}
        {ratingType === 'numeric' && renderNumericRating()}
      </div>

      {/* Clear Rating Button */}
      {!disabled && currentValue > 0 && ratingType !== 'thumbs' && (
        <button
          type="button"
          onClick={() => onChange(0)}
          className="mt-2 text-xs text-gray-500 hover:text-gray-700"
        >
          Clear rating
        </button>
      )}

      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}

      <p className="text-xs text-gray-500 mt-1">
        {ratingType === 'stars' && `Rate from 1 to ${maxRating} stars`}
        {ratingType === 'slider' && `Use the slider to select a rating from 0 to ${maxRating}`}
        {ratingType === 'thumbs' && 'Give a thumbs up or thumbs down'}
        {ratingType === 'numeric' && `Select a number from 1 to ${maxRating}`}
      </p>
    </div>
  );
};

export default RatingInput;