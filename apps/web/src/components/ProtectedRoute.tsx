import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { usePermissions } from '../hooks/usePermissions';
import { PermissionSpec } from '../types/permission';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
  fallback?: string;
  permissionsAny?: PermissionSpec[]; // Allow if user has ANY
  permissionsAll?: PermissionSpec[]; // Allow only if user has ALL
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  roles,
  fallback = '/dashboard',
  permissionsAny,
  permissionsAll
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { hasAnyPermission, hasAllPermissions } = usePermissions();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Permission-based gating takes precedence when provided
  if (permissionsAny && permissionsAny.length > 0) {
    if (!hasAnyPermission(permissionsAny)) {
      return <Navigate to={fallback} replace />;
    }
  }
  if (permissionsAll && permissionsAll.length > 0) {
    if (!hasAllPermissions(permissionsAll)) {
      return <Navigate to={fallback} replace />;
    }
  }

  // Legacy role gating (kept for backward compatibility)
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;