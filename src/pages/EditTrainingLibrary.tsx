import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import {
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  Clock,
  Target,
  Loader2,
  Crown,
  Upload,
  X,
  AlertTriangle,
  Play,
  Video,
  Dumbbell,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { useDictionary } from '@/contexts/DictionaryContext';
import { supabase } from '@/integrations/supabase/client';
import { ImageCropModal } from '@/components/ImageCropModal';
import {
  TrainingExerciseManager,
  TrainingExerciseData,
} from '@/components/TrainingExerciseManager';
import { SEO } from '@/components/SEO';

// Zod schema for training validation
const trainingSchema = z.object({
  title: z
    .string()
    .min(3, 'Tytuł musi mieć minimum 3 znaki')
    .max(100, 'Tytuł może mieć maksymalnie 100 znaków'),
  description: z
    .string()
    .max(2000, 'Opis może mieć maksymalnie 2000 znaków')
    .optional()
    .nullable(),
  category: z.enum(['warmup', 'exercise', 'cooldown', 'strength', 'flexibility', 'conditioning', 'complex'], {
    errorMap: () => ({ message: 'Wybierz kategorię' }),
  }),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced'], {
    errorMap: () => ({ message: 'Wybierz poziom trudności' }),
  }).optional().nullable(),
  training_type: z.enum(['video', 'figure_set', 'complex'], {
    errorMap: () => ({ message: 'Wybierz typ treningu' }),
  }),
});

interface TrainingData {
  id: string;
  title: string;
  description: string | null;
  category: string;
  training_type: string;
  difficulty_level: string | null;
  duration_seconds: number | null;
  video_url: string | null;
  thumbnail_url: string | null;
  is_published: boolean;
  premium: boolean;
  sport_type: string[] | null;
  tags: string[] | null;
  created_by: string | null;
  created_at: string;
}

interface TrainingExercise {
  id: string;
  training_id: string;
  figure_id: string;
  order_index: number;
  completion_mode: string;
  sets: number | null;
  reps: number | null;
  hold_time_seconds: number | null;
  rest_time_seconds: number | null;
  notes: string | null;
  figures?: {
    name: string;
    image_url: string | null;
  } | null;
}

interface FormErrors {
  title?: string;
  description?: string;
  category?: string;
  difficulty_level?: string;
  training_type?: string;
}

