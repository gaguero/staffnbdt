import React from 'react';
import { ObjectFieldDefinition } from '../../../types/concierge';

interface QuantityInputProps {
  field: ObjectFieldDefinition;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
}

const QuantityInput: React.FC<QuantityInputProps> = ({
  field,
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const units = field.config?.units || ['pieces', 'kg', 'meters', 'liters'];
  const currentValue = value || { amount: '', unit: field.config?.unit || units[0] };

  const handleAmountChange = (amount: string) => {
    onChange({
      ...currentValue,
      amount: amount,
    });
  };

  const handleUnitChange = (unit: string) => {
    onChange({
      ...currentValue,
      unit: unit,
    });
  };

  const incrementAmount = () => {
    const current = parseFloat(currentValue.amount) || 0;
    const step = getStepForUnit(currentValue.unit);
    handleAmountChange((current + step).toString());
  };

  const decrementAmount = () => {
    const current = parseFloat(currentValue.amount) || 0;
    const step = getStepForUnit(currentValue.unit);
    const newValue = Math.max(0, current - step);
    handleAmountChange(newValue.toString());
  };

  const getStepForUnit = (unit: string) => {
    // Define step sizes based on unit type
    const stepMap: Record<string, number> = {
      pieces: 1,
      kg: 0.1,
      grams: 1,
      pounds: 0.1,
      meters: 0.1,
      centimeters: 1,
      feet: 0.1,
      inches: 1,
      liters: 0.1,
      milliliters: 1,
      gallons: 0.1,
      hours: 0.5,
      minutes: 1,
      seconds: 1,
    };
    return stepMap[unit] || 1;
  };

  const getUnitIcon = (unit: string) => {
    const iconMap: Record<string, string> = {
      pieces: '📦',
      kg: '⚖️',
      grams: '⚖️',
      pounds: '⚖️',
      meters: '📏',
      centimeters: '📏',
      feet: '📏',
      inches: '📏',
      liters: '🥤',
      milliliters: '🥤',
      gallons: '🥤',
      hours: '⏰',
      minutes: '⏰',
      seconds: '⏰',
    };
    return iconMap[unit] || '📊';
  };

  const formatNumber = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    
    // Format based on unit type
    if (['kg', 'pounds', 'meters', 'feet', 'liters', 'gallons'].includes(currentValue.unit)) {
      return num.toFixed(1);
    }
    return num.toString();
  };

  return (
    <div>
      <label className="form-label flex items-center">
        📏 {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="flex space-x-2">
        {/* Amount Input with Increment/Decrement */}
        <div className="flex-1 relative">
          <input
            type="number"
            value={currentValue.amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="0"
            step={getStepForUnit(currentValue.unit)}
            min="0"
            className={`form-input pr-16 ${error ? 'border-red-500' : ''}`}
            disabled={disabled}
          />
          
          {/* Increment/Decrement Buttons */}
          {!disabled && (
            <div className="absolute right-1 top-1 bottom-1 flex flex-col">
              <button
                type="button"
                onClick={incrementAmount}
                className="flex-1 px-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-t"
                title="Increase"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={decrementAmount}
                className="flex-1 px-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-b"
                title="Decrease"
              >
                ▼
              </button>
            </div>
          )}
        </div>

        {/* Unit Selector */}
        <div className="w-32">
          <select
            value={currentValue.unit}
            onChange={(e) => handleUnitChange(e.target.value)}
            className={`form-input ${error ? 'border-red-500' : ''}`}
            disabled={disabled}
          >
            {units.map((unit) => (
              <option key={unit} value={unit}>
                {getUnitIcon(unit)} {unit}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Amount Buttons */}
      {!disabled && (
        <div className="mt-2 flex gap-1 flex-wrap">
          {getQuickAmounts(currentValue.unit).map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => handleAmountChange(amount.toString())}
              className={`px-3 py-1 text-xs rounded-full border ${
                currentValue.amount === amount.toString()
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              {formatNumber(amount.toString())} {currentValue.unit}
            </button>
          ))}
        </div>
      )}

      {/* Display Formatted Value */}
      {currentValue.amount && (
        <div className="mt-2 text-sm text-gray-600">
          <span className="font-medium">
            {formatNumber(currentValue.amount)} {currentValue.unit}
          </span>
          {getConversion(currentValue.amount, currentValue.unit) && (
            <span className="text-gray-500 ml-2">
              ≈ {getConversion(currentValue.amount, currentValue.unit)}
            </span>
          )}
        </div>
      )}

      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}

      <p className="text-xs text-gray-500 mt-1">
        Enter the quantity and select the appropriate unit of measurement.
      </p>
    </div>
  );
};

// Helper function to get quick amount suggestions based on unit
const getQuickAmounts = (unit: string): number[] => {
  const amountMap: Record<string, number[]> = {
    pieces: [1, 2, 5, 10, 20, 50],
    kg: [0.5, 1, 2, 5, 10],
    grams: [100, 250, 500, 1000],
    pounds: [1, 2, 5, 10, 25],
    meters: [0.5, 1, 2, 5, 10],
    centimeters: [10, 25, 50, 100],
    feet: [1, 2, 5, 10],
    inches: [6, 12, 24, 36],
    liters: [0.5, 1, 2, 5, 10],
    milliliters: [100, 250, 500, 1000],
    gallons: [1, 2, 5, 10],
    hours: [0.5, 1, 2, 4, 8],
    minutes: [15, 30, 60, 120],
    seconds: [30, 60, 120, 300],
  };
  return amountMap[unit] || [1, 2, 5, 10];
};

// Helper function to provide unit conversions
const getConversion = (amount: string, unit: string): string | null => {
  const num = parseFloat(amount);
  if (isNaN(num)) return null;

  const conversions: Record<string, (val: number) => string> = {
    kg: (val) => val >= 1 ? `${(val * 2.205).toFixed(1)} lbs` : `${(val * 1000).toFixed(0)} grams`,
    grams: (val) => val >= 1000 ? `${(val / 1000).toFixed(1)} kg` : null,
    pounds: (val) => `${(val * 0.453592).toFixed(1)} kg`,
    meters: (val) => val >= 1 ? `${(val * 3.281).toFixed(1)} feet` : `${(val * 100).toFixed(0)} cm`,
    centimeters: (val) => val >= 100 ? `${(val / 100).toFixed(1)} meters` : `${(val * 0.394).toFixed(1)} inches`,
    feet: (val) => `${(val * 0.305).toFixed(1)} meters`,
    inches: (val) => `${(val * 2.54).toFixed(1)} cm`,
    liters: (val) => `${(val * 0.264).toFixed(1)} gallons`,
    gallons: (val) => `${(val * 3.785).toFixed(1)} liters`,
    hours: (val) => val < 1 ? `${(val * 60).toFixed(0)} minutes` : null,
    minutes: (val) => val >= 60 ? `${(val / 60).toFixed(1)} hours` : null,
  };

  const converter = conversions[unit];
  return converter ? converter(num) : null;
};

export default QuantityInput;