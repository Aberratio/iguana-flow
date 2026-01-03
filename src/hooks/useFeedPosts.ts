import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { fetchPosts as fetchPostsService, toggleLike as toggleLikeService, toggleSave as toggleSaveService, deletePost as deletePostService } from '@/services/posts';
import type { PostWithRelations } from '@/services/posts';

// Use PostWithRelations as FeedPost type
export type FeedPost = PostWithRelations;

export const useFeedPosts = () => {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const { user } = useAuth();
  const POSTS_PER_PAGE = 10;

  // Fetch posts from current user and friends/followers
  const fetchPosts = useCallback(async (isLoadMore = false) => {
    if (!user) return;

    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setOffset(0);
        setHasMore(true);
      }

      // Get user's friends (accepted friendships)
      const { data: friendships } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      // Get user's follows
      const { data: follows } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      // Extract friend IDs (people who are actual friends)
      const friendIds: string[] = [];
      friendships?.forEach(friendship => {
        if (friendship.requester_id === user.id) {
          friendIds.push(friendship.addressee_id);
        } else {
          friendIds.push(friendship.requester_id);
        }
      });

      // Extract follow IDs (people user follows but aren't friends with)
      const followIds: string[] = [];
      follows?.forEach(follow => {
        if (!friendIds.includes(follow.following_id)) {
          followIds.push(follow.following_id);
        }
      });

      // Fetch posts using service
      const currentOffset = isLoadMore ? offset : 0;
      const postsWithCounts = await fetchPostsService({
        userId: user.id,
        friendIds,
        followIds,
        offset: currentOffset,
        limit: POSTS_PER_PAGE,
      });

      if (isLoadMore) {
        setPosts(prevPosts => [...prevPosts, ...postsWithCounts]);
        setOffset(prev => prev + POSTS_PER_PAGE);
      } else {
        setPosts(postsWithCounts);
        setOffset(POSTS_PER_PAGE);
      }
      
      // Check if there are more posts to load
      setHasMore(postsWithCounts.length === POSTS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching feed posts:', error);
    } finally {
      if (isLoadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [user, offset]);

  // Toggle like on a post
  const toggleLike = useCallback(async (postId: string) => {
    if (!user) return;

    try {
      const result = await toggleLikeService(postId, user.id);
      
      setPosts(prevPosts =>
        prevPosts.map(p =>
          p.id === postId
            ? { ...p, is_liked: result.is_liked, likes_count: result.likes_count }
            : p
        )
      );
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  }, [user]);

  // Add new post to the feed
  const addPost = (newPost: FeedPost) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  // Toggle save on a post
  const toggleSave = useCallback(async (postId: string) => {
    if (!user) return;

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      // Don't allow saving own posts
      if (post.user_id === user.id) return;

      const result = await toggleSaveService(postId, user.id);
      
      setPosts(prevPosts =>
        prevPosts.map(p =>
          p.id === postId
            ? { ...p, is_saved: result.is_saved }
            : p
        )
      );
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  }, [user, posts]);

  // Delete a post
  const deletePost = useCallback(async (postId: string) => {
    if (!user) return false;

    try {
      await deletePostService(postId, user.id);

      // Remove post from local state
      setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      return false;
    }
  }, [user]);

  // Update a post in the feed
  const updatePost = (updatedPost: FeedPost) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === updatedPost.id ? updatedPost : post
      )
    );
  };

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const loadMorePosts = () => {
    fetchPosts(true);
  };

  return {
    posts,
    loading,
    loadingMore,
    hasMore,
    fetchPosts,
    loadMorePosts,
    toggleLike,
    toggleSave,
    addPost,
    updatePost,
    deletePost,
  };
};