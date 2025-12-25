import React, { useState } from 'react';
import { Heart, MessageCircle, Users, Trophy, Star, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useUserActivities, UserActivity } from '@/hooks/useUserActivities';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const Inbox = () => {
  const [filter, setFilter] = useState('all');
  const { activities, loading, markAllAsRead, markAsRead } = useUserActivities();
  const navigate = useNavigate();

  // Mark all activities as read when user opens inbox
  useEffect(() => {
    if (!loading && activities.length > 0) {
      // Add a small delay to ensure the component has mounted
      const timer = setTimeout(() => {
        markAllAsRead();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, activities.length, markAllAsRead]);

  const getActivityContent = (activity: UserActivity) => {
    const data = activity.activity_data || {};
    const targetUser = activity.target_user;
    switch (activity.activity_type) {
      case 'like':
        return `${targetUser?.username || 'Ktoś'} polubił(a) Twój post`;
      case 'comment':
        return `${targetUser?.username || 'Ktoś'} skomentował(a) Twój post: "${data.content?.substring(0, 50) || ''}..."`;
      case 'follow':
      case 'new_follower':
        return `${activity.activity_data?.follower_username || 'Ktoś'} zaczął(ęła) Cię obserwować`;
      case 'friend_request':
        return `${activity.activity_data?.requester_username || 'Ktoś'} wysłał(a) Ci zaproszenie do znajomych`;
      case 'friend_request_accepted':
        return `${activity.activity_data?.accepter_username || 'Ktoś'} zaakceptował(a) Twoje zaproszenie`;
      case 'post_created':
        return 'Utworzyłeś(aś) nowy post (+10 pkt)';
      case 'challenge_day_completed':
        return `Ukończyłeś(aś) dzień wyzwania (+25 pkt)`;
      case 'figure_completed':
        return `Opanowałeś(aś) nową figurę (+15 pkt)`;
      case 'training_completed':
        return `Ukończyłeś(aś) trening (+20 pkt)`;
      default:
        return 'Nowa aktywność';
    }
  };

  const handleActivityClick = (activity: UserActivity) => {
    // Mark individual activity as read when clicked
    if (!activity.is_read) {
      markAsRead(activity.id);
    }
    
    const data = activity.activity_data || {};
    switch (activity.activity_type) {
      case 'like':
      case 'comment':
        if (data.post_id) {
          navigate(`/feed?post=${data.post_id}`);
        } else {
          navigate('/feed');
        }
        break;
      case 'follow':
      case 'new_follower':
        if (activity.target_user_id || activity.activity_data?.follower_id) {
          navigate(`/profile/${activity.target_user_id || activity.activity_data.follower_id}`);
        }
        break;
      case 'friend_request':
      case 'friend_request_accepted':
        navigate('/friends');
        break;
      case 'post_created':
        navigate('/feed');
        break;
      case 'challenge_day_completed':
        navigate('/challenges');
        break;
      case 'figure_completed':
        navigate('/library');
        break;
      case 'training_completed':
        navigate('/training');
        break;
      default:
        break;
    }
  };

  const getActivityIcon = (activity_type: string) => {
    switch (activity_type) {
      case 'like':
        return <Heart className="w-5 h-5 text-pink-400" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-400" />;
      case 'follow':
      case 'new_follower':
        return <Users className="w-5 h-5 text-green-400" />;
      case 'friend_request':
        return <Users className="w-5 h-5 text-blue-400" />;
      case 'friend_request_accepted':
        return <Users className="w-5 h-5 text-green-500" />;
      case 'challenge_day_completed':
      case 'figure_completed':
      case 'training_completed':
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      default:
        return <Star className="w-5 h-5 text-purple-400" />;
    }
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === 'likes') return activity.activity_type === 'like';
    if (filter === 'comments') return activity.activity_type === 'comment';
    if (filter === 'friends') return ['friend_request', 'friend_request_accepted'].includes(activity.activity_type);
    if (filter === 'followers') return ['follow', 'new_follower'].includes(activity.activity_type);
    return true;
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Powiadomienia</h2>

      {/* Filter Tabs - Hidden on mobile, show only "All" */}
      <div className="hidden md:flex space-x-1 bg-white/5 rounded-lg p-1">
        {[
          { id: 'all', label: 'Wszystkie' },
          { id: 'likes', label: 'Polubienia' },
          { id: 'comments', label: 'Komentarze' },
          { id: 'friends', label: 'Znajomi' },
          { id: 'followers', label: 'Obserwujący' }
        ].map(tab => (
          <Button 
            key={tab.id}
            variant="ghost"
            className={`flex-1 transition-all ${
              filter === tab.id 
                ? 'bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 text-white' 
                : 'text-muted-foreground hover:text-white hover:bg-white/5'
            }`}
            onClick={() => setFilter(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Activities List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground mt-2">Ładowanie aktywności...</p>
          </div>
        ) : (
          filteredActivities.map(activity => (
            <Card 
              key={activity.id} 
              className={`glass-effect border-white/10 cursor-pointer hover:border-purple-500/30 transition-colors ${
                !activity.is_read ? 'bg-white/5' : ''
              }`}
              onClick={() => handleActivityClick(activity)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div className="mt-1">
                    {getActivityIcon(activity.activity_type)}
                  </div>

                  {/* Avatar (if target user exists) */}
                  {activity.target_user && (
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={activity.target_user.avatar_url || undefined} />
                      <AvatarFallback>{activity.target_user.username[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )}

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className={`${!activity.is_read ? 'text-white font-semibold' : 'text-white'}`}>
                            {getActivityContent(activity)}
                          </p>
                          {!activity.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground text-sm">
                            {new Date(activity.created_at).toLocaleString()}
                          </span>
                          {activity.points_awarded > 0 && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                              +{activity.points_awarded} pts
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {filteredActivities.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
            <Heart className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="text-muted-foreground text-lg">Brak powiadomień</div>
          <div className="text-muted-foreground text-sm mt-1">
            💡 Wskazówka: Polub posty innych, komentuj i dodawaj znajomych, aby otrzymywać powiadomienia!
          </div>
        </div>
      )}
    </div>
  );
};

export default Inbox;
