import { useState, useCallback } from 'react';
import { createPost, uploadPostMedia } from '@/services/posts';
import type { CreatePostData, PostWithRelations } from '@/services/posts';

export const useCreatePost = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const create = useCallback(async (
    postData: CreatePostData,
    mediaFile?: File,
    mediaType?: 'image' | 'video'
  ): Promise<PostWithRelations> => {
    setIsSubmitting(true);
    setError(null);

    try {
      let mediaUrl: string | null = null;

      // Upload media file if provided
      if (mediaFile && mediaType) {
        mediaUrl = await uploadPostMedia(mediaFile);
      }

      // Create post with media URL
      const finalPostData: CreatePostData = {
        ...postData,
        image_url: mediaType === 'image' ? mediaUrl : postData.image_url,
        video_url: mediaType === 'video' ? mediaUrl : postData.video_url,
      };

      const newPost = await createPost(finalPostData);
      return newPost;
    } catch (err) {
      const createError = err instanceof Error ? err : new Error('Unknown error');
      setError(createError);
      console.error('Error creating post:', createError);
      throw createError;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    createPost: create,
    isSubmitting,
    error,
  };
};

