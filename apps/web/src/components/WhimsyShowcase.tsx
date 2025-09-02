import React, { useState } from 'react';
import DelightfulButton from './DelightfulButton';
import DelightfulEmptyState from './DelightfulEmptyState';
import DelightfulLoadingSpinner from './DelightfulLoadingSpinner';
import SuccessCelebration from './SuccessCelebration';
import { useDelightfulFeedback } from '../hooks/useDelightfulFeedback';

/**
 * WhimsyShowcase - Demonstrates all the delightful enhancements
 * This component showcases the transformation from boring to delightful
 * Remove this file before production - it's just for demonstration
 */
const WhimsyShowcase: React.FC = () => {
  const [showCelebration, setShowCelebration] = useState(false);
  const [loadingState, setLoadingState] = useState<'syncing' | 'processing' | 'completing' | null>(null);
  const [emptyStateType, setEmptyStateType] = useState<'noTasks' | 'allComplete' | 'noVendors'>('noTasks');
  
  const feedback = useDelightfulFeedback();

  const handleTaskComplete = () => {
    feedback.triggerSuccess('taskComplete', 'Amazing! Task completed with style! ⭐');
  };

  const handleBulkComplete = () => {
    feedback.triggerSuccess('bulkComplete', 'Wow! 5 tasks completed at once! You\'re on fire! 🔥');
    setShowCelebration(true);
  };

  const handleVendorAdded = () => {
    feedback.triggerSuccess('vendorAdded');
  };

  const simulateLoading = (type: 'syncing' | 'processing' | 'completing') => {
    setLoadingState(type);
    setTimeout(() => {
      setLoadingState(null);
      feedback.showSuccess('Operation completed successfully!');
    }, 2000);
  };

  return (
    <div className="p-8 space-y-12 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          🎨 Hotel Operations Hub - Whimsy Showcase
        </h1>
        
        {/* Before & After Comparison */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-red-600">❌ Before (Boring)</h2>
            <div className="space-y-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded">
                Complete Task
              </button>
              <div className="text-center py-8 text-gray-500">
                <p>No tasks found</p>
              </div>
              <div className="flex items-center">
                <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                <span>Loading...</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-green-600">✨ After (Delightful)</h2>
            <div className="space-y-4">
              <DelightfulButton 
                variant="success" 
                icon="⭐"
                animation="bounce"
                celebrateOnClick={true}
                onClick={handleTaskComplete}
              >
                Complete Task
              </DelightfulButton>
              
              <DelightfulEmptyState 
                type="noTasks"
                size="sm"
                onAction={() => feedback.showEncouragement('Ready to create something amazing!')}
              />
              
              <DelightfulLoadingSpinner 
                type="processing" 
                size="md"
                showMessage={true}
              />
            </div>
          </div>
        </div>

        {/* Interactive Examples */}
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-center">🎯 Interactive Examples</h2>
          
          {/* Button Gallery */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Delightful Buttons</h3>
            <div className="flex flex-wrap gap-4">
              <DelightfulButton 
                variant="primary" 
                icon="🚀" 
                animation="lift"
                onClick={handleTaskComplete}
              >
                Launch Action
              </DelightfulButton>
              
              <DelightfulButton 
                variant="success" 
                icon="🎯" 
                animation="bounce"
                celebrateOnClick={true}
                onClick={handleBulkComplete}
              >
                Bulk Complete
              </DelightfulButton>
              
              <DelightfulButton 
                variant="outline" 
                icon="🤝" 
                animation="wiggle"
                onClick={handleVendorAdded}
              >
                Add Vendor
              </DelightfulButton>
              
              <DelightfulButton 
                variant="warning" 
                icon="⚡" 
                loading={loadingState === 'syncing'}
                loadingText="Syncing magic..."
                onClick={() => simulateLoading('syncing')}
              >
                Sync Data
              </DelightfulButton>
            </div>
          </div>

          {/* Loading States */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Enhanced Loading States</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <DelightfulLoadingSpinner type="syncing" size="lg" />
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <DelightfulLoadingSpinner type="completing" size="md" />
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <DelightfulLoadingSpinner type="connecting" size="sm" />
              </div>
            </div>
          </div>

          {/* Empty States */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Encouraging Empty States</h3>
            <div className="space-y-4">
              <div className="flex justify-center space-x-4 mb-4">
                <button 
                  onClick={() => setEmptyStateType('noTasks')}
                  className={`px-4 py-2 rounded ${emptyStateType === 'noTasks' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  No Tasks
                </button>
                <button 
                  onClick={() => setEmptyStateType('allComplete')}
                  className={`px-4 py-2 rounded ${emptyStateType === 'allComplete' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                >
                  All Complete
                </button>
                <button 
                  onClick={() => setEmptyStateType('noVendors')}
                  className={`px-4 py-2 rounded ${emptyStateType === 'noVendors' ? 'bg-purple-500 text-white' : 'bg-gray-200'}`}
                >
                  No Vendors
                </button>
              </div>
              
              <DelightfulEmptyState 
                type={emptyStateType}
                size="md"
                onAction={() => feedback.showEncouragement('Great choice! Let\'s build something amazing!')}
              />
            </div>
          </div>

          {/* Feedback Examples */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Delightful Feedback</h3>
            <div className="flex flex-wrap gap-4">
              <DelightfulButton 
                variant="success" 
                icon="🎉"
                onClick={() => feedback.showSuccess('Task completed with excellence!')}
              >
                Show Success
              </DelightfulButton>
              
              <DelightfulButton 
                variant="primary" 
                icon="💪"
                onClick={() => feedback.showEncouragement()}
              >
                Show Encouragement
              </DelightfulButton>
              
              <DelightfulButton 
                variant="warning" 
                icon="🏆"
                onClick={() => {
                  setShowCelebration(true);
                  feedback.triggerSuccess('perfectScore');
                }}
              >
                Perfect Score!
              </DelightfulButton>
            </div>
          </div>
        </div>

        {/* Success Celebration */}
        <SuccessCelebration 
          show={showCelebration}
          message="Outstanding performance! Your team achieved perfect scores across all metrics!"
          onComplete={() => setShowCelebration(false)}
          icon="🏆"
        />

        {/* Implementation Notes */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-blue-800">📝 Implementation Notes</h3>
          <div className="text-blue-700 space-y-2 text-sm">
            <p>• All components are mobile-first and fully accessible</p>
            <p>• Animations respect user's reduced-motion preferences</p>
            <p>• Toast notifications are branded and consistent</p>
            <p>• Micro-interactions provide immediate feedback</p>
            <p>• Empty states encourage action rather than disappointment</p>
            <p>• Loading states have personality and reduce perceived wait time</p>
            <p>• Success moments are celebrated appropriately</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhimsyShowcase;