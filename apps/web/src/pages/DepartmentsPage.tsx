import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { departmentService } from '../services/departmentService';
import { userService } from '../services/userService';
import { useAuth } from '../contexts/AuthContext';

interface Department {
  id: string;
  name: string;
  description?: string;
  location?: string;
  budget?: number | string;
  managerId?: string;
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    position?: string;
  };
  users?: any[];
  trainingSessions?: any[];
  _count?: {
    users: number;
    trainingSessions?: number;
    documents?: number;
  };
  createdAt: string;
  updatedAt: string;
}

const DepartmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [availableManagers, setAvailableManagers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showAddDepartment, setShowAddDepartment] = useState(false);
  const [showEditDepartment, setShowEditDepartment] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    managerId: '',
    location: '',
    budget: ''
  });

  // Load departments and users on component mount
  useEffect(() => {
    loadDepartments();
    loadAvailableManagers();
  }, []);

  const loadDepartments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await departmentService.getDepartments();
      if (response.success && response.data) {
        setDepartments(response.data);
      } else {
        setError('Failed to load departments');
      }
    } catch (error: any) {
      console.error('Error loading departments:', error);
      setError(error.message || 'Failed to load departments');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableManagers = async () => {
    try {
      const response = await userService.getUsers({ 
        limit: 100 
      });
      if (response.success && response.data) {
        // Filter for users who can be managers (Department Admins and Superadmins)
        const managers = response.data.filter((u: any) => 
          u.role === 'DEPARTMENT_ADMIN' || u.role === 'SUPERADMIN'
        );
        setAvailableManagers(managers);
      }
    } catch (error) {
      console.error('Error loading managers:', error);
    }
  };

  const statuses = [
    { value: 'all', label: 'All Departments' }
  ];

  const filteredDepartments = departments.filter(dept => {
    const matchesSearch = dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (dept.manager && `${dept.manager.firstName} ${dept.manager.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const departmentData = {
        name: formData.name,
        description: formData.description || undefined,
        location: formData.location || undefined,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        managerId: formData.managerId || undefined
      };

      if (showEditDepartment && selectedDepartment) {
        // Update existing department
        const response = await departmentService.updateDepartment(selectedDepartment.id, departmentData);
        if (response.success) {
          await loadDepartments();
          setShowEditDepartment(false);
          setSelectedDepartment(null);
        } else {
          setError(response.message || 'Failed to update department');
        }
      } else {
        // Create new department
        const response = await departmentService.createDepartment(departmentData);
        if (response.success) {
          await loadDepartments();
          setShowAddDepartment(false);
        } else {
          setError(response.message || 'Failed to create department');
        }
      }
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        managerId: '',
        location: '',
        budget: ''
      });
    } catch (error: any) {
      console.error('Failed to save department:', error);
      setError(error.message || 'Failed to save department');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    setFormData({
      name: department.name,
      description: department.description || '',
      managerId: department.managerId || '',
      location: department.location || '',
      budget: department.budget?.toString() || ''
    });
    setShowEditDepartment(true);
    setError(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await departmentService.deleteDepartment(id);
      if (response.success) {
        await loadDepartments();
      } else {
        setError(response.message || 'Failed to delete department');
      }
    } catch (error: any) {
      console.error('Failed to delete department:', error);
      setError(error.message || 'Failed to delete department');
    } finally {
      setIsLoading(false);
    }
  };

  const getEmployeeCount = (department: Department) => {
    return department._count?.users || 0;
  };

  const getManagerName = (department: Department) => {
    if (department.manager) {
      return `${department.manager.firstName} ${department.manager.lastName}`;
    }
    return 'Unassigned';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Calculate department statistics
  const stats = {
    total: departments.length,
    withManagers: departments.filter(d => d.managerId).length,
    totalEmployees: departments.reduce((sum, d) => sum + getEmployeeCount(d), 0),
    totalBudget: departments.reduce((sum, d) => {
      const budget = typeof d.budget === 'string' ? parseFloat(d.budget) : (d.budget || 0);
      return sum + budget;
    }, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2">Department Management</h1>
          <p className="text-gray-600">Manage departments, budgets, and organizational structure</p>
        </div>
        
        <button
          onClick={() => setShowAddDepartment(true)}
          className="btn btn-primary"
        >
          <span className="mr-2">➕</span>
          Add Department
        </button>
      </div>

      {/* Department Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">🏢</div>
          <p className="text-sm text-gray-600 mb-1">Total Departments</p>
          <p className="text-xl font-bold text-charcoal">{stats.total}</p>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">✅</div>
          <p className="text-sm text-gray-600 mb-1">With Managers</p>
          <p className="text-xl font-bold text-green-600">{stats.withManagers}</p>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">👥</div>
          <p className="text-sm text-gray-600 mb-1">Total Employees</p>
          <p className="text-xl font-bold text-blue-600">{stats.totalEmployees}</p>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">💰</div>
          <p className="text-sm text-gray-600 mb-1">Total Budget</p>
          <p className="text-xl font-bold text-purple-600">{formatCurrency(stats.totalBudget)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="flex-1 lg:max-w-md">
            <input
              type="text"
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
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

      {/* Error Message */}
      {error && (
        <div className="card p-4 bg-red-50 border border-red-200">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Departments Grid */}
      {isLoading ? (
        <div className="card p-12 text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 mt-4">Loading departments...</p>
        </div>
      ) : filteredDepartments.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4">🏢</div>
          <h3 className="text-lg font-semibold text-charcoal mb-2">
            No departments found
          </h3>
          <p className="text-gray-600">
            {searchTerm 
              ? `No departments match "${searchTerm}"`
              : 'No departments available'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredDepartments.map(department => (
            <div key={department.id} className="card hover:shadow-medium transition-shadow">
              <div className="card-body">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-charcoal mb-2">
                      {department.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {department.description}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-600">Manager:</span>
                    <p className="font-medium text-charcoal">
                      {getManagerName(department)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Employees:</span>
                    <p className="font-medium text-charcoal">{getEmployeeCount(department)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Location:</span>
                    <p className="font-medium text-charcoal">{department.location || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Budget:</span>
                    <p className="font-medium text-green-600">
                      {department.budget ? formatCurrency(typeof department.budget === 'string' ? parseFloat(department.budget) : department.budget) : 'Not set'}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mb-4">
                  Created: {new Date(department.createdAt).toLocaleDateString()}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  {user?.role === 'SUPERADMIN' && (
                    <>
                      <button 
                        onClick={() => handleEdit(department)}
                        className="btn btn-primary flex-1"
                        disabled={isLoading}
                      >
                        <span className="mr-2">✏️</span>
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(department.id)}
                        className="btn btn-error"
                        disabled={isLoading}
                      >
                        <span>🗑️</span>
                      </button>
                    </>
                  )}
                  <button 
                    className="btn btn-outline"
                    onClick={() => console.log('View staff for', department.name)}
                  >
                    <span className="mr-2">👥</span>
                    Staff ({getEmployeeCount(department)})
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Organizational Chart Preview */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-charcoal">Department Hierarchy</h3>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            {filteredDepartments.map(department => (
              <div key={department.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-warm-gold rounded-full flex items-center justify-center text-white font-medium">
                    {department.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="font-medium text-charcoal">{department.name}</h4>
                    <p className="text-sm text-gray-600">
                      Manager: {getManagerName(department)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-charcoal">{getEmployeeCount(department)} employees</p>
                  <p className="text-xs text-gray-500">{department.location || 'No location'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add/Edit Department Modal */}
      {(showAddDepartment || showEditDepartment) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-charcoal">
                  {showEditDepartment ? 'Edit Department' : 'Add New Department'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddDepartment(false);
                    setShowEditDepartment(false);
                    setSelectedDepartment(null);
                    setFormData({
                      name: '',
                      description: '',
                      managerId: '',
                      location: '',
                      budget: ''
                    });
                    setError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="form-label">Department Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter department name"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="form-input"
                    rows={3}
                    placeholder="Describe the department's responsibilities"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Department Manager</label>
                  <select
                    name="managerId"
                    value={formData.managerId}
                    onChange={handleInputChange}
                    className="form-input"
                  >
                    <option value="">Select Manager (Optional)</option>
                    {availableManagers.map(manager => (
                      <option key={manager.id} value={manager.id}>
                        {`${manager.firstName} ${manager.lastName} - ${manager.position || manager.role}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Physical location or building"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Annual Budget</label>
                  <input
                    type="number"
                    name="budget"
                    value={formData.budget}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="0"
                    min="0"
                    step="1000"
                    required
                  />
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
                      showEditDepartment ? 'Update Department' : 'Create Department'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddDepartment(false);
                      setShowEditDepartment(false);
                      setSelectedDepartment(null);
                      setFormData({
                        name: '',
                        description: '',
                        managerId: '',
                        location: '',
                        budget: ''
                      });
                      setError(null);
                    }}
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

export default DepartmentsPage;