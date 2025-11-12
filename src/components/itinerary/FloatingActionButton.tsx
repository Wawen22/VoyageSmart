import React from 'react';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

type FloatingActionButtonProps = {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
};

export default function FloatingActionButton({
  onClick,
  label = 'Add Activity',
  disabled = false
}: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="
        fixed bottom-6 right-6 z-50
        w-14 h-14 rounded-full
        glass-button-primary
        shadow-2xl shadow-blue-500/30
        hover:scale-110 active:scale-95
        transition-all duration-300
        group
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        md:hidden
      "
    >
      {/* Animated Background Pulse */}
      <div className="
        absolute inset-0 rounded-full
        bg-gradient-to-br from-blue-500 to-purple-500
        opacity-0 group-hover:opacity-20
        animate-pulse
        transition-opacity duration-300
      " />

      {/* Icon */}
      <PlusIcon className="
        relative z-10 h-6 w-6 mx-auto
        group-hover:rotate-90
        transition-transform duration-300
      " />

      {/* Ripple Effect on Hover */}
      <div className="
        absolute inset-0 rounded-full
        bg-blue-500/20
        scale-0 group-hover:scale-150
        opacity-0 group-hover:opacity-100
        transition-all duration-500
      " />
    </button>
  );
}
