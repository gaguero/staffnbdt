import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const quickActions = [
    {
      title: 'View Documents',
      description: 'Access your important documents',
      icon: '📁',
      path: '/documents',
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200'
    },
    {
      title: 'Check Payroll',
      description: 'View your latest payslips',
      icon: '💰',
      path: '/payroll',
      color: 'bg-green-50 hover:bg-green-100 border-green-200'
    },
    {
      title: 'Request Vacation',
      description: 'Submit vacation requests',
      icon: '🏖️',
      path: '/vacation',
      color: 'bg-orange-50 hover:bg-orange-100 border-orange-200'
    },
    {
      title: 'Training Modules',
      description: 'Continue your learning',
      icon: '🎓',
      path: '/training',
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200'
    },
    {
      title: 'Employee Benefits',
      description: 'Explore available benefits',
      icon: '🎁',
      path: '/benefits',
      color: 'bg-pink-50 hover:bg-pink-100 border-pink-200'
    },
    {
      title: 'Update Profile',
      description: 'Manage your information',
      icon: '👤',
      path: '/profile',
      color: 'bg-gray-50 hover:bg-gray-100 border-gray-200'
    }
  ];

  const adminActions = [
    {
      title: 'Manage Users',
      description: 'Add and manage staff',
      icon: '👥',
      path: '/users',
      color: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200',
      roles: ['SUPERADMIN', 'DEPARTMENT_ADMIN']
    },
    {
      title: 'Departments',
      description: 'Manage departments',
      icon: '🏢',
      path: '/departments',
      color: 'bg-teal-50 hover:bg-teal-100 border-teal-200',
      roles: ['SUPERADMIN']
    }
  ];

  const filteredAdminActions = adminActions.filter(action => 
    !action.roles || (user?.role && action.roles.includes(user.role))
  );

  const stats = [
    {
      title: 'Pending Tasks',
      value: '3',
      icon: '📋',
      color: 'text-orange-600'
    },
    {
      title: 'Notifications',
      value: '7',
      icon: '🔔',
      color: 'text-blue-600'
    },
    {
      title: 'Training Progress',
      value: '85%',
      icon: '📊',
      color: 'text-green-600'
    },
    {
      title: 'Vacation Days',
      value: '12',
      icon: '🌴',
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="heading-2 mb-2">
              Welcome back, {user?.firstName}!
            </h2>
            <p className="text-gray-600">
              Here's what's happening at Nayara today
            </p>
          </div>
          <div className="hidden md:block text-6xl">👋</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid-responsive">
        {stats.map((stat, index) => (
          <div key={index} className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <p className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
              <div className="text-2xl opacity-60">
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="heading-3 mb-6">Quick Actions</h3>
        <div className="grid-responsive-3">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.path}
              className={`card p-6 border-2 transition-all duration-200 hover:shadow-medium ${action.color}`}
            >
              <div className="text-3xl mb-4">{action.icon}</div>
              <h4 className="text-lg font-semibold text-charcoal mb-2">
                {action.title}
              </h4>
              <p className="text-sm text-gray-600">
                {action.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Admin Actions (if applicable) */}
      {filteredAdminActions.length > 0 && (
        <div>
          <h3 className="heading-3 mb-6">Administrative Tools</h3>
          <div className="grid-responsive-2">
            {filteredAdminActions.map((action, index) => (
              <Link
                key={index}
                to={action.path}
                className={`card p-6 border-2 transition-all duration-200 hover:shadow-medium ${action.color}`}
              >
                <div className="text-3xl mb-4">{action.icon}</div>
                <h4 className="text-lg font-semibold text-charcoal mb-2">
                  {action.title}
                </h4>
                <p className="text-sm text-gray-600">
                  {action.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-charcoal">Recent Activity</h3>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl">📄</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-charcoal">
                  New policy document uploaded
                </p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl">💰</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-charcoal">
                  Payslip for January available
                </p>
                <p className="text-xs text-gray-500">1 day ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl">🎓</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-charcoal">
                  Training session completed
                </p>
                <p className="text-xs text-gray-500">3 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;