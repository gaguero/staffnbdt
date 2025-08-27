import React from 'react';
import RoleStatsDashboard from '../components/RoleStatsDashboard/RoleStatsDashboard';
import PermissionGate from '../components/PermissionGate';

const RoleStatsDashboardPage: React.FC = () => {
  return (
    <PermissionGate resource="role" action="read" fallback={
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🚫</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">
          You don't have permission to view role analytics. Contact your administrator for access.
        </p>
      </div>
    }>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <RoleStatsDashboard />
        </div>
      </div>
    </PermissionGate>
  );
};

export default RoleStatsDashboardPage;