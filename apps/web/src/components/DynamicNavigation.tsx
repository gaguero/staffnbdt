import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useModuleNavigation } from '../hooks/useModules';
import { usePermissions } from '../hooks/usePermissions';
import { UserType } from '../types/auth';
import { NavItem } from '../services/moduleRegistryService';

interface NavigationSection {
  title: string;
  items: NavItem[];
  category?: string;
}

interface DynamicNavigationProps {
  userType: UserType;
  onItemClick?: () => void;
}

// Enhanced navigation sections for different user types with role-based visibility
const getDefaultNavigation = (userType: UserType): NavigationSection[] => {
  const dashboardSection: NavigationSection = {
    title: 'Dashboard',
    category: 'dashboard',
    items: [
      {
        id: 'dashboard',
        label: 'nav.dashboard',
        path: '/dashboard',
        icon: '📊',
        requiredPermissions: [],
      }
    ]
  };

  const profileSection: NavigationSection = {
    title: 'Profile Management',
    category: 'profile',
    items: [
      {
        id: 'profile',
        label: 'nav.profile',
        path: '/profile',
        icon: '👤',
        requiredPermissions: [],
      },
      {
        id: 'notifications',
        label: 'nav.notifications',
        path: '/notifications',
        icon: '🔔',
        requiredPermissions: [],
      }
    ]
  };

  if (userType === UserType.INTERNAL) {
    return [
      dashboardSection,
      profileSection,
      {
        title: 'HR Tools',
        category: 'hr',
        items: [
          {
            id: 'users',
            label: 'nav.users',
            path: '/users',
            icon: '👥',
            requiredPermissions: ['user.read.department'],
          },
          {
            id: 'payroll',
            label: 'nav.payroll',
            path: '/payroll',
            icon: '💰',
            requiredPermissions: ['payroll.read.own'],
          },
          {
            id: 'vacation',
            label: 'nav.vacation',
            path: '/vacation',
            icon: '🏖️',
            requiredPermissions: ['vacation.read.own'],
          },
          {
            id: 'training',
            label: 'nav.training',
            path: '/training',
            icon: '🎓',
            requiredPermissions: ['training.read.own', 'training.read.department'],
          }
        ]
      },
      {
        title: 'Administrative Tools',
        category: 'admin',
        items: [
          {
            id: 'departments',
            label: 'nav.departments',
            path: '/departments',
            icon: '🏢',
            requiredPermissions: ['department.read.organization', 'department.manage.organization'],
          },
          {
            id: 'organizations',
            label: 'nav.organizations',
            path: '/organizations',
            icon: '🏛️',
            requiredPermissions: ['organization.read.platform', 'organization.manage.platform'],
          },
          {
            id: 'properties',
            label: 'nav.properties',
            path: '/properties',
            icon: '🏨',
            requiredPermissions: ['property.read.organization', 'property.manage.organization'],
          },
          {
            id: 'roles',
            label: 'nav.roles',
            path: '/admin/roles',
            icon: '🔐',
            requiredPermissions: ['role.read.organization', 'role.manage.organization'],
          },
          {
            id: 'brand-studio',
            label: 'nav.brandStudio',
            path: '/brand-studio',
            icon: '🎨',
            requiredPermissions: ['branding.read.organization', 'branding.manage.organization'],
          },
          {
            id: 'module-management',
            label: 'nav.moduleManagement',
            path: '/admin/modules',
            icon: '🧩',
            requiredPermissions: ['module.manage.organization'],
          }
        ]
      },
      {
        title: 'Hotel Operations',
        category: 'hotel',
        items: [
          {
            id: 'rooms',
            label: 'nav.rooms',
            path: '/hotel/rooms',
            icon: '🛏️',
            requiredPermissions: ['unit.read.property'],
          },
          {
            id: 'room-types',
            label: 'nav.roomTypes',
            path: '/hotel/room-types',
            icon: '🏷️',
            requiredPermissions: ['roomtype.read.property'],
          },
          {
            id: 'guests',
            label: 'nav.guests',
            path: '/hotel/guests',
            icon: '👨‍👩‍👧‍👦',
            requiredPermissions: ['guest.read.property'],
          },
          {
            id: 'reservations',
            label: 'nav.reservations',
            path: '/hotel/reservations',
            icon: '📅',
            requiredPermissions: ['reservation.read.property'],
          },
          {
            id: 'concierge',
            label: 'nav.concierge',
            path: '/concierge',
            icon: '🛎️',
            requiredPermissions: ['concierge.read.property'],
          },
          {
            id: 'vendors',
            label: 'nav.vendors',
            path: '/vendors',
            icon: '🤝',
            requiredPermissions: ['vendors.read.property'],
          }
        ]
      },
      {
        title: 'Employee Services',
        category: 'services',
        items: [
          {
            id: 'documents',
            label: 'nav.documents',
            path: '/documents',
            icon: '📄',
            requiredPermissions: ['document.read.own'],
          },
          {
            id: 'benefits',
            label: 'nav.benefits',
            path: '/benefits',
            icon: '🎁',
            requiredPermissions: [],
          }
        ]
      },
      {
        title: 'Reports & Analytics',
        category: 'reports',
        items: [
          {
            id: 'role-stats',
            label: 'nav.roleStats',
            path: '/admin/role-stats',
            icon: '📊',
            requiredPermissions: ['analytics.view.department'],
          }
        ]
      }
    ];
  }

  if (userType === UserType.CLIENT) {
    return [
      dashboardSection,
      profileSection,
      {
        title: 'Guest Services',
        category: 'guest',
        items: [
          {
            id: 'reservations',
            label: 'nav.myReservations',
            path: '/guest/reservations',
            icon: '📅',
            requiredPermissions: [],
          },
          {
            id: 'requests',
            label: 'nav.serviceRequests',
            path: '/guest/requests',
            icon: '🛎️',
            requiredPermissions: [],
          }
        ]
      }
    ];
  }

  if (userType === UserType.VENDOR) {
    return [
      dashboardSection,
      profileSection,
      {
        title: 'Vendor Tools',
        category: 'vendor',
        items: [
          {
            id: 'orders',
            label: 'nav.orders',
            path: '/vendor/orders',
            icon: '📦',
            requiredPermissions: [],
          },
          {
            id: 'invoices',
            label: 'nav.invoices',
            path: '/vendor/invoices',
            icon: '📋',
            requiredPermissions: [],
          }
        ]
      }
    ];
  }

  if (userType === UserType.PARTNER) {
    return [
      dashboardSection,
      profileSection,
      {
        title: 'Partner Portal',
        category: 'partner',
        items: [
          {
            id: 'analytics',
            label: 'nav.analytics',
            path: '/partner/analytics',
            icon: '📈',
            requiredPermissions: [],
          },
          {
            id: 'integration',
            label: 'nav.integration',
            path: '/partner/integration',
            icon: '🔗',
            requiredPermissions: [],
          }
        ]
      }
    ];
  }

  // External users get minimal default navigation
  return [dashboardSection, profileSection];
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
      // Filter items based on user permissions (OR logic) with Platform Admin bypass
      const filteredItems = items.filter(item => {
        if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
          return true;
        }

        // Platform admin bypass is handled by hasPermission hook
        // which checks effective permissions including custom roles

        return item.requiredPermissions.some(permission => {
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

  // Filter sections based on user permissions for all users
  const filteredNavSections = useMemo(() => {
    if (!user) return navigationSections;

    // Filter navigation sections by permissions for all user types
    const filtered = navigationSections.map(section => ({
      ...section,
      items: section.items.filter(item => {
        // If no permissions required, always show
        if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
          return true;
        }
        
        // Platform admin bypass is handled by hasPermission hook
        // which checks effective permissions including custom roles
        
        // Check if user has required permissions (OR logic - any permission grants access)
        return item.requiredPermissions.some(permission => {
          const [resource, action, scope] = permission.split('.');
          return hasPermission(resource, action, scope || 'own');
        });
      })
    })).filter(section => section.items.length > 0);

    return filtered;
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
    profile: 'Profile Management',
    hotel: 'Hotel Operations',
    concierge: 'Concierge',
    staff: 'Staff Management',
    admin: 'Administrative Tools',
    system: 'System',
    hr: 'HR Tools',
    inventory: 'Inventory',
    maintenance: 'Maintenance',
    frontdesk: 'Front Desk',
    housekeeping: 'Housekeeping',
    food: 'Food & Beverage',
    finance: 'Finance',
    reporting: 'Reporting',
    reports: 'Reports & Analytics',
    services: 'Employee Services',
    crm: 'Customer Relations',
    vendor: 'Vendor Tools',
    vendors: 'Vendors',
    client: 'Guest Services',
    guest: 'Guest Services',
    partner: 'Partner Portal',
  };

  return categoryTitles[category.toLowerCase()] || category;
}

export default DynamicNavigation;