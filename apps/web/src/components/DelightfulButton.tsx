import React, { useState, useRef, useEffect } from 'react';
import { getMicroInteraction } from '../utils/whimsyHelpers';

interface DelightfulButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
  icon?: string;
  iconPosition?: 'left' | 'right';
  animation?: 'bounce' | 'pulse' | 'glow' | 'lift' | 'scale' | 'wiggle';
  celebrateOnClick?: boolean;
  successIcon?: string;
  children: React.ReactNode;
}

const DelightfulButton: React.FC<DelightfulButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  icon,
  iconPosition = 'left',
  animation = 'scale',
  celebrateOnClick = false,
  successIcon = '✨',
  className = '',
  onClick,
  disabled,
  children,
  ...props
}) => {
  const [isClicked, setIsClicked] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden';

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-md hover:shadow-lg',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 shadow-md hover:shadow-lg',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-md hover:shadow-lg',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500 shadow-md hover:shadow-lg',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-md hover:shadow-lg',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white focus:ring-blue-500 hover:shadow-md'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const animationClasses = {
    bounce: getMicroInteraction('buttonHover') + ' hover:animate-gentle-bounce',
    pulse: getMicroInteraction('buttonHover') + ' hover:animate-pulse',
    glow: getMicroInteraction('glowEffect'),
    lift: getMicroInteraction('gentleLift'),
    scale: getMicroInteraction('buttonHover'),
    wiggle: getMicroInteraction('buttonHover') + ' hover:animate-wiggle'
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    setIsClicked(true);
    
    if (celebrateOnClick) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1000);
    }

    // Add ripple effect
    const button = buttonRef.current;
    if (button) {
      const ripple = document.createElement('span');
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.className = 'absolute bg-white bg-opacity-30 rounded-full animate-ping pointer-events-none';
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      
      button.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    }

    setTimeout(() => setIsClicked(false), 150);
    onClick?.(e);
  };

  useEffect(() => {
    if (isClicked && buttonRef.current) {
      buttonRef.current.classList.add('animate-gentle-bounce');
      setTimeout(() => {
        buttonRef.current?.classList.remove('animate-gentle-bounce');
      }, 600);
    }
  }, [isClicked]);

  const renderIcon = () => {
    if (loading) {
      return (
        <div className="animate-spin mr-2">
          <span className="text-inherit">⚡</span>
        </div>
      );
    }

    if (showSuccess) {
      return (
        <span className="animate-bounce mr-2">
          {successIcon}
        </span>
      );
    }

    if (icon) {
      return (
        <span className={`${iconPosition === 'left' ? 'mr-2' : 'ml-2'} transition-transform duration-200 hover:scale-110`}>
          {icon}
        </span>
      );
    }

    return null;
  };

  const finalClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    animationClasses[animation],
    isClicked ? 'scale-95' : '',
    className
  ].join(' ');

  return (
    <button
      ref={buttonRef}
      className={finalClasses}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {/* Background shimmer effect */}
      <div className="absolute inset-0 -top-1 -bottom-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 hover:opacity-10 transform -skew-x-12 transition-opacity duration-500" />
      
      {iconPosition === 'left' && renderIcon()}
      
      <span className="relative z-10 flex items-center">
        {loading && loadingText ? loadingText : children}
      </span>
      
      {iconPosition === 'right' && renderIcon()}
      
      {/* Success overlay */}
      {showSuccess && (
        <div className="absolute inset-0 bg-green-500 bg-opacity-20 rounded-lg animate-pulse" />
      )}
    </button>
  );
};

export default DelightfulButton;