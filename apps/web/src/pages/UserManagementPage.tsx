import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService, User, UserFilter, BulkImportResult } from '../services/userService';
import { departmentService, Department } from '../services/departmentService';
import LoadingSpinner from '../components/LoadingSpinner';

const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showImportResults, setShowImportResults] = useState(false);
  const [importResults, setImportResults] = useState<BulkImportResult | null>(null);
  const [filter, setFilter] = useState<UserFilter>({
    search: '',
    role: '',
    departmentId: '',
  });
  const [stats, setStats] = useState({
    total: 0,
    byRole: {} as Record<string, number>,
    byDepartment: {} as Record<string, number>,
  });

  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'STAFF' as 'STAFF' | 'DEPARTMENT_ADMIN' | 'PROPERTY_MANAGER',
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
      const response = await userService.getUsers(filter);
      setUsers(response.data || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Load stats
  const loadStats = useCallback(async () => {
    if (currentUser?.role === 'STAFF') return;
    
    try {
      const response = await userService.getUserStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, [currentUser]);

  // Load departments
  const loadDepartments = useCallback(async () => {
    try {
      const response = await departmentService.getDepartments();
      setDepartments(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load departments:', error);
      setDepartments([]);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadStats();
    loadDepartments();
  }, [loadUsers, loadStats, loadDepartments]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await userService.createUser(formData);
      await loadUsers();
      setShowAddUser(false);
      resetForm();
    } catch (error: any) {
      console.error('Failed to create user:', error);
      alert(error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    try {
      setLoading(true);
      await userService.updateUser(selectedUser.id, formData);
      await loadUsers();
      setShowEditUser(false);
      resetForm();
    } catch (error: any) {
      console.error('Failed to update user:', error);
      alert(error.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };


  const handleRestoreUser = async (userId: string) => {
    try {
      setLoading(true);
      await userService.restoreUser(userId);
      await loadUsers();
    } catch (error) {
      console.error('Failed to restore user:', error);
      alert('Failed to restore user');
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
      
      if (!validateOnly && result.successCount > 0) {
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
      const blob = await userService.exportUsers(filter);
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

  const resetForm = () => {
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
    setSelectedUser(null);
  };

  const openEditModal = (user: User) => {
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
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      PROPERTY_MANAGER: 'bg-purple-100 text-purple-800',
      DEPARTMENT_ADMIN: 'bg-blue-100 text-blue-800',
      STAFF: 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[role as keyof typeof colors]}`}>
        {role.replace('_', ' ')}
      </span>
    );
  };

  const getStatusBadge = (user: User) => {
    if (user.deletedAt) {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Inactive</span>;
    }
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>;
  };

  const canManageUser = (user: User) => {
    if (['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'PROPERTY_MANAGER'].includes(currentUser?.role || '')) return true;
    if (currentUser?.role === 'DEPARTMENT_ADMIN') {
      return user.departmentId === currentUser.departmentId && user.role === 'STAFF';
    }
    return false;
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">User Management</h1>
          <p className="text-gray-600">
            Manage user accounts, roles, and permissions
            {currentUser?.role === 'DEPARTMENT_ADMIN' && (
              <span className="ml-2 text-sm text-orange-600">(Department scope)</span>
            )}
          </p>
        </div>
        
        <div className="flex gap-2">
          {['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'PROPERTY_MANAGER'].includes(currentUser?.role || '') && (
            <>
              <button
                onClick={() => setShowBulkImport(true)}
                className="btn btn-secondary"
              >
                📤 Bulk Import
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
            ➕ Add User
          </button>
        </div>
      </div>

      {/* Statistics */}
      {currentUser?.role !== 'STAFF' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4 text-center">
            <div className="text-2xl mb-2">👥</div>
            <p className="text-sm text-gray-600">Total Users</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl mb-2">👔</div>
            <p className="text-sm text-gray-600">Admins</p>
            <p className="text-2xl font-bold">
              {(stats.byRole.PROPERTY_MANAGER || 0) + (stats.byRole.DEPARTMENT_ADMIN || 0)}
            </p>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl mb-2">👷</div>
            <p className="text-sm text-gray-600">Staff</p>
            <p className="text-2xl font-bold">{stats.byRole.STAFF || 0}</p>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl mb-2">🏢</div>
            <p className="text-sm text-gray-600">Departments</p>
            <p className="text-2xl font-bold">{Object.keys(stats.byDepartment).length}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <input
            type="text"
            placeholder="Search users..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            className="form-input flex-1"
          />
          <select
            value={filter.role}
            onChange={(e) => setFilter({ ...filter, role: e.target.value })}
            className="form-input"
          >
            <option value="">All Roles</option>
            <option value="STAFF">Staff</option>
            <option value="DEPARTMENT_ADMIN">Department Admin</option>
            <option value="PROPERTY_MANAGER">Property Manager</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-warm-gold rounded-full flex items-center justify-center text-white font-medium mr-3">
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                  <td className="px-6 py-4 text-sm">{user.department?.name || '-'}</td>
                  <td className="px-6 py-4">{getStatusBadge(user)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {canManageUser(user) && (
                        <>
                          <button
                            onClick={() => openEditModal(user)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          {user.deletedAt ? (
                            <button
                              onClick={() => handleRestoreUser(user.id)}
                              className="text-green-600 hover:text-green-800 text-sm"
                            >
                              Restore
                            </button>
                          ) : (
                            <button
                              onClick={() => handleChangeStatus(user.id, false)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Deactivate
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Add New User</h3>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="form-input"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="form-input"
                  required
                />
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="form-input"
                  >
                    <option value="STAFF">Staff</option>
                    <option value="DEPARTMENT_ADMIN">Department Admin</option>
                    {['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'PROPERTY_MANAGER'].includes(currentUser?.role || '') && (
                      <option value="PROPERTY_MANAGER">Property Manager</option>
                    )}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Department *</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="form-input"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <input
                  type="text"
                  placeholder="Position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="form-input"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="form-input"
                />
                <input
                  type="date"
                  placeholder="Hire Date"
                  value={formData.hireDate}
                  onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                  className="form-input"
                />
                <div className="flex gap-4">
                  <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
                    {loading ? <LoadingSpinner size="sm" /> : 'Create User'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddUser(false);
                      resetForm();
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

      {/* Edit User Modal */}
      {showEditUser && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Edit User</h3>
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="form-input"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="form-input"
                  required
                  disabled
                />
                {['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'PROPERTY_MANAGER'].includes(currentUser?.role || '') && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      className="form-input"
                    >
                      <option value="STAFF">Staff</option>
                      <option value="DEPARTMENT_ADMIN">Department Admin</option>
                      <option value="PROPERTY_MANAGER">Property Manager</option>
                    </select>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium mb-1">Department *</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="form-input"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <input
                  type="text"
                  placeholder="Position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="form-input"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="form-input"
                />
                <input
                  type="date"
                  placeholder="Hire Date"
                  value={formData.hireDate}
                  onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                  className="form-input"
                />
                <div className="flex gap-4">
                  <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
                    {loading ? <LoadingSpinner size="sm" /> : 'Update User'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditUser(false);
                      resetForm();
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
    </div>
  );
};

export default UserManagementPage;