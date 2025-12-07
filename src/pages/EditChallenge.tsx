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
import RedemptionCodeManagement from "@/components/RedemptionCodeManagement";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { BulkDayCreator } from "@/components/BulkDayCreator";

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

  useEffect(() => {
    if (challengeId) {
      fetchChallengeData();
      fetchAchievements();
    }
  }, [challengeId]);

  // Validate user access after challenge is loaded
  useEffect(() => {
    if (challenge && user) {
      const canEdit = user.role === 'admin' || 
                     (user.role === 'trainer' && user.id === challenge.created_by);
      
      if (!canEdit) {
        toast({
          title: "Access denied",
          description: "You don't have permission to edit this challenge.",
          variant: "destructive",
        });
        navigate("/challenges");
      }
    }
  }, [challenge, user]);


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
        title: "Error loading challenge",
        description: error instanceof Error ? error.message : "Failed to load challenge data. Check console for details.",
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
      newErrors.title = "Title is required";
    } else if (title.length > 100) {
      newErrors.title = "Title is too long (max 100 characters)";
    }
    
    if (description && description.length > 1000) {
      newErrors.description = "Description is too long (max 1000 characters)";
    }
    
    // Training days required ONLY when publishing
    if (isPublishing && trainingDays.length === 0) {
      newErrors.trainingDays = "At least one training day is required for publishing";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveChallenge = async () => {
    if (!user || !challenge) return;

    // Validate form - pass isPublished flag to check training days only when publishing
    if (!validateForm(isPublished)) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form.",
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
        currentStep = "Uploading image";
        setSaveProgress("Uploading challenge image...");
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          uploadedImageUrl = uploadedUrl;
          setImageUrl(uploadedUrl);
        } else {
          throw new Error("Failed to upload image");
        }
      }

      // Step 2: Update challenge details
      currentStep = "Updating challenge details";
      setSaveProgress("Updating challenge details...");
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
          premium: isPremium,
          price_usd: isPremium ? priceUsd : null,
          price_pln: isPremium ? pricePln : null,
        })
        .eq("id", challengeId);

      if (updateError) {
        console.error("Update error details:", updateError);
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      // Step 3: Save achievements
      currentStep = "Saving achievements";
      setSaveProgress("Saving achievements...");
      await saveAchievements();

      // Step 4: Save training days
      currentStep = "Saving training days";
      setSaveProgress(`Saving ${trainingDays.length} training days...`);
      await saveTrainingDays();

      setSaveProgress(null);
      toast({
        title: "Success",
        description: `Challenge "${title}" updated successfully.`,
      });

      navigate("/challenges");
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
        title: `Error at step: ${currentStep}`,
        description: error.message || "Failed to update challenge. Check console for details.",
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

    if (deleteError) throw new Error(`Failed to delete old achievements: ${deleteError.message}`);

    // Insert new achievements
    if (selectedAchievements.length > 0) {
      const achievementData = selectedAchievements.map((achievementId) => ({
        challenge_id: challengeId,
        achievement_id: achievementId,
      }));

      const { error: insertError } = await supabase
        .from("challenge_achievements")
        .insert(achievementData);

      if (insertError) throw new Error(`Failed to insert achievements: ${insertError.message}`);
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

    if (fetchError) throw new Error(`Failed to fetch existing days: ${fetchError.message}`);

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
          console.error(`Failed to update training day ${dayNumber}:`, updateError);
          throw new Error(`Failed to update day ${dayNumber}: ${updateError.message}`);
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
          console.error(`Failed to insert training day ${dayNumber}:`, dayError);
          throw new Error(`Failed to insert day ${dayNumber}: ${dayError.message}`);
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

        if (exerciseError) throw new Error(`Failed to insert exercises for day ${dayNumber}: ${exerciseError.message}`);
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
          console.error(`Failed to check progress for day ${dayNumber}:`, countError);
        }

        if (count && count > 0) {
          // Day has user progress - warn admin but DON'T delete
          toast({
            title: "Warning",
            description: `Day ${dayNumber} has ${count} user progress records and was not deleted. User progress would be lost.`,
            variant: "destructive",
          });
        } else {
          // Safe to delete - no user progress
          const { error: deleteError } = await supabase
            .from("challenge_training_days")
            .delete()
            .eq("id", dayId);

          if (deleteError) {
            console.error(`Failed to delete orphaned day ${dayNumber}:`, deleteError);
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
        title: "Success",
        description: "Challenge deleted successfully.",
      });

      navigate("/challenges");
    } catch (error) {
      console.error("Error deleting challenge:", error);
      toast({
        title: "Error",
        description: "Failed to delete challenge.",
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
      title: `Day ${trainingDays.length + 1}`,
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
        <div className="text-white">Loading challenge...</div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-white text-xl mb-4">Challenge not found</h2>
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
            <h1 className="text-3xl font-bold text-white">Edit Challenge</h1>
            <p className="text-muted-foreground">
              Make changes to your challenge
            </p>
          </div>
        </div>

        <div className="bg-black/50 backdrop-blur-lg rounded-lg border border-white/10 p-3 sm:p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Challenge Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) {
                    setErrors(prev => ({ ...prev, title: undefined }));
                  }
                }}
                placeholder="Enter challenge title"
                maxLength={100}
                className={cn(errors.title && "border-red-500")}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) {
                    setErrors(prev => ({ ...prev, description: undefined }));
                  }
                }}
                placeholder="Describe your challenge..."
                rows={4}
                maxLength={1000}
                className={cn(errors.description && "border-red-500")}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="level" className="text-white">
                Level
              </Label>
              <Input
                id="level"
                type="number"
                min="1"
                value={level}
                onChange={(e) => setLevel(parseInt(e.target.value) || 1)}
                className="bg-black/20 border-white/10 text-white placeholder-white/50"
                placeholder="Enter challenge level"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select
                value={difficultyLevel}
                onValueChange={setDifficultyLevel}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      Beginner
                    </div>
                  </SelectItem>
                  <SelectItem value="intermediate">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      Intermediate
                    </div>
                  </SelectItem>
                  <SelectItem value="advanced">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      Advanced
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Challenge Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select challenge type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      Manual
                    </div>
                  </SelectItem>
                  <SelectItem value="timer">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      Timer
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Challenge Image</Label>
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
                    ? `Selected: ${imageFile.name}`
                    : imageUrl
                    ? "Current image uploaded"
                    : "No file selected"}
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

            {/* Publishing and Premium Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-lg font-semibold">
                  Publishing Status
                </Label>
                <div className="flex items-center space-x-3 p-4 border rounded-lg">
                  <Switch
                    checked={isPublished}
                    onCheckedChange={setIsPublished}
                  />
                  <div className="flex-1">
                    <div className="font-medium">
                      {isPublished ? "Published" : "Unpublished"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {isPublished
                        ? "Challenge is visible to all users"
                        : "Challenge is only visible to admins"}
                    </div>
                  </div>
                  <Badge variant={isPublished ? "default" : "secondary"}>
                    {isPublished ? "Published" : "Draft"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-lg font-semibold">Access Level</Label>
                <div className="flex items-center space-x-3 p-4 border rounded-lg">
                  <Switch checked={isPremium} onCheckedChange={setIsPremium} />
                  <div className="flex-1">
                    <div className="font-medium">
                      {isPremium ? "Premium" : "Free"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {isPremium
                        ? "Only premium users can join"
                        : "All users can join this challenge"}
                    </div>
                  </div>
                  <Badge variant={isPremium ? "default" : "secondary"}>
                    {isPremium ? "Premium" : "Free"}
                  </Badge>
                </div>

                {/* Price Settings - only show when premium is enabled */}
                {isPremium && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="price-usd">Price USD (cents)</Label>
                      <Input
                        id="price-usd"
                        type="number"
                        value={priceUsd}
                        onChange={(e) => setPriceUsd(Number(e.target.value))}
                        placeholder="999"
                        className="bg-white/5 border-white/20"
                      />
                      <p className="text-xs text-muted-foreground">
                        ${(priceUsd / 100).toFixed(2)} USD
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price-pln">Price PLN (cents)</Label>
                      <Input
                        id="price-pln"
                        type="number"
                        value={pricePln}
                        onChange={(e) => setPricePln(Number(e.target.value))}
                        placeholder="3999"
                        className="bg-white/5 border-white/20"
                      />
                      <p className="text-xs text-muted-foreground">
                        {(pricePln / 100).toFixed(2)} PLN
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Achievements Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-400" />
                <Label className="text-lg font-semibold">
                  Challenge Achievements
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
                            {achievement.points} points
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
              {trainingDays.length === 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <p className="text-sm text-yellow-200">
                    ⚠️ To wyzwanie nie ma jeszcze dni treningowych. Dodaj je przed publikacją.
                  </p>
                </div>
              )}

            {/* Training Days Section */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                  <div>
                    <Label className="text-lg sm:text-xl font-bold">
                      Training Days ({trainingDays.length})
                    </Label>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Design your challenge schedule
                    </p>
                    {errors.trainingDays && (
                      <p className="text-red-500 text-sm mt-1">{errors.trainingDays}</p>
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
                    <span className="text-sm">Add Day</span>
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
                                    Day {index + 1}/{trainingDays.length}
                                  </Badge>
                                  <div className="flex-1">
                                    <h3 className="text-lg font-bold">
                                      {day.title || `Day ${index + 1}`}
                                    </h3>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                      <span>{day.exercises.length} exercise{day.exercises.length !== 1 ? 's' : ''}</span>
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
                                      😴 Rest
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
                                  Remove
                                </Button>
                              </div>
                          </div>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div className="space-y-3">
                                <Label className="text-sm font-semibold text-foreground">
                                  Title
                                </Label>
                                <Input
                                  placeholder="e.g., Upper Body Focus, Core Strength"
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
                                  Date
                                </Label>
                                <div className="px-3 py-2 border rounded-md bg-muted h-11 flex items-center">
                                  <Calendar className="mr-3 h-5 w-5" />
                                  <span className="text-sm">
                                    {day.date ? format(day.date, "MMM dd, yyyy") : "Date will be set automatically"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-6 space-y-3">
                              <Label className="text-sm font-semibold text-foreground">
                                Description
                              </Label>
                              <Textarea
                                placeholder="Describe what this training day focuses on..."
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
                                  Day Type:
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
                                      ? "Rest Day"
                                      : "Training Day"}
                                  </span>
                                </div>
                              </div>
                              {!day.isRestDay && (
                                <Badge
                                  variant="outline"
                                  className="text-sm px-3 py-1"
                                >
                                  {day.exercises?.length || 0} exercise
                                  {(day.exercises?.length || 0) !== 1
                                    ? "s"
                                    : ""}
                                </Badge>
                              )}
                            </div>

                            {/* Day Content */}
                            <div className="mt-6">
                              {day.isRestDay ? (
                                <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border/50 rounded-lg bg-blue-500/5">
                                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <span className="text-3xl">😴</span>
                                  </div>
                                  <h4 className="font-semibold text-lg mb-2">
                                    Rest & Recovery Day
                                  </h4>
                                  <p className="text-sm">
                                    No exercises needed - time to let your body
                                    recover and rebuild!
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  <div className="flex items-center gap-3 pb-3 border-b border-border/30">
                                    <CalendarDays className="w-5 h-5 text-primary" />
                                    <h4 className="text-lg font-semibold">
                                      Exercises for this day
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
                      No training days added yet
                    </h3>
                    <p className="text-sm mb-6">
                      Start building your challenge by adding training sessions
                    </p>
                    <Button
                      type="button"
                      onClick={addTrainingDay}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Training Day
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

            {isPremium && challengeId && (
              <RedemptionCodeManagement 
                challengeId={challengeId}
                challengeTitle={title}
              />
            )}

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-white/10 p-3 sm:p-6 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/challenges")}
                disabled={isLoading}
                className="w-full sm:w-auto order-3 sm:order-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="button"
                onClick={saveChallenge}
                disabled={isLoading}
                className="w-full sm:flex-1 order-1 sm:order-2"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? (saveProgress || "Saving...") : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteModal(true)}
                disabled={isLoading}
                className="w-full sm:w-auto order-2 sm:order-3"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
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
        title="Delete Challenge"
        description="Are you sure you want to delete this challenge? This action cannot be undone and will remove all associated training days and progress."
        isLoading={isDeleting}
      />
    </div>
  );
};

export default EditChallenge;
