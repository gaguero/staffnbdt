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