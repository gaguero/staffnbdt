import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { useLanguage } from '../../contexts/LanguageContext';
import PermissionGate from '../../components/PermissionGate';
import EnhancedModuleManagement from '../../components/EnhancedModuleManagement';

const ModuleManagementPage: React.FC = () => {
  const { user } = useAuth();
  const { organization, property } = useTenant();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header with Breadcrumbs */}
        <div className="mb-8">
          <nav className="text-sm font-medium" aria-label="Breadcrumb">
            <ol className="list-none p-0 inline-flex">
              <li className="flex items-center">
                <a href="/dashboard" className="text-gray-400 hover:text-gray-600">
                  {t('nav.dashboard')}
                </a>
                <svg className="fill-current w-3 h-3 mx-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                  <path d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z"/>
                </svg>
              </li>
              <li className="flex items-center">
                <a href="/admin" className="text-gray-400 hover:text-gray-600">
                  {t('nav.admin')}
                </a>
                <svg className="fill-current w-3 h-3 mx-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                  <path d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z"/>
                </svg>
              </li>
              <li>
                <span className="text-gray-600">{t('nav.moduleManagement')}</span>
              </li>
            </ol>
          </nav>
        </div>

        {/* Page Title and Context */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🧩 {t('modules.management')}
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                {t('modules.pageDescription')}
              </p>
            </div>
            
            {/* Context Info */}
            <div className="text-right text-sm text-gray-600">
              {organization && (
                <div>
                  <span className="font-medium">{t('common.organization')}: </span>
                  <span className="text-gray-900">{organization.name}</span>
                </div>
              )}
              {property && (
                <div className="mt-1">
                  <span className="font-medium">{t('common.property')}: </span>
                  <span className="text-gray-900">{property.name}</span>
                </div>
              )}
              {user && (
                <div className="mt-1">
                  <span className="font-medium">{t('common.role')}: </span>
                  <span className="text-gray-900">{user.role}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <PermissionGate
          resource="module"
          action="manage"
          scope="organization"
          unauthorized={
            <div className="bg-white shadow rounded-lg p-8">
              <div className="text-center">
                <div className="text-6xl mb-4">🔒</div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  {t('modules.accessDenied')}
                </h2>
                <p className="text-gray-600 max-w-md mx-auto">
                  {t('modules.accessDeniedDescription')}
                </p>
                <div className="mt-6">
                  <button 
                    onClick={() => window.history.back()}
                    className="btn btn-secondary"
                  >
                    {t('common.goBack')}
                  </button>
                </div>
              </div>
            </div>
          }
        >
          {/* Module Management Component */}
          <div className="bg-white shadow rounded-lg p-6">
            <EnhancedModuleManagement />
          </div>

          {/* Help Section */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              💡 {t('modules.howItWorks')}
            </h3>
            <div className="space-y-3 text-blue-800">
              <p>
                <strong>{t('modules.organizationLevel')}:</strong>{' '}
                {t('modules.organizationLevelHelp')}
              </p>
              <p>
                <strong>{t('modules.propertyLevel')}:</strong>{' '}
                {t('modules.propertyLevelHelp')}
              </p>
              <p>
                <strong>{t('modules.precedence')}:</strong>{' '}
                {t('modules.precedenceHelp')}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-2xl mr-3">📊</div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {t('modules.viewAnalytics')}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {t('modules.viewAnalyticsDescription')}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-2xl mr-3">📜</div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {t('modules.viewHistory')}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {t('modules.viewHistoryDescription')}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-2xl mr-3">⚙️</div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {t('modules.bulkActions')}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {t('modules.bulkActionsDescription')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              {t('modules.lastUpdated')}: {new Date().toLocaleDateString()}
            </p>
            <p className="mt-1">
              {t('modules.needHelp')}{' '}
              <a href="/support" className="text-warm-gold hover:text-primary-600 underline">
                {t('common.contactSupport')}
              </a>
            </p>
          </div>
        </PermissionGate>
      </div>
    </div>
  );
};

export default ModuleManagementPage;