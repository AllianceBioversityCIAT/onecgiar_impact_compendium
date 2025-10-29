/**
 * Notification Component
 * 
 * A modern toast notification system with smooth animations and auto-dismiss functionality.
 * Supports different types (success, error, info) with appropriate styling and icons.
 * 
 * Features:
 * - Auto-dismiss with configurable duration
 * - Animated progress bar showing countdown
 * - Smooth slide-in/slide-out animations
 * - Manual close button
 * - Type-specific styling and icons
 * 
 * @author Impact Compendium Team
 * @version 1.0.0
 */

import React, { useEffect } from 'react';

interface NotificationProps {
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  show: boolean;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

export const Notification: React.FC<NotificationProps> = ({
  type,
  title,
  message,
  show,
  onClose,
  autoClose = true,
  duration = 4000
}) => {
  // Auto-dismiss timer
  useEffect(() => {
    if (show && autoClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [show, autoClose, duration, onClose]);

  if (!show) return null;

  // Icon components for different notification types
  const getIcon = () => {
    const iconClasses = "w-5 h-5";
    
    switch (type) {
      case 'success':
        return (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg className={`${iconClasses} text-green-600`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        );
      case 'error':
        return (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <svg className={`${iconClasses} text-red-600`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        );
      case 'info':
        return (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className={`${iconClasses} text-blue-600`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        );
    }
  };

  // Styling based on notification type
  const getStyles = () => {
    const baseStyles = {
      bg: 'bg-white',
      shadow: 'shadow-lg'
    };

    switch (type) {
      case 'success': 
        return {
          ...baseStyles,
          border: 'border-l-4 border-green-400',
          title: 'text-green-800',
          message: 'text-green-700',
          progress: 'bg-green-400'
        };
      case 'error': 
        return {
          ...baseStyles,
          border: 'border-l-4 border-red-400',
          title: 'text-red-800',
          message: 'text-red-700',
          progress: 'bg-red-400'
        };
      case 'info': 
        return {
          ...baseStyles,
          border: 'border-l-4 border-blue-400',
          title: 'text-blue-800',
          message: 'text-blue-700',
          progress: 'bg-blue-400'
        };
    }
  };

  const styles = getStyles();

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md w-full">
      <div className={`${styles.bg} ${styles.border} ${styles.shadow} rounded-lg p-4 transform transition-all duration-500 ease-out ${
        show ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'
      }`}>
        <div className="flex items-start">
          {getIcon()}
          
          <div className="ml-3 flex-1 min-w-0">
            <h3 className={`text-sm font-semibold ${styles.title}`}>
              {title}
            </h3>
            <p className={`mt-1 text-sm ${styles.message}`}>
              {message}
            </p>
          </div>
          
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={onClose}
              className="inline-flex text-gray-400 hover:text-gray-600 transition-colors duration-200"
              aria-label="Close notification"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Animated progress bar */}
        {autoClose && (
          <div className="mt-3 w-full bg-gray-200 rounded-full h-1">
            <div 
              className={`h-1 rounded-full transition-all ease-linear ${styles.progress}`}
              style={{
                width: '100%',
                animation: `shrink-progress ${duration}ms linear`
              }}
            />
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes shrink-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};
