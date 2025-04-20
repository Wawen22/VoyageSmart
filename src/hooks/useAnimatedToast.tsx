import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import AnimatedToast, { ToastType } from '@/components/ui/AnimatedToast';

interface ToastOptions {
  type?: ToastType;
  duration?: number;
  action?: React.ReactNode;
}

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  action?: React.ReactNode;
}

export function useAnimatedToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, options: ToastOptions = {}) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toast = {
      id,
      message,
      type: options.type || 'info',
      duration: options.duration || 5000,
      action: options.action,
    };

    setToasts((prevToasts) => [...prevToasts, toast]);
    
    return id;
  }, []);

  const closeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message: string, options: Omit<ToastOptions, 'type'> = {}) => {
    return showToast(message, { ...options, type: 'success' });
  }, [showToast]);

  const error = useCallback((message: string, options: Omit<ToastOptions, 'type'> = {}) => {
    return showToast(message, { ...options, type: 'error' });
  }, [showToast]);

  const info = useCallback((message: string, options: Omit<ToastOptions, 'type'> = {}) => {
    return showToast(message, { ...options, type: 'info' });
  }, [showToast]);

  const warning = useCallback((message: string, options: Omit<ToastOptions, 'type'> = {}) => {
    return showToast(message, { ...options, type: 'warning' });
  }, [showToast]);

  const ToastContainer = useCallback(() => {
    if (typeof window === 'undefined') return null;
    
    return createPortal(
      <>
        {toasts.map((toast) => (
          <AnimatedToast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            duration={toast.duration}
            onClose={() => closeToast(toast.id)}
            action={toast.action}
          />
        ))}
      </>,
      document.body
    );
  }, [toasts, closeToast]);

  return {
    showToast,
    success,
    error,
    info,
    warning,
    closeToast,
    ToastContainer,
  };
}
