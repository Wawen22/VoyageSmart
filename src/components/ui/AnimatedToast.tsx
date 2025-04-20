import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  InfoIcon, 
  AlertTriangleIcon, 
  XIcon 
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface AnimatedToastProps {
  type: ToastType;
  message: string;
  duration?: number;
  onClose?: () => void;
  action?: React.ReactNode;
}

export default function AnimatedToast({
  type,
  message,
  duration = 5000,
  onClose,
  action
}: AnimatedToastProps) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
    }, 300); // Match the animation duration
  };

  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'info':
        return <InfoIcon className="h-5 w-5 text-blue-500" />;
      case 'warning':
        return <AlertTriangleIcon className="h-5 w-5 text-amber-500" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800 dark:text-green-200';
      case 'error':
        return 'text-red-800 dark:text-red-200';
      case 'info':
        return 'text-blue-800 dark:text-blue-200';
      case 'warning':
        return 'text-amber-800 dark:text-amber-200';
    }
  };

  return (
    <div 
      className={`
        fixed bottom-4 right-4 z-50 max-w-md w-full sm:w-auto
        ${exiting ? 'animate-slide-in-right' : 'animate-slide-in-right'}
        transform transition-all duration-300 ease-in-out
        ${exiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}
      `}
      style={{ animationDirection: exiting ? 'reverse' : 'normal' }}
    >
      <div className={`
        flex items-start p-4 rounded-lg shadow-lg border
        ${getBgColor()}
      `}>
        <div className="flex-shrink-0 mr-3 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 mr-2">
          <p className={`text-sm font-medium ${getTextColor()}`}>
            {message}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {action && (
            <div className="flex-shrink-0">
              {action}
            </div>
          )}
          <button
            type="button"
            className={`
              rounded-md p-1.5 inline-flex items-center justify-center
              text-gray-400 hover:text-gray-500 focus:outline-none
              focus:ring-2 focus:ring-offset-2 focus:ring-primary
            `}
            onClick={handleClose}
          >
            <span className="sr-only">Close</span>
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
