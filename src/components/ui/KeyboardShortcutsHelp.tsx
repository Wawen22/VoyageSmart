'use client';

import { useState } from 'react';
import { KeyboardIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useKeyboardShortcuts, type KeyboardShortcut } from '@/hooks/useKeyboardShortcuts';
import { AccessibleModal } from '@/components/accessibility/AccessibilityProvider';
import { cn } from '@/lib/utils';

interface KeyboardShortcutsHelpProps {
  shortcuts: KeyboardShortcut[];
  className?: string;
}

export default function KeyboardShortcutsHelp({ 
  shortcuts, 
  className = '' 
}: KeyboardShortcutsHelpProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  const formatShortcut = (shortcut: KeyboardShortcut) => {
    const keys = [];
    
    if (shortcut.ctrlKey) keys.push('Ctrl');
    if (shortcut.metaKey) keys.push('Cmd');
    if (shortcut.altKey) keys.push('Alt');
    if (shortcut.shiftKey) keys.push('Shift');
    
    keys.push(shortcut.key === ' ' ? 'Space' : shortcut.key);
    
    return keys;
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={cn('flex items-center gap-2', className)}
        title="Show keyboard shortcuts (Shift + ?)"
      >
        <KeyboardIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Shortcuts</span>
      </Button>

      <AccessibleModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Keyboard Shortcuts"
        className="max-w-2xl"
      >
        <div className="max-h-96 overflow-y-auto">
          <div className="space-y-6">
            {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm text-foreground">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {formatShortcut(shortcut).map((key, keyIndex) => (
                          <Badge 
                            key={keyIndex}
                            variant="outline" 
                            className="text-xs px-2 py-1 font-mono"
                          >
                            {key}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-end mt-6 pt-4 border-t border-border">
          <Button onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>
      </AccessibleModal>
    </>
  );
}

// Quick shortcut display component
export function ShortcutBadge({ 
  shortcut, 
  className = '' 
}: { 
  shortcut: KeyboardShortcut; 
  className?: string; 
}) {
  const formatShortcut = (shortcut: KeyboardShortcut) => {
    const keys = [];
    
    if (shortcut.ctrlKey) keys.push('⌘');
    if (shortcut.metaKey) keys.push('⌘');
    if (shortcut.altKey) keys.push('⌥');
    if (shortcut.shiftKey) keys.push('⇧');
    
    keys.push(shortcut.key.toUpperCase());
    
    return keys.join(' + ');
  };

  return (
    <Badge 
      variant="outline" 
      className={cn('text-xs font-mono', className)}
      title={shortcut.description}
    >
      {formatShortcut(shortcut)}
    </Badge>
  );
}

// Hook for dashboard-specific shortcuts
export function useDashboardShortcuts() {
  const [showHelp, setShowHelp] = useState(false);

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'k',
      ctrlKey: true,
      action: () => {
        // Focus search input
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        searchInput?.focus();
      },
      description: 'Focus search',
      category: 'Navigation'
    },
    {
      key: 'n',
      ctrlKey: true,
      action: () => {
        // Navigate to new trip
        window.location.href = '/trips/new';
      },
      description: 'Create new trip',
      category: 'Actions'
    },
    {
      key: '?',
      shiftKey: true,
      action: () => setShowHelp(true),
      description: 'Show keyboard shortcuts',
      category: 'Help'
    },
    {
      key: 'Escape',
      action: () => {
        // Close any open modals or clear search
        setShowHelp(false);
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput && searchInput.value) {
          searchInput.value = '';
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      },
      description: 'Close modal or clear search',
      category: 'Navigation'
    },
    {
      key: 'r',
      ctrlKey: true,
      action: () => {
        window.location.reload();
      },
      description: 'Refresh page',
      category: 'Actions'
    },
    {
      key: '1',
      altKey: true,
      action: () => {
        // Switch to all trips filter
        const allButton = document.querySelector('button:contains("All Trips")') as HTMLButtonElement;
        allButton?.click();
      },
      description: 'Show all trips',
      category: 'Filters'
    },
    {
      key: '2',
      altKey: true,
      action: () => {
        // Switch to upcoming trips filter
        const upcomingButton = document.querySelector('button:contains("Upcoming")') as HTMLButtonElement;
        upcomingButton?.click();
      },
      description: 'Show upcoming trips',
      category: 'Filters'
    },
    {
      key: '3',
      altKey: true,
      action: () => {
        // Switch to past trips filter
        const pastButton = document.querySelector('button:contains("Past")') as HTMLButtonElement;
        pastButton?.click();
      },
      description: 'Show past trips',
      category: 'Filters'
    }
  ];

  useKeyboardShortcuts(shortcuts);

  return {
    shortcuts,
    showHelp,
    setShowHelp
  };
}
