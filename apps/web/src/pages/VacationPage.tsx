import React, { useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

interface VacationRequest {
  id: string;
  startDate: string;
  endDate: string;
  days: number;
  type: 'vacation' | 'sick' | 'personal' | 'emergency';
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  submittedDate: string;
  approverComments?: string;
}

const VacationPage: React.FC = () => {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    type: 'vacation' as const,
    reason: ''
  });

  // Mock data - replace with actual API call
  const vacationRequests: VacationRequest[] = [
    {
      id: '1',
      startDate: '2024-02-15',
      endDate: '2024-02-19',
      days: 5,
      type: 'vacation',
      status: 'approved',
      reason: 'Family vacation',
      submittedDate: '2024-01-20',
      approverComments: 'Approved. Enjoy your vacation!'
    },
    {
      id: '2',
      startDate: '2024-03-10',
      endDate: '2024-03-10',
      days: 1,
      type: 'sick',
      status: 'approved',
      reason: 'Medical appointment',
      submittedDate: '2024-03-09'
    },
    {
      id: '3',
      startDate: '2024-04-01',
      endDate: '2024-04-05',
      days: 5,
      type: 'vacation',
      status: 'pending',
      reason: 'Spring break',
      submittedDate: '2024-03-15'
    }
  ];

  const vacationBalance = {
    totalDays: 20,
    usedDays: 6,
    pendingDays: 5,
    remainingDays: 9
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const timeDiff = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Implement vacation request API call
      console.log('Submitting vacation request:', formData);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset form and close modal
      setFormData({
        startDate: '',
        endDate: '',
        type: 'vacation',
        reason: ''
      });
      setShowRequestForm(false);
    } catch (error) {
      console.error('Failed to submit vacation request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="badge badge-success">Approved</span>;
      case 'pending':
        return <span className="badge badge-warning">Pending</span>;
      case 'rejected':
        return <span className="badge badge-error">Rejected</span>;
      default:
        return <span className="badge badge-neutral">Unknown</span>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'vacation':
        return '🏖️';
      case 'sick':
        return '🏥';
      case 'personal':
        return '👤';
      case 'emergency':
        return '🚨';
      default:
        return '📅';
    }
  };

  const requestedDays = calculateDays(formData.startDate, formData.endDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2">Vacation Management</h1>
          <p className="text-gray-600">Manage your time off requests</p>
        </div>
        
        <button
          onClick={() => setShowRequestForm(true)}
          className="btn btn-primary"
        >
          <span className="mr-2">➕</span>
          New Request
        </button>
      </div>

      {/* Vacation Balance */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-charcoal">Vacation Balance</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl mb-2">📅</div>
              <p className="text-sm text-gray-600 mb-1">Total Days</p>
              <p className="text-2xl font-bold text-blue-600">
                {vacationBalance.totalDays}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl mb-2">✅</div>
              <p className="text-sm text-gray-600 mb-1">Used Days</p>
              <p className="text-2xl font-bold text-green-600">
                {vacationBalance.usedDays}
              </p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl mb-2">⏳</div>
              <p className="text-sm text-gray-600 mb-1">Pending Days</p>
              <p className="text-2xl font-bold text-orange-600">
                {vacationBalance.pendingDays}
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl mb-2">🎯</div>
              <p className="text-sm text-gray-600 mb-1">Remaining Days</p>
              <p className="text-2xl font-bold text-purple-600">
                {vacationBalance.remainingDays}
              </p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Vacation Usage</span>
              <span>{vacationBalance.usedDays + vacationBalance.pendingDays} / {vacationBalance.totalDays} days</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="flex h-3 rounded-full overflow-hidden">
                <div
                  className="bg-green-500"
                  style={{ width: `${(vacationBalance.usedDays / vacationBalance.totalDays) * 100}%` }}
                />
                <div
                  className="bg-orange-500"
                  style={{ width: `${(vacationBalance.pendingDays / vacationBalance.totalDays) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vacation Requests */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-charcoal">Vacation Requests</h3>
        </div>
        <div className="card-body p-0">
          {vacationRequests.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🏖️</div>
              <h3 className="text-lg font-semibold text-charcoal mb-2">
                No vacation requests
              </h3>
              <p className="text-gray-600">
                Submit your first vacation request to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4 p-6">
              {vacationRequests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-soft transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl">{getTypeIcon(request.type)}</span>
                        <div>
                          <h4 className="font-medium text-charcoal capitalize">
                            {request.type} Request
                          </h4>
                          <p className="text-sm text-gray-600">
                            {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Days:</span>
                          <span className="ml-1 font-medium">{request.days}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Submitted:</span>
                          <span className="ml-1 font-medium">
                            {new Date(request.submittedDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <span className="ml-1">{getStatusBadge(request.status)}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Reason:</span> {request.reason}
                        </p>
                        {request.approverComments && (
                          <p className="text-sm text-green-600 mt-1">
                            <span className="font-medium">Comments:</span> {request.approverComments}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {request.status === 'pending' && (
                        <button className="btn btn-outline btn-sm">
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Request Form Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-charcoal">
                  New Vacation Request
                </h3>
                <button
                  onClick={() => setShowRequestForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={isSubmitting}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="form-label">Request Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  >
                    <option value="vacation">Vacation</option>
                    <option value="sick">Sick Leave</option>
                    <option value="personal">Personal</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className="form-input"
                      min={formData.startDate}
                      required
                    />
                  </div>
                </div>

                {requestedDays > 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Total days requested:</span> {requestedDays}
                    </p>
                    {requestedDays > vacationBalance.remainingDays && (
                      <p className="text-sm text-red-600 mt-1">
                        ⚠️ This exceeds your remaining vacation balance
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="form-label">Reason</label>
                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    className="form-input"
                    rows={3}
                    placeholder="Please provide a reason for your request..."
                    required
                  />
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="submit"
                    className="btn btn-primary flex-1"
                    disabled={isSubmitting || requestedDays === 0}
                  >
                    {isSubmitting ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      'Submit Request'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRequestForm(false)}
                    className="btn btn-secondary flex-1"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VacationPage;