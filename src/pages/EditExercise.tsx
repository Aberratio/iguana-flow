import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Loader2, Save, ImageIcon, Video, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { SimilarExercisesManager } from "@/components/SimilarExercisesManager";
import { PrerequisiteExercisesManager } from "@/components/PrerequisiteExercisesManager";
import { useDictionary } from "@/contexts/DictionaryContext";
import { z } from "zod";

// Validation schema
const exerciseSchema = z.object({
  name: z.string().min(3, "Nazwa musi mieć minimum 3 znaki").max(100, "Nazwa może mieć maksymalnie 100 znaków"),
  description: z.string().max(1000, "Opis może mieć maksymalnie 1000 znaków").optional(),
  instructions: z.string().max(2000, "Instrukcje mogą mieć maksymalnie 2000 znaków").optional(),
  difficulty_level: z.string().min(1, "Wybierz poziom trudności"),
  category: z.string().min(1, "Wybierz kategorię"),
  type: z.string().min(1, "Wybierz typ"),
});

const EditExercise = () => {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isTrainer, isAdmin } = useUserRole();
  const { difficultyLevels, figureTypes, sportCategories, getDifficultyLabel, getFigureTypeLabel, getSportCategoryLabel } = useDictionary();

  const isCreateMode = !exerciseId;
  const [exercise, setExercise] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    instructions: "",
    difficulty_level: "",
    category: "",
    type: "",
    sport_category_id: "",
    image_url: "",
    video_url: "",
    audio_url: "",
    tags: [] as string[],
    synonyms: [] as string[],
    transition_from_figure_id: "",
    transition_to_figure_id: "",
    hold_time_seconds: 0,
    video_position: 'center' as 'center' | 'top' | 'bottom' | 'left' | 'right',
    play_video: true,
  });
  const [tagInput, setTagInput] = useState("");
  const [synonymInput, setSynonymInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dynamic categories from dictionary
  const categories = useMemo(() => {
    const baseCategories = [
      { value: "silks", label: "Szarfy" },
      { value: "hoop", label: "Aerial Hoop" },
      { value: "pole", label: "Pole Dance" },
      { value: "hammock", label: "Hamak" },
      { value: "core", label: "Core / Siła" },
      { value: "warm_up", label: "Rozgrzewka" },
      { value: "stretching", label: "Rozciąganie" },
    ];
    return baseCategories;
  }, []);

  useEffect(() => {
    const fetchExercise = async () => {
      if (!exerciseId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("figures")
          .select("*")
          .eq("id", exerciseId)
          .single();

        if (error) throw error;

        setExercise(data);
        setFormData({
          name: data.name || "",
          description: data.description || "",
          instructions: data.instructions || "",
          difficulty_level: data.difficulty_level || "",
          category: data.category || "",
          type: data.type || "",
          sport_category_id: data.sport_category_id || "",
          image_url: data.image_url || "",
          video_url: data.video_url || "",
          audio_url: data.audio_url || "",
          tags: data.tags || [],
          synonyms: data.synonyms || [],
          transition_from_figure_id: data.transition_from_figure_id || "",
          transition_to_figure_id: data.transition_to_figure_id || "",
          hold_time_seconds: data.hold_time_seconds || 0,
          video_position: (data.video_position || 'center') as 'center' | 'top' | 'bottom' | 'left' | 'right',
          play_video: data.play_video !== undefined ? data.play_video : true,
        });
      } catch (error: any) {
        console.error("Error fetching exercise:", error);
        toast({
          title: "Błąd",
          description: "Nie udało się załadować szczegółów ćwiczenia",
          variant: "destructive",
        });
        navigate("/library");
      } finally {
        setLoading(false);
      }
    };

    fetchExercise();
  }, [exerciseId, navigate, toast]);

  const validateForm = () => {
    try {
      exerciseSchema.parse({
        name: formData.name,
        description: formData.description,
        instructions: formData.instructions,
        difficulty_level: formData.difficulty_level,
        category: formData.category,
        type: formData.type,
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Błąd walidacji",
        description: "Sprawdź poprawność wprowadzonych danych",
        variant: "destructive",
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Błąd",
        description: "Musisz być zalogowany, aby zapisać ćwiczenie",
        variant: "destructive",
      });
      return;
    }

    if (!isCreateMode && !exercise) {
      return;
    }

    setIsLoading(true);

    try {
      let imageUrl = formData.image_url;
      let videoUrl = formData.video_url;
      let audioUrl = formData.audio_url;

      // Upload image if provided
      if (imageFile) {
        const imageExt = imageFile.name.split(".").pop();
        const imageName = `${Date.now()}.${imageExt}`;

        const { error: imageError } = await supabase.storage
          .from("posts")
          .upload(`figures/${imageName}`, imageFile);

        if (imageError) throw imageError;

        const { data: imageData } = supabase.storage
          .from("posts")
          .getPublicUrl(`figures/${imageName}`);

        imageUrl = imageData.publicUrl;
      }

      // Upload video if provided
      if (videoFile) {
        const videoExt = videoFile.name.split(".").pop();
        const videoName = `${Date.now()}.${videoExt}`;

        const { error: videoError } = await supabase.storage
          .from("posts")
          .upload(`figures/${videoName}`, videoFile);

        if (videoError) throw videoError;

        const { data: videoData } = supabase.storage
          .from("posts")
          .getPublicUrl(`figures/${videoName}`);

        videoUrl = videoData.publicUrl;
      }

      // Upload audio if provided
      if (audioFile) {
        const audioExt = audioFile.name.split(".").pop();
        const audioName = `${Date.now()}.${audioExt}`;

        const { error: audioError } = await supabase.storage
          .from("posts")
          .upload(`audio/${audioName}`, audioFile);

        if (audioError) throw audioError;

        const { data: audioData } = supabase.storage
          .from("posts")
          .getPublicUrl(`audio/${audioName}`);

        audioUrl = audioData.publicUrl;
      }

      // Normalize data before saving
      const saveData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        instructions: formData.instructions.trim() || null,
        difficulty_level: formData.difficulty_level?.toLowerCase() || null,
        category: formData.category || null,
        type: formData.type?.replace(/\s+/g, '_')?.toLowerCase() || null,
        sport_category_id: formData.sport_category_id || null,
        image_url: imageUrl || null,
        video_url: videoUrl || null,
        audio_url: audioUrl || null,
        tags: formData.tags.length > 0 ? formData.tags : null,
        synonyms: formData.synonyms.length > 0 ? formData.synonyms : null,
        premium: false, // Always false - premium is managed at sport path level
        transition_from_figure_id: formData.type === 'transitions' ? formData.transition_from_figure_id : null,
        transition_to_figure_id: formData.type === 'transitions' ? formData.transition_to_figure_id : null,
        hold_time_seconds: formData.hold_time_seconds > 0 ? formData.hold_time_seconds : null,
        video_position: formData.video_position,
        play_video: formData.play_video,
        ...(isCreateMode ? { created_by: user.id } : { updated_at: new Date().toISOString() }),
      };

      if (isCreateMode) {
        const { error, data } = await supabase
          .from("figures")
          .insert(saveData)
          .select()
          .single();

        if (error) throw error;

        // Add trainer as expert if applicable
        if (isTrainer && data) {
          await supabase.from("figure_experts").insert({
            figure_id: data.id,
            expert_user_id: user.id,
            added_by: user.id,
          });
        }

        toast({
          title: "Ćwiczenie utworzone",
          description: "Twoje ćwiczenie zostało pomyślnie utworzone.",
        });

        navigate(`/exercise/${data.id}`);
      } else {
        const { error } = await supabase
          .from("figures")
          .update(saveData)
          .eq("id", exercise.id)
          .select();

        if (error) throw error;

        toast({
          title: "Ćwiczenie zaktualizowane",
          description: "Twoje ćwiczenie zostało pomyślnie zaktualizowane.",
        });

        navigate(`/exercise/${exerciseId}`);
      }
    } catch (error: any) {
      console.error("Error saving exercise:", error);
      toast({
        title: "Błąd zapisu",
        description: error.message || "Nie udało się zapisać ćwiczenia. Spróbuj ponownie.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setFormData((prev) => ({ ...prev, image_url: "" }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setFormData((prev) => ({ ...prev, video_url: "" }));
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setFormData((prev) => ({ ...prev, audio_url: "" }));
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const addSynonym = () => {
    const synonym = synonymInput.trim();
    if (synonym && !formData.synonyms.includes(synonym)) {
      setFormData((prev) => ({
        ...prev,
        synonyms: [...prev.synonyms, synonym],
      }));
      setSynonymInput("");
    }
  };

  const removeSynonym = (synonymToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      synonyms: prev.synonyms.filter((synonym) => synonym !== synonymToRemove),
    }));
  };

  const handleSynonymKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSynonym();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isCreateMode && !exercise) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Nie znaleziono ćwiczenia</h2>
          <Button onClick={() => navigate("/library")}>
            Wróć do biblioteki
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {isCreateMode ? "Nowe ćwiczenie" : "Edycja ćwiczenia"}
              </h1>
              <p className="text-muted-foreground">
                {isCreateMode ? "Dodaj nowe ćwiczenie do biblioteki" : exercise?.name}
              </p>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !formData.name.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Zapisywanie...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Zapisz
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-foreground">Podstawowe informacje</CardTitle>
              <CardDescription>Wypełnij podstawowe dane ćwiczenia</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-foreground">
                  Nazwa ćwiczenia <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className={`bg-background/50 border-border/50 text-foreground ${errors.name ? 'border-destructive' : ''}`}
                  placeholder="Wpisz nazwę ćwiczenia"
                  maxLength={100}
                />
                {errors.name && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.name}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{formData.name.length}/100 znaków</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="difficulty" className="text-foreground">
                    Poziom trudności <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.difficulty_level}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, difficulty_level: value }))
                    }
                  >
                    <SelectTrigger className={`bg-background/50 border-border/50 text-foreground ${errors.difficulty_level ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Wybierz poziom" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">{getDifficultyLabel("beginner")}</SelectItem>
                      <SelectItem value="intermediate">{getDifficultyLabel("intermediate")}</SelectItem>
                      <SelectItem value="advanced">{getDifficultyLabel("advanced")}</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.difficulty_level && (
                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.difficulty_level}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="category" className="text-foreground">
                    Kategoria <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger className={`bg-background/50 border-border/50 text-foreground ${errors.category ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Wybierz kategorię" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.category}
                    </p>
                  )}
                </div>
              </div>

              {/* Hold Time - only for core category */}
              {formData.category === "core" && (
                <div>
                  <Label htmlFor="hold_time" className="text-foreground">
                    Domyślny czas trzymania (sekundy)
                  </Label>
                  <Input
                    id="hold_time"
                    type="number"
                    min="0"
                    value={formData.hold_time_seconds}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        hold_time_seconds: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="bg-background/50 border-border/50 text-foreground"
                    placeholder="Wpisz czas w sekundach (np. 30)"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Jak długo ćwiczenie powinno być trzymane? (0 = tryb zaliczenia)
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="type" className="text-foreground">
                  Typ <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger className={`bg-background/50 border-border/50 text-foreground ${errors.type ? 'border-destructive' : ''}`}>
                    <SelectValue placeholder="Wybierz typ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_figure">{getFigureTypeLabel("single_figure")}</SelectItem>
                    <SelectItem value="combo">{getFigureTypeLabel("combo")}</SelectItem>
                    <SelectItem value="warm_up">{getFigureTypeLabel("warm_up")}</SelectItem>
                    <SelectItem value="stretching">{getFigureTypeLabel("stretching")}</SelectItem>
                    {isAdmin && (
                      <SelectItem value="transitions">Przejścia</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.type}
                  </p>
                )}
              </div>

              {/* Sport Category - optional */}
              {sportCategories.length > 0 && (
                <div>
                  <Label htmlFor="sport_category" className="text-foreground">
                    Sport (opcjonalnie)
                  </Label>
                  <Select
                    value={formData.sport_category_id}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, sport_category_id: value === "none" ? "" : value }))
                    }
                  >
                    <SelectTrigger className="bg-background/50 border-border/50 text-foreground">
                      <SelectValue placeholder="Wybierz sport" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Brak</SelectItem>
                      {sportCategories.map((sport) => (
                        <SelectItem key={sport.id} value={sport.id}>
                          {sport.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">
                    Przypisz ćwiczenie do konkretnego sportu
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Media Upload */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-foreground">Media</CardTitle>
              <CardDescription>Dodaj zdjęcie, wideo lub audio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="image-upload" className="text-foreground">
                    Zdjęcie ćwiczenia <span className="text-destructive">*</span>
                  </Label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("image-upload")?.click()}
                        className="border-border/50 hover:bg-accent/50"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Wgraj zdjęcie
                      </Button>
                      {imageFile && (
                        <span className="text-sm text-muted-foreground truncate max-w-32">{imageFile.name}</span>
                      )}
                    </div>
                    {/* Image Preview */}
                    {(imagePreview || formData.image_url) && (
                      <div className="relative">
                        <img
                          src={imagePreview || formData.image_url}
                          alt="Podgląd ćwiczenia"
                          className="w-32 h-32 object-cover rounded-lg border border-border/50"
                        />
                        {imagePreview && (
                          <Badge className="absolute -top-2 -right-2 bg-green-500">Nowe</Badge>
                        )}
                      </div>
                    )}
                    {!imagePreview && !formData.image_url && (
                      <div className="w-32 h-32 rounded-lg border border-dashed border-border/50 flex items-center justify-center bg-muted/20">
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="video-upload" className="text-foreground">
                    Wideo ćwiczenia (opcjonalnie)
                  </Label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        id="video-upload"
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("video-upload")?.click()}
                        className="border-border/50 hover:bg-accent/50"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Wgraj wideo
                      </Button>
                      {videoFile && (
                        <span className="text-sm text-muted-foreground truncate max-w-32">{videoFile.name}</span>
                      )}
                    </div>
                    {(formData.video_url || videoFile) && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Video className="w-4 h-4" />
                        {videoFile ? "Nowe wideo wybrane" : "Wideo wgrane"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Audio Upload */}
                <div>
                  <Label htmlFor="audio-upload" className="text-foreground">
                    Instrukcje audio (opcjonalnie)
                  </Label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        id="audio-upload"
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("audio-upload")?.click()}
                        className="border-border/50 hover:bg-accent/50"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Wgraj audio
                      </Button>
                      {audioFile && (
                        <span className="text-sm text-muted-foreground truncate max-w-32">{audioFile.name}</span>
                      )}
                    </div>
                    {(formData.audio_url || audioFile) && (
                      <div className="text-sm text-green-600">
                        {audioFile ? "Nowe audio wybrane" : "Audio wgrane"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Video Settings - only when video exists */}
          {(formData.video_url || videoFile) && (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-foreground">Ustawienia wideo</CardTitle>
                <CardDescription>Skonfiguruj wyświetlanie wideo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="play_video" className="text-foreground">
                    Automatyczne odtwarzanie wideo
                  </Label>
                  <Switch
                    id="play_video"
                    checked={formData.play_video}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, play_video: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="video_position" className="text-foreground">
                    Pozycja kadrowania wideo
                  </Label>
                  <Select
                    value={formData.video_position}
                    onValueChange={(value: 'center' | 'top' | 'bottom' | 'left' | 'right') =>
                      setFormData({ ...formData, video_position: value })
                    }
                  >
                    <SelectTrigger id="video_position" className="bg-background/50 border-border/50 text-foreground">
                      <SelectValue placeholder="Wybierz pozycję" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="center">Środek</SelectItem>
                      <SelectItem value="top">Góra</SelectItem>
                      <SelectItem value="bottom">Dół</SelectItem>
                      <SelectItem value="left">Lewo</SelectItem>
                      <SelectItem value="right">Prawo</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Określa, która część wideo jest widoczna przy kadrowaniu do kwadratu
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content Details - visible for all users */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-foreground">Szczegóły treści</CardTitle>
              <CardDescription>Dodaj opis, instrukcje i tagi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="description" className="text-foreground">
                  Opis (opcjonalnie)
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className={`bg-background/50 border-border/50 text-foreground ${errors.description ? 'border-destructive' : ''}`}
                  placeholder="Krótki opis ćwiczenia"
                  rows={3}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground mt-1">{formData.description.length}/1000 znaków</p>
              </div>

              <div>
                <Label htmlFor="instructions" className="text-foreground">
                  Instrukcje wykonania (opcjonalnie)
                </Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      instructions: e.target.value,
                    }))
                  }
                  className="bg-background/50 border-border/50 text-foreground"
                  placeholder="Krok po kroku instrukcje jak wykonać ćwiczenie"
                  rows={4}
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground mt-1">{formData.instructions.length}/2000 znaków</p>
              </div>

              <div>
                <Label htmlFor="tags" className="text-foreground">
                  Tagi (opcjonalnie)
                </Label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      id="tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="bg-background/50 border-border/50 text-foreground"
                      placeholder="Dodaj tag i naciśnij Enter"
                    />
                    <Button
                      type="button"
                      onClick={addTag}
                      variant="outline"
                      className="border-border/50 hover:bg-accent/50"
                    >
                      Dodaj
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-destructive/20"
                        onClick={() => removeTag(tag)}
                      >
                        {tag} ✕
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="synonyms" className="text-foreground">
                  Synonimy (opcjonalnie)
                </Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Alternatywne nazwy tego ćwiczenia
                </p>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      id="synonyms"
                      value={synonymInput}
                      onChange={(e) => setSynonymInput(e.target.value)}
                      onKeyPress={handleSynonymKeyPress}
                      className="bg-background/50 border-border/50 text-foreground"
                      placeholder="Dodaj synonim i naciśnij Enter"
                    />
                    <Button
                      type="button"
                      onClick={addSynonym}
                      variant="outline"
                      className="border-border/50 hover:bg-accent/50"
                    >
                      Dodaj
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.synonyms.map((synonym, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="cursor-pointer hover:bg-destructive/20"
                        onClick={() => removeSynonym(synonym)}
                      >
                        {synonym} ✕
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Foundational Exercises - only in edit mode */}
          {!isCreateMode && exercise && (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-foreground">Ćwiczenia podstawowe</CardTitle>
                <CardDescription>Jakie ćwiczenia należy opanować przed tym?</CardDescription>
              </CardHeader>
              <CardContent>
                <PrerequisiteExercisesManager figureId={exercise.id} />
              </CardContent>
            </Card>
          )}

          {/* Similar Exercises - only in edit mode */}
          {!isCreateMode && exercise && (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-foreground">Podobne ćwiczenia</CardTitle>
                <CardDescription>Powiązane ćwiczenia o podobnej tematyce</CardDescription>
              </CardHeader>
              <CardContent>
                <SimilarExercisesManager figureId={exercise.id} />
              </CardContent>
            </Card>
          )}

          {/* Info for create mode about related exercises */}
          {isCreateMode && (
            <Card className="border-border/30 bg-muted/20">
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground text-center">
                  💡 Po zapisaniu ćwiczenia będziesz mógł dodać ćwiczenia podstawowe i podobne
                </p>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons - Mobile Sticky */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-card/90 backdrop-blur-sm border-t border-border/50">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(isCreateMode ? "/trainer/my-exercises" : `/exercise/${exerciseId}`)}
                className="flex-1"
              >
                Anuluj
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !formData.name.trim()}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Zapisywanie...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Zapisz
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Add bottom padding for mobile sticky buttons */}
        <div className="md:hidden h-20"></div>
      </div>
    </div>
  );
};

export default EditExercise;
