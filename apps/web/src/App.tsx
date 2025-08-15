import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './contexts/AuthContext';

// Placeholder components - these will be implemented later
const LoginPage = () => <div className="min-h-screen flex items-center justify-center bg-gray-50">
  <div className="max-w-md w-full space-y-8">
    <div>
      <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Nayara HR Portal
      </h2>
      <p className="mt-2 text-center text-sm text-gray-600">
        Sign in to your account
      </p>
    </div>
  </div>
</div>;

const DashboardPage = () => <div className="p-8">
  <h1 className="text-2xl font-bold">Dashboard</h1>
  <p className="mt-4">Welcome to Nayara HR Portal</p>
</div>;

const App: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" />} />
          <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
        </Routes>
      </Router>
      <Toaster position="top-right" />
    </>
  );
};

export default App;