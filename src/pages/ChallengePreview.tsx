import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Play,
  ChevronLeft,
  Edit,
  Clock,
  Target,
  Lock,
  Bed,
  Star,
  Calendar,
  Trophy,
  Users,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Crown,
  RotateCcw,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
// useSubscriptionStatus and useChallengeAccess removed - only sport paths are paid
import { useChallengeCalendar } from "@/hooks/useChallengeCalendar";
import { useIsMobile } from "@/hooks/use-mobile";
// ChallengePurchaseModal removed - only sport paths are paid
import { ChallengeCompletionCelebration } from "@/components/ChallengeCompletionCelebration";
import { ChallengeExerciseInfoModal } from "@/components/ChallengeExerciseInfoModal";
import { format } from "date-fns";

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty_level?: string;
  start_date: string;
  end_date: string;
  status: string;
  premium?: boolean;
  price_usd?: number;
  price_pln?: number;
  image_url?: string;
  type: string;
  created_by?: string;
  training_days?: Array<{
    id: string;
    day_number: number;
    title: string;
    description: string;
    is_rest_day?: boolean;
    duration_seconds?: number;
    training_day_exercises?: Array<{
      id: string;
      figure: {
        id?: string;
        name?: string;
        difficulty_level?: string;
        category?: string;
        instructions?: string;
        image_url?: string;
        video_url?: string;
        audio_url?: string;
        type?: string;
        tags?: string[];
        hold_time_seconds?: number;
        description?: string;
      };
      sets?: number;
      reps?: number;
      notes?: string;
      hold_time_seconds?: number;
      rest_time_seconds?: number;
    }>;
  }>;
}

