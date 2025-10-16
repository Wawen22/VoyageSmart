'use client';

import { Sparkles } from 'lucide-react';

interface MinimizedButtonProps {
  toggleMinimize: () => void;
  hasEverOpened: boolean;
  contextLoaded: boolean;
}

export default function MinimizedButton({
  toggleMinimize,
  hasEverOpened,
  contextLoaded
}: MinimizedButtonProps) {
  return (
    <button
      onClick={toggleMinimize}
      className="fixed sm:bottom-4 bottom-[90px] sm:right-4 right-2 bg-gradient-to-br from-purple-600 to-indigo-600 text-white p-3 sm:p-4 rounded-2xl shadow-2xl z-[48] flex items-center gap-2 sm:gap-3 hover:from-purple-500 hover:to-indigo-500 transition-all duration-300 ai-float backdrop-blur-xl border border-purple-500/20 ai-button-hover ai-chat-trigger"
      aria-label="Apri assistente AI"
      data-ai-tour="trigger"
    >
      <div className="relative">
        <Sparkles size={20} className="sm:w-[22px] sm:h-[22px] animate-pulse" />
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-400 rounded-full border-2 border-purple-600 animate-pulse"></div>
      </div>
      <span className="sm:inline hidden font-medium text-sm">
        {!hasEverOpened ? 'AI Assistant' : (contextLoaded ? 'AI Assistant' : 'AI Assistant (Loading...)')}
      </span>
    </button>
  );
}
