import { useState, useCallback } from 'react';
import { toggleLike, toggleSave, deletePost as deletePostService } from '@/services/posts';

export const usePostActions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleLike = useCallback(async (
    postId: string,
    userId: string,
    onSuccess?: (result: { is_liked: boolean; likes_count: number }) => void
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await toggleLike(postId, userId);
      onSuccess?.(result);
      return result;
    } catch (err) {
      const actionError = err instanceof Error ? err : new Error('Unknown error');
      setError(actionError);
      console.error('Error toggling like:', actionError);
      throw actionError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSave = useCallback(async (
    postId: string,
    userId: string,
    onSuccess?: (result: { is_saved: boolean }) => void
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await toggleSave(postId, userId);
      onSuccess?.(result);
      return result;
    } catch (err) {
      const actionError = err instanceof Error ? err : new Error('Unknown error');
      setError(actionError);
      console.error('Error toggling save:', actionError);
      throw actionError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDelete = useCallback(async (
    postId: string,
    userId: string,
    onSuccess?: () => void
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      await deletePostService(postId, userId);
      onSuccess?.();
    } catch (err) {
      const actionError = err instanceof Error ? err : new Error('Unknown error');
      setError(actionError);
      console.error('Error deleting post:', actionError);
      throw actionError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    toggleLike: handleLike,
    toggleSave: handleSave,
    deletePost: handleDelete,
    isLoading,
    error,
  };
};

