import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'SUPERADMIN' | 'DEPARTMENT_ADMIN' | 'STAFF';
  departmentId?: string;
  departmentName?: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin?: string;
  createdAt: string;
}

const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'STAFF' as const,
    departmentId: ''
  });

  // Mock data - replace with actual API call
  const users: User[] = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@nayara.com',
      role: 'STAFF',
      departmentId: 'dept1',
      departmentName: 'Front Office',
      status: 'active',
      lastLogin: '2024-01-30T14:30:00Z',
      createdAt: '2023-06-15T10:00:00Z'
    },
    {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@nayara.com',
      role: 'DEPARTMENT_ADMIN',
      departmentId: 'dept2',
      departmentName: 'Housekeeping',
      status: 'active',
      lastLogin: '2024-01-31T09:15:00Z',
      createdAt: '2023-05-20T08:00:00Z'
    },
    {
      id: '3',
      firstName: 'Mike',
      lastName: 'Johnson',
      email: 'mike.johnson@nayara.com',
      role: 'STAFF',
      departmentId: 'dept3',
      departmentName: 'Food & Beverage',
      status: 'inactive',
      lastLogin: '2024-01-25T16:45:00Z',
      createdAt: '2023-08-10T12:30:00Z'
    },
    {
      id: '4',
      firstName: 'Sarah',
      lastName: 'Wilson',
      email: 'sarah.wilson@nayara.com',
      role: 'STAFF',
      departmentId: 'dept1',
      departmentName: 'Front Office',
      status: 'pending',
      createdAt: '2024-01-28T11:00:00Z'
    }
  ];

  const departments = [
    { id: 'dept1', name: 'Front Office' },
    { id: 'dept2', name: 'Housekeeping' },
    { id: 'dept3', name: 'Food & Beverage' },
    { id: 'dept4', name: 'Maintenance' },
    { id: 'dept5', name: 'Administration' }
  ];

  const roles = [
    { value: 'all', label: 'All Roles' },
    { value: 'STAFF', label: 'Staff' },
    { value: 'DEPARTMENT_ADMIN', label: 'Department Admin' },
    { value: 'SUPERADMIN', label: 'Super Admin' }
  ];

  const statuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending' }
  ];

  // Filter users based on current user's role and department
  const filteredUsers = users.filter(user => {
    // Department scoping for DEPARTMENT_ADMIN
    if (currentUser?.role === 'DEPARTMENT_ADMIN' && user.departmentId !== currentUser.departmentId) {
      return false;
    }

    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    const matchesSearch = user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesRole && matchesStatus && matchesSearch;
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Implement user creation API call
      console.log('Creating user:', formData);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset form and close modal
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        role: 'STAFF',
        departmentId: ''
      });
      setShowAddUser(false);
    } catch (error) {
      console.error('Failed to create user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-success">Active</span>;
      case 'inactive':
        return <span className="badge badge-error">Inactive</span>;
      case 'pending':
        return <span className="badge badge-warning">Pending</span>;
      default:
        return <span className="badge badge-neutral">Unknown</span>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPERADMIN':
        return <span className="badge bg-purple-100 text-purple-800">Super Admin</span>;
      case 'DEPARTMENT_ADMIN':
        return <span className="badge bg-blue-100 text-blue-800">Dept Admin</span>;
      case 'STAFF':
        return <span className="badge badge-neutral">Staff</span>;
      default:
        return <span className="badge badge-neutral">{role}</span>;
    }
  };

  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return 'Never';
    const date = new Date(lastLogin);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const canManageUser = (user: User) => {
    if (currentUser?.role === 'SUPERADMIN') return true;
    if (currentUser?.role === 'DEPARTMENT_ADMIN') {
      return user.departmentId === currentUser.departmentId && user.role === 'STAFF';
    }
    return false;
  };

  const availableRoles = currentUser?.role === 'SUPERADMIN' 
    ? ['STAFF', 'DEPARTMENT_ADMIN', 'SUPERADMIN']
    : ['STAFF'];

  const availableDepartments = currentUser?.role === 'SUPERADMIN'
    ? departments
    : departments.filter(dept => dept.id === currentUser?.departmentId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2">User Management</h1>
          <p className="text-gray-600">
            Manage user accounts and permissions
            {currentUser?.role === 'DEPARTMENT_ADMIN' && (
              <span className="ml-2 text-sm text-orange-600">
                (Department scope only)
              </span>
            )}
          </p>
        </div>
        
        <button
          onClick={() => setShowAddUser(true)}
          className="btn btn-primary"
        >
          <span className="mr-2">➕</span>
          Add User
        </button>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">👥</div>
          <p className="text-sm text-gray-600 mb-1">Total Users</p>
          <p className="text-xl font-bold text-charcoal">{filteredUsers.length}</p>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">✅</div>
          <p className="text-sm text-gray-600 mb-1">Active</p>
          <p className="text-xl font-bold text-green-600">
            {filteredUsers.filter(u => u.status === 'active').length}
          </p>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">⏳</div>
          <p className="text-sm text-gray-600 mb-1">Pending</p>
          <p className="text-xl font-bold text-orange-600">
            {filteredUsers.filter(u => u.status === 'pending').length}
          </p>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">👔</div>
          <p className="text-sm text-gray-600 mb-1">Admins</p>
          <p className="text-xl font-bold text-blue-600">
            {filteredUsers.filter(u => u.role !== 'STAFF').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="flex-1 lg:max-w-md">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="form-input w-auto"
            >
              {roles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="form-input w-auto"
            >
              {statuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-body p-0">
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-lg font-semibold text-charcoal mb-2">
                No users found
              </h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? `No users match "${searchTerm}"`
                  : 'No users available'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-warm-gold rounded-full flex items-center justify-center text-white font-medium mr-4">
                            {user.firstName[0]}{user.lastName[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-charcoal">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal">
                        {user.departmentName || 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(user.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatLastLogin(user.lastLogin)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          {canManageUser(user) && (
                            <>
                              <button className="text-blue-600 hover:text-blue-800">
                                Edit
                              </button>
                              <button className="text-red-600 hover:text-red-800">
                                {user.status === 'active' ? 'Deactivate' : 'Activate'}
                              </button>
                            </>
                          )}
                          <button className="text-gray-600 hover:text-gray-800">
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-charcoal">
                  Add New User
                </h3>
                <button
                  onClick={() => setShowAddUser(false)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  >
                    {availableRoles.map(role => (
                      <option key={role} value={role}>
                        {role.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Department</label>
                  <select
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  >
                    <option value="">Select Department</option>
                    {availableDepartments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="submit"
                    className="btn btn-primary flex-1"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      'Create User'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddUser(false)}
                    className="btn btn-secondary flex-1"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;