import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { TableRow, TableInsert, TableUpdate } from './types';
import { throwIfError } from './utils';
import { uploadPostMedia } from './storage';

/**
 * Type definitions for posts
 */

type PostRow = TableRow<'posts'>;
type PostInsert = TableInsert<'posts'>;
type PostUpdate = TableUpdate<'posts'>;

type ProfileRow = TableRow<'profiles'>;
type FigureRow = TableRow<'figures'>;

/**
 * Post with user and figure relations
 */
export interface PostWithRelations extends PostRow {
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
    role: string;
  };
  figure?: {
    id: string;
    name: string;
  } | null;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  is_saved: boolean;
}

/**
 * Post creation data
 */
export interface CreatePostData {
  user_id: string;
  content: string;
  privacy: string;
  image_url?: string | null;
  video_url?: string | null;
  figure_id?: string | null;
}

/**
 * Post update data
 */
export interface UpdatePostData extends Partial<PostUpdate> {
  content?: string;
  privacy?: string;
  image_url?: string | null;
  video_url?: string | null;
  figure_id?: string | null;
}

/**
 * Feed filters
 */
export interface FeedFilters {
  userId?: string;
  friendIds?: string[];
  followIds?: string[];
  offset?: number;
  limit?: number;
}

/**
 * Fetch a single post by ID with relations
 */
