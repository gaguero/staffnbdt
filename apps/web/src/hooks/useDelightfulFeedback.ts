import { useState, useCallback } from 'react';
import { showCelebrationToast, getRandomCelebration, showEncouragingToast } from '../utils/whimsyHelpers';

interface DelightfulFeedbackOptions {
  enableCelebrations?: boolean;
  enableEncouragement?: boolean;
  celebrationDuration?: number;
}

interface DelightfulFeedback {
  showSuccess: (message?: string, count?: number) => void;
  showEncouragement: (message?: string) => void;
  showCelebration: (message?: string, icon?: string) => void;
  triggerSuccess: (type: 'taskComplete' | 'bulkComplete' | 'perfectScore' | 'vendorAdded', customMessage?: string) => void;
  celebrationActive: boolean;
  setCelebrationActive: (active: boolean) => void;
}

export const useDelightfulFeedback = (options: DelightfulFeedbackOptions = {}): DelightfulFeedback => {
  const {
    enableCelebrations = true,
    enableEncouragement = true,
    celebrationDuration = 3000
  } = options;

  const [celebrationActive, setCelebrationActive] = useState(false);

  const showSuccess = useCallback((message?: string, count?: number) => {
    if (!enableCelebrations) return;

    let finalMessage = message;
    let icon = '🎉';
    
    if (!finalMessage) {
      if (count && count > 1) {
        finalMessage = getRandomCelebration('bulkComplete');
        icon = '🔥';
      } else {
        finalMessage = getRandomCelebration('taskComplete');
        icon = '⭐';
      }
    }

    showCelebrationToast(finalMessage, { 
      icon, 
      duration: celebrationDuration,
      position: 'top-center'
    });
  }, [enableCelebrations, celebrationDuration]);

  const showEncouragement = useCallback((message?: string) => {
    if (!enableEncouragement) return;

    const encouragingMessages = [
      "You're doing great! Keep up the excellent work! 💪",
      "Every step forward makes a difference! 🌟",
      "Your dedication to service excellence shows! ✨",
      "Great job staying on top of things! 🎯",
      "Your guests are lucky to have such a dedicated team! 🏆"
    ];

    const finalMessage = message || encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
    showEncouragingToast(finalMessage);
  }, [enableEncouragement]);

  const showCelebration = useCallback((message?: string, icon?: string) => {
    if (!enableCelebrations) return;

    setCelebrationActive(true);
    showCelebrationToast(message || 'Success!', { 
      icon: icon || '🎉', 
      duration: celebrationDuration 
    });

    setTimeout(() => {
      setCelebrationActive(false);
    }, celebrationDuration);
  }, [enableCelebrations, celebrationDuration]);

  const triggerSuccess = useCallback((
    type: 'taskComplete' | 'bulkComplete' | 'perfectScore' | 'vendorAdded', 
    customMessage?: string
  ) => {
    if (!enableCelebrations) return;

    const message = customMessage || getRandomCelebration(type);
    let icon = '🎉';
    let shouldShowCelebration = false;

    switch (type) {
      case 'taskComplete':
        icon = '✅';
        break;
      case 'bulkComplete':
        icon = '🔥';
        shouldShowCelebration = true;
        break;
      case 'perfectScore':
        icon = '🏆';
        shouldShowCelebration = true;
        break;
      case 'vendorAdded':
        icon = '🤝';
        break;
    }

    if (shouldShowCelebration) {
      showCelebration(message, icon);
    } else {
      showSuccess(message);
    }
  }, [enableCelebrations, showSuccess, showCelebration]);

  return {
    showSuccess,
    showEncouragement,
    showCelebration,
    triggerSuccess,
    celebrationActive,
    setCelebrationActive
  };
};