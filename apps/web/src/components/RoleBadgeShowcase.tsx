import React from 'react';
import RoleBadge from './RoleBadge';
import RoleBadgeGroup from './RoleBadgeGroup';
import UserCard from './UserCard';
import { Role } from '../../../../packages/types/enums';
import { SYSTEM_ROLES } from '../types/role';

const RoleBadgeShowcase: React.FC = () => {
  const mockCustomRoles = [
    {
      id: '1',
      name: 'Night Manager',
      description: 'Manages overnight operations and security',
      level: 3
    },
    {
      id: '2',
      name: 'Event Coordinator',
      description: 'Coordinates special events and conferences',
      level: 4
    },
    {
      id: '3',
      name: 'VIP Concierge',
      description: 'Provides premium concierge services to VIP guests',
      level: 4
    }
  ];

  const mockUser = {
    id: '1',
    email: 'john.doe@hotel.com',
    firstName: 'John',
    lastName: 'Doe',
    role: Role.PROPERTY_MANAGER,
    position: 'Senior Property Manager',
    phoneNumber: '+1 (555) 123-4567',
    hireDate: '2023-01-15',
    department: {
      id: '1',
      name: 'Operations',
      level: 1
    },
    properties: [
      {
        id: '1',
        name: 'Grand Hotel Downtown',
        code: 'GHD',
        address: '123 Main St, City, State'
      }
    ],
    createdAt: '2023-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  };

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Role Badge System Showcase
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          A comprehensive demonstration of the role badge components and their various configurations
          for the Hotel Operations Hub.
        </p>
      </div>

      {/* System Roles Section */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">System Roles</h2>
          <p className="text-gray-600 mb-6">
            Built-in role hierarchy with predefined permissions and styling.
          </p>
        </div>

        {/* All Size Variants */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Size Variants</h3>
          <div className="space-y-4">
            {Object.values(Role).map((role) => (
              <div key={role} className="flex items-center gap-4">
                <div className="w-32 text-sm text-gray-600 font-medium">
                  {SYSTEM_ROLES[role as keyof typeof SYSTEM_ROLES]?.label || role}:
                </div>
                <div className="flex items-center gap-2">
                  <RoleBadge role={role} size="sm" showTooltip={false} />
                  <RoleBadge role={role} size="md" showTooltip={false} />
                  <RoleBadge role={role} size="lg" showTooltip={false} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* With Tooltips */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            With Tooltips (Hover to see descriptions)
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.values(Role).map((role) => (
              <RoleBadge
                key={role}
                role={role}
                size="md"
                showTooltip={true}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Custom Roles Section */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Custom Roles</h2>
          <p className="text-gray-600 mb-6">
            User-defined roles with custom styling and descriptions.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Custom Role Examples</h3>
          <div className="flex flex-wrap gap-2">
            {mockCustomRoles.map((role) => (
              <RoleBadge
                key={role.id}
                role={role.name}
                isCustomRole={true}
                size="md"
                showTooltip={true}
                customRoles={[role]}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Role Badge Groups Section */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Role Badge Groups</h2>
          <p className="text-gray-600 mb-6">
            Display multiple roles for users with both system and custom role assignments.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Multiple Roles Example</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 w-24">User with 2 roles:</span>
                <RoleBadgeGroup
                  systemRole={Role.PROPERTY_MANAGER}
                  customRoles={[mockCustomRoles[0]]}
                  size="md"
                  maxVisible={3}
                />
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 w-24">User with 3+ roles:</span>
                <RoleBadgeGroup
                  systemRole={Role.DEPARTMENT_ADMIN}
                  customRoles={mockCustomRoles}
                  size="md"
                  maxVisible={2}
                />
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 w-24">Vertical layout:</span>
                <RoleBadgeGroup
                  systemRole={Role.STAFF}
                  customRoles={[mockCustomRoles[1], mockCustomRoles[2]]}
                  size="sm"
                  direction="vertical"
                  maxVisible={4}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Card Integration */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">User Card Integration</h2>
          <p className="text-gray-600 mb-6">
            Role badges integrated into user profile cards for real-world usage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <UserCard
            user={mockUser}
            customRoles={mockCustomRoles}
            showDetails={true}
            showActions={true}
            onEdit={() => console.log('Edit user')}
            onDelete={() => console.log('Delete user')}
          />
          
          <UserCard
            user={{
              ...mockUser,
              id: '2',
              firstName: 'Sarah',
              lastName: 'Johnson',
              role: Role.DEPARTMENT_ADMIN,
              position: 'Housekeeping Supervisor',
              email: 'sarah.johnson@hotel.com'
            }}
            showDetails={true}
            showActions={false}
          />
          
          <UserCard
            user={{
              ...mockUser,
              id: '3',
              firstName: 'Mike',
              lastName: 'Chen',
              role: Role.STAFF,
              position: 'Front Desk Associate',
              email: 'mike.chen@hotel.com',
              deletedAt: '2024-01-01T00:00:00Z'
            }}
            showDetails={true}
            showActions={true}
            onEdit={() => console.log('Edit user')}
            onDelete={() => console.log('Restore user')}
          />
        </div>
      </section>

      {/* Usage Examples */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Usage Examples</h2>
          <p className="text-gray-600 mb-6">
            Common implementation patterns and code examples.
          </p>
        </div>

        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-white text-lg font-medium mb-4">Basic Usage</h3>
          <pre className="text-green-400 text-sm overflow-x-auto">
{`// Basic system role badge
<RoleBadge 
  role={Role.PROPERTY_MANAGER} 
  size="md" 
  showTooltip={true} 
/>

// Custom role badge
<RoleBadge 
  role="Night Manager"
  isCustomRole={true}
  customRoles={customRoleData}
  size="sm"
/>

// Multiple roles
<RoleBadgeGroup
  systemRole={user.role}
  customRoles={userCustomRoles}
  maxVisible={3}
  direction="horizontal"
/>`}
          </pre>
        </div>
      </section>

      {/* Accessibility Features */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Accessibility Features</h2>
          <p className="text-gray-600 mb-6">
            Built-in accessibility support for screen readers and keyboard navigation.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Proper ARIA labels and roles for screen readers</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Keyboard focus management for interactive elements</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>High contrast colors that meet WCAG guidelines</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Descriptive tooltips with role information</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Icon alternatives for users who can't see emojis</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Responsive design that works on all devices</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default RoleBadgeShowcase;