export const fetchPostById = async (
  postId: string,
  userId?: string
): Promise<PostWithRelations> => {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      user:profiles!posts_user_id_fkey (
        id,
        username,
        avatar_url,
        role
      ),
      figure:figures (
        id,
        name
      )
    `)
    .eq('id', postId)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Post not found');

  // Fetch likes count
  const { data: likesData } = await supabase
    .from('post_likes')
    .select('user_id')
    .eq('post_id', postId);

  // Fetch comments count
  const { count: commentsCount } = await supabase
    .from('post_comments')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);

  // Fetch saved status if userId provided
  let isSaved = false;
  if (userId) {
    const { data: savedData } = await supabase
      .from('saved_posts')
      .select('user_id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();
    isSaved = !!savedData;
  }

  // Map to application type
  return {
    ...data,
    user: data.user as ProfileRow & { role: string },
    figure: data.figure as FigureRow | null,
    likes_count: likesData?.length || 0,
    comments_count: commentsCount || 0,
    is_liked: likesData?.some(like => like.user_id === userId) || false,
    is_saved,
  } as PostWithRelations;
};

/**
 * Fetch posts for feed with filters
 */
export const fetchPosts = async (
  filters: FeedFilters
): Promise<PostWithRelations[]> => {
  const { userId, friendIds = [], followIds = [], offset = 0, limit = 10 } = filters;

  // Build query conditions
  const conditions: string[] = [];
  
  if (userId) {
    conditions.push(`user_id.eq.${userId}`);
  }

  // Add friends' posts (both public and friends-only)
  if (friendIds.length > 0) {
    friendIds.forEach(friendId => {
      conditions.push(`and(user_id.eq.${friendId},privacy.in.(public,friends))`);
    });
  }

  // Add followed users' public posts only
  if (followIds.length > 0) {
    followIds.forEach(followId => {
      conditions.push(`and(user_id.eq.${followId},privacy.eq.public)`);
    });
  }

  if (conditions.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('posts')
    .select(`
      id,
      content,
      image_url,
      video_url,
      created_at,
      user_id,
      privacy,
      figure_id,
      updated_at,
      figures (
        id,
        name
      ),
      profiles!posts_user_id_fkey (
        id,
        username,
        avatar_url,
        role
      )
    `)
    .or(conditions.join(','))
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  if (!data) return [];

  // Get likes and comments counts for each post
  const postsWithCounts = await Promise.all(
    data.map(async (post) => {
      // Get likes count
      const { count: likesCount } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);

      // Get comments count
      const { count: commentsCount } = await supabase
        .from('post_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);

      // Check if current user liked this post
      let isLiked = false;
      if (userId) {
        const { data: userLike } = await supabase
          .from('post_likes')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', userId)
          .maybeSingle();
        isLiked = !!userLike;
      }

      // Check if current user saved this post
      let isSaved = false;
      if (userId) {
        const { data: userSaved } = await supabase
          .from('saved_posts')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', userId)
          .maybeSingle();
        isSaved = !!userSaved;
      }

      return {
        ...post,
        user: post.profiles as ProfileRow & { role: string },
        figure: post.figures ? (post.figures as FigureRow) : null,
        likes_count: likesCount || 0,
        comments_count: commentsCount || 0,
        is_liked: isLiked,
        is_saved: isSaved,
      } as PostWithRelations;
    })
  );

  return postsWithCounts;
};

/**
 * Create a new post
 */
export const createPost = async (
  postData: CreatePostData
): Promise<PostWithRelations> => {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: postData.user_id,
      content: postData.content,
      privacy: postData.privacy,
      image_url: postData.image_url || null,
      video_url: postData.video_url || null,
      figure_id: postData.figure_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select(`
      *,
      profiles!posts_user_id_fkey (
        id,
        username,
        avatar_url,
        role
      ),
      figures (
        id,
        name
      )
    `)
    .single();

  throwIfError(data, error);

  return {
    ...data,
    user: data.profiles as ProfileRow & { role: string },
    figure: data.figures ? (data.figures as FigureRow) : null,
    likes_count: 0,
    comments_count: 0,
    is_liked: false,
    is_saved: false,
  } as PostWithRelations;
};

/**
 * Update a post
 */
export const updatePost = async (
  postId: string,
  postData: UpdatePostData
): Promise<PostWithRelations> => {
  const updateData: PostUpdate = {
    ...postData,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('posts')
    .update(updateData)
    .eq('id', postId)
    .select(`
      *,
      profiles!posts_user_id_fkey (
        id,
        username,
        avatar_url,
        role
      ),
      figures (
        id,
        name
      )
    `)
    .single();

  throwIfError(data, error);

  // Fetch likes and comments counts
  const { count: likesCount } = await supabase
    .from('post_likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);

  const { count: commentsCount } = await supabase
    .from('post_comments')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);

  return {
    ...data,
    user: data.profiles as ProfileRow & { role: string },
    figure: data.figures ? (data.figures as FigureRow) : null,
    likes_count: likesCount || 0,
    comments_count: commentsCount || 0,
    is_liked: false,
    is_saved: false,
  } as PostWithRelations;
};

/**
 * Delete a post
 */
export const deletePost = async (postId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', userId); // Ensure user can only delete their own posts

  if (error) throw error;
};

/**
 * Toggle like on a post
 */
export const toggleLike = async (
  postId: string,
  userId: string
): Promise<{ is_liked: boolean; likes_count: number }> => {
  // Check if already liked
  const { data: existingLike } = await supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingLike) {
    // Remove like
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (error) throw error;

    // Get updated likes count
    const { count } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    return {
      is_liked: false,
      likes_count: count || 0,
    };
  } else {
    // Add like
    const { error } = await supabase
      .from('post_likes')
      .insert({ post_id: postId, user_id: userId });

    if (error) throw error;

    // Get updated likes count
    const { count } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    return {
      is_liked: true,
      likes_count: count || 0,
    };
  }
};

/**
 * Toggle save on a post
 */
export const toggleSave = async (
  postId: string,
  userId: string
): Promise<{ is_saved: boolean }> => {
  // Check if already saved
  const { data: existingSave } = await supabase
    .from('saved_posts')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingSave) {
    // Remove save
    const { error } = await supabase
      .from('saved_posts')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (error) throw error;

    return { is_saved: false };
  } else {
    // Add save
    const { error } = await supabase
      .from('saved_posts')
      .insert({ post_id: postId, user_id: userId });

    if (error) throw error;

    return { is_saved: true };
  }
};

/**
 * Check if post is liked by user
 */
export const checkIfLiked = async (
  postId: string,
  userId: string
): Promise<boolean> => {
  const { data } = await supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  return !!data;
};

/**
 * Check if post is saved by user
 */
export const checkIfSaved = async (
  postId: string,
  userId: string
): Promise<boolean> => {
  const { data } = await supabase
    .from('saved_posts')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  return !!data;
};

/**
 * Upload post media (re-export from storage for convenience)
 */
export { uploadPostMedia } from './storage';

