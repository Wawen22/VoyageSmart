import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger';
import { MAX_FILE_SIZE, MAX_FILE_SIZE_LABEL } from './types';

// Validate file size
export const validateFileSize = (file: File): boolean => {
  if (file.size > MAX_FILE_SIZE) {
    toast({
      title: "File troppo grande",
      description: `Il file selezionato supera la dimensione massima consentita di ${MAX_FILE_SIZE_LABEL}.`,
      variant: "destructive",
    });
    return false;
  }
  return true;
};

// Upload file to Supabase storage
export const uploadFileToStorage = async (
  file: File,
  tripId: string,
  setUploadingFile?: (uploading: boolean) => void
): Promise<{ url: string; type: string } | null> => {
  try {
    // Verifica della dimensione del file (doppio controllo)
    if (!validateFileSize(file)) {
      return null;
    }

    setUploadingFile?.(true);

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
      logger.error('Error uploading chat file', { error: error.message, fileName: file.name, tripId });
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
    logger.error('Error in chat file upload', { error: error instanceof Error ? error.message : String(error), fileName: file.name, tripId });
    toast({
      title: 'Upload failed',
      description: 'An unexpected error occurred during file upload.',
      variant: 'destructive',
    });
    return null;
  } finally {
    setUploadingFile?.(false);
  }
};

// Handle file selection validation
export const handleFileSelection = (file: File): boolean => {
  return validateFileSize(file);
};
