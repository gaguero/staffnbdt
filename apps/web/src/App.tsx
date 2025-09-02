import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

// Import all page components
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import DocumentsPage from './pages/DocumentsPage';
import PayrollPage from './pages/PayrollPage';
import VacationPage from './pages/VacationPage';
import TrainingPage from './pages/TrainingPage';
import BenefitsPage from './pages/BenefitsPage';
import NotificationsPage from './pages/NotificationsPage';
import UsersPage from './pages/UsersPage';
import DepartmentsPage from './pages/DepartmentsPage';
import OrganizationsPage from './pages/OrganizationsPage';
import PropertiesPage from './pages/PropertiesPage';
import BrandStudioPage from './pages/BrandStudioPage';
import ComponentsTestPage from './pages/ComponentsTestPage';
import EnhancedOrganizationsPagePhase4 from './pages/EnhancedOrganizationsPagePhase4';

// Hotel Operations Pages
import RoomsPage from './pages/hotel/RoomsPage';
import GuestsPage from './pages/hotel/GuestsPage';
import ReservationsPage from './pages/hotel/ReservationsPage';
import RoomTypesPage from './pages/hotel/RoomTypesPage';
import ConciergePage from './pages/modules/ConciergePage';
import VendorsPage from './pages/modules/VendorsPage';

// Concierge Module Pages
import TodayBoardPage from './pages/modules/TodayBoardPage';
import Reservation360Page from './pages/modules/Reservation360Page';
import GuestTimelinePage from './pages/modules/GuestTimelinePage';
import ObjectTypesPage from './pages/modules/ObjectTypesPage';
import PlaybooksPage from './pages/modules/PlaybooksPage';

// Vendors Module Pages
import VendorLinksPage from './pages/modules/VendorLinksPage';
import VendorPerformancePage from './pages/modules/VendorPerformancePage';
import VendorPortalPage from './pages/modules/VendorPortalPage';

// Admin Pages
import RolesManagementPage from './pages/admin/RolesManagementPage';
import ModuleManagementPage from './pages/admin/ModuleManagementPage';
import RoleStatsDashboardPage from './pages/RoleStatsDashboardPage';

