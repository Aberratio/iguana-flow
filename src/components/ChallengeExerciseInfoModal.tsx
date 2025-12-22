import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, ExternalLink, BookOpen, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ChallengeExerciseInfoModalProps {
  exercise: {
    id: string;
    name: string;
    image_url?: string;
    video_url?: string;
    description?: string;
    instructions?: string;
    tags?: string[];
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ChallengeExerciseInfoModal: React.FC<ChallengeExerciseInfoModalProps> = ({
  exercise,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const [showFullscreenVideo, setShowFullscreenVideo] = useState(false);

  if (!exercise) return null;

  const handleShowFullExercise = () => {
    onClose();
    navigate(`/exercise/${exercise.id}`, { state: { from: '/challenges' } });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl w-full p-0 bg-gradient-to-b from-gray-900 to-black border-white/10 max-h-[90vh] overflow-y-auto">
          <div className="relative">
            {/* Image/Video Display */}
            <div className="relative w-full min-h-[300px] sm:min-h-[400px] bg-black/50 flex items-center justify-center">
              {exercise.image_url ? (
                <>
                  <img
                    src={exercise.image_url}
                    alt={exercise.name}
                    className="w-full h-full object-contain"
                  />
                  {/* Play button overlay if video exists */}
                  {exercise.video_url && (
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
              ) : exercise.video_url ? (
                <video
                  src={exercise.video_url}
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
              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                {exercise.name}
              </h2>

              {/* Description */}
              {exercise.description && (
                <div className="p-3 bg-purple-900/20 border border-purple-400/20 rounded-lg">
                  <div className="flex items-center mb-2">
                    <BookOpen className="w-4 h-4 text-purple-400 mr-2" />
                    <h3 className="text-white font-semibold text-sm">Opis</h3>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {exercise.description}
                  </p>
                </div>
              )}

              {/* Instructions */}
              {exercise.instructions && (
                <div className="p-3 bg-green-900/20 border border-green-400/20 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Target className="w-4 h-4 text-green-400 mr-2" />
                    <h3 className="text-white font-semibold text-sm">Instrukcje</h3>
                  </div>
                  <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                    {exercise.instructions}
                  </div>
                </div>
              )}

              {/* Tags */}
              {exercise.tags && exercise.tags.length > 0 && (
                <div className="p-3 bg-blue-900/20 border border-blue-400/20 rounded-lg">
                  <h3 className="text-white font-semibold text-sm mb-2">Tagi</h3>
                  <div className="flex flex-wrap gap-2">
                    {exercise.tags.map((tag: string, index: number) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="border-white/20 text-white text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Show Full Exercise Button */}
              <Button
                onClick={handleShowFullExercise}
                size="lg"
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Pokaż pełne ćwiczenie
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Video Dialog */}
      {exercise.video_url && (
        <Dialog open={showFullscreenVideo} onOpenChange={setShowFullscreenVideo}>
          <DialogContent className="max-w-7xl w-full max-h-[90vh] bg-black/95 p-4 flex items-center justify-center border-white/10">
            <video 
              src={exercise.video_url} 
              controls 
              autoPlay 
              playsInline
              className="max-w-full max-h-full object-contain" 
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
