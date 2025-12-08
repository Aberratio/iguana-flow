import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Maximize,
  Minimize,
  Info,
  Share,
  RotateCcw,
  MessageCircle,
  MessageCircleOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useChallengeCalendar } from "@/hooks/useChallengeCalendar";
import { useSpeech } from "@/hooks/useSpeech";
import { useWakeLock } from "@/hooks/useWakeLock";
import { ChallengeExerciseInfoModal } from "@/components/ChallengeExerciseInfoModal";
import { CreatePostModal } from "@/components/CreatePostModal";

interface Exercise {
  id: string;
  sets?: number;
  reps?: number;
  hold_time_seconds?: number;
  rest_time_seconds?: number;
  notes?: string;
  play_video?: boolean;
  video_position?: "center" | "top" | "bottom" | "left" | "right";
  figure: {
    id: string;
    name: string;
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
    video_position?: "center" | "top" | "bottom" | "left" | "right";
  };
}

interface TimerSegment {
  type: "exercise" | "rest";
  exerciseIndex: number;
  setIndex: number;
  duration: number;
  exerciseName: string;
  exerciseImage?: string;
  exerciseNotes?: string;
  shouldPlayVideo?: boolean;
  videoUrl?: string;
  videoPosition?: string;
}

const ChallengeDayTimer = () => {
  const { challengeId, dayId } = useParams<{
    challengeId: string;
    dayId: string;
  }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPracticeMode = searchParams.get('practice') === 'true';
  const { user } = useAuth();
  const { toast } = useToast();
  const { getCalendarDayByTrainingDay } = useChallengeCalendar(
    challengeId || ""
  );

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [segments, setSegments] = useState<TimerSegment[]>([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [audioMode, setAudioMode] = useState<
    "sound" | "no_sound" | "minimal_sound"
  >(() => {
    const saved = localStorage.getItem("challengeTimerAudioMode");
    return (saved as "sound" | "no_sound" | "minimal_sound") || "minimal_sound";
  });
  const [hasAnnouncedSegment, setHasAnnouncedSegment] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [trainingDayId, setTrainingDayId] = useState<string>("");
  const [isPreparingToStart, setIsPreparingToStart] = useState(false);
  const [preparationTime, setPreparationTime] = useState(10);
  const [isRestDay, setIsRestDay] = useState(false);
  const [trainingDayData, setTrainingDayData] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
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
  const [showSharePostModal, setShowSharePostModal] = useState(false);
  const [challengeTitle, setChallengeTitle] = useState("");
  const [audioInstructionsEnabled, setAudioInstructionsEnabled] = useState(() => {
    return localStorage.getItem("challengeTimerAudioInstructions") === "true";
  });
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const lastPlayedExerciseIndexRef = useRef<number>(-1);

  const { speak } = useSpeech(audioMode === "sound");
  const {
    isSupported: isWakeLockSupported,
    requestWakeLock,
    releaseWakeLock,
  } = useWakeLock();

  // Create optimistic beeping sound for minimal mode
  const playBeep = useCallback(
    (type: "countdown" | "transition" | "ready" | "final" = "countdown") => {
      if (audioMode !== "minimal_sound") return;

      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different frequencies for different contexts
      if (type === "countdown") {
        oscillator.frequency.value = 1000; // Higher pitched for countdown
      } else if (type === "transition") {
        oscillator.frequency.value = 800; // Medium pitch for transitions
      } else if (type === "ready") {
        oscillator.frequency.value = 1200; // Highest pitch for get ready
      } else if (type === "final") {
        oscillator.frequency.value = 1400; // HIGHEST pitch for final beep
      }

      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        type === "final" ? 0.35 : 0.2,
        audioContext.currentTime + 0.01
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + (type === "final" ? 0.3 : 0.2)
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(
        audioContext.currentTime + (type === "final" ? 0.3 : 0.2)
      );
    },
    [audioMode]
  );

  const formatTimeNatural = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (mins === 0) {
      return `${secs} sekund`;
    } else if (mins === 1 && secs === 0) {
      return "1 minuta";
    } else if (mins === 1) {
      return `1 minuta i ${secs} sekund`;
    } else if (secs === 0) {
      return `${mins} minut`;
    } else {
      return `${mins} minut i ${secs} sekund`;
    }
  }, []);

  const handleSegmentComplete = useCallback(() => {
    const currentSegment = segments[currentSegmentIndex];

    if (currentSegmentIndex >= segments.length - 1) {
      setIsCompleted(true);
      setIsRunning(false);
      if (audioMode === "sound") {
        speak("Trening ukończony! Świetna robota!");
      }
      return;
    }

    const nextIndex = currentSegmentIndex + 1;
    const nextSegment = segments[nextIndex];

    setCurrentSegmentIndex(nextIndex);
    setTimeRemaining(nextSegment.duration);
  }, [currentSegmentIndex, segments, audioMode, speak]);

  useEffect(() => {
    const fetchExercises = async () => {
      if (!dayId || !user?.id) return;

      try {
        setIsLoading(true);

        // Get training day directly since dayId is the training day ID
        const { data: trainingDayData, error: trainingDayError } =
          await supabase
            .from("challenge_training_days")
            .select("*")
            .eq("id", dayId)
            .single();

        if (trainingDayError) throw trainingDayError;
        setTrainingDayId(dayId);
        setTrainingDayData(trainingDayData);

        // Fetch challenge title
        const { data: challengeData, error: challengeError } = await supabase
          .from("challenges")
          .select("title")
          .eq("id", challengeId)
          .single();

        if (challengeError) throw challengeError;
        setChallengeTitle(challengeData?.title || "");

        // Check if user is participant of this challenge
        const { data: participant, error: participantError } = await supabase
          .from("challenge_participants")
          .select("*")
          .eq("user_id", user.id)
          .eq("challenge_id", challengeId)
          .single();

        if (participantError) throw participantError;

        if (!participant) {
          toast({
            title: "Not Available",
            description: "You need to join this challenge first.",
          });
          navigate(`/challenges/${challengeId}`);
          return;
        }

        const { data: exercisesData, error: exercisesError } = await supabase
          .from("training_day_exercises")
          .select(
            `
              *,
              figure:figures (
                id, name, image_url, video_url, difficulty_level, category,
                instructions, audio_url, type, tags, hold_time_seconds, description,
                video_position
              )
            `
          )
          .eq("training_day_id", dayId)
          .order("order_index");

        if (exercisesError) throw exercisesError;

        const formattedExercises =
          exercisesData?.map((exercise: any) => ({
            id: exercise.id,
            sets: exercise.sets || 1,
            reps: exercise.reps,
            hold_time_seconds: exercise.hold_time_seconds || 30,
            rest_time_seconds: exercise.rest_time_seconds || 15,
            notes: exercise.notes,
            play_video: exercise.play_video,
            // Priority: training_day_exercises.video_position > figures.video_position > "center"
            video_position: exercise.video_position || exercise.figure?.video_position || "center",
            figure: exercise.figure,
          })) || [];

        setExercises(formattedExercises);
        setIsRestDay(formattedExercises.length === 0);
      } catch (error) {
        console.error("Error fetching exercises:", error);
        toast({
          title: "Error",
          description: "Failed to load exercises",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchExercises();
  }, [dayId, user?.id, challengeId, navigate, toast]);

  useEffect(() => {
    if (exercises.length === 0) return;

    const newSegments: TimerSegment[] = [];

    exercises.forEach((exercise, exerciseIndex) => {
      const sets = exercise.sets || 1;

      for (let setIndex = 0; setIndex < sets; setIndex++) {
        newSegments.push({
          type: "exercise",
          exerciseIndex,
          setIndex,
          duration: exercise.hold_time_seconds || 30,
          exerciseName: exercise.figure.name,
          exerciseImage: exercise.figure.image_url,
          exerciseNotes: exercise.notes,
          shouldPlayVideo: exercise.play_video && !!exercise.figure.video_url,
          videoUrl: exercise.figure.video_url,
          videoPosition: exercise.video_position || "center",
        });

        if (
          !(exerciseIndex === exercises.length - 1 && setIndex === sets - 1)
        ) {
          newSegments.push({
            type: "rest",
            exerciseIndex,
            setIndex,
            duration: exercise.rest_time_seconds || 15,
            exerciseName: "Przerwa",
          });
        }
      }
    });

    setSegments(newSegments);
    if (newSegments.length > 0) {
      setTimeRemaining(newSegments[0].duration);
    }
  }, [exercises]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isPreparingToStart && preparationTime > 0) {
      interval = setInterval(() => {
        setPreparationTime((prev) => {
          if (audioMode === "sound") {
            if (prev > 2 && prev < 7) {
              speak((prev - 1).toString());
            } else if (prev === 2) {
              speak("1... Rozpocznij!");
            }
          } else if (audioMode === "minimal_sound") {
            // Beep during countdown for get ready phase
            if (prev <= 5 && prev > 0) {
              playBeep("ready");
            }
          }

          if (prev <= 1) {
            setIsPreparingToStart(false);
            setIsRunning(true);
            setPreparationTime(10);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isPreparingToStart, preparationTime, audioMode, speak, playBeep]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && !isPreparingToStart && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          // Voice countdown for full sound mode
          if (audioMode === "sound" && prev <= 7 && prev > 1) {
            speak((prev - 2).toString());
          }

          // Beeping for minimal sound mode
          if (
            audioMode === "minimal_sound" &&
            currentSegmentIndex < segments.length &&
            prev <= 5 &&
            prev > 0
          ) {
            const currentSegment = segments[currentSegmentIndex];
            if (prev === 1) {
              playBeep("final"); // Stronger beep for last second
            } else if (currentSegment?.type === "exercise") {
              playBeep("countdown");
            } else if (currentSegment?.type === "rest") {
              playBeep("transition");
            }
          }

          if (prev <= 1) {
            handleSegmentComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [
    isRunning,
    isPreparingToStart,
    timeRemaining,
    currentSegmentIndex,
    segments,
    audioMode,
    speak,
    playBeep,
    handleSegmentComplete,
  ]);

  useEffect(() => {
    if (!isRunning || !segments[currentSegmentIndex]) return;

    const currentSegment = segments[currentSegmentIndex];

    if (!hasAnnouncedSegment && audioMode === "sound") {
      setHasAnnouncedSegment(true);

      if (currentSegment.type === "exercise") {
        const duration = formatTimeNatural(currentSegment.duration);
        const notes = currentSegment.exerciseNotes
          ? `, ${currentSegment.exerciseNotes}`
          : "";
        speak(`${currentSegment.exerciseName}, ${duration}${notes}`);
      } else {
        const duration = formatTimeNatural(currentSegment.duration);
        speak(`Przerwa, ${duration}`);
      }
    }
  }, [
    currentSegmentIndex,
    isRunning,
    hasAnnouncedSegment,
    segments,
    audioMode,
    speak,
    formatTimeNatural,
  ]);

  useEffect(() => {
    setHasAnnouncedSegment(false);
  }, [currentSegmentIndex]);

  // Sync video playback with timer
  useEffect(() => {
    if (!videoRef.current) return;

    if (isRunning && !isPreparingToStart) {
      videoRef.current.play().catch((err) => {
        console.error("Error playing video:", err);
      });
    } else {
      videoRef.current.pause();
    }
  }, [isRunning, isPreparingToStart]);

  // Reset video when segment changes and auto-play if needed
  useEffect(() => {
    if (!videoRef.current) return;

    // Load video first (important for iOS)
    videoRef.current.load();
    videoRef.current.currentTime = 0;

    // Auto-play video for new segment if:
    // 1. Timer is running (not paused)
    // 2. Not in preparation phase
    // 3. Current segment has video to play
    const currentSegment = segments[currentSegmentIndex];
    const shouldAutoPlay =
      isRunning && !isPreparingToStart && currentSegment?.shouldPlayVideo;

    if (shouldAutoPlay) {
      // Add delay for iOS compatibility
      setTimeout(() => {
        videoRef.current?.play().catch((err) => {
          console.error("Error auto-playing video on segment change:", err);
          // Fallback to showing image if video fails
        });
      }, 100);
    }
  }, [currentSegmentIndex, isRunning, isPreparingToStart, segments]);

  // Play exercise audio instructions when a new exercise segment starts
  const playExerciseInstructions = useCallback((exercise: Exercise) => {
    if (!audioInstructionsEnabled) return;
    
    // Stop any currently playing audio
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    speechSynthesis.cancel();
    
    const figure = exercise.figure;
    
    if (figure.audio_url) {
      // Option 1: Play the recorded audio file
      const audio = new Audio(figure.audio_url);
      audioPlayerRef.current = audio;
      audio.play().catch(err => console.warn("Audio playback failed:", err));
    } else if (figure.instructions) {
      // Option 2: Read instructions using speech synthesis (in Polish)
      const utterance = new SpeechSynthesisUtterance(figure.instructions);
      utterance.lang = "pl-PL";
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  }, [audioInstructionsEnabled]);

  // Auto-play instructions when a new exercise starts
  useEffect(() => {
    if (!isRunning || isPreparingToStart) return;
    
    const currentSegment = segments[currentSegmentIndex];
    if (currentSegment?.type !== "exercise") return;
    
    const exerciseIndex = currentSegment.exerciseIndex;
    
    // Only play if this is a new exercise (not already played)
    if (lastPlayedExerciseIndexRef.current === exerciseIndex) return;
    lastPlayedExerciseIndexRef.current = exerciseIndex;
    
    const exercise = exercises[exerciseIndex];
    if (exercise) {
      playExerciseInstructions(exercise);
    }
  }, [currentSegmentIndex, isRunning, isPreparingToStart, segments, exercises, playExerciseInstructions]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      speechSynthesis.cancel();
    };
  }, []);

  // Auto-enter fullscreen when exercises are loaded
  const hasAttemptedAutoFullscreen = useRef(false);
  
  useEffect(() => {
    const requestFullscreenAuto = async () => {
      if (hasAttemptedAutoFullscreen.current || exercises.length === 0 || isLoading) return;
      hasAttemptedAutoFullscreen.current = true;

      // Small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 300));

      try {
        interface ElementWithFullscreen extends HTMLElement {
          webkitRequestFullscreen?: () => Promise<void>;
          mozRequestFullScreen?: () => Promise<void>;
          msRequestFullscreen?: () => Promise<void>;
        }

        const element = document.documentElement as ElementWithFullscreen;

        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
          await element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
          await element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
          await element.msRequestFullscreen();
        }
      } catch (error) {
        // User may have denied fullscreen or it requires user interaction
        console.warn('Auto-fullscreen failed (may require user interaction):', error);
      }
    };

    requestFullscreenAuto();
  }, [exercises.length, isLoading]);

  // Fullscreen API handling
  useEffect(() => {
    interface DocumentWithFullscreen extends Document {
      webkitFullscreenElement?: Element | null;
      mozFullScreenElement?: Element | null;
      msFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => Promise<void>;
      mozCancelFullScreen?: () => Promise<void>;
      msExitFullscreen?: () => Promise<void>;
    }

    interface ElementWithFullscreen extends HTMLElement {
      webkitRequestFullscreen?: () => Promise<void>;
      mozRequestFullScreen?: () => Promise<void>;
      msRequestFullscreen?: () => Promise<void>;
    }

    const doc = document as DocumentWithFullscreen;
    const handleFullscreenChange = () => {
      setIsFullscreen(
        !!(
          document.fullscreenElement ||
          doc.webkitFullscreenElement ||
          doc.mozFullScreenElement ||
          doc.msFullscreenElement
        )
      );
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    // Cleanup: Exit fullscreen and remove listeners on unmount
    return () => {
      // Exit fullscreen if active
      const exitFullscreen = async () => {
        try {
          if (
            document.fullscreenElement ||
            doc.webkitFullscreenElement ||
            doc.mozFullScreenElement ||
            doc.msFullscreenElement
          ) {
            if (document.exitFullscreen) {
              await document.exitFullscreen();
            } else if (doc.webkitExitFullscreen) {
              await doc.webkitExitFullscreen();
            } else if (doc.mozCancelFullScreen) {
              await doc.mozCancelFullScreen();
            } else if (doc.msExitFullscreen) {
              await doc.msExitFullscreen();
            }
          }
        } catch (error) {
          console.error("Error exiting fullscreen on unmount:", error);
        }
      };

      exitFullscreen();

      // Remove event listeners
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      interface DocumentWithFullscreen extends Document {
        webkitFullscreenElement?: Element | null;
        mozFullScreenElement?: Element | null;
        msFullscreenElement?: Element | null;
        webkitExitFullscreen?: () => Promise<void>;
        mozCancelFullScreen?: () => Promise<void>;
        msExitFullscreen?: () => Promise<void>;
      }

      interface ElementWithFullscreen extends HTMLElement {
        webkitRequestFullscreen?: () => Promise<void>;
        mozRequestFullScreen?: () => Promise<void>;
        msRequestFullscreen?: () => Promise<void>;
      }

      const doc = document as DocumentWithFullscreen;
      const element = document.documentElement as ElementWithFullscreen;

      if (
        !document.fullscreenElement &&
        !doc.webkitFullscreenElement &&
        !doc.mozFullScreenElement &&
        !doc.msFullscreenElement
      ) {
        // Enter fullscreen
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
          await element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
          await element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
          await element.msRequestFullscreen();
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
    }
  };

  const getVideoPositionClass = (position?: string): string => {
    switch (position) {
      case "top":
        return "object-top";
      case "bottom":
        return "object-bottom";
      case "left":
        return "object-left";
      case "right":
        return "object-right";
      case "center":
      default:
        return "object-center";
    }
  };

  const handleOpenExerciseInfo = () => {
    const currentSegment = getCurrentSegment();
    if (!currentSegment || currentSegment.type !== "exercise") return;

    const currentExercise = exercises[currentSegment.exerciseIndex];
    if (!currentExercise) return;

    setSelectedFigure({
      id: currentExercise.figure.id,
      name: currentExercise.figure.name,
      image_url: currentExercise.figure.image_url,
      video_url: currentExercise.figure.video_url,
      description: currentExercise.figure.description,
      instructions: currentExercise.figure.instructions,
      tags: currentExercise.figure.tags,
    });
    setIsFigureModalOpen(true);
  };

  const handleWorkoutComplete = async () => {
    if (!user || !challengeId || !dayId) {
      console.error("Missing required data:", {
        user: !!user,
        challengeId,
        dayId,
      });
      toast({
        title: "Błąd",
        description: "Brak wymaganych danych do zapisania postępu",
        variant: "destructive",
      });
      return;
    }

    try {
      // Release wake lock when workout is completed
      releaseWakeLock();

      // Complete the challenge day using new progress system
      const { data: trainingDay, error: trainingDayError } = await supabase
        .from("challenge_training_days")
        .select("day_number")
        .eq("id", dayId)
        .single();

      if (trainingDayError) {
        console.error("Training day error:", trainingDayError);
        throw new Error("Nie udało się pobrać danych dnia treningowego");
      }

      const progressData = {
        status: "completed",
        changed_status_at: new Date().toISOString(),
        exercises_completed: exercises.length,
        total_exercises: exercises.length,
      };

      // Upsert record (update if exists, insert if not)
      const { error: progressError } = await supabase
        .from("challenge_day_progress")
        .upsert(
          {
            user_id: user.id,
            challenge_id: challengeId,
            training_day_id: dayId,
            attempt_number: 1,
            ...progressData,
          },
          {
            onConflict: "user_id,challenge_id,training_day_id,attempt_number",
          }
        );

      if (progressError) {
        console.error("Progress error:", progressError);
        throw new Error(
          `Nie udało się zapisać postępu: ${progressError.message}`
        );
      }

      // Update participant status - non-critical, just log errors
      const { error: participantError } = await supabase
        .from("challenge_participants")
        .update({
          status: "active",
        })
        .eq("user_id", user.id)
        .eq("challenge_id", challengeId);

      if (participantError) {
        console.error(
          "Participant update error (non-critical):",
          participantError
        );
      }

      // Success - show toast and navigate
      toast({
        title: "Trening ukończony!",
        description:
          "Świetna robota! Dzień treningowy został oznaczony jako ukończony.",
      });

      // Small delay before navigate to ensure toast is visible
      setTimeout(() => {
        navigate(`/challenges/${challengeId}`);
      }, 300);
    } catch (error: any) {
      console.error("Error completing workout:", error);
      toast({
        title: "Błąd",
        description:
          error.message || "Nie udało się oznaczyć treningu jako ukończony",
        variant: "destructive",
      });
    }
  };

  const handlePlayPause = () => {
    if (!isRunning && !isPreparingToStart) {
      // Only show preparation phase for exercises, not rest periods
      const currentSegment = segments[currentSegmentIndex];
      const shouldPrepare =
        currentSegment?.type === "exercise" &&
        timeRemaining === currentSegment?.duration;

      if (shouldPrepare) {
        setIsPreparingToStart(true);
        setPreparationTime(10);
        if (audioMode === "sound") {
          speak("Get ready!");
        }
        // Request wake lock when starting the timer
        requestWakeLock();
      } else {
        // Resume directly without preparation for rest or paused exercises
        setIsRunning(true);
        requestWakeLock();
      }
    } else if (isPreparingToStart) {
      setIsPreparingToStart(false);
      setPreparationTime(10);
      // Release wake lock when canceling
      releaseWakeLock();
    } else {
      setIsRunning(!isRunning);
      if (!isRunning) {
        // Request wake lock when resuming
        requestWakeLock();
      } else {
        // Release wake lock when pausing
        releaseWakeLock();
      }
    }
  };

  const handleSkip = () => {
    handleSegmentComplete();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const calculateProgress = (): number => {
    if (segments.length === 0) return 0;
    const totalDuration = segments.reduce(
      (sum, segment) => sum + segment.duration,
      0
    );
    const completedDuration = segments
      .slice(0, currentSegmentIndex)
      .reduce((sum, segment) => sum + segment.duration, 0);
    const currentSegmentProgress = segments[currentSegmentIndex]
      ? segments[currentSegmentIndex].duration - timeRemaining
      : 0;
    return ((completedDuration + currentSegmentProgress) / totalDuration) * 100;
  };

  const getCurrentSegment = () => segments[currentSegmentIndex];
  const getNextSegment = () => segments[currentSegmentIndex + 1];

  // Get next exercise (skip rest periods)
  const getNextExercise = () => {
    for (let i = currentSegmentIndex + 1; i < segments.length; i++) {
      if (segments[i].type === "exercise") {
        return segments[i];
      }
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-black to-purple-950/10 flex items-center justify-center overflow-y-auto md:fixed md:inset-0">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-black to-purple-950/10 flex items-center justify-center overflow-y-auto md:fixed md:inset-0">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            Nie znaleziono ćwiczeń
          </h2>
        </div>
      </div>
    );
  }

  if (segments.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-black to-purple-950/10 flex items-center justify-center overflow-y-auto md:fixed md:inset-0">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            Przygotowywanie timera...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-tr from-black to-purple-950/10 text-white flex flex-col ${
        isFullscreen ? "fixed inset-0 overflow-hidden" : "overflow-y-auto"
      }`}
    >
      {/* Hide AppLayout elements when in fullscreen */}
      {isFullscreen && (
        <style>{`
          header,
          nav[class*="BottomNavigation"],
          nav.fixed.bottom-0,
          [class*="TopHeader"] {
            display: none !important;
          }
          main {
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }
        `}</style>
      )}
      <div
        className={`flex-1 flex flex-col container mx-auto px-2 sm:px-4 pt-1 sm:pt-20 md:pt-6 py-2 sm:py-3 md:py-6 max-w-4xl lg:max-w-6xl md:max-w-3xl xl:max-w-4xl min-h-0 ${
          isFullscreen ? "h-screen pt-2" : ""
        }`}
      >
        {/* Header with controls - positioned to be visible below TopHeader */}
        <div className="flex items-center justify-between mb-1 sm:mb-2 md:mb-6 flex-shrink-0 relative z-50">
          <div></div>

          <div className="flex items-center gap-2 sm:gap-3 relative z-50">
            <div className="hidden sm:flex items-center gap-2 text-sm text-white/70">
              <span>
                {currentSegmentIndex + 1} z {segments.length}
              </span>
            </div>

            {/* Info Button - only show during exercise, not rest */}
            {getCurrentSegment()?.type === "exercise" && (
              <Button
                variant="ghost"
                onClick={handleOpenExerciseInfo}
                className="text-white hover:bg-white/10 transition-all bg-white/5 min-w-[44px] min-h-[44px] relative z-50"
                title="Informacje o ćwiczeniu"
              >
                <Info className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            )}

            <Button
              variant="ghost"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/10 transition-all bg-white/5 min-w-[44px] min-h-[44px] relative z-50"
              title={isFullscreen ? "Wyjdź z pełnego ekranu" : "Pełny ekran"}
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <Maximize className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                const modes: Array<"sound" | "no_sound" | "minimal_sound"> = [
                  "minimal_sound",
                  "sound",
                  "no_sound",
                ];
                const currentIndex = modes.indexOf(audioMode);
                const nextMode = modes[(currentIndex + 1) % modes.length];
                setAudioMode(nextMode);
                localStorage.setItem("challengeTimerAudioMode", nextMode);
              }}
              className={`text-white hover:bg-white/10 transition-all min-w-[44px] min-h-[44px] relative z-50 ${
                audioMode === "sound"
                  ? "bg-primary/20 text-primary"
                  : audioMode === "minimal_sound"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-white/5"
              }`}
              title={
                audioMode === "sound"
                  ? "Tryb dźwięku: Pełny dźwięk - słyszysz pełne komunikaty głosowe"
                  : audioMode === "minimal_sound"
                  ? "Tryb dźwięku: Minimalny dźwięk - słyszysz tylko sygnały dźwiękowe"
                  : "Tryb dźwięku: Wyciszony - brak dźwięków"
              }
            >
              {audioMode === "sound" ? (
                <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : audioMode === "minimal_sound" ? (
                <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
                  <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-current rounded-full animate-pulse"></div>
                </div>
              ) : (
                <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </Button>

            {/* Audio Instructions Toggle */}
            <Button
              variant="ghost"
              onClick={() => {
                const newValue = !audioInstructionsEnabled;
                setAudioInstructionsEnabled(newValue);
                localStorage.setItem("challengeTimerAudioInstructions", newValue.toString());
                toast({
                  title: newValue ? "Instrukcje audio włączone" : "Instrukcje audio wyłączone",
                  description: newValue 
                    ? "Instrukcje do ćwiczeń będą odtwarzane automatycznie"
                    : "Instrukcje nie będą odtwarzane",
                });
              }}
              className={`text-white hover:bg-white/10 transition-all min-w-[44px] min-h-[44px] relative z-50 ${
                audioInstructionsEnabled 
                  ? "bg-blue-500/20 text-blue-400" 
                  : "bg-white/5"
              }`}
              title={audioInstructionsEnabled 
                ? "Instrukcje audio: Włączone - instrukcje są odtwarzane przy starcie ćwiczenia" 
                : "Instrukcje audio: Wyłączone"
              }
            >
              {audioInstructionsEnabled ? (
                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <MessageCircleOff className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Progress Bar - Desktop */}
        <div className="mb-4 flex-shrink-0 hidden md:block">
          <div className="text-sm text-white/70 mb-2 font-medium">
            {currentSegmentIndex + 1} z {segments.length}
          </div>
          <div className="relative">
            <Progress
              value={calculateProgress()}
              className="w-full h-2 bg-white/10 rounded-full overflow-hidden"
            />
            <div
              className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-300"
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
        </div>

        {/* Progress Bar - Mobile (after exercise image) */}
        {getCurrentSegment() && (
          <div className={`mt-2 flex-shrink-0 block md:hidden`}>
            <div className="relative">
              <Progress
                value={calculateProgress()}
                className="w-full h-1.5 sm:h-2 bg-white/10 rounded-full overflow-hidden"
              />
              <div
                className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-300"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
          </div>
        )}

        {/* Nowe ćwiczenie */}
        {getCurrentSegment() && (
          <Card
            className={`glass-effect border-white/10 flex-shrink-0 backdrop-blur-xl mt-6 mx-2 ${
              getCurrentSegment()?.type === "rest"
                ? "bg-gradient-to-br from-green-500/20 via-cyan-500/15 to-blue-500/20 border-green-400/30"
                : "bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"
            }`}
          >
            <CardContent className="p-4 sm:p-6 md:p-8">
              {getCurrentSegment()?.type === "exercise" ? (
                <div className="relative w-full h-[250px] sm:h-[300px] md:h-[400px] rounded-2xl overflow-hidden ring-1 ring-white/10 mb-6">
                  <>
                    {getCurrentSegment()?.shouldPlayVideo &&
                    getCurrentSegment()?.videoUrl ? (
                      <video
                        ref={videoRef}
                        src={getCurrentSegment()?.videoUrl}
                        className={`w-full h-full object-cover ${getVideoPositionClass(
                          getCurrentSegment()?.videoPosition
                        )}`}
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                    ) : getCurrentSegment()?.exerciseImage ? (
                      <img
                        src={getCurrentSegment()?.exerciseImage}
                        alt={getCurrentSegment()?.exerciseName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                        <span className="text-6xl opacity-70">🏃‍♂️</span>
                      </div>
                    )}

                    {/* Overlay with Start button OR Preparation Countdown */}
                    {(!isRunning || isPreparingToStart) && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10 transition-all duration-300">
                        {isPreparingToStart ? (
                          <>
                            {/* Preparation countdown display */}
                            <div className="text-center">
                              <div className="text-yellow-400 text-sm sm:text-base md:text-lg font-semibold mb-2 uppercase tracking-wider">
                                Przygotuj się!
                              </div>
                              <div className="text-white text-6xl sm:text-7xl md:text-8xl font-bold animate-pulse">
                                {preparationTime}
                              </div>
                              <div className="text-white/70 text-base sm:text-lg md:text-xl mt-4">
                                Trening rozpocznie się za chwilę
                              </div>
                            </div>
                            {/* Cancel button */}
                            <Button
                              onClick={handlePlayPause}
                              variant="ghost"
                              className="mt-6 text-white/70 hover:text-white hover:bg-white/10"
                            >
                              Anuluj
                            </Button>
                          </>
                        ) : (
                          /* Start button */
                          <Button
                            onClick={handlePlayPause}
                            size="lg"
                            variant="primary"
                            className="px-8 sm:px-12 md:px-16 py-6 sm:py-8 md:py-10 text-xl sm:text-2xl md:text-3xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 rounded-2xl hover:scale-110"
                          >
                            <Play className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mr-3 sm:mr-4" />
                            Start
                          </Button>
                        )}
                      </div>
                    )}
                  </>
                </div>
              ) : null}

              {/* Exercise name and duration */}
              <div className="text-center space-y-2">
                <h2
                  className={`font-bold text-xl sm:text-2xl md:text-3xl ${
                    getCurrentSegment()?.type === "rest"
                      ? "text-green-400 animate-pulse"
                      : "text-foreground"
                  }`}
                >
                  {getCurrentSegment()?.exerciseName}
                </h2>
                <p className="text-lg sm:text-xl text-muted-foreground">
                  {formatTime(timeRemaining)}
                </p>
                {getCurrentSegment()?.exerciseNotes && (
                  <p className="text-sm sm:text-base text-primary mt-2 bg-primary/10 rounded-lg px-4 py-2 border border-primary/20 backdrop-blur-sm">
                    {getCurrentSegment()?.exerciseNotes}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Up Section - Large version during rest */}
        {getNextExercise() && getCurrentSegment()?.type === "rest" && (
          <Card className="glass-effect border-white/10 flex-shrink-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 backdrop-blur-xl mt-6 mx-2">
            <CardContent className="p-4 sm:p-6 md:p-8">
              <h3 className="text-sm sm:text-base font-medium text-muted-foreground mb-4 sm:mb-6 uppercase tracking-wider flex items-center">
                <span className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></span>
                Następne ćwiczenie
              </h3>

              {/* Large video or image preview */}
              <div className="relative w-full h-[250px] sm:h-[300px] md:h-[400px] rounded-2xl overflow-hidden ring-1 ring-white/10 mb-6">
                {getNextExercise().shouldPlayVideo &&
                getNextExercise().videoUrl ? (
                  <video
                    src={getNextExercise().videoUrl}
                    className={`w-full h-full object-cover ${getVideoPositionClass(
                      getNextExercise().videoPosition
                    )}`}
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : getNextExercise().exerciseImage ? (
                  <img
                    src={getNextExercise().exerciseImage}
                    alt={getNextExercise().exerciseName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                    <span className="text-6xl opacity-70">🏃‍♂️</span>
                  </div>
                )}
              </div>

              {/* Exercise name and duration */}
              <div className="text-center space-y-2">
                {getNextExercise().exerciseNotes && (
                  <p className="text-sm sm:text-base text-primary mt-2 bg-primary/10 rounded-lg px-4 py-2 border border-primary/20 backdrop-blur-sm">
                    {getNextExercise().exerciseNotes}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Up Section - Small version during exercise */}
        {getNextExercise() && getCurrentSegment()?.type === "exercise" && (
          <Card className="glass-effect border-white/10 flex-shrink-0 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-md mt-6 mx-2">
            <CardContent className="p-2 sm:p-3 md:p-4">
              <h3 className="text-xs sm:text-sm md:text-base font-semibold text-white mb-1.5 sm:mb-2 md:mb-3 flex items-center">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full mr-1.5 sm:mr-2 animate-pulse"></span>
                Następne ćwiczenie
              </h3>
              <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
                {getNextExercise().exerciseImage ? (
                  <div className="relative flex-shrink-0">
                    <img
                      src={getNextExercise().exerciseImage}
                      alt={getNextExercise().exerciseName}
                      className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 object-cover rounded-lg sm:rounded-xl md:rounded-2xl ring-1 ring-white/30 shadow-lg"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-white/10 to-white/5 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center ring-1 ring-white/20 shadow-lg backdrop-blur-sm flex-shrink-0">
                    <span className="text-base sm:text-xl md:text-2xl opacity-70">
                      🏃‍♂️
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-xs sm:text-sm md:text-base truncate">
                    {getNextExercise().exerciseName}
                  </div>
                  <div className="text-xs sm:text-sm text-white/70 font-medium">
                    {formatTime(getNextExercise().duration)}
                  </div>
                  {getNextExercise().exerciseNotes && (
                    <div className="text-[10px] sm:text-xs text-primary mt-0.5 sm:mt-1 bg-primary/10 rounded sm:rounded-lg px-1.5 sm:px-2 py-0.5 sm:py-1 border border-primary/20 backdrop-blur-sm truncate">
                      {getNextExercise().exerciseNotes}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Controls */}
        <div className="mt-4 flex flex-col gap-2 sm:gap-3 items-center justify-center mb-2 sm:mb-3 md:mb-4 flex-shrink-0">
          {isRunning || isPreparingToStart ? (
            <div className="flex flex-row md:flex-col gap-2 sm:gap-3 w-full items-center">
              <Button
                onClick={handlePlayPause}
                size="lg"
                variant="primary"
                className="flex-1 md:w-full md:max-w-xs px-3 sm:px-4 md:px-4 py-2.5 sm:py-3 md:py-3 text-base sm:text-lg md:text-lg font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 rounded-xl sm:rounded-2xl hover:scale-105"
              >
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 mr-1.5 sm:mr-2 md:mr-2" />
                {isPreparingToStart ? "Anuluj" : "Pauza"}
              </Button>

              <Button
                onClick={handleSkip}
                variant="outline"
                size="lg"
                className="flex-1 md:w-full md:max-w-xs px-3 sm:px-4 md:px-4 py-2.5 sm:py-3 md:py-2.5 text-sm sm:text-base md:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl sm:rounded-2xl"
              >
                Pomiń
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Completion Dialog */}
      <Dialog open={isCompleted} onOpenChange={setIsCompleted}>
        <DialogContent className="glass-effect border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              {isPracticeMode ? "Powtórka ukończona! 💪" : "Trening ukończony! 🎉"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {isPracticeMode 
                ? "Świetna robota! To był trening w trybie powtórki - postęp nie został zapisany."
                : "Świetna robota! Co chcesz teraz zrobić?"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-6">
            {isPracticeMode ? (
              <>
                <Button
                  onClick={() => {
                    setIsCompleted(false);
                    setCurrentSegmentIndex(0);
                    setTimeRemaining(segments[0]?.duration || 0);
                    setIsRunning(false);
                    setIsPreparingToStart(false);
                    setPreparationTime(10);
                  }}
                  className="w-full"
                  variant="default"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Powtórz trening
                </Button>
                <Button
                  onClick={() => navigate(`/challenges/${challengeId}`)}
                  variant="outline"
                  className="w-full"
                >
                  Wróć do wyzwania
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleWorkoutComplete}
                  className="w-full"
                  variant="default"
                >
                  Oznacz jako ukończone
                </Button>
                <Button
                  onClick={() => {
                    setIsCompleted(false);
                    setShowSharePostModal(true);
                  }}
                  variant="secondary"
                  className="w-full"
                >
                  <Share className="w-4 h-4 mr-2" />
                  Ukończ i udostępnij
                </Button>
                <Button
                  onClick={() => {
                    setIsCompleted(false);
                    setCurrentSegmentIndex(0);
                    setTimeRemaining(segments[0]?.duration || 0);
                    setIsRunning(false);
                    setIsPreparingToStart(false);
                    setPreparationTime(10);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Rozpocznij od nowa
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Exercise Info Modal */}
      <ChallengeExerciseInfoModal
        exercise={selectedFigure}
        isOpen={isFigureModalOpen}
        onClose={() => {
          setIsFigureModalOpen(false);
          setSelectedFigure(null);
        }}
      />

      {/* Share Post Modal */}
      <CreatePostModal
        isOpen={showSharePostModal}
        onClose={() => setShowSharePostModal(false)}
        onPostCreated={(post) => {
          setShowSharePostModal(false);
          navigate(`/challenges/${challengeId}`);
        }}
        initialContent={`🎉 Właśnie ukończyłem dzień ${trainingDayData?.day_number || 1} wyzwania "${challengeTitle}"! 💪\n\nKolejny krok za mną! #challenge #trening #postęp`}
        onBeforeSubmit={async () => {
          await handleWorkoutComplete();
        }}
      />
    </div>
  );
};

export default ChallengeDayTimer;
