'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { SendIcon, PaperclipIcon, InfoIcon } from 'lucide-react';
import LoginPrompt from '@/components/auth/LoginPrompt';

interface ChatMessage {
  id: string;
  trip_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string | null;
  is_system_message: boolean;
  attachment_url: string | null;
  attachment_type: string | null;
  users: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface TripChatProps {
  tripId: string;
  tripName: string;
}

export default function TripChat({ tripId, tripName }: TripChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isParticipant, setIsParticipant] = useState(false);

  // Fetch messages and set up real-time subscription
  useEffect(() => {
    if (!user || !tripId) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);

        // Check if user is a participant
        const { data: participantData, error: participantError } = await supabase
          .from('trip_participants')
          .select('id, role')
          .eq('trip_id', tripId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (participantError) throw participantError;

        setIsParticipant(!!participantData);

        if (!participantData) {
          setLoading(false);
          return;
        }

        // Fetch all participants
        const { data: allParticipants, error: participantsError } = await supabase
          .from('trip_participants')
          .select(`
            id,
            role,
            users:user_id (
              id,
              full_name,
              avatar_url
            )
          `)
          .eq('trip_id', tripId);

        if (participantsError) throw participantsError;

        setParticipants(allParticipants || []);

        // Fetch messages
        const { data, error } = await supabase
          .from('trip_chat_messages')
          .select(`
            *,
            users:user_id (
              id,
              full_name,
              avatar_url
            )
          `)
          .eq('trip_id', tripId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        setMessages(data || []);

        // Update read receipt
        if (data && data.length > 0) {
          const lastMessageId = data[data.length - 1].id;

          await supabase
            .from('trip_chat_read_receipts')
            .upsert({
              trip_id: tripId,
              user_id: user.id,
              last_read_message_id: lastMessageId,
              last_read_at: new Date().toISOString()
            }, {
              onConflict: 'trip_id,user_id'
            });
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: 'Error',
          description: 'Failed to load chat messages. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Set up real-time subscription
    const subscription = supabase
      .channel(`trip-chat-${tripId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'trip_chat_messages',
        filter: `trip_id=eq.${tripId}`
      }, async (payload) => {
        // Check if we already have this message in our state (to avoid duplicates)
        const messageExists = messages.some(msg => msg.id === payload.new.id);
        if (messageExists) {
          console.log('Message already exists in state, skipping:', payload.new.id);
          return;
        }

        // Only fetch and add messages from other users (our own messages are added directly in handleSendMessage)
        if (payload.new.user_id !== user.id) {
          console.log('Received new message from another user:', payload.new.id);

          // Fetch the complete message with user data
          const { data, error } = await supabase
            .from('trip_chat_messages')
            .select(`
              *,
              users:user_id (
                id,
                full_name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (error) {
            console.error('Error fetching new message:', error);
            return;
          }

          // Add the message to our state
          setMessages(prev => [...prev, data]);

          // Update read receipt for messages from other users
          await supabase
            .from('trip_chat_read_receipts')
            .upsert({
              trip_id: tripId,
              user_id: user.id,
              last_read_message_id: data.id,
              last_read_at: new Date().toISOString()
            }, {
              onConflict: 'trip_id,user_id'
            });
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [tripId, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send a new message
  const handleSendMessage = async () => {
    if (!user || !newMessage.trim() || !isParticipant) return;

    try {
      setSending(true);
      const messageContent = newMessage.trim();
      setNewMessage(''); // Clear input immediately for better UX

      const { data, error } = await supabase
        .from('trip_chat_messages')
        .insert([
          {
            trip_id: tripId,
            user_id: user.id,
            content: messageContent,
            is_system_message: false,
          },
        ])
        .select(`
          *,
          users:user_id (
            id,
            full_name,
            avatar_url
          )
        `);

      if (error) throw error;

      // Add the new message to the local state immediately
      if (data && data.length > 0) {
        setMessages(prev => [...prev, data[0]]);

        // Update read receipt for the current user
        await supabase
          .from('trip_chat_read_receipts')
          .upsert({
            trip_id: tripId,
            user_id: user.id,
            last_read_message_id: data[0].id,
            last_read_at: new Date().toISOString()
          }, {
            onConflict: 'trip_id,user_id'
          });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  // Format the timestamp
  const formatTimestamp = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  // Get the user's initials for the avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  // Handle key press (Enter to send, Shift+Enter for new line)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-10 bg-muted animate-pulse rounded-md"></div>
        <div className="h-20 bg-muted animate-pulse rounded-md"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 text-center">
        <LoginPrompt message="You need to sign in to access the chat" />
      </div>
    );
  }

  if (!isParticipant) {
    return (
      <div className="p-4 text-center">
        <div className="bg-amber-100 dark:bg-amber-900/30 border-l-4 border-amber-500 p-4 text-amber-700 dark:text-amber-300 mb-4 text-left">
          <div className="flex items-start">
            <InfoIcon className="h-5 w-5 mr-2 mt-0.5" />
            <div>
              <p className="font-medium">You are not a participant in this trip</p>
              <p className="text-sm mt-1">You need to be a participant to access the chat.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="bg-card border-b p-3 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">{tripName} Chat</h2>
          <p className="text-xs text-muted-foreground">{participants.length} participants</p>
        </div>
        <div className="flex -space-x-2">
          {participants.slice(0, 3).map((participant) => (
            <Avatar key={participant.id} className="h-8 w-8 border-2 border-background">
              {participant.users.avatar_url ? (
                <AvatarImage src={participant.users.avatar_url} alt={participant.users.full_name} />
              ) : (
                <AvatarFallback>{getInitials(participant.users.full_name)}</AvatarFallback>
              )}
            </Avatar>
          ))}
          {participants.length > 3 && (
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
              +{participants.length - 3}
            </div>
          )}
        </div>
      </div>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.user_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[80%] ${message.user_id === user?.id ? 'flex-row-reverse' : 'flex-row'}`}>
                <Avatar className={`h-8 w-8 ${message.user_id === user?.id ? 'ml-2' : 'mr-2'}`}>
                  {message.users.avatar_url ? (
                    <AvatarImage src={message.users.avatar_url} alt={message.users.full_name} />
                  ) : (
                    <AvatarFallback>{getInitials(message.users.full_name)}</AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <div className={`flex items-center ${message.user_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-xs text-muted-foreground">
                      {message.user_id === user?.id ? 'You' : message.users.full_name}
                    </span>
                    <span className="text-xs text-muted-foreground mx-1">•</span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(message.created_at)}
                    </span>
                  </div>
                  <div
                    className={`mt-1 p-3 rounded-lg ${
                      message.user_id === user?.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.is_system_message ? (
                      <div className="italic text-sm">{message.content}</div>
                    ) : (
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    )}
                    {message.attachment_url && (
                      <div className="mt-2">
                        {message.attachment_type?.startsWith('image/') ? (
                          <img
                            src={message.attachment_url}
                            alt="Attachment"
                            className="max-w-full rounded-md max-h-48 object-contain"
                          />
                        ) : (
                          <a
                            href={message.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-xs underline"
                          >
                            <PaperclipIcon className="h-3 w-3 mr-1" />
                            Attachment
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="p-3 border-t">
        <div className="flex space-x-2">
          <Textarea
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            className="min-h-[80px] resize-none"
            disabled={!isParticipant}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending || !isParticipant}
            className="self-end"
          >
            {sending ? (
              <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
            ) : (
              <SendIcon className="h-4 w-4" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for a new line
        </p>
      </div>
    </div>
  );
}
