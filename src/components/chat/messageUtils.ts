import { formatDistanceToNow } from 'date-fns';

// Format the timestamp
export const formatTimestamp = (timestamp: string) => {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
};

// Get the user's initials for the avatar fallback
export const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();
};

// Check if message already exists to avoid duplicates
export const messageExists = (messages: any[], messageId: string): boolean => {
  return messages.some(msg => msg.id === messageId);
};
