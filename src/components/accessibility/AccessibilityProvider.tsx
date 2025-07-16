'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAriaLiveRegion, useSkipLinks } from '@/hooks/useKeyboardShortcuts';

interface AccessibilityContextType {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}

interface AccessibilityProviderProps {
  children: ReactNode;
}

export default function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const { liveRegionRef, announce } = useAriaLiveRegion();
  const skipLinksRef = useSkipLinks();

  return (
    <AccessibilityContext.Provider value={{ announce }}>
      {/* Skip Links */}
      <div 
        ref={skipLinksRef}
        className="skip-links fixed top-0 left-0 z-[9999] opacity-0 pointer-events-none focus-within:opacity-100 focus-within:pointer-events-auto"
      >
        <a 
          href="#main-content" 
          className="skip-link absolute top-4 left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Skip to main content
        </a>
        <a 
          href="#navigation" 
          className="skip-link absolute top-4 left-32 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Skip to navigation
        </a>
      </div>

      {/* Main Content */}
      {children}

      {/* ARIA Live Region */}
      <div
        ref={liveRegionRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />
    </AccessibilityContext.Provider>
  );
}

// Screen Reader Only component
export function ScreenReaderOnly({ children, as: Component = 'span' }: { 
  children: ReactNode; 
  as?: keyof JSX.IntrinsicElements;
}) {
  return (
    <Component className="sr-only">
      {children}
    </Component>
  );
}

// Focus Visible component for better focus indicators
export function FocusVisible({ 
  children, 
  className = '',
  ...props 
}: { 
  children: ReactNode; 
  className?: string;
  [key: string]: any;
}) {
  return (
    <div 
      className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// Landmark component for better navigation
export function Landmark({ 
  children, 
  role, 
  label,
  className = '' 
}: { 
  children: ReactNode; 
  role: 'main' | 'navigation' | 'banner' | 'contentinfo' | 'complementary' | 'region';
  label?: string;
  className?: string;
}) {
  return (
    <div 
      role={role}
      aria-label={label}
      className={className}
    >
      {children}
    </div>
  );
}

// Accessible button component
export function AccessibleButton({
  children,
  onClick,
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
  className = '',
  ...props
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  className?: string;
  [key: string]: any;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      className={`focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// Accessible form field component
export function AccessibleField({
  label,
  children,
  error,
  description,
  required = false,
  className = ''
}: {
  label: string;
  children: ReactNode;
  error?: string;
  description?: string;
  required?: boolean;
  className?: string;
}) {
  const fieldId = `field-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${fieldId}-error` : undefined;
  const descriptionId = description ? `${fieldId}-description` : undefined;

  return (
    <div className={`space-y-2 ${className}`}>
      <label 
        htmlFor={fieldId}
        className="block text-sm font-medium text-foreground"
      >
        {label}
        {required && (
          <span className="text-destructive ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      
      <div>
        {children}
      </div>
      
      {error && (
        <p 
          id={errorId} 
          className="text-sm text-destructive"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
}

// Accessible loading component
export function AccessibleLoading({ 
  message = 'Loading...', 
  className = '' 
}: { 
  message?: string; 
  className?: string; 
}) {
  return (
    <div 
      className={`flex items-center justify-center ${className}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      <ScreenReaderOnly>{message}</ScreenReaderOnly>
    </div>
  );
}

// Accessible modal component
export function AccessibleModal({
  isOpen,
  onClose,
  title,
  children,
  className = ''
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className={`bg-card rounded-lg shadow-lg max-w-md w-full mx-4 ${className}`}>
        <div className="p-6">
          <h2 id="modal-title" className="text-lg font-semibold mb-4">
            {title}
          </h2>
          {children}
        </div>
      </div>
    </div>
  );
}
