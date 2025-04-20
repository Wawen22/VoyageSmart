'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

interface UnreadBadgeProps {
  tripId: string;
}

export default function UnreadBadge({ tripId }: UnreadBadgeProps) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !tripId) return;

    const fetchUnreadCount = async () => {
      try {
        setLoading(true);

        // Get the last read message ID for the current user
        const { data: readReceipt, error: readError } = await supabase
          .from('trip_chat_read_receipts')
          .select('last_read_message_id')
          .eq('trip_id', tripId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (readError) throw readError;

        // If there's no read receipt, count all messages as unread
        if (!readReceipt) {
          const { count, error: countError } = await supabase
            .from('trip_chat_messages')
            .select('id', { count: 'exact', head: true })
            .eq('trip_id', tripId)
            .neq('user_id', user.id); // Don't count user's own messages

          if (countError) throw countError;
          
          setUnreadCount(count || 0);
          return;
        }

        // Count messages newer than the last read message
        const { data: lastMessage, error: lastError } = await supabase
          .from('trip_chat_messages')
          .select('created_at')
          .eq('trip_id', tripId)
          .eq('id', readReceipt.last_read_message_id)
          .single();

        if (lastError && lastError.code !== 'PGRST116') throw lastError; // PGRST116 is "no rows returned"

        const lastReadTime = lastMessage ? new Date(lastMessage.created_at) : new Date(0);

        const { count, error: countError } = await supabase
          .from('trip_chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('trip_id', tripId)
          .neq('user_id', user.id) // Don't count user's own messages
          .gt('created_at', lastReadTime.toISOString());

        if (countError) throw countError;
        
        setUnreadCount(count || 0);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUnreadCount();

    // Set up real-time subscription for new messages
    const subscription = supabase
      .channel(`trip-chat-unread-${tripId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'trip_chat_messages',
        filter: `trip_id=eq.${tripId}`
      }, (payload) => {
        // Only increment count if the message is not from the current user
        if (payload.new.user_id !== user.id) {
          setUnreadCount(prev => prev + 1);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [tripId, user]);

  if (loading || unreadCount === 0) return null;

  return (
    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
}
