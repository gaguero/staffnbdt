import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useModuleNavigation } from '../hooks/useModules';
import { usePermissions } from '../hooks/usePermissions';
import { UserType } from '../types/auth';
import { NavItem } from '../services/moduleRegistryService';
import { isInternalUser } from '../types/auth';

interface NavigationSection {
  title: string;
  items: NavItem[];
  category?: string;
}

interface DynamicNavigationProps {
  userType: UserType;
  onItemClick?: () => void;
}

// Default navigation sections for different user types
const getDefaultNavigation = (userType: UserType): NavigationSection[] => {
  const dashboardSection: NavigationSection = {
    title: 'Dashboard',
    items: [
      {
        id: 'dashboard',
        label: 'nav.dashboard',
        path: '/dashboard',
        icon: '📊',
        requiredPermissions: [],
      },
      {
        id: 'profile',
        label: 'nav.profile',
        path: '/profile',
        icon: '👤',
        requiredPermissions: [],
      }
    ]
  };

  if (userType === UserType.INTERNAL) {
    return [
      dashboardSection,
      {
        title: 'System',
        items: [
          {
            id: 'notifications',
            label: 'nav.notifications',
            path: '/notifications',
            icon: '🔔',
            requiredPermissions: [],
          }
        ]
      }
    ];
  }

  // External users get minimal default navigation
  return [dashboardSection];
};

const DynamicNavigation: React.FC<DynamicNavigationProps> = ({ userType, onItemClick }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { hasPermission } = usePermissions();
  
  const { navigationItems, isLoading, error } = useModuleNavigation(userType);

  // Build navigation sections from module data
  const navigationSections = useMemo(() => {
    if (isLoading) {
      return getDefaultNavigation(userType);
    }

    if (error || navigationItems.length === 0) {
      return getDefaultNavigation(userType);
    }

    // Group navigation items by category
    const categoryMap = new Map<string, NavItem[]>();
    
    navigationItems.forEach(item => {
      // Extract category from path or use a default
      const pathParts = item.path.split('/').filter(Boolean);
      const category = pathParts[0] || 'General';
      
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(item);
    });

    // Convert to navigation sections
    const sections: NavigationSection[] = [];
    
    categoryMap.forEach((items, category) => {
      // Filter items based on user permissions
      const filteredItems = items.filter(item => {
        if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
          return true;
        }
        
        return item.requiredPermissions.every(permission => {
          const [resource, action, scope] = permission.split('.');
          return hasPermission(resource, action, scope || 'own');
        });
      });

      if (filteredItems.length > 0) {
        sections.push({
          title: getCategoryTitle(category),
          category,
          items: filteredItems
        });
      }
    });

    // Always include default sections
    const defaultSections = getDefaultNavigation(userType);
    return [...defaultSections, ...sections];
  }, [navigationItems, userType, hasPermission, isLoading, error]);

  // Filter sections based on user role for internal users
  const filteredNavSections = useMemo(() => {
    if (!user) return navigationSections;

    if (isInternalUser(user)) {
      // For internal users, filter by role
      return navigationSections.map(section => ({
        ...section,
        items: section.items.filter(item => {
          // Check if item has role restrictions
          if (item.requiredPermissions && item.requiredPermissions.length > 0) {
            return item.requiredPermissions.every(permission => {
              const [resource, action, scope] = permission.split('.');
              return hasPermission(resource, action, scope || 'own');
            });
          }
          return true;
        })
      })).filter(section => section.items.length > 0);
    }

    // For external users, return all sections (already filtered by module permissions)
    return navigationSections;
  }, [navigationSections, user, hasPermission]);

  if (isLoading) {
    return (
      <nav className="flex-1 px-4 py-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="flex-1 px-4 py-6 space-y-6">
      {filteredNavSections.map((section) => (
        <div key={section.title}>
          <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {t(`nav.${section.category?.toLowerCase()}`) || section.title}
          </h3>
          <div className="space-y-1">
            {section.items.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={onItemClick}
                className="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200"
                style={({ isActive }) => isActive ? {
                  backgroundColor: 'var(--brand-primary)',
                  color: 'white',
                  boxShadow: 'var(--brand-shadow-soft)'
                } : {
                  color: 'var(--brand-text-primary)'
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.backgroundColor = 'var(--brand-surface-hover)';
                    e.currentTarget.style.color = 'var(--brand-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.backgroundColor = '';
                    e.currentTarget.style.color = 'var(--brand-text-primary)';
                  }
                }}
              >
                {item.icon && (
                  <span className="mr-3 text-lg" role="img" aria-hidden="true">
                    {item.icon}
                  </span>
                )}
                {t(item.label)}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
      
      {error && (
        <div className="px-4 py-3 text-sm text-red-600 bg-red-50 rounded-lg">
          {t('nav.errorLoading')}: {error}
        </div>
      )}
    </nav>
  );
};

// Helper function to get category titles
function getCategoryTitle(category: string): string {
  const categoryTitles: Record<string, string> = {
    dashboard: 'Dashboard',
    hotel: 'Hotel Operations',
    staff: 'Staff Management',
    admin: 'Administration',
    system: 'System',
    hr: 'Human Resources',
    inventory: 'Inventory',
    maintenance: 'Maintenance',
    frontdesk: 'Front Desk',
    housekeeping: 'Housekeeping',
    food: 'Food & Beverage',
    finance: 'Finance',
    reporting: 'Reporting',
    crm: 'Customer Relations',
    vendor: 'Vendor Portal',
    client: 'Client Portal',
    partner: 'Partner Portal',
  };

  return categoryTitles[category.toLowerCase()] || category;
}

export default DynamicNavigation;