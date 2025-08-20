import React, { useState, useEffect } from 'react';
import { useTenant } from '../contexts/TenantContext';

interface PropertySwitchFeedbackProps {
  show: boolean;
  onHide: () => void;
  duration?: number;
}

const PropertySwitchFeedback: React.FC<PropertySwitchFeedbackProps> = ({
  show,
  onHide,
  duration = 3000
}) => {
  const { getCurrentPropertyName } = useTenant();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onHide, 300); // Wait for fade out animation
      }, duration);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [show, onHide, duration]);

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`
        bg-white border border-gray-200 shadow-lg rounded-lg px-4 py-3 
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}
      `}>
        <div className="flex items-center space-x-3">
          {/* Success Icon */}
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-green-600 text-sm">✓</span>
          </div>
          
          {/* Message */}
          <div>
            <p className="text-sm font-medium text-gray-900">
              Property Switched
            </p>
            <p className="text-xs text-gray-600">
              Now viewing: {getCurrentPropertyName()}
            </p>
          </div>
          
          {/* Progress Bar */}
          <div className="w-1 h-8 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="w-full bg-warm-gold transition-all ease-linear"
              style={{
                height: isVisible ? '0%' : '100%',
                transitionDuration: `${duration}ms`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertySwitchFeedback;