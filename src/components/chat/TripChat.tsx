'use client';

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import ImageModal from '@/components/ui/ImageModal';
// Import icons from lucide-react
import {
  Send as SendIcon,
  Paperclip as PaperclipIcon,
  Info as InfoIcon,
  Image as ImageIcon,
  File as FileIcon,
  X as XIcon,
  MessageCircle as MessageCircleIcon
} from 'lucide-react';
import LoginPrompt from '@/components/auth/LoginPrompt';
import { logger } from '@/lib/logger';
// Import extracted modules
import { ChatMessage, TripChatProps, MAX_FILE_SIZE, MAX_FILE_SIZE_LABEL } from './types';
import { validateFileSize, uploadFileToStorage, handleFileSelection } from './fileHandling';
import { formatTimestamp, getInitials, messageExists } from './messageUtils';
import { getFileIcon } from './FileIcon';



export default function TripChat({ tripId, tripName }: TripChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isParticipant, setIsParticipant] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null);

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
            users (
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
            users (
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
        logger.error('Error fetching chat messages', { error: error instanceof Error ? error.message : String(error), tripId });
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
        const msgExists = messageExists(messages, payload.new.id);
        if (msgExists) {
          logger.debug('Message already exists in state, skipping', { messageId: payload.new.id, tripId });
          return;
        }

        // Only fetch and add messages from other users (our own messages are added directly in handleSendMessage)
        if (payload.new.user_id !== user.id) {
          logger.debug('Received new message from another user', { messageId: payload.new.id, tripId });

          // Fetch the complete message with user data
          const { data, error } = await supabase
            .from('trip_chat_messages')
            .select(`
              *,
              users (
                id,
                full_name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (error) {
            logger.error('Error fetching new message', { error: error.message, messageId: payload.new.id, tripId });
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

    // If there's a file attached, use the attachment handler instead
    if (selectedFile) {
      return handleSendMessageWithAttachment();
    }

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
          users (
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
      logger.error('Error sending chat message', { error: error instanceof Error ? error.message : String(error), tripId });
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };



  // Handle file selection
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      // Use extracted validation function
      if (handleFileSelection(file)) {
        setSelectedFile(file);
      } else {
        // Reset dell'input file
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Open file selector
  const handleOpenFileSelector = () => {
    fileInputRef.current?.click();
  };





  // Send a message with attachment
  const handleSendMessageWithAttachment = async () => {
    if (!user || !selectedFile || !isParticipant) return;

    try {
      setSending(true);

      // Upload the file first
      const uploadResult = await uploadFileToStorage(selectedFile, tripId, setUploadingFile);

      if (!uploadResult) {
        throw new Error('File upload failed');
      }

      // Prepare message content
      const messageContent = newMessage.trim() || `Shared a file: ${selectedFile.name}`;

      // Clear input immediately for better UX
      setNewMessage('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Insert the message with attachment
      const { data, error } = await supabase
        .from('trip_chat_messages')
        .insert([
          {
            trip_id: tripId,
            user_id: user.id,
            content: messageContent,
            is_system_message: false,
            attachment_url: uploadResult.url,
            attachment_type: uploadResult.type,
          },
        ])
        .select(`
          *,
          users (
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
      logger.error('Error sending message with attachment', { error: error instanceof Error ? error.message : String(error), tripId });
      toast({
        title: 'Error',
        description: 'Failed to send message with attachment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  // Handle key press (Enter to send, Shift+Enter for new line)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (selectedFile) {
        handleSendMessageWithAttachment();
      } else {
        handleSendMessage();
      }
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
    <div className="flex flex-col h-full chat-mobile">
      {/* Chat header - Modernized */}
      <div className="relative p-4 border-b border-white/10 bg-gradient-to-r from-violet-500/5 to-pink-500/5 backdrop-blur-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 backdrop-blur-sm border border-white/20">
              <MessageCircleIcon className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{tripName}</h2>
              <p className="text-sm text-muted-foreground">{participants.length} participants online</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Participants Avatars */}
            <div className="flex -space-x-2">
              {participants.slice(0, 3).map((participant, index) => (
                <div
                  key={participant.id}
                  className="relative group"
                  style={{ zIndex: 10 - index }}
                >
                  <Avatar className="h-9 w-9 border-2 border-white/20 backdrop-blur-sm transition-all duration-300 group-hover:scale-110">
                    {participant.users.avatar_url ? (
                      <AvatarImage src={participant.users.avatar_url} alt={participant.users.full_name} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-violet-500/20 to-pink-500/20 text-violet-600 font-medium">
                        {getInitials(participant.users.full_name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white/20"></div>
                </div>
              ))}
              {participants.length > 3 && (
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500/20 to-pink-500/20 backdrop-blur-sm flex items-center justify-center text-xs font-medium border-2 border-white/20 text-violet-600">
                  +{participants.length - 3}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages container - Modernized */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-transparent to-violet-500/5">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 backdrop-blur-sm border border-white/20 mb-6">
              <MessageCircleIcon className="h-12 w-12 text-violet-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No messages yet</h3>
            <p className="text-muted-foreground max-w-md">
              Start the conversation! Share your thoughts, plans, or just say hello to your travel companions.
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.user_id === user?.id ? 'justify-end' : 'justify-start'} animate-glass-slide-up`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`flex max-w-[80%] ${message.user_id === user?.id ? 'flex-row-reverse' : 'flex-row'} group`}>
                <div className="relative">
                  <Avatar className={`h-9 w-9 ${message.user_id === user?.id ? 'ml-3' : 'mr-3'} border-2 border-white/20 backdrop-blur-sm transition-all duration-300 group-hover:scale-110`}>
                    {message.users.avatar_url ? (
                      <AvatarImage src={message.users.avatar_url} alt={message.users.full_name} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-violet-500/20 to-pink-500/20 text-violet-600 font-medium">
                        {getInitials(message.users.full_name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white/20"></div>
                </div>

                <div className="flex flex-col">
                  <div className={`flex items-center mb-1 ${message.user_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-xs font-medium text-muted-foreground">
                      {message.user_id === user?.id ? 'You' : message.users.full_name}
                    </span>
                    <span className="text-xs text-muted-foreground mx-1">•</span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(message.created_at)}
                    </span>
                  </div>

                  <div
                    className={`relative p-3 rounded-2xl backdrop-blur-sm border transition-all duration-300 group-hover:scale-[1.02] ${
                      message.user_id === user?.id
                        ? 'bg-gradient-to-br from-violet-500/20 to-pink-500/20 border-violet-500/30 text-foreground'
                        : 'bg-background/50 border-white/20 text-foreground'
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
                          <div
                            className="relative group cursor-pointer"
                            onClick={() => {
                              setSelectedImage({
                                url: message.attachment_url,
                                alt: `Image shared by ${message.users.full_name}`
                              });
                            }}
                          >
                            <img
                              src={message.attachment_url}
                              alt="Attachment"
                              className="max-w-full rounded-xl max-h-48 object-contain transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                              <div className="glass-card px-3 py-1.5 rounded-lg">
                                <span className="text-white text-sm font-medium">Click to view</span>
                              </div>
                            </div>
                            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                              🔍 Click to enlarge
                            </div>
                          </div>
                        ) : message.attachment_type?.startsWith('video/') ? (
                          <div className="mt-2">
                            <video
                              controls
                              className="max-w-full rounded-md max-h-48"
                              preload="metadata"
                            >
                              <source src={message.attachment_url} type={message.attachment_type} />
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        ) : (
                          <a
                            href={message.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 bg-background/50 rounded-md border text-sm hover:bg-background/80 transition-colors"
                          >
                            {getFileIcon(message.attachment_type || '')}
                            <span className="flex-1 truncate">
                              {message.attachment_url.split('/').pop()?.split('-').pop() || 'Attachment'}
                            </span>
                            <FileIcon className="h-3 w-3 opacity-50" />
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

      {/* Message input - Modernized */}
      <div className="p-4 border-t border-white/10 bg-gradient-to-r from-violet-500/5 to-pink-500/5 backdrop-blur-sm">
        {/* File preview if a file is selected */}
        {selectedFile && (
          <div className="mb-4 p-3 rounded-xl bg-background/50 backdrop-blur-sm border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedFile.type.startsWith('image/') ? (
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-background border border-white/20">
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                    {getFileIcon(selectedFile.type)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-foreground">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={handleRemoveFile}
                className="h-8 w-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 flex items-center justify-center transition-all duration-300 hover:scale-105"
              >
                <XIcon className="h-4 w-4 text-red-500" />
                <span className="sr-only">Remove file</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <div className="flex-1">
            <div className="relative">
              <Textarea
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                className="min-h-[60px] resize-none glass-button border-white/20 bg-background/50 backdrop-blur-sm rounded-xl pr-12 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50"
                disabled={!isParticipant}
              />

              {/* Attachment button inside textarea */}
              <button
                type="button"
                onClick={handleOpenFileSelector}
                disabled={!isParticipant || sending}
                className="absolute right-2 bottom-2 p-2 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 transition-all duration-300 hover:scale-105 disabled:opacity-50"
              >
                <PaperclipIcon className="h-4 w-4 text-violet-500" />
              </button>
            </div>

            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-muted-foreground">
                Press Enter to send, Shift+Enter for new line
              </p>
              <span className="text-xs text-muted-foreground">
                Max: {MAX_FILE_SIZE_LABEL}
              </span>
            </div>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip,application/x-zip-compressed"
            />
          </div>

          {/* Send button - Aligned with textarea height */}
          <button
            onClick={selectedFile ? handleSendMessageWithAttachment : handleSendMessage}
            disabled={((!newMessage.trim() && !selectedFile) || sending || !isParticipant)}
            className="relative overflow-hidden h-[60px] w-[60px] rounded-xl font-medium transition-all duration-300 hover:scale-105 flex items-center justify-center group shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed self-start"
          >
            {/* Glassy Background - Violet Theme */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-violet-400/15 to-pink-500/20 backdrop-blur-sm border border-violet-500/30 rounded-xl"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>

            {/* Content */}
            <div className="relative z-10">
              {sending || uploadingFile ? (
                <div className="h-5 w-5 border-2 border-t-transparent border-violet-500 rounded-full animate-spin" />
              ) : (
                <SendIcon className="h-5 w-5 text-violet-600 group-hover:text-violet-500 transition-colors" />
              )}
            </div>
            <span className="sr-only">Send</span>
          </button>
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        imageUrl={selectedImage?.url || ''}
        imageAlt={selectedImage?.alt || 'Chat Image'}
      />
    </div>
  );
}
