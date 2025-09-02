import React, { useEffect, useState } from 'react';

interface SuccessCelebrationProps {
  show: boolean;
  message: string;
  onComplete?: () => void;
  icon?: string;
  duration?: number;
}

const SuccessCelebration: React.FC<SuccessCelebrationProps> = ({
  show,
  message,
  onComplete,
  icon = '🎉',
  duration = 3000
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'celebration' | 'exit'>('enter');

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setAnimationPhase('enter');
      
      // Enter phase
      setTimeout(() => {
        setAnimationPhase('celebration');
      }, 100);
      
      // Exit phase
      setTimeout(() => {
        setAnimationPhase('exit');
      }, duration - 500);
      
      // Complete
      setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, duration);
    }
  }, [show, duration, onComplete]);

  if (!isVisible) return null;

  const getAnimationClasses = () => {
    switch (animationPhase) {
      case 'enter':
        return 'scale-0 rotate-0 opacity-0';
      case 'celebration':
        return 'scale-100 rotate-12 opacity-100 animate-celebration';
      case 'exit':
        return 'scale-110 rotate-0 opacity-0';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Backdrop with subtle animation */}
      <div className={`absolute inset-0 bg-black transition-opacity duration-500 ${
        animationPhase === 'celebration' ? 'bg-opacity-20' : 'bg-opacity-0'
      }`} />
      
      {/* Celebration content */}
      <div className={`transform transition-all duration-500 ease-out ${getAnimationClasses()}`}>
        <div className="bg-gradient-to-br from-green-400 via-emerald-500 to-green-600 rounded-2xl p-8 shadow-2xl border border-green-300">
          {/* Confetti effect */}
          <div className="absolute -inset-4 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-3 h-3 rounded-full animate-confetti`}
                style={{
                  backgroundColor: ['#fbbf24', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'][i % 5],
                  top: `${20 + (i * 10)}%`,
                  left: `${10 + (i * 10)}%`,
                  animationDelay: `${i * 100}ms`,
                  animationDuration: '2s'
                }}
              />
            ))}
          </div>
          
          <div className="text-center relative z-10">
            <div className="text-6xl mb-4 animate-bounce">
              {icon}
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-sm">
              Success!
            </h3>
            
            <p className="text-green-100 font-medium text-lg max-w-sm">
              {message}
            </p>
            
            {/* Animated checkmark */}
            <div className="mt-4 inline-flex items-center justify-center w-12 h-12 bg-white bg-opacity-20 rounded-full animate-success-pulse">
              <span className="text-2xl text-white">✓</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-float opacity-60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 200}ms`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default SuccessCelebration;