'use client';

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';
// Import icons from lucide-react
import {
  Send as SendIcon,
  Paperclip as PaperclipIcon,
  Info as InfoIcon,
  Image as ImageIcon,
  File as FileIcon,
  X as XIcon,
  FileText as FileTextIcon,
  FileImage as FileImageIcon,
  FileType as FilePdfIcon,
  Archive as FileArchiveIcon,
  Video as FileVideoIcon,
  Music as FileAudioIcon
} from 'lucide-react';
import LoginPrompt from '@/components/auth/LoginPrompt';
import { v4 as uuidv4 } from 'uuid';

// Costante per la dimensione massima del file (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const MAX_FILE_SIZE_LABEL = '5MB';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isParticipant, setIsParticipant] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

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
              users (
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

  // Handle file selection
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      // Verifica della dimensione del file
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File troppo grande",
          description: `La dimensione massima consentita è ${MAX_FILE_SIZE_LABEL}. Il file selezionato è ${(file.size / (1024 * 1024)).toFixed(2)}MB.`,
          variant: "destructive",
        });

        // Reset dell'input file
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      setSelectedFile(file);
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

  // Get file icon based on file type
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <FileImageIcon className="h-4 w-4" />;
    if (fileType.startsWith('video/')) return <FileVideoIcon className="h-4 w-4" />;
    if (fileType.startsWith('audio/')) return <FileAudioIcon className="h-4 w-4" />;
    if (fileType === 'application/pdf') return <FilePdfIcon className="h-4 w-4" />;
    if (fileType.includes('zip') || fileType.includes('compressed')) return <FileArchiveIcon className="h-4 w-4" />;
    if (fileType.includes('text') || fileType.includes('document')) return <FileTextIcon className="h-4 w-4" />;
    return <FileIcon className="h-4 w-4" />;
  };

  // Upload file to Supabase storage
  const uploadFileToStorage = async (file: File): Promise<{ url: string; type: string } | null> => {
    try {
      // Verifica della dimensione del file (doppio controllo)
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File troppo grande",
          description: `La dimensione massima consentita è ${MAX_FILE_SIZE_LABEL}.`,
          variant: "destructive",
        });
        return null;
      }

      setUploadingFile(true);

      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${tripId}/${fileName}`;

      // Upload to trip-media bucket (we'll use this for chat attachments too)
      const { data, error } = await supabase.storage
        .from('trip-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Error uploading file:', error);
        toast({
          title: 'Upload failed',
          description: 'Failed to upload file. Please try again.',
          variant: 'destructive',
        });
        return null;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('trip-media')
        .getPublicUrl(filePath);

      return {
        url: urlData.publicUrl,
        type: file.type,
      };
    } catch (error) {
      console.error('Error in file upload:', error);
      toast({
        title: 'Upload failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploadingFile(false);
    }
  };

  // Send a message with attachment
  const handleSendMessageWithAttachment = async () => {
    if (!user || !selectedFile || !isParticipant) return;

    try {
      setSending(true);

      // Upload the file first
      const uploadResult = await uploadFileToStorage(selectedFile);

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
      console.error('Error sending message with attachment:', error);
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
            <p className="text-muted-foreground">Nessun messaggio. Inizia la conversazione!</p>
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
                          <div className="relative">
                            <img
                              src={message.attachment_url}
                              alt="Attachment"
                              className="max-w-full rounded-md max-h-48 object-contain cursor-pointer"
                              onClick={() => window.open(message.attachment_url, '_blank')}
                            />
                            <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
                              Clicca per visualizzare
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

      {/* Message input */}
      <div className="p-3 border-t">
        {/* File preview if a file is selected */}
        {selectedFile && (
          <div className="mb-3 p-2 border rounded-md bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedFile.type.startsWith('image/') ? (
                  <div className="relative w-12 h-12 rounded-md overflow-hidden bg-background">
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-md bg-background flex items-center justify-center">
                    {getFileIcon(selectedFile.type)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                className="h-8 w-8 p-0"
              >
                <XIcon className="h-4 w-4" />
                <span className="sr-only">Remove file</span>
              </Button>
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          <div className="flex-1 flex flex-col">
            <Textarea
              placeholder="Scrivi un messaggio..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              className="min-h-[80px] resize-none"
              disabled={!isParticipant}
            />

            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-muted-foreground">
                Premi Invio per inviare, Shift+Invio per una nuova riga
              </p>

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip,application/x-zip-compressed"
              />

              <div className="flex items-center gap-2">
                {/* File size info */}
                <span className="text-xs text-muted-foreground">
                  Max: {MAX_FILE_SIZE_LABEL}
                </span>

                {/* Attachment button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenFileSelector}
                  disabled={!isParticipant || sending}
                  className="h-8 px-2"
                >
                  <PaperclipIcon className="h-4 w-4 mr-1" />
                  <span className="text-xs">Allega</span>
                </Button>
              </div>
            </div>
          </div>

          <Button
            onClick={selectedFile ? handleSendMessageWithAttachment : handleSendMessage}
            disabled={((!newMessage.trim() && !selectedFile) || sending || !isParticipant)}
            className="self-end"
          >
            {sending || uploadingFile ? (
              <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
            ) : (
              <SendIcon className="h-4 w-4" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
