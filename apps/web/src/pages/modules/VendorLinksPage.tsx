import React, { useState, useCallback } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { 
  useVendorLinks, 
  useCreateVendorLink, 
  useGenerateMagicLink, 
  useCancelVendorLink,
  useBulkNotifyLinks,
  useBulkCancelLinks,
  useVendors
} from '../../hooks/useVendors';
import { 
  VendorLink, 
  VendorLinkFilter, 
  CreateVendorLinkInput, 
  VendorChannel 
} from '../../types/vendors';
import PermissionGate from '../../components/PermissionGate';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorDisplay from '../../components/ErrorDisplay';
import EnhancedTable from '../../components/EnhancedTable';
import toastService from '../../services/toastService';

// Create Vendor Link Modal
interface CreateVendorLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateVendorLinkModal: React.FC<CreateVendorLinkModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { data: vendorsData } = useVendors({ isActive: true });
  const createVendorLink = useCreateVendorLink();
  
  const [formData, setFormData] = useState<CreateVendorLinkInput>({
    vendorId: '',
    objectId: '',
    objectType: 'restaurant_reservation',
    notificationChannels: ['email'],
    metadata: {},
  });

  const vendors = vendorsData?.data?.data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createVendorLink.mutateAsync(formData);
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        vendorId: '',
        objectId: '',
        objectType: 'restaurant_reservation',
        notificationChannels: ['email'],
        metadata: {},
      });
    } catch (error: any) {
      toastService.error('Failed to create vendor link');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create Vendor Link</h2>
          <p className="text-sm text-gray-600 mt-1">Connect a vendor to a concierge object</p>
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
            >
              <option value="">Select a vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name} - {vendor.category.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Object Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Object Type *
              </label>
              <select
                value={formData.objectType}
                onChange={(e) => setFormData(prev => ({ ...prev, objectType: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="restaurant_reservation">Restaurant Reservation</option>
                <option value="transportation">Transportation</option>
                <option value="tour_booking">Tour Booking</option>
                <option value="spa_appointment">Spa Appointment</option>
                <option value="special_request">Special Request</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            {/* Object ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Object ID *
              </label>
              <input
                type="text"
                value={formData.objectId}
                onChange={(e) => setFormData(prev => ({ ...prev, objectId: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter the concierge object ID"
                required
              />
            </div>
          </div>

          {/* Expiration Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiration Date (Optional)
            </label>
            <input
              type="datetime-local"
              value={formData.expiresAt ? formData.expiresAt.toISOString().slice(0, -1) : ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                expiresAt: e.target.value ? new Date(e.target.value) : undefined 
              }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Notification Channels */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Notification Channels *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(['email', 'sms', 'phone', 'whatsapp'] as VendorChannel[]).map(channel => (
                <label key={channel} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.notificationChannels.includes(channel)}
                    onChange={(e) => handleChannelChange(channel, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">{channel}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Policy Reference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Policy Reference (Optional)
            </label>
            <input
              type="text"
              value={formData.policyRef || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, policyRef: e.target.value || undefined }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Reference to specific vendor policy"
            />
          </div>

          <div className="flex space-x-3 pt-6 border-t">
            <button
              type="submit"
              disabled={createVendorLink.isPending}
              className="flex-1 btn btn-primary"
            >
              {createVendorLink.isPending ? <LoadingSpinner size="sm" /> : 'Create Link'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn btn-outline"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const VendorLinksPage: React.FC = () => {
  const { getCurrentPropertyName } = useTenant();
  const [filter, setFilter] = useState<VendorLinkFilter>({});
  const [selectedLinks, setSelectedLinks] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const { data: linksData, isLoading, error, refetch } = useVendorLinks(filter);
  const generateMagicLink = useGenerateMagicLink();
  const cancelVendorLink = useCancelVendorLink();
  const bulkNotifyLinks = useBulkNotifyLinks();
  const bulkCancelLinks = useBulkCancelLinks();

  const links = linksData?.data?.data || [];
  const propertyName = getCurrentPropertyName();

  const handleGenerateLink = async (link: VendorLink) => {
    try {
      await generateMagicLink.mutateAsync({ 
        vendorId: link.vendorId, 
        linkId: link.id 
      });
    } catch (error: any) {
      toastService.error('Failed to generate magic link');
    }
  };

  const handleCancelLink = async (linkId: string) => {
    if (!window.confirm('Are you sure you want to cancel this vendor link?')) {
      return;
    }

    try {
      await cancelVendorLink.mutateAsync({ linkId });
    } catch (error: any) {
      toastService.error('Failed to cancel link');
    }
  };

  const handleBulkNotify = async () => {
    const selectedArray = Array.from(selectedLinks);
    if (selectedArray.length === 0) return;

    try {
      await bulkNotifyLinks.mutateAsync({ 
        linkIds: selectedArray, 
        channels: ['email'] 
      });
      setSelectedLinks(new Set());
    } catch (error: any) {
      toastService.error('Failed to send notifications');
    }
  };

  const handleBulkCancel = async () => {
    const selectedArray = Array.from(selectedLinks);
    if (selectedArray.length === 0) return;

    if (!window.confirm(`Cancel ${selectedArray.length} vendor links?`)) {
      return;
    }

    try {
      await bulkCancelLinks.mutateAsync({ 
        linkIds: selectedArray,
        reason: 'Bulk cancellation from admin'
      });
      setSelectedLinks(new Set());
    } catch (error: any) {
      toastService.error('Failed to cancel links');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { className: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      confirmed: { className: 'bg-green-100 text-green-800', label: 'Confirmed' },
      declined: { className: 'bg-red-100 text-red-800', label: 'Declined' },
      expired: { className: 'bg-gray-100 text-gray-800', label: 'Expired' },
      cancelled: { className: 'bg-red-100 text-red-800', label: 'Cancelled' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (date?: Date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const linkColumns = [
    {
      key: 'vendor',
      label: 'Vendor',
      render: (_: any, link: VendorLink) => (
        <div>
          <div className="font-medium text-gray-900">{link.vendor?.name || 'Unknown'}</div>
          <div className="text-sm text-gray-500 capitalize">{link.vendor?.category?.replace('_', ' ') || ''}</div>
        </div>
      ),
    },
    {
      key: 'object',
      label: 'Object',
      render: (_: any, link: VendorLink) => (
        <div className="text-sm">
          <div className="font-medium">{link.objectType.replace('_', ' ')}</div>
          <div className="text-gray-500">ID: {link.objectId.slice(-8)}</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_: any, link: VendorLink) => getStatusBadge(link.status),
    },
    {
      key: 'channels',
      label: 'Channels',
      render: (_: any, link: VendorLink) => (
        <div className="flex flex-wrap gap-1">
          {link.notificationChannels.map(channel => (
            <span key={channel} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
              {channel}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'expires',
      label: 'Expires',
      render: (_: any, link: VendorLink) => (
        <div className="text-sm">
          <div>{formatDate(link.expiresAt)}</div>
          {link.expiresAt && new Date(link.expiresAt) < new Date() && (
            <div className="text-red-500 text-xs">Expired</div>
          )}
        </div>
      ),
    },
    {
      key: 'confirmed',
      label: 'Confirmed',
      render: (_: any, link: VendorLink) => formatDate(link.confirmationAt),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, link: VendorLink) => (
        <div className="flex space-x-2">
          {link.status === 'pending' && (
            <>
              <PermissionGate resource="vendors" action="create" scope="property" hideOnDenied>
                <button
                  onClick={() => handleGenerateLink(link)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                  disabled={generateMagicLink.isPending}
                >
                  Generate Link
                </button>
              </PermissionGate>
              <PermissionGate resource="vendors" action="update" scope="property" hideOnDenied>
                <button
                  onClick={() => handleCancelLink(link.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                  disabled={cancelVendorLink.isPending}
                >
                  Cancel
                </button>
              </PermissionGate>
            </>
          )}
          <button className="text-gray-600 hover:text-gray-800 text-sm">
            View
          </button>
        </div>
      ),
    },
  ];

  if (isLoading && links.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDisplay
        message="Failed to load vendor links"
        onRetry={refetch}
      />
    );
  }

  return (
    <PermissionGate resource="vendors" action="read" scope="property">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="heading-2">Vendor Links</h1>
            <p className="text-gray-600">Manage vendor confirmations and portal access for {propertyName}</p>
          </div>
          
          <PermissionGate resource="vendors" action="create" scope="property">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary mt-4 lg:mt-0 hover:scale-105 transition-transform duration-200"
            >
              <span className="mr-2">🔗</span>
              Create Link
            </button>
          </PermissionGate>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">⏳</div>
            <p className="text-sm text-yellow-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-800">
              {links.filter(l => l.status === 'pending').length}
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">✅</div>
            <p className="text-sm text-green-600">Confirmed</p>
            <p className="text-2xl font-bold text-green-800">
              {links.filter(l => l.status === 'confirmed').length}
            </p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">❌</div>
            <p className="text-sm text-red-600">Declined</p>
            <p className="text-2xl font-bold text-red-800">
              {links.filter(l => l.status === 'declined').length}
            </p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">⏰</div>
            <p className="text-sm text-gray-600">Expired</p>
            <p className="text-2xl font-bold text-gray-800">
              {links.filter(l => l.status === 'expired').length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Search links..."
              value={filter.search || ''}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="form-input"
            />
            <select
              value={filter.status?.[0] || ''}
              onChange={(e) => setFilter({ 
                ...filter, 
                status: e.target.value ? [e.target.value as any] : undefined 
              })}
              className="form-input"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="declined">Declined</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={filter.objectType || ''}
              onChange={(e) => setFilter({ 
                ...filter, 
                objectType: e.target.value || undefined 
              })}
              className="form-input"
            >
              <option value="">All Types</option>
              <option value="restaurant_reservation">Restaurant</option>
              <option value="transportation">Transportation</option>
              <option value="tour_booking">Tours</option>
              <option value="spa_appointment">Spa</option>
            </select>
            <select
              value={filter.expiringWithinHours || ''}
              onChange={(e) => setFilter({ 
                ...filter, 
                expiringWithinHours: e.target.value ? parseInt(e.target.value) : undefined 
              })}
              className="form-input"
            >
              <option value="">Any Expiry</option>
              <option value="24">Next 24h</option>
              <option value="48">Next 48h</option>
              <option value="168">Next Week</option>
            </select>
            <button
              onClick={() => setFilter({})}
              className="btn btn-outline"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Main Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Bulk Actions */}
          {selectedLinks.size > 0 && (
            <div className="p-4 border-b border-gray-200 bg-blue-50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  {selectedLinks.size} link{selectedLinks.size > 1 ? 's' : ''} selected
                </span>
                <div className="flex space-x-2">
                  <PermissionGate resource="vendors" action="create" scope="property" hideOnDenied>
                    <button
                      onClick={handleBulkNotify}
                      disabled={bulkNotifyLinks.isPending}
                      className="btn btn-sm btn-outline"
                    >
                      Notify
                    </button>
                  </PermissionGate>
                  <PermissionGate resource="vendors" action="update" scope="property" hideOnDenied>
                    <button
                      onClick={handleBulkCancel}
                      disabled={bulkCancelLinks.isPending}
                      className="btn btn-sm btn-outline text-red-600 border-red-300 hover:bg-red-50"
                    >
                      Cancel
                    </button>
                  </PermissionGate>
                </div>
              </div>
            </div>
          )}
          
          <EnhancedTable
            data={links}
            columns={linkColumns}
            getItemId={(link: VendorLink) => link.id}
            loading={isLoading}
            emptyMessage="🔗 No vendor links found. Create links to start vendor collaborations!"
            selectedIds={selectedLinks}
            onSelectionChange={setSelectedLinks}
          />
        </div>

        {/* Create Link Modal */}
        <CreateVendorLinkModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            refetch();
          }}
        />
      </div>
    </PermissionGate>
  );
};

export default VendorLinksPage;