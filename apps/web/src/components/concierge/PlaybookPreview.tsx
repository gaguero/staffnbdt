import React, { useState, useEffect } from 'react';
import { Playbook, PlaybookPreviewResult } from '../../types/concierge';
import { conciergeService } from '../../services/conciergeService';
import LoadingSpinner from '../LoadingSpinner';
import { X, Play, Clock, AlertTriangle, CheckCircle, Zap } from 'lucide-react';

interface PlaybookPreviewProps {
  playbook: Playbook;
  isOpen: boolean;
  onClose: () => void;
}

const PlaybookPreview: React.FC<PlaybookPreviewProps> = ({
  playbook,
  isOpen,
  onClose,
}) => {
  const [previewData, setPreviewData] = useState<PlaybookPreviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testData, setTestData] = useState({
    guestName: 'John Smith',
    roomType: 'suite',
    checkInDate: new Date().toISOString().split('T')[0],
    vipStatus: true,
    stayDuration: 3,
  });
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPreview();
    }
  }, [isOpen, playbook]);

  const loadPreview = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await conciergeService.previewPlaybook(playbook, testData);
      setPreviewData(response.data);
    } catch (err: any) {
      console.error('Failed to load preview:', err);
      setError('Failed to load playbook preview');
    } finally {
      setLoading(false);
    }
  };

  const executePlaybook = async () => {
    if (!playbook.id) {
      setError('Playbook must be saved before testing execution');
      return;
    }

    setIsExecuting(true);
    setError(null);

    try {
      await conciergeService.executePlaybook({
        playbookId: playbook.id,
        triggerData: testData,
      });

      // Show success message
      alert('Playbook executed successfully! Check the Concierge page for created objects.');
    } catch (err: any) {
      console.error('Failed to execute playbook:', err);
      setError('Failed to execute playbook: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsExecuting(false);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Playbook Preview</h2>
            <p className="text-sm text-gray-600">{playbook.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Test Data */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                <Zap className="w-5 h-5 text-blue-500" />
                <span>Test Data</span>
              </h3>
              
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guest Name
                  </label>
                  <input
                    type="text"
                    value={testData.guestName}
                    onChange={(e) => setTestData(prev => ({ ...prev, guestName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room Type
                  </label>
                  <select
                    value={testData.roomType}
                    onChange={(e) => setTestData(prev => ({ ...prev, roomType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="standard">Standard</option>
                    <option value="deluxe">Deluxe</option>
                    <option value="suite">Suite</option>
                    <option value="presidential">Presidential</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Check-in Date
                  </label>
                  <input
                    type="date"
                    value={testData.checkInDate}
                    onChange={(e) => setTestData(prev => ({ ...prev, checkInDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stay Duration (nights)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={testData.stayDuration}
                    onChange={(e) => setTestData(prev => ({ ...prev, stayDuration: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={testData.vipStatus}
                      onChange={(e) => setTestData(prev => ({ ...prev, vipStatus: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">VIP Status</span>
                  </label>
                </div>

                <button
                  onClick={loadPreview}
                  disabled={loading}
                  className="w-full btn btn-secondary flex items-center justify-center space-x-2"
                >
                  {loading ? <LoadingSpinner size="sm" /> : <Play className="w-4 h-4" />}
                  <span>Update Preview</span>
                </button>
              </div>
            </div>

            {/* Preview Results */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                <Eye className="w-5 h-5 text-green-500" />
                <span>Execution Preview</span>
              </h3>

              {loading && (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Preview Error</p>
                      <p className="text-sm text-red-600 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {previewData && (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-5 h-5 text-blue-500" />
                      <span className="font-medium text-blue-900">Execution Summary</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-blue-600">Estimated Time</p>
                        <p className="font-medium text-blue-900">
                          {formatDuration(previewData.estimatedExecutionTime)}
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-600">Total Actions</p>
                        <p className="font-medium text-blue-900">
                          {previewData.expectedActions.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Expected Actions */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Expected Actions</h4>
                    {previewData.expectedActions.map((action, index) => (
                      <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="flex items-start space-x-3">
                          <div className="bg-green-100 text-green-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
                            {action.stepNumber}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{action.description}</p>
                            <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                              <span>Type: {action.actionType}</span>
                              <span>Duration: {formatDuration(action.estimatedDuration)}</span>
                            </div>
                            {action.requiredResources.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-600 mb-1">Required Resources:</p>
                                <div className="flex flex-wrap gap-1">
                                  {action.requiredResources.map((resource, resourceIndex) => (
                                    <span
                                      key={resourceIndex}
                                      className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs"
                                    >
                                      {resource}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Potential Issues */}
                  {previewData.potentialIssues.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800 mb-2">Potential Issues</p>
                          <ul className="text-sm text-yellow-700 space-y-1">
                            {previewData.potentialIssues.map((issue, index) => (
                              <li key={index}>• {issue}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            Preview shows what would happen if this playbook executes with the test data
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="btn btn-secondary"
            >
              Close
            </button>
            <button
              onClick={executePlaybook}
              disabled={isExecuting || loading || !playbook.id}
              className="btn btn-primary flex items-center space-x-2"
            >
              {isExecuting ? <LoadingSpinner size="sm" /> : <Play className="w-4 h-4" />}
              <span>Test Execute</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaybookPreview;