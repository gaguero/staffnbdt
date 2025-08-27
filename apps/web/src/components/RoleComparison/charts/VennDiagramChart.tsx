import React from 'react';
import { VennDiagramData, RoleComparisonData } from '../../../types/roleComparison';
import RoleBadge from '../../RoleBadge';

interface VennDiagramChartProps {
  data: VennDiagramData;
  roles: RoleComparisonData[];
  className?: string;
}

const VennDiagramChart: React.FC<VennDiagramChartProps> = ({
  data,
  roles,
  className = '',
}) => {
  // For now, we'll show a simplified text-based representation
  // In a production app, you might use D3.js or a specialized Venn diagram library
  
  const getIntersectionLabel = (intersection: VennDiagramData['intersections'][0]) => {
    const roleNames = intersection.sets.map(setId => {
      const role = roles.find(r => r.id === setId);
      return role?.name || setId;
    });
    
    if (roleNames.length === 1) {
      return `Only ${roleNames[0]}`;
    } else if (roleNames.length === 2) {
      return `${roleNames[0]} ∩ ${roleNames[1]}`;
    } else {
      return `${roleNames.slice(0, -1).join(', ')} ∩ ${roleNames[roleNames.length - 1]}`;
    }
  };
  
  const totalPermissions = data.sets.reduce((sum, set) => sum + set.size, 0);
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Role Sets Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.sets.map(set => {
          const role = roles.find(r => r.id === set.id);
          return (
            <div key={set.id} className="text-center p-4 border border-gray-200 rounded-lg">
              {role && (
                <div className="mb-3">
                  <RoleBadge 
                    role={role.isSystemRole ? (role.systemRole || role.name) : role.name}
                    isCustomRole={!role.isSystemRole}
                    size="md"
                  />
                </div>
              )}
              <div className="text-2xl font-bold text-gray-900">{set.size}</div>
              <div className="text-sm text-gray-600">permissions</div>
              <div className="text-xs text-gray-500 mt-1">
                {((set.size / totalPermissions) * 100).toFixed(1)}% of total
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Visual Representation */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Permission Overlaps</h3>
        
        {/* Simplified Venn Diagram */}
        <div className="flex items-center justify-center min-h-[300px] bg-gray-50 rounded-lg relative">
          {roles.length === 2 ? (
            <TwoSetVenn data={data} roles={roles} />
          ) : roles.length === 3 ? (
            <ThreeSetVenn data={data} roles={roles} />
          ) : (
            <div className="text-center text-gray-500">
              <div className="text-sm">Venn diagram visualization</div>
              <div className="text-xs mt-1">Interactive diagram would appear here</div>
            </div>
          )}
        </div>
      </div>
      
      {/* Intersection Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Intersection Details</h3>
        <div className="space-y-4">
          {data.intersections.map((intersection, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">
                  {getIntersectionLabel(intersection)}
                </h4>
                <div className="text-sm text-gray-600">
                  {intersection.size} permission{intersection.size !== 1 ? 's' : ''}
                </div>
              </div>
              
              {intersection.permissions.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs text-gray-500 mb-2">Shared Permissions:</div>
                  <div className="flex flex-wrap gap-1">
                    {intersection.permissions.slice(0, 10).map((permission, permIndex) => (
                      <span 
                        key={permIndex}
                        className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                      >
                        {permission.resource}.{permission.action}
                      </span>
                    ))}
                    {intersection.permissions.length > 10 && (
                      <span className="text-xs text-gray-500 px-2 py-1">
                        +{intersection.permissions.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Simplified two-set Venn diagram
const TwoSetVenn: React.FC<{ data: VennDiagramData; roles: RoleComparisonData[] }> = ({ data, roles }) => {
  const [set1, set2] = data.sets;
  const intersection = data.intersections.find(i => i.sets.length === 2);
  
  return (
    <div className="flex items-center justify-center space-x-8">
      <div className="relative">
        <div className="w-32 h-32 rounded-full bg-blue-200 opacity-75 flex items-center justify-center">
          <div className="text-center">
            <div className="font-bold text-blue-800">{set1.size}</div>
            <div className="text-xs text-blue-600">{set1.label}</div>
          </div>
        </div>
      </div>
      
      <div className="relative -mx-16 z-10">
        <div className="w-32 h-32 rounded-full bg-green-200 opacity-75 flex items-center justify-center">
          <div className="text-center">
            <div className="font-bold text-green-800">{set2.size}</div>
            <div className="text-xs text-green-600">{set2.label}</div>
          </div>
        </div>
        
        {intersection && intersection.size > 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="font-bold text-purple-800">{intersection.size}</div>
              <div className="text-xs text-purple-600">shared</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Simplified three-set Venn diagram
const ThreeSetVenn: React.FC<{ data: VennDiagramData; roles: RoleComparisonData[] }> = ({ data }) => {
  return (
    <div className="text-center text-gray-500">
      <div className="text-sm">Three-set Venn diagram</div>
      <div className="text-xs mt-1">Complex visualization would appear here</div>
      <div className="mt-4 text-xs">
        Consider using specialized libraries like venn.js or D3.js for interactive diagrams
      </div>
    </div>
  );
};

export default VennDiagramChart;
