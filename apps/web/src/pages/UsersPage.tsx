import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import UserDetailsModal from '../components/UserDetailsModal';
import EditUserModal from '../components/EditUserModal';
import { userService, User as UserType, UserFilter, BulkImportResult } from '../services/userService';
import { departmentService, Department } from '../services/departmentService';

const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showViewUser, setShowViewUser] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showImportResults, setShowImportResults] = useState(false);
  const [importResults, setImportResults] = useState<BulkImportResult | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [filter] = useState<UserFilter>({
    search: '',
    role: '',
    departmentId: '',
  });
  const [, setStats] = useState({
    total: 0,
    byRole: {} as Record<string, number>,
    byDepartment: {} as Record<string, number>,
  });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'STAFF' as 'STAFF' | 'DEPARTMENT_ADMIN' | 'SUPERADMIN',
    departmentId: '',
    position: '',
    phoneNumber: '',
    hireDate: '',
  });
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [validateOnly, setValidateOnly] = useState(true);
  const [sendInvitations, setSendInvitations] = useState(true);

  // Load users
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await userService.getUsers({
        search: searchTerm,
        role: selectedRole || undefined,
        departmentId: filter.departmentId || undefined,
        includeInactive: true, // Always include inactive users for correct statistics
      });
      setUsers(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedRole, filter.departmentId]);

  // Load departments with hierarchy
  const loadDepartments = useCallback(async () => {
    try {
      const response = await departmentService.getDepartments();
      setDepartments(response.data || []);
    } catch (error) {
      console.error('Failed to load departments:', error);
      setDepartments([]);
    }
  }, []);

  // Load stats
  const loadStats = useCallback(async () => {
    if (currentUser?.role === 'STAFF') return;
    
    try {
      const response = await userService.getUserStats();
      setStats(response.data?.data || {
        total: 0,
        byRole: {},
        byDepartment: {},
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    loadUsers();
    loadStats();
    loadDepartments();
  }, [loadUsers, loadStats, loadDepartments]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role,
      };

      // Only add fields that have values
      if (formData.departmentId?.trim()) {
        userData.departmentId = formData.departmentId;
      }
      if (formData.position?.trim()) {
        userData.position = formData.position;
      }
      if (formData.phoneNumber?.trim()) {
        userData.phoneNumber = formData.phoneNumber;
      }
      if (formData.hireDate?.trim()) {
        userData.hireDate = formData.hireDate;
      }

      await userService.createUser(userData);
      await loadUsers();
      setShowAddUser(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        role: 'STAFF',
        departmentId: '',
        position: '',
        phoneNumber: '',
        hireDate: '',
      });
    } catch (error: any) {
      console.error('Failed to create user:', error);
      alert(error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };


  const handleChangeStatus = async (userId: string, isActive: boolean) => {
    try {
      setLoading(true);
      await userService.changeUserStatus(userId, isActive);
      await loadUsers();
    } catch (error) {
      console.error('Failed to change status:', error);
      alert('Failed to change status');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: UserType) => {
    setSelectedUser(user);
    setShowViewUser(false);
    setShowEditUser(true);
  };

  const handleUserModalSuccess = () => {
    loadUsers();
    setShowEditUser(false);
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) {
      alert('Please select a CSV file');
      return;
    }

    try {
      setLoading(true);
      const result = await userService.importUsersFromCsv(csvFile, validateOnly, sendInvitations);
      setImportResults(result);
      setShowImportResults(true);
      
      if (!validateOnly && result?.successCount > 0) {
        await loadUsers();
        setShowBulkImport(false);
      }
    } catch (error) {
      console.error('Failed to import users:', error);
      alert('Failed to import users');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const blob = await userService.exportUsers({
        search: searchTerm,
        role: selectedRole || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export users:', error);
      alert('Failed to export users');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await userService.getImportTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'user-import-template.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download template:', error);
      alert('Failed to download template');
    }
  };

  const getStatusBadge = (user: UserType) => {
    if (user.deletedAt) {
      return <span className="badge badge-error">Inactive</span>;
    }
    return <span className="badge badge-success">Active</span>;
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

  const formatDate = (date?: string) => {
    if (!date) return 'Never';
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDepartmentHierarchy = (user: UserType) => {
    if (!user.department) {
      return (
        <span className="text-gray-500 text-sm">Unassigned</span>
      );
    }

    const department = user.department;
    const isChild = department.parent;
    
    return (
      <div className="flex flex-col space-y-1">
        <div className="flex items-center space-x-2">
          {isChild && (
            <span className="text-gray-400 text-xs">└─</span>
          )}
          <span className={`text-sm font-medium ${
            isChild ? 'text-green-600' : 'text-blue-600'
          }`}>
            {department.name}
          </span>
          {department.level > 0 && (
            <span className={`text-xs px-2 py-1 rounded-full ${
              department.level === 1 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
            }`}>
              L{department.level}
            </span>
          )}
        </div>
        {department.parent && (
          <div className="text-xs text-gray-500">
            under {department.parent.name}
          </div>
        )}
      </div>
    );
  };

  const canManageUser = (user: UserType) => {
    if (currentUser?.role === 'SUPERADMIN') return true;
    if (currentUser?.role === 'DEPARTMENT_ADMIN') {
      return user.departmentId === currentUser.departmentId && user.role === 'STAFF';
    }
    return false;
  };

  const availableRoles = currentUser?.role === 'SUPERADMIN' 
    ? ['STAFF', 'DEPARTMENT_ADMIN', 'SUPERADMIN']
    : ['STAFF'];

  // Filter users
  const filteredUsers = users.filter(user => {
    // Department scoping for DEPARTMENT_ADMIN
    if (currentUser?.role === 'DEPARTMENT_ADMIN' && user.departmentId !== currentUser.departmentId) {
      return false;
    }

    const matchesRole = !selectedRole || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'active' && !user.deletedAt) ||
      (selectedStatus === 'inactive' && user.deletedAt);
    const matchesSearch = !searchTerm || 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesRole && matchesStatus && matchesSearch;
  });

  const roles = [
    { value: '', label: 'All Roles' },
    { value: 'STAFF', label: 'Staff' },
    { value: 'DEPARTMENT_ADMIN', label: 'Department Admin' },
    { value: 'SUPERADMIN', label: 'Super Admin' }
  ];

  const statuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ];

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
        
        <div className="flex gap-2">
          {currentUser?.role === 'SUPERADMIN' && (
            <>
              <button
                onClick={() => setShowBulkImport(true)}
                className="btn btn-secondary"
              >
                📤 Import CSV
              </button>
              <button
                onClick={handleExport}
                className="btn btn-secondary"
                disabled={loading}
              >
                📥 Export CSV
              </button>
            </>
          )}
          <button
            onClick={() => setShowAddUser(true)}
            className="btn btn-primary"
          >
            <span className="mr-2">➕</span>
            Add User
          </button>
        </div>
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
            {filteredUsers.filter(u => !u.deletedAt).length}
          </p>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">❌</div>
          <p className="text-sm text-gray-600 mb-1">Inactive</p>
          <p className="text-xl font-bold text-red-600">
            {filteredUsers.filter(u => u.deletedAt).length}
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
          {loading ? (
            <div className="p-12 text-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredUsers.length === 0 ? (
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
                      Created
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getDepartmentHierarchy(user)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(user)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          {canManageUser(user) && (
                            <>
                              <button 
                                className="text-blue-600 hover:text-blue-800"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setFormData({
                                    firstName: user.firstName,
                                    lastName: user.lastName,
                                    email: user.email,
                                    role: user.role,
                                    departmentId: user.departmentId || '',
                                    position: user.position || '',
                                    phoneNumber: user.phoneNumber || '',
                                    hireDate: user.hireDate ? user.hireDate.split('T')[0] : '',
                                  });
                                  setShowEditUser(true);
                                }}
                              >
                                Edit
                              </button>
                              <button 
                                className="text-red-600 hover:text-red-800"
                                onClick={() => user.deletedAt 
                                  ? handleChangeStatus(user.id, true)
                                  : handleChangeStatus(user.id, false)
                                }
                              >
                                {user.deletedAt ? 'Activate' : 'Deactivate'}
                              </button>
                            </>
                          )}
                          <button 
                            className="text-gray-600 hover:text-gray-800"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowViewUser(true);
                            }}
                          >
                            View Details
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
                  disabled={loading}
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

                {formData.role !== 'SUPERADMIN' && (
                  <div>
                    <label className="form-label">Department *</label>
                    <select
                      name="departmentId"
                      value={formData.departmentId}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>
                          {'  '.repeat(dept.level || 0)}{dept.name}
                          {dept.parent ? ` (under ${dept.parent.name})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="form-label">Position</label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="e.g. Software Engineer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="+1234567890"
                    />
                  </div>
                  <div>
                    <label className="form-label">Hire Date</label>
                    <input
                      type="date"
                      name="hireDate"
                      value={formData.hireDate}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="submit"
                    className="btn btn-primary flex-1"
                    disabled={loading}
                  >
                    {loading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      'Create User'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddUser(false)}
                    className="btn btn-secondary flex-1"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}


      {/* Bulk Import Modal */}
      {showBulkImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Bulk Import Users</h3>
              <form onSubmit={handleBulkImport} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">CSV File</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    className="form-input"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="text-sm text-blue-600 hover:text-blue-800 mt-2"
                  >
                    Download CSV Template
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={validateOnly}
                      onChange={(e) => setValidateOnly(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Validate only (don't create users)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={sendInvitations}
                      onChange={(e) => setSendInvitations(e.target.checked)}
                      className="mr-2"
                      disabled={validateOnly}
                    />
                    <span className="text-sm">Send invitation emails</span>
                  </label>
                </div>
                <div className="flex gap-4">
                  <button type="submit" className="btn btn-primary flex-1" disabled={loading || !csvFile}>
                    {loading ? <LoadingSpinner size="sm" /> : validateOnly ? 'Validate CSV' : 'Import Users'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBulkImport(false);
                      setCsvFile(null);
                      setValidateOnly(true);
                      setSendInvitations(true);
                    }}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Import Results Modal */}
      {showImportResults && importResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Import Results</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="card p-4 bg-green-50">
                    <p className="text-sm text-gray-600">Successful</p>
                    <p className="text-2xl font-bold text-green-600">{importResults.successCount}</p>
                  </div>
                  <div className="card p-4 bg-red-50">
                    <p className="text-sm text-gray-600">Failed</p>
                    <p className="text-2xl font-bold text-red-600">{importResults.failureCount}</p>
                  </div>
                </div>
                
                {importResults.failed.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Failed Imports:</h4>
                    <div className="bg-red-50 rounded p-4 max-h-64 overflow-y-auto">
                      {importResults.failed.map((failure, index) => (
                        <div key={index} className="mb-2 text-sm">
                          <span className="font-medium">Row {failure.row}:</span> {failure.email} - {failure.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <button
                  onClick={() => {
                    setShowImportResults(false);
                    setImportResults(null);
                  }}
                  className="btn btn-primary w-full"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <UserDetailsModal
          isOpen={showViewUser}
          onClose={() => {
            setShowViewUser(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onEdit={handleEditUser}
        />
      )}

      {/* Edit User Modal */}
      {selectedUser && (
        <EditUserModal
          isOpen={showEditUser}
          onClose={() => {
            setShowEditUser(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onSuccess={handleUserModalSuccess}
        />
      )}
    </div>
  );
};

export default UsersPage;