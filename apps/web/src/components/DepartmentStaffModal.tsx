import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import ChangeDepartmentModal from './ChangeDepartmentModal';
import UserDetailsModal from './UserDetailsModal';
import EditUserModal from './EditUserModal';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  position?: string;
  phoneNumber?: string;
  profilePhoto?: string;
  deletedAt?: string | null;
}

interface DepartmentStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentId: string;
  departmentName: string;
}

const DepartmentStaffModal: React.FC<DepartmentStaffModalProps> = ({
  isOpen,
  onClose,
  departmentId,
  departmentName,
}) => {
  const [staff, setStaff] = useState<User[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [hoveredUserId, setHoveredUserId] = useState<string | null>(null);
  const [showChangeDepartment, setShowChangeDepartment] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    if (isOpen && departmentId) {
      loadDepartmentStaff();
    }
  }, [isOpen, departmentId]);

  useEffect(() => {
    filterStaff();
  }, [staff, searchTerm, statusFilter]);

  const loadDepartmentStaff = async () => {
    try {
      setLoading(true);
      const response = await userService.getUsers({
        departmentId,
        includeInactive: true, // Include inactive users
      });
      setStaff(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load department staff:', error);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const filterStaff = () => {
    let filtered = staff;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user =>
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.position?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter === 'active') {
      filtered = filtered.filter(user => !user.deletedAt);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(user => user.deletedAt);
    }

    setFilteredStaff(filtered);
  };


  const handleChangeDepartment = (user: User) => {
    setSelectedUser(user);
    setShowChangeDepartment(true);
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowUserDetails(false);
    setShowEditUser(true);
  };

  const handleModalSuccess = () => {
    loadDepartmentStaff();
  };

  const activeCount = staff.filter(user => !user.deletedAt).length;
  const inactiveCount = staff.filter(user => user.deletedAt).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-sand">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-heading font-bold text-charcoal">
                {departmentName} Staff
              </h2>
              <p className="text-sm text-gray-600">
                {activeCount} active • {inactiveCount} inactive
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search staff by name, email, or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold"
              />
            </div>

            {/* Status Filter */}
            <div className="flex space-x-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  statusFilter === 'all'
                    ? 'bg-warm-gold text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({staff.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  statusFilter === 'active'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Active ({activeCount})
              </button>
              <button
                onClick={() => setStatusFilter('inactive')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  statusFilter === 'inactive'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Inactive ({inactiveCount})
              </button>
            </div>
          </div>
        </div>

        {/* Staff List */}
        <div className="p-6 overflow-y-auto max-h-96">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading staff...</div>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">
                {staff.length === 0 ? 'No staff assigned to this department' : 'No staff match your filters'}
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredStaff.map((user) => (
                <div
                  key={user.id}
                  className={`relative bg-white border rounded-lg p-4 transition-all duration-200 ${
                    user.deletedAt
                      ? 'border-red-200 bg-red-50 opacity-75'
                      : 'border-gray-200 hover:border-warm-gold hover:shadow-md'
                  }`}
                  onMouseEnter={() => setHoveredUserId(user.id)}
                  onMouseLeave={() => setHoveredUserId(null)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-warm-gold text-white rounded-full flex items-center justify-center font-medium">
                        {user.firstName[0]}{user.lastName[0]}
                      </div>

                      {/* User Info */}
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                          {user.deletedAt && (
                            <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                              Inactive
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        {user.position && (
                          <p className="text-sm text-gray-500">{user.position}</p>
                        )}
                        <p className="text-xs text-gray-400 capitalize">{user.role.toLowerCase()}</p>
                      </div>
                    </div>

                    {/* Quick Actions (on hover) */}
                    {hoveredUserId === user.id && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleChangeDepartment(user)}
                          className="px-3 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 hover:bg-purple-200"
                          title="Change department"
                        >
                          Change Dept
                        </button>
                        <button
                          onClick={() => handleViewDetails(user)}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium hover:bg-blue-200"
                          title="View user details"
                        >
                          View Details
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Change Department Modal */}
      {selectedUser && (
        <ChangeDepartmentModal
          isOpen={showChangeDepartment}
          onClose={() => setShowChangeDepartment(false)}
          user={selectedUser}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <UserDetailsModal
          isOpen={showUserDetails}
          onClose={() => setShowUserDetails(false)}
          user={selectedUser}
          onEdit={handleEditUser}
        />
      )}

      {/* Edit User Modal */}
      {selectedUser && (
        <EditUserModal
          isOpen={showEditUser}
          onClose={() => setShowEditUser(false)}
          user={selectedUser}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
};

export default DepartmentStaffModal;