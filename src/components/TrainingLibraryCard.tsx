import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Clock, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { TrainingLibrary } from '@/hooks/useTrainingLibrary';
import { useDictionary } from '@/contexts/DictionaryContext';

interface TrainingLibraryCardProps {
  training: TrainingLibrary;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
}

const categoryIcons = {
  warmup: '🔥',
  exercise: '💪',
  cooldown: '🧘',
  complex: '🎯',
};

const categoryNames = {
  warmup: 'Rozgrzewka',
  exercise: 'Ćwiczenia',
  cooldown: 'Cooldown',
  complex: 'Kompleksowy',
};

const trainingTypeIcons = {
  video: '📹',
  figure_set: '📝',
  complex: '🎯',
};

const difficultyColors = {
  beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
  intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  advanced: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const TrainingLibraryCard: React.FC<TrainingLibraryCardProps> = ({
  training,
  isBookmarked = false,
  onToggleBookmark,
}) => {
  const navigate = useNavigate();
  const { getSportCategoryLabel, getDifficultyLabel } = useDictionary();

  return (
    <Card className="group overflow-hidden bg-background-elevated border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
      <div className="relative aspect-video">
        {training.thumbnail_url ? (
          <img
            src={training.thumbnail_url}
            alt={training.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-6xl">
            {categoryIcons[training.category]}
          </div>
        )}
        
        {onToggleBookmark && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark();
            }}
            className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
          >
            <Heart
              className={`w-5 h-5 ${
                isBookmarked ? 'fill-red-500 text-red-500' : 'text-white'
              }`}
            />
          </button>
        )}

        {training.premium && (
          <div className="absolute top-2 left-2 p-2 rounded-full bg-yellow-500/90">
            <Lock className="w-4 h-4 text-black" />
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg text-foreground line-clamp-1">
            {training.title}
          </h3>
          {training.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {training.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm flex-wrap">
          <span className="text-lg">{categoryIcons[training.category]}</span>
          <span className="text-muted-foreground">
            {categoryNames[training.category]}
          </span>
          <span className="text-muted-foreground">•</span>
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            {Math.ceil(training.duration_seconds / 60)} min
          </span>
        </div>

        {training.difficulty_level && (
          <Badge
            variant="outline"
            className={difficultyColors[training.difficulty_level]}
          >
            {'⭐'.repeat(
              training.difficulty_level === 'beginner'
                ? 1
                : training.difficulty_level === 'intermediate'
                ? 2
                : 3
            )}
          </Badge>
        )}

        {training.sport_type && training.sport_type.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {training.sport_type.slice(0, 2).map((sport) => (
              <Badge
                key={sport}
                variant="outline"
                className="text-xs border-purple-500/30 text-purple-400"
              >
                {getSportCategoryLabel(sport)}
              </Badge>
            ))}
            {training.sport_type.length > 2 && (
              <span className="text-xs text-muted-foreground">
                +{training.sport_type.length - 2}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <span className="text-2xl">{trainingTypeIcons[training.training_type]}</span>
          <span className="text-sm text-muted-foreground">
            {training.training_type === 'video'
              ? 'Trening wideo'
              : training.training_type === 'figure_set'
              ? 'Zestaw ćwiczeń'
              : 'Trening kompleksowy'}
          </span>
        </div>

        <Button
          onClick={() => navigate(`/training/library/${training.id}`)}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          Zobacz szczegóły
        </Button>
      </div>
    </Card>
  );
};

export { TrainingLibraryCard };
