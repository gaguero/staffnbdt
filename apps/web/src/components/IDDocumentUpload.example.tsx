import React from 'react';
import IDDocumentUpload from './IDDocumentUpload';

/**
 * Example usage of IDDocumentUpload component
 * 
 * This component provides secure ID document upload and verification functionality
 * for Hotel Operations Hub with the following features:
 * 
 * SECURITY FEATURES:
 * - Documents are encrypted before storage (AES-256-CBC)
 * - Only PDF, JPG, PNG files allowed (10MB max)
 * - Pre-signed URLs for secure file access
 * - Role-based access control for verification
 * 
 * USER FEATURES:
 * - Drag & drop file upload interface
 * - Real-time upload progress with encryption status
 * - File validation (type, size)
 * - Mobile-responsive design
 * - Accessibility compliant (WCAG AA)
 * 
 * ADMIN FEATURES:
 * - Document download for verification
 * - Approve/Reject verification workflow
 * - Verification notes and audit trail
 * - Department-scoped access control
 * 
 * VERIFICATION STATES:
 * - PENDING: Awaiting admin review
 * - VERIFIED: Document approved by admin
 * - REJECTED: Document rejected with reason
 * - EXPIRED: Document verification expired
 */

// Example 1: Standard user upload interface
export const UserIDUploadExample: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="heading-2 mb-6">User ID Document Upload</h2>
      
      <IDDocumentUpload
        onStatusUpdate={(_status) => {
          // Verification status changed
          // Handle status updates (e.g., show notifications)
        }}
        onDocumentUpdate={(_hasDocument) => {
          // Document upload status changed
          // Update UI based on document presence
        }}
      />
    </div>
  );
};

// Example 2: Admin verification interface
export const AdminVerificationExample: React.FC = () => {
  const userId = "user123"; // The user whose document to verify
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="heading-2 mb-6">Admin Document Verification</h2>
      
      <IDDocumentUpload
        showAdminControls={true}
        userId={userId}
        onStatusUpdate={(_status) => {
          // Admin updated status
          // Refresh user list or update verification queue
        }}
      />
    </div>
  );
};

// Example 3: Integration within ProfilePage
export const ProfilePageIntegrationExample: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Other profile sections... */}
      
      {/* ID Document Verification Section */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-charcoal">Identity Verification</h3>
          <p className="text-sm text-gray-600 mt-1">
            Upload your official ID document for account verification
          </p>
        </div>
        <div className="card-body">
          <IDDocumentUpload
            onStatusUpdate={(_status) => {
              // Update profile completion status
              // ID verification status updated
            }}
            onDocumentUpdate={(_hasDocument) => {
              // Update profile completeness indicator
              // Has ID document status updated
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Example 4: Verification queue for administrators
export const VerificationQueueExample: React.FC = () => {
  const pendingUsers = [
    { id: "user1", name: "John Doe", department: "IT" },
    { id: "user2", name: "Jane Smith", department: "HR" },
    { id: "user3", name: "Bob Johnson", department: "Finance" }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="heading-2 mb-6">ID Verification Queue</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {pendingUsers.map((user) => (
          <div key={user.id} className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-charcoal">{user.name}</h3>
              <p className="text-sm text-gray-600">{user.department}</p>
            </div>
            <div className="card-body">
              <IDDocumentUpload
                showAdminControls={true}
                userId={user.id}
                onStatusUpdate={(_status) => {
                  // User verification updated
                  // Remove from queue or update status
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// API Integration Examples
export const apiExamples = {
  // Upload ID document
  uploadDocument: async (file: File) => {
    const formData = new FormData();
    formData.append('idDocument', file);
    
    const response = await fetch('/api/profile/id', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    });
    
    return response.json();
  },
  
  // Check verification status
  getStatus: async (userId?: string) => {
    const endpoint = userId 
      ? `/api/profile/id/${userId}/status`
      : '/api/profile/id/status';
      
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    
    return response.json();
  },
  
  // Admin: Verify document
  verifyDocument: async (userId: string, status: 'VERIFIED' | 'REJECTED', notes?: string) => {
    const response = await fetch(`/api/profile/id/${userId}/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, notes }),
    });
    
    return response.json();
  },
  
  // Admin: Download document
  downloadDocument: async (userId: string) => {
    const response = await fetch(`/api/profile/id/${userId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'id-document';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};

/**
 * Component Props Interface
 * 
 * interface IDDocumentUploadProps {
 *   onStatusUpdate?: (status: IdVerificationStatus) => void;
 *   onDocumentUpdate?: (hasDocument: boolean) => void;
 *   showAdminControls?: boolean;
 *   userId?: string; // Required when showAdminControls is true
 * }
 * 
 * IdVerificationStatus enum:
 * - PENDING: Document uploaded, awaiting review
 * - VERIFIED: Document approved by admin
 * - REJECTED: Document rejected with reason
 * - EXPIRED: Document verification has expired
 */

export default {
  UserIDUploadExample,
  AdminVerificationExample,
  ProfilePageIntegrationExample,
  VerificationQueueExample,
  apiExamples
};