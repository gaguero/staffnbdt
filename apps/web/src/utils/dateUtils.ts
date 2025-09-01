// Date utility functions

// Check if a date is overdue (past current time)
export const isOverdue = (date: Date): boolean => {
  return new Date(date).getTime() < Date.now();
};

// Format date with various options
export const format = (date: Date | string, formatStr: string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Simple format implementation - in a real app, use date-fns or similar
  const options: Intl.DateTimeFormatOptions = {};
  
  if (formatStr.includes('MMM')) {
    options.month = 'short';
  }
  if (formatStr.includes('d')) {
    options.day = 'numeric';
  }
  if (formatStr.includes('h')) {
    options.hour = 'numeric';
  }
  if (formatStr.includes('mm')) {
    options.minute = '2-digit';
  }
  if (formatStr.includes('a')) {
    options.hour12 = true;
  }
  
  return d.toLocaleDateString('en-US', options);
};

// Get relative time string (e.g., "2 hours ago", "in 3 days")
export const getRelativeTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (Math.abs(diffMinutes) < 60) {
    if (diffMinutes > 0) {
      return `in ${diffMinutes} min${diffMinutes !== 1 ? 's' : ''}`;
    } else {
      return `${Math.abs(diffMinutes)} min${Math.abs(diffMinutes) !== 1 ? 's' : ''} ago`;
    }
  } else if (Math.abs(diffHours) < 24) {
    if (diffHours > 0) {
      return `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    } else {
      return `${Math.abs(diffHours)} hour${Math.abs(diffHours) !== 1 ? 's' : ''} ago`;
    }
  } else {
    if (diffDays > 0) {
      return `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else {
      return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} ago`;
    }
  }
};

// Check if date is today
export const isToday = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return d.toDateString() === today.toDateString();
};

// Check if date is tomorrow
export const isTomorrow = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return d.toDateString() === tomorrow.toDateString();
};

// Get start of day
export const startOfDay = (date: Date | string): Date => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  return start;
};

// Get end of day
export const endOfDay = (date: Date | string): Date => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return end;
};
