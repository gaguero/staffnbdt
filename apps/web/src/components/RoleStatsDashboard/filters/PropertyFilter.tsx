import React from 'react';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';

interface PropertyFilterProps {
  organizationId?: string;
  propertyId?: string;
  onChange: (organizationId?: string, propertyId?: string) => void;
}

const PropertyFilter: React.FC<PropertyFilterProps> = ({
  organizationId,
  propertyId,
  onChange
}) => {
  // Mock data - in a real app, this would come from API
  const organizations = [
    { id: 'org-1', name: 'Hotel Group A' },
    { id: 'org-2', name: 'Resort Chain B' },
    { id: 'org-3', name: 'Boutique Hotels C' }
  ];

  const properties = [
    { id: 'prop-1', name: 'Downtown Hotel', organizationId: 'org-1' },
    { id: 'prop-2', name: 'Airport Hotel', organizationId: 'org-1' },
    { id: 'prop-3', name: 'Beach Resort', organizationId: 'org-2' },
    { id: 'prop-4', name: 'Mountain Lodge', organizationId: 'org-2' }
  ];

  const filteredProperties = organizationId 
    ? properties.filter(p => p.organizationId === organizationId)
    : properties;

  const handleOrganizationChange = (orgId: string) => {
    const newOrgId = orgId === 'all' ? undefined : orgId;
    onChange(newOrgId, undefined); // Clear property when organization changes
  };

  const handlePropertyChange = (propId: string) => {
    const newPropId = propId === 'all' ? undefined : propId;
    onChange(organizationId, newPropId);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Organization Filter */}
      <div className="flex-shrink-0">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Organization
        </label>
        <div className="relative">
          <BuildingOfficeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={organizationId || 'all'}
            onChange={(e) => handleOrganizationChange(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[160px]"
          >
            <option value="all">All Organizations</option>
            {organizations.map(org => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Property Filter */}
      <div className="flex-shrink-0">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Property
        </label>
        <select
          value={propertyId || 'all'}
          onChange={(e) => handlePropertyChange(e.target.value)}
          disabled={!organizationId}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed min-w-[150px]"
        >
          <option value="all">
            {organizationId ? 'All Properties' : 'Select Organization First'}
          </option>
          {filteredProperties.map(property => (
            <option key={property.id} value={property.id}>
              {property.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default PropertyFilter;