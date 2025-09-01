import React from 'react';
import { motion } from 'framer-motion';
import EnhancedModuleManagement from '../components/EnhancedModuleManagement';
import { useTenant } from '../contexts/TenantContext';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';

const ModuleManagementPage: React.FC = () => {
  const { propertyId, organizationId } = useTenant();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  // Check if user has any module management permissions
  const canAccess = hasPermission('module', 'manage', 'organization') || 
                   hasPermission('module', 'manage', 'property') ||
                   hasPermission('module', 'read', 'organization') ||
                   hasPermission('module', 'read', 'property');

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-brand-background flex items-center justify-center">
        <div className="max-w-md w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card text-center"
          >
            <div className="card-body py-12">
              <div className="text-6xl mb-6">🔒</div>
              <h1 className="heading-2 mb-4">Access Restricted</h1>
              <p className="text-gray-600 mb-6">
                You don't have permission to access module management features.
                Please contact your administrator if you need access.
              </p>
              <button
                onClick={() => window.history.back()}
                className="btn btn-outline"
              >
                Go Back
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-background">
      {/* Page Header */}
      <header className="bg-brand-surface border-b border-gray-200 sticky top-0 z-40">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="heading-2 text-brand-text-primary">Module Management</h1>
              <p className="text-sm text-gray-600 mt-1">
                Configure and manage system modules across your organization and properties
              </p>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.reload()}
                className="btn btn-outline btn-sm"
              >
                <span className="mr-2">🔄</span>
                Refresh
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <EnhancedModuleManagement />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-brand-surface border-t border-gray-200 mt-16">
        <div className="container py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="text-sm text-gray-600">
              <p>Module Management System</p>
              <p className="text-xs text-gray-500 mt-1">
                Configure modules to customize your hotel operations platform
              </p>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <span>Organization: {organizationId ? '✅' : '❌'}</span>
              <span>Property: {propertyId ? '✅' : '❌'}</span>
              <span>User: {user?.firstName} {user?.lastName}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ModuleManagementPage;