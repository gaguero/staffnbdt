import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useModules } from '../hooks/useModules';
import { useLanguage } from '../contexts/LanguageContext';
import { canManageModules } from '../types/auth';
import PermissionGate from './PermissionGate';
import LoadingSpinner from './LoadingSpinner';

const ModuleManagement: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const {
    enabledModules,
    allModules,
    isLoadingModules,
    isLoadingAllModules,
    enableModule,
    disableModule,
    isEnablingModule,
    isDisablingModule,
    error,
  } = useModules();

  if (!user) {
    return (
      <div className="text-center text-gray-500 py-8">
        {t('auth.notAuthenticated')}
      </div>
    );
  }

  if (!canManageModules(user)) {
    return (
      <div className="text-center text-gray-500 py-8">
        <div className="text-4xl mb-4">🚫</div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {t('modules.accessDenied')}
        </h2>
        <p className="text-gray-600">
          {t('modules.accessDeniedDescription')}
        </p>
      </div>
    );
  }

  if (isLoadingModules || isLoadingAllModules) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text={t('modules.loading')} />
      </div>
    );
  }

  const handleEnableModule = (moduleId: string) => {
    if (user?.organizationId) {
      enableModule({ organizationId: user.organizationId, moduleId });
    }
  };

  const handleDisableModule = (moduleId: string) => {
    if (user?.organizationId) {
      disableModule({ organizationId: user.organizationId, moduleId });
    }
  };

  const enabledModuleIds = enabledModules.map(m => m.moduleId);

  return (
    <PermissionGate
      resource="module"
      action="manage"
      scope="organization"
      unauthorized={
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {t('modules.permissionRequired')}
          </h2>
          <p className="text-gray-600">
            {t('modules.permissionRequiredDescription')}
          </p>
        </div>
      }
    >
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('modules.management')}
          </h1>
          <p className="text-gray-600 mt-2">
            {t('modules.managementDescription')}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="text-red-400 text-sm">⚠️</div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {t('modules.error')}
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enabled Modules Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t('modules.enabledModules')} ({enabledModules.length})
          </h2>
          
          {enabledModules.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-4">📦</div>
              <p className="text-gray-600">
                {t('modules.noEnabledModules')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {enabledModules.map(module => (
                <div key={module.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {module.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {module.description || t('modules.noDescription')}
                      </p>
                      <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                        <span>{t('modules.category')}: {module.category}</span>
                        <span>{t('modules.version')}: {module.version}</span>
                      </div>
                      {module.isSystemModule && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                          {t('modules.systemModule')}
                        </span>
                      )}
                    </div>
                    {!module.isSystemModule && (
                      <button
                        onClick={() => handleDisableModule(module.moduleId)}
                        disabled={isDisablingModule}
                        className="ml-4 px-3 py-1 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-50"
                      >
                        {isDisablingModule ? t('modules.disabling') : t('modules.disable')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Modules Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t('modules.availableModules')}
          </h2>
          
          {allModules.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-4">🏪</div>
              <p className="text-gray-600">
                {t('modules.noAvailableModules')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allModules
                .filter(module => !enabledModuleIds.includes(module.moduleId))
                .map(module => (
                  <div key={module.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {module.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {module.description || t('modules.noDescription')}
                        </p>
                        <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                          <span>{t('modules.category')}: {module.category}</span>
                          <span>{t('modules.version')}: {module.version}</span>
                        </div>
                        {module.dependencies && module.dependencies.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs text-gray-500">
                              {t('modules.dependencies')}: {module.dependencies.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleEnableModule(module.moduleId)}
                        disabled={isEnablingModule}
                        className="ml-4 px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50"
                      >
                        {isEnablingModule ? t('modules.enabling') : t('modules.enable')}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Module Statistics */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t('modules.statistics')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {enabledModules.length}
              </div>
              <div className="text-sm text-gray-600">
                {t('modules.enabledCount')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {allModules.length}
              </div>
              <div className="text-sm text-gray-600">
                {t('modules.availableCount')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {allModules.filter(m => m.isSystemModule).length}
              </div>
              <div className="text-sm text-gray-600">
                {t('modules.systemCount')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PermissionGate>
  );
};

export default ModuleManagement;