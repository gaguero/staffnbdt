import React, { useState } from 'react';
import {
  MagnifyingGlassIcon,
  UserPlusIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  CogIcon,
} from '@heroicons/react/24/outline';
import { PermissionSearch } from '../components/PermissionSearch';
import { PermissionSearchIndex } from '../types/permissionSearch';
import Layout from '../components/Layout';

const PermissionSearchDemoPage: React.FC = () => {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [searchMode, setSearchMode] = useState<'single-select' | 'multi-select' | 'filter'>('multi-select');
  const [searchVariant, setSearchVariant] = useState<'full' | 'compact' | 'minimal'>('full');
  const [demoContext, setDemoContext] = useState<'role-creation' | 'user-management' | 'audit' | 'generic'>('generic');

  const handlePermissionSelect = (permissions: string[]) => {
    setSelectedPermissions(permissions);
  };

  const handlePermissionAction = (permission: PermissionSearchIndex) => {
    console.log('Permission action:', permission);
  };

  const handleSearch = (query: string, results: any[]) => {
    console.log('Search performed:', { query, resultCount: results.length });
  };

  const handleFilterChange = (filters: any) => {
    console.log('Filters changed:', filters);
  };

  const demoContexts = [
    {
      id: 'generic' as const,
      name: 'Generic Search',
      description: 'General permission search with all features',
      icon: MagnifyingGlassIcon,
    },
    {
      id: 'role-creation' as const,
      name: 'Role Creation',
      description: 'Search permissions for creating custom roles',
      icon: UserGroupIcon,
    },
    {
      id: 'user-management' as const,
      name: 'User Management',
      description: 'User-focused permission management',
      icon: UserPlusIcon,
    },
    {
      id: 'audit' as const,
      name: 'Audit Review',
      description: 'Permission audit and compliance review',
      icon: ClipboardDocumentListIcon,
    },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Permission Search Demo</h1>
          <p className="text-lg text-gray-600 mt-2">
            Powerful search functionality for Hotel Operations Hub permissions
          </p>
        </div>

        {/* Demo Controls */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CogIcon className="h-5 w-5 mr-2" />
            Demo Configuration
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Search Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Mode
              </label>
              <select
                value={searchMode}
                onChange={(e) => setSearchMode(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="single-select">Single Select</option>
                <option value="multi-select">Multi Select</option>
                <option value="filter">Filter Only</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {searchMode === 'single-select' && 'Select one permission at a time'}
                {searchMode === 'multi-select' && 'Select multiple permissions with checkboxes'}
                {searchMode === 'filter' && 'Search and filter without selection'}
              </p>
            </div>

            {/* Variant */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Component Variant
              </label>
              <select
                value={searchVariant}
                onChange={(e) => setSearchVariant(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="full">Full Featured</option>
                <option value="compact">Compact</option>
                <option value="minimal">Minimal</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {searchVariant === 'full' && 'All features including tabs, filters, and history'}
                {searchVariant === 'compact' && 'Condensed layout with essential features'}
                {searchVariant === 'minimal' && 'Just search input and results'}
              </p>
            </div>

            {/* Context */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Context
              </label>
              <select
                value={demoContext}
                onChange={(e) => setDemoContext(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {demoContexts.map(context => (
                  <option key={context.id} value={context.id}>
                    {context.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {demoContexts.find(c => c.id === demoContext)?.description}
              </p>
            </div>
          </div>
          
          {/* Selected Permissions Display */}
          {selectedPermissions.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                Selected Permissions ({selectedPermissions.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedPermissions.slice(0, 10).map((permission, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    <code>{permission}</code>
                    <button
                      onClick={() => setSelectedPermissions(prev => prev.filter(p => p !== permission))}
                      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 bg-blue-200 text-blue-600 rounded-full hover:bg-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <span className="sr-only">Remove</span>
                      <svg className="w-2 h-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                        <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                      </svg>
                    </button>
                  </span>
                ))}
                {selectedPermissions.length > 10 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    +{selectedPermissions.length - 10} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Context Examples */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {demoContexts.map((context) => {
            const Icon = context.icon;
            const isActive = demoContext === context.id;
            
            return (
              <button
                key={context.id}
                onClick={() => setDemoContext(context.id)}
                className={`p-4 text-left border rounded-lg transition-colors ${
                  isActive
                    ? 'border-blue-200 bg-blue-50 ring-2 ring-blue-500 ring-opacity-20'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-md ${
                    isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-medium truncate ${
                      isActive ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {context.name}
                    </h3>
                    <p className={`text-xs mt-1 ${
                      isActive ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {context.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Main Permission Search Component */}
        <div className="mb-8">
          <PermissionSearch
            mode={searchMode}
            variant={searchVariant}
            context={demoContext}
            selectedPermissions={selectedPermissions}
            onSelect={handlePermissionSelect}
            onPermissionSelect={handlePermissionAction}
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
            showFilters={true}
            showHistory={true}
            showSavedSearches={true}
            showCategories={true}
            showPopularPermissions={true}
            showRecent={true}
            showKeyboardShortcuts={true}
            allowRegex={true}
            allowExport={true}
            maxHeight={600}
            placeholder={`Search permissions for ${demoContexts.find(c => c.id === demoContext)?.name.toLowerCase()}...`}
            className="shadow-lg"
          />
        </div>

        {/* Feature Highlights */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            🔍 Advanced Permission Search Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">🎯 Intelligent Search</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Fuzzy matching and typo tolerance</li>
                <li>• Contextual keyword suggestions</li>
                <li>• Multi-field scoring algorithm</li>
                <li>• Regular expression support</li>
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">🔧 Advanced Filtering</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Filter by resource, action, scope</li>
                <li>• Category-based organization</li>
                <li>• System vs. custom permissions</li>
                <li>• Conditional permission handling</li>
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">📊 Smart Recommendations</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Popular permissions by usage</li>
                <li>• Recently accessed permissions</li>
                <li>• Context-aware suggestions</li>
                <li>• Role-based recommendations</li>
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">💾 Search Management</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Search history with timestamps</li>
                <li>• Save and organize searches</li>
                <li>• Export search results</li>
                <li>• Persistent user preferences</li>
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">⚡ Performance</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Debounced search (300ms)</li>
                <li>• Result caching with TTL</li>
                <li>• Virtual scrolling for large lists</li>
                <li>• Optimized re-rendering</li>
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">♿ Accessibility</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Full keyboard navigation</li>
                <li>• Screen reader support</li>
                <li>• WCAG compliance</li>
                <li>• High contrast mode support</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Usage Examples */}
        <div className="mt-12 bg-white rounded-lg border border-gray-200 shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            💡 Usage Examples
          </h2>
          
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Role Creation Workflow</h3>
              <pre className="text-sm text-gray-700 bg-white p-3 rounded border overflow-x-auto">
{`<PermissionSearch
  mode="multi-select"
  context="role-creation"
  onSelect={(permissions) => addToRole(permissions)}
  placeholder="Search permissions for this role..."
  showCategories={true}
  showPopularPermissions={true}
/>`}
              </pre>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">User Permission Review</h3>
              <pre className="text-sm text-gray-700 bg-white p-3 rounded border overflow-x-auto">
{`<PermissionSearch
  mode="filter"
  context="audit"
  onSearch={(query, results) => filterUserPermissions(results)}
  showFilters={true}
  allowExport={true}
  variant="compact"
/>`}
              </pre>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Permission Lookup</h3>
              <pre className="text-sm text-gray-700 bg-white p-3 rounded border overflow-x-auto">
{`<PermissionSearch
  mode="single-select"
  variant="minimal"
  onPermissionSelect={(permission) => showPermissionDetails(permission)}
  placeholder="Quick permission lookup..."
  debounceMs={150}
/>`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PermissionSearchDemoPage;
