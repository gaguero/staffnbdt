import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import {
  IdVerificationStatus,
  IdDocumentStatus,
  VerificationAction,
  IDDocumentUploadProps,
  FILE_CONSTRAINTS,
  getStatusColor,
  getStatusIcon,
  formatFileSize,
  formatDate,
  validateFile
} from '../types/profile';


const IDDocumentUpload: React.FC<IDDocumentUploadProps> = ({
  onStatusUpdate,
  onDocumentUpdate,
  showAdminControls = false,
  userId
}) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isProcessingVerification, setIsProcessingVerification] = useState(false);
  const [documentStatus, setDocumentStatus] = useState<IdDocumentStatus | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File validation constants from shared types
  const { ALLOWED_EXTENSIONS } = FILE_CONSTRAINTS.ID_DOCUMENT;

  // Determine which user ID to use for API calls
  const targetUserId = showAdminControls && userId ? userId : user?.id;


  const fetchDocumentStatus = async () => {
    if (!targetUserId) return;

    try {
      setIsLoadingStatus(true);
      setError(null);

      const endpoint = showAdminControls && userId 
        ? `/api/profile/id/${userId}/status`
        : '/api/profile/id/status';

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        const status: IdDocumentStatus = result.data;
        setDocumentStatus(status);
        
        if (onStatusUpdate) {
          onStatusUpdate(status.status);
        }
        if (onDocumentUpdate) {
          onDocumentUpdate(!!status);
        }
      } else if (response.status === 404) {
        // No document uploaded yet
        setDocumentStatus(null);
        if (onDocumentUpdate) {
          onDocumentUpdate(false);
        }
      } else {
        throw new Error('Failed to fetch document status');
      }
    } catch (error) {
      console.error('Error fetching document status:', error);
      setError('Failed to load document status');
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file, FILE_CONSTRAINTS.ID_DOCUMENT);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    handleFileUpload(file);
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!targetUserId) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);

      // Create FormData for upload
      const formData = new FormData();
      formData.append('idDocument', file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Make API call to upload
      const response = await fetch('/api/profile/id', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload ID document');
      }

      await response.json();
      
      // Refresh document status after successful upload
      setTimeout(() => {
        fetchDocumentStatus();
        setUploadProgress(0);
      }, 500);

    } catch (error) {
      console.error('Upload failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload ID document');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleVerificationAction = async (action: IdVerificationStatus) => {
    if (!userId || !showAdminControls) return;

    try {
      setIsProcessingVerification(true);
      setError(null);

      const requestBody: VerificationAction = {
        status: action,
        notes: verificationNotes.trim() || undefined
      };

      const response = await fetch(`/api/profile/id/${userId}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update verification status');
      }

      // Refresh document status
      await fetchDocumentStatus();
      setShowVerificationModal(false);
      setVerificationNotes('');

    } catch (error) {
      console.error('Verification failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to update verification status');
    } finally {
      setIsProcessingVerification(false);
    }
  };

  const handleDownloadDocument = async () => {
    if (!userId || !showAdminControls) return;

    try {
      const response = await fetch(`/api/profile/id/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download document');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = documentStatus?.filename || 'id-document';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Download failed:', error);
      setError('Failed to download document');
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Load document status on mount
  useEffect(() => {
    fetchDocumentStatus();
  }, [targetUserId]);

  const isAdmin = ['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'PROPERTY_MANAGER', 'DEPARTMENT_ADMIN'].includes(user?.role || '');
  const canUpload = !showAdminControls && !isUploading;
  const canVerify = showAdminControls && isAdmin && documentStatus && documentStatus.status === IdVerificationStatus.PENDING;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-charcoal">
            {showAdminControls ? 'User ID Document' : 'ID Document Verification'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {showAdminControls 
              ? 'Review and verify the uploaded ID document'
              : 'Upload your official identification document for verification'
            }
          </p>
        </div>
        
        {/* Encryption Status Indicator */}
        <div className="flex items-center space-x-2 text-sm">
          <div className="flex items-center text-green-600">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="font-medium">Encrypted</span>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="inline-flex text-red-400 hover:text-red-600"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Status */}
      {isLoadingStatus ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-center space-x-3">
            <LoadingSpinner size="sm" />
            <span className="text-gray-600">Loading document status...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Document Status Display */}
          {documentStatus ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="text-2xl">{getStatusIcon(documentStatus.status)}</div>
                    <div>
                      <h4 className="text-lg font-medium text-charcoal">Document Status</h4>
                      <span className={`badge ${getStatusColor(documentStatus.status)}`}>
                        {documentStatus.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    {documentStatus.uploadedAt && (
                      <div>
                        <span className="font-medium">Uploaded:</span>
                        <div>{formatDate(documentStatus.uploadedAt)}</div>
                      </div>
                    )}
                    
                    {documentStatus.verifiedAt && (
                      <div>
                        <span className="font-medium">Verified:</span>
                        <div>{formatDate(documentStatus.verifiedAt)}</div>
                      </div>
                    )}
                    
                    {documentStatus.filename && (
                      <div>
                        <span className="font-medium">Filename:</span>
                        <div className="break-all">{documentStatus.filename}</div>
                      </div>
                    )}
                    
                    {documentStatus.size && (
                      <div>
                        <span className="font-medium">Size:</span>
                        <div>{formatFileSize(documentStatus.size)}</div>
                      </div>
                    )}
                  </div>

                  {documentStatus.rejectionReason && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <h5 className="font-medium text-red-800 mb-1">Rejection Reason:</h5>
                      <p className="text-sm text-red-700">{documentStatus.rejectionReason}</p>
                    </div>
                  )}
                </div>

                {/* Admin Controls */}
                {showAdminControls && isAdmin && (
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={handleDownloadDocument}
                      className="btn btn-outline btn-sm"
                      title="Download Document"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m6 0H6" />
                      </svg>
                      Download
                    </button>
                    
                    {canVerify && (
                      <button
                        onClick={() => setShowVerificationModal(true)}
                        className="btn btn-primary btn-sm"
                      >
                        Verify
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* No Document Uploaded State */
            !showAdminControls && (
              <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                <div className="text-4xl mb-4">📄</div>
                <h4 className="text-lg font-medium text-charcoal mb-2">No ID Document Uploaded</h4>
                <p className="text-gray-600">Upload your identification document to begin the verification process.</p>
              </div>
            )
          )}

          {/* Upload Progress */}
          {isUploading && uploadProgress > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Uploading and encrypting document...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-warm-gold h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="flex items-center mt-2 text-xs text-gray-500">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Document is being encrypted for security
              </div>
            </div>
          )}

          {/* Upload Area */}
          {canUpload && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-warm-gold bg-sand bg-opacity-20'
                  : 'border-gray-300 hover:border-warm-gold'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="space-y-4">
                <div className="text-4xl">
                  {documentStatus ? '🔄' : '📤'}
                </div>
                <div>
                  <h4 className="text-lg font-medium text-charcoal">
                    {documentStatus ? 'Replace Document' : 'Upload ID Document'}
                  </h4>
                  <p className="text-gray-600 mt-1">
                    Drag & drop your ID document here, or{' '}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-warm-gold hover:underline font-medium"
                    >
                      browse files
                    </button>
                  </p>
                </div>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>Supports PDF, JPG, PNG • Max 10MB</p>
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-green-600 font-medium">Your document will be encrypted and stored securely</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upload Button */}
          {canUpload && (
            <div className="text-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="btn btn-primary"
              >
                {documentStatus ? 'Replace Document' : 'Choose File to Upload'}
              </button>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_EXTENSIONS.join(',')}
            onChange={handleFileInputChange}
            className="hidden"
            disabled={!canUpload}
          />
        </>
      )}

      {/* Verification Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-charcoal">
                  Verify ID Document
                </h3>
                <button
                  onClick={() => setShowVerificationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={isProcessingVerification}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="form-label">Verification Notes (Optional)</label>
                  <textarea
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="Add any notes about the verification..."
                    className="form-input h-24 resize-none"
                    disabled={isProcessingVerification}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {verificationNotes.length}/500 characters
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => handleVerificationAction(IdVerificationStatus.VERIFIED)}
                    disabled={isProcessingVerification}
                    className="btn btn-success flex-1"
                  >
                    {isProcessingVerification ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <span className="mr-1">✓</span>
                        Approve
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleVerificationAction(IdVerificationStatus.REJECTED)}
                    disabled={isProcessingVerification}
                    className="btn btn-error flex-1"
                  >
                    {isProcessingVerification ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <span className="mr-1">✗</span>
                        Reject
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={() => setShowVerificationModal(false)}
                  disabled={isProcessingVerification}
                  className="btn btn-secondary w-full"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IDDocumentUpload;