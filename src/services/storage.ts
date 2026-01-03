import { supabase } from '@/integrations/supabase/client';

/**
 * Upload a file to Supabase Storage
 */
export const uploadFile = async (
  bucket: string,
  file: File,
  path?: string
): Promise<string> => {
  const fileName = path || `${Date.now()}.${file.name.split('.').pop()}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file);

  if (error) throw error;

  return fileName;
};

/**
 * Get public URL for a file in Supabase Storage
 */
export const getPublicUrl = (bucket: string, path: string): string => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
};

/**
 * Delete a file from Supabase Storage
 */
export const deleteFile = async (bucket: string, path: string): Promise<void> => {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) throw error;
};

/**
 * Upload post media (image or video)
 */
export const uploadPostMedia = async (file: File): Promise<string> => {
  const fileName = await uploadFile('posts', file);
  return getPublicUrl('posts', fileName);
};

