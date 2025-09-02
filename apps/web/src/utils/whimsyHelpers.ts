/**
 * Hotel Operations Hub - Whimsy & Delight Utilities
 * 
 * This file contains utilities for adding delightful touches to the hotel operations interface.
 * These functions help maintain consistency while adding personality to user interactions.
 */

import { toast } from 'react-hot-toast';

/**
 * Celebration messages for different achievements
 */
export const celebrationMessages = {
  taskComplete: [
    "🎉 Another win for exceptional service!",
    "✨ That's how hospitality excellence looks!",
    "🏆 Your guests are going to love this!",
    "🌟 Outstanding work! Keep it up!",
    "💫 Service magic in action!"
  ],
  
  bulkComplete: [
    "🔥 Multi-tasking champion!",
    "⚡ Efficiency level: Extraordinary!",
    "🎯 Boom! Multiple tasks conquered!",
    "🚀 You're on fire today!",
    "💪 Team productivity superstar!"
  ],
  
  perfectScore: [
    "🏅 Absolutely flawless execution!",
    "💎 Diamond-level service delivery!",
    "🎊 Perfect score achieved!",
    "👑 Hospitality royalty right here!",
    "🌟 Five-star performance!"
  ],
  
  vendorAdded: [
    "🤝 New partnership unlocked!",
    "🌐 Network expansion success!",
    "🎯 Great choice in partners!",
    "💼 Your vendor family grows!",
    "🔗 Another connection made!"
  ]
};

/**
 * Get a random celebration message from a category
 */
export const getRandomCelebration = (category: keyof typeof celebrationMessages): string => {
  const messages = celebrationMessages[category];
  return messages[Math.floor(Math.random() * messages.length)];
};

/**
 * Show a delightful success toast with confetti effect
 */
export const showCelebrationToast = (
  message: string, 
  options: {
    icon?: string;
    duration?: number;
    position?: 'top-center' | 'top-right' | 'bottom-center' | 'bottom-right';
  } = {}
) => {
  const { icon = '🎉', duration = 4000, position = 'top-center' } = options;
  
  return toast.success(message, {
    icon,
    duration,
    position,
    style: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontWeight: '500',
      borderRadius: '12px',
      padding: '12px 16px',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
    },
  });
};

/**
 * Show encouraging message for empty states
 */
export const showEncouragingToast = (message: string) => {
  return toast(message, {
    icon: '💫',
    duration: 3000,
    style: {
      background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      color: '#8b5a3c',
      fontWeight: '500',
      borderRadius: '12px',
      padding: '12px 16px',
    },
  });
};

/**
 * Progress celebration thresholds and messages
 */
export const progressCelebrations = {
  25: { message: "🌱 Great start!", color: "text-green-600" },
  50: { message: "💪 Halfway there!", color: "text-blue-600" },
  75: { message: "🔥 Almost done!", color: "text-orange-600" },
  100: { message: "🎉 Perfect!", color: "text-purple-600" }
};

/**
 * Get appropriate celebration for progress percentage
 */
export const getProgressCelebration = (percentage: number) => {
  if (percentage >= 100) return progressCelebrations[100];
  if (percentage >= 75) return progressCelebrations[75];
  if (percentage >= 50) return progressCelebrations[50];
  if (percentage >= 25) return progressCelebrations[25];
  return null;
};

/**
 * Loading states with personality
 */
export const loadingStates = {
  syncing: { icon: "⚡", text: "Syncing magic..." },
  processing: { icon: "✨", text: "Working on it..." },
  completing: { icon: "🎯", text: "Finishing up..." },
  connecting: { icon: "🤝", text: "Connecting..." },
  saving: { icon: "💾", text: "Saving awesomeness..." },
  loading: { icon: "🌟", text: "Loading excellence..." }
};

/**
 * Get a loading state configuration
 */
export const getLoadingState = (type: keyof typeof loadingStates) => {
  return loadingStates[type] || loadingStates.loading;
};

/**
 * Empty state messages with personality
 */
