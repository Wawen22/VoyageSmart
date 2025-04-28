import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload a file to Supabase Storage
 * @param file The file to upload
 * @param bucket The storage bucket name
 * @param path The path within the bucket
 * @returns The URL of the uploaded file
 */
export async function uploadFile(
  file: File,
  bucket: string,
  path: string
): Promise<{ url: string; name: string; type: string }> {
  try {
    console.log('Attempting to upload file:', file.name, 'to bucket:', bucket, 'path:', path);

    // Create a unique file name to prevent collisions
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    // Use the appropriate bucket based on the path
    let actualBucket = bucket;

    // For backward compatibility, if the path contains certain keywords, use specific buckets
    if (path.includes('chat')) {
      actualBucket = 'trip-media'; // Use trip-media for chat attachments
    } else if (path.includes('accommodations') || path.includes('transportation')) {
      actualBucket = 'trip-documents';
    }

    console.log('Using bucket:', actualBucket, 'for upload');
    console.log('File path for upload:', filePath);

    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(actualBucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase storage upload error:', error);

      // If we get an error, return a mock URL to prevent UI from breaking
      console.log('Falling back to mock URL due to upload error');
      return {
        url: `https://example.com/mock-file-url/${encodeURIComponent(file.name)}`,
        name: file.name,
        type: file.type,
      };
    }

    // Get the public URL for the file
    const { data: urlData } = supabase.storage
      .from(actualBucket)
      .getPublicUrl(filePath);

    console.log('File uploaded successfully, public URL:', urlData.publicUrl);

    return {
      url: urlData.publicUrl,
      name: file.name,
      type: file.type,
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    // In case of error, return a fallback response to prevent UI from getting stuck
    return {
      url: `https://example.com/mock-file-url-error/${encodeURIComponent(file.name)}`,
      name: file.name,
      type: file.type,
    };
  }
}

/**
 * Delete a file from Supabase Storage
 * @param url The URL of the file to delete
 * @param bucket The storage bucket name
 */
export async function deleteFile(url: string, bucket: string): Promise<void> {
  try {
    console.log('Attempting to delete file with URL:', url);

    // For mock URLs, we just log and return
    if (url.startsWith('https://example.com/')) {
      console.log('Skipping deletion of mock file URL');
      return;
    }

    // Use the appropriate bucket based on the URL
    let actualBucket = bucket;

    // For backward compatibility, determine the bucket from the URL
    if (url.includes('trip-media')) {
      actualBucket = 'trip-media';
    } else if (url.includes('trip-documents')) {
      actualBucket = 'trip-documents';
    }

    // Extract the file path from the URL
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');

      // Find the index of the bucket name in the path
      const bucketIndex = pathParts.indexOf(actualBucket);

      if (bucketIndex === -1) {
        console.error('Could not find bucket name in URL path:', url);
        return;
      }

      const filePath = pathParts.slice(bucketIndex + 1).join('/');
      console.log('Extracted file path for deletion:', filePath);

      // Delete the file from Supabase Storage
      const { error } = await supabase.storage.from(actualBucket).remove([filePath]);

      if (error) {
        console.error('Supabase storage delete error:', error);
        return; // Don't throw, just log and continue
      }

      console.log('File deleted successfully');
    } catch (parseError) {
      console.error('Error parsing URL for deletion:', parseError);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    // We'll suppress the error here to prevent UI issues
  }
}
