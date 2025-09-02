import React from 'react';
import { ConciergeObject } from '../../types/concierge';

interface ViewConciergeObjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  object: ConciergeObject;
}

const ViewConciergeObjectModal: React.FC<ViewConciergeObjectModalProps> = ({
  isOpen,
  onClose,
  object,
}) => {
  if (!isOpen) return null;

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { className: 'bg-blue-100 text-blue-800', label: 'Open' },
      in_progress: { className: 'bg-yellow-100 text-yellow-800', label: 'In Progress' },
      completed: { className: 'bg-green-100 text-green-800', label: 'Completed' },
      cancelled: { className: 'bg-gray-100 text-gray-800', label: 'Cancelled' },
      overdue: { className: 'bg-red-100 text-red-800', label: 'Overdue' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAttributeValue = (attribute: any) => {
    if (attribute.stringValue !== null && attribute.stringValue !== undefined) {
      return attribute.stringValue;
    }
    if (attribute.numberValue !== null && attribute.numberValue !== undefined) {
      return attribute.numberValue.toString();
    }
    if (attribute.booleanValue !== null && attribute.booleanValue !== undefined) {
      return attribute.booleanValue ? 'Yes' : 'No';
    }
    if (attribute.dateValue) {
      return formatDate(new Date(attribute.dateValue));
    }
    if (attribute.jsonValue !== null && attribute.jsonValue !== undefined) {
      return JSON.stringify(attribute.jsonValue, null, 2);
    }
    return 'N/A';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-semibold text-charcoal mb-2">
                {object.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h3>
              <div className="flex items-center space-x-3">
                {getStatusBadge(object.status)}
                <span className="text-sm text-gray-500">ID: {object.id}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Details */}
              <div className="card p-4">
                <h4 className="font-medium text-charcoal mb-4 border-b pb-2">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="font-medium">{object.type.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <div className="mt-1">{getStatusBadge(object.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium">{formatDate(object.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="font-medium">{formatDate(object.updatedAt)}</p>
                  </div>
                  {object.dueAt && (
                    <div>
                      <p className="text-sm text-gray-500">Due Date</p>
                      <p className="font-medium">{formatDate(object.dueAt)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Guest & Reservation Info */}
              {(object.guest || object.reservation || object.guestId || object.reservationId) && (
                <div className="card p-4">
                  <h4 className="font-medium text-charcoal mb-4 border-b pb-2">Guest & Reservation</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {object.guest && (
                      <div>
                        <p className="text-sm text-gray-500">Guest</p>
                        <p className="font-medium">{object.guest.firstName} {object.guest.lastName}</p>
                        {object.guest.email && (
                          <p className="text-sm text-gray-600">{object.guest.email}</p>
                        )}
                        {object.guest.phone && (
                          <p className="text-sm text-gray-600">{object.guest.phone}</p>
                        )}
                      </div>
                    )}
                    {!object.guest && object.guestId && (
                      <div>
                        <p className="text-sm text-gray-500">Guest ID</p>
                        <p className="font-medium">{object.guestId}</p>
                      </div>
                    )}
                    {object.reservation && (
                      <div>
                        <p className="text-sm text-gray-500">Reservation</p>
                        <p className="font-medium">{object.reservation.confirmationNumber}</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(object.reservation.checkInDate)} - {formatDate(object.reservation.checkOutDate)}
                        </p>
                      </div>
                    )}
                    {!object.reservation && object.reservationId && (
                      <div>
                        <p className="text-sm text-gray-500">Reservation ID</p>
                        <p className="font-medium">{object.reservationId}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Attributes */}
              {object.attributes && object.attributes.length > 0 && (
                <div className="card p-4">
                  <h4 className="font-medium text-charcoal mb-4 border-b pb-2">Object Details</h4>
                  <div className="space-y-3">
                    {object.attributes.map((attr) => (
                      <div key={attr.id} className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100 last:border-b-0">
                        <div>
                          <p className="text-sm font-medium text-gray-700">{attr.fieldKey}</p>
                          <p className="text-xs text-gray-500">{attr.fieldType}</p>
                        </div>
                        <div className="col-span-2">
                          {attr.fieldType === 'json' ? (
                            <pre className="text-sm text-gray-900 bg-gray-50 p-2 rounded whitespace-pre-wrap">
                              {formatAttributeValue(attr)}
                            </pre>
                          ) : (
                            <p className="text-sm text-gray-900">{formatAttributeValue(attr)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Assignments */}
              {object.assignments && Object.keys(object.assignments).length > 0 && (
                <div className="card p-4">
                  <h4 className="font-medium text-charcoal mb-4 border-b pb-2">Assignments</h4>
                  <div className="space-y-2">
                    {Object.entries(object.assignments).map(([key, value]) => (
                      <div key={key}>
                        <p className="text-sm font-medium text-gray-700">{key}</p>
                        <p className="text-sm text-gray-900">{JSON.stringify(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              {object.files && Object.keys(object.files).length > 0 && (
                <div className="card p-4">
                  <h4 className="font-medium text-charcoal mb-4 border-b pb-2">Files</h4>
                  <div className="space-y-2">
                    {Object.entries(object.files).map(([key, value]) => (
                      <div key={key}>
                        <p className="text-sm font-medium text-gray-700">{key}</p>
                        <p className="text-sm text-gray-900">{JSON.stringify(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="card p-4">
                <h4 className="font-medium text-charcoal mb-4 border-b pb-2">Timeline</h4>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Created</p>
                      <p className="text-xs text-gray-500">{formatDate(object.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Last Updated</p>
                      <p className="text-xs text-gray-500">{formatDate(object.updatedAt)}</p>
                    </div>
                  </div>
                  {object.dueAt && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full bg-orange-500 mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Due Date</p>
                        <p className="text-xs text-gray-500">{formatDate(object.dueAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-6 border-t">
            <button onClick={onClose} className="btn btn-primary">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewConciergeObjectModal;