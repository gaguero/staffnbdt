import React from 'react';
import { clsx } from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled,
    leftIcon,
    rightIcon,
    fullWidth = false,
    children,
    ...props
  }, ref) => {
    const baseClasses = [
      'inline-flex items-center justify-center gap-2',
      'font-medium text-center',
      'border border-transparent',
      'transition-all duration-200 ease-in-out',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'select-none'
    ];

    const variantClasses = {
      primary: [
        'bg-primary-500 text-charcoal-500',
        'hover:bg-primary-600 hover:shadow-medium',
        'focus:ring-primary-500',
        'active:bg-primary-700'
      ],
      secondary: [
        'bg-charcoal-500 text-white',
        'hover:bg-charcoal-600 hover:shadow-medium',
        'focus:ring-charcoal-500',
        'active:bg-charcoal-700'
      ],
      outline: [
        'bg-transparent text-charcoal-500 border-charcoal-300',
        'hover:bg-charcoal-50 hover:border-charcoal-400',
        'focus:ring-charcoal-500',
        'active:bg-charcoal-100'
      ],
      ghost: [
        'bg-transparent text-charcoal-500',
        'hover:bg-charcoal-50',
        'focus:ring-charcoal-500',
        'active:bg-charcoal-100'
      ],
      danger: [
        'bg-error-500 text-white',
        'hover:bg-error-600 hover:shadow-medium',
        'focus:ring-error-500',
        'active:bg-error-700'
      ]
    };

    const sizeClasses = {
      sm: ['text-sm px-3 py-1.5 rounded-md min-h-[32px]'],
      md: ['text-base px-4 py-2 rounded-lg min-h-[40px]'],
      lg: ['text-lg px-6 py-3 rounded-lg min-h-[48px]']
    };

    const widthClasses = fullWidth ? ['w-full'] : [];

    const LoadingSpinner = () => (
      <svg
        className="animate-spin h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );

    return (
      <button
        ref={ref}
        className={clsx(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          widthClasses,
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <LoadingSpinner />
            Loading...
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';