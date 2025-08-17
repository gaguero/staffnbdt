import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import DepartmentStaffModal from '../components/DepartmentStaffModal';
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
  parentId?: string;
  level: number;
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    position?: string;
  };
  parent?: {
    id: string;
    name: string;
    level: number;
  };
  children?: Array<{
    id: string;
    name: string;
    level: number;
  }>;
  users?: any[];
  trainingSessions?: any[];
  _count?: {
    users: number;
    children?: number;
    trainingSessions?: number;
    documents?: number;
  };
  createdAt: string;
  updatedAt: string;
}

const DepartmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [hierarchyDepartments, setHierarchyDepartments] = useState<Department[]>([]);
  const [availableManagers, setAvailableManagers] = useState<any[]>([]);
  const [availableParents, setAvailableParents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showAddDepartment, setShowAddDepartment] = useState(false);
  const [showEditDepartment, setShowEditDepartment] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedDepartmentForStaff, setSelectedDepartmentForStaff] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    managerId: '',
    parentId: '',
    location: '',
    budget: ''
  });

  // Load departments and users on component mount
  useEffect(() => {
    loadDepartments();
    loadHierarchy();
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
        // The actual users array is nested in data.data
        const users = response.data.data || [];
        // Filter for users who can be managers (Department Admins and Superadmins)
        const managers = users.filter((u: any) => 
          u.role === 'DEPARTMENT_ADMIN' || u.role === 'SUPERADMIN'
        );
        setAvailableManagers(managers);
      }
    } catch (error) {
      console.error('Error loading managers:', error);
    }
  };

  const loadHierarchy = async () => {
    try {
      const response = await departmentService.getHierarchy();
      if (response.success && response.data) {
        setHierarchyDepartments(response.data);
      }
    } catch (error) {
      console.error('Error loading hierarchy:', error);
    }
  };

  const loadAvailableParents = async (excludeId?: string) => {
    try {
      const response = excludeId 
        ? await departmentService.getDepartmentsForDropdownWithExclusion(excludeId)
        : await departmentService.getDepartmentsForDropdown();
      if (response.success && response.data) {
        setAvailableParents(response.data);
      }
    } catch (error) {
      console.error('Error loading parent departments:', error);
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
      const departmentData: any = {
        name: formData.name,
      };

      // Only add fields that have values
      if (formData.description?.trim()) {
        departmentData.description = formData.description;
      }
      if (formData.location?.trim()) {
        departmentData.location = formData.location;
      }
      if (formData.budget && !isNaN(parseFloat(formData.budget))) {
        departmentData.budget = parseFloat(formData.budget);
      }
      if (formData.managerId?.trim()) {
        departmentData.managerId = formData.managerId;
      }
      if (formData.parentId?.trim()) {
        departmentData.parentId = formData.parentId;
      }

      if (showEditDepartment && selectedDepartment) {
        // Update existing department
        const response = await departmentService.updateDepartment(selectedDepartment.id, departmentData);
        if (response.success) {
          await loadDepartments();
          await loadHierarchy();
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
          await loadHierarchy();
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
        parentId: '',
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

  const handleEdit = async (department: Department) => {
    setSelectedDepartment(department);
    setFormData({
      name: department.name,
      description: department.description || '',
      managerId: department.managerId || '',
      parentId: department.parentId || '',
      location: department.location || '',
      budget: department.budget?.toString() || ''
    });
    // Load available parent departments excluding this department and its descendants
    await loadAvailableParents(department.id);
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
        await loadHierarchy();
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

  const handleAddDepartment = async () => {
    await loadAvailableParents();
    setShowAddDepartment(true);
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

  const renderDepartmentTree = (departments: Department[], level: number = 0): React.ReactNode => {
    return departments.map(department => (
      <div key={department.id}>
        <div 
          className={`group flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-gray-100 ${
            level === 0 ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-gray-50'
          }`}
          style={{ marginLeft: `${level * 24}px` }}
        >
          <div className="flex items-center space-x-3">
            {/* Tree connector */}
            {level > 0 && (
              <div className="text-gray-400 text-sm">
                └─
              </div>
            )}
            
            {/* Department icon */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-xs ${
              level === 0 ? 'bg-blue-600' : level === 1 ? 'bg-green-500' : 'bg-warm-gold'
            }`}>
              {department.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
            </div>
            
            {/* Department info */}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium text-charcoal">{department.name}</h4>
                {department.parent && (
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                    under {department.parent.name}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                Manager: {getManagerName(department)} • {getEmployeeCount(department)} employees
              </p>
              {department.location && (
                <p className="text-xs text-gray-500">📍 {department.location}</p>
              )}
            </div>
          </div>
          
          {/* Department stats and actions */}
          <div className="flex items-center gap-3">
            {/* Stats */}
            <div className="text-right">
              <div className="text-xs text-gray-500 space-y-1">
                {department._count?.children && department._count.children > 0 && (
                  <p>🏢 {department._count.children} sub-dept{department._count.children > 1 ? 's' : ''}</p>
                )}
                {department.budget && (
                  <p className="text-green-600 font-medium">
                    {formatCurrency(typeof department.budget === 'string' ? parseFloat(department.budget) : department.budget)}
                  </p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {user?.role === 'SUPERADMIN' && (
                <>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(department);
                    }}
                    className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition-colors"
                    disabled={isLoading}
                    title="Edit Department"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(department.id);
                    }}
                    className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded transition-colors"
                    disabled={isLoading}
                    title="Delete Department"
                  >
                    🗑️
                  </button>
                </>
              )}
              <button 
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDepartmentForStaff(department);
                  setShowStaffModal(true);
                }}
                title={`View Staff (${getEmployeeCount(department)})`}
              >
                👥 {getEmployeeCount(department)}
              </button>
            </div>
          </div>
        </div>
        
        {/* Render children recursively */}
        {department.children && department.children.length > 0 && (
          renderDepartmentTree(department.children as Department[], level + 1)
        )}
      </div>
    ));
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
          onClick={handleAddDepartment}
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
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-charcoal">
                        {department.name}
                      </h3>
                      
                      {/* Hierarchy Level Badge */}
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        department.level === 0 
                          ? 'bg-blue-100 text-blue-800' 
                          : department.level === 1 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-warm-gold bg-opacity-20 text-warm-gold'
                      }`}>
                        Level {department.level}
                      </span>

                      {/* Parent Department Badge */}
                      {department.parent && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          under {department.parent.name}
                        </span>
                      )}

                      {/* Sub-departments Count Badge */}
                      {department._count?.children && department._count.children > 0 && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          {department._count.children} sub-dept{department._count.children > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    
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
                    onClick={() => {
                      setSelectedDepartmentForStaff(department);
                      setShowStaffModal(true);
                    }}
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
          {hierarchyDepartments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🏗️</div>
              <p>Loading department hierarchy...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {renderDepartmentTree(hierarchyDepartments)}
            </div>
          )}
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
                      parentId: '',
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
                  <label className="form-label">Parent Department</label>
                  <select
                    name="parentId"
                    value={formData.parentId}
                    onChange={handleInputChange}
                    className="form-input"
                  >
                    <option value="">No Parent (Top Level)</option>
                    {availableParents.map(parent => (
                      <option key={parent.id} value={parent.id}>
                        {'  '.repeat(parent.level)}{parent.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Select a parent department to create a hierarchical structure
                  </p>
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
                        parentId: '',
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

      {/* Staff Modal */}
      {selectedDepartmentForStaff && (
        <DepartmentStaffModal
          isOpen={showStaffModal}
          onClose={() => {
            setShowStaffModal(false);
            setSelectedDepartmentForStaff(null);
          }}
          departmentId={selectedDepartmentForStaff.id}
          departmentName={selectedDepartmentForStaff.name}
        />
      )}
    </div>
  );
};

export default DepartmentsPage;