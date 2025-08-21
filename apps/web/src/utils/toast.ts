import toast from 'react-hot-toast';

/**
 * Centralized toast notification utility for consistent user feedback
 * Provides standardized success, error, warning, and info messages
 */

interface ToastOptions {
  duration?: number;
  position?: 'top-center' | 'top-right' | 'bottom-center' | 'bottom-right';
  id?: string;
}

const defaultOptions: ToastOptions = {
  duration: 4000,
  position: 'top-right',
};

export const toastService = {
  /**
   * Show success notification
   */
  success: (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      ...defaultOptions,
      ...options,
      style: {
        background: '#10B981',
        color: '#FFFFFF',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
      },
      iconTheme: {
        primary: '#FFFFFF',
        secondary: '#10B981',
      },
    });
  },

  /**
   * Show error notification
   */
  error: (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      ...defaultOptions,
      duration: 6000, // Error messages stay longer
      ...options,
      style: {
        background: '#EF4444',
        color: '#FFFFFF',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)',
      },
      iconTheme: {
        primary: '#FFFFFF',
        secondary: '#EF4444',
      },
    });
  },

  /**
   * Show warning notification
   */
  warning: (message: string, options?: ToastOptions) => {
    return toast(message, {
      ...defaultOptions,
      ...options,
      icon: '⚠️',
      style: {
        background: '#F59E0B',
        color: '#FFFFFF',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)',
      },
    });
  },

  /**
   * Show info notification
   */
  info: (message: string, options?: ToastOptions) => {
    return toast(message, {
      ...defaultOptions,
      ...options,
      icon: 'ℹ️',
      style: {
        background: '#3B82F6',
        color: '#FFFFFF',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
      },
    });
  },

  /**
   * Show loading notification with optional promise handling
   */
  loading: (message: string, options?: ToastOptions) => {
    return toast.loading(message, {
      ...defaultOptions,
      ...options,
      style: {
        background: '#6B7280',
        color: '#FFFFFF',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '14px',
      },
    });
  },

  /**
   * Handle async operations with loading, success, and error states
   */
  promise: <T>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: ToastOptions
  ) => {
    return toast.promise(
      promise,
      {
        loading,
        success,
        error,
      },
      {
        ...defaultOptions,
        ...options,
        style: {
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '14px',
        },
      }
    );
  },

  /**
   * Dismiss a specific toast
   */
  dismiss: (toastId?: string) => {
    return toast.dismiss(toastId);
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    return toast.dismiss();
  },

  /**
   * Action feedback patterns for common operations
   */
  actions: {
    created: (itemType: string, itemName?: string) => {
      const message = itemName
        ? `${itemType} "${itemName}" created successfully`
        : `${itemType} created successfully`;
      return toastService.success(message);
    },

    updated: (itemType: string, itemName?: string) => {
      const message = itemName
        ? `${itemType} "${itemName}" updated successfully`
        : `${itemType} updated successfully`;
      return toastService.success(message);
    },

    deleted: (itemType: string, itemName?: string) => {
      const message = itemName
        ? `${itemType} "${itemName}" deleted successfully`
        : `${itemType} deleted successfully`;
      return toastService.success(message);
    },

    activated: (itemType: string, itemName?: string) => {
      const message = itemName
        ? `${itemType} "${itemName}" activated`
        : `${itemType} activated`;
      return toastService.success(message);
    },

    deactivated: (itemType: string, itemName?: string) => {
      const message = itemName
        ? `${itemType} "${itemName}" deactivated`
        : `${itemType} deactivated`;
      return toastService.warning(message);
    },

    operationFailed: (operation: string, reason?: string) => {
      const message = reason
        ? `Failed to ${operation}: ${reason}`
        : `Failed to ${operation}`;
      return toastService.error(message);
    },

    bulkOperation: (operation: string, count: number, itemType: string) => {
      const message = `${operation} ${count} ${itemType}${count > 1 ? 's' : ''} successfully`;
      return toastService.success(message);
    },

    confirmationRequired: (operation: string) => {
      return toastService.warning(`Please confirm to ${operation}`, { duration: 6000 });
    },
  },
};

/**
 * Hook for using toast notifications in components
 */
export const useToast = () => {
  return toastService;
};

export default toastService;