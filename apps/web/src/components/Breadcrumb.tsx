import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTenant } from '../contexts/TenantContext';
import { useLanguage } from '../contexts/LanguageContext';

interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: string;
  isActive?: boolean;
}

interface BreadcrumbProps {
  className?: string;
  showHome?: boolean;
  customItems?: BreadcrumbItem[];
}

/**
 * Breadcrumb Navigation Component
 * Provides context-aware navigation breadcrumbs
 * Automatically generates breadcrumbs based on current route and tenant context
 */
const Breadcrumb: React.FC<BreadcrumbProps> = ({
  className = '',
  showHome = true,
  customItems,
}) => {
  const location = useLocation();
  const { getCurrentOrganizationName, getCurrentPropertyName } = useTenant();
  const { t } = useLanguage();

  // Route to breadcrumb mapping
  const routeMap: Record<string, { label: string; icon?: string; parent?: string }> = {
    '/dashboard': { label: 'nav.dashboard', icon: '📊' },
    '/profile': { label: 'nav.profile', icon: '👤' },
    '/organizations': { label: 'nav.organizations', icon: '🏨' },
    '/properties': { label: 'nav.properties', icon: '🏠' },
    '/departments': { label: 'nav.departments', icon: '🏢' },
    '/users': { label: 'nav.users', icon: '👥' },
    '/documents': { label: 'nav.documents', icon: '📁' },
    '/payroll': { label: 'nav.payroll', icon: '💰' },
    '/vacation': { label: 'nav.vacation', icon: '🏖️' },
    '/training': { label: 'nav.training', icon: '🎓' },
    '/benefits': { label: 'nav.benefits', icon: '🎁' },
    '/notifications': { label: 'nav.notifications', icon: '🔔' },
    '/brand-studio': { label: 'nav.brandStudio', icon: '🎨' },
  };

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (customItems) {
      return customItems;
    }

    const items: BreadcrumbItem[] = [];

    // Add home/dashboard if enabled
    if (showHome && location.pathname !== '/dashboard') {
      items.push({
        label: t('nav.dashboard'),
        path: '/dashboard',
        icon: '🏠',
      });
    }

    // Add tenant context for non-dashboard pages
    if (location.pathname !== '/dashboard') {
      const orgName = getCurrentOrganizationName();
      const propName = getCurrentPropertyName();

      // Add organization context
      if (orgName && orgName !== 'Unknown Organization') {
        items.push({
          label: orgName,
          path: '/organizations',
          icon: '🏨',
        });
      }

      // Add property context for property-specific pages
      if (propName && propName !== 'Unknown Property' && location.pathname !== '/organizations') {
        items.push({
          label: propName,
          path: '/properties',
          icon: '🏠',
        });
      }
    }

    // Add current page
    const currentRoute = routeMap[location.pathname];
    if (currentRoute) {
      items.push({
        label: t(currentRoute.label),
        icon: currentRoute.icon,
        isActive: true,
      });
    }

    return items;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className={`flex items-center space-x-1 text-sm ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1">
        {breadcrumbs.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-gray-400" aria-hidden="true">
                /
              </span>
            )}
            
            {item.isActive || !item.path ? (
              <span className="flex items-center space-x-1 text-gray-900 font-medium">
                {item.icon && (
                  <span className="text-base" role="img" aria-hidden="true">
                    {item.icon}
                  </span>
                )}
                <span>{item.label}</span>
              </span>
            ) : (
              <Link
                to={item.path}
                className="flex items-center space-x-1 text-gray-600 hover:text-warm-gold transition-colors"
              >
                {item.icon && (
                  <span className="text-base" role="img" aria-hidden="true">
                    {item.icon}
                  </span>
                )}
                <span>{item.label}</span>
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;