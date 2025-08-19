import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import InvitationModal from '../components/InvitationModal';
import EmergencyContactsForm from '../components/EmergencyContactsForm';
import VerificationQueue from '../components/VerificationQueue';
import TenantDemo from '../components/TenantDemo';

const ComponentsTestPage: React.FC = () => {
  const { user } = useAuth();
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [isEditingEmergencyContacts, setIsEditingEmergencyContacts] = useState(false);
  const [activeTab, setActiveTab] = useState('tenant');

  // Mock emergency contacts data for testing
  const mockEmergencyContacts = {
    primaryContact: {
      name: 'Jane Doe',
      relationship: 'Spouse',
      phoneNumber: '+1 (555) 123-4567',
      email: 'jane.doe@example.com',
    },
    secondaryContact: {
      name: 'John Smith',
      relationship: 'Friend',
      phoneNumber: '+1 (555) 987-6543',
      email: 'john.smith@example.com',
    },
  };

  const tabs = [
    { id: 'tenant', label: 'Tenant Context', icon: '🏨' },
    { id: 'invitation', label: 'Invitation Modal', icon: '📧' },
    { id: 'emergency', label: 'Emergency Contacts', icon: '🚨' },
    { id: 'verification', label: 'Verification Queue', icon: '📋' },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Please log in to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-warm-gold rounded-full flex items-center justify-center">
              <span className="text-white text-lg">🧪</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-charcoal">
                Components Test Page
              </h1>
              <p className="text-gray-600">
                Testing the new UI components for the Hotel Operations Hub
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-warm-gold text-warm-gold'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {/* Tenant Context Test */}
        {activeTab === 'tenant' && (
          <div className="max-w-7xl mx-auto">
            <TenantDemo />
          </div>
        )}

        {/* Invitation Modal Test */}
        {activeTab === 'invitation' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-charcoal">
                    Invitation Modal Component
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Test the user invitation modal with validation and department selection
                  </p>
                </div>
                <button
                  onClick={() => setShowInvitationModal(true)}
                  className="px-4 py-2 bg-warm-gold text-white rounded-md hover:bg-warm-gold/90 transition-colors flex items-center space-x-2"
                  data-testid="open-invitation-modal"
                >
                  <span>📧</span>
                  <span>Open Invitation Modal</span>
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Features to Test:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Email validation (required, format)</li>
                  <li>• Role selection with appropriate department requirements</li>
                  <li>• Department selection for STAFF and DEPARTMENT_ADMIN roles</li>
                  <li>• Form validation and error display</li>
                  <li>• Loading states and success/error feedback</li>
                  <li>• Responsive design and accessibility</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Emergency Contacts Test */}
        {activeTab === 'emergency' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-charcoal">
                    Emergency Contacts Form Component
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Test the emergency contacts form with validation and dual contact support
                  </p>
                </div>
                <button
                  onClick={() => setIsEditingEmergencyContacts(!isEditingEmergencyContacts)}
                  className={`px-4 py-2 rounded-md transition-colors flex items-center space-x-2 ${
                    isEditingEmergencyContacts
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-warm-gold text-white hover:bg-warm-gold/90'
                  }`}
                  data-testid="toggle-emergency-contacts-edit"
                >
                  <span>{isEditingEmergencyContacts ? '✕' : '✏️'}</span>
                  <span>{isEditingEmergencyContacts ? 'Cancel Edit' : 'Edit Contacts'}</span>
                </button>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-yellow-900 mb-2">Features to Test:</h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Primary contact validation (name, phone, relationship required)</li>
                  <li>• Secondary contact validation (optional but if name provided, phone required)</li>
                  <li>• Phone number format validation</li>
                  <li>• Email format validation (optional)</li>
                  <li>• Form state management and error display</li>
                  <li>• Save/cancel functionality with loading states</li>
                </ul>
              </div>

              <EmergencyContactsForm
                initialData={mockEmergencyContacts}
                isEditing={isEditingEmergencyContacts}
                onSave={(data: any) => {
                  console.log('Emergency contacts saved:', data);
                  setIsEditingEmergencyContacts(false);
                }}
                onCancel={() => setIsEditingEmergencyContacts(false)}
              />
            </div>
          </div>
        )}

        {/* Verification Queue Test */}
        {activeTab === 'verification' && (
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-charcoal">
                  Verification Queue Component
                </h2>
                <p className="text-gray-600 mt-1">
                  Test the ID document verification admin interface
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-green-900 mb-2">Features to Test:</h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Document list with filtering by status</li>
                  <li>• Document preview with zoom capability</li>
                  <li>• Approve/reject actions with notes</li>
                  <li>• Status statistics and progress tracking</li>
                  <li>• Responsive table and modal design</li>
                  <li>• Loading states and error handling</li>
                </ul>
              </div>
            </div>

            <VerificationQueue />
          </div>
        )}
      </div>

      {/* Invitation Modal */}
      <InvitationModal
        isOpen={showInvitationModal}
        onClose={() => setShowInvitationModal(false)}
        onSuccess={() => {
          console.log('Invitation sent successfully');
          setShowInvitationModal(false);
        }}
      />
    </div>
  );
};

export default ComponentsTestPage;