import React, { useState } from 'react';
import { useVendors, useCreateVendorLink } from '../../hooks/useVendors';
import { CreateVendorLinkInput, VendorChannel } from '../../types/vendors';
import LoadingSpinner from '../LoadingSpinner';
import toastService from '../../services/toastService';

interface CreateVendorLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preSelectedVendorId?: string;
  preSelectedObjectId?: string;
  preSelectedObjectType?: string;
}

const CreateVendorLinkModal: React.FC<CreateVendorLinkModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  preSelectedVendorId,
  preSelectedObjectId,
  preSelectedObjectType
}) => {
  const { data: vendorsData } = useVendors({ isActive: true });
  const createVendorLink = useCreateVendorLink();
  
  const [formData, setFormData] = useState<CreateVendorLinkInput>({
    vendorId: preSelectedVendorId || '',
    objectId: preSelectedObjectId || '',
    objectType: preSelectedObjectType || 'restaurant_reservation',
    notificationChannels: ['email'],
    metadata: {},
  });

  const [customExpiry, setCustomExpiry] = useState(false);

  const vendors = vendorsData?.data?.data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.notificationChannels.length === 0) {
      toastService.error('Please select at least one notification channel');
      return;
    }
    
    try {
      await createVendorLink.mutateAsync(formData);
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        vendorId: preSelectedVendorId || '',
        objectId: preSelectedObjectId || '',
        objectType: preSelectedObjectType || 'restaurant_reservation',
        notificationChannels: ['email'],
        metadata: {},
      });
      setCustomExpiry(false);
    } catch (error: any) {
      toastService.error(error.response?.data?.message || 'Failed to create vendor link');
    }
  };

  const handleChannelChange = (channel: VendorChannel, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      notificationChannels: checked 
        ? [...prev.notificationChannels, channel]
        : prev.notificationChannels.filter(c => c !== channel)
    }));
  };

  const handleQuickExpiry = (hours: number) => {
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + hours);
    setFormData(prev => ({ ...prev, expiresAt: expiryDate }));
    setCustomExpiry(false);
  };

  const selectedVendor = vendors.find(v => v.id === formData.vendorId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create Vendor Link</h2>
          <p className="text-sm text-gray-600 mt-1">Connect a vendor to a concierge object for confirmation</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Vendor Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor *
            </label>
            <select
              value={formData.vendorId}
              onChange={(e) => setFormData(prev => ({ ...prev, vendorId: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={!!preSelectedVendorId}
            >
              <option value="">Select a vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name} - {vendor.category.replace('_', ' ')}
                </option>
              ))}
            </select>
            {selectedVendor && (
              <div className="mt-2 p-3 bg-blue-50 rounded-md">
                <div className="text-sm text-blue-800">
                  <p><strong>Email:</strong> {selectedVendor.email || 'Not provided'}</p>
                  <p><strong>Phone:</strong> {selectedVendor.phone || 'Not provided'}</p>
                  {selectedVendor.policies?.responseTime && (
                    <p><strong>Response Time:</strong> {selectedVendor.policies.responseTime}h</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Object Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Type *
              </label>
              <select
                value={formData.objectType}
                onChange={(e) => setFormData(prev => ({ ...prev, objectType: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={!!preSelectedObjectType}
              >
                <option value="restaurant_reservation">Restaurant Reservation</option>
                <option value="transportation">Transportation</option>
                <option value="tour_booking">Tour Booking</option>
                <option value="spa_appointment">Spa Appointment</option>
                <option value="special_request">Special Request</option>
                <option value="maintenance">Maintenance</option>
                <option value="event_booking">Event Booking</option>
                <option value="shopping_assistance">Shopping Assistance</option>
              </select>
            </div>

            {/* Object ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Request ID *
              </label>
              <input
                type="text"
                value={formData.objectId}
                onChange={(e) => setFormData(prev => ({ ...prev, objectId: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter the request/object ID"
                required
                disabled={!!preSelectedObjectId}
              />
              <p className="text-xs text-gray-500 mt-1">
                The ID of the concierge object this link relates to
              </p>
            </div>
          </div>

          {/* Expiration Settings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Link Expiration
            </label>
            <div className="space-y-3">
              {/* Quick Options */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickExpiry(24)}
                  className={`btn btn-sm ${!customExpiry ? 'btn-outline' : 'btn-secondary'}`}
                >
                  24 hours
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickExpiry(48)}
                  className={`btn btn-sm ${!customExpiry ? 'btn-outline' : 'btn-secondary'}`}
                >
                  48 hours
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickExpiry(168)}
                  className={`btn btn-sm ${!customExpiry ? 'btn-outline' : 'btn-secondary'}`}
                >
                  1 week
                </button>
                <button
                  type="button"
                  onClick={() => setCustomExpiry(true)}
                  className={`btn btn-sm ${customExpiry ? 'btn-outline' : 'btn-secondary'}`}
                >
                  Custom
                </button>
              </div>
              
              {/* Custom Date Input */}
              {customExpiry && (
                <input
                  type="datetime-local"
                  value={formData.expiresAt ? formData.expiresAt.toISOString().slice(0, -1) : ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    expiresAt: e.target.value ? new Date(e.target.value) : undefined 
                  }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={new Date().toISOString().slice(0, -1)}
                />
              )}
              
              {/* Current Expiry Display */}
              {formData.expiresAt && (
                <p className="text-sm text-gray-600">
                  Expires: {formData.expiresAt.toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {/* Notification Channels */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Notification Channels *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['email', 'sms', 'phone', 'whatsapp'] as VendorChannel[]).map(channel => {
                const channelIcons = {
                  email: '📧',
                  sms: '💬',
                  phone: '📞',
                  whatsapp: '📱'
                };
                
                return (
                  <label key={channel} className=\"flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer\">
                    <input
                      type=\"checkbox\"
                      checked={formData.notificationChannels.includes(channel)}
                      onChange={(e) => handleChannelChange(channel, e.target.checked)}
                      className=\"rounded border-gray-300 text-blue-600 focus:ring-blue-500\"
                    />
                    <span className=\"ml-3 text-sm text-gray-700 capitalize flex items-center\">
                      <span className=\"mr-2\">{channelIcons[channel]}</span>
                      {channel}
                    </span>
                  </label>
                );
              })}
            </div>
            <p className=\"text-xs text-gray-500 mt-2\">
              Select how the vendor will be notified about this request
            </p>
          </div>

          {/* Policy Reference */}
          <div>
            <label className=\"block text-sm font-medium text-gray-700 mb-1\">
              Policy Reference (Optional)
            </label>
            <input
              type=\"text\"
              value={formData.policyRef || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, policyRef: e.target.value || undefined }))}
              className=\"w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500\"
              placeholder=\"Reference to specific vendor policy or terms\"
            />
            <p className=\"text-xs text-gray-500 mt-1\">
              Optional reference to specific terms or policies that apply to this request
            </p>
          </div>

          {/* Additional Notes */}
          <div>
            <label className=\"block text-sm font-medium text-gray-700 mb-1\">
              Special Instructions (Optional)
            </label>
            <textarea
              value={formData.metadata?.notes || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                metadata: { ...prev.metadata, notes: e.target.value }
              }))}
              rows={3}
              className=\"w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500\"
              placeholder=\"Add any special instructions for the vendor...\"
            />
          </div>

          <div className=\"flex space-x-3 pt-6 border-t\">
            <button
              type=\"submit\"
              disabled={createVendorLink.isPending}
              className=\"flex-1 btn btn-primary\"
            >
              {createVendorLink.isPending ? <LoadingSpinner size=\"sm\" /> : (
                <>
                  <span className=\"mr-2\">🔗</span>
                  Create Link
                </>
              )}
            </button>
            <button
              type=\"button\"
              onClick={onClose}
              className=\"flex-1 btn btn-outline\"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateVendorLinkModal;