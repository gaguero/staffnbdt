import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentMagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { SecurityMetrics, DashboardFilters } from '../../types/roleStats';

interface SecurityDashboardProps {
  data?: SecurityMetrics;
  securityData?: any;
  analytics?: any;
  isLoading: boolean;
  filters: DashboardFilters;
  onFiltersChange: (filters: Partial<DashboardFilters>) => void;
}

const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  data,
  analytics,
  isLoading
}) => {
  const [viewType, setViewType] = useState<'overview' | 'risks' | 'compliance'>('overview');

  // Risk level calculation
  const riskLevel = useMemo(() => {
    if (!data) return 'unknown';
    if (data.riskScore >= 80) return 'high';
    if (data.riskScore >= 50) return 'medium';
    return 'low';
  }, [data?.riskScore]);

  // Risk breakdown data
  const riskBreakdownData = useMemo(() => {
    if (!data) return [];
    
    return [
      {
        name: 'Over-privileged Users',
        value: data.overPrivilegedUsers,
        risk: 'high',
        color: '#EF4444'
      },
      {
        name: 'Under-privileged Users',
        value: data.underPrivilegedUsers,
        risk: 'medium',
        color: '#F59E0B'
      },
      {
        name: 'Redundant Roles',
        value: data.redundantRoles,
        risk: 'medium',
        color: '#F97316'
      },
      {
        name: 'Orphaned Permissions',
        value: data.orphanedPermissions,
        risk: 'low',
        color: '#6B7280'
      }
    ];
  }, [data]);

  // Compliance score data for radial chart
  const complianceData = useMemo(() => {
    if (!data) return [];
    
    return [
      {
        name: 'Compliant',
        value: data.complianceScore,
        fill: '#10B981'
      },
      {
        name: 'Non-Compliant',
        value: 100 - data.complianceScore,
        fill: '#EF4444'
      }
    ];
  }, [data?.complianceScore]);

  // Risk trend data (mock data for demo)
  const riskTrendData = [
    { date: '2024-01', score: 45 },
    { date: '2024-02', score: 52 },
    { date: '2024-03', score: 48 },
    { date: '2024-04', score: 41 },
    { date: '2024-05', score: 38 },
    { date: '2024-06', score: 35 }
  ];

  // Security recommendations (mock data)
  const securityRecommendations = [
    {
      id: 1,
      type: 'critical',
      title: 'Review Over-Privileged Users',
      description: `${data?.overPrivilegedUsers || 0} users have excessive permissions that may pose security risks.`,
      impact: 'High',
      effort: 'Medium',
      action: 'Audit user permissions and remove unnecessary access'
    },
    {
      id: 2,
      type: 'warning',
      title: 'Clean Up Redundant Roles',
      description: `${data?.redundantRoles || 0} roles appear to be redundant or overlapping.`,
      impact: 'Medium',
      effort: 'Low',
      action: 'Consolidate or remove redundant role definitions'
    },
    {
      id: 3,
      type: 'info',
      title: 'Address Permission Orphans',
      description: `${data?.orphanedPermissions || 0} permissions are not assigned to any role.`,
      impact: 'Low',
      effort: 'Low',
      action: 'Review and assign or remove orphaned permissions'
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className={`p-2 rounded-lg ${
              riskLevel === 'high' ? 'bg-red-100' :
              riskLevel === 'medium' ? 'bg-yellow-100' :
              'bg-green-100'
            }`}>
              <ShieldExclamationIcon className={`h-6 w-6 ${
                riskLevel === 'high' ? 'text-red-600' :
                riskLevel === 'medium' ? 'text-yellow-600' :
                'text-green-600'
              }`} />
            </div>
            <div className={`text-xs font-medium px-2 py-1 rounded-full ${
              riskLevel === 'high' ? 'bg-red-100 text-red-800' :
              riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {riskLevel.toUpperCase()}
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{data?.riskScore || 0}%</div>
          <div className="text-sm text-gray-600">Risk Score</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{data?.complianceScore || 0}%</div>
          <div className="text-sm text-gray-600">Compliance Score</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{data?.overPrivilegedUsers || 0}</div>
          <div className="text-sm text-gray-600">Over-Privileged Users</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-gray-100 rounded-lg">
              <XCircleIcon className="h-6 w-6 text-gray-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{data?.orphanedPermissions || 0}</div>
          <div className="text-sm text-gray-600">Orphaned Permissions</div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewType('overview')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewType === 'overview' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Security Overview
          </button>
          <button
            onClick={() => setViewType('risks')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewType === 'risks' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Risk Analysis
          </button>
          <button
            onClick={() => setViewType('compliance')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewType === 'compliance' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Compliance
          </button>
        </div>
      </div>

      {/* Content based on view type */}
      {viewType === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk Breakdown */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Security Risk Breakdown</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskBreakdownData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Compliance Score Radial */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Compliance Status</h3>
            <div className="h-80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={[{
                  name: 'Compliance',
                  value: data?.complianceScore || 0,
                  fill: data?.complianceScore && data.complianceScore >= 80 ? '#10B981' :
                        data?.complianceScore && data.complianceScore >= 60 ? '#F59E0B' :
                        '#EF4444'
                }]}>
                  <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8" />
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-current text-gray-900">
                    {data?.complianceScore || 0}%
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center text-sm text-gray-600 mt-4">
              Overall compliance with security policies
            </div>
          </div>
        </div>
      )}

      {viewType === 'risks' && (
        <div className="space-y-6">
          {/* Risk Trend */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Risk Score Trend</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={riskTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Risk Score']} />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#EF4444" 
                    strokeWidth={3}
                    dot={{ fill: '#EF4444' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk Categories Pie Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Risk Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskBreakdownData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {riskBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {viewType === 'compliance' && (
        <div className="space-y-6">
          {/* Compliance Checklist */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Compliance Checklist</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-sm font-medium text-green-800">
                    Role-based access control implemented
                  </span>
                </div>
                <span className="text-xs text-green-600 font-medium">COMPLIANT</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-3" />
                  <span className="text-sm font-medium text-yellow-800">
                    Regular access reviews needed
                  </span>
                </div>
                <span className="text-xs text-yellow-600 font-medium">PARTIAL</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-sm font-medium text-green-800">
                    Principle of least privilege followed
                  </span>
                </div>
                <span className="text-xs text-green-600 font-medium">COMPLIANT</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <XCircleIcon className="h-5 w-5 text-red-600 mr-3" />
                  <span className="text-sm font-medium text-red-800">
                    Segregation of duties gaps identified
                  </span>
                </div>
                <span className="text-xs text-red-600 font-medium">NON-COMPLIANT</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Recommendations */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Security Recommendations</h3>
          <DocumentMagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        
        <div className="space-y-4">
          {securityRecommendations.map(rec => (
            <div 
              key={rec.id} 
              className={`border-l-4 p-4 ${
                rec.type === 'critical' ? 'border-red-400 bg-red-50' :
                rec.type === 'warning' ? 'border-yellow-400 bg-yellow-50' :
                'border-blue-400 bg-blue-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className={`font-medium ${
                  rec.type === 'critical' ? 'text-red-800' :
                  rec.type === 'warning' ? 'text-yellow-800' :
                  'text-blue-800'
                }`}>
                  {rec.title}
                </h4>
                <div className="flex space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    rec.impact === 'High' ? 'bg-red-100 text-red-800' :
                    rec.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {rec.impact} Impact
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    rec.effort === 'High' ? 'bg-red-100 text-red-800' :
                    rec.effort === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {rec.effort} Effort
                  </span>
                </div>
              </div>
              
              <p className={`text-sm mb-3 ${
                rec.type === 'critical' ? 'text-red-700' :
                rec.type === 'warning' ? 'text-yellow-700' :
                'text-blue-700'
              }`}>
                {rec.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className={`text-sm font-medium ${
                  rec.type === 'critical' ? 'text-red-800' :
                  rec.type === 'warning' ? 'text-yellow-800' :
                  'text-blue-800'
                }`}>
                  Action: {rec.action}
                </div>
                <button className={`text-sm font-medium hover:underline ${
                  rec.type === 'critical' ? 'text-red-600' :
                  rec.type === 'warning' ? 'text-yellow-600' :
                  'text-blue-600'
                }`}>
                  View Details →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;