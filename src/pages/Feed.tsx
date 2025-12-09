import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Plus, Loader2, MoreHorizontal, Edit, Trash2, Globe, Users, Lock, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PostPreviewModal } from '@/components/PostPreviewModal';
import { CreatePostModal } from '@/components/CreatePostModal';
import { EditPostModal } from '@/components/EditPostModal';
import { ConfirmDeletePostModal } from '@/components/ConfirmDeletePostModal';
import { SharePostModal } from '@/components/SharePostModal';
import { Link, useNavigate } from 'react-router-dom';
import { useFeedTabs } from '@/hooks/useFeedTabs';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { formatDistanceToNow } from 'date-fns';
import { PricingModal } from '@/components/PricingModal';
import { MediaContainer } from '@/components/MediaContainer';
import SEO from '@/components/SEO';

const Feed = () => {
  const navigate = useNavigate();
  const [selectedPost, setSelectedPost] = useState(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [deletingPost, setDeletingPost] = useState(null);
  const [sharingPost, setSharingPost] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const {
    posts,
    loading,
    loadingMore,
    hasMore,
    activeTab,
    switchTab,
    loadMorePosts,
    toggleLike,
    toggleSave,
    addPost,
    updatePost,
    deletePost
  } = useFeedTabs();
  const {
    user
  } = useAuth();
  const { hasPremiumAccess } = useSubscriptionStatus();

  const handlePostCreated = (newPost: any) => {
    // Convert the new post to match our FeedPost interface
    const feedPost = {
      id: newPost.id,
      content: newPost.content,
      image_url: newPost.image_url,
      video_url: newPost.video_url,
      created_at: newPost.created_at,
      user_id: newPost.user_id,
      privacy: newPost.privacy || 'public',
      user: {
        id: user?.id || '',
        username: user?.username || '',
        avatar_url: user?.avatar_url || null,
        role: user?.role || 'free'
      },
      likes_count: 0,
      comments_count: 0,
      is_liked: false,
      is_saved: false
    };
    addPost(feedPost);
  };
  const handleDeletePost = async () => {
    if (!deletingPost) return;
    setDeleteLoading(true);
    const success = await deletePost(deletingPost.id);
    setDeleteLoading(false);
    if (success) {
      setDeletingPost(null);
    }
  };
  const handleShare = (post: any) => {
    setSharingPost(post);
  };

  const handleExerciseClick = (figureId: string) => {
    if (hasPremiumAccess) {
      navigate(`/exercise/${figureId}`);
    } else {
      setShowPricingModal(true);
    }
  };

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case 'friends':
        return <Users className="w-3 h-3 text-blue-400" />;
      case 'private':
        return <Lock className="w-3 h-3 text-red-400" />;
      default:
        return <Globe className="w-3 h-3 text-green-400" />;
    }
  };
  if (loading) {
    return <div className="min-h-screen p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }
  return <>
      <SEO
        title="Aktualności"
        description="Zobacz co słychać w społeczności aerial! Inspiruj się postępami innych, dziel się swoimi osiągnięciami i bądź na bieżąco."
        url="https://iguanaflow.app/feed"
        noIndex={true}
      />
      <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Twój Feed</h1>
              <p className="text-muted-foreground">Zobacz co słychać u innych akrobatów powietrznych</p>
            </div>
          </div>
        </div>

        {/* Create Post Section */}
        <Card className="glass-effect border-white/10 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 w-full">
              <Avatar className="flex-shrink-0">
                <AvatarImage src={user?.avatar_url || undefined} />
                <AvatarFallback>{user?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <Button onClick={() => setShowCreatePost(true)} variant="ghost" className="flex-1 min-w-0 justify-start text-muted-foreground hover:text-white bg-white/5 hover:bg-white/10 h-12 text-sm sm:text-base">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                <span className="truncate">Co u Ciebie słychać?</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Feed Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => switchTab(value as 'my_feed' | 'public_feed')} className="w-full mb-6">
          <TabsList className="grid w-full grid-cols-2 bg-white/5 rounded-lg p-1">
            <TabsTrigger value="my_feed" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:via-pink-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-white">
              Mój Feed
            </TabsTrigger>
            <TabsTrigger value="public_feed" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:via-pink-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-white">
              Publiczny Feed
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-6">
            {posts.length === 0 ? (
              <Card className="glass-effect border-white/10">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    {activeTab === 'my_feed' 
                      ? 'Brak postów od znajomych i obserwowanych użytkowników. Spróbuj publicznego feed\'a!'
                      : 'Brak publicznych postów w tym momencie.'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              posts.map(post => (
                <Card key={post.id} className="glass-effect border-white/10 mb-6">
                  <CardContent className="p-6">
                {/* User Header */}
                <div className="flex items-center space-x-3 mb-4">
                  <Link to={`/profile/${post.user.id}`} className="cursor-pointer">
                    <Avatar className={`w-10 h-10 hover:scale-110 transition-transform ${post.user.role === 'trainer' ? 'ring-2 ring-gradient-to-r from-yellow-400 to-orange-500 ring-offset-2 ring-offset-black' : ''}`}>
                      <AvatarImage src={post.user.avatar_url || undefined} />
                      <AvatarFallback>{post.user.username[0]?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1">
                  <div className="flex items-center justify-between flex-1">
                    <div className="flex items-center space-x-2">
                      <Link to={`/profile/${post.user.id}`} className="cursor-pointer hover:text-primary transition-colors">
                        <span className="font-semibold text-white">{post.user.username}</span>
                      </Link>
                      {post.user_id === user?.id && (
                        <div className="flex items-center">
                          {getPrivacyIcon(post.privacy)}
                        </div>
                      )}
                    </div>
                    {post.user_id === user?.id && <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background/95 border-white/10">
                          <DropdownMenuItem onClick={() => setEditingPost(post)} className="text-white hover:bg-white/10">
                            <Edit className="w-4 h-4 mr-2" />
                            Edytuj post
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeletingPost(post)} className="text-red-400 hover:bg-red-400/10 hover:text-red-300">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Usuń post
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>}
                  </div>
                    <span className="text-muted-foreground text-sm">
                      {post.created_at && !isNaN(new Date(post.created_at).getTime()) ? formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true
                }) : 'Recently'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <p className="text-white mb-4">{post.content}</p>

                {/* Figure Info */}
                {post.figure && (
                  <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                       onClick={() => handleExerciseClick(post.figure.id)}>
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-purple-400 font-medium">Ćwiczenie:</span>
                      <span className="text-sm text-white underline hover:text-purple-300">{post.figure.name}</span>
                    </div>
                  </div>
                )}

                {/* Media */}
                {post.image_url ? (
                  <MediaContainer imageUrl={post.image_url} onClick={() => navigate(`/post/${post.id}`)} />
                ) : post.video_url ? (
                  <div className="mb-4 rounded-lg overflow-hidden cursor-pointer" onClick={() => navigate(`/post/${post.id}`)}>
                    <video src={post.video_url} className="w-full h-80 object-cover" controls />
                  </div>
                ) : null}

                {/* Actions */}
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-2 sm:space-x-6 min-w-0 flex-1">
                    <Button variant="ghost" size="sm" onClick={() => toggleLike(post.id)} className={`text-muted-foreground hover:text-white ${post.is_liked ? 'text-pink-400' : ''} px-2 sm:px-3`}>
                      <Heart className={`w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 ${post.is_liked ? 'fill-current' : ''}`} />
                      <span className="text-xs sm:text-sm">{post.likes_count}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white px-2 sm:px-3" onClick={() => navigate(`/post/${post.id}`)}>
                      <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                      <span className="text-xs sm:text-sm">{post.comments_count}</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleShare(post)} className="text-muted-foreground hover:text-white px-2 sm:px-3">
                      <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                  </div>
                  {post.user_id !== user?.id && <Button variant="ghost" size="sm" onClick={() => toggleSave(post.id)} className={`text-muted-foreground hover:text-white ${post.is_saved ? 'text-blue-400' : ''} px-2 sm:px-3 flex-shrink-0`}>
                      <Bookmark className={`w-4 h-4 sm:w-5 sm:h-5 ${post.is_saved ? 'fill-current' : ''}`} />
                    </Button>}
                  </div>
                </CardContent>
              </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Load More Button */}
        {posts.length > 0 && hasMore && (
          <div className="flex justify-center mt-8">
            <Button onClick={loadMorePosts} disabled={loadingMore} variant="outline" className="border-white/20 text-white hover:bg-white/10">
              {loadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {loadingMore ? 'Ładowanie...' : 'Załaduj więcej postów'}
            </Button>
          </div>
        )}
      </div>

      <PostPreviewModal post={selectedPost} isOpen={!!selectedPost} onClose={() => setSelectedPost(null)} onToggleLike={toggleLike} onToggleSave={toggleSave} />

      <CreatePostModal isOpen={showCreatePost} onClose={() => setShowCreatePost(false)} onPostCreated={handlePostCreated} />

      <EditPostModal isOpen={!!editingPost} onClose={() => setEditingPost(null)} post={editingPost} onPostUpdated={updatedPost => {
      updatePost(updatedPost);
      setEditingPost(null);
    }} />

      <ConfirmDeletePostModal isOpen={!!deletingPost} onClose={() => setDeletingPost(null)} onConfirm={handleDeletePost} loading={deleteLoading} />

      <SharePostModal isOpen={!!sharingPost} onClose={() => setSharingPost(null)} postId={sharingPost?.id || ''} userName={sharingPost?.user?.username || ''} post={sharingPost} />

      <PricingModal isOpen={showPricingModal} onClose={() => setShowPricingModal(false)} onUpgrade={() => {}} />
    </div>
    </>;
};
export default Feed;