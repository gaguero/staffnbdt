import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { useLanguage } from '../contexts/LanguageContext';
import { BrandLogo } from '../contexts/ThemeContext';
import { NavLink, useLocation } from 'react-router-dom';
import PropertySelector from './PropertySelector';

interface LayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles: string[];
}

const navigationItems: NavItem[] = [
  {
    label: 'nav.dashboard',
    path: '/dashboard',
    icon: '📊',
    roles: ['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'PROPERTY_MANAGER', 'DEPARTMENT_ADMIN', 'STAFF']
  },
  {
    label: 'nav.profile',
    path: '/profile',
    icon: '👤',
    roles: ['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'PROPERTY_MANAGER', 'DEPARTMENT_ADMIN', 'STAFF']
  },
  {
    label: 'nav.documents',
    path: '/documents',
    icon: '📁',
    roles: ['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'PROPERTY_MANAGER', 'DEPARTMENT_ADMIN', 'STAFF']
  },
  {
    label: 'nav.payroll',
    path: '/payroll',
    icon: '💰',
    roles: ['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'PROPERTY_MANAGER', 'DEPARTMENT_ADMIN', 'STAFF']
  },
  {
    label: 'nav.vacation',
    path: '/vacation',
    icon: '🏖️',
    roles: ['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'PROPERTY_MANAGER', 'DEPARTMENT_ADMIN', 'STAFF']
  },
  {
    label: 'nav.training',
    path: '/training',
    icon: '🎓',
    roles: ['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'PROPERTY_MANAGER', 'DEPARTMENT_ADMIN', 'STAFF']
  },
  {
    label: 'nav.benefits',
    path: '/benefits',
    icon: '🎁',
    roles: ['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'PROPERTY_MANAGER', 'DEPARTMENT_ADMIN', 'STAFF']
  },
  {
    label: 'nav.notifications',
    path: '/notifications',
    icon: '🔔',
    roles: ['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'PROPERTY_MANAGER', 'DEPARTMENT_ADMIN', 'STAFF']
  },
  {
    label: 'nav.users',
    path: '/users',
    icon: '👥',
    roles: ['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'PROPERTY_MANAGER', 'DEPARTMENT_ADMIN']
  },
  {
    label: 'nav.departments',
    path: '/departments',
    icon: '🏢',
    roles: ['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'PROPERTY_MANAGER']
  },
  {
    label: 'nav.organizations',
    path: '/organizations',
    icon: '🏨',
    roles: ['PLATFORM_ADMIN', 'PROPERTY_MANAGER']
  },
  {
    label: 'nav.properties',
    path: '/properties',
    icon: '🏠',
    roles: ['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'PROPERTY_MANAGER']
  },
  {
    label: 'nav.brandStudio',
    path: '/brand-studio',
    icon: '🎨',
    roles: ['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'PROPERTY_MANAGER']
  }
];

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { getCurrentOrganizationName, getCurrentPropertyName } = useTenant();
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredNavItems = navigationItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-sand lg:flex">
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
        <div className="flex items-center justify-between h-20 px-4 border-b border-gray-200 bg-charcoal">
          <BrandLogo 
            variant="light"
            alt={getCurrentOrganizationName()}
            className="h-12 w-auto object-contain"
          />
          <button
            onClick={closeSidebar}
            className="lg:hidden text-white hover:text-warm-gold transition-colors"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-warm-gold text-white shadow-soft'
                    : 'text-charcoal hover:bg-sand hover:text-warm-gold'
                }`
              }
            >
              <span className="mr-3 text-lg" role="img" aria-hidden="true">
                {item.icon}
              </span>
              {t(item.label)}
            </NavLink>
          ))}
        </nav>

        {/* User info and property selector in sidebar */}
        <div className="border-t border-gray-200 p-4 space-y-3">
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
            <div className="w-8 h-8 bg-warm-gold rounded-full flex items-center justify-center text-white font-medium">
              {user?.firstName?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-charcoal truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.role.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="bg-white shadow-soft border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            {/* Mobile menu button */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden text-charcoal hover:text-warm-gold transition-colors focus:outline-none focus:ring-2 focus:ring-warm-gold focus:ring-offset-2 rounded-md p-2"
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
              <h1 className="text-2xl font-heading text-charcoal uppercase">
                {t(navigationItems.find(item => item.path === location.pathname)?.label || 'nav.dashboard')}
              </h1>
              <div className="text-xs text-gray-500 mt-1 lg:hidden">
                {getCurrentOrganizationName()} • {getCurrentPropertyName()}
              </div>
            </div>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              {/* Property Selector for desktop header */}
              <div className="hidden lg:block">
                <div className="text-sm text-gray-600 text-right">
                  <div className="font-medium">{getCurrentOrganizationName()}</div>
                  <div className="text-xs opacity-75">{getCurrentPropertyName()}</div>
                </div>
              </div>
              
              {/* Language Switcher */}
              <button
                onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
                className="flex items-center space-x-1 px-3 py-1 text-sm font-medium text-charcoal hover:text-warm-gold transition-colors border border-gray-300 rounded-md hover:border-warm-gold"
                aria-label="Switch language"
              >
                <span>{language === 'en' ? '🇬🇧' : '🇪🇸'}</span>
                <span>{language === 'en' ? 'EN' : 'ES'}</span>
              </button>

              {/* Notifications (placeholder) */}
              <button
                className="text-charcoal hover:text-warm-gold transition-colors focus:outline-none focus:ring-2 focus:ring-warm-gold focus:ring-offset-2 rounded-md p-2"
                aria-label="Notifications"
              >
                <span className="text-lg">🔔</span>
              </button>

              {/* User dropdown */}
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:flex sm:flex-col sm:items-end">
                    <p className="text-sm font-medium text-charcoal">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.role.replace('_', ' ')}
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
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;