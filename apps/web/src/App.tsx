import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Placeholder components - these will be implemented later
const LoginPage = () => <div className="min-h-screen flex items-center justify-center bg-sand">
  <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-soft">
    <div>
      <h2 className="mt-6 text-center text-3xl font-heading text-charcoal uppercase">
        Nayara HR Portal
      </h2>
      <p className="mt-2 text-center text-sm text-gray-600">
        Sign in to your account
      </p>
    </div>
    <form className="mt-8 space-y-6">
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
        />
      </div>
      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-warm-gold hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-warm-gold"
      >
        Sign In
      </button>
    </form>
  </div>
</div>;

const DashboardPage = () => <div className="min-h-screen bg-gray-50">
  <div className="p-8">
    <h1 className="text-3xl font-heading text-charcoal uppercase">Dashboard</h1>
    <p className="mt-4 text-gray-600">Welcome to Nayara HR Portal</p>
    
    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-xl shadow-soft">
        <h3 className="text-lg font-semibold text-charcoal">Documents</h3>
        <p className="mt-2 text-gray-600">Access your documents and files</p>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-soft">
        <h3 className="text-lg font-semibold text-charcoal">Payroll</h3>
        <p className="mt-2 text-gray-600">View your payslips</p>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-soft">
        <h3 className="text-lg font-semibold text-charcoal">Vacation</h3>
        <p className="mt-2 text-gray-600">Request time off</p>
      </div>
    </div>
  </div>
</div>;

const App: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-warm-gold"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" />} />
      <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
    </Routes>
  );
};

export default App;