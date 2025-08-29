import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isInternalUser, isExternalUser } from '../types/auth';
import Layout from './Layout';
import RoleBasedDashboard from './RoleBasedDashboard';
import LoadingSpinner from './LoadingSpinner';

// Portal-specific layouts and components
const InternalPortal: React.FC = () => {
  return (
    <Layout>
      <RoleBasedDashboard />
    </Layout>
  );
};

const ClientPortal: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Client-specific header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Guest Portal
              </h1>
            </div>
            <div className="text-sm text-gray-600">
              Welcome, Guest
            </div>
          </div>
        </div>
      </header>
      
      {/* Client-specific content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RoleBasedDashboard />
      </main>
    </div>
  );
};

const VendorPortal: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Vendor-specific header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Vendor Portal
              </h1>
            </div>
            <div className="text-sm text-gray-600">
              Business Partner Access
            </div>
          </div>
        </div>
      </header>
      
      {/* Vendor-specific content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RoleBasedDashboard />
      </main>
    </div>
  );
};

const PartnerPortal: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-100">
      {/* Partner-specific header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Partner Portal
              </h1>
            </div>
            <div className="text-sm text-gray-600">
              Strategic Partner Access
            </div>
          </div>
        </div>
      </header>
      
      {/* Partner-specific content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RoleBasedDashboard />
      </main>
    </div>
  );
};

const DefaultPortal: React.FC = () => {
  const { user, logout } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="text-4xl mb-4">🚫</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Access Not Configured
          </h2>
          <p className="text-gray-600 mb-4">
            Your user type ({user?.userType}) doesn't have a configured portal access.
            Please contact your administrator.
          </p>
          <button
            onClick={logout}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

const PortalRouter: React.FC = () => {
  const { user, isLoading } = useAuth();
  
  // Show loading state while user data is being fetched
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading portal..." />
      </div>
    );
  }

  // No user means not authenticated - this should be handled by route protection
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600">
            Please sign in to access the portal.
          </p>
        </div>
      </div>
    );
  }

  // Route users to appropriate portal based on userType
  if (isInternalUser(user)) {
    return <InternalPortal />;
  } else if (isExternalUser(user)) {
    const userType = user.userType || 'CLIENT';
    switch (userType) {
      case 'CLIENT':
        return <ClientPortal />;
      case 'VENDOR':
        return <VendorPortal />;
      case 'PARTNER':
        return <PartnerPortal />;
      default:
        return <DefaultPortal />;
    }
  }
  
  // Fallback for unknown user types
  return <DefaultPortal />;
};

export default PortalRouter;