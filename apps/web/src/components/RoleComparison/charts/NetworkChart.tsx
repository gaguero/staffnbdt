import React from 'react';
import { NetworkGraphData, RoleComparisonData } from '../../../types/roleComparison';
import RoleBadge from '../../RoleBadge';

interface NetworkChartProps {
  data: NetworkGraphData;
  roles: RoleComparisonData[];
  className?: string;
}

const NetworkChart: React.FC<NetworkChartProps> = ({
  data,
  roles,
  className = '',
}) => {
  const roleNodes = data.nodes.filter(node => node.type === 'role');
  const categoryNodes = data.nodes.filter(node => node.type === 'category');
  const similarityEdges = data.edges.filter(edge => edge.type === 'similar');
  const permissionEdges = data.edges.filter(edge => edge.type === 'has_permission');
  
  const getNodeById = (id: string) => data.nodes.find(node => node.id === id);
  
  const getEdgeStrengthColor = (weight: number) => {
    if (weight >= 0.8) return 'border-green-500 bg-green-100';
    if (weight >= 0.6) return 'border-yellow-500 bg-yellow-100';
    if (weight >= 0.4) return 'border-orange-500 bg-orange-100';
    return 'border-red-500 bg-red-100';
  };
  
  const getEdgeStrengthLabel = (weight: number) => {
    if (weight >= 0.8) return 'Very Strong';
    if (weight >= 0.6) return 'Strong';
    if (weight >= 0.4) return 'Moderate';
    return 'Weak';
  };
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Network Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-900">{roleNodes.length}</div>
          <div className="text-sm text-blue-600">Role Nodes</div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-900">{categoryNodes.length}</div>
          <div className="text-sm text-green-600">Category Nodes</div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-900">{data.edges.length}</div>
          <div className="text-sm text-purple-600">Connections</div>
        </div>
      </div>
      
      {/* Simplified Network Visualization */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Network Graph</h3>
        
        <div className="min-h-[400px] bg-gray-50 rounded-lg flex items-center justify-center relative overflow-hidden">
          {/* Central area for roles */}
          <div className="relative">
            {/* Role Nodes */}
            <div className="grid grid-cols-2 gap-8 p-8">
              {roleNodes.map((node, index) => {
                const role = roles.find(r => r.id === node.id);
                const angle = (index / roleNodes.length) * 2 * Math.PI;
                const radius = 80;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                return (
                  <div 
                    key={node.id} 
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-blue-300 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
                    style={{ 
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px)`,
                      zIndex: 10 
                    }}
                    title={`${node.label}: ${node.metadata?.permissionCount || 0} permissions`}
                  >
                    <div className="text-center">
                      {role && (
                        <RoleBadge 
                          role={role.isSystemRole ? (role.systemRole || role.name) : role.name}
                          isCustomRole={!role.isSystemRole}
                          size="sm"
                        />
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        {node.metadata?.permissionCount || 0} perms
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Connection Lines (simplified) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
              {similarityEdges.map((edge, index) => {
                const sourceNode = getNodeById(edge.source);
                const targetNode = getNodeById(edge.target);
                
                if (!sourceNode || !targetNode) return null;
                
                const sourceIndex = roleNodes.findIndex(n => n.id === edge.source);
                const targetIndex = roleNodes.findIndex(n => n.id === edge.target);
                
                const sourceAngle = (sourceIndex / roleNodes.length) * 2 * Math.PI;
                const targetAngle = (targetIndex / roleNodes.length) * 2 * Math.PI;
                const radius = 80;
                
                const sourceX = 200 + Math.cos(sourceAngle) * radius;
                const sourceY = 200 + Math.sin(sourceAngle) * radius;
                const targetX = 200 + Math.cos(targetAngle) * radius;
                const targetY = 200 + Math.sin(targetAngle) * radius;
                
                const strokeWidth = Math.max(1, edge.weight * 4);
                const opacity = Math.max(0.3, edge.weight);
                
                return (
                  <line
                    key={index}
                    x1={sourceX}
                    y1={sourceY}
                    x2={targetX}
                    y2={targetY}
                    stroke="#3b82f6"
                    strokeWidth={strokeWidth}
                    opacity={opacity}
                  />
                );
              })}
            </svg>
          </div>
          
          <div className="absolute bottom-4 right-4 text-xs text-gray-500">
            Interactive network graph would appear here with D3.js or similar library
          </div>
        </div>
      </div>
      
      {/* Role Similarities */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Role Similarities</h3>
        <div className="space-y-3">
          {similarityEdges.map((edge, index) => {
            const sourceNode = getNodeById(edge.source);
            const targetNode = getNodeById(edge.target);
            const sourceRole = roles.find(r => r.id === edge.source);
            const targetRole = roles.find(r => r.id === edge.target);
            
            if (!sourceNode || !targetNode || !sourceRole || !targetRole) return null;
            
            const strengthColor = getEdgeStrengthColor(edge.weight);
            const strengthLabel = getEdgeStrengthLabel(edge.weight);
            
            return (
              <div key={index} className={`p-4 border rounded-lg ${strengthColor}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <RoleBadge 
                      role={sourceRole.isSystemRole ? (sourceRole.systemRole || sourceRole.name) : sourceRole.name}
                      isCustomRole={!sourceRole.isSystemRole}
                      size="sm"
                    />
                    <span className="text-gray-400">↔</span>
                    <RoleBadge 
                      role={targetRole.isSystemRole ? (targetRole.systemRole || targetRole.name) : targetRole.name}
                      isCustomRole={!targetRole.isSystemRole}
                      size="sm"
                    />
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium">{strengthLabel}</div>
                    <div className="text-xs text-gray-500">{Math.round(edge.weight * 100)}% similar</div>
                  </div>
                </div>
                
                <div className="w-full bg-white bg-opacity-50 rounded-full h-2">
                  <div 
                    className="bg-current h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${edge.weight * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Category Connections */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Category Coverage</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categoryNodes.map(categoryNode => {
            const categoryEdges = permissionEdges.filter(edge => edge.target === categoryNode.id);
            const totalConnections = categoryEdges.length;
            const averageStrength = totalConnections > 0 
              ? categoryEdges.reduce((sum, edge) => sum + edge.weight, 0) / totalConnections 
              : 0;
            
            return (
              <div key={categoryNode.id} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 capitalize mb-3">{categoryNode.label}</h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Connected Roles:</span>
                    <span className="font-medium">{totalConnections}/{roleNodes.length}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg. Coverage:</span>
                    <span className="font-medium">{Math.round(averageStrength * 100)}%</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Permissions:</span>
                    <span className="font-medium">{categoryNode.metadata?.permissionCount || 0}</span>
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${averageStrength * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Network Statistics */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Network Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-gray-900">
              {Math.round((similarityEdges.reduce((sum, edge) => sum + edge.weight, 0) / similarityEdges.length) * 100) || 0}%
            </div>
            <div className="text-sm text-gray-600">Avg. Similarity</div>
          </div>
          
          <div>
            <div className="text-lg font-bold text-gray-900">
              {similarityEdges.filter(edge => edge.weight >= 0.8).length}
            </div>
            <div className="text-sm text-gray-600">Strong Connections</div>
          </div>
          
          <div>
            <div className="text-lg font-bold text-gray-900">
              {Math.round((permissionEdges.reduce((sum, edge) => sum + edge.weight, 0) / permissionEdges.length) * 100) || 0}%
            </div>
            <div className="text-sm text-gray-600">Avg. Coverage</div>
          </div>
          
          <div>
            <div className="text-lg font-bold text-gray-900">
              {categoryNodes.filter(node => {
                const categoryEdges = permissionEdges.filter(edge => edge.target === node.id);
                return categoryEdges.length === roleNodes.length;
              }).length}
            </div>
            <div className="text-sm text-gray-600">Universal Categories</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkChart;
