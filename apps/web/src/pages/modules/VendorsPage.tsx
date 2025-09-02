import React, { useState } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { useVendors, useCreateVendor, useUpdateVendor, useDeleteVendor, useToggleVendorStatus, useVendorStats, useVendorLinks, useGenerateMagicLink, useBulkUpdateVendors } from '../../hooks/useVendors';
import { Vendor, VendorFilter, VendorLink, VendorLinkFilter, CreateVendorInput, UpdateVendorInput, VendorCategory, VendorChannel } from '../../types/vendors';
import PermissionGate from '../../components/PermissionGate';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorDisplay from '../../components/ErrorDisplay';
import EnhancedTable from '../../components/EnhancedTable';
import toastService from '../../services/toastService';

type ViewMode = 'directory' | 'links' | 'portal';

interface VendorFormData {
  name: string;
  email: string;
  phone: string;
  category: VendorCategory;
  responseTime: number;
  cancellationPolicy: string;
  paymentTerms: string;
  specialInstructions: string;
  requiresConfirmation: boolean;
  allowsModification: boolean;
  channels: VendorChannel[];
}

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor?: Vendor;
  onSave: (data: CreateVendorInput | { id: string; data: UpdateVendorInput }) => void;
  loading?: boolean;
}

const VendorModal: React.FC<VendorModalProps> = ({ isOpen, onClose, vendor, onSave, loading = false }) => {
  const [formData, setFormData] = useState<VendorFormData>(() => ({
    name: vendor?.name || '',
    email: vendor?.email || '',
    phone: vendor?.phone || '',
    category: vendor?.category || 'other',
    responseTime: vendor?.policies?.responseTime || 24,
    cancellationPolicy: vendor?.policies?.cancellationPolicy || '',
    paymentTerms: vendor?.policies?.paymentTerms || '',
    specialInstructions: vendor?.policies?.specialInstructions || '',
    requiresConfirmation: vendor?.policies?.requiresConfirmation ?? true,
    allowsModification: vendor?.policies?.allowsModification ?? false,
    channels: vendor?.policies?.channels || ['email'],
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const inputData: CreateVendorInput = {
      name: formData.name,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      category: formData.category,
      policies: {
        responseTime: formData.responseTime,
        cancellationPolicy: formData.cancellationPolicy,
        paymentTerms: formData.paymentTerms,
        specialInstructions: formData.specialInstructions,
        requiresConfirmation: formData.requiresConfirmation,
        allowsModification: formData.allowsModification,
        channels: formData.channels,
      },
    };

    if (vendor) {
      onSave({ id: vendor.id, data: inputData });
    } else {
      onSave(inputData);
    }
  };

  const handleChannelChange = (channel: VendorChannel, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      channels: checked 
        ? [...prev.channels, channel]
        : prev.channels.filter(c => c !== channel)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {vendor ? 'Edit Vendor' : 'Add New Vendor'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as VendorCategory }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="transportation">Transportation</option>
                <option value="tours">Tours & Activities</option>
                <option value="restaurants">Restaurants</option>
                <option value="spa">Spa & Wellness</option>
                <option value="events">Events & Entertainment</option>
                <option value="shopping">Shopping</option>
                <option value="emergency">Emergency Services</option>
                <option value="maintenance">Maintenance</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Response Time (hours)
            </label>
            <input
              type="number"
              min="1"
              value={formData.responseTime}
              onChange={(e) => setFormData(prev => ({ ...prev, responseTime: parseInt(e.target.value) || 24 }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cancellation Policy
              </label>
              <textarea
                value={formData.cancellationPolicy}
                onChange={(e) => setFormData(prev => ({ ...prev, cancellationPolicy: e.target.value }))}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Terms
              </label>
              <textarea
                value={formData.paymentTerms}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Special Instructions
            </label>
            <textarea
              value={formData.specialInstructions}
              onChange={(e) => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
              rows={2}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Any special booking instructions or requirements"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Vendor Settings
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.requiresConfirmation}
                    onChange={(e) => setFormData(prev => ({ ...prev, requiresConfirmation: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Requires confirmation</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.allowsModification}
                    onChange={(e) => setFormData(prev => ({ ...prev, allowsModification: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Allows modifications</span>
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Communication Channels
              </label>
              <div className="space-y-2">
                {(['email', 'sms', 'phone', 'whatsapp'] as VendorChannel[]).map(channel => (
                  <label key={channel} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.channels.includes(channel)}
                      onChange={(e) => handleChannelChange(channel, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">{channel}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3 pt-6 border-t">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn btn-primary"
            >
              {loading ? <LoadingSpinner size="sm" /> : (vendor ? 'Update Vendor' : 'Create Vendor')}
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

interface VendorStatsCardsProps {
  onViewChange: (view: ViewMode) => void;
}

const VendorStatsCards: React.FC<VendorStatsCardsProps> = ({ onViewChange }) => {
  const { data: stats, isLoading } = useVendorStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
            <LoadingSpinner size="sm" />
          </div>
        ))}
      </div>
    );
  }

  const statsData = stats?.data || {
    totalVendors: 0,
    activeVendors: 0,
    totalLinks: 0,
    pendingConfirmations: 0,
    expiringSoon: 0,
    averageResponseTime: 0,
    overallConfirmationRate: 0,
    categoryBreakdown: [],
  };

  const cards = [
    {
      title: 'Total Vendors',
      value: statsData.totalVendors,
      subtitle: `${statsData.activeVendors} active`,
      icon: '🏢',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      onClick: () => onViewChange('directory'),
    },
    {
      title: 'Pending Links',
      value: statsData.pendingConfirmations,
      subtitle: `${statsData.expiringSoon} expiring soon`,
      icon: '⌛',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      onClick: () => onViewChange('links'),
    },
    {
      title: 'Confirmation Rate',
      value: `${Math.round(statsData.overallConfirmationRate)}%`,
      subtitle: `Avg response: ${Math.round(statsData.averageResponseTime)}h`,
      icon: '✅',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      onClick: () => onViewChange('links'),
    },
    {
      title: 'Magic Links',
      value: statsData.totalLinks,
      subtitle: 'Portal access generated',
      icon: '🪄',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      onClick: () => onViewChange('portal'),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`${card.bgColor} border border-gray-200 rounded-lg p-6 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 transform`}
          onClick={card.onClick}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className={`text-2xl font-bold ${card.color} mb-1`}>{card.value}</p>
              <p className="text-xs text-gray-500">{card.subtitle}</p>
            </div>
            <span className="text-2xl">{card.icon}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

const VendorsPage: React.FC = () => {
  const { getCurrentPropertyName } = useTenant();
  const [currentView, setCurrentView] = useState<ViewMode>('directory');
  const [filter, _setFilter] = useState<VendorFilter>({});
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | undefined>();
  
  const { data: vendorsData, isLoading, error, refetch } = useVendors(filter);
  const createVendor = useCreateVendor();
  const updateVendor = useUpdateVendor();
  const deleteVendor = useDeleteVendor();
  const toggleStatus = useToggleVendorStatus();
  const bulkUpdateVendors = useBulkUpdateVendors();

  const handleCreateVendor = async (input: CreateVendorInput) => {
    await createVendor.mutateAsync(input);
    setShowVendorModal(false);
  };

  const handleUpdateVendor = async ({ id, data }: { id: string; data: UpdateVendorInput }) => {
    await updateVendor.mutateAsync({ id, input: data });
    setShowVendorModal(false);
    setEditingVendor(undefined);
  };

  const handleDeleteVendor = async (id: string) => {
    if (confirm('Are you sure you want to delete this vendor? This action cannot be undone.')) {
      await deleteVendor.mutateAsync(id);
    }
  };

  const handleToggleStatus = async (id: string) => {
    await toggleStatus.mutateAsync(id);
  };


  const handleBulkActivate = async (selectedItems: Vendor[]) => {
    if (selectedItems.length === 0) return;
    const selectedIds = selectedItems.map(item => item.id);
    
    try {
      await bulkUpdateVendors.mutateAsync({ 
        vendorIds: selectedIds, 
        updates: { isActive: true } 
      });
    } catch (error: any) {
      toastService.error('Failed to activate vendors');
    }
  };

  const handleBulkDeactivate = async (selectedItems: Vendor[]) => {
    if (selectedItems.length === 0) return;
    const selectedIds = selectedItems.map(item => item.id);
    
    try {
      await bulkUpdateVendors.mutateAsync({ 
        vendorIds: selectedIds, 
        updates: { isActive: false } 
      });
    } catch (error: any) {
      toastService.error('Failed to deactivate vendors');
    }
  };

  const propertyName = getCurrentPropertyName();
  const requiresPropertySelection = !propertyName || propertyName === 'Select Property';

  if (requiresPropertySelection) {
    return (
      <div className="text-center py-16 transform transition-all duration-300 hover:scale-105">
        <div className="text-8xl mb-6 animate-bounce">🏨</div>
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8 max-w-md mx-auto">
          <h3 className="text-xl font-bold text-blue-800 mb-3">
            Almost There!
          </h3>
          <p className="text-blue-600 mb-4">
            Choose your property to unlock the amazing world of vendor partnerships and seamless service coordination.
          </p>
          <div className="inline-flex items-center space-x-2 bg-blue-100 px-4 py-2 rounded-full">
            <span className="text-sm font-medium text-blue-800">Ready to Connect</span>
            <span className="text-blue-600 animate-pulse">🔗</span>
          </div>
        </div>
      </div>
    );
  }

  const vendors = vendorsData?.data?.data || [];

  const vendorColumns = [
    {
      key: 'name',
      label: 'Name',
      render: (value: string, vendor: Vendor) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500 capitalize">{vendor.category.replace('_', ' ')}</div>
        </div>
      ),
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (_: any, vendor: Vendor) => (
        <div className="text-sm">
          {vendor.email && <div>{vendor.email}</div>}
          {vendor.phone && <div className="text-gray-500">{vendor.phone}</div>}
        </div>
      ),
    },
    {
      key: 'performance',
      label: 'Performance',
      render: (_: any, vendor: Vendor) => (
        <div className="text-sm">
          <div>{vendor.performance?.confirmationRate || 0}% confirmation rate</div>
          <div className="text-gray-500">{vendor.performance?.averageResponseTime || 0}h avg response</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_: any, vendor: Vendor) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          vendor.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {vendor.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, vendor: Vendor) => (
        <div className="flex space-x-2">
          <PermissionGate resource="vendors" action="update" scope="property" hideOnDenied>
            <button
              onClick={() => {
                setEditingVendor(vendor);
                setShowVendorModal(true);
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              Edit
            </button>
          </PermissionGate>
          <PermissionGate resource="vendors" action="update" scope="property" hideOnDenied>
            <button
              onClick={() => handleToggleStatus(vendor.id)}
              className="text-yellow-600 hover:text-yellow-800"
            >
              {vendor.isActive ? 'Deactivate' : 'Activate'}
            </button>
          </PermissionGate>
          <PermissionGate resource="vendors" action="delete" scope="property" hideOnDenied>
            <button
              onClick={() => handleDeleteVendor(vendor.id)}
              className="text-red-600 hover:text-red-800"
            >
              Delete
            </button>
          </PermissionGate>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDisplay
        message="Failed to load vendors"
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
            <h1 className="heading-2">Vendors</h1>
            <p className="text-gray-600">Partner directory and portal management for {propertyName}</p>
          </div>
          
          {/* View Toggles */}
          <div className="mt-4 lg:mt-0 flex items-center space-x-4">
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
              <button
                onClick={() => setCurrentView('directory')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'directory'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📁 Directory
              </button>
              <button
                onClick={() => setCurrentView('links')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'links'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🔗 Links
              </button>
              <button
                onClick={() => setCurrentView('portal')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'portal'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🌐 Portal
              </button>
            </div>
            
            <PermissionGate resource="vendors" action="create" scope="property">
              <button
                onClick={() => setShowVendorModal(true)}
                className="btn btn-primary flex items-center space-x-2 hover:scale-105 transition-transform duration-200"
              >
                <span className="hover:animate-bounce">✨</span>
                <span>Add Vendor</span>
              </button>
            </PermissionGate>
          </div>
        </div>

        {/* Stats Cards */}
        <VendorStatsCards onViewChange={setCurrentView} />

        {/* Main Content */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {currentView === 'directory' && (
            <div>
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Vendor Directory</h3>
                <p className="text-sm text-gray-600">Manage your partner network and vendor relationships</p>
              </div>
              
              <EnhancedTable
                data={vendors}
                columns={vendorColumns}
                getItemId={(vendor: Vendor) => vendor.id}
                loading={isLoading}
                emptyMessage="🌟 Ready to build your vendor network! Add your first trusted partner to get started."
                enableBulkSelection={true}
                bulkActions={[
                  { id: 'activate', label: 'Activate', icon: '✅' },
                  { id: 'deactivate', label: 'Deactivate', icon: '⏸️' }
                ]}
                onBulkAction={(actionId, selectedItems) => {
                  if (actionId === 'activate') {
                    handleBulkActivate(selectedItems);
                  } else if (actionId === 'deactivate') {
                    handleBulkDeactivate(selectedItems);
                  }
                }}
              />
            </div>
          )}
          
          {currentView === 'links' && (
            <VendorLinksView />
          )}
          
          {currentView === 'portal' && (
            <VendorPortalManagementView />
          )}
        </div>

        {/* Vendor Modal */}
        <VendorModal
          isOpen={showVendorModal}
          onClose={() => {
            setShowVendorModal(false);
            setEditingVendor(undefined);
          }}
          vendor={editingVendor}
          onSave={async (data: any) => {
            if (editingVendor) {
              await handleUpdateVendor({ id: editingVendor.id, data });
            } else {
              await handleCreateVendor(data);
            }
          }}
          loading={createVendor.isPending || updateVendor.isPending}
        />
      </div>
    </PermissionGate>
  );
};

// Vendor Links View Component
const VendorLinksView: React.FC = () => {
  const [linkFilter, setLinkFilter] = useState<VendorLinkFilter>({});
  const { data: linksData, isLoading, error, refetch } = useVendorLinks(linkFilter);
  const generateMagicLink = useGenerateMagicLink();
  
  const links = linksData?.data?.data || [];
  
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
            <button
              onClick={() => handleGenerateLink(link)}
              className="text-blue-600 hover:text-blue-800 text-sm"
              disabled={generateMagicLink.isPending}
            >
              Generate Link
            </button>
          )}
          <button
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            View
          </button>
        </div>
      ),
    },
  ];
  
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-32">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6">
        <ErrorDisplay
          message="Failed to load vendor links"
          onRetry={refetch}
        />
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Vendor Links Management</h3>
          <p className="text-sm text-gray-600">Track vendor confirmations and portal access</p>
        </div>
        
        <PermissionGate resource="vendors" action="create" scope="property">
          <button
            className="btn btn-primary mt-4 lg:mt-0"
          >
            Create Link
          </button>
        </PermissionGate>
      </div>
      
      {/* Filters */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search links..."
            value={linkFilter.search || ''}
            onChange={(e) => setLinkFilter({ ...linkFilter, search: e.target.value })}
            className="form-input"
          />
          <select
            value={linkFilter.status?.[0] || ''}
            onChange={(e) => setLinkFilter({ 
              ...linkFilter, 
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
            value={linkFilter.objectType || ''}
            onChange={(e) => setLinkFilter({ 
              ...linkFilter, 
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
            value={linkFilter.expiringWithinHours || ''}
            onChange={(e) => setLinkFilter({ 
              ...linkFilter, 
              expiringWithinHours: e.target.value ? parseInt(e.target.value) : undefined 
            })}
            className="form-input"
          >
            <option value="">Any Expiry</option>
            <option value="24">Next 24h</option>
            <option value="48">Next 48h</option>
            <option value="168">Next Week</option>
          </select>
        </div>
      </div>
      
      {/* Links Table */}
      <EnhancedTable
        data={links}
        columns={linkColumns}
        getItemId={(link: VendorLink) => link.id}
        loading={isLoading}
        emptyMessage="🔗 No vendor links found. Create links to start vendor collaborations!"
      />
    </div>
  );
};

// Vendor Portal Management View Component
const VendorPortalManagementView: React.FC = () => {
  const { data: linksData, isLoading } = useVendorLinks({ 
    status: ['pending', 'confirmed'] 
  });
  
  const links = linksData?.data?.data || [];
  const portalLinks = links.filter(link => link.portalToken);
  
  const getPortalStats = () => {
    const total = portalLinks.length;
    const active = portalLinks.filter(link => 
      link.expiresAt && new Date(link.expiresAt) > new Date()
    ).length;
    const expired = total - active;
    
    return { total, active, expired };
  };
  
  const stats = getPortalStats();
  
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-32">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Vendor Portal Management</h3>
        <p className="text-sm text-gray-600">Monitor portal access and vendor engagement</p>
      </div>
      
      {/* Portal Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl mb-2">🌐</div>
          <p className="text-sm text-blue-600">Total Portals</p>
          <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl mb-2">✅</div>
          <p className="text-sm text-green-600">Active Portals</p>
          <p className="text-2xl font-bold text-green-800">{stats.active}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl mb-2">⏰</div>
          <p className="text-sm text-red-600">Expired Portals</p>
          <p className="text-2xl font-bold text-red-800">{stats.expired}</p>
        </div>
      </div>
      
      {/* Portal Links List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h4 className="font-medium text-gray-900">Portal Access History</h4>
        </div>
        
        {portalLinks.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">🌐</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Portal Access Yet</h4>
            <p className="text-gray-600">Generate magic links to enable vendor portal access</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Object Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {portalLinks.map((link) => (
                  <tr key={link.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{link.vendor?.name}</div>
                        <div className="text-sm text-gray-500">{link.vendor?.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {link.objectType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        link.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        link.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {link.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {link.expiresAt ? (
                        <div>
                          <div>{new Date(link.expiresAt).toLocaleDateString()}</div>
                          {new Date(link.expiresAt) < new Date() && (
                            <div className="text-red-500 text-xs">Expired</div>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(link.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorsPage;