// Login component
const LoginPage = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(email, password);
    } catch (err: any) {
      // Only log errors in development
      if (import.meta.env.DEV) {
        console.error('Login error:', err);
      }
      // Extract error message from API response
      const errorMessage = err?.response?.data?.message || 
                          err?.response?.data?.error || 
                          err?.message || 
                          'Login failed. Please check your credentials and try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-sand">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-soft">
        <div>
          <h2 className="mt-6 text-center text-3xl font-heading text-charcoal uppercase">
            Hotel Operations Hub
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-warm-gold focus:border-warm-gold"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-warm-gold focus:border-warm-gold"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-warm-gold hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-warm-gold disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand">
        <LoadingSpinner size="lg" text="Loading application..." />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <TenantProvider>
        <ThemeProvider>
          <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" replace />} 
        />
        
        {/* Protected routes with layout */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Layout>
                <ProfilePage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/documents" 
          element={
            <ProtectedRoute>
              <Layout>
                <DocumentsPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/payroll" 
          element={
            <ProtectedRoute>
              <Layout>
                <PayrollPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/vacation" 
          element={
            <ProtectedRoute>
              <Layout>
                <VacationPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/training" 
          element={
            <ProtectedRoute>
              <Layout>
                <TrainingPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/benefits" 
          element={
            <ProtectedRoute>
              <Layout>
                <BenefitsPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/notifications" 
          element={
            <ProtectedRoute>
              <Layout>
                <NotificationsPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        {/* Admin-only routes */}
        <Route 
          path="/users" 
          element={
            <ProtectedRoute permissionsAny={[{ resource: 'user', action: 'read', scope: 'property' }] }>
              <Layout>
                <UsersPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/departments" 
          element={
            <ProtectedRoute permissionsAny={[{ resource: 'system', action: 'manage', scope: 'department' }]}>
              <Layout>
                <DepartmentsPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/organizations" 
          element={
            <ProtectedRoute roles={['PLATFORM_ADMIN', 'PROPERTY_MANAGER']}>
              <Layout>
                <OrganizationsPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/organizations-enhanced" 
          element={
            <ProtectedRoute roles={['PLATFORM_ADMIN', 'PROPERTY_MANAGER']}>
              <Layout>
                <EnhancedOrganizationsPagePhase4 />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/properties" 
          element={
            <ProtectedRoute permissionsAny={[{ resource: 'system', action: 'manage', scope: 'property' }]}>
              <Layout>
                <PropertiesPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/brand-studio" 
          element={
            <ProtectedRoute permissionsAny={[{ resource: 'system', action: 'manage', scope: 'organization' }]}>
              <Layout>
                <BrandStudioPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        {/* Hotel Operations Routes */}
        <Route 
          path="/hotel/rooms" 
          element={
            <ProtectedRoute permissionsAny={[{ resource: 'user', action: 'read', scope: 'department' }]}>
              <Layout>
                <RoomsPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/hotel/guests" 
          element={
            <ProtectedRoute permissionsAny={[{ resource: 'user', action: 'read', scope: 'department' }]}>
              <Layout>
                <GuestsPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/hotel/reservations" 
          element={
            <ProtectedRoute permissionsAny={[{ resource: 'user', action: 'read', scope: 'department' }]}>
              <Layout>
                <ReservationsPage />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/hotel/room-types" 
          element={
            <ProtectedRoute roles={['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'PROPERTY_MANAGER', 'DEPARTMENT_ADMIN']}>
              <Layout>
                <RoomTypesPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Routes */}
        <Route 
          path="/admin/roles" 
          element={
            <ProtectedRoute roles={['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN']}>
              <Layout>
                <RolesManagementPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/role-stats" 
          element={
            <ProtectedRoute roles={['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN']}>
              <Layout>
                <RoleStatsDashboardPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/modules" 
          element={
            <ProtectedRoute permissionsAny={[{ resource: 'module', action: 'manage', scope: 'organization' }]}>
              <Layout>
                <ModuleManagementPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/components-test" 
          element={
            <ProtectedRoute>
              <Layout>
                <ComponentsTestPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        {/* Modules - Concierge */}
        <Route 
          path="/concierge" 
          element={
            <ProtectedRoute permissionsAny={[{ resource: 'concierge', action: 'objects', scope: 'read.property' }]}>
              <Layout>
                <ConciergePage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/concierge/today" 
          element={
            <ProtectedRoute permissionsAny={[{ resource: 'concierge', action: 'objects', scope: 'read.property' }]}>
              <Layout>
                <TodayBoardPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/concierge/reservation-360" 
          element={
            <ProtectedRoute permissionsAny={[{ resource: 'concierge', action: 'objects', scope: 'read.property' }]}>
              <Layout>
                <Reservation360Page />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/concierge/timeline/:guestId" 
          element={
            <ProtectedRoute permissionsAny={[{ resource: 'concierge', action: 'objects', scope: 'read.property' }]}>
              <Layout>
                <GuestTimelinePage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/concierge/object-types" 
          element={
            <ProtectedRoute permissionsAny={[{ resource: 'concierge', action: 'object-types', scope: 'manage.property' }]}>
              <Layout>
                <ObjectTypesPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/concierge/playbooks" 
          element={
            <ProtectedRoute permissionsAny={[{ resource: 'concierge', action: 'playbooks', scope: 'manage.property' }]}>
              <Layout>
                <PlaybooksPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        {/* Modules - Vendors */}
        <Route 
          path="/vendors" 
          element={
            <ProtectedRoute permissionsAny={[{ resource: 'vendors', action: 'read', scope: 'property' }]}>
              <Layout>
                <VendorsPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/vendors/links" 
          element={
            <ProtectedRoute permissionsAny={[{ resource: 'vendors', action: 'links', scope: 'read.property' }]}>
              <Layout>
                <VendorLinksPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/vendors/performance" 
          element={
            <ProtectedRoute permissionsAny={[{ resource: 'vendors', action: 'performance', scope: 'read.property' }]}>
              <Layout>
                <VendorPerformancePage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        {/* Vendor Portal - No Layout, Special Route */}
        <Route 
          path="/vendor-portal/:token" 
          element={<VendorPortalPage />} 
        />
        
        {/* Default redirect */}
        <Route 
          path="/" 
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
        />
        
        {/* Catch-all for 404 */}
        <Route 
          path="*" 
          element={
            <ProtectedRoute>
              <Layout>
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🤔</div>
                  <h2 className="heading-2 mb-4">Page Not Found</h2>
                  <p className="text-gray-600 mb-6">
                    The page you're looking for doesn't exist.
                  </p>
                  <button 
                    onClick={() => window.history.back()}
                    className="btn btn-primary"
                  >
                    Go Back
                  </button>
                </div>
              </Layout>
            </ProtectedRoute>
          } 
        />
          </Routes>
        </ThemeProvider>
      </TenantProvider>
    </ErrorBoundary>
  );
};

export default App;