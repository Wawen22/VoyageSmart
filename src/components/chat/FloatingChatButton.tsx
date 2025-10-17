'use client';

import Link from 'next/link';
import { MessageCircleIcon } from 'lucide-react';
import UnreadBadge from '@/components/chat/UnreadBadge';
import { cn } from '@/lib/utils';

interface FloatingChatButtonProps {
  tripId: string;
  className?: string;
}

export default function FloatingChatButton({ tripId, className }: FloatingChatButtonProps) {
  return (
    <Link href={`/trips/${tripId}/chat`}>
      <div className={cn("fixed z-50 bg-gradient-to-r from-violet-500 to-pink-500 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 ai-button-hover ai-float", className)}>
        <MessageCircleIcon className="h-6 w-6 animate-pulse" />
        <div className="absolute -top-1 -right-1">
          <UnreadBadge tripId={tripId} />
        </div>
        <div className="absolute -top-1 -left-1 w-3 h-3 bg-green-400 rounded-full border-2 border-violet-500 animate-pulse online-indicator"></div>
      </div>
    </Link>
  );
}
