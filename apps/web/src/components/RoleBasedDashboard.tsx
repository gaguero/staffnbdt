import React, { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useModules } from '../hooks/useModules';
import { usePermissions } from '../hooks/usePermissions';
import { useLanguage } from '../contexts/LanguageContext';
import { isInternalUser, isExternalUser } from '../types/auth';
import { UserType } from '@prisma/client';
import LoadingSpinner from './LoadingSpinner';

interface DashboardWidget {
  id: string;
  title: string;
  description?: string;
  component: string;
  size: 'small' | 'medium' | 'large' | 'full';
  requiredPermissions: string[];
  userTypes: UserType[];
  data?: any;
  refreshInterval?: number;
}

interface DashboardSection {
  title: string;
  widgets: DashboardWidget[];
}

const RoleBasedDashboard: React.FC = () => {
  const { user } = useAuth();
  const { enabledModules, isLoadingModules } = useModules();
  const { hasPermission } = usePermissions();
  const { t } = useLanguage();

  // Default dashboard widgets based on user type and role
  const getDefaultDashboardWidgets = useMemo((): DashboardWidget[] => {
    if (!user) return [];

    const widgets: DashboardWidget[] = [
      {
        id: 'profile-summary',
        title: 'dashboard.profileSummary',
        description: 'Your profile overview',
        component: 'ProfileSummaryWidget',
        size: 'medium',
        requiredPermissions: [],
        userTypes: ['INTERNAL', 'CLIENT', 'VENDOR', 'PARTNER'],
      },
    ];

    if (isInternalUser(user)) {
      // Internal user widgets
      widgets.push(
        {
          id: 'notifications',
          title: 'dashboard.notifications',
          description: 'Recent notifications and alerts',
          component: 'NotificationWidget',
          size: 'medium',
          requiredPermissions: [],
          userTypes: ['INTERNAL'],
        },
        {
          id: 'quick-actions',
          title: 'dashboard.quickActions',
          description: 'Frequently used actions',
          component: 'QuickActionsWidget',
          size: 'large',
          requiredPermissions: [],
          userTypes: ['INTERNAL'],
        }
      );

      // Role-specific widgets for internal users
      if (['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN'].includes(user.role)) {
        widgets.push(
          {
            id: 'organization-overview',
            title: 'dashboard.organizationOverview',
            description: 'Organization metrics and status',
            component: 'OrganizationOverviewWidget',
            size: 'large',
            requiredPermissions: ['organization.read.organization'],
            userTypes: ['INTERNAL'],
          },
          {
            id: 'system-health',
            title: 'dashboard.systemHealth',
            description: 'System status and performance',
            component: 'SystemHealthWidget',
            size: 'medium',
            requiredPermissions: ['system.read.organization'],
            userTypes: ['INTERNAL'],
          }
        );
      }

      if (['PROPERTY_MANAGER', 'DEPARTMENT_ADMIN'].includes(user.role)) {
        widgets.push(
          {
            id: 'property-status',
            title: 'dashboard.propertyStatus',
            description: 'Property operations overview',
            component: 'PropertyStatusWidget',
            size: 'large',
            requiredPermissions: ['property.read.property'],
            userTypes: ['INTERNAL'],
          },
          {
            id: 'staff-overview',
            title: 'dashboard.staffOverview',
            description: 'Staff scheduling and status',
            component: 'StaffOverviewWidget',
            size: 'medium',
            requiredPermissions: ['user.read.department'],
            userTypes: ['INTERNAL'],
          }
        );
      }

      if (user.role === 'STAFF') {
        widgets.push(
          {
            id: 'my-schedule',
            title: 'dashboard.mySchedule',
            description: 'Your work schedule',
            component: 'ScheduleWidget',
            size: 'medium',
            requiredPermissions: [],
            userTypes: ['INTERNAL'],
          },
          {
            id: 'my-requests',
            title: 'dashboard.myRequests',
            description: 'Your pending requests',
            component: 'RequestsWidget',
            size: 'medium',
            requiredPermissions: [],
            userTypes: ['INTERNAL'],
          }
        );
      }
    } else if (isExternalUser(user)) {
      // External user widgets
      if (user.userType === 'CLIENT') {
        widgets.push(
          {
            id: 'reservations',
            title: 'dashboard.myReservations',
            description: 'Your current and upcoming reservations',
            component: 'ReservationsWidget',
            size: 'large',
            requiredPermissions: ['reservation.read.own'],
            userTypes: ['CLIENT'],
          },
          {
            id: 'guest-services',
            title: 'dashboard.guestServices',
            description: 'Available guest services',
            component: 'GuestServicesWidget',
            size: 'medium',
            requiredPermissions: [],
            userTypes: ['CLIENT'],
          }
        );
      } else if (user.userType === 'VENDOR') {
        widgets.push(
          {
            id: 'vendor-orders',
            title: 'dashboard.myOrders',
            description: 'Your orders and contracts',
            component: 'VendorOrdersWidget',
            size: 'large',
            requiredPermissions: ['order.read.own'],
            userTypes: ['VENDOR'],
          },
          {
            id: 'vendor-invoices',
            title: 'dashboard.myInvoices',
            description: 'Invoicing and payments',
            component: 'VendorInvoicesWidget',
            size: 'medium',
            requiredPermissions: ['invoice.read.own'],
            userTypes: ['VENDOR'],
          }
        );
      } else if (user.userType === 'PARTNER') {
        widgets.push(
          {
            id: 'partner-properties',
            title: 'dashboard.partnerProperties',
            description: 'Properties in your network',
            component: 'PartnerPropertiesWidget',
            size: 'large',
            requiredPermissions: ['property.read.partner'],
            userTypes: ['PARTNER'],
          },
          {
            id: 'partner-analytics',
            title: 'dashboard.partnerAnalytics',
            description: 'Performance analytics',
            component: 'PartnerAnalyticsWidget',
            size: 'medium',
            requiredPermissions: ['analytics.read.partner'],
            userTypes: ['PARTNER'],
          }
        );
      }
    }

    return widgets;
  }, [user]);

  // Load dashboard widgets based on enabled modules
  const moduleBasedWidgets = useMemo((): DashboardWidget[] => {
    if (!enabledModules.length || !user) return [];

    const widgets: DashboardWidget[] = [];

    enabledModules.forEach(module => {
      // Extract dashboard widgets from module configuration
      // This would typically be defined in the module manifest
      const dashboardConfig = user.userType === 'INTERNAL' 
        ? (module as any).internalDashboard 
        : (module as any).externalDashboard;

      if (dashboardConfig && Array.isArray(dashboardConfig.widgets)) {
        widgets.push(...dashboardConfig.widgets);
      }
    });

    return widgets;
  }, [enabledModules, user]);

  // Combine and filter widgets based on permissions
  const availableWidgets = useMemo((): DashboardWidget[] => {
    if (!user) return [];

    const allWidgets = [...getDefaultDashboardWidgets, ...moduleBasedWidgets];

    return allWidgets.filter(widget => {
      // Check user type compatibility
      if (!widget.userTypes.includes(user.userType)) {
        return false;
      }

      // Check permissions
      if (widget.requiredPermissions.length > 0) {
        return widget.requiredPermissions.every(permission => {
          const [resource, action, scope] = permission.split('.');
          return hasPermission(resource, action, scope || 'own');
        });
      }

      return true;
    });
  }, [getDefaultDashboardWidgets, moduleBasedWidgets, user, hasPermission]);

  // Group widgets into sections
  const dashboardSections = useMemo((): DashboardSection[] => {
    const sections: DashboardSection[] = [
      {
        title: 'dashboard.overview',
        widgets: availableWidgets.filter(w => 
          ['profile-summary', 'organization-overview', 'property-status', 'reservations', 'vendor-orders', 'partner-properties'].includes(w.id)
        )
      },
      {
        title: 'dashboard.activities',
        widgets: availableWidgets.filter(w => 
          ['notifications', 'my-schedule', 'my-requests', 'guest-services'].includes(w.id)
        )
      },
      {
        title: 'dashboard.management',
        widgets: availableWidgets.filter(w => 
          ['quick-actions', 'staff-overview', 'system-health'].includes(w.id)
        )
      },
      {
        title: 'dashboard.analytics',
        widgets: availableWidgets.filter(w => 
          ['vendor-invoices', 'partner-analytics'].includes(w.id)
        )
      }
    ];

    return sections.filter(section => section.widgets.length > 0);
  }, [availableWidgets]);

  if (isLoadingModules) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text={t('dashboard.loading')} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center text-gray-500 py-8">
        {t('dashboard.notAuthenticated')}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t('dashboard.welcome')}, {user.firstName}!
        </h1>
        <p className="text-gray-600">
          {isInternalUser(user) 
            ? t('dashboard.internalWelcome', { role: user.role.replace('_', ' ') })
            : t('dashboard.externalWelcome', { type: user.userType.toLowerCase() })
          }
        </p>
      </div>

      {/* Dashboard Sections */}
      {dashboardSections.map(section => (
        <div key={section.title} className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {t(section.title)}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {section.widgets.map(widget => (
              <DashboardWidget 
                key={widget.id} 
                widget={widget}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Empty State */}
      {dashboardSections.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('dashboard.noDashboard')}
          </h3>
          <p className="text-gray-600">
            {t('dashboard.noDashboardDescription')}
          </p>
        </div>
      )}
    </div>
  );
};

// Individual Dashboard Widget Component
const DashboardWidget: React.FC<{ widget: DashboardWidget }> = ({ widget }) => {
  const { t } = useLanguage();
  
  const getSizeClass = (size: string) => {
    switch (size) {
      case 'small': return 'col-span-1';
      case 'medium': return 'col-span-1 md:col-span-2';
      case 'large': return 'col-span-1 md:col-span-2 lg:col-span-3';
      case 'full': return 'col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4';
      default: return 'col-span-1';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow ${getSizeClass(widget.size)}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-gray-900">
          {t(widget.title)}
        </h3>
        {widget.refreshInterval && (
          <div className="text-xs text-gray-400">
            ↻ {widget.refreshInterval}s
          </div>
        )}
      </div>
      
      {widget.description && (
        <p className="text-sm text-gray-600 mb-3">
          {widget.description}
        </p>
      )}
      
      {/* Placeholder for actual widget component */}
      <div className="bg-gray-50 rounded p-4 text-center text-gray-500 text-sm">
        <div className="text-2xl mb-2">⚡</div>
        {t('dashboard.widgetPlaceholder', { component: widget.component })}
      </div>
    </div>
  );
};

export default RoleBasedDashboard;