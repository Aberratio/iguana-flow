import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Calendar,
  Plus,
  Save,
  Globe,
  X,
  Award,
  CalendarDays,
  ArrowLeft,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import ExerciseManagement from "@/components/ExerciseManagement";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { BulkDayCreator } from "@/components/BulkDayCreator";
import { useUserRole } from "@/hooks/useUserRole";
import { useDictionary } from "@/contexts/DictionaryContext";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
}

interface Exercise {
  id: string;
  figure_id: string;
  order_index: number;
  sets?: number;
  reps?: number;
  hold_time_seconds?: number;
  rest_time_seconds?: number;
  notes?: string;
  play_video?: boolean;
  video_position?: "center" | "top" | "bottom" | "left" | "right";
  figure?: {
    id: string;
    name: string;
    difficulty_level: string;
    category: string;
  };
}

interface TrainingDay {
  id?: string;
  date: Date;
  title: string;
  description: string;
  exercises: Exercise[];
  isRestDay?: boolean;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  created_by: string;
  difficulty_level?: string;
  image_url?: string;
  premium?: boolean;
}

interface ChallengeTrainingDay {
  id: string;
  day_number: number;
  title?: string;
  description?: string;
  is_rest_day?: boolean;
  training_day_exercises?: TrainingDayExercise[];
  duration_seconds?: number;
}

interface TrainingDayExercise {
  id: string;
  figure_id: string;
  order_index: number;
  sets?: number;
  reps?: number;
  hold_time_seconds?: number;
  rest_time_seconds?: number;
  notes?: string;
  play_video?: boolean;
  video_position?: "center" | "top" | "bottom" | "left" | "right";
  figure?: {
    id: string;
    name: string;
    difficulty_level: string;
    category: string;
  };
}

interface ChallengeAchievement {
  id: string;
  challenge_id: string;
  achievement_id: string;
}