export const emptyStateMessages = {
  noTasks: {
    title: "Ready to Begin!",
    subtitle: "Create your first task and start delivering amazing experiences.",
    icon: "🌟",
    action: "Create First Task"
  },
  
  noVendors: {
    title: "Build Your Network!",
    subtitle: "Add your first trusted partner and start creating seamless service connections.",
    icon: "🤝",
    action: "Add First Vendor"
  },
  
  noEvents: {
    title: "Fresh Start!",
    subtitle: "This guest's journey is just beginning. New interactions will appear here.",
    icon: "🎯",
    action: "Add First Event"
  },
  
  noResults: {
    title: "Refine Your Search",
    subtitle: "Try adjusting your filters to discover the perfect matches.",
    icon: "🔍",
    action: "Clear Filters"
  },
  
  allComplete: {
    title: "Outstanding Performance!",
    subtitle: "Everything is handled perfectly. Your team is amazing!",
    icon: "🏆",
    action: "View Reports"
  }
};

/**
 * Get empty state configuration
 */
export const getEmptyState = (type: keyof typeof emptyStateMessages) => {
  return emptyStateMessages[type];
};

/**
 * Hotel-specific motivational quotes for different times of day
 */
export const getTimeBasedMotivation = (): string => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return "🌅 Good morning! Ready to create exceptional experiences today?";
  } else if (hour >= 12 && hour < 17) {
    return "☀️ Afternoon excellence! Keep up the amazing hospitality!";
  } else if (hour >= 17 && hour < 22) {
    return "🌆 Evening service superstar! Finishing strong!";
  } else {
    return "🌙 Night shift champion! Your dedication makes all the difference!";
  }
};

/**
 * Quick celebration effect for immediate feedback
 */
export const quickCelebrate = (element?: HTMLElement) => {
  if (element) {
    element.classList.add('animate-bounce');
    setTimeout(() => {
      element.classList.remove('animate-bounce');
    }, 1000);
  }
};

/**
 * Generate a random hospitality emoji
 */
export const getHospitalityEmoji = (): string => {
  const emojis = ['🏨', '🛎️', '🗝️', '🛏️', '🧳', '☕', '🍽️', '🌟', '💎', '🎯'];
  return emojis[Math.floor(Math.random() * emojis.length)];
};

/**
 * Status-based animations and colors
 */
export const statusAnimations = {
  completed: {
    animation: 'animate-bounce',
    icon: '✅',
    gradient: 'from-green-400 to-emerald-500'
  },
  inProgress: {
    animation: 'animate-pulse',
    icon: '⚡',
    gradient: 'from-blue-400 to-blue-500'
  },
  overdue: {
    animation: 'animate-ping',
    icon: '🚨',
    gradient: 'from-red-400 to-red-500'
  },
  pending: {
    animation: 'animate-pulse',
    icon: '⏳',
    gradient: 'from-yellow-400 to-orange-500'
  }
};

/**
 * Get status-appropriate animation and styling
 */
export const getStatusAnimation = (status: string) => {
  const normalizedStatus = status.toLowerCase().replace('_', '').replace(' ', '');
  
  if (normalizedStatus.includes('complete')) return statusAnimations.completed;
  if (normalizedStatus.includes('progress')) return statusAnimations.inProgress;
  if (normalizedStatus.includes('overdue')) return statusAnimations.overdue;
  
  return statusAnimations.pending;
};

/**
 * Micro-interaction helpers for common UI patterns
 */
export const microInteractions = {
  buttonHover: 'hover:scale-105 transition-transform duration-200',
  cardHover: 'hover:shadow-lg hover:-translate-y-1 transition-all duration-200',
  iconBounce: 'hover:animate-bounce',
  iconSpin: 'hover:animate-spin transition-transform',
  scaleOnHover: 'transform transition-all duration-300 hover:scale-105',
  glowEffect: 'hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300',
  gentleLift: 'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200'
};

/**
 * Apply a micro-interaction class name
 */
export const getMicroInteraction = (type: keyof typeof microInteractions): string => {
  return microInteractions[type];
};