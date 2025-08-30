import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import RoleComparison from '../components/RoleComparison/RoleComparison';
import PermissionGate from '../components/PermissionGate';

const RoleComparisonDemo: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Role Comparison Tool</h1>
              <p className="text-sm text-gray-500">Compare and analyze role permissions</p>
            </div>
            
            {user && (
              <div className="text-sm text-gray-600">
                Welcome, {user.firstName} {user.lastName}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PermissionGate 
          resource="user" 
          action="read" 
          scope="department"
          unauthorized={
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <div className="text-yellow-800 font-medium mb-2">
                Insufficient Permissions
              </div>
              <div className="text-yellow-700 text-sm">
                You need 'user.read.department' permission to access the Role Comparison Tool.
              </div>
            </div>
          }
        >
          <RoleComparison
            maxRoles={4}
            autoAnalyze={true}
            showExport={true}
            showVisualizations={true}
          />
        </PermissionGate>
      </div>
      
      {/* Footer */}
      <div className="mt-12 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-500">
            Hotel Operations Hub - Role Comparison Tool Demo
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleComparisonDemo;
