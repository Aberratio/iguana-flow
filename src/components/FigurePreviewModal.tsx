import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, CheckCircle, ExternalLink, Timer, Play, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { FigureCompletionCelebration } from "./FigureCompletionCelebration";
import { useDictionary } from "@/contexts/DictionaryContext";
import { FigureHoldTimer } from "./FigureHoldTimer";
import { CreatePostModal } from "./CreatePostModal";

interface FigurePreviewModalProps {
  figure: {
    id: string;
    name: string;
    difficulty_level: string;
    category: string;
    instructions?: string;
    image_url?: string;
    description?: string;
    video_url?: string;
    audio_url?: string;
    type?: string;
    tags?: string[];
    hold_time_seconds?: number;
    level_number?: number;
    // Level-specific fields
    is_boss?: boolean;
    boss_description?: string;
    level_hold_time_seconds?: number;
    level_reps?: number;
    level_notes?: string;
    // Transitions fields
    transition_from_figure_id?: string;
    transition_to_figure_id?: string;
    transition_from_figure?: {
      id: string;
      name: string;
      image_url?: string;
    };
    transition_to_figure?: {
      id: string;
      name: string;
      image_url?: string;
    };
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onFigureCompleted?: (figureId: string) => void;
}

export const FigurePreviewModal: React.FC<FigurePreviewModalProps> = ({
  figure,
  isOpen,
  onClose,
  onFigureCompleted,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getDifficultyColor, getDifficultyLabel } = useDictionary();
  
  // Normalize figure data to handle legacy/corrupted data
  const normalizedFigure = figure ? {
    ...figure,
    difficulty_level: figure.difficulty_level?.toLowerCase() || 'beginner',
    type: figure.type?.replace(/\s+/g, '_')?.toLowerCase() || 'single_figure',
  } : null;
  const [figureProgress, setFigureProgress] = useState<string>("not_tried");
  const [loading, setLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [showFullscreenVideo, setShowFullscreenVideo] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);

  // Fetch figure progress
  const fetchFigureProgress = async () => {
    if (!figure || !user) return;

    try {
      const { data, error } = await supabase
        .from("figure_progress")
        .select("status")
        .eq("user_id", user.id)
        .eq("figure_id", figure.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      setFigureProgress(data?.status || "not_tried");
    } catch (error) {
      console.error("Error fetching figure progress:", error);
    }
  };

  // Update figure status
  const updateFigureStatus = async (newStatus: string) => {
    if (!figure || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("figure_progress").upsert({
        user_id: user.id,
        figure_id: figure.id,
        status: newStatus,
      });

      if (error) throw error;

      setFigureProgress(newStatus);
      
      // If marking as completed, show celebration
      if (newStatus === "completed") {
        setShowCelebration(true);
        
        // After 3 seconds, hide celebration, close modal, and call callback
        setTimeout(() => {
          setShowCelebration(false);
          onClose();
          onFigureCompleted?.(figure.id);
        }, 3000);
      } else {
        toast.success(`Figure marked as ${newStatus.replace("_", " ")}`);
      }
    } catch (error) {
      console.error("Error updating figure status:", error);
      toast.error("Failed to update figure status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && figure) {
      fetchFigureProgress();
      setShowTimer(false); // Reset timer when modal opens
      setShowFullscreenVideo(false); // Reset video when modal opens
    }
  }, [isOpen, figure, user]);

  const canAddOwnVersion = () => {
    // Only if NOT a 'core' exercise
    return figure?.type !== 'core';
  };

  if (!figure) return null;

  return (
    <>
      <FigureCompletionCelebration
        isOpen={showCelebration}
        figureName={figure?.name || ""}
        pointsEarned={figure?.level_number || 1}
      />
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl w-full p-0 bg-gradient-to-b from-gray-900 to-black border-white/10">
        <div className="relative">
          {/* Image/Video Display with Play Button */}
          <div className="relative w-full min-h-[300px] sm:min-h-[400px] bg-black/50 flex items-center justify-center">
            {figure.image_url ? (
              <>
                <img
                  src={figure.image_url}
                  alt={figure.name}
                  className="w-full h-full object-contain"
                />
                {/* Play button overlay if video exists */}
                {figure.video_url && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/60 cursor-pointer transition-all group"
                    onClick={() => setShowFullscreenVideo(true)}
                  >
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-10 h-10 text-white ml-1" fill="white" />
                    </div>
                  </div>
                )}
              </>
            ) : figure.video_url ? (
              <video
                src={figure.video_url}
                controls
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center text-gray-400">
                <div className="text-6xl mb-4">📷</div>
                <p>Brak mediów</p>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                {figure.name}
              </h2>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge className={cn(getDifficultyColor(normalizedFigure?.difficulty_level), "text-xs")}>
                  {getDifficultyLabel(normalizedFigure?.difficulty_level) || figure.difficulty_level || "Nieznany"}
                </Badge>
                
                {figure.level_hold_time_seconds && (
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-400/30 text-xs">
                    ⏱️ {figure.level_hold_time_seconds}s
                  </Badge>
                )}
                {!figure.level_hold_time_seconds && figure.hold_time_seconds && figure.hold_time_seconds > 0 && (
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-400/30 text-xs">
                    ⏱️ {figure.hold_time_seconds}s
                  </Badge>
                )}
                
                {figure.level_reps && (
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-400/30 text-xs">
                    🔁 {figure.level_reps}x
                  </Badge>
                )}
              </div>
            </div>

            {figure.is_boss && (
              <div className="p-2.5 bg-yellow-900/20 border border-yellow-400/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-lg">👑</span>
                  <span className="font-semibold text-yellow-400 text-sm">Figurka Boss</span>
                </div>
                {figure.boss_description && (
                  <p className="text-xs text-yellow-200 mt-1">
                    {figure.boss_description}
                  </p>
                )}
              </div>
            )}

            {figure.level_notes && (
              <div className="p-2.5 bg-blue-900/20 border border-blue-400/20 rounded-lg">
                <p className="text-xs text-blue-300">
                  💡 {figure.level_notes}
                </p>
              </div>
            )}

            {(figure.level_hold_time_seconds || figure.hold_time_seconds) && !showTimer && (
              <Button
                onClick={() => setShowTimer(true)}
                size="sm"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-sm h-9"
              >
                <Timer className="w-3.5 h-3.5 mr-2" />
                Rozpocznij Timer ({figure.level_hold_time_seconds || figure.hold_time_seconds}s)
              </Button>
            )}

            {showTimer && (
              <div className="space-y-2 p-3 bg-blue-900/20 border border-blue-400/20 rounded-lg">
                <FigureHoldTimer
                  holdTimeSeconds={figure.level_hold_time_seconds || figure.hold_time_seconds || 0}
                  onComplete={() => {
                    toast.success("Świetna robota! 🎉");
                    setShowTimer(false);
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTimer(false)}
                  className="w-full text-xs h-7"
                >
                  Zamknij timer
                </Button>
              </div>
            )}

            {figure.type === 'transitions' && figure.transition_from_figure && figure.transition_to_figure && (
              <div className="p-3 bg-purple-900/20 border border-purple-400/20 rounded-lg">
                <h3 className="text-sm font-semibold text-white mb-2">Przejście</h3>
                <div className="flex items-center justify-around gap-2">
                  <div 
                    className="flex-1 text-center cursor-pointer" 
                    onClick={() => navigate(`/exercise/${figure.transition_from_figure?.id}`, { state: { from: '/aerial-journey' } })}
                  >
                    {figure.transition_from_figure.image_url && (
                      <img 
                        src={figure.transition_from_figure.image_url} 
                        alt="" 
                        className="w-16 h-16 object-cover rounded-lg mx-auto mb-1"
                      />
                    )}
                    <p className="text-white text-xs font-medium truncate">
                      {figure.transition_from_figure.name}
                    </p>
                  </div>
                  <span className="text-purple-400 text-2xl">→</span>
                  <div 
                    className="flex-1 text-center cursor-pointer" 
                    onClick={() => navigate(`/exercise/${figure.transition_to_figure?.id}`, { state: { from: '/aerial-journey' } })}
                  >
                    {figure.transition_to_figure.image_url && (
                      <img 
                        src={figure.transition_to_figure.image_url} 
                        alt="" 
                        className="w-16 h-16 object-cover rounded-lg mx-auto mb-1"
                      />
                    )}
                    <p className="text-white text-xs font-medium truncate">
                      {figure.transition_to_figure.name}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {figure.audio_url && (
              <div className="p-2.5 bg-orange-900/20 border border-orange-400/20 rounded-lg">
                <h4 className="text-white text-xs font-medium mb-1.5 flex items-center gap-1">
                  🎵 Instrukcje audio
                </h4>
                <audio controls className="w-full h-8">
                  <source src={figure.audio_url} type="audio/mpeg" />
                </audio>
              </div>
            )}

            <div className="space-y-2 pt-2">
              {canAddOwnVersion() && user && (
                <Button
                  onClick={() => setShowCreatePost(true)}
                  size="sm"
                  variant="outline"
                  className="w-full border-pink-400/30 text-pink-400 hover:bg-pink-400/10 text-sm h-9"
                >
                  <Plus className="w-3.5 h-3.5 mr-2" />
                  Dodaj swoją wersję
                </Button>
              )}

              {user && (
                <Button
                  variant={figureProgress === "completed" ? "default" : "outline"}
                  onClick={() =>
                    updateFigureStatus(
                      figureProgress === "completed" ? "not_tried" : "completed"
                    )
                  }
                  disabled={loading}
                  size="sm"
                  className={cn(
                    "w-full text-sm h-9",
                    figureProgress === "completed"
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "border-green-400/30 text-green-400 hover:bg-green-400/10"
                  )}
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-2" />
                  {figureProgress === "completed" ? "Ukończone!" : "Zaznacz jako ukończone"}
                </Button>
              )}

              <Button
                onClick={() => navigate(`/exercise/${figure.id}`, { state: { from: '/aerial-journey' } })}
                size="sm"
                variant="ghost"
                className="w-full text-purple-400 hover:bg-purple-400/10 text-xs h-8"
              >
                <ExternalLink className="w-3 h-3 mr-2" />
                Pokaż pełne ćwiczenie
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Fullscreen Video Dialog */}
    <Dialog open={showFullscreenVideo} onOpenChange={setShowFullscreenVideo}>
      <DialogContent className="max-w-7xl w-full max-h-[90vh] bg-black/95 p-4 flex items-center justify-center border-white/10">
        <video 
          src={figure?.video_url} 
          controls 
          autoPlay 
          playsInline
          webkit-playsinline="true"
          className="max-w-full max-h-full object-contain" 
        />
      </DialogContent>
    </Dialog>

    {/* Create Post Modal */}
    {showCreatePost && figure && (
      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onPostCreated={() => {
          setShowCreatePost(false);
          toast.success("Post utworzony! Twoja wersja ćwiczenia została opublikowana.");
        }}
        preselectedFigure={{
          id: figure.id,
          name: figure.name,
          difficulty_level: figure.difficulty_level,
          image_url: figure.image_url || undefined
        }}
      />
    )}
    </>
  );
};
