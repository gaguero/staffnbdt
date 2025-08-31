import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { useLanguage } from '../contexts/LanguageContext';
import { BrandLogo } from '../contexts/ThemeContext';
import { useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { UserType } from '../types/auth';
import PropertySelector from './PropertySelector';
import OrganizationSelector from './OrganizationSelector';
import Breadcrumb from './Breadcrumb';
import DynamicNavigation from './DynamicNavigation';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { getCurrentOrganizationName, getCurrentPropertyName } = useTenant();
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Get user type for dynamic navigation
  const userType = user?.userType || UserType.INTERNAL;
  
  // Helper function to format role display
  const formatRoleName = (role: string) => {
    const roleMap: Record<string, string> = {
      PLATFORM_ADMIN: 'Platform Admin',
      ORGANIZATION_OWNER: 'Organization Owner',
      ORGANIZATION_ADMIN: 'Organization Admin',
      PROPERTY_MANAGER: 'Property Manager',
      DEPARTMENT_ADMIN: 'Department Admin',
      STAFF: 'Staff Member',
      CLIENT: 'Guest',
      VENDOR: 'Vendor',
      PARTNER: 'Partner',
    };
    return roleMap[role] || role.replace('_', ' ');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Function to get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    
    // Route to title mapping
    const routeTitles: Record<string, string> = {
      '/dashboard': 'nav.dashboard',
      '/profile': 'nav.profile',
      '/users': 'nav.users',
      '/roles': 'nav.roles',
      '/admin/roles': 'nav.roles',
      '/departments': 'nav.departments',
      '/organizations': 'nav.organizations',
      '/properties': 'nav.properties',
      '/brand-studio': 'nav.brandStudio',
      '/notifications': 'nav.notifications',
      '/documents': 'nav.documents',
      '/payroll': 'nav.payroll',
      '/vacation': 'nav.vacation',
      '/training': 'nav.training',
      '/benefits': 'nav.benefits',
      '/hotel/rooms': 'nav.rooms',
      '/hotel/guests': 'nav.guests',
      '/hotel/reservations': 'nav.reservations',
    };
    
    return t(routeTitles[path] || 'nav.dashboard');
  };

  return (
    <div className="min-h-screen lg:flex" style={{ backgroundColor: 'var(--brand-background)' }}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:inset-0 flex-shrink-0`}
      >
        {/* Logo/Brand */}
        <div className="flex items-center justify-between h-20 px-4 border-b border-gray-200" style={{ backgroundColor: 'var(--brand-text-primary)' }}>
          <BrandLogo 
            variant="light"
            alt={getCurrentOrganizationName()}
            className="h-12 w-auto object-contain"
          />
          <button
            onClick={closeSidebar}
            className="lg:hidden text-white transition-colors"
            style={{ color: 'white' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--brand-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'white'}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        {/* Dynamic Navigation */}
        <DynamicNavigation 
          userType={userType}
          onItemClick={closeSidebar}
        />

        {/* User info and property selector in sidebar */}
        <div className="border-t border-gray-200 p-4 space-y-3">
          {/* Organization Selector for platform admins */}
          <OrganizationSelector className="w-full" />
          {/* Property Selector */}
          <div>
            <PropertySelector 
              variant="dropdown" 
              showOrganization={true}
              className="w-full"
            />
          </div>
          
          {/* User Info */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium" style={{ backgroundColor: 'var(--brand-primary)' }}>
              {user?.firstName?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--brand-text-primary)' }}>
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.role ? formatRoleName(user.role) : 'User'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="border-b border-gray-200" style={{ backgroundColor: 'var(--brand-surface)', boxShadow: 'var(--brand-shadow-soft)' }}>
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            {/* Mobile menu button */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden transition-colors focus:outline-none rounded-md p-2"
              style={{ color: 'var(--brand-text-primary)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--brand-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--brand-text-primary)'}
              onFocus={(e) => {
                e.currentTarget.style.outline = 'none';
                e.currentTarget.style.boxShadow = '0 0 0 2px var(--brand-primary)';
              }}
              onBlur={(e) => e.currentTarget.style.boxShadow = ''}
              aria-label="Open sidebar"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Page title with tenant context */}
            <div className="flex-1 lg:ml-0 ml-4">
              <h1 className="text-2xl uppercase" style={{ fontFamily: 'var(--brand-font-heading)', color: 'var(--brand-text-primary)' }}>
                {getPageTitle()}
              </h1>
              <div className="text-xs text-gray-500 mt-1 lg:hidden">
                {getCurrentOrganizationName()} • {getCurrentPropertyName()}
              </div>
            </div>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              {/* Property Selector for desktop header */}
              <div className="hidden lg:block min-w-[240px]">
                <OrganizationSelector variant="compact" />
              </div>
              
              {/* Language Switcher */}
              <button
                onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
                className="flex items-center space-x-1 px-3 py-1 text-sm font-medium transition-colors border border-gray-300 rounded-md"
                style={{ color: 'var(--brand-text-primary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--brand-primary)';
                  e.currentTarget.style.borderColor = 'var(--brand-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--brand-text-primary)';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
                aria-label="Switch language"
              >
                <span>{language === 'en' ? '🇬🇧' : '🇪🇸'}</span>
                <span>{language === 'en' ? 'EN' : 'ES'}</span>
              </button>

              {/* Notifications (placeholder) */}
              <button
                className="transition-colors focus:outline-none rounded-md p-2"
                style={{ color: 'var(--brand-text-primary)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--brand-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--brand-text-primary)'}
                onFocus={(e) => {
                  e.currentTarget.style.outline = 'none';
                  e.currentTarget.style.boxShadow = '0 0 0 2px var(--brand-primary)';
                }}
                onBlur={(e) => e.currentTarget.style.boxShadow = ''}
                aria-label="Notifications"
              >
                <span className="text-lg">🔔</span>
              </button>

              {/* User dropdown */}
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:flex sm:flex-col sm:items-end">
                    <p className="text-sm font-medium" style={{ color: 'var(--brand-text-primary)' }}>
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.role ? formatRoleName(user.role) : 'User'}
                    </p>
                  </div>
                  <button
                    onClick={logout}
                    className="btn btn-outline btn-sm"
                  >
                    {t('nav.signOut')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {/* Breadcrumb Navigation */}
            <div className="mb-6">
              <Breadcrumb />
            </div>
            
            {children}
          </div>
        </main>
      </div>
      
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#FFFFFF',
            color: '#1F2937',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
    </div>
  );
};

export default Layout;