const EditTrainingLibrary = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isTrainer, isLoading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const { difficultyLevels } = useDictionary();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [training, setTraining] = useState<TrainingData | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [hasProgressWarning, setHasProgressWarning] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'exercise',
    difficulty_level: 'intermediate',
    training_type: 'figure_set',
    video_url: '',
    thumbnail_url: '',
    is_published: false,
    premium: false,
    sport_type: ['aerial_silks'] as string[],
  });

  const [exercises, setExercises] = useState<TrainingExerciseData[]>([]);
  const [originalExerciseIds, setOriginalExerciseIds] = useState<string[]>([]);

  // Image upload states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  // Permission check
  const canEdit = isAdmin || (isTrainer && training?.created_by === user?.id);

  useEffect(() => {
    if (!roleLoading && !isAdmin && !isTrainer) {
      navigate('/training/library');
    }
  }, [isAdmin, isTrainer, roleLoading, navigate]);

  useEffect(() => {
    if (id && !roleLoading && (isAdmin || isTrainer)) {
      fetchTraining();
    }
  }, [id, isAdmin, isTrainer, roleLoading]);

  const fetchTraining = async () => {
    if (!id) {
      navigate('/training/library');
      return;
    }

    setLoading(true);
    try {
      // Fetch training data
      const { data: trainingData, error: trainingError } = await supabase
        .from('training_library')
        .select('*')
        .eq('id', id)
        .single();

      if (trainingError) throw trainingError;

      if (!trainingData) {
        navigate('/training/library');
        return;
      }

      // Check permissions
      if (!isAdmin && trainingData.created_by !== user?.id) {
        toast({
          title: 'Brak dostępu',
          description: 'Nie masz uprawnień do edycji tego treningu.',
          variant: 'destructive',
        });
        navigate('/training/library');
        return;
      }

      setTraining(trainingData);
      setFormData({
        title: trainingData.title || '',
        description: trainingData.description || '',
        category: trainingData.category || 'exercise',
        difficulty_level: trainingData.difficulty_level || 'intermediate',
        training_type: trainingData.training_type || 'figure_set',
        video_url: trainingData.video_url || '',
        thumbnail_url: trainingData.thumbnail_url || '',
        is_published: trainingData.is_published || false,
        premium: trainingData.premium || false,
        sport_type: trainingData.sport_type || ['aerial_silks'],
      });

      // Fetch exercises if figure_set
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

        const mappedExercises: TrainingExerciseData[] = (exercisesData || []).map(
          (ex: any) => ({
            figure_id: ex.figure_id,
            figure_name: ex.figures?.name || 'Ćwiczenie',
            figure_image: ex.figures?.image_url || undefined,
            order_index: ex.order_index,
            completion_mode: (ex.completion_mode === 'completion' ? 'completion' : 'time') as 'time' | 'completion',
            sets: ex.sets || 3,
            reps: ex.reps || 1,
            hold_time_seconds: ex.hold_time_seconds || 30,
            rest_time_seconds: ex.rest_time_seconds || 10,
            notes: ex.notes || undefined,
          })
        );

        setExercises(mappedExercises);
        setOriginalExerciseIds(exercisesData?.map((ex: any) => ex.figure_id) || []);
      }

      // Check for user progress (to warn about modifications)
      await checkUserProgress();
    } catch (error) {
      console.error('Błąd podczas ładowania treningu:', error);
      toast({
        title: 'Błąd',
        description: 'Nie udało się załadować treningu.',
        variant: 'destructive',
      });
      navigate('/trainer/my-trainings');
    } finally {
      setLoading(false);
    }
  };

  const checkUserProgress = async () => {
    // Note: This table may not exist - skipping progress check for now
    // If you want to track training completions, create the table first
    setHasProgressWarning(false);
  };

  const validateForm = (): boolean => {
    try {
      trainingSchema.parse({
        title: formData.title,
        description: formData.description || undefined,
        category: formData.category,
        difficulty_level: formData.difficulty_level || undefined,
        training_type: formData.training_type,
      });
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: FormErrors = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as keyof FormErrors] = err.message;
          }
        });
        setFormErrors(errors);
      }
      return false;
    }
  };

  const calculateDuration = (): number => {
    if (formData.training_type === 'figure_set') {
      return exercises.reduce((total, ex) => {
        if (ex.completion_mode === 'time') {
          const setTime = (ex.hold_time_seconds || 0) + (ex.rest_time_seconds || 0);
          return total + setTime * (ex.sets || 1) * (ex.reps || 1);
        }
        return total + 30; // Default 30s for completion mode exercises
      }, 0);
    }
    return 0;
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `training-library/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('challenges')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('challenges').getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Błąd podczas przesyłania obrazu:', error);
      toast({
        title: 'Błąd przesyłania',
        description: 'Nie udało się przesłać obrazu. Spróbuj ponownie.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setIsCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (croppedImageFile: File) => {
    setIsCropModalOpen(false);
    setSelectedImage(null);

    const uploadedUrl = await uploadImage(croppedImageFile);
    if (uploadedUrl) {
      setFormData((prev) => ({ ...prev, thumbnail_url: uploadedUrl }));
      toast({
        title: 'Obraz przesłany',
        description: 'Miniatura treningu została zaktualizowana.',
      });
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, thumbnail_url: '' }));
  };

  const handleSave = async () => {
    if (!user || !id) return;

    if (!validateForm()) {
      toast({
        title: 'Błąd walidacji',
        description: 'Popraw błędy w formularzu przed zapisaniem.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.training_type === 'figure_set' && exercises.length === 0) {
      toast({
        title: 'Brak ćwiczeń',
        description: 'Dodaj przynajmniej jedno ćwiczenie do treningu.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.training_type === 'video' && !formData.video_url) {
      toast({
        title: 'Brak wideo',
        description: 'Podaj URL wideo dla tego typu treningu.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      // Update training data
      const trainingUpdate = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        difficulty_level: formData.difficulty_level,
        training_type: formData.training_type,
        video_url: formData.training_type === 'video' ? formData.video_url : null,
        thumbnail_url: formData.thumbnail_url || null,
        is_published: formData.is_published,
        premium: formData.premium,
        sport_type: formData.sport_type,
        duration_seconds: calculateDuration(),
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('training_library')
        .update(trainingUpdate)
        .eq('id', id);

      if (updateError) throw updateError;

      // Update exercises if figure_set
      if (formData.training_type === 'figure_set') {
        // Delete existing exercises
        const { error: deleteError } = await supabase
          .from('training_library_exercises')
          .delete()
          .eq('training_id', id);

        if (deleteError) throw deleteError;

        // Insert new exercises
        if (exercises.length > 0) {
          const exerciseInserts = exercises.map((ex, index) => ({
            training_id: id,
            figure_id: ex.figure_id,
            order_index: index,
            completion_mode: ex.completion_mode,
            sets: ex.sets,
            reps: ex.reps,
            hold_time_seconds: ex.hold_time_seconds,
            rest_time_seconds: ex.rest_time_seconds,
            notes: ex.notes || null,
          }));

          const { error: insertError } = await supabase
            .from('training_library_exercises')
            .insert(exerciseInserts);

          if (insertError) throw insertError;
        }
      }

      toast({
        title: 'Zapisano!',
        description: 'Trening został zaktualizowany pomyślnie.',
      });

      navigate('/trainer/my-trainings');
    } catch (error) {
      console.error('Błąd podczas zapisywania:', error);
      toast({
        title: 'Błąd',
        description: 'Nie udało się zapisać treningu. Spróbuj ponownie.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Ładowanie treningu...</p>
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Brak dostępu</h2>
            <p className="text-muted-foreground mb-4">
              Nie masz uprawnień do edycji tego treningu.
            </p>
            <Button onClick={() => navigate('/trainer/my-trainings')}>
              Wróć do listy treningów
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title={`Edycja: ${formData.title || 'Trening'} | IguanaFlow`}
        description="Edytuj szczegóły treningu"
      />

      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate('/trainer/my-trainings')}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Edycja treningu</h1>
                <p className="text-muted-foreground text-sm">
                  Modyfikuj szczegóły i ćwiczenia
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_published}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_published: checked }))
                  }
                  id="published-toggle"
                />
                <Label htmlFor="published-toggle" className="flex items-center gap-1 text-sm">
                  {formData.is_published ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">
                    {formData.is_published ? 'Opublikowany' : 'Szkic'}
                  </span>
                </Label>
              </div>

              <Button
                onClick={handleSave}
                disabled={saving || !formData.title}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Zapisywanie...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Zapisz
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Progress Warning */}
          {hasProgressWarning && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Uwaga!</AlertTitle>
              <AlertDescription>
                Ten trening jest używany przez uczestników. Zmiany mogą wpłynąć na ich
                postępy. Rozważ utworzenie nowej wersji zamiast modyfikacji.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Podstawowe informacje
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Tytuł treningu *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, title: e.target.value }))
                      }
                      placeholder="Wpisz tytuł treningu"
                      className={formErrors.title ? 'border-destructive' : ''}
                    />
                    {formErrors.title && (
                      <p className="text-sm text-destructive mt-1">{formErrors.title}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description">Opis</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Opisz trening..."
                      rows={4}
                      className={formErrors.description ? 'border-destructive' : ''}
                    />
                    {formErrors.description && (
                      <p className="text-sm text-destructive mt-1">
                        {formErrors.description}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Kategoria *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, category: value }))
                        }
                      >
                        <SelectTrigger className={formErrors.category ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Wybierz kategorię" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="warmup">Rozgrzewka</SelectItem>
                          <SelectItem value="exercise">Ćwiczenia</SelectItem>
                          <SelectItem value="cooldown">Rozciąganie</SelectItem>
                          <SelectItem value="strength">Siła</SelectItem>
                          <SelectItem value="flexibility">Elastyczność</SelectItem>
                          <SelectItem value="conditioning">Kondycja</SelectItem>
                          <SelectItem value="complex">Kompleksowy</SelectItem>
                        </SelectContent>
                      </Select>
                      {formErrors.category && (
                        <p className="text-sm text-destructive mt-1">{formErrors.category}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="difficulty">Poziom trudności</Label>
                      <Select
                        value={formData.difficulty_level}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, difficulty_level: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz poziom" />
                        </SelectTrigger>
                        <SelectContent>
                          {difficultyLevels.map((level) => (
                            <SelectItem key={level.key} value={level.key}>
                              {level.name_pl}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="training_type">Typ treningu</Label>
                      <Select
                        value={formData.training_type}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, training_type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz typ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="figure_set">
                            <div className="flex items-center gap-2">
                              <Dumbbell className="w-4 h-4" />
                              Zestaw ćwiczeń
                            </div>
                          </SelectItem>
                          <SelectItem value="video">
                            <div className="flex items-center gap-2">
                              <Video className="w-4 h-4" />
                              Trening wideo
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={formData.premium}
                          onCheckedChange={(checked) =>
                            setFormData((prev) => ({ ...prev, premium: checked }))
                          }
                          id="premium-toggle"
                        />
                        <Label htmlFor="premium-toggle" className="flex items-center gap-1">
                          <Crown className="w-4 h-4 text-yellow-400" />
                          Premium
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Video URL field - only for video type */}
                  {formData.training_type === 'video' && (
                    <div>
                      <Label htmlFor="video_url">URL wideo *</Label>
                      <Input
                        id="video_url"
                        value={formData.video_url}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, video_url: e.target.value }))
                        }
                        placeholder="https://youtube.com/..."
                      />
                    </div>
                  )}

                  {/* Thumbnail */}
                  <div>
                    <Label>Miniatura treningu</Label>
                    <div className="space-y-4">
                      {formData.thumbnail_url && (
                        <div className="relative">
                          <img
                            src={formData.thumbnail_url}
                            alt="Miniatura"
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveImage}
                            className="absolute top-2 right-2"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById('image-upload')?.click()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {formData.thumbnail_url ? 'Zmień obraz' : 'Dodaj obraz'}
                        </Button>
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Exercise Management - only for figure_set */}
              {formData.training_type === 'figure_set' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Dumbbell className="w-5 h-5 text-primary" />
                      Ćwiczenia ({exercises.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TrainingExerciseManager
                      exercises={exercises}
                      onChange={setExercises}
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Preview Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Podgląd</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <img
                      src={
                        formData.thumbnail_url ||
                        'https://images.unsplash.com/photo-1518594023387-5565c8f3d1ce?w=400&h=300&fit=crop'
                      }
                      alt="Podgląd"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      {formData.premium && (
                        <Badge className="bg-yellow-500/80 text-black">
                          <Crown className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <h3 className="font-semibold line-clamp-2">
                      {formData.title || 'Tytuł treningu'}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {formData.description || 'Opis treningu...'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Statystyki</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Ćwiczenia</span>
                    <Badge variant="secondary">{exercises.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Szacowany czas</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {Math.ceil(calculateDuration() / 60)} min
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={formData.is_published ? 'default' : 'outline'}>
                      {formData.is_published ? 'Opublikowany' : 'Szkic'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Szybkie akcje</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate(`/training/library/${id}`)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Zobacz podgląd
                  </Button>
                  {formData.is_published && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => navigate(`/training/library/${id}/session`)}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Uruchom trening
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {selectedImage && (
        <ImageCropModal
          isOpen={isCropModalOpen}
          onClose={() => {
            setIsCropModalOpen(false);
            setSelectedImage(null);
          }}
          imageSrc={selectedImage}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
};

export default EditTrainingLibrary;
