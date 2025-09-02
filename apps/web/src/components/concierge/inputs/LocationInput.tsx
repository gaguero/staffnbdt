import React, { useState, useEffect } from 'react';
import { ObjectFieldDefinition } from '../../../types/concierge';

interface LocationInputProps {
  field: ObjectFieldDefinition;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
}

interface LocationData {
  address?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  placeId?: string;
}

const LocationInput: React.FC<LocationInputProps> = ({
  field,
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputMode, setInputMode] = useState<'search' | 'manual' | 'coordinates'>('search');

  const currentValue: LocationData = value || {};

  useEffect(() => {
    if (currentValue.address) {
      setSearchQuery(currentValue.address);
    }
  }, [currentValue.address]);

  const searchLocations = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    
    // Mock location search - replace with real geocoding API (Google Maps, Mapbox, etc.)
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const mockLocations: LocationData[] = [
        {
          address: `${query} Hotel, Downtown`,
          city: 'New York',
          state: 'NY',
          country: 'USA',
          postalCode: '10001',
          latitude: 40.7589,
          longitude: -73.9851,
          placeId: 'mock_1',
        },
        {
          address: `${query} Resort, Beach Area`,
          city: 'Miami',
          state: 'FL',
          country: 'USA',
          postalCode: '33139',
          latitude: 25.7617,
          longitude: -80.1918,
          placeId: 'mock_2',
        },
        {
          address: `${query} Conference Center`,
          city: 'San Francisco',
          state: 'CA',
          country: 'USA',
          postalCode: '94102',
          latitude: 37.7749,
          longitude: -122.4194,
          placeId: 'mock_3',
        },
      ];

      setSuggestions(mockLocations);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Location search error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchLocations(query);
  };

  const selectLocation = (location: LocationData) => {
    setSearchQuery(location.address || '');
    onChange(location);
    setShowSuggestions(false);
  };

  const handleManualInput = (field: keyof LocationData, value: string) => {
    onChange({
      ...currentValue,
      [field]: value,
    });
  };

  const handleCoordinatesInput = (lat: string, lng: string) => {
    onChange({
      ...currentValue,
      latitude: lat ? parseFloat(lat) : undefined,
      longitude: lng ? parseFloat(lng) : undefined,
    });
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onChange({
          ...currentValue,
          latitude,
          longitude,
          address: `📍 Current Location (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`,
        });
        setSearchQuery(`📍 Current Location (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`);
        setIsLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to get current location');
        setIsLoading(false);
      }
    );
  };

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const openInMaps = () => {
    if (currentValue.latitude && currentValue.longitude) {
      const url = `https://maps.google.com/?q=${currentValue.latitude},${currentValue.longitude}`;
      window.open(url, '_blank');
    } else if (currentValue.address) {
      const url = `https://maps.google.com/?q=${encodeURIComponent(currentValue.address)}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div>
      <label className="form-label flex items-center">
        📍 {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Input Mode Selector */}
      <div className="mb-3 flex space-x-2">
        <button
          type="button"
          onClick={() => setInputMode('search')}
          className={`px-3 py-1 text-xs rounded ${
            inputMode === 'search' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          🔍 Search
        </button>
        <button
          type="button"
          onClick={() => setInputMode('manual')}
          className={`px-3 py-1 text-xs rounded ${
            inputMode === 'manual' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          ✏️ Manual
        </button>
        <button
          type="button"
          onClick={() => setInputMode('coordinates')}
          className={`px-3 py-1 text-xs rounded ${
            inputMode === 'coordinates' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          🌐 Coordinates
        </button>
      </div>

      {/* Search Mode */}
      {inputMode === 'search' && (
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Search for an address or location..."
            className={`form-input ${error ? 'border-red-500' : ''}`}
            disabled={disabled}
          />
          
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            {isLoading && (
              <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full"></div>
            )}
            {!disabled && (
              <button
                type="button"
                onClick={getCurrentLocation}
                className="text-blue-600 hover:text-blue-800"
                title="Use current location"
              >
                📍
              </button>
            )}
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
              {suggestions.map((location, index) => (
                <button
                  key={location.placeId || index}
                  type="button"
                  onClick={() => selectLocation(location)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900">
                    {location.address}
                  </div>
                  <div className="text-sm text-gray-500">
                    {[location.city, location.state, location.country].filter(Boolean).join(', ')}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manual Mode */}
      {inputMode === 'manual' && (
        <div className="space-y-3">
          <input
            type="text"
            value={currentValue.address || ''}
            onChange={(e) => handleManualInput('address', e.target.value)}
            placeholder="Street address"
            className="form-input"
            disabled={disabled}
          />
          
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={currentValue.city || ''}
              onChange={(e) => handleManualInput('city', e.target.value)}
              placeholder="City"
              className="form-input"
              disabled={disabled}
            />
            <input
              type="text"
              value={currentValue.state || ''}
              onChange={(e) => handleManualInput('state', e.target.value)}
              placeholder="State/Province"
              className="form-input"
              disabled={disabled}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={currentValue.country || ''}
              onChange={(e) => handleManualInput('country', e.target.value)}
              placeholder="Country"
              className="form-input"
              disabled={disabled}
            />
            <input
              type="text"
              value={currentValue.postalCode || ''}
              onChange={(e) => handleManualInput('postalCode', e.target.value)}
              placeholder="Postal Code"
              className="form-input"
              disabled={disabled}
            />
          </div>
        </div>
      )}

      {/* Coordinates Mode */}
      {inputMode === 'coordinates' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-600 block mb-1">Latitude</label>
              <input
                type="number"
                value={currentValue.latitude || ''}
                onChange={(e) => handleCoordinatesInput(e.target.value, currentValue.longitude?.toString() || '')}
                placeholder="40.7589"
                step="any"
                className="form-input"
                disabled={disabled}
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">Longitude</label>
              <input
                type="number"
                value={currentValue.longitude || ''}
                onChange={(e) => handleCoordinatesInput(currentValue.latitude?.toString() || '', e.target.value)}
                placeholder="-73.9851"
                step="any"
                className="form-input"
                disabled={disabled}
              />
            </div>
          </div>
          
          {!disabled && (
            <button
              type="button"
              onClick={getCurrentLocation}
              className="w-full bg-blue-50 text-blue-700 py-2 px-4 rounded text-sm hover:bg-blue-100"
            >
              📍 Use Current Location
            </button>
          )}
        </div>
      )}

      {/* Location Display */}
      {(currentValue.address || (currentValue.latitude && currentValue.longitude)) && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="font-medium text-green-800">
                {currentValue.address || 'Coordinates Location'}
              </div>
              {currentValue.city && (
                <div className="text-sm text-green-600">
                  {[currentValue.city, currentValue.state, currentValue.country].filter(Boolean).join(', ')}
                </div>
              )}
              {currentValue.latitude && currentValue.longitude && (
                <div className="text-xs text-green-600 font-mono">
                  {formatCoordinates(currentValue.latitude, currentValue.longitude)}
                </div>
              )}
            </div>
            
            <button
              type="button"
              onClick={openInMaps}
              className="text-green-700 hover:text-green-900 text-sm ml-2"
              title="Open in maps"
            >
              🗺️
            </button>
          </div>
        </div>
      )}

      {/* Clear Location */}
      {!disabled && (currentValue.address || currentValue.latitude) && (
        <button
          type="button"
          onClick={() => {
            onChange({});
            setSearchQuery('');
          }}
          className="mt-2 text-xs text-gray-500 hover:text-gray-700"
        >
          Clear location
        </button>
      )}

      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}

      <p className="text-xs text-gray-500 mt-1">
        Search for addresses, enter manually, or use coordinates. Click the map icon to view in Google Maps.
      </p>
    </div>
  );
};

export default LocationInput;