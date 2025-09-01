import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.profile': 'My Profile',
    'nav.documents': 'Documents',
    'nav.payroll': 'Payroll',
    'nav.vacation': 'Vacation',
    'nav.training': 'Training',
    'nav.benefits': 'Benefits',
    'nav.users': 'Users',
    'nav.departments': 'Departments',
    'nav.organizations': 'Organizations',
    'nav.properties': 'Properties',
    'nav.brandStudio': 'Brand Studio',
    'nav.notifications': 'Notifications',
    'nav.signOut': 'Sign Out',
    
    // Hotel Operations
    'nav.rooms': 'Rooms',
    'nav.guests': 'Guests', 
    'nav.reservations': 'Reservations',
    'nav.concierge': 'Concierge',
    'nav.vendors': 'Vendors',
    
    // Admin
    'nav.roles': 'Roles',
    'nav.roleStats': 'Role Statistics',
    'nav.moduleManagement': 'Module Management',
    
    // External Users
    'nav.myReservations': 'My Reservations',
    'nav.serviceRequests': 'Service Requests',
    'nav.orders': 'Orders',
    'nav.invoices': 'Invoices',
    'nav.analytics': 'Analytics',
    'nav.integration': 'Integration',
    
    // Common Navigation
    'nav.errorLoading': 'Error loading navigation',
    
    // Navigation Categories
    'nav.hr': 'HR Tools',
    'nav.admin': 'Administration',
    'nav.hotel': 'Hotel Operations',
    'nav.services': 'Employee Services',
    'nav.reports': 'Reports & Analytics',
    'nav.guest': 'Guest Services',
    'nav.vendor': 'Vendor Tools',
    'nav.partner': 'Partner Portal',
    
    // Dashboard
    'dashboard.welcome': 'Welcome',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.statistics': 'Statistics',
    'dashboard.recentActivity': 'Recent Activity',
    'dashboard.totalEmployees': 'Total Employees',
    'dashboard.activeVacations': 'Active Vacations',
    'dashboard.pendingTrainings': 'Pending Trainings',
    'dashboard.documentsShared': 'Documents Shared',
    
    // Documents
    'documents.title': 'Documents',
    'documents.uploadNew': 'Upload Document',
    'documents.search': 'Search documents...',
    'documents.categories': 'Categories',
    'documents.all': 'All Documents',
    'documents.general': 'General',
    'documents.department': 'Department',
    'documents.personal': 'Personal',
    'documents.guidelines': 'Upload Guidelines',
    'documents.requirements': 'Requirements',
    'documents.view': 'View',
    'documents.download': 'Download',
    
    // Profile
    'profile.title': 'My Profile',
    'profile.personalInfo': 'Personal Information',
    'profile.firstName': 'First Name',
    'profile.lastName': 'Last Name',
    'profile.email': 'Email',
    'profile.phone': 'Phone Number',
    'profile.position': 'Position',
    'profile.department': 'Department',
    'profile.hireDate': 'Hire Date',
    'profile.emergencyContact': 'Emergency Contact',
    'profile.save': 'Save Changes',
    'profile.cancel': 'Cancel',
    'profile.uploadPhoto': 'Upload Photo',
    
    // Payroll
    'payroll.title': 'Payroll',
    'payroll.payslips': 'Payslips',
    'payroll.yearToDate': 'Year to Date',
    'payroll.lastPayslip': 'Last Payslip',
    'payroll.grossPay': 'Gross Pay',
    'payroll.netPay': 'Net Pay',
    'payroll.deductions': 'Deductions',
    'payroll.downloadPDF': 'Download PDF',
    'payroll.viewDetails': 'View Details',
    
    // Vacation
    'vacation.title': 'Vacation',
    'vacation.balance': 'Balance',
    'vacation.daysAvailable': 'Days Available',
    'vacation.daysUsed': 'Days Used',
    'vacation.requestNew': 'Request Vacation',
    'vacation.myRequests': 'My Requests',
    'vacation.pendingApproval': 'Pending Approval',
    'vacation.approved': 'Approved',
    'vacation.rejected': 'Rejected',
    'vacation.startDate': 'Start Date',
    'vacation.endDate': 'End Date',
    'vacation.reason': 'Reason',
    'vacation.status': 'Status',
    
    // Training
    'training.title': 'Training',
    'training.myTrainings': 'My Trainings',
    'training.available': 'Available Courses',
    'training.inProgress': 'In Progress',
    'training.completed': 'Completed',
    'training.deadline': 'Deadline',
    'training.progress': 'Progress',
    'training.startCourse': 'Start Course',
    'training.continue': 'Continue',
    'training.certificate': 'Certificate',
    
    // Benefits
    'benefits.title': 'Benefits',
    'benefits.myBenefits': 'My Benefits',
    'benefits.categories': 'Categories',
    'benefits.health': 'Health',
    'benefits.insurance': 'Insurance',
    'benefits.wellness': 'Wellness',
    'benefits.discounts': 'Discounts',
    'benefits.viewDetails': 'View Details',
    'benefits.contact': 'Contact Provider',
    
    // Users (Admin)
    'users.title': 'Users',
    'users.addNew': 'Add New User',
    'users.search': 'Search users...',
    'users.filter': 'Filter',
    'users.active': 'Active',
    'users.inactive': 'Inactive',
    'users.edit': 'Edit',
    'users.delete': 'Delete',
    'users.role': 'Role',
    
    // Property Selector
    'propertySelector.selectProperty': 'Select Property',
    'propertySelector.currentProperty': 'Current Property',
    'propertySelector.switchProperty': 'Switch Property',
    'propertySelector.noProperties': 'No Properties Available',
    'propertySelector.loading': 'Switching Property...',
    'propertySelector.error': 'Failed to switch property',
    'propertySelector.switchSuccess': 'Property switched successfully',
    'propertySelector.searchPlaceholder': 'Search properties...',
    
    // Property Management
    'properties.title': 'Properties',
    'properties.accessManagement': 'Property Access Management',
    'properties.assignUsers': 'Assign Users',
    'properties.noAccess': 'No property access',
    'properties.multipleAccess': 'Multiple properties',
    'properties.manageAccess': 'Manage Access',
    'properties.assignProperties': 'Assign Properties',
    'properties.assigned': 'Assigned',
    'properties.available': 'Available',
    'properties.pendingChanges': 'Pending Changes',
    'properties.unsavedChanges': 'Unsaved Changes',
    'properties.saveChanges': 'Save Changes',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.submit': 'Submit',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.download': 'Download',
    'common.upload': 'Upload',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.goBack': 'Go Back',
    'common.organization': 'Organization',
    'common.property': 'Property',
    'common.role': 'Role',
    'common.contactSupport': 'Contact Support',
    
    // Module Management
    'modules.management': 'Module Management',
    'modules.pageDescription': 'Manage module availability across your organization and properties',
    'modules.managementDescription': 'Configure which modules are enabled for your organization and properties',
    'modules.selectProperty': 'Select Property',
    'modules.selectPropertyPlaceholder': 'Choose a property to manage...',
    'modules.selectPropertyTitle': 'Select Property to Continue',
    'modules.selectPropertyMessage': 'Please select a property to view and manage module configurations.',
    'modules.loading': 'Loading modules...',
    'modules.loadingProperty': 'Loading property modules...',
    'modules.error': 'Error loading modules',
    'modules.accessDenied': 'Access Denied',
    'modules.accessDeniedDescription': 'You do not have permission to manage modules.',
    'modules.permissionRequired': 'Permission Required',
    'modules.permissionRequiredDescription': 'You need organization-level module management permissions.',
    
    // Module Status
    'modules.enabled': 'Enabled',
    'modules.disabled': 'Disabled',
    'modules.organizationLevel': 'Organization Level',
    'modules.propertyLevel': 'Property Level',
    'modules.effectiveStatus': 'Effective Status',
    'modules.override': 'Override',
    'modules.reset': 'Reset',
    'modules.removeOverride': 'Remove Override',
    'modules.overriddenByProperty': 'Overridden by property setting',
    'modules.propertyControlled': 'Property controlled',
    
    // Module Actions
    'modules.enable': 'Enable',
    'modules.disable': 'Disable',
    'modules.enabling': 'Enabling...',
    'modules.disabling': 'Disabling...',
    'modules.enabledForOrganization': 'Module enabled for organization',
    'modules.disabledForOrganization': 'Module disabled for organization',
    'modules.enabledForProperty': 'Module enabled for property',
    'modules.disabledForProperty': 'Module disabled for property',
    'modules.overrideRemoved': 'Override removed for module',
    'modules.actionFailed': 'Action failed',
    
    // Module Info
    'modules.noDescription': 'No description available',
    'modules.category': 'Category',
    'modules.version': 'Version',
    'modules.dependencies': 'Dependencies',
    'modules.systemModule': 'System Module',
    
    // Statistics
    'modules.statistics': 'Statistics',
    'modules.totalModules': 'Total Modules',
    'modules.orgEnabled': 'Organization Enabled',
    'modules.propertyOverrides': 'Property Overrides',
    'modules.activeModules': 'Active Modules',
    'modules.enabledCount': 'Enabled Modules',
    'modules.availableCount': 'Available Modules',
    'modules.systemCount': 'System Modules',
    
    // Help
    'modules.howItWorks': 'How It Works',
    'modules.organizationLevelHelp': 'Organization-level settings apply to all properties by default.',
    'modules.propertyLevelHelp': 'Property-level settings override organization settings for that specific property.',
    'modules.precedenceHelp': 'Property settings take precedence over organization settings when both exist.',
    'modules.viewAnalytics': 'View Analytics',
    'modules.viewAnalyticsDescription': 'See usage statistics and trends',
    'modules.viewHistory': 'View History',
    'modules.viewHistoryDescription': 'Track module enablement changes',
    'modules.bulkActions': 'Bulk Actions',
    'modules.bulkActionsDescription': 'Enable or disable multiple modules',
    'modules.lastUpdated': 'Last updated',
    'modules.needHelp': 'Need help?',
  },
  es: {
    // Navigation
    'nav.dashboard': 'Panel',
    'nav.profile': 'Mi Perfil',
    'nav.documents': 'Documentos',
    'nav.payroll': 'Nómina',
    'nav.vacation': 'Vacaciones',
    'nav.training': 'Capacitación',
    'nav.benefits': 'Beneficios',
    'nav.users': 'Usuarios',
    'nav.departments': 'Departamentos',
    'nav.organizations': 'Organizaciones', 
    'nav.properties': 'Propiedades',
    'nav.brandStudio': 'Estudio de Marca',
    'nav.notifications': 'Notificaciones',
    'nav.signOut': 'Cerrar Sesión',
    
    // Hotel Operations
    'nav.rooms': 'Habitaciones',
    'nav.guests': 'Huéspedes',
    'nav.reservations': 'Reservaciones',
    'nav.concierge': 'Conserjería',
    'nav.vendors': 'Proveedores',
    
    // Admin
    'nav.roles': 'Roles',
    'nav.roleStats': 'Estadísticas de Roles',
    'nav.moduleManagement': 'Gestión de Módulos',
    
    // External Users
    'nav.myReservations': 'Mis Reservaciones',
    'nav.serviceRequests': 'Solicitudes de Servicio',
    'nav.orders': 'Órdenes',
    'nav.invoices': 'Facturas',
    'nav.analytics': 'Analíticas',
    'nav.integration': 'Integración',
    
    // Common Navigation
    'nav.errorLoading': 'Error cargando navegación',
    
    // Navigation Categories
    'nav.hr': 'Herramientas de RH',
    'nav.admin': 'Administración',
    'nav.hotel': 'Operaciones Hoteleras',
    'nav.services': 'Servicios para Empleados',
    'nav.reports': 'Reportes y Analíticas',
    'nav.guest': 'Servicios para Huéspedes',
    'nav.vendor': 'Herramientas de Proveedores',
    'nav.partner': 'Portal de Socios',
    
    // Dashboard
    'dashboard.welcome': 'Bienvenido',
    'dashboard.quickActions': 'Acciones Rápidas',
    'dashboard.statistics': 'Estadísticas',
    'dashboard.recentActivity': 'Actividad Reciente',
    'dashboard.totalEmployees': 'Total de Empleados',
    'dashboard.activeVacations': 'Vacaciones Activas',
    'dashboard.pendingTrainings': 'Capacitaciones Pendientes',
    'dashboard.documentsShared': 'Documentos Compartidos',
    
    // Documents
    'documents.title': 'Documentos',
    'documents.uploadNew': 'Subir Documento',
    'documents.search': 'Buscar documentos...',
    'documents.categories': 'Categorías',
    'documents.all': 'Todos los Documentos',
    'documents.general': 'General',
    'documents.department': 'Departamento',
    'documents.personal': 'Personal',
    'documents.guidelines': 'Guías de Carga',
    'documents.requirements': 'Requisitos',
    'documents.view': 'Ver',
    'documents.download': 'Descargar',
    
    // Profile
    'profile.title': 'Mi Perfil',
    'profile.personalInfo': 'Información Personal',
    'profile.firstName': 'Nombre',
    'profile.lastName': 'Apellido',
    'profile.email': 'Correo Electrónico',
    'profile.phone': 'Número de Teléfono',
    'profile.position': 'Posición',
    'profile.department': 'Departamento',
    'profile.hireDate': 'Fecha de Contratación',
    'profile.emergencyContact': 'Contacto de Emergencia',
    'profile.save': 'Guardar Cambios',
    'profile.cancel': 'Cancelar',
    'profile.uploadPhoto': 'Subir Foto',
    
    // Payroll
    'payroll.title': 'Nómina',
    'payroll.payslips': 'Recibos de Pago',
    'payroll.yearToDate': 'Año a la Fecha',
    'payroll.lastPayslip': 'Último Recibo',
    'payroll.grossPay': 'Pago Bruto',
    'payroll.netPay': 'Pago Neto',
    'payroll.deductions': 'Deducciones',
    'payroll.downloadPDF': 'Descargar PDF',
    'payroll.viewDetails': 'Ver Detalles',
    
    // Vacation
    'vacation.title': 'Vacaciones',
    'vacation.balance': 'Balance',
    'vacation.daysAvailable': 'Días Disponibles',
    'vacation.daysUsed': 'Días Usados',
    'vacation.requestNew': 'Solicitar Vacaciones',
    'vacation.myRequests': 'Mis Solicitudes',
    'vacation.pendingApproval': 'Pendiente de Aprobación',
    'vacation.approved': 'Aprobado',
    'vacation.rejected': 'Rechazado',
    'vacation.startDate': 'Fecha de Inicio',
    'vacation.endDate': 'Fecha de Fin',
    'vacation.reason': 'Motivo',
    'vacation.status': 'Estado',
    
    // Training
    'training.title': 'Capacitación',
    'training.myTrainings': 'Mis Capacitaciones',
    'training.available': 'Cursos Disponibles',
    'training.inProgress': 'En Progreso',
    'training.completed': 'Completado',
    'training.deadline': 'Fecha Límite',
    'training.progress': 'Progreso',
    'training.startCourse': 'Iniciar Curso',
    'training.continue': 'Continuar',
    'training.certificate': 'Certificado',
    
    // Benefits
    'benefits.title': 'Beneficios',
    'benefits.myBenefits': 'Mis Beneficios',
    'benefits.categories': 'Categorías',
    'benefits.health': 'Salud',
    'benefits.insurance': 'Seguro',
    'benefits.wellness': 'Bienestar',
    'benefits.discounts': 'Descuentos',
    'benefits.viewDetails': 'Ver Detalles',
    'benefits.contact': 'Contactar Proveedor',
    
    // Users (Admin)
    'users.title': 'Usuarios',
    'users.addNew': 'Agregar Nuevo Usuario',
    'users.search': 'Buscar usuarios...',
    'users.filter': 'Filtrar',
    'users.active': 'Activo',
    'users.inactive': 'Inactivo',
    'users.edit': 'Editar',
    'users.delete': 'Eliminar',
    'users.role': 'Rol',
    
    // Property Selector
    'propertySelector.selectProperty': 'Seleccionar Propiedad',
    'propertySelector.currentProperty': 'Propiedad Actual',
    'propertySelector.switchProperty': 'Cambiar Propiedad',
    'propertySelector.noProperties': 'No hay Propiedades Disponibles',
    'propertySelector.loading': 'Cambiando Propiedad...',
    'propertySelector.error': 'Error al cambiar propiedad',
    'propertySelector.switchSuccess': 'Propiedad cambiada exitosamente',
    'propertySelector.searchPlaceholder': 'Buscar propiedades...',
    
    // Property Management  
    'properties.title': 'Propiedades',
    'properties.accessManagement': 'Gestión de Acceso a Propiedades',
    'properties.assignUsers': 'Asignar Usuarios',
    'properties.noAccess': 'Sin acceso a propiedades',
    'properties.multipleAccess': 'Múltiples propiedades',
    'properties.manageAccess': 'Gestionar Acceso',
    'properties.assignProperties': 'Asignar Propiedades',
    'properties.assigned': 'Asignado',
    'properties.available': 'Disponible',
    'properties.pendingChanges': 'Cambios Pendientes',
    'properties.unsavedChanges': 'Cambios No Guardados',
    'properties.saveChanges': 'Guardar Cambios',
    
    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.submit': 'Enviar',
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.view': 'Ver',
    'common.download': 'Descargar',
    'common.upload': 'Subir',
    'common.search': 'Buscar',
    'common.filter': 'Filtrar',
    'common.export': 'Exportar',
    'common.import': 'Importar',
    'common.yes': 'Sí',
    'common.no': 'No',
    'common.goBack': 'Regresar',
    'common.organization': 'Organización',
    'common.property': 'Propiedad',
    'common.role': 'Rol',
    'common.contactSupport': 'Contactar Soporte',
    
    // Module Management
    'modules.management': 'Gestión de Módulos',
    'modules.pageDescription': 'Gestiona la disponibilidad de módulos en tu organización y propiedades',
    'modules.managementDescription': 'Configura qué módulos están habilitados para tu organización y propiedades',
    'modules.selectProperty': 'Seleccionar Propiedad',
    'modules.selectPropertyPlaceholder': 'Elige una propiedad para gestionar...',
    'modules.selectPropertyTitle': 'Selecciona Propiedad para Continuar',
    'modules.selectPropertyMessage': 'Por favor selecciona una propiedad para ver y gestionar las configuraciones de módulos.',
    'modules.loading': 'Cargando módulos...',
    'modules.loadingProperty': 'Cargando módulos de la propiedad...',
    'modules.error': 'Error cargando módulos',
    'modules.accessDenied': 'Acceso Denegado',
    'modules.accessDeniedDescription': 'No tienes permisos para gestionar módulos.',
    'modules.permissionRequired': 'Permiso Requerido',
    'modules.permissionRequiredDescription': 'Necesitas permisos de gestión de módulos a nivel de organización.',
    
    // Module Status
    'modules.enabled': 'Habilitado',
    'modules.disabled': 'Deshabilitado',
    'modules.organizationLevel': 'Nivel de Organización',
    'modules.propertyLevel': 'Nivel de Propiedad',
    'modules.effectiveStatus': 'Estado Efectivo',
    'modules.override': 'Sobrescribir',
    'modules.reset': 'Restablecer',
    'modules.removeOverride': 'Remover Sobrescritura',
    'modules.overriddenByProperty': 'Sobrescrito por configuración de propiedad',
    'modules.propertyControlled': 'Controlado por propiedad',
    
    // Module Actions
    'modules.enable': 'Habilitar',
    'modules.disable': 'Deshabilitar',
    'modules.enabling': 'Habilitando...',
    'modules.disabling': 'Deshabilitando...',
    'modules.enabledForOrganization': 'Módulo habilitado para la organización',
    'modules.disabledForOrganization': 'Módulo deshabilitado para la organización',
    'modules.enabledForProperty': 'Módulo habilitado para la propiedad',
    'modules.disabledForProperty': 'Módulo deshabilitado para la propiedad',
    'modules.overrideRemoved': 'Sobrescritura removida para el módulo',
    'modules.actionFailed': 'Acción falló',
    
    // Module Info
    'modules.noDescription': 'No hay descripción disponible',
    'modules.category': 'Categoría',
    'modules.version': 'Versión',
    'modules.dependencies': 'Dependencias',
    'modules.systemModule': 'Módulo del Sistema',
    
    // Statistics
    'modules.statistics': 'Estadísticas',
    'modules.totalModules': 'Total de Módulos',
    'modules.orgEnabled': 'Habilitados por Organización',
    'modules.propertyOverrides': 'Sobrescrituras de Propiedad',
    'modules.activeModules': 'Módulos Activos',
    'modules.enabledCount': 'Módulos Habilitados',
    'modules.availableCount': 'Módulos Disponibles',
    'modules.systemCount': 'Módulos del Sistema',
    
    // Help
    'modules.howItWorks': 'Cómo Funciona',
    'modules.organizationLevelHelp': 'La configuración a nivel de organización se aplica a todas las propiedades por defecto.',
    'modules.propertyLevelHelp': 'La configuración a nivel de propiedad sobrescribe la configuración de organización para esa propiedad específica.',
    'modules.precedenceHelp': 'La configuración de propiedad tiene precedencia sobre la configuración de organización cuando ambas existen.',
    'modules.viewAnalytics': 'Ver Analíticas',
    'modules.viewAnalyticsDescription': 'Ver estadísticas de uso y tendencias',
    'modules.viewHistory': 'Ver Historial',
    'modules.viewHistoryDescription': 'Rastrear cambios de habilitación de módulos',
    'modules.bulkActions': 'Acciones Masivas',
    'modules.bulkActionsDescription': 'Habilitar o deshabilitar múltiples módulos',
    'modules.lastUpdated': 'Última actualización',
    'modules.needHelp': '¿Necesitas ayuda?',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('language');
    return (stored as Language) || 'es';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  useEffect(() => {
    // Set HTML lang attribute
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};