const ChallengePreview = () => {
  const { challengeId } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();
  const { user, isImpersonating, originalAdminUser } = useAuth();
  const { toast } = useToast();
  const { canCreateChallenges, isAdmin } = useUserRole();
  // Premium hooks removed - only sport paths are paid
  const isMobile = useIsMobile();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [userParticipant, setUserParticipant] = useState<any>(null);
  // isPurchaseModalOpen removed - only sport paths are paid
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const [selectedFigure, setSelectedFigure] = useState<{
    id: string;
    name: string;
    image_url?: string;
    video_url?: string;
    description?: string;
    instructions?: string;
    tags?: string[];
  } | null>(null);
  const [isFigureModalOpen, setIsFigureModalOpen] = useState(false);

  const translateDifficulty = (level: string) => {
    const translations: Record<string, string> = {
      beginner: "Początkujący",
      intermediate: "Średni",
      advanced: "Zaawansowany",
    };
    return translations[level.toLowerCase()] || level;
  };

  // Use the challenge calendar hook
  const {
    calendarDays,
    isLoading: calendarLoading,
    generateCalendar,
    changeDayStatus,
    loadCalendar,
    loadNextAvailableDay,
    showCelebration,
    setShowCelebration,
    challengeCompletionData,
  } = useChallengeCalendar(challengeId || "");

  useEffect(() => {
    if (challengeId) {
      fetchChallengeDetails();
      checkParticipation();
    }
  }, [challengeId]);

  // Check if participant needs calendar generation
  useEffect(() => {
    const checkAndGenerateCalendar = async () => {
      if (
        calendarLoading ||
        !isParticipant ||
        !userParticipant ||
        calendarDays.length > 0
      )
        return;

      const startDate = userParticipant.user_started_at
        ? new Date(userParticipant.user_started_at)
        : new Date();

      if (!userParticipant.user_started_at) {
        await supabase
          .from("challenge_participants")
          .update({ user_started_at: startDate.toISOString() })
          .eq("challenge_id", challengeId)
          .eq("user_id", user?.id);
      }

      await generateCalendar(startDate);
      await checkParticipation();
    };

    checkAndGenerateCalendar();
  }, [
    isParticipant,
    userParticipant,
    calendarDays.length,
    challengeId,
    user?.id,
    generateCalendar,
  ]);

  const fetchChallengeDetails = async () => {
    if (!challengeId) return;

    setIsLoading(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase
        .from("challenges")
        .select(
          `
          *,
          challenge_training_days (
            id, day_number, title, description, 
            duration_seconds,
            training_day_exercises (
              id, sets, reps, hold_time_seconds, rest_time_seconds, notes,
              figure:figures (
                id, name, difficulty_level, instructions, image_url, category,
                video_url, audio_url, type, tags, hold_time_seconds, description
              )
            )
          )
        `
        )
        .eq("id", challengeId)
        .single();

      if (challengeError) throw challengeError;

      setChallenge({
        ...challengeData,
        training_days:
          challengeData.challenge_training_days?.sort(
            (a: any, b: any) => a.day_number - b.day_number
          ) || [],
      });
    } catch (error) {
      console.error("Error fetching challenge details:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się załadować szczegółów wyzwania",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkParticipation = async () => {
    if (!challengeId || !user?.id) return;

    try {
      const { data, error } = await supabase
        .from("challenge_participants")
        .select("*")
        .eq("challenge_id", challengeId)
        .eq("user_id", user.id)
        .single();

      if (!error && data) {
        setIsParticipant(true);
        setUserParticipant(data);
      }
    } catch (error) {
      // User is not a participant
    }
  };

  const joinChallenge = async () => {
    if (!challengeId || !user?.id || isParticipant) return;

    // Premium check removed - challenges are free, only sport paths are paid

    setIsJoining(true);
    try {
      const startDate = new Date();

      const { data, error } = await supabase
        .from("challenge_participants")
        .insert({
          challenge_id: challengeId,
          user_id: user.id,
          status: "active",
          user_started_at: startDate.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setIsParticipant(true);
      setUserParticipant(data);

      await generateCalendar(startDate);

      toast({
        title: "Sukces",
        description:
          "Dołączyłeś(aś) do wyzwania i Twój harmonogram treningowy jest gotowy!",
      });

      setTimeout(() => {
        navigate(`/challenges/${challengeId}`);
      }, 500);
    } catch (error) {
      console.error("Error joining challenge:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się dołączyć do wyzwania",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const getCurrentTrainingDay = () => {
    if (!calendarDays.length) return null;

    const accessibleDays = calendarDays
      .filter((day) => day.is_accessible)
      .map((cd) => {
        const td = challenge?.training_days?.find(
          (t) => t.id === cd.training_day_id
        );
        return td ? { calendarDay: cd, trainingDay: td } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a!.trainingDay.day_number - b!.trainingDay.day_number);

    if (!accessibleDays.length) return null;

    // Find the first pending or failed day (next to train)
    const nextTrainingDay = accessibleDays.find(
      (d) =>
        d!.calendarDay.status === "pending" ||
        d!.calendarDay.status === "failed"
    );

    return nextTrainingDay || accessibleDays[accessibleDays.length - 1];
  };

  // Auto-scroll to current day
  useEffect(() => {
    if (!carouselApi || !challenge?.training_days || calendarLoading) return;

    // Wait for calendarDays to be loaded
    if (!calendarDays || calendarDays.length === 0) return;

    const currentDay = getCurrentTrainingDay();
    if (!currentDay) return;

    // Find the index of the current day
    const currentDayIndex = challenge.training_days.findIndex(
      (td) => td.id === currentDay.trainingDay.id
    );

    if (currentDayIndex >= 0) {
      // Increased timeout for better reliability
      setTimeout(() => {
        carouselApi.scrollTo(currentDayIndex);
      }, 300);
    }
  }, [carouselApi, challenge?.training_days, calendarDays, calendarLoading]);

  const handleRestDay = async (calendarDay: any, trainingDay: any) => {
    try {
      if (!user?.id || !challengeId) return;

      // For rest days (0 exercises), mark as completed
      const isRestDay = trainingDay?.training_day_exercises?.length === 0;

      if (isRestDay) {
        // Use upsert to handle cases where record already exists
        const { error } = await supabase.from("challenge_day_progress").upsert(
          {
            user_id: user.id,
            challenge_id: challengeId,
            training_day_id: trainingDay.id,
            attempt_number: 1,
            status: "completed",
            exercises_completed: 0,
            total_exercises: 0,
            notes: "Rest day completed",
            changed_status_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,challenge_id,training_day_id,attempt_number",
          }
        );

        if (error) {
          console.error("Error completing rest day:", error);
          toast({
            title: "Błąd",
            description: "Nie udało się oznaczyć dnia jako ukończonego",
            variant: "destructive",
          });
          return;
        }

        // Force immediate UI update by checking participation again
        await checkParticipation();

        toast({
          title: "Dzień odpoczynku ukończony",
          description: "Świetnie, że dbasz o regenerację!",
        });

        // Navigate to the next day or back to challenge overview
        setTimeout(() => {
          const nextDay = challenge?.training_days?.find(
            (td) => td.day_number === trainingDay.day_number + 1
          );

          if (nextDay) {
            // Scroll to next day in the carousel if it exists
            const nextDayIndex = challenge.training_days.findIndex(
              (td) => td.id === nextDay.id
            );
            if (carouselApi && nextDayIndex >= 0) {
              carouselApi.scrollTo(nextDayIndex);
            }
          }
        }, 1000);
      }
    } catch (error) {
      console.error("Error completing rest day:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się ukończyć dnia odpoczynku",
        variant: "destructive",
      });
    }
  };

  const handleAdminCompleteDay = async (calendarDay: any, trainingDay: any) => {
    try {
      if (!user?.id || !challengeId || !isImpersonating || !originalAdminUser)
        return;

      // Complete day via secure RPC to bypass RLS and handle progression
      const { error: rpcError } = await supabase.rpc(
        "admin_complete_challenge_day",
        {
          p_user_id: user.id,
          p_challenge_id: challengeId,
          p_day_number: trainingDay.day_number,
          p_notes: `Completed by admin (${originalAdminUser.username}) for user (${user.username})`,
        }
      );

      if (rpcError) {
        console.error("RPC error details:", rpcError);
        throw new Error(
          `Admin complete failed: ${
            rpcError.message || rpcError.details || rpcError
          }`
        );
      }

      // Refresh calendar state
      await loadCalendar();
      await loadNextAvailableDay();
      await checkParticipation();

      toast({
        title: "Dzień ukończony (Akcja admina)",
        description: `Dzień ${trainingDay.day_number} oznaczony jako ukończony dla ${user.username}`,
      });

      // Navigate to the next day
      setTimeout(() => {
        const nextDay = challenge?.training_days?.find(
          (td) => td.day_number === trainingDay.day_number + 1
        );

        if (nextDay) {
          const nextDayIndex = challenge.training_days.findIndex(
            (td) => td.id === nextDay.id
          );
          if (carouselApi && nextDayIndex >= 0) {
            carouselApi.scrollTo(nextDayIndex);
          }
        }
      }, 1000);
    } catch (error) {
      console.error("Error completing day as admin:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się ukończyć dnia",
        variant: "destructive",
      });
    }
  };

  const toggleDayExpansion = (dayNumber: number) => {
    setExpandedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dayNumber)) {
        newSet.delete(dayNumber);
      } else {
        newSet.add(dayNumber);
      }
      return newSet;
    });
  };

  const handleExerciseClick = (exercise: any) => {
    setSelectedFigure({
      id: exercise.figure.id,
      name: exercise.figure.name,
      image_url: exercise.figure.image_url,
      video_url: exercise.figure.video_url,
      description: exercise.figure.description,
      instructions: exercise.figure.instructions,
      tags: exercise.figure.tags,
    });
    setIsFigureModalOpen(true);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "beginner":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "intermediate":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "advanced":
        return "bg-rose-500/20 text-rose-400 border-rose-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0
      ? `${mins}:${secs.toString().padStart(2, "0")}`
      : `0:${secs.toString().padStart(2, "0")}`;
  };

  // Premium lock removed - challenges are free

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/80 font-medium">Ładowanie wyzwania...</p>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            Nie znaleziono wyzwania
          </h2>
          <p className="text-slate-400 mb-6">
            Wyzwanie, którego szukasz, nie istnieje
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="relative flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-transparent backdrop-blur-xl"></div>
        <div className="relative z-10 p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <div></div>

            {/* Edit button for admins/creators */}
            {(isAdmin || challenge.created_by === user?.id) && (
              <Button
                variant="ghost"
                onClick={() => navigate(`/challenges/${challengeId}/edit`)}
                className="text-white hover:bg-white/10 backdrop-blur-sm"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>

          {/* Challenge Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              {challenge.premium && (
                <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-amber-950 border-0 font-bold">
                  ✨ Premium
                </Badge>
              )}
              {challenge.difficulty_level && (
                <Badge
                  variant="outline"
                  className={getDifficultyColor(challenge.difficulty_level)}
                >
                  {translateDifficulty(challenge.difficulty_level)}
                </Badge>
              )}
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
              {challenge.title}
            </h1>

            {challenge.description && (
              <p className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed hidden sm:block">
                {challenge.description}
              </p>
            )}

            {/* Challenge Stats - Hidden on mobile */}
            <div className="hidden sm:flex items-center justify-center gap-6 mt-6 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{challenge.training_days?.length || 0} dni</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Codzienne treningi</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span>Pełny program</span>
              </div>
            </div>
          </div>

          {/* Join Button for non-participants */}
          {!isParticipant && (
            <div className="text-center">
              <Button
                onClick={joinChallenge}
                disabled={isJoining}
                className="bg-gradient-to-r from-primary to-primary-foreground hover:shadow-lg hover:shadow-primary/25 text-white px-8 py-4 text-lg font-bold rounded-2xl shadow-xl transition-all duration-300 hover:scale-105"
              >
                {isJoining ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Dołączanie...
                  </>
                ) : (
                  <>
                    <Star className="w-5 h-5 mr-2" />
                    Dołącz do wyzwania
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Training Days Slider */}
      {isParticipant && (
        <div className="flex-1 px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 overflow-hidden pt-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">
              Twoja podróż treningowa
            </h2>

            {(() => {
              const todayStr = format(new Date(), "yyyy-MM-dd");
              const allTrainingDays =
                challenge?.training_days
                  ?.map((trainingDay) => {
                    const relatedDays = calendarDays
                      .filter((cd) => cd.training_day_id === trainingDay.id)
                      .sort((a, b) => {
                        // Sort by completed_at if available, otherwise by calendar_date
                        const aDate = a.completed_at || a.calendar_date;
                        const bDate = b.completed_at || b.calendar_date;
                        return bDate.localeCompare(aDate);
                      });

                    const todayCalendarDay = relatedDays.find(
                      (cd) => cd.calendar_date === todayStr
                    );

                    const latestCalendarDay = relatedDays[0];

                    return {
                      calendarDay:
                        todayCalendarDay || latestCalendarDay || null,
                      trainingDay,
                    };
                  })
                  .sort(
                    (a, b) =>
                      a.trainingDay.day_number - b.trainingDay.day_number
                  ) || [];

              if (!allTrainingDays.length) return null;

              return (
                <Carousel className="w-full h-full" setApi={setCarouselApi}>
                  <CarouselContent className="-ml-3 md:-ml-4 lg:-ml-6 h-full">
                    {allTrainingDays.map((dayData, index) => {
                      const { calendarDay, trainingDay } = dayData;
                      const exercises =
                        trainingDay.training_day_exercises || [];

                      // Get user's progress from database
                      const isCompleted = calendarDay?.status === "completed";

                      // Simplified logic for three states:
                      // 1. Current unlocked day (can train)
                      // 2. Completed day (show completed status)
                      // 3. Locked day (not accessible yet)

                      const isCurrentDay = !isCompleted && index === 0; // First non-completed day
                      const isLocked = !isCompleted && index > 0; // Future days are locked

                      // Find the first completed day to determine the current accessible day
                      const lastCompletedIndex = allTrainingDays.findIndex(
                        (d, i) =>
                          i < index && d.calendarDay?.status === "completed"
                      );

                      const isNextUnlocked =
                        !isCompleted &&
                        (index === 0 || // First day is always unlocked
                          (index > 0 &&
                            allTrainingDays[index - 1]?.calendarDay?.status ===
                              "completed")); // Previous day completed

                      const actualIsCurrentDay = isNextUnlocked && !isCompleted;
                      const actualIsLocked = !isCompleted && !isNextUnlocked;

                      const totalDuration = trainingDay.duration_seconds || 0;

                      return (
                        <CarouselItem
                          key={trainingDay.id}
                          className="pl-3 md:pl-4 lg:pl-6 basis-full sm:basis-3/4 md:basis-2/3 lg:basis-1/2 xl:basis-2/5 2xl:basis-1/3 h-full"
                        >
                          <Card
                            className={`glass-effect overflow-hidden h-full transition-all duration-300 backdrop-blur-md ${
                              actualIsLocked
                                ? "border-slate-600/50 opacity-60"
                                : isCompleted
                                ? "border-emerald-500/60 bg-emerald-500/5"
                                : actualIsCurrentDay
                                ? "border-primary/80 ring-2 ring-primary/40 shadow-2xl shadow-primary/20 bg-primary/5"
                                : "border-white/20"
                            }`}
                          >
                            <div
                              className={`relative py-4 px-6 ${
                                actualIsLocked
                                  ? "bg-gradient-to-r from-slate-700/50 to-slate-800/50"
                                  : actualIsCurrentDay
                                  ? "bg-gradient-to-r from-purple-600/90 to-indigo-700/90"
                                  : isCompleted
                                  ? "bg-gradient-to-r from-emerald-600/90 to-emerald-800/90"
                                  : "bg-gradient-to-r from-indigo-700/90 to-slate-800/90"
                              }`}
                            >
                              <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
                              <div className="relative z-10">
                                {/* Top Row: Icon + Day Number + Status Badge */}
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-3">
                                    <div className="text-2xl">
                                      {actualIsLocked
                                        ? "🔒"
                                        : isCompleted
                                        ? "✅"
                                        : actualIsCurrentDay
                                        ? "⭐"
                                        : "💪"}
                                    </div>
                                    <h3
                                      className={`text-xl font-bold ${
                                        actualIsLocked
                                          ? "text-slate-300"
                                          : "text-white"
                                      }`}
                                    >
                                      DAY {trainingDay.day_number}
                                    </h3>
                                  </div>
                                  {/* Status Badge */}
                                  {isCompleted ? (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
                                      ✓ Ukończone
                                    </span>
                                  ) : actualIsLocked ? (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/30 text-slate-300 border border-slate-400/30">
                                      <Lock className="w-3 h-3 mr-1" />
                                      Zablokowane
                                    </span>
                                  ) : actualIsCurrentDay ? (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
                                      🟢 W trakcie
                                    </span>
                                  ) : null}
                                </div>
                                
                                {/* Title */}
                                <div
                                  className={`text-sm mb-3 ${
                                    actualIsLocked
                                      ? "text-slate-400"
                                      : "text-white/90"
                                  }`}
                                >
                                  {actualIsLocked
                                    ? "Ukończ poprzedni dzień najpierw"
                                    : trainingDay.title || "Dzień treningowy"}
                                </div>
                                
                                {/* Stats Row */}
                                <div className="flex items-center gap-4 text-xs">
                                  <div className="flex items-center gap-1.5 text-white/70">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{Math.ceil(totalDuration / 60)} min</span>
                                  </div>
                                  <div className="w-px h-3 bg-white/20"></div>
                                  <div className="flex items-center gap-1.5 text-white/70">
                                    <Target className="w-3.5 h-3.5" />
                                    <span>{exercises.length} ćwiczeń</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <CardContent className="p-4 md:p-6 flex-1 flex flex-col">
                              {/* CTA Button - Prominent Position */}
                              {actualIsCurrentDay && (
                                <div className="mb-4 md:mb-6">
                                  {exercises.length === 0 ? (
                                    <Button
                                      onClick={() =>
                                        handleRestDay(calendarDay, trainingDay)
                                      }
                                      variant="default"
                                      className="w-full md:max-w-md md:mx-auto py-5 md:py-6 text-base md:text-lg font-bold rounded-xl transition-all duration-300 hover:translate-y-[-2px] active:translate-y-0 bg-gradient-to-br from-emerald-600/50 to-emerald-700/50 hover:from-emerald-600/60 hover:to-emerald-700/60 shadow-sm"
                                    >
                                      <Bed className="w-5 h-5 md:w-6 md:h-6 mr-2" />
                                      Odpoczynek
                                    </Button>
                                  ) : (
                                    <Button
                                      onClick={() => {
                                        navigate(
                                          `/challenge/${challengeId}/day/${trainingDay.id}/timer`
                                        );
                                      }}
                                      variant="default"
                                      className="w-full md:max-w-md md:mx-auto py-5 md:py-6 text-base md:text-lg font-bold rounded-xl transition-all duration-300 hover:translate-y-[-2px] active:translate-y-0"
                                    >
                                      <Play className="w-5 h-5 md:w-6 md:h-6 mr-2" />
                                      Rozpocznij trening
                                    </Button>
                                  )}
                                </div>
                              )}

                              {/* Practice Mode Button - for completed days with exercises */}
                              {isCompleted && exercises.length > 0 && (
                                <div className="mb-4 md:mb-6">
                                  <Button
                                    onClick={() => {
                                      navigate(
                                        `/challenge/${challengeId}/day/${trainingDay.id}/timer?practice=true`
                                      );
                                    }}
                                    variant="ghost"
                                    className="w-full md:max-w-md md:mx-auto py-3 text-sm text-white/50 hover:text-white/80 hover:bg-white/5 rounded-xl transition-all duration-300"
                                  >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Powtórz trening
                                  </Button>
                                </div>
                              )}

                              {/* Admin Complete Button - Only visible in impersonation mode */}
                              {isImpersonating &&
                                originalAdminUser &&
                                !isCompleted &&
                                actualIsCurrentDay && (
                                  <div className="mb-4">
                                    <Button
                                      onClick={() =>
                                        handleAdminCompleteDay(
                                          calendarDay,
                                          trainingDay
                                        )
                                      }
                                      variant="outline"
                                      className="w-full md:max-w-md md:mx-auto py-3 text-sm font-semibold rounded-xl border-orange-500/50 text-orange-400 hover:bg-orange-500/20 hover:border-orange-500 transition-all duration-300"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Ukończ (Admin)
                                    </Button>
                                  </div>
                                )}

                              {/* Day Notes */}
                              {(calendarDay?.notes ||
                                trainingDay.description) && (
                                <div className="mb-4 md:mb-6">
                                  <div
                                    className={`text-sm ${
                                      actualIsLocked
                                        ? "text-slate-400"
                                        : "text-white/90"
                                    } bg-gradient-to-r from-slate-800/60 to-slate-900/60 p-4 rounded-2xl border border-slate-600/30 backdrop-blur-sm`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                                      <p className="flex-1 leading-relaxed">
                                        {calendarDay?.notes ||
                                          trainingDay.description}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Exercise List or Rest Day Content */}
                              {exercises.length > 0 ? (
                                <div className="space-y-2 md:space-y-3 flex-1">
                                  {exercises
                                    .slice(
                                      0,
                                      expandedDays.has(trainingDay.day_number)
                                        ? exercises.length
                                        : 4
                                    )
                                    .map((exercise, exerciseIndex) => (
                                      <div
                                        key={exercise.id}
                                        onClick={() =>
                                          handleExerciseClick(exercise)
                                        }
                                        className={`flex items-start justify-between p-3 md:p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm ${
                                          actualIsLocked
                                            ? "cursor-not-allowed"
                                            : "cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all"
                                        }`}
                                      >
                                        <div className="flex-1 pr-4">
                                          <h4
                                            className={`font-semibold text-base mb-2 ${
                                              actualIsLocked
                                                ? "text-slate-300"
                                                : "text-white"
                                            }`}
                                          >
                                            {exercise.figure.name}
                                          </h4>
                                          {exercise.notes && (
                                            <p className="text-white/70 text-sm mb-3">
                                              {exercise.notes}
                                            </p>
                                          )}
                                          <div
                                            className={`text-sm font-medium ${
                                              actualIsLocked
                                                ? "text-slate-400"
                                                : "text-primary"
                                            }`}
                                          >
                                            {formatTime(
                                              exercise.hold_time_seconds || 30
                                            )}
                                            {exercise.sets &&
                                              exercise.sets > 1 &&
                                              ` × ${exercise.sets} sets`}
                                          </div>
                                        </div>

                                        {/* Exercise Image */}
                                        <div
                                          className={`w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ${
                                            actualIsLocked ? "opacity-50" : ""
                                          }`}
                                        >
                                          {exercise.figure?.image_url ? (
                                            <img
                                              src={exercise.figure.image_url}
                                              alt={exercise.figure.name}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <Target className="w-6 h-6 text-white/40" />
                                          )}
                                        </div>
                                      </div>
                                    ))}

                                  {/* Show More/Less Button */}
                                  {exercises.length > 4 && (
                                    <button
                                      onClick={() =>
                                        toggleDayExpansion(
                                          trainingDay.day_number
                                        )
                                      }
                                      className="w-full p-3 mt-3 text-center text-white/70 hover:text-white hover:bg-white/5 rounded-xl border border-white/10 transition-all duration-200 flex items-center justify-center gap-2"
                                    >
                                      {expandedDays.has(
                                        trainingDay.day_number
                                      ) ? (
                                        <>
                                          <ChevronUp className="w-4 h-4" />
                                          Pokaż mniej
                                        </>
                                      ) : (
                                        <>
                                          <ChevronDown className="w-4 h-4" />
                                          Pokaż więcej ({exercises.length - 4}{" "}
                                          więcej)
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 md:p-8 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-2xl border border-emerald-500/20">
                                  <Bed className="w-12 h-12 text-emerald-400 mb-4" />
                                  <h4 className="text-lg font-semibold text-white mb-2">
                                    Dzień odpoczynku
                                  </h4>
                                  <p className="text-white/70 text-sm leading-relaxed max-w-xs">
                                    Ten dzień przeznaczony jest na regenerację.
                                    Poświęć ten czas na odpoczynek, rozciąganie
                                    lub lekki ruch, który sprawia Ci
                                    przyjemność.
                                  </p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </CarouselItem>
                      );
                    })}
                  </CarouselContent>
                  <CarouselPrevious className="text-white border-white/20 hover:bg-white/10 backdrop-blur-sm -left-6 md:-left-8 lg:-left-10" />
                  <CarouselNext className="text-white border-white/20 hover:bg-white/10 backdrop-blur-sm -right-6 md:-right-8 lg:-right-10" />
                </Carousel>
              );
            })()}
          </div>
        </div>
      )}

      <div className="pb-4"></div>

      {/* ChallengePurchaseModal removed - only sport paths are paid */}

      {/* Challenge Completion Celebration */}
      {showCelebration && challengeCompletionData && (
        <ChallengeCompletionCelebration
          isOpen={showCelebration}
          onClose={() => setShowCelebration(false)}
          challengeTitle={challengeCompletionData.title}
          totalDays={challengeCompletionData.totalDays}
          pointsEarned={challengeCompletionData.pointsEarned}
        />
      )}

      {/* Exercise Info Modal */}
      <ChallengeExerciseInfoModal
        exercise={selectedFigure}
        isOpen={isFigureModalOpen}
        onClose={() => {
          setIsFigureModalOpen(false);
          setSelectedFigure(null);
        }}
      />
    </div>
  );
};

export default ChallengePreview;
