import { useEffect, useRef, useState, useCallback } from 'react';

interface UseDropdownMenuOptions {
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  closeDelay?: number;
}

/**
 * Hook for managing dropdown menu state and interactions
 * Handles opening/closing, outside clicks, and keyboard navigation
 */
export function useDropdownMenu(options: UseDropdownMenuOptions = {}) {
  const {
    closeOnEscape = true,
    closeOnOutsideClick = true,
    closeDelay = 0
  } = options;

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    if (closeDelay > 0) {
      setTimeout(() => setIsOpen(false), closeDelay);
    } else {
      setIsOpen(false);
    }
  }, [closeDelay]);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  // Handle outside clicks
  useEffect(() => {
    if (!closeOnOutsideClick || !isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Check if the click is outside both the menu and trigger
      const isOutsideMenu = menuRef.current && !menuRef.current.contains(target);
      const isOutsideTrigger = triggerRef.current && !triggerRef.current.contains(target);
      
      if (isOutsideMenu && isOutsideTrigger) {
        // Use setTimeout to allow link clicks to be processed first
        setTimeout(() => {
          setIsOpen(false);
        }, 0);
      }
    };

    // Use 'click' instead of 'mousedown' to allow link clicks to be processed
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, closeOnOutsideClick]);

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        // Return focus to trigger button
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, closeOnEscape]);

  // Handle arrow key navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!menuRef.current) return;

      const menuItems = menuRef.current.querySelectorAll(
        '[role="menuitem"]:not([disabled])'
      ) as NodeListOf<HTMLElement>;

      if (menuItems.length === 0) return;

      const currentIndex = Array.from(menuItems).findIndex(
        item => item === document.activeElement
      );

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          const nextIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0;
          menuItems[nextIndex].focus();
          break;

        case 'ArrowUp':
          event.preventDefault();
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1;
          menuItems[prevIndex].focus();
          break;

        case 'Home':
          event.preventDefault();
          menuItems[0].focus();
          break;

        case 'End':
          event.preventDefault();
          menuItems[menuItems.length - 1].focus();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  /**
   * Handler for menu item clicks that ensures proper navigation
   */
  const handleMenuItemClick = useCallback((callback?: () => void) => {
    return (event: React.MouseEvent) => {
      // Execute the callback first (e.g., navigation)
      if (callback) {
        callback();
      }
      
      // Close the menu after a short delay to allow navigation
      setTimeout(() => {
        setIsOpen(false);
      }, 0);
    };
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
    menuRef,
    triggerRef,
    handleMenuItemClick,
    // Accessibility props
    menuProps: {
      role: 'menu',
      'aria-orientation': 'vertical' as const,
      'aria-labelledby': triggerRef.current?.id,
    },
    triggerProps: {
      'aria-expanded': isOpen,
      'aria-haspopup': 'menu' as const,
      onClick: toggle,
    },
  };
}