const EditChallenge = () => {
  const { challengeId } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [level, setLevel] = useState<number>(1);
  const [difficultyLevel, setDifficultyLevel] = useState("intermediate");
  const [type, setType] = useState("manual");
  const [isPublished, setIsPublished] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [priceUsd, setPriceUsd] = useState(999); // $9.99 in cents
  const [pricePln, setPricePln] = useState(3999); // 39.99 PLN in cents
  const [selectedAchievements, setSelectedAchievements] = useState<string[]>(
    []
  );
  const [trainingDays, setTrainingDays] = useState<TrainingDay[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [collapsedDays, setCollapsedDays] = useState<Set<number>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveProgress, setSaveProgress] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    trainingDays?: string;
    image?: string;
  }>({});
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin, isTrainer } = useUserRole();
  const { difficultyLevels, getDifficultyLabel } = useDictionary();

  useEffect(() => {
    if (challengeId) {
      fetchChallengeData();
      fetchAchievements();
    }
  }, [challengeId]);

  // Validate user access after challenge is loaded
  useEffect(() => {
    if (challenge && user) {
      const canEdit = isAdmin || 
                     (isTrainer && user.id === challenge.created_by);
      
      if (!canEdit) {
        toast({
          title: "Brak dostępu",
          description: "Nie masz uprawnień do edycji tego wyzwania.",
          variant: "destructive",
        });
        navigate("/trainer/my-challenges");
      }
    }
  }, [challenge, user, isAdmin, isTrainer]);


  const fetchChallengeData = async () => {
    try {
      setIsLoadingData(true);

      // Fetch challenge with related data
      const { data: challengeData, error: challengeError } = await supabase
        .from("challenges")
        .select(
          `
          *,
          challenge_achievements (
            achievement_id
          ),
          challenge_training_days (
            id, day_number, title, description,
            training_day_exercises (
              *,
              figure:figures (
                id, name, difficulty_level, category
              )
            )
          )
        `
        )
        .eq("id", challengeId)
        .single();

      if (challengeError) throw challengeError;

      setChallenge(challengeData);
      setTitle(challengeData.title);
      setDescription(challengeData.description || "");
      setStartDate(new Date(challengeData.start_date));
      setEndDate(new Date(challengeData.end_date));
      setLevel(challengeData.level || 1);
      setDifficultyLevel(challengeData.difficulty_level || "intermediate");
      setType(challengeData.type || "manual");
      setImageUrl(challengeData.image_url || "");
      setIsPublished(challengeData.status === "published");
      setIsPremium(challengeData.premium || false);
      setPriceUsd(challengeData.price_usd || 999);
      setPricePln(challengeData.price_pln || 3999);

      // Set selected achievements
      setSelectedAchievements(
        challengeData.challenge_achievements?.map(
          (ca: ChallengeAchievement) => ca.achievement_id
        ) || []
      );

      // Set training days with exercises - sort by day_number
      const formattedTrainingDays =
        challengeData.challenge_training_days
          ?.sort(
            (a: ChallengeTrainingDay, b: ChallengeTrainingDay) =>
              a.day_number - b.day_number
          )
          ?.map((day: ChallengeTrainingDay) => ({
            id: day.id,
            date: startDate
              ? new Date(
                  startDate.getTime() +
                    (day.day_number - 1) * 24 * 60 * 60 * 1000
                )
              : new Date(),
            title: day.title || "",
            description: day.description || "",
            isRestDay: day.is_rest_day || false,
            exercises:
              day.training_day_exercises?.map((ex: TrainingDayExercise) => ({
                id: ex.id,
                figure_id: ex.figure_id,
                order_index: ex.order_index,
                sets: ex.sets,
                reps: ex.reps,
                hold_time_seconds: ex.hold_time_seconds,
                rest_time_seconds: ex.rest_time_seconds,
                notes: ex.notes,
                play_video: ex.play_video,
                video_position: ex.video_position,
                figure: ex.figure,
              })) || [],
          })) || [];

      setTrainingDays(formattedTrainingDays);

      // Set all training days to be collapsed by default
      const allDayIndices = new Set(
        formattedTrainingDays.map((_, index) => index)
      );
      setCollapsedDays(allDayIndices);
    } catch (error) {
      console.error("Error fetching challenge:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      
      toast({
        title: "Błąd ładowania wyzwania",
        description: error instanceof Error ? error.message : "Nie udało się załadować danych. Sprawdź konsolę.",
        variant: "destructive",
      });
      
      // Don't redirect immediately - allow user to see the error
      setChallenge(null);
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("rule_type", "challenges_completed")
        .order("name");

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error("Error fetching achievements:", error);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `challenges/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("challenges")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from("challenges")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  };

  const validateForm = (isPublishing: boolean = false) => {
    const newErrors: typeof errors = {};
    
    if (!title.trim()) {
      newErrors.title = "Tytuł jest wymagany";
    } else if (title.length > 100) {
      newErrors.title = "Tytuł jest za długi (max 100 znaków)";
    }
    
    if (description && description.length > 1000) {
      newErrors.description = "Opis jest za długi (max 1000 znaków)";
    }
    
    // Training days required ONLY when publishing
    if (isPublishing && trainingDays.length === 0) {
      newErrors.trainingDays = "Do publikacji wymagany jest co najmniej jeden dzień treningowy";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveChallenge = async () => {
    if (!user || !challenge) return;

    // Validate form - pass isPublished flag to check training days only when publishing
    if (!validateForm(isPublished)) {
      toast({
        title: "Błąd walidacji",
        description: "Popraw błędy w formularzu.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    let currentStep = "Starting";

    try {
      // Step 1: Upload image if needed
      let uploadedImageUrl = imageUrl;
      if (imageFile) {
        currentStep = "Przesyłanie zdjęcia";
        setSaveProgress("Przesyłanie zdjęcia wyzwania...");
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          uploadedImageUrl = uploadedUrl;
          setImageUrl(uploadedUrl);
        } else {
          throw new Error("Nie udało się przesłać zdjęcia");
        }
      }

      // Step 2: Update challenge details
      currentStep = "Aktualizacja danych";
      setSaveProgress("Aktualizacja szczegółów wyzwania...");
      const { error: updateError } = await supabase
        .from("challenges")
        .update({
          title: title.trim(),
          description: description.trim() || null,
          start_date: null, // Dates are now optional
          end_date: null,
          level: level,
          difficulty_level: difficultyLevel,
          type: type,
          image_url: uploadedImageUrl || null,
          status: isPublished ? "published" : "draft",
          premium: false, // Challenges are always free - only sport paths are paid
          price_usd: null,
          price_pln: null,
        })
        .eq("id", challengeId);

      if (updateError) {
        console.error("Błąd aktualizacji:", updateError);
        throw new Error(`Błąd bazy danych: ${updateError.message}`);
      }

      // Step 3: Save achievements
      currentStep = "Zapisywanie osiągnięć";
      setSaveProgress("Zapisywanie osiągnięć...");
      await saveAchievements();

      // Step 4: Save training days
      currentStep = "Zapisywanie dni treningowych";
      setSaveProgress(`Zapisywanie ${trainingDays.length} dni treningowych...`);
      await saveTrainingDays();

      setSaveProgress(null);
      toast({
        title: "Zapisano",
        description: `Wyzwanie "${title}" zostało zaktualizowane.`,
      });

      navigate("/trainer/my-challenges");
    } catch (error: any) {
      console.error("Error updating challenge:", {
        step: currentStep,
        error,
        challengeData: { 
          title, 
          description, 
          level, 
          difficultyLevel,
          trainingDaysCount: trainingDays.length 
        }
      });
      
      setSaveProgress(null);
      toast({
        title: `Błąd: ${currentStep}`,
        description: error.message || "Nie udało się zaktualizować wyzwania. Sprawdź konsolę.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveAchievements = async () => {
    if (!challengeId) return;
    
    // Delete existing achievements
    const { error: deleteError } = await supabase
      .from("challenge_achievements")
      .delete()
      .eq("challenge_id", challengeId);

    if (deleteError) throw new Error(`Nie udało się usunąć starych osiągnięć: ${deleteError.message}`);

    // Insert new achievements
    if (selectedAchievements.length > 0) {
      const achievementData = selectedAchievements.map((achievementId) => ({
        challenge_id: challengeId,
        achievement_id: achievementId,
      }));

      const { error: insertError } = await supabase
        .from("challenge_achievements")
        .insert(achievementData);

      if (insertError) throw new Error(`Nie udało się zapisać osiągnięć: ${insertError.message}`);
    }
  };

  const saveTrainingDays = async () => {
    if (!challengeId) return;
    
    // SMART UPDATE: Fetch existing days to preserve their IDs (prevents orphaning user progress)
    const { data: existingDays, error: fetchError } = await supabase
      .from("challenge_training_days")
      .select("id, day_number")
      .eq("challenge_id", challengeId)
      .order("day_number");

    if (fetchError) throw new Error(`Nie udało się pobrać istniejących dni: ${fetchError.message}`);

    const existingDaysByNumber = new Map<number, string>();
    existingDays?.forEach(d => existingDaysByNumber.set(d.day_number, d.id));

    const processedDayNumbers = new Set<number>();

    // Process each training day: UPDATE existing or INSERT new
    for (let i = 0; i < trainingDays.length; i++) {
      const day = trainingDays[i];
      const dayNumber = i + 1;
      const durationSeconds = day.isRestDay ? 0 : calculateTrainingDayDuration(day.exercises);
      
      processedDayNumbers.add(dayNumber);
      
      // Check if this day_number already exists (preserving its ID)
      const existingDayId = day.id || existingDaysByNumber.get(dayNumber);

      let trainingDayId: string;

      if (existingDayId) {
        // UPDATE existing day (preserves ID and user progress references!)
        const { error: updateError } = await supabase
          .from("challenge_training_days")
          .update({
            title: day.title,
            description: day.description,
            is_rest_day: day.isRestDay || false,
            duration_seconds: durationSeconds,
          })
          .eq("id", existingDayId);

        if (updateError) {
          console.error(`Błąd aktualizacji dnia treningowego ${dayNumber}:`, updateError);
          throw new Error(`Nie udało się zaktualizować dnia ${dayNumber}: ${updateError.message}`);
        }
        
        trainingDayId = existingDayId;

        // Delete existing exercises for this day (will re-insert)
        await supabase
          .from("training_day_exercises")
          .delete()
          .eq("training_day_id", trainingDayId);
      } else {
        // INSERT new day
        const { data: trainingDayData, error: dayError } = await supabase
          .from("challenge_training_days")
          .insert({
            challenge_id: challengeId,
            day_number: dayNumber,
            title: day.title,
            description: day.description,
            is_rest_day: day.isRestDay || false,
            duration_seconds: durationSeconds,
          })
          .select()
          .single();

        if (dayError) {
          console.error(`Błąd dodawania dnia treningowego ${dayNumber}:`, dayError);
          throw new Error(`Nie udało się dodać dnia ${dayNumber}: ${dayError.message}`);
        }
        
        trainingDayId = trainingDayData.id;
      }

      // Save exercises for this day
      if (day.exercises && day.exercises.length > 0) {
        const exerciseData = day.exercises.map((exercise, index) => ({
          training_day_id: trainingDayId,
          figure_id: exercise.figure_id,
          order_index: exercise.order_index || index,
          sets: exercise.sets,
          reps: exercise.reps,
          hold_time_seconds: exercise.hold_time_seconds,
          rest_time_seconds: exercise.rest_time_seconds,
          notes: exercise.notes,
          play_video: exercise.play_video !== undefined ? exercise.play_video : true,
          video_position: exercise.video_position || "center",
        }));

        const { error: exerciseError } = await supabase
          .from("training_day_exercises")
          .insert(exerciseData);

        if (exerciseError) throw new Error(`Nie udało się zapisać ćwiczeń dla dnia ${dayNumber}: ${exerciseError.message}`);
      }
    }

    // Handle days that were removed from the editor
    // Only delete days that have no user progress (safety check)
    for (const [dayNumber, dayId] of existingDaysByNumber) {
      if (!processedDayNumbers.has(dayNumber)) {
        // Check if this day has user progress
        const { count, error: countError } = await supabase
          .from("challenge_day_progress")
          .select("id", { count: "exact", head: true })
          .eq("training_day_id", dayId);

        if (countError) {
          console.error(`Błąd sprawdzania progresu dla dnia ${dayNumber}:`, countError);
        }

        if (count && count > 0) {
          // Day has user progress - warn admin but DON'T delete
          toast({
            title: "Uwaga",
            description: `Dzień ${dayNumber} ma ${count} rekordów progresu użytkowników i nie został usunięty. Usunięcie skutkowałoby utratą danych uczestników.`,
            variant: "destructive",
          });
        } else {
          // Safe to delete - no user progress
          const { error: deleteError } = await supabase
            .from("challenge_training_days")
            .delete()
            .eq("id", dayId);

          if (deleteError) {
            console.error(`Błąd usuwania dnia ${dayNumber}:`, deleteError);
          }
        }
      }
    }
  };

  // Function to calculate duration for a training day
  const calculateTrainingDayDuration = (exercises: Exercise[]) => {
    if (!exercises || exercises.length === 0) return 0;

    let totalDuration = 0;
    exercises.forEach((exercise) => {
      const sets = exercise.sets || 1;
      const holdTime = exercise.hold_time_seconds || 30;
      const restTime = exercise.rest_time_seconds || 15;
      totalDuration += sets * (holdTime + restTime);
    });

    return totalDuration;
  };

  const deleteChallenge = async () => {
    if (!challengeId) return;

    setIsDeleting(true);

    try {
      // Delete the challenge (this will cascade delete related data)
      const { error } = await supabase
        .from("challenges")
        .delete()
        .eq("id", challengeId);

      if (error) throw error;

      toast({
        title: "Usunięto",
        description: "Wyzwanie zostało usunięte.",
      });

      navigate("/trainer/my-challenges");
    } catch (error) {
      console.error("Błąd usuwania wyzwania:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć wyzwania.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const addTrainingDay = () => {
    // Calculate next date based on last training day or start date
    let nextDate = new Date();
    if (trainingDays.length > 0) {
      const lastDate = trainingDays[trainingDays.length - 1].date;
      nextDate = new Date(lastDate.getTime() + 24 * 60 * 60 * 1000); // Add 1 day
    } else if (startDate) {
      nextDate = new Date(startDate);
    }

    const newDay = {
      date: nextDate,
      title: `Dzień ${trainingDays.length + 1}`,
      description: "",
      exercises: [],
      isRestDay: false,
    };
    setTrainingDays([...trainingDays, newDay as TrainingDay]);
  };

  const removeTrainingDay = (index: number) => {
    setTrainingDays(trainingDays.filter((_, i) => i !== index));
  };

  const updateTrainingDay = (
    index: number,
    field: keyof TrainingDay,
    value: string | Date | boolean | Exercise[]
  ) => {
    const updated = [...trainingDays];
    const updatedDay = { ...updated[index], [field]: value };
    
    // If setting isRestDay to true, clear exercises
    if (field === 'isRestDay' && value === true) {
      updatedDay.exercises = [];
    }
    
    updated[index] = updatedDay;
    setTrainingDays(updated);
  };

  const toggleAchievement = (achievementId: string) => {
    setSelectedAchievements((prev) =>
      prev.includes(achievementId)
        ? prev.filter((id) => id !== achievementId)
        : [...prev, achievementId]
    );
  };

  const toggleCollapsedDay = (index: number) => {
    setCollapsedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const moveTrainingDay = (fromIndex: number, toIndex: number) => {
    const updatedDays = [...trainingDays];
    const [movedDay] = updatedDays.splice(fromIndex, 1);
    updatedDays.splice(toIndex, 0, movedDay);
    setTrainingDays(updatedDays);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData("text/plain"));
    if (dragIndex !== dropIndex) {
      moveTrainingDay(dragIndex, dropIndex);
    }
  };

  if (isLoadingData) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-foreground">Ładowanie wyzwania...</div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-foreground text-xl mb-4">Nie znaleziono wyzwania</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div>
            <h1 className="text-3xl font-bold">Edycja wyzwania</h1>
            <p className="text-muted-foreground">
              Wprowadź zmiany w swoim wyzwaniu
            </p>
          </div>
        </div>

        <div className="bg-black/50 backdrop-blur-lg rounded-lg border border-white/10 p-3 sm:p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Tytuł wyzwania *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) {
                    setErrors(prev => ({ ...prev, title: undefined }));
                  }
                }}
                placeholder="Wprowadź tytuł wyzwania"
                maxLength={100}
                className={cn(errors.title && "border-destructive")}
              />
              {errors.title && (
                <p className="text-destructive text-sm mt-1">{errors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Opis</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) {
                    setErrors(prev => ({ ...prev, description: undefined }));
                  }
                }}
                placeholder="Opisz swoje wyzwanie..."
                rows={4}
                maxLength={1000}
                className={cn(errors.description && "border-destructive")}
              />
              {errors.description && (
                <p className="text-destructive text-sm mt-1">{errors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">
                Poziom
              </Label>
              <Input
                id="level"
                type="number"
                min="1"
                value={level}
                onChange={(e) => setLevel(parseInt(e.target.value) || 1)}
                placeholder="Wprowadź poziom wyzwania"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Poziom trudności</Label>
              <Select
                value={difficultyLevel}
                onValueChange={setDifficultyLevel}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz poziom trudności" />
                </SelectTrigger>
                <SelectContent>
                  {difficultyLevels.map((lvl) => (
                    <SelectItem key={lvl.key} value={lvl.key}>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          lvl.key === "beginner" && "bg-green-500",
                          lvl.key === "intermediate" && "bg-yellow-500",
                          lvl.key === "advanced" && "bg-red-500"
                        )} />
                        {lvl.name_pl}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Typ wyzwania</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz typ wyzwania" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      Manualny
                    </div>
                  </SelectItem>
                  <SelectItem value="timer">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      Czasowy
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Zdjęcie wyzwania</Label>
              <div className="space-y-2">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                    }
                  }}
                  className="cursor-pointer"
                />
                <div className="text-xs text-muted-foreground">
                  {imageFile
                    ? `Wybrano: ${imageFile.name}`
                    : imageUrl
                    ? "Aktualne zdjęcie przesłane"
                    : "Nie wybrano pliku"}
                </div>
              </div>
              {imageUrl && (
                <div className="mt-2">
                  <img
                    src={imageUrl}
                    alt="Challenge preview"
                    className="w-32 h-20 object-cover rounded-md border"
                  />
                </div>
              )}
            </div>

            {/* Status publikacji */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-lg font-semibold">
                  Status publikacji
                </Label>
                <div className="flex items-center space-x-3 p-4 border rounded-lg">
                  <Switch
                    checked={isPublished}
                    onCheckedChange={setIsPublished}
                  />
                  <div className="flex-1">
                    <div className="font-medium">
                      {isPublished ? "Opublikowane" : "Szkic"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {isPublished
                        ? "Wyzwanie jest widoczne dla wszystkich użytkowników"
                        : "Wyzwanie jest widoczne tylko dla administratorów"}
                    </div>
                  </div>
                  <Badge variant={isPublished ? "default" : "secondary"}>
                    {isPublished ? "Opublikowane" : "Szkic"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Sekcja osiągnięć */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-400" />
                <Label className="text-lg font-semibold">
                  Osiągnięcia wyzwania
                </Label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-40 overflow-y-auto border rounded-lg p-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex items-center space-x-3"
                  >
                    <Checkbox
                      id={achievement.id}
                      checked={selectedAchievements.includes(achievement.id)}
                      onCheckedChange={() => toggleAchievement(achievement.id)}
                    />
                    <Label
                      htmlFor={achievement.id}
                      className="flex-1 text-sm cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span>{achievement.icon}</span>
                        <div>
                          <div className="font-medium">{achievement.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {achievement.points} pkt
                          </div>
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Training Days Section */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                  <div>
                    <Label className="text-lg sm:text-xl font-bold">
                      Dni treningowe ({trainingDays.length})
                    </Label>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Zaprojektuj harmonogram wyzwania
                    </p>
                    {errors.trainingDays && (
                      <p className="text-destructive text-sm mt-1">{errors.trainingDays}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <BulkDayCreator
                    trainingDays={trainingDays}
                    onUpdateDays={setTrainingDays}
                  />
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={addTrainingDay}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 flex-1 sm:flex-initial"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-sm">Dodaj dzień</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                {trainingDays.map((day, index) => {
                  const isCollapsed = collapsedDays.has(index);

                  return (
                    <Collapsible
                      key={index}
                      open={!isCollapsed}
                      onOpenChange={() => toggleCollapsedDay(index)}
                    >
                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, index)}
                        className="bg-card/50 border-2 border-border/50 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-200 cursor-move"
                      >
                        {/* Day Header */}
                        <CollapsibleTrigger asChild>
                          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b border-border/50 cursor-pointer hover:bg-primary/15 transition-colors">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4 flex-1">
                                  <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                                    <GripVertical className="w-5 h-5" />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {isCollapsed ? (
                                      <ChevronRight className="w-5 h-5 text-muted-foreground transition-transform" />
                                    ) : (
                                      <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform" />
                                    )}
                                  </div>
                                  <Badge variant={day.isRestDay ? "secondary" : "default"} className="text-sm px-3 py-1">
                                    Dzień {index + 1}/{trainingDays.length}
                                  </Badge>
                                  <div className="flex-1">
                                    <h3 className="text-lg font-bold">
                                      {day.title || `Dzień ${index + 1}`}
                                    </h3>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                      <span>{day.exercises.length} {day.exercises.length === 1 ? 'ćwiczenie' : day.exercises.length < 5 ? 'ćwiczenia' : 'ćwiczeń'}</span>
                                      {/* Progress indicator */}
                                      <div className={cn(
                                        "w-2 h-2 rounded-full",
                                        day.exercises.length === 0 ? "bg-red-500" :
                                        day.exercises.length < 3 ? "bg-yellow-500" :
                                        "bg-green-500"
                                      )} />
                                    </div>
                                  </div>
                                  {day.isRestDay && (
                                    <Badge
                                      variant="secondary"
                                      className="text-sm px-3 py-1"
                                    >
                                      😴 Odpoczynek
                                    </Badge>
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeTrainingDay(index);
                                  }}
                                  className="hover:bg-destructive/20 hover:text-destructive hover:border-destructive/50"
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Usuń
                                </Button>
                              </div>
                          </div>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div className="space-y-3">
                                <Label className="text-sm font-semibold text-foreground">
                                  Tytuł
                                </Label>
                                <Input
                                  placeholder="np. Górne partie ciała, Trening core"
                                  value={day.title}
                                  onChange={(e) =>
                                    updateTrainingDay(
                                      index,
                                      "title",
                                      e.target.value
                                    )
                                  }
                                  className="h-11 bg-background/50 border-border/50"
                                />
                              </div>

                              <div className="space-y-3">
                                <Label className="text-sm font-semibold text-foreground">
                                  Data
                                </Label>
                                <div className="px-3 py-2 border rounded-md bg-muted h-11 flex items-center">
                                  <Calendar className="mr-3 h-5 w-5" />
                                  <span className="text-sm">
                                    {day.date ? format(day.date, "dd.MM.yyyy") : "Data zostanie ustawiona automatycznie"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-6 space-y-3">
                              <Label className="text-sm font-semibold text-foreground">
                                Opis
                              </Label>
                              <Textarea
                                placeholder="Opisz na czym skupia się ten dzień treningowy..."
                                value={day.description}
                                onChange={(e) =>
                                  updateTrainingDay(
                                    index,
                                    "description",
                                    e.target.value
                                  )
                                }
                                rows={3}
                                className="resize-none bg-background/50 border-border/50"
                              />
                            </div>

                            <div className="mt-6 flex items-center justify-between p-4 bg-background/30 rounded-lg border border-border/30">
                              <div className="flex items-center gap-4">
                                <Label className="text-sm font-semibold">
                                  Typ dnia:
                                </Label>
                                <div className="flex items-center space-x-3">
                                  <Switch
                                    checked={day.isRestDay || false}
                                    onCheckedChange={(checked) =>
                                      updateTrainingDay(
                                        index,
                                        "isRestDay",
                                        checked
                                      )
                                    }
                                  />
                                  <span className="text-sm font-medium">
                                    {day.isRestDay
                                      ? "Dzień odpoczynku"
                                      : "Dzień treningowy"}
                                  </span>
                                </div>
                              </div>
                              {!day.isRestDay && (
                                <Badge
                                  variant="outline"
                                  className="text-sm px-3 py-1"
                                >
                                  {day.exercises?.length || 0} {(day.exercises?.length || 0) === 1 ? 'ćwiczenie' : (day.exercises?.length || 0) < 5 ? 'ćwiczenia' : 'ćwiczeń'}
                                </Badge>
                              )}
                            </div>

                            {/* Zawartość dnia */}
                            <div className="mt-6">
                              {day.isRestDay ? (
                                <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border/50 rounded-lg bg-blue-500/5">
                                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <span className="text-3xl">😴</span>
                                  </div>
                                  <h4 className="font-semibold text-lg mb-2">
                                    Dzień odpoczynku i regeneracji
                                  </h4>
                                  <p className="text-sm">
                                    Brak ćwiczeń - czas na odpoczynek i regenerację ciała!
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  <div className="flex items-center gap-3 pb-3 border-b border-border/30">
                                    <CalendarDays className="w-5 h-5 text-primary" />
                                    <h4 className="text-lg font-semibold">
                                      Ćwiczenia na ten dzień
                                    </h4>
                                  </div>
                                  <ExerciseManagement
                                    trainingDayId={day.id || `temp-${index}`}
                                    exercises={day.exercises}
                                    onExercisesChange={(exercises) =>
                                      updateTrainingDay(
                                        index,
                                        "exercises",
                                        exercises
                                      )
                                    }
                                    canEdit={true}
                                    challengeType={type}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}

                {trainingDays.length === 0 && (
                  <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-border/50 rounded-xl bg-muted/20">
                    <CalendarDays className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">
                      Brak dni treningowych
                    </h3>
                    <p className="text-sm mb-6">
                      Zacznij tworzyć wyzwanie dodając dni treningowe
                    </p>
                    <Button
                      type="button"
                      onClick={addTrainingDay}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Dodaj pierwszy dzień
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border/50 p-3 sm:p-6 mt-6 rounded-lg">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/trainer/my-challenges")}
            disabled={isLoading}
            className="w-full sm:w-auto order-3 sm:order-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anuluj
          </Button>
          <Button
            type="button"
            onClick={saveChallenge}
            disabled={isLoading}
            className="w-full sm:flex-1 order-1 sm:order-2"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? (saveProgress || "Zapisywanie...") : "Zapisz zmiany"}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setShowDeleteModal(true)}
            disabled={isLoading}
            className="w-full sm:w-auto order-2 sm:order-3"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Usuń
          </Button>
        </div>
      </div>

      {/* Save Progress Indicator */}
      {saveProgress && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground p-4 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            <span className="font-medium">{saveProgress}</span>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={deleteChallenge}
        title="Usuń wyzwanie"
        description="Czy na pewno chcesz usunąć to wyzwanie? Tej akcji nie można cofnąć. Zostaną usunięte wszystkie dni treningowe i postępy uczestników."
        isLoading={isDeleting}
      />
    </div>
  );
};

export default EditChallenge;
