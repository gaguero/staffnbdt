import React, { useState } from 'react';
import { useVendorLinkTracking, useVendorNotifications } from '../../hooks/useVendors';
import { VendorLink } from '../../types/vendors';
import LoadingSpinner from '../LoadingSpinner';

interface VendorLinkTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: VendorLink;
}

const VendorLinkTimelineModal: React.FC<VendorLinkTimelineModalProps> = ({ isOpen, onClose, link }) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'notifications'>('timeline');
  
  const { data: trackingData, isLoading: trackingLoading } = useVendorLinkTracking(link.id);
  const { data: notificationsData, isLoading: notificationsLoading } = useVendorNotifications(link.id);
  
  const tracking = trackingData?.data;
  const notifications = notificationsData?.data || [];

  const formatDate = (date?: Date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'confirmed': return '✅';
      case 'declined': return '❌';
      case 'expired': return '⏰';
      case 'cancelled': return '🚫';
      default: return '❓';
    }
  };

  const getNotificationStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return '📤';
      case 'delivered': return '✅';
      case 'failed': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return '📧';
      case 'sms': return '💬';
      case 'phone': return '📞';
      case 'whatsapp': return '📱';
      default: return '📢';
    }
  };

  // Create timeline events
  const timelineEvents = [
    {
      id: 'created',
      title: 'Link Created',
      description: 'Vendor link was created and is awaiting confirmation',
      timestamp: link.createdAt,
      icon: '🔗',
      status: 'completed'
    }
  ];

  if (tracking?.lastNotificationAt) {
    timelineEvents.push({
      id: 'notified',
      title: 'Vendor Notified',
      description: `${tracking.notificationsSent} notification(s) sent`,
      timestamp: tracking.lastNotificationAt,
      icon: '📤',
      status: 'completed'
    });
  }

  if (tracking?.lastPortalAccessAt) {
    timelineEvents.push({
      id: 'accessed',
      title: 'Portal Accessed',
      description: `Vendor accessed the portal ${tracking.portalAccessCount} time(s)`,
      timestamp: tracking.lastPortalAccessAt,
      icon: '🌐',
      status: 'completed'
    });
  }

  if (link.confirmationAt) {
    timelineEvents.push({
      id: 'confirmed',
      title: link.status === 'confirmed' ? 'Request Confirmed' : 'Request Declined',
      description: link.status === 'confirmed' 
        ? 'Vendor has confirmed the request'
        : 'Vendor has declined the request',
      timestamp: link.confirmationAt,
      icon: link.status === 'confirmed' ? '✅' : '❌',
      status: 'completed'
    });
  }

  if (link.expiresAt && new Date(link.expiresAt) < new Date() && link.status === 'pending') {
    timelineEvents.push({
      id: 'expired',
      title: 'Link Expired',
      description: 'The confirmation link has expired',
      timestamp: link.expiresAt,
      icon: '⏰',
      status: 'expired'
    });
  }

  // Sort by timestamp
  timelineEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Link History & Timeline</h2>
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-sm text-gray-500">
                  {link.objectType.replace('_', ' ')} • {link.vendor?.name}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  link.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  link.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  link.status === 'declined' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {getStatusIcon(link.status)} {link.status}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              ✕
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mt-6">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'timeline'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              📅 Timeline
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'notifications'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              📤 Notifications
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              {trackingLoading ? (
                <div className="flex justify-center items-center h-32">
                  <LoadingSpinner size="lg" />
                </div>
              ) : (
                <>
                  {/* Summary Stats */}
                  {tracking && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                        <div className="text-lg font-semibold text-blue-800">
                          {tracking.notificationsSent}
                        </div>
                        <div className="text-xs text-blue-600">Notifications Sent</div>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                        <div className="text-lg font-semibold text-green-800">
                          {tracking.portalAccessCount}
                        </div>
                        <div className="text-xs text-green-600">Portal Access</div>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                        <div className="text-lg font-semibold text-purple-800">
                          {link.status}
                        </div>
                        <div className="text-xs text-purple-600">Current Status</div>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                        <div className="text-lg font-semibold text-yellow-800">
                          {link.expiresAt ? (
                            new Date(link.expiresAt) > new Date() ? 'Active' : 'Expired'
                          ) : 'No Expiry'}
                        </div>
                        <div className="text-xs text-yellow-600">Link Status</div>
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  <div className="relative">
                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                    <div className="space-y-6">
                      {timelineEvents.map((event) => (
                        <div key={event.id} className="relative flex items-start">
                          {/* Timeline dot */}
                          <div className={`flex items-center justify-center w-16 h-16 rounded-full text-2xl ${
                            event.status === 'completed' ? 'bg-green-100' :
                            event.status === 'expired' ? 'bg-red-100' :
                            'bg-gray-100'
                          }`}>
                            {event.icon}
                          </div>
                          
                          {/* Content */}
                          <div className="ml-6 flex-1 min-w-0">
                            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium text-gray-900">{event.title}</h3>
                                <span className="text-sm text-gray-500">
                                  {formatDate(event.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Link Details */}
                  <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Link Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Object ID:</span>
                        <span className="ml-2 text-gray-900">{link.objectId}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Object Type:</span>
                        <span className="ml-2 text-gray-900">{link.objectType}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Created:</span>
                        <span className="ml-2 text-gray-900">{formatDate(link.createdAt)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Expires:</span>
                        <span className="ml-2 text-gray-900">{formatDate(link.expiresAt)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <span className="text-gray-500">Notification Channels:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {link.notificationChannels.map(channel => (
                          <span key={channel} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {getChannelIcon(channel)} {channel}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Notification History</h3>
                <span className="text-sm text-gray-500">{notifications.length} notifications</span>
              </div>

              {notificationsLoading ? (
                <div className="flex justify-center items-center h-32">
                  <LoadingSpinner size="lg" />
                </div>
              ) : notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getChannelIcon(notification.channel)}</span>
                          <span className="font-medium text-gray-900 capitalize">
                            {notification.channel}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${
                            notification.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            notification.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                            notification.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {getNotificationStatusIcon(notification.status)} {notification.status}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {notification.sentAt ? formatDate(notification.sentAt) : 'Not sent yet'}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        {notification.deliveredAt && (
                          <div>
                            <span className="text-gray-500">Delivered:</span>
                            <span className="ml-2">{formatDate(notification.deliveredAt)}</span>
                          </div>
                        )}
                        
                        {notification.failureReason && (
                          <div>
                            <span className="text-gray-500">Failure reason:</span>
                            <span className="ml-2 text-red-600">{notification.failureReason}</span>
                          </div>
                        )}
                        
                        {notification.retryCount > 0 && (
                          <div>
                            <span className="text-gray-500">Retry attempts:</span>
                            <span className="ml-2">{notification.retryCount}</span>
                          </div>
                        )}
                        
                        {notification.nextRetryAt && (
                          <div>
                            <span className="text-gray-500">Next retry:</span>
                            <span className="ml-2">{formatDate(notification.nextRetryAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📤</div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Notifications Sent</h4>
                  <p className="text-gray-600">Notifications will appear here once they are sent to the vendor</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorLinkTimelineModal;