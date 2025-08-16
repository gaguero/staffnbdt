import React, { useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

interface Department {
  id: string;
  name: string;
  description: string;
  managerId?: string;
  managerName?: string;
  employeeCount: number;
  location: string;
  budget: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

const DepartmentsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showAddDepartment, setShowAddDepartment] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    managerId: '',
    location: '',
    budget: ''
  });

  // Mock data - replace with actual API call
  const departments: Department[] = [
    {
      id: 'dept1',
      name: 'Front Office',
      description: 'Guest services, reception, and customer relations',
      managerId: 'mgr1',
      managerName: 'Alice Johnson',
      employeeCount: 12,
      location: 'Main Building - Lobby',
      budget: 150000,
      status: 'active',
      createdAt: '2023-01-15T10:00:00Z'
    },
    {
      id: 'dept2',
      name: 'Housekeeping',
      description: 'Room cleaning, maintenance, and facility upkeep',
      managerId: 'mgr2',
      managerName: 'Bob Martinez',
      employeeCount: 25,
      location: 'Service Building',
      budget: 200000,
      status: 'active',
      createdAt: '2023-01-15T10:00:00Z'
    },
    {
      id: 'dept3',
      name: 'Food & Beverage',
      description: 'Restaurant, bar, and catering services',
      managerId: 'mgr3',
      managerName: 'Carol Davis',
      employeeCount: 18,
      location: 'Restaurant Complex',
      budget: 300000,
      status: 'active',
      createdAt: '2023-01-15T10:00:00Z'
    },
    {
      id: 'dept4',
      name: 'Maintenance',
      description: 'Facility maintenance, repairs, and technical support',
      employeeCount: 8,
      location: 'Maintenance Workshop',
      budget: 100000,
      status: 'active',
      createdAt: '2023-01-15T10:00:00Z'
    },
    {
      id: 'dept5',
      name: 'Administration',
      description: 'HR, accounting, and administrative operations',
      managerId: 'mgr5',
      managerName: 'David Wilson',
      employeeCount: 6,
      location: 'Admin Building',
      budget: 120000,
      status: 'inactive',
      createdAt: '2023-01-15T10:00:00Z'
    }
  ];

  // Mock managers data
  const availableManagers = [
    { id: 'mgr1', name: 'Alice Johnson' },
    { id: 'mgr2', name: 'Bob Martinez' },
    { id: 'mgr3', name: 'Carol Davis' },
    { id: 'mgr4', name: 'Diana Brown' },
    { id: 'mgr5', name: 'David Wilson' }
  ];

  const statuses = [
    { value: 'all', label: 'All Departments' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ];

  const filteredDepartments = departments.filter(dept => {
    const matchesStatus = selectedStatus === 'all' || dept.status === selectedStatus;
    const matchesSearch = dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dept.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (dept.managerName && dept.managerName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
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

    try {
      // TODO: Implement department creation API call
      console.log('Creating department:', formData);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset form and close modal
      setFormData({
        name: '',
        description: '',
        managerId: '',
        location: '',
        budget: ''
      });
      setShowAddDepartment(false);
    } catch (error) {
      console.error('Failed to create department:', error);
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
      default:
        return <span className="badge badge-neutral">Unknown</span>;
    }
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
    active: departments.filter(d => d.status === 'active').length,
    totalEmployees: departments.reduce((sum, d) => sum + d.employeeCount, 0),
    totalBudget: departments.reduce((sum, d) => sum + d.budget, 0)
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
          <p className="text-sm text-gray-600 mb-1">Active</p>
          <p className="text-xl font-bold text-green-600">{stats.active}</p>
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

      {/* Departments Grid */}
      {filteredDepartments.length === 0 ? (
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
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-charcoal">
                        {department.name}
                      </h3>
                      {getStatusBadge(department.status)}
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
                      {department.managerName || 'Unassigned'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Employees:</span>
                    <p className="font-medium text-charcoal">{department.employeeCount}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Location:</span>
                    <p className="font-medium text-charcoal">{department.location}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Budget:</span>
                    <p className="font-medium text-green-600">{formatCurrency(department.budget)}</p>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mb-4">
                  Created: {new Date(department.createdAt).toLocaleDateString()}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button className="btn btn-primary flex-1">
                    <span className="mr-2">✏️</span>
                    Edit
                  </button>
                  <button className="btn btn-outline">
                    <span className="mr-2">👥</span>
                    View Staff
                  </button>
                  <button className="btn btn-secondary">
                    <span>📊</span>
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
            {filteredDepartments
              .filter(dept => dept.status === 'active')
              .map(department => (
                <div key={department.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-warm-gold rounded-full flex items-center justify-center text-white font-medium">
                      {department.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-medium text-charcoal">{department.name}</h4>
                      <p className="text-sm text-gray-600">
                        {department.managerName ? `Manager: ${department.managerName}` : 'No manager assigned'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-charcoal">{department.employeeCount} employees</p>
                    <p className="text-xs text-gray-500">{department.location}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Add Department Modal */}
      {showAddDepartment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-charcoal">
                  Add New Department
                </h3>
                <button
                  onClick={() => setShowAddDepartment(false)}
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
                        {manager.name}
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
                      'Create Department'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddDepartment(false)}
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