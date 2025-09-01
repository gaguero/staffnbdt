import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useModuleNavigation, usePropertyModules } from '../hooks/useModules';
import { usePermissions } from '../hooks/usePermissions';
import { UserType } from '../types/auth';
import { NavItem } from '../services/moduleRegistryService';

interface NavigationSection {
  title: string;
  items: (NavItem & { moduleId?: string })[];
  category?: string;
  icon?: string;
  isCollapsible?: boolean;
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
    icon: '🏠',
    isCollapsible: false,
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

  // Hotel Operations - Core features (always visible)
  const hotelOperationsSection: NavigationSection = {
    title: 'Hotel Operations',
    category: 'hotel-operations',
    icon: '🏨',
    isCollapsible: true,
    items: [
      {
        id: 'reservations',
        label: 'nav.reservations',
        path: '/hotel/reservations',
        icon: '📅',
        requiredPermissions: ['reservation.read.property'],
      },
      {
        id: 'guests',
        label: 'nav.guests',
        path: '/hotel/guests',
        icon: '👨‍👩‍👧‍👦',
        requiredPermissions: ['guest.read.property'],
      },
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
      }
    ]
  };
  
  // Guest Services - Module-based features
  const guestServicesSection: NavigationSection = {
    title: 'Guest Services',
    category: 'guest-services',
    icon: '🎯',
    isCollapsible: true,
    items: [
      {
        id: 'concierge',
        label: 'nav.concierge',
        path: '/concierge',
        icon: '🛎️',
        requiredPermissions: ['concierge.objects.read.property'],
        moduleId: 'concierge',
      },
      {
        id: 'today-board',
        label: 'nav.todayBoard',
        path: '/concierge/today',
        icon: '📋',
        requiredPermissions: ['concierge.objects.read.property'],
        moduleId: 'concierge',
      },
      {
        id: 'reservation-360',
        label: 'nav.reservation360',
        path: '/concierge/reservation-360',
        icon: '🎯',
        requiredPermissions: ['concierge.objects.read.property'],
        moduleId: 'concierge',
      },
      {
        id: 'vendors',
        label: 'nav.vendors',
        path: '/vendors',
        icon: '🤝',
        requiredPermissions: ['vendors.read.property'],
        moduleId: 'vendors',
      }
    ]
  };
  
  // Employee Services - Module-based features
  const employeeServicesSection: NavigationSection = {
    title: 'Employee Services',
    category: 'employee-services',
    icon: '👥',
    isCollapsible: true,
    items: [
      {
        id: 'payroll',
        label: 'nav.payroll',
        path: '/payroll',
        icon: '💰',
        requiredPermissions: ['payroll.read.own'],
        moduleId: 'hr',
      },
      {
        id: 'vacation',
        label: 'nav.vacation',
        path: '/vacation',
        icon: '🏖️',
        requiredPermissions: ['vacation.read.own'],
        moduleId: 'hr',
      },
      {
        id: 'training',
        label: 'nav.training',
        path: '/training',
        icon: '🎓',
        requiredPermissions: ['training.read.own', 'training.read.department'],
        moduleId: 'hr',
      },
      {
        id: 'benefits',
        label: 'nav.benefits',
        path: '/benefits',
        icon: '🎁',
        requiredPermissions: [],
        moduleId: 'hr',
      }
    ]
  };
  
  // Documents - Core feature
  const documentsSection: NavigationSection = {
    title: 'Documents',
    category: 'documents',
    icon: '📄',
    isCollapsible: true,
    items: [
      {
        id: 'documents',
        label: 'nav.documents',
        path: '/documents',
        icon: '📄',
        requiredPermissions: ['document.read.own'],
      }
    ]
  };
  
  // Administration - Settings and management
  const administrationSection: NavigationSection = {
    title: 'Administration',
    category: 'administration',
    icon: '⚙️',
    isCollapsible: true,
    items: [
      {
        id: 'users',
        label: 'nav.users',
        path: '/users',
        icon: '👥',
        requiredPermissions: ['user.read.department'],
      },
      {
        id: 'departments',
        label: 'nav.departments',
        path: '/departments',
        icon: '🏢',
        requiredPermissions: ['department.read.organization', 'department.manage.organization'],
      },
      {
        id: 'vendors',
        label: 'nav.vendors',
        path: '/vendors',
        icon: '🤝',
        requiredPermissions: ['vendors.read.property'],
        moduleId: 'vendors',
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
  };
  
  if (userType === UserType.INTERNAL) {
    return [
      dashboardSection,
      hotelOperationsSection,
      guestServicesSection,
      employeeServicesSection,
      documentsSection,
      administrationSection
    ];
  }

  if (userType === UserType.CLIENT) {
    return [
      dashboardSection,
      {
        title: 'Guest Services',
        category: 'guest-services',
        icon: '🎯',
        isCollapsible: true,
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
      },
      {
        title: 'Profile',
        category: 'profile',
        icon: '👤',
        isCollapsible: true,
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
      }
    ];
  }

  if (userType === UserType.VENDOR) {
    return [
      dashboardSection,
      {
        title: 'Vendor Tools',
        category: 'vendor-tools',
        icon: '🔧',
        isCollapsible: true,
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
      {
        title: 'Partner Portal',
        category: 'partner-portal',
        icon: '🤝',
        isCollapsible: true,
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
  return [dashboardSection];
};

const DynamicNavigation: React.FC<DynamicNavigationProps> = ({ userType, onItemClick }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { hasPermission } = usePermissions();
  const { isModuleEnabled, isLoading: isLoadingModules } = usePropertyModules();
  const location = useLocation();
  
  const { navigationItems, isLoading, error } = useModuleNavigation(userType);
  
  // Collapsible section state - load from localStorage
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('nav-expanded');
      return saved ? JSON.parse(saved) : {
        'hotel-operations': true, // Keep hotel operations expanded by default
        'dashboard': true // Dashboard is always expanded (single item)
      };
    } catch {
      return { 'hotel-operations': true, 'dashboard': true };
    }
  });
  
  // Toggle section expansion
  const toggleSection = useCallback((sectionKey: string) => {
    const newState = {
      ...expandedSections,
      [sectionKey]: !expandedSections[sectionKey]
    };
    setExpandedSections(newState);
    try {
      localStorage.setItem('nav-expanded', JSON.stringify(newState));
    } catch (error) {
      console.warn('Failed to save navigation state to localStorage:', error);
    }
  }, [expandedSections]);
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent, sectionKey: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleSection(sectionKey);
    }
  }, [toggleSection]);

  // Build navigation sections from module data
  const navigationSections = useMemo(() => {
    if (isLoading || isLoadingModules) {
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
        // Check module enablement first (if item requires a module)
        if ((item as any).moduleId) {
          const moduleEnabled = isModuleEnabled((item as any).moduleId);
          if (!moduleEnabled) {
            return false;
          }
        }
        
        // If no permissions required, show (assuming module check passed)
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
  }, [navigationSections, user, hasPermission, isModuleEnabled]);

  // Auto-expand section containing current active page
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Find which section contains the current path
    const activeSection = filteredNavSections.find(section => {
      return section.items.some(item => {
        // Check if current path matches or is a sub-path of this nav item
        return currentPath === item.path || currentPath.startsWith(item.path + '/');
      });
    });
    
    if (activeSection) {
      const activeSectionKey = activeSection.category || activeSection.title.toLowerCase().replace(/\s+/g, '-');
      
      // Only expand if it's currently collapsed and collapsible
      if (activeSection.isCollapsible && !expandedSections[activeSectionKey]) {
        const newState = {
          ...expandedSections,
          [activeSectionKey]: true
        };
        setExpandedSections(newState);
        localStorage.setItem('nav-expanded', JSON.stringify(newState));
      }
    }
  }, [location.pathname, filteredNavSections, expandedSections]);

  if (isLoading || isLoadingModules) {
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

  // Helper function to render navigation item
  const renderNavItem = (item: NavItem & { moduleId?: string }) => {
    const isCurrentPath = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
    
    return (
      <NavLink
        key={item.id}
        to={item.path}
        onClick={onItemClick}
        className={({ isActive }) => `
          nav-item flex items-center px-4 py-2 text-sm font-medium rounded-lg ml-6
          ${isActive || isCurrentPath ? 
            'active text-white shadow-sm' : 
            'text-gray-700 hover:text-gray-900'
          }
        `}
        style={({ isActive }) => isActive || isCurrentPath ? {
          backgroundColor: 'var(--brand-primary)',
          color: 'white',
          boxShadow: 'var(--brand-shadow-soft)'
        } : {}}
      >
        {item.icon && (
          <span className="mr-3 text-base flex-shrink-0" role="img" aria-hidden="true">
            {item.icon}
          </span>
        )}
        <span className="truncate">{t(item.label)}</span>
        {(location.pathname === item.path || location.pathname.startsWith(item.path + '/')) && (
          <div className="ml-auto w-2 h-2 bg-white bg-opacity-80 rounded-full" />
        )}
      </NavLink>
    );
  };

  // Helper function to render collapsible section
  const renderSection = (section: NavigationSection) => {
    const sectionKey = section.category || section.title.toLowerCase().replace(/\s+/g, '-');
    const isExpanded = expandedSections[sectionKey];
    const hasItems = section.items.length > 0;
    const hasActiveItem = section.items.some(item => 
      location.pathname === item.path || location.pathname.startsWith(item.path + '/')
    );
    
    if (!hasItems) return null;

    // Non-collapsible sections (like Dashboard)
    if (!section.isCollapsible) {
      return (
        <div key={section.title} className="space-y-1 mb-4">
          {section.items.map(renderNavItem)}
        </div>
      );
    }

    return (
      <div key={section.title} className="mb-2">
        {/* Section Header */}
        <button
          onClick={() => toggleSection(sectionKey)}
          onKeyDown={(e) => handleKeyDown(e, sectionKey)}
          className={`
            nav-section-header w-full px-4 py-3 text-sm font-semibold 
            flex items-center justify-between group rounded-lg
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            ${
              hasActiveItem 
                ? 'has-active text-gray-900' 
                : 'text-gray-600 hover:text-gray-900'
            }
          `}
          aria-expanded={isExpanded}
          aria-controls={`section-${sectionKey}`}
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${section.title} section`}
          type="button"
        >
          <div className="flex items-center space-x-3">
            {section.icon && (
              <span 
                className="text-lg group-hover:scale-110 transition-transform duration-200 flex-shrink-0" 
                role="img" 
                aria-hidden="true"
              >
                {section.icon}
              </span>
            )}
            <span className="uppercase tracking-wider text-xs font-bold truncate">
              {section.title}
            </span>
            {hasActiveItem && (
              <div className="nav-active-indicator w-2 h-2 bg-blue-500 rounded-full ml-2 flex-shrink-0" />
            )}
          </div>
          <span 
            className={`nav-section-toggle text-gray-400 flex-shrink-0 ${
              isExpanded ? 'expanded' : ''
            }`}
            aria-hidden="true"
          >
            ▶
          </span>
        </button>
        
        {/* Section Items - with smooth height transition */}
        <div 
          id={`section-${sectionKey}`}
          className={`nav-section-content overflow-hidden ${
            isExpanded ? 'expanded' : 'collapsed'
          }`}
          style={{
            maxHeight: isExpanded ? `${section.items.length * 52 + 24}px` : '0px'
          }}
          role="region"
          aria-labelledby={`section-${sectionKey}-header`}
        >
          <div className="space-y-1 pb-3 pt-2">
            {isExpanded && section.items.map(renderNavItem)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <nav className="flex-1 px-2 py-6 space-y-1" role="navigation" aria-label="Main navigation">
      {filteredNavSections.map(renderSection)}
      
      {error && (
        <div className="mx-2 my-4 py-3 text-sm text-red-600 bg-red-50 rounded-lg px-4 border border-red-200" role="alert">
          <strong className="font-medium">{t('nav.errorLoading')}:</strong> {error}
        </div>
      )}
      
      {/* Debug info for development */}
      {import.meta.env.DEV && (
        <div className="mx-2 mt-8 p-2 text-xs text-gray-500 bg-gray-50 rounded border">
          <div>Current path: {location.pathname}</div>
          <div>Sections: {filteredNavSections.length}</div>
          <div>Expanded: {Object.keys(expandedSections).filter(k => expandedSections[k]).join(', ')}</div>
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