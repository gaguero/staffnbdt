import React, { useState, useEffect, useCallback } from 'react';
import { profileService, IdVerificationStatus, VerificationAction, IdDocumentStatus } from '../services/profileService';
import { userService, User } from '../services/userService';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

interface DocumentToVerify {
  userId: string;
  user: User;
  documentStatus: IdDocumentStatus;
}

interface VerificationQueueProps {
  className?: string;
}

const VerificationQueue: React.FC<VerificationQueueProps> = ({ className = '' }) => {
  const [documents, setDocuments] = useState<DocumentToVerify[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<DocumentToVerify | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documentBlob, setDocumentBlob] = useState<string | null>(null);
  const [loadingDocument, setLoadingDocument] = useState(false);
  const [filter, setFilter] = useState<IdVerificationStatus | 'ALL'>('PENDING');
  const [verificationNotes, setVerificationNotes] = useState('');

  // Load documents that need verification
  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get all users
      const usersResponse = await userService.getUsers({
        includeInactive: false,
      });
      const users = usersResponse.data?.data || [];

      // Get document status for each user
      const documentsToVerify: DocumentToVerify[] = [];
      
      for (const user of users) {
        try {
          const documentStatus = await profileService.getIdDocumentStatusForUser(user.id);
          
          // Include based on filter
          const shouldInclude = filter === 'ALL' || documentStatus.status === filter;
          
          if (shouldInclude && documentStatus.uploadedAt) {
            documentsToVerify.push({
              userId: user.id,
              user,
              documentStatus,
            });
          }
        } catch (error) {
          // User doesn't have a document uploaded, skip
          continue;
        }
      }

      // Sort by upload date (newest first)
      documentsToVerify.sort((a, b) => {
        const dateA = new Date(a.documentStatus.uploadedAt!).getTime();
        const dateB = new Date(b.documentStatus.uploadedAt!).getTime();
        return dateB - dateA;
      });

      setDocuments(documentsToVerify);
    } catch (error) {
      console.error('Failed to load documents:', error);
      toast.error('Failed to load documents for verification');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const openDocumentViewer = async (document: DocumentToVerify) => {
    try {
      setLoadingDocument(true);
      setSelectedDocument(document);
      
      const blob = await profileService.downloadIdDocument(document.userId);
      const url = URL.createObjectURL(blob);
      setDocumentBlob(url);
      setShowDocumentModal(true);
      setVerificationNotes('');
    } catch (error) {
      console.error('Failed to load document:', error);
      toast.error('Failed to load document');
    } finally {
      setLoadingDocument(false);
    }
  };

  const closeDocumentViewer = () => {
    if (documentBlob) {
      URL.revokeObjectURL(documentBlob);
      setDocumentBlob(null);
    }
    setSelectedDocument(null);
    setShowDocumentModal(false);
    setVerificationNotes('');
  };

  const handleVerification = async (userId: string, status: IdVerificationStatus, notes?: string) => {
    try {
      setProcessing(userId);
      
      const action: VerificationAction = {
        status,
        notes: notes?.trim() || undefined,
      };

      await profileService.verifyIdDocument(userId, action);
      
      const actionText = status === IdVerificationStatus.VERIFIED ? 'approved' : 'rejected';
      toast.success(`Document ${actionText} successfully`);
      
      // Reload documents
      await loadDocuments();
      
      // Close modal if open
      if (showDocumentModal) {
        closeDocumentViewer();
      }
    } catch (error: any) {
      console.error('Failed to verify document:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to process verification';
      toast.error(errorMessage);
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: IdVerificationStatus) => {
    switch (status) {
      case IdVerificationStatus.PENDING:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <span className="mr-1">⏳</span>
            Pending Review
          </span>
        );
      case IdVerificationStatus.VERIFIED:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <span className="mr-1">✅</span>
            Verified
          </span>
        );
      case IdVerificationStatus.REJECTED:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <span className="mr-1">❌</span>
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredDocuments = documents.filter(doc => {
    return filter === 'ALL' || doc.documentStatus.status === filter;
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 text-lg">📋</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-charcoal">
              ID Document Verification Queue
            </h2>
            <p className="text-gray-600">
              Review and verify user identity documents
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium text-gray-700">Filter:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as IdVerificationStatus | 'ALL')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-warm-gold"
          >
            <option value="ALL">All Documents</option>
            <option value={IdVerificationStatus.PENDING}>Pending Review</option>
            <option value={IdVerificationStatus.VERIFIED}>Verified</option>
            <option value={IdVerificationStatus.REJECTED}>Rejected</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 text-sm">⏳</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-600">
                {documents.filter(d => d.documentStatus.status === IdVerificationStatus.PENDING).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-sm">✅</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Verified</p>
              <p className="text-2xl font-bold text-green-600">
                {documents.filter(d => d.documentStatus.status === IdVerificationStatus.VERIFIED).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-sm">❌</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">
                {documents.filter(d => d.documentStatus.status === IdVerificationStatus.REJECTED).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm">📄</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Documents</p>
              <p className="text-2xl font-bold text-blue-600">
                {documents.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-charcoal">
            Documents ({filteredDocuments.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-12 text-center">
              <LoadingSpinner size="lg" text="Loading documents..." />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-lg font-semibold text-charcoal mb-2">
                No documents found
              </h3>
              <p className="text-gray-600">
                {filter === 'ALL' 
                  ? 'No documents have been uploaded yet'
                  : `No documents with ${filter.toLowerCase()} status`
                }
              </p>
            </div>
          ) : (
            filteredDocuments.map((document) => (
              <div key={document.userId} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    {/* User Avatar */}
                    <div className="w-12 h-12 bg-warm-gold text-white rounded-full flex items-center justify-center font-medium">
                      {document.user.firstName[0]}{document.user.lastName[0]}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-1">
                        <h4 className="text-lg font-semibold text-charcoal truncate">
                          {document.user.firstName} {document.user.lastName}
                        </h4>
                        {getStatusBadge(document.documentStatus.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{document.user.email}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>📅 Uploaded: {formatDate(document.documentStatus.uploadedAt!)}</span>
                        {document.documentStatus.filename && (
                          <span>📎 {document.documentStatus.filename}</span>
                        )}
                        {document.documentStatus.size && (
                          <span>💾 {formatFileSize(document.documentStatus.size)}</span>
                        )}
                      </div>
                      {document.documentStatus.verifiedAt && (
                        <p className="text-xs text-green-600 mt-1">
                          ✅ Verified: {formatDate(document.documentStatus.verifiedAt)}
                        </p>
                      )}
                      {document.documentStatus.rejectionReason && (
                        <p className="text-xs text-red-600 mt-1">
                          ❌ Rejected: {document.documentStatus.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {/* View Document Button */}
                    <button
                      onClick={() => openDocumentViewer(document)}
                      disabled={loadingDocument}
                      className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors flex items-center space-x-1"
                      title="View document"
                    >
                      <span>👁️</span>
                      <span className="hidden sm:inline">View</span>
                    </button>

                    {/* Quick Actions for Pending Documents */}
                    {document.documentStatus.status === IdVerificationStatus.PENDING && (
                      <>
                        <button
                          onClick={() => handleVerification(document.userId, IdVerificationStatus.VERIFIED)}
                          disabled={processing === document.userId}
                          className="px-3 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md transition-colors flex items-center space-x-1 disabled:opacity-50"
                          title="Approve document"
                        >
                          {processing === document.userId ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <>
                              <span>✅</span>
                              <span className="hidden sm:inline">Approve</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => openDocumentViewer(document)}
                          disabled={processing === document.userId}
                          className="px-3 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors flex items-center space-x-1 disabled:opacity-50"
                          title="Reject document"
                        >
                          <span>❌</span>
                          <span className="hidden sm:inline">Reject</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Document Viewer Modal */}
      {showDocumentModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-sand">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-warm-gold text-white rounded-full flex items-center justify-center font-medium">
                    {selectedDocument.user.firstName[0]}{selectedDocument.user.lastName[0]}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-charcoal">
                      Document Verification
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedDocument.user.firstName} {selectedDocument.user.lastName} - {selectedDocument.user.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeDocumentViewer}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col lg:flex-row h-[70vh]">
              {/* Document Viewer */}
              <div className="flex-1 p-6 bg-gray-50">
                {loadingDocument ? (
                  <div className="h-full flex items-center justify-center">
                    <LoadingSpinner size="lg" text="Loading document..." />
                  </div>
                ) : documentBlob ? (
                  <div className="h-full">
                    <img
                      src={documentBlob}
                      alt="ID Document"
                      className="w-full h-full object-contain rounded-lg border border-gray-200"
                      style={{ imageRendering: 'crisp-edges' }}
                    />
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    <p>Unable to load document</p>
                  </div>
                )}
              </div>

              {/* Verification Panel */}
              <div className="w-full lg:w-80 p-6 border-l border-gray-200">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-charcoal mb-2">Document Status</h4>
                    {getStatusBadge(selectedDocument.documentStatus.status)}
                  </div>

                  <div>
                    <h4 className="font-semibold text-charcoal mb-2">Document Info</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>📅 Uploaded: {formatDate(selectedDocument.documentStatus.uploadedAt!)}</p>
                      {selectedDocument.documentStatus.filename && (
                        <p>📎 Filename: {selectedDocument.documentStatus.filename}</p>
                      )}
                      {selectedDocument.documentStatus.size && (
                        <p>💾 Size: {formatFileSize(selectedDocument.documentStatus.size)}</p>
                      )}
                    </div>
                  </div>

                  {selectedDocument.documentStatus.status === IdVerificationStatus.PENDING && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Verification Notes (Optional)
                        </label>
                        <textarea
                          value={verificationNotes}
                          onChange={(e) => setVerificationNotes(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-warm-gold"
                          placeholder="Add notes about the verification decision..."
                        />
                      </div>

                      <div className="space-y-2">
                        <button
                          onClick={() => handleVerification(selectedDocument.userId, IdVerificationStatus.VERIFIED, verificationNotes)}
                          disabled={processing === selectedDocument.userId}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                        >
                          {processing === selectedDocument.userId ? (
                            <LoadingSpinner size="sm" className="mr-2" />
                          ) : (
                            <span className="mr-2">✅</span>
                          )}
                          Approve Document
                        </button>

                        <button
                          onClick={() => handleVerification(selectedDocument.userId, IdVerificationStatus.REJECTED, verificationNotes)}
                          disabled={processing === selectedDocument.userId}
                          className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                        >
                          {processing === selectedDocument.userId ? (
                            <LoadingSpinner size="sm" className="mr-2" />
                          ) : (
                            <span className="mr-2">❌</span>
                          )}
                          Reject Document
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedDocument.documentStatus.rejectionReason && (
                    <div>
                      <h4 className="font-semibold text-charcoal mb-2">Rejection Reason</h4>
                      <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                        {selectedDocument.documentStatus.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationQueue;