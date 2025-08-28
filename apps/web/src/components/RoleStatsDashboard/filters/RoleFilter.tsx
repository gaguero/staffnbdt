import React from 'react';
import { Users } from 'lucide-react';

interface RoleFilterProps {
  value?: ('system' | 'custom')[];
  onChange: (roleTypes: ('system' | 'custom')[]) => void;
}

const RoleFilter: React.FC<RoleFilterProps> = ({
  value = [],
  onChange
}) => {
  const roleTypes = [
    { key: 'system', label: 'System Roles', description: 'Built-in platform roles' },
    { key: 'custom', label: 'Custom Roles', description: 'Organization-specific roles' }
  ];

  const handleCheckboxChange = (roleType: 'system' | 'custom', checked: boolean) => {
    if (checked) {
      onChange([...value, roleType]);
    } else {
      onChange(value.filter(type => type !== roleType));
    }
  };

  const isAllSelected = value.length === 0;

  return (
    <div className="flex-shrink-0">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Role Types
      </label>
      <div className="relative">
        <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <div className="pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white min-w-[140px]">
          <div className="space-y-2">
            {/* All option */}
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([]);
                  }
                }}
                className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
              />
              <span className="text-gray-700">All Types</span>
            </label>

            {/* Individual role types */}
            {roleTypes.map(roleType => (
              <label key={roleType.key} className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={value.includes(roleType.key as 'system' | 'custom')}
                  onChange={(e) => handleCheckboxChange(
                    roleType.key as 'system' | 'custom', 
                    e.target.checked
                  )}
                  className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                />
                <span className="text-gray-700" title={roleType.description}>
                  {roleType.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleFilter;