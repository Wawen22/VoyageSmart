'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { ImageIcon, VideoIcon, UploadIcon, CalendarIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SimpleMediaUploaderProps {
  tripId: string;
  onUploadComplete?: () => void;
}

export default function SimpleMediaUploader({
  tripId,
  onUploadComplete,
}: SimpleMediaUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [mediaDate, setMediaDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);

      // Validate file types
      const validFiles = selectedFiles.filter(file =>
        file.type.startsWith('image/') || file.type.startsWith('video/')
      );

      if (validFiles.length !== selectedFiles.length) {
        toast({
          title: 'Unsupported files',
          description: 'Some selected files are not images or videos and have been ignored.',
          variant: 'destructive',
        });
      }

      setFiles(validFiles);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select at least one file to upload.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error('User not authenticated');
      }

      // Create a date object from the selected date
      // Set the time to the current time
      const now = new Date();
      const selectedDate = new Date(mediaDate);
      selectedDate.setHours(now.getHours());
      selectedDate.setMinutes(now.getMinutes());
      selectedDate.setSeconds(now.getSeconds());
      const createdAt = selectedDate.toISOString();

      // Upload each file
      for (const file of files) {
        // 1. Upload the file to storage
        const fileExt = file.name.split('.').pop();
        const timestamp = new Date().getTime();
        const randomId = Math.random().toString(36).substring(2, 15);
        const fileName = `${timestamp}_${randomId}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('trip-media')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          throw uploadError;
        }

        // 2. Get the public URL
        const { data: urlData } = supabase.storage
          .from('trip-media')
          .getPublicUrl(fileName);

        // 3. Create the media record in the database
        const mediaType = file.type.startsWith('image/') ? 'photo' : 'video';

        const { error: insertError } = await supabase
          .from('trip_media')
          .insert({
            trip_id: tripId,
            user_id: userData.user.id,
            type: mediaType,
            url: urlData.publicUrl,
            created_at: createdAt
          });

        if (insertError) {
          console.error('Error inserting media record:', insertError);
          throw insertError;
        }
      }

      toast({
        title: 'Upload complete',
        description: `${files.length} file(s) uploaded successfully.`,
      });

      // Reset form
      setFiles([]);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      console.error('Error uploading media:', error);
      toast({
        title: 'Upload error',
        description: 'An error occurred while uploading the files.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Upload Photos and Videos</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="media-files">Select files</Label>
          <div className="flex items-center gap-2">
            <Input
              ref={fileInputRef}
              id="media-files"
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileChange}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
            >
              <UploadIcon className="h-4 w-4 mr-2" />
              Browse
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Supported formats: JPG, PNG, GIF, MP4, MOV
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mediaDate" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Date
          </Label>
          <Input
            id="mediaDate"
            type="date"
            value={mediaDate}
            onChange={(e) => setMediaDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full"
          />
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <Label>Selected files ({files.length})</Label>
            <div className="max-h-32 overflow-y-auto space-y-1 p-2 border rounded-md bg-muted/50">
              {files.map((file, index) => (
                <div key={index} className="flex items-center text-sm">
                  {file.type.startsWith('image/') ? (
                    <ImageIcon className="h-4 w-4 mr-2 text-blue-500" />
                  ) : (
                    <VideoIcon className="h-4 w-4 mr-2 text-red-500" />
                  )}
                  <span className="truncate">{file.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
          className="w-full"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
      </div>
    </div>
  );
}
