import React, { useState } from 'react';
import { useVendorLinks, useVendorLinkTracking, useGenerateMagicLink } from '../../hooks/useVendors';
import { Vendor, VendorLink } from '../../types/vendors';
import LoadingSpinner from '../LoadingSpinner';
import toastService from '../../services/toastService';

interface ViewVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor;
  onEdit?: () => void;
}

const ViewVendorModal: React.FC<ViewVendorModalProps> = ({ isOpen, onClose, vendor, onEdit }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'links' | 'performance'>('overview');
  
  const { data: linksData, isLoading: linksLoading } = useVendorLinks({ vendorId: vendor.id });
  const generateMagicLink = useGenerateMagicLink();
  
  const links = linksData?.data?.data || [];

  const handleGenerateLink = async (link: VendorLink) => {
    try {
      await generateMagicLink.mutateAsync({ 
        vendorId: link.vendorId, 
        linkId: link.id 
      });
      toastService.success('Magic link generated successfully');
    } catch (error: any) {
      toastService.error('Failed to generate magic link');
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const getRatingStars = (rating?: number) => {
    if (!rating) return 'Not rated';
    return '⭐'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{vendor.name}</h2>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-sm text-gray-500 capitalize">
                  {vendor.category.replace('_', ' ')}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  vendor.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {vendor.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="btn btn-outline"
                >
                  Edit
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mt-6">
            {[
              { id: 'overview', label: 'Overview', icon: '📋' },
              { id: 'links', label: 'Links', icon: '🔗' },
              { id: 'performance', label: 'Performance', icon: '📊' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Email</label>
                      <p className="text-gray-900">{vendor.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-gray-900">{vendor.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Category</label>
                      <p className="text-gray-900 capitalize">{vendor.category.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Status</label>
                      <p className="text-gray-900">{vendor.isActive ? 'Active' : 'Inactive'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Policies</h3>
                  {vendor.policies ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Response Time</label>
                        <p className="text-gray-900">{vendor.policies.responseTime} hours</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Requires Confirmation</label>
                        <p className="text-gray-900">{vendor.policies.requiresConfirmation ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Allows Modifications</label>
                        <p className="text-gray-900">{vendor.policies.allowsModification ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Communication Channels</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {vendor.policies.channels.map(channel => (
                            <span key={channel} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {channel}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">No policies configured</p>
                  )}
                </div>
              </div>

              {/* Policy Details */}
              {vendor.policies && (
                <div className="space-y-4">
                  {vendor.policies.cancellationPolicy && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Cancellation Policy</label>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-700">{vendor.policies.cancellationPolicy}</p>
                      </div>
                    </div>
                  )}
                  
                  {vendor.policies.paymentTerms && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Payment Terms</label>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-700">{vendor.policies.paymentTerms}</p>
                      </div>
                    </div>
                  )}
                  
                  {vendor.policies.specialInstructions && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Special Instructions</label>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-700">{vendor.policies.specialInstructions}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Created</label>
                  <p className="text-gray-900">{formatDate(vendor.createdAt)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-gray-900">{formatDate(vendor.updatedAt)}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'links' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Vendor Links</h3>
                <span className="text-sm text-gray-500">{links.length} total links</span>
              </div>
              
              {linksLoading ? (
                <div className="flex justify-center items-center h-32">
                  <LoadingSpinner size="lg" />
                </div>
              ) : links.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Object</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {links.map((link) => (
                        <tr key={link.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div>
                              <div className="font-medium text-gray-900">
                                {link.objectType.replace('_', ' ')}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {link.objectId.slice(-8)}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {getStatusBadge(link.status)}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500">
                            {new Date(link.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4 text-sm">
                            {link.expiresAt ? (
                              <div>
                                <div>{new Date(link.expiresAt).toLocaleDateString()}</div>
                                {new Date(link.expiresAt) < new Date() && (
                                  <div className="text-red-500 text-xs">Expired</div>
                                )}
                              </div>
                            ) : (
                              'No expiry'
                            )}
                          </td>
                          <td className="px-4 py-4">
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
                              <button className="text-gray-600 hover:text-gray-800 text-sm">
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🔗</div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Links Yet</h4>
                  <p className="text-gray-600">Create vendor links to track confirmations and requests</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
              
              {vendor.performance ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600">Response Time</p>
                        <p className="text-2xl font-bold text-blue-800">
                          {Math.round(vendor.performance.averageResponseTime)}h
                        </p>
                      </div>
                      <div className="text-2xl">⏱️</div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600">Confirmation Rate</p>
                        <p className="text-2xl font-bold text-green-800">
                          {Math.round(vendor.performance.confirmationRate)}%
                        </p>
                      </div>
                      <div className="text-2xl">✅</div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-600">Total Bookings</p>
                        <p className="text-2xl font-bold text-purple-800">
                          {vendor.performance.totalBookings}
                        </p>
                      </div>
                      <div className="text-2xl">📊</div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-yellow-600">Rating</p>
                        <p className="text-lg font-bold text-yellow-800">
                          {getRatingStars(vendor.performance.rating)}
                        </p>
                        {vendor.performance.rating && (
                          <p className="text-sm text-yellow-600">
                            {vendor.performance.rating.toFixed(1)}/5.0
                          </p>
                        )}
                      </div>
                      <div className="text-2xl">⭐</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📊</div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Performance Data</h4>
                  <p className="text-gray-600">Performance metrics will appear as vendor links are processed</p>
                </div>
              )}
              
              {vendor.performance?.lastBookingDate && (
                <div className="pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Last booking: {formatDate(vendor.performance.lastBookingDate)}
                  </p>
                </div>
              )}
              
              {vendor.performance?.notes && vendor.performance.notes.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Performance Notes</h4>
                  <div className="space-y-2">
                    {vendor.performance.notes.map((note, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-gray-700">{note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewVendorModal;