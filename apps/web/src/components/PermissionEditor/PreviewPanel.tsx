import React, { useState, useMemo, useCallback } from 'react';
import {
  Play as PlayIcon,
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon,
  AlertTriangle as ExclamationTriangleIcon,
  Info as InformationCircleIcon,
  Download as DocumentArrowDownIcon,
  ClipboardCheck as ClipboardDocumentCheckIcon,
  User as UserIcon,
  Building2 as BuildingOfficeIcon,
  Settings as CogIcon,
  ChevronRight as ChevronRightIcon,
  ChevronDown as ChevronDownIcon,
  Star as StarIcon,
  Clock as ClockIcon,
  Zap as BoltIcon
} from 'lucide-react';

import { 
  PreviewPanelProps, 
  PreviewResult, 
  TestCase, 
  TestScenario,
  RoleConfiguration 
} from '../../types/permissionEditor';
import { Permission } from '../../types/permission';
import RoleBadge from '../RoleBadge';

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  role,
  testResults,
  onRunTests,
  onExportRole,
  className = '',
  showTestCases = true,
  showScenarios = true
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'permissions' | 'testing' | 'export'>('overview');
  const [expandedScenarios, setExpandedScenarios] = useState<Set<string>>(new Set());
  const [selectedTestCase, setSelectedTestCase] = useState<string | null>(null);

  // Mock test scenarios and results (in real implementation, these would come from props)
  const mockTestResults: PreviewResult = useMemo(() => ({
    role,
    testCases: [
      {
        id: 'user-read-department',
        name: 'Read department users',
        description: 'Test ability to read users within the same department',
        resource: 'user',
        action: 'read',
        scope: 'department',
        context: { departmentId: 'dept-123', propertyId: 'prop-456' },
        expectedResult: true,
        actualResult: true,
        passed: true
      },
      {
        id: 'user-delete-platform',
        name: 'Delete platform users',
        description: 'Test platform-wide user deletion (should fail for department level)',
        resource: 'user',
        action: 'delete',
        scope: 'platform',
        context: { departmentId: 'dept-123', propertyId: 'prop-456' },
        expectedResult: false,
        actualResult: false,
        passed: true
      },
      {
        id: 'schedule-manage-department',
        name: 'Manage department schedules',
        description: 'Test schedule management within department',
        resource: 'schedule',
        action: 'manage',
        scope: 'department',
        context: { departmentId: 'dept-123', propertyId: 'prop-456' },
        expectedResult: true,
        actualResult: true,
        passed: true
      }
    ],
    scenarios: [
      {
        id: 'daily-operations',
        name: 'Daily Operations',
        description: 'Common daily tasks and operations',
        testCases: ['user-read-department', 'schedule-manage-department'],
        passed: true,
        coverage: 85
      },
      {
        id: 'administrative-tasks',
        name: 'Administrative Tasks',
        description: 'Administrative and management operations',
        testCases: ['user-delete-platform'],
        passed: true,
        coverage: 92
      }
    ],
    recommendations: [
      'Consider adding document.read.department for complete workflow access',
      'Role permissions are well-scoped for the department level',
      'No conflicting permissions detected'
    ],
    warnings: [
      'This role has limited cross-department visibility'
    ]
  }), [role]);

  const results = testResults || mockTestResults;

  // Calculate test statistics
  const testStats = useMemo(() => {
    const totalTests = results.testCases.length;
    const passedTests = results.testCases.filter(test => test.passed).length;
    const failedTests = totalTests - passedTests;
    const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    return {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      passRate: Math.round(passRate)
    };
  }, [results.testCases]);

  // Toggle scenario expansion
  const toggleScenario = useCallback((scenarioId: string) => {
    setExpandedScenarios(prev => {
      const newSet = new Set(prev);
      if (newSet.has(scenarioId)) {
        newSet.delete(scenarioId);
      } else {
        newSet.add(scenarioId);
      }
      return newSet;
    });
  }, []);

  // Render test case
  const renderTestCase = useCallback((testCase: TestCase) => {
    const isSelected = selectedTestCase === testCase.id;
    const statusIcon = testCase.passed ? CheckCircleIcon : XCircleIcon;
    const statusColor = testCase.passed ? 'text-green-500' : 'text-red-500';

    return (
      <div
        key={testCase.id}
        className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
          isSelected 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}
        onClick={() => setSelectedTestCase(isSelected ? null : testCase.id)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <statusIcon className={`h-5 w-5 ${statusColor} flex-shrink-0 mt-0.5`} />
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900">{testCase.name}</h4>
              <p className="text-xs text-gray-600 mt-1">{testCase.description}</p>
              
              <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                <span className="bg-gray-100 px-2 py-0.5 rounded">{testCase.resource}</span>
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{testCase.action}</span>
                <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded">{testCase.scope}</span>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 ml-3">
            {testCase.passed ? 'PASS' : 'FAIL'}
          </div>
        </div>

        {/* Expanded details */}
        {isSelected && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-medium text-gray-700">Expected:</span>
                <span className={`ml-2 ${testCase.expectedResult ? 'text-green-600' : 'text-red-600'}`}>
                  {testCase.expectedResult ? 'Allow' : 'Deny'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Actual:</span>
                <span className={`ml-2 ${testCase.actualResult ? 'text-green-600' : 'text-red-600'}`}>
                  {testCase.actualResult ? 'Allow' : 'Deny'}
                </span>
              </div>
            </div>
            
            {testCase.context && (
              <div className="mt-2">
                <span className="font-medium text-gray-700 text-xs">Context:</span>
                <div className="mt-1 text-xs text-gray-600 bg-gray-50 p-2 rounded font-mono">
                  {JSON.stringify(testCase.context, null, 2)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }, [selectedTestCase]);

  // Render test scenario
  const renderTestScenario = useCallback((scenario: TestScenario) => {
    const isExpanded = expandedScenarios.has(scenario.id);
    const scenarioTests = results.testCases.filter(test => 
      scenario.testCases.includes(test.id)
    );

    return (
      <div key={scenario.id} className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleScenario(scenario.id)}
          className="w-full p-4 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left transition-colors duration-200"
        >
          <div className="flex items-center space-x-3">
            {scenario.passed ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            ) : (
              <XCircleIcon className="h-5 w-5 text-red-500" />
            )}
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{scenario.name}</h3>
              <p className="text-xs text-gray-600 mt-1">{scenario.description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right text-xs">
              <div className="font-medium text-gray-900">{scenario.coverage}% coverage</div>
              <div className="text-gray-500">{scenarioTests.length} tests</div>
            </div>
            
            {isExpanded ? (
              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 text-gray-500" />
            )}
          </div>
        </button>

        {isExpanded && (
          <div className="p-4 bg-white space-y-3">
            {scenarioTests.map(test => renderTestCase(test))}
          </div>
        )}
      </div>
    );
  }, [expandedScenarios, toggleScenario, results.testCases, renderTestCase]);

  // Render overview tab
  const renderOverviewTab = useCallback(() => (
    <div className="space-y-6">
      {/* Role Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Role Summary</h3>
        
        <div className="flex items-start space-x-4">
          <RoleBadge
            role={role.name}
            isCustomRole={role.isCustomRole}
            size="lg"
            showTooltip={false}
          />
          
          <div className="flex-1">
            <h4 className="text-lg font-medium text-gray-900">{role.name}</h4>
            <p className="text-gray-600 mt-1">{role.description}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
              <div>
                <span className="text-gray-500">Level:</span>
                <div className="font-medium text-gray-900">{role.level}</div>
              </div>
              <div>
                <span className="text-gray-500">Permissions:</span>
                <div className="font-medium text-gray-900">{role.permissions.length}</div>
              </div>
              <div>
                <span className="text-gray-500">Category:</span>
                <div className="font-medium text-gray-900">{role.metadata.category}</div>
              </div>
              <div>
                <span className="text-gray-500">Version:</span>
                <div className="font-medium text-gray-900">v{role.version}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Test Results Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Test Results Summary</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{testStats.passed}</div>
            <div className="text-xs text-green-700">Passed</div>
          </div>
          <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{testStats.failed}</div>
            <div className="text-xs text-red-700">Failed</div>
          </div>
          <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{testStats.total}</div>
            <div className="text-xs text-blue-700">Total Tests</div>
          </div>
          <div className="text-center p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{testStats.passRate}%</div>
            <div className="text-xs text-gray-700">Pass Rate</div>
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${testStats.passRate}%` }}
          />
        </div>
      </div>

      {/* Recommendations */}
      {results.recommendations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center space-x-2">
            <InformationCircleIcon className="h-4 w-4" />
            <span>Recommendations</span>
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            {results.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {results.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-yellow-900 mb-3 flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <span>Warnings</span>
          </h3>
          <ul className="space-y-2 text-sm text-yellow-800">
            {results.warnings.map((warning, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-yellow-500 mt-1">•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  ), [role, testStats, results.recommendations, results.warnings]);

  // Render permissions tab
  const renderPermissionsTab = useCallback(() => {
    const groupedPermissions = role.permissions.reduce((groups: Record<string, string[]>, permission) => {
      const [resource] = permission.split('.');
      if (!groups[resource]) {
        groups[resource] = [];
      }
      groups[resource].push(permission);
      return groups;
    }, {});

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            Permissions ({role.permissions.length})
          </h3>
        </div>

        {Object.entries(groupedPermissions).map(([resource, permissions]) => (
          <div key={resource} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 capitalize">
                {resource} ({permissions.length})
              </h4>
            </div>
            
            <div className="p-4 space-y-2">
              {permissions.map((permission, index) => {
                const [, action, scope] = permission.split('.');
                return (
                  <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                    <span className="text-sm font-mono text-gray-900">{permission}</span>
                    <div className="flex items-center space-x-1">
                      <span className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                        {action}
                      </span>
                      <span className="inline-block px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                        {scope}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }, [role.permissions]);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
              <PlayIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Role Preview</h2>
              <p className="text-sm text-gray-600">Test and validate your role configuration</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onRunTests}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              <BoltIcon className="h-4 w-4" />
              <span>Run Tests</span>
            </button>

            <button
              onClick={onExportRole}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-md">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors duration-200 ${
              activeTab === 'overview'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>

          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors duration-200 ${
              activeTab === 'permissions'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Permissions
          </button>

          {showTestCases && (
            <button
              onClick={() => setActiveTab('testing')}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors duration-200 ${
                activeTab === 'testing'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Testing
            </button>
          )}

          <button
            onClick={() => setActiveTab('export')}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors duration-200 ${
              activeTab === 'export'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Export
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {activeTab === 'overview' && renderOverviewTab()}
        
        {activeTab === 'permissions' && renderPermissionsTab()}
        
        {activeTab === 'testing' && showTestCases && (
          <div className="space-y-4">
            {/* Test Scenarios */}
            {showScenarios && results.scenarios.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Test Scenarios</h3>
                <div className="space-y-2">
                  {results.scenarios.map(scenario => renderTestScenario(scenario))}
                </div>
              </div>
            )}

            {/* Individual Test Cases */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Test Cases</h3>
              <div className="space-y-2">
                {results.testCases.map(testCase => renderTestCase(testCase))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'export' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Export Options</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={onExportRole}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors duration-200 text-left"
              >
                <DocumentArrowDownIcon className="h-8 w-8 text-blue-600 mb-2" />
                <h4 className="text-sm font-medium text-gray-900">Export as JSON</h4>
                <p className="text-xs text-gray-600 mt-1">Download role configuration as JSON file</p>
              </button>
              
              <button
                onClick={() => {
                  // Copy to clipboard functionality
                  navigator.clipboard.writeText(JSON.stringify(role, null, 2));
                }}
                className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors duration-200 text-left"
              >
                <ClipboardDocumentCheckIcon className="h-8 w-8 text-green-600 mb-2" />
                <h4 className="text-sm font-medium text-gray-900">Copy to Clipboard</h4>
                <p className="text-xs text-gray-600 mt-1">Copy role configuration to clipboard</p>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewPanel;