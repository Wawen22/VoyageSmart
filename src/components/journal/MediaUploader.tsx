'use client';

import { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/store';
import { addJournalMedia } from '@/lib/features/journalSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { ImageIcon, VideoIcon, UploadIcon } from 'lucide-react';

interface MediaUploaderProps {
  tripId: string;
  dayId?: string;
  journalEntryId?: string;
  onUploadComplete?: () => void;
}

export default function MediaUploader({
  tripId,
  dayId,
  journalEntryId,
  onUploadComplete,
}: MediaUploaderProps) {
  const dispatch = useDispatch<AppDispatch>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      
      // Validate file types
      const validFiles = selectedFiles.filter(file => 
        file.type.startsWith('image/') || file.type.startsWith('video/')
      );
      
      if (validFiles.length !== selectedFiles.length) {
        toast({
          title: 'File non supportati',
          description: 'Alcuni file selezionati non sono immagini o video e sono stati ignorati.',
          variant: 'destructive',
        });
      }
      
      setFiles(validFiles);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: 'Nessun file selezionato',
        description: 'Seleziona almeno un file da caricare.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    
    try {
      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      // Upload each file
      const uploadPromises = files.map(file => 
        dispatch(addJournalMedia({
          file,
          tripId,
          dayId,
          journalEntryId,
          caption: caption || undefined,
          location: location || undefined,
          tags: tagsArray.length > 0 ? tagsArray : undefined,
        }))
      );
      
      await Promise.all(uploadPromises);
      
      toast({
        title: 'Upload completato',
        description: `${files.length} file caricati con successo.`,
      });
      
      // Reset form
      setFiles([]);
      setCaption('');
      setLocation('');
      setTags('');
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      console.error('Error uploading media:', error);
      toast({
        title: 'Errore di caricamento',
        description: 'Si è verificato un errore durante il caricamento dei file.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Carica foto e video</h3>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="media-files">Seleziona file</Label>
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
              Sfoglia
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Formati supportati: JPG, PNG, GIF, MP4, MOV
          </p>
        </div>
        
        {files.length > 0 && (
          <div className="space-y-2">
            <Label>File selezionati ({files.length})</Label>
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
        
        <div className="space-y-2">
          <Label htmlFor="caption">Didascalia (opzionale)</Label>
          <Input
            id="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Aggiungi una didascalia per tutti i file..."
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="location">Posizione (opzionale)</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Dove sono state scattate queste foto?"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="tags">Tag (opzionale)</Label>
          <Input
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Aggiungi tag separati da virgole (es. vacanza, mare, famiglia)"
          />
          <p className="text-xs text-muted-foreground">
            Separa i tag con virgole (es. vacanza, mare, famiglia)
          </p>
        </div>
        
        <Button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
          className="w-full"
        >
          {uploading ? 'Caricamento in corso...' : 'Carica'}
        </Button>
      </div>
    </div>
  );
}
