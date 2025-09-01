import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useValidatePortalToken, useVendorPortalData, useConfirmVendorLink } from '../../hooks/useVendors';
import { ConfirmVendorLinkInput } from '../../types/vendors';
import LoadingSpinner from '../../components/LoadingSpinner';
import toastService from '../../services/toastService';

const VendorPortalPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  
  const { data: sessionData, isLoading: sessionLoading, error: sessionError } = useValidatePortalToken(token || '');
  const { data: portalData, isLoading: dataLoading } = useVendorPortalData(token || '');
  const confirmLink = useConfirmVendorLink();
  
  const [confirmationForm, setConfirmationForm] = useState<ConfirmVendorLinkInput>({
    status: 'confirmed',
    notes: '',
    estimatedTime: undefined,
    modifications: undefined,
  });

  useEffect(() => {
    if (sessionError) {
      toastService.error('Invalid or expired portal link');
    }
  }, [sessionError]);

  const handleConfirmation = async (status: 'confirmed' | 'declined') => {
    if (!portalData?.data?.link?.id || confirming) return;
    
    try {
      setConfirming(true);
      await confirmLink.mutateAsync({
        linkId: portalData.data.link.id,
        input: {
          ...confirmationForm,
          status,
        }
      });
      
      setConfirmed(true);
      toastService.success(`Request ${status} successfully!`);
      
      // Auto-redirect after 3 seconds
      setTimeout(() => {
        window.close(); // Try to close the tab/window
      }, 3000);
      
    } catch (error: any) {
      toastService.error(`Failed to ${status} request`);
    } finally {
      setConfirming(false);
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (sessionLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md w-full">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading portal...</p>
        </div>
      </div>
    );
  }

  if (sessionError || !sessionData?.data || !portalData?.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md w-full">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-800 mb-4">Portal Access Denied</h1>
          <p className="text-gray-600 mb-6">
            This portal link is invalid, expired, or has already been used.
          </p>
          <button
            onClick={() => window.close()}
            className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  const session = sessionData.data;
  const portal = portalData.data;

  if (confirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md w-full">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-green-800 mb-4">Thank You!</h1>
          <p className="text-gray-600 mb-6">
            Your response has been recorded successfully. The hotel team will be notified immediately.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-700">
              This window will close automatically in a few seconds.
            </p>
          </div>
          <button
            onClick={() => window.close()}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🏨</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Vendor Confirmation Portal</h1>
              <p className="text-gray-600">Please review and respond to this service request</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Session Info */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-blue-600 text-white px-6 py-4">
            <h2 className="text-lg font-semibold">Request Details</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Service Type</label>
                <p className="text-gray-900 font-medium">{portal.objectDetails.type.replace('_', ' ')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Request Title</label>
                <p className="text-gray-900 font-medium">{portal.objectDetails.title}</p>
              </div>
            </div>
            
            {portal.objectDetails.description && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
                <p className="text-gray-700">{portal.objectDetails.description}</p>
              </div>
            )}
            
            {portal.objectDetails.dueAt && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Required By</label>
                <p className="text-gray-900 font-medium">{formatDate(portal.objectDetails.dueAt)}</p>
              </div>
            )}
            
            {/* Vendor Policies */}
            {portal.vendor.policies && (
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <h4 className="font-medium text-gray-900 mb-3">Service Policies</h4>
                <div className="space-y-2 text-sm">
                  {portal.vendor.policies.responseTime && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Response Time:</span>
                      <span>{portal.vendor.policies.responseTime} hours</span>
                    </div>
                  )}
                  {portal.vendor.policies.cancellationPolicy && (
                    <div>
                      <span className="text-gray-600">Cancellation Policy:</span>
                      <p className="mt-1">{portal.vendor.policies.cancellationPolicy}</p>
                    </div>
                  )}
                  {portal.vendor.policies.paymentTerms && (
                    <div>
                      <span className="text-gray-600">Payment Terms:</span>
                      <p className="mt-1">{portal.vendor.policies.paymentTerms}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Form */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-green-600 text-white px-6 py-4">
            <h2 className="text-lg font-semibold">Your Response</h2>
          </div>
          <div className="p-6 space-y-6">
            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes or Special Instructions
              </label>
              <textarea
                value={confirmationForm.notes}
                onChange={(e) => setConfirmationForm({ ...confirmationForm, notes: e.target.value })}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add any special requests, modifications, or additional information..."
              />
            </div>

            {/* Estimated Time */}
            {portal.vendor.policies?.allowsModification && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Completion Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={confirmationForm.estimatedTime ? confirmationForm.estimatedTime.toISOString().slice(0, -1) : ''}
                  onChange={(e) => setConfirmationForm({ 
                    ...confirmationForm, 
                    estimatedTime: e.target.value ? new Date(e.target.value) : undefined 
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
              <button
                onClick={() => handleConfirmation('confirmed')}
                disabled={confirming}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center"
              >
                {confirming ? <LoadingSpinner size="sm" /> : (
                  <>
                    <span className="mr-2">✅</span>
                    Confirm & Accept
                  </>
                )}
              </button>
              
              <button
                onClick={() => handleConfirmation('declined')}
                disabled={confirming}
                className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center"
              >
                {confirming ? <LoadingSpinner size="sm" /> : (
                  <>
                    <span className="mr-2">❌</span>
                    Decline Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Portal Footer */}
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="text-sm text-gray-500 space-y-2">
            <p>This portal link expires: {formatDate(session.expiresAt)}</p>
            <p>Secure portal powered by Hotel Operations Hub</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorPortalPage;