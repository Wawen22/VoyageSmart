import {
  FileText as FileTextIcon,
  FileImage as FileImageIcon,
  FileType as FilePdfIcon,
  Archive as FileArchiveIcon,
  Video as FileVideoIcon,
  Music as FileAudioIcon,
  File as FileIcon
} from 'lucide-react';

// Get file icon based on file type
export const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return <FileImageIcon className="h-4 w-4" />;
  if (fileType.startsWith('video/')) return <FileVideoIcon className="h-4 w-4" />;
  if (fileType.startsWith('audio/')) return <FileAudioIcon className="h-4 w-4" />;
  if (fileType === 'application/pdf') return <FilePdfIcon className="h-4 w-4" />;
  if (fileType.includes('zip') || fileType.includes('compressed')) return <FileArchiveIcon className="h-4 w-4" />;
  if (fileType.includes('text') || fileType.includes('document')) return <FileTextIcon className="h-4 w-4" />;
  return <FileIcon className="h-4 w-4" />;
};
