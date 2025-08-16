import React, { useState } from 'react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'system' | 'payroll' | 'vacation' | 'training' | 'document' | 'general';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
}

const NotificationsPage: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Mock data - replace with actual API call
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Payslip Available',
      message: 'Your January 2024 payslip is now available for download.',
      type: 'info',
      category: 'payroll',
      timestamp: '2024-01-31T10:00:00Z',
      read: false,
      actionUrl: '/payroll',
      actionText: 'View Payslip'
    },
    {
      id: '2',
      title: 'Vacation Request Approved',
      message: 'Your vacation request for February 15-19 has been approved.',
      type: 'success',
      category: 'vacation',
      timestamp: '2024-01-29T14:30:00Z',
      read: false,
      actionUrl: '/vacation',
      actionText: 'View Request'
    },
    {
      id: '3',
      title: 'Training Deadline Approaching',
      message: 'Complete "Data Privacy and Security" training by March 15, 2024.',
      type: 'warning',
      category: 'training',
      timestamp: '2024-01-28T09:00:00Z',
      read: true,
      actionUrl: '/training',
      actionText: 'Start Training'
    },
    {
      id: '4',
      title: 'New Policy Document',
      message: 'Updated employee handbook has been uploaded to the documents section.',
      type: 'info',
      category: 'document',
      timestamp: '2024-01-25T16:45:00Z',
      read: true,
      actionUrl: '/documents',
      actionText: 'View Documents'
    },
    {
      id: '5',
      title: 'System Maintenance',
      message: 'Scheduled maintenance on February 3rd from 2-4 AM. Some features may be unavailable.',
      type: 'warning',
      category: 'system',
      timestamp: '2024-01-24T11:00:00Z',
      read: true
    },
    {
      id: '6',
      title: 'Profile Update Required',
      message: 'Please update your emergency contact information in your profile.',
      type: 'error',
      category: 'general',
      timestamp: '2024-01-20T08:30:00Z',
      read: false,
      actionUrl: '/profile',
      actionText: 'Update Profile'
    }
  ]);

  const categories = [
    { value: 'all', label: 'All', icon: '📋' },
    { value: 'system', label: 'System', icon: '⚙️' },
    { value: 'payroll', label: 'Payroll', icon: '💰' },
    { value: 'vacation', label: 'Vacation', icon: '🏖️' },
    { value: 'training', label: 'Training', icon: '🎓' },
    { value: 'document', label: 'Documents', icon: '📁' },
    { value: 'general', label: 'General', icon: '📢' }
  ];

  const filteredNotifications = notifications.filter(notification => {
    const matchesCategory = selectedFilter === 'all' || notification.category === selectedFilter;
    const matchesReadStatus = !showUnreadOnly || !notification.read;
    return matchesCategory && matchesReadStatus;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-orange-200 bg-orange-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Less than an hour ago';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2">Notifications</h1>
          <p className="text-gray-600">
            Stay updated with important information and reminders
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={markAllAsRead}
            className="btn btn-outline btn-sm"
            disabled={unreadCount === 0}
          >
            Mark All Read
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.value}
                onClick={() => setSelectedFilter(category.value)}
                className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilter === category.value
                    ? 'bg-warm-gold text-white'
                    : 'bg-gray-100 text-charcoal hover:bg-gray-200'
                }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.label}
              </button>
            ))}
          </div>

          {/* Unread Filter */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="unread-only"
              checked={showUnreadOnly}
              onChange={(e) => setShowUnreadOnly(e.target.checked)}
              className="rounded text-warm-gold focus:ring-warm-gold"
            />
            <label htmlFor="unread-only" className="text-sm text-gray-600">
              Show unread only
            </label>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4">🔔</div>
          <h3 className="text-lg font-semibold text-charcoal mb-2">
            No notifications found
          </h3>
          <p className="text-gray-600">
            {showUnreadOnly 
              ? 'No unread notifications'
              : 'You\'re all caught up!'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map(notification => (
            <div
              key={notification.id}
              className={`card transition-all duration-200 ${
                !notification.read 
                  ? 'border-l-4 border-l-warm-gold shadow-medium' 
                  : 'hover:shadow-soft'
              }`}
            >
              <div className="card-body">
                <div className="flex items-start space-x-4">
                  {/* Type Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center ${getTypeColor(notification.type)}`}>
                    <span className="text-lg">{getTypeIcon(notification.type)}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`text-lg font-semibold mb-1 ${
                          !notification.read ? 'text-charcoal' : 'text-gray-700'
                        }`}>
                          {notification.title}
                          {!notification.read && (
                            <span className="ml-2 w-2 h-2 bg-warm-gold rounded-full inline-block" />
                          )}
                        </h3>
                        <p className="text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{formatTimeAgo(notification.timestamp)}</span>
                          <span className="flex items-center space-x-1">
                            <span>{categories.find(cat => cat.value === notification.category)?.icon}</span>
                            <span className="capitalize">{notification.category}</span>
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-sm text-warm-gold hover:text-warm-gold font-medium"
                          >
                            Mark Read
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          aria-label="Delete notification"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* Action Button */}
                    {notification.actionUrl && notification.actionText && (
                      <div className="mt-3">
                        <button
                          onClick={() => {
                            markAsRead(notification.id);
                            // TODO: Navigate to action URL
                            console.log('Navigate to:', notification.actionUrl);
                          }}
                          className="btn btn-outline btn-sm"
                        >
                          {notification.actionText}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notification Preferences */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-charcoal">Notification Preferences</h3>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-charcoal">Email Notifications</h4>
                <p className="text-sm text-gray-600">Receive notifications via email</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="rounded text-warm-gold focus:ring-warm-gold"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-charcoal">System Notifications</h4>
                <p className="text-sm text-gray-600">Show system maintenance alerts</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="rounded text-warm-gold focus:ring-warm-gold"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-charcoal">Training Reminders</h4>
                <p className="text-sm text-gray-600">Remind me about upcoming training deadlines</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="rounded text-warm-gold focus:ring-warm-gold"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-charcoal">Vacation Updates</h4>
                <p className="text-sm text-gray-600">Notify me about vacation request status changes</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="rounded text-warm-gold focus:ring-warm-gold"
              />
            </div>
          </div>
          <div className="mt-6">
            <button className="btn btn-primary">
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;