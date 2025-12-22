import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCanAccessTraining } from '@/hooks/useCanAccessTraining';
import { useTrainingBookmarks } from '@/hooks/useTrainingBookmarks';
import { useDictionary } from '@/contexts/DictionaryContext';
import { PremiumLockScreen } from '@/components/PremiumLockScreen';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Clock, Play, Heart, Lock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { TrainingLibrary } from '@/hooks/useTrainingLibrary';

interface TrainingExercise {
  id: string;
  figure_id: string;
  order_index: number;
  completion_mode: 'time' | 'completion';
  sets: number;
  reps: number;
  hold_time_seconds: number;
  rest_time_seconds: number;
  target_completions: number | null;
  notes: string | null;
  figures: {
    name: string;
    image_url: string | null;
  };
}

const TrainingLibraryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [training, setTraining] = useState<TrainingLibrary | null>(null);
  const [exercises, setExercises] = useState<TrainingExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { canAccess } = useCanAccessTraining(training?.premium || false);
  const { bookmarkedIds, toggleBookmark } = useTrainingBookmarks(user?.id);
  const { getSportCategoryLabel, getDifficultyLabel } = useDictionary();

  useEffect(() => {
    if (id) {
      fetchTrainingDetail();
    }
  }, [id]);

  const fetchTrainingDetail = async () => {
    setIsLoading(true);
    try {
      const { data: trainingData, error: trainingError } = await supabase
        .from('training_library')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (trainingError) throw trainingError;
      setTraining(trainingData as TrainingLibrary);

      if (trainingData.training_type === 'figure_set') {
        const { data: exercisesData, error: exercisesError } = await supabase
          .from('training_library_exercises')
          .select(`
            *,
            figures (
              name,
              image_url
            )
          `)
          .eq('training_id', id)
          .order('order_index');

        if (exercisesError) throw exercisesError;
        setExercises((exercisesData || []) as TrainingExercise[]);
      }
    } catch (error) {
      console.error('Error fetching training:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTraining = () => {
    navigate(`/training/library/${id}/session`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/10 p-4">
        <div className="container mx-auto max-w-4xl">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="aspect-video w-full mb-6" />
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-20 w-full mb-6" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (!training) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/10 flex items-center justify-center">
        <p className="text-xl text-muted-foreground">Nie znaleziono treningu</p>
      </div>
    );
  }

  if (!canAccess) {
    return <PremiumLockScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/10">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/training/library')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Wróć do biblioteki
        </Button>

        {/* Thumbnail / Video */}
        <div className="aspect-video mb-6 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20">
          {training.thumbnail_url && (
            <img
              src={training.thumbnail_url}
              alt={training.title}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Title and Description */}
        <h1 className="text-4xl font-bold text-foreground mb-4">
          {training.title}
        </h1>

        {training.description && (
          <p className="text-muted-foreground mb-6">{training.description}</p>
        )}

        {/* Info */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <span className="text-foreground">
              {Math.ceil(training.duration_seconds / 60)} minut
            </span>
          </div>
          {training.difficulty_level && (
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
              {'⭐'.repeat(
                training.difficulty_level === 'beginner'
                  ? 1
                  : training.difficulty_level === 'intermediate'
                  ? 2
                  : 3
              )}
            </Badge>
          )}
          {training.sport_type?.map((sport) => (
            <Badge
              key={sport}
              variant="outline"
              className="border-pink-500/30 text-pink-400"
            >
              {getSportCategoryLabel(sport)}
            </Badge>
          ))}
        </div>

        {/* Exercises List (for figure_set) */}
        {training.training_type === 'figure_set' && exercises.length > 0 && (
          <Card className="p-6 mb-6 bg-background-elevated border-white/10">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              📋 Lista ćwiczeń ({exercises.length})
            </h2>
            <div className="space-y-4">
              {exercises.map((exercise, index) => (
                <div
                  key={exercise.id}
                  className="flex gap-4 p-4 rounded-lg bg-background border border-white/5"
                >
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-purple-500/10">
                    {exercise.figures.image_url && (
                      <img
                        src={exercise.figures.image_url}
                        alt={exercise.figures.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">
                      {index + 1}. {exercise.figures.name}
                    </div>
                    {exercise.completion_mode === 'time' ? (
                      <div className="text-sm text-muted-foreground">
                        {exercise.sets} serie × {exercise.reps} powtórzeń
                        <br />⏱ {exercise.hold_time_seconds}s trzymanie | {exercise.rest_time_seconds}s odpoczynek
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        ✅ ZALICZ {exercise.target_completions} RAZY
                        <br />
                        Tryb completion
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Start Training Button */}
        <div className="flex gap-3">
          <Button
            onClick={handleStartTraining}
            className="flex-1 h-14 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Play className="w-5 h-5 mr-2" />
            Rozpocznij trening
          </Button>
          <Button
            onClick={() => toggleBookmark(id!)}
            variant="outline"
            size="lg"
            className="h-14"
          >
            <Heart className={`w-5 h-5 ${bookmarkedIds.includes(id!) ? 'fill-primary text-primary' : ''}`} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TrainingLibraryDetail;
