import React from 'react';
import { ObjectFieldDefinition } from '../../../types/concierge';

interface MoneyInputProps {
  field: ObjectFieldDefinition;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
}

const MoneyInput: React.FC<MoneyInputProps> = ({
  field,
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const currencies = field.config?.currencies || ['USD', 'EUR', 'GBP', 'JPY'];
  const currentValue = value || { 
    amount: '', 
    currency: field.config?.currency || 'USD' 
  };

  const handleAmountChange = (amount: string) => {
    // Remove any non-numeric characters except decimal point
    const cleanAmount = amount.replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleanAmount.split('.');
    const formattedAmount = parts.length > 2 
      ? parts[0] + '.' + parts.slice(1).join('')
      : cleanAmount;

    onChange({
      ...currentValue,
      amount: formattedAmount,
    });
  };

  const handleCurrencyChange = (currency: string) => {
    onChange({
      ...currentValue,
      currency: currency,
    });
  };

  const formatCurrency = (amount: string, currency: string) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return '';

    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: getCurrencyDecimals(currency),
      maximumFractionDigits: getCurrencyDecimals(currency),
    });

    return formatter.format(num);
  };

  const getCurrencyDecimals = (currency: string) => {
    // Some currencies don't use decimal places
    const noDecimalCurrencies = ['JPY', 'KRW', 'VND'];
    return noDecimalCurrencies.includes(currency) ? 0 : 2;
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CAD: 'C$',
      AUD: 'A$',
      CHF: 'Fr',
      CNY: '¥',
      INR: '₹',
      BRL: 'R$',
      MXN: '$',
      KRW: '₩',
      SGD: 'S$',
      NZD: 'NZ$',
      ZAR: 'R',
      SEK: 'kr',
      NOK: 'kr',
      DKK: 'kr',
      PLN: 'zł',
      CZK: 'Kč',
      HUF: 'Ft',
      RUB: '₽',
      THB: '฿',
      VND: '₫',
    };
    return symbols[currency] || currency;
  };

  const getCurrencyFlag = (currency: string) => {
    const flags: Record<string, string> = {
      USD: '🇺🇸',
      EUR: '🇪🇺',
      GBP: '🇬🇧',
      JPY: '🇯🇵',
      CAD: '🇨🇦',
      AUD: '🇦🇺',
      CHF: '🇨🇭',
      CNY: '🇨🇳',
      INR: '🇮🇳',
      BRL: '🇧🇷',
      MXN: '🇲🇽',
      KRW: '🇰🇷',
      SGD: '🇸🇬',
      NZD: '🇳🇿',
      ZAR: '🇿🇦',
      SEK: '🇸🇪',
      NOK: '🇳🇴',
      DKK: '🇩🇰',
      PLN: '🇵🇱',
      CZK: '🇨🇿',
      HUF: '🇭🇺',
      RUB: '🇷🇺',
      THB: '🇹🇭',
      VND: '🇻🇳',
    };
    return flags[currency] || '💰';
  };

  const getQuickAmounts = (currency: string): number[] => {
    const amountsByRange: Record<string, number[]> = {
      low: [5, 10, 20, 50],      // For currencies with low values (JPY, KRW, etc.)
      medium: [10, 25, 50, 100], // For most currencies
      high: [25, 50, 100, 250],  // For expensive currencies
    };

    // Categorize currencies by typical value ranges
    const lowValueCurrencies = ['JPY', 'KRW', 'VND'];
    const highValueCurrencies = ['CHF', 'GBP', 'EUR'];
    
    if (lowValueCurrencies.includes(currency)) {
      return [100, 500, 1000, 5000];
    } else if (highValueCurrencies.includes(currency)) {
      return amountsByRange.high;
    } else {
      return amountsByRange.medium;
    }
  };

  const addQuickAmount = (amount: number) => {
    const currentAmount = parseFloat(currentValue.amount) || 0;
    const newAmount = currentAmount + amount;
    handleAmountChange(newAmount.toString());
  };

  return (
    <div>
      <label className="form-label flex items-center">
        💰 {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="flex space-x-2">
        {/* Currency Selector */}
        <div className="w-24">
          <select
            value={currentValue.currency}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            className={`form-input text-sm ${error ? 'border-red-500' : ''}`}
            disabled={disabled}
          >
            {currencies.map((currency) => (
              <option key={currency} value={currency}>
                {getCurrencyFlag(currency)} {currency}
              </option>
            ))}
          </select>
        </div>

        {/* Amount Input */}
        <div className="flex-1 relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
            {getCurrencySymbol(currentValue.currency)}
          </div>
          <input
            type="text"
            value={currentValue.amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="0.00"
            className={`form-input pl-8 ${error ? 'border-red-500' : ''}`}
            disabled={disabled}
            inputMode="decimal"
          />
        </div>
      </div>

      {/* Quick Amount Buttons */}
      {!disabled && (
        <div className="mt-2">
          <div className="flex gap-1 flex-wrap">
            {getQuickAmounts(currentValue.currency).map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => handleAmountChange(amount.toString())}
                className="px-3 py-1 text-xs rounded-full bg-gray-50 text-gray-700 border border-gray-300 hover:bg-gray-100"
              >
                {getCurrencySymbol(currentValue.currency)}{amount}
              </button>
            ))}
          </div>
          
          {/* Add Amount Buttons */}
          <div className="flex gap-1 mt-1">
            <span className="text-xs text-gray-500 py-1">Add:</span>
            {[5, 10, 25, 50].map((amount) => (
              <button
                key={`add-${amount}`}
                type="button"
                onClick={() => addQuickAmount(amount)}
                className="px-2 py-1 text-xs rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                +{getCurrencySymbol(currentValue.currency)}{amount}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Formatted Display */}
      {currentValue.amount && !isNaN(parseFloat(currentValue.amount)) && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
          <div className="text-sm font-medium text-green-800">
            {formatCurrency(currentValue.amount, currentValue.currency)}
          </div>
          {currentValue.currency !== 'USD' && (
            <div className="text-xs text-green-600 mt-1">
              ≈ {formatCurrency((parseFloat(currentValue.amount) * getExchangeRate(currentValue.currency, 'USD')).toString(), 'USD')} USD
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}

      <p className="text-xs text-gray-500 mt-1">
        Enter the amount in {currentValue.currency}. Use the quick buttons for common values.
      </p>
    </div>
  );
};

// Mock exchange rate function - replace with real API
const getExchangeRate = (fromCurrency: string, toCurrency: string): number => {
  // Mock exchange rates to USD
  const mockRates: Record<string, number> = {
    USD: 1,
    EUR: 1.09,
    GBP: 1.27,
    JPY: 0.0067,
    CAD: 0.74,
    AUD: 0.66,
    CHF: 1.10,
    CNY: 0.14,
    INR: 0.012,
    BRL: 0.20,
    MXN: 0.059,
    KRW: 0.00076,
    SGD: 0.74,
    NZD: 0.62,
    ZAR: 0.053,
    SEK: 0.095,
    NOK: 0.095,
    DKK: 0.15,
    PLN: 0.25,
    CZK: 0.044,
    HUF: 0.0028,
    RUB: 0.011,
    THB: 0.028,
    VND: 0.000041,
  };

  const fromRate = mockRates[fromCurrency] || 1;
  const toRate = mockRates[toCurrency] || 1;
  
  return toRate / fromRate;
};

export default MoneyInput;