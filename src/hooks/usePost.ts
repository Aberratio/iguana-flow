import { useState, useEffect, useCallback } from 'react';
import { fetchPostById } from '@/services/posts';
import type { PostWithRelations } from '@/services/posts';

export const usePost = (postId: string | null, userId?: string) => {
  const [post, setPost] = useState<PostWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPost = useCallback(async () => {
    if (!postId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchPostById(postId, userId);
      setPost(data);
    } catch (err) {
      const fetchError = err instanceof Error ? err : new Error('Unknown error');
      setError(fetchError);
      console.error('Error fetching post:', fetchError);
    } finally {
      setIsLoading(false);
    }
  }, [postId, userId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  return {
    post,
    isLoading,
    error,
    refetch: fetchPost,
  };
};

