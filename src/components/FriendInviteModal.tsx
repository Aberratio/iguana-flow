import React, { useState, useEffect } from "react";
import { Search, UserPlus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ProfilePreviewModal } from "@/components/ProfilePreviewModal";

interface FriendInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFriendAdded?: () => void;
}

export const FriendInviteModal = ({
  isOpen,
  onClose,
  onFriendAdded,
}: FriendInviteModalProps) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestedFriends, setSuggestedFriends] = useState<any[]>([]);
  const [sentInvites, setSentInvites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showProfilePreview, setShowProfilePreview] = useState(false);
  const { toast } = useToast();

  // Fetch suggested friends from database
  const fetchSuggestedFriends = async () => {
    if (!user || !isOpen) return;

    try {
      setLoading(true);

      // Get all existing relationships (any status) to exclude from suggestions
      const { data: allRelationships } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id, status")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      // Get all user IDs that have any relationship with current user
      const relatedUserIds =
        allRelationships?.map((relationship) => {
          return relationship.requester_id === user.id
            ? relationship.addressee_id
            : relationship.requester_id;
        }) || [];

      const excludeIds = [user.id, ...relatedUserIds];

      let query = supabase
        .from("profiles")
        .select("id, username, avatar_url, bio")
        .not("id", "in", `(${excludeIds.join(",")})`)
        .limit(20);

      if (searchQuery.trim()) {
        query = query.ilike("username", `%${searchQuery}%`);
      }

      const { data: profiles, error } = await query;

      if (error) throw error;

      // Since we already excluded users with any relationship, 
      // no need to check for pending requests again
      const profilesWithData = (profiles || []).map((profile) => ({
        ...profile,
        isOnline: Math.random() > 0.5, // Temporary random status
        hasPendingRequest: false, // Already filtered out
      }));

      setSuggestedFriends(profilesWithData);
    } catch (error) {
      console.error("Error fetching suggested friends:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestedFriends();
  }, [user, isOpen, searchQuery]);

  const handleSendInvite = async (friendId: string, username: string) => {
    if (!user) return;

    try {
      // Double-check for existing relationship before inserting
      const { data: existingRelationship } = await supabase
        .from("friendships")
        .select("status")
        .or(
          `and(requester_id.eq.${user.id},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${user.id})`
        )
        .maybeSingle();

      if (existingRelationship) {
        toast({
          title: "Nie można wysłać zaproszenia",
          description: "Znajomość lub zaproszenie już istnieje z tym użytkownikiem.",
          variant: "destructive",
        });
        return;
      }

      // Insert the friend request
      const { error: friendshipError } = await supabase
        .from("friendships")
        .insert({
          requester_id: user.id,
          addressee_id: friendId,
          status: "pending",
        });

      if (friendshipError) {
        // Handle specific constraint violation
        if (friendshipError.code === '23505') {
          toast({
            title: "Zaproszenie już istnieje",
            description: "Znajomość lub zaproszenie już istnieje z tym użytkownikiem.",
            variant: "destructive",
          });
          return;
        }
        throw friendshipError;
      }

      // Create activity notification for the recipient
      const { error: activityError } = await supabase
        .from("user_activities")
        .insert({
          user_id: friendId,
          activity_type: "friend_request",
          activity_data: {
            requester_id: user.id,
            requester_username: user.username,
          },
          target_user_id: user.id,
          points_awarded: 0,
        });

      if (activityError) {
        console.error("Error creating friend request activity:", activityError);
      }

      setSentInvites((prev) => [...prev, friendId]);
      // Refresh the suggested friends to update the UI
      fetchSuggestedFriends();
      toast({
        title: "Zaproszenie wysłane!",
        description: `Twoje zaproszenie zostało wysłane do ${username}.`,
      });
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się wysłać zaproszenia. Spróbuj ponownie.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`
        ${isMobile 
          ? 'w-[100vw] h-[100vh] max-w-none max-h-none m-0 rounded-none p-4' 
          : 'w-[95vw] max-w-[600px] max-h-[90vh]'
        } 
        overflow-y-auto glass-effect border-white/10
      `}>
        <DialogHeader className={isMobile ? "pb-4" : ""}>
          <DialogTitle className="text-white text-lg sm:text-xl">Znajdź znajomych</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Szukaj znajomych..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`
                pl-10 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground
                ${isMobile ? 'h-12 text-base' : ''}
              `}
            />
          </div>

          <div className={`space-y-3 ${isMobile ? 'max-h-[calc(100vh-180px)]' : 'max-h-96'} overflow-y-auto`}>
            <h3 className="text-sm font-medium text-muted-foreground">
              {searchQuery
                ? `Wyniki wyszukiwania dla "${searchQuery}"`
                : "Sugerowani dla Ciebie"}
            </h3>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-muted-foreground mt-2">Ładowanie...</p>
              </div>
            ) : suggestedFriends.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm sm:text-base">
                  {searchQuery
                    ? `Nie znaleziono użytkowników pasujących do "${searchQuery}"`
                    : "Brak sugerowanych użytkowników w tej chwili"}
                </p>
              </div>
            ) : (
              suggestedFriends.map((friend) => (
                <div
                  key={friend.id}
                  className={`
                    flex items-center justify-between bg-white/5 rounded-lg border border-white/10 gap-3
                    ${isMobile ? 'p-3' : 'p-4'}
                  `}
                >
                  <div
                    className={`
                      flex items-center flex-1 cursor-pointer hover:bg-white/5 rounded -m-2
                      ${isMobile ? 'space-x-2 p-2' : 'space-x-3 p-2'}
                    `}
                    onClick={() => {
                      setSelectedUserId(friend.id);
                      setShowProfilePreview(true);
                    }}
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar className={isMobile ? "w-10 h-10" : "w-12 h-12"}>
                        <AvatarImage src={friend.avatar_url} />
                        <AvatarFallback>
                          {friend.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {friend.isOnline && (
                        <div className={`
                          absolute -bottom-1 -right-1 bg-green-500 rounded-full border-2 border-background
                          ${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'}
                        `}></div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`
                        font-medium text-white truncate
                        ${isMobile ? 'text-sm' : 'text-base'}
                      `}>
                        {friend.username}
                      </p>
                      <p className={`
                        text-muted-foreground truncate
                        ${isMobile ? 'text-xs' : 'text-sm'}
                      `}>
                        {friend.bio || "Aerial enthusiast"}
                      </p>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {sentInvites.includes(friend.id) ||
                    friend.hasPendingRequest ? (
                      <div className={`
                        flex items-center text-green-400
                        ${isMobile ? 'space-x-1' : 'space-x-2'}
                      `}>
                        <Check className="w-4 h-4" />
                        <span className={`whitespace-nowrap ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          Wysłano
                        </span>
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        size={isMobile ? "sm" : "sm"}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendInvite(friend.id, friend.username);
                        }}
                        className={`
                          whitespace-nowrap
                          ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'}
                        `}
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        <span className={isMobile ? "text-xs" : "text-sm"}>
                          {isMobile ? "Dodaj" : "Dodaj znajomego"}
                        </span>
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Profile Preview Modal */}
        <ProfilePreviewModal
          isOpen={showProfilePreview}
          onClose={() => setShowProfilePreview(false)}
          userId={selectedUserId || ""}
        />
      </DialogContent>
    </Dialog>
  );
};
