import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  Target, 
  Zap, 
  Heart,
  Loader2,
  CheckCircle,
  Circle,
  Hand,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipForward,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSpeech } from '@/hooks/useSpeech';
import { useWakeLock } from '@/hooks/useWakeLock';

interface TrainingSession {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  difficulty_level: string;
  playlist: string;
  thumbnail_url: string;
  published: boolean;
  warmup_exercises: any;
  figures: any;
  stretching_exercises: any;
  type: string;
  created_at: string;
  user_id: string;
}

interface Exercise {
  id?: string;
  name: string;
  reps?: number;
  sets?: number;
  hold_time_seconds?: number;
  notes?: string;
  order_index?: number;
  completion_mode?: 'time' | 'completion';
}

interface TimerSegment {
  type: "exercise" | "rest";
  exerciseIndex: number;
  setIndex: number;
  duration: number;
  exerciseName: string;
  exerciseNotes?: string;
  exerciseImage?: string;
  videoUrl?: string;
  videoPosition?: string;
  reps?: number;
  sets?: number;
}

interface ExerciseMedia {
  image_url?: string;
  video_url?: string;
}

const TrainingExerciseSession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { toast } = useToast();

  // Get URL parameters for level context
  const searchParams = new URLSearchParams(window.location.search);
  const fromLevel = searchParams.get('from') === 'level';
  const levelId = searchParams.get('levelId');
  const sportCategory = searchParams.get('sportCategory');
  
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState<'warmup' | 'figures' | 'stretching'>('warmup');
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());

  // Timer-specific states
  const [segments, setSegments] = useState<TimerSegment[]>([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [audioMode, setAudioMode] = useState<"sound" | "no_sound" | "minimal_sound">(() => {
    const saved = localStorage.getItem("trainingTimerAudioMode");
    return (saved as "sound" | "no_sound" | "minimal_sound") || "minimal_sound";
  });
  const [hasAnnouncedSegment, setHasAnnouncedSegment] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isPreparingToStart, setIsPreparingToStart] = useState(false);
  const [preparationTime, setPreparationTime] = useState(10);
  const [exerciseMedia, setExerciseMedia] = useState<Record<string, ExerciseMedia>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { speak } = useSpeech(audioMode === "sound");
  const {
    requestWakeLock,
    releaseWakeLock,
  } = useWakeLock();

  const videoRef = useRef<HTMLVideoElement>(null);
  const hasAttemptedAutoFullscreen = useRef(false);

  // Fetch session data from database
  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) {
        navigate('/training');
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('training_sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        if (error) {
          console.error('Error fetching session:', error);
          throw error;
        }

        if (!data) {
          toast({
            title: "Nie znaleziono sesji",
            description: "Sesja treningowa, której szukasz, nie istnieje.",
            variant: "destructive",
          });
          navigate('/training');
          return;
        }

        // Check if user has access to this session
        if (!data.published && data.user_id !== user?.id && !isAdmin) {
          toast({
            title: "Brak dostępu",
            description: "Ta sesja treningowa nie jest opublikowana lub nie masz do niej dostępu.",
            variant: "destructive",
          });
          navigate('/training');
          return;
        }

        setSession({
          ...data,
          warmup_exercises: data.warmup_exercises || [],
          figures: data.figures || [],
          stretching_exercises: data.stretching_exercises || []
        });
      } catch (error) {
        console.error('Error fetching session:', error);
        toast({
          title: "Błąd",
          description: "Nie udało się załadować sesji treningowej.",
          variant: "destructive",
        });
        navigate('/training');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId, user?.id, isAdmin, navigate, toast]);

  // Fetch exercise images and videos from figures library
  useEffect(() => {
    const fetchExerciseMedia = async () => {
      if (!session) return;
      
      const exerciseNames = new Set<string>();
      
      const allExercises = [
        ...(Array.isArray(session.warmup_exercises) ? session.warmup_exercises : []),
        ...(Array.isArray(session.figures) ? session.figures : []),
        ...(Array.isArray(session.stretching_exercises) ? session.stretching_exercises : [])
      ];
      
      allExercises.forEach(exercise => {
        if (exercise.name) {
          exerciseNames.add(exercise.name);
        }
      });

      if (exerciseNames.size === 0) return;

      const { data: figures, error } = await supabase
        .from('figures')
        .select('name, image_url, video_url')
        .in('name', Array.from(exerciseNames));

      if (error) {
        console.error('Error fetching exercise media:', error);
        return;
      }

      const mediaMap: Record<string, ExerciseMedia> = {};
      figures?.forEach(figure => {
        mediaMap[figure.name] = {
          image_url: figure.image_url || undefined,
          video_url: figure.video_url || undefined,
        };
      });

      setExerciseMedia(mediaMap);
    };

    fetchExerciseMedia();
  }, [session]);

  // Generate timer segments when session and media are loaded
  useEffect(() => {
    if (!session || session.type !== 'timer') return;
    generateTimerSegments(session);
  }, [session, exerciseMedia]);

  // Create beeping sound for minimal mode
  const playBeep = useCallback((type: "countdown" | "transition" | "ready" | "final" = "countdown") => {
    if (audioMode !== "minimal_sound") return;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === "countdown") {
      oscillator.frequency.value = 1000;
    } else if (type === "transition") {
      oscillator.frequency.value = 800;
    } else if (type === "ready") {
      oscillator.frequency.value = 1200;
    } else if (type === "final") {
      oscillator.frequency.value = 1400;
    }

    oscillator.type = "sine";
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(type === "final" ? 0.35 : 0.2, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + (type === "final" ? 0.3 : 0.2));
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + (type === "final" ? 0.3 : 0.2));
  }, [audioMode]);

  const generateTimerSegments = (sessionData: TrainingSession) => {
    const timerSegments: TimerSegment[] = [];
    let exerciseIndex = 0;

    const allSections = [
      { exercises: sessionData.warmup_exercises, name: 'warmup' },
      { exercises: sessionData.figures, name: 'figures' },
      { exercises: sessionData.stretching_exercises, name: 'stretching' }
    ];

    allSections.forEach(section => {
      if (Array.isArray(section.exercises)) {
        section.exercises.forEach((exercise: any) => {
          const exerciseName = typeof exercise === 'string' ? exercise : exercise.name;
          const sets = exercise.sets || 1;
          const holdTime = exercise.hold_time_seconds || 30;
          const restTime = exercise.rest_time_seconds || 15;
          const isCompletionMode = exercise.completion_mode === 'completion' || exercise.hold_time_seconds === 0;
          const media = exerciseMedia[exerciseName];

          if (isCompletionMode) {
            for (let setIndex = 0; setIndex < sets; setIndex++) {
              timerSegments.push({
                type: "exercise",
                exerciseIndex,
                setIndex,
                duration: 0,
                exerciseName: sets > 1 ? `${exerciseName} (Set ${setIndex + 1}/${sets})` : exerciseName,
                exerciseNotes: exercise.notes,
                exerciseImage: media?.image_url,
                videoUrl: media?.video_url,
                videoPosition: exercise.video_position || "center",
                reps: exercise.reps,
                sets: exercise.sets
              });
            }
            exerciseIndex++;
            return;
          }

          for (let setIndex = 0; setIndex < sets; setIndex++) {
            timerSegments.push({
              type: "exercise",
              exerciseIndex,
              setIndex,
              duration: holdTime,
              exerciseName: sets > 1 ? `${exerciseName} (Set ${setIndex + 1}/${sets})` : exerciseName,
              exerciseNotes: exercise.notes,
              exerciseImage: media?.image_url,
              videoUrl: media?.video_url,
              videoPosition: exercise.video_position || "center",
              reps: exercise.reps,
              sets: exercise.sets
            });

            if (setIndex < sets - 1 || exerciseIndex < allSections.reduce((total, s) => total + (Array.isArray(s.exercises) ? s.exercises.length : 0), 0) - 1) {
              timerSegments.push({
                type: "rest",
                exerciseIndex,
                setIndex,
                duration: restTime,
                exerciseName: "Przerwa"
              });
            }
          }
          exerciseIndex++;
        });
      }
    });

    setSegments(timerSegments);
    if (timerSegments.length > 0) {
      setTimeRemaining(timerSegments[0].duration);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
    if (currentSegmentIndex >= segments.length - 1) {
      setIsCompleted(true);
      setIsRunning(false);
      releaseWakeLock();
      if (audioMode === "sound") {
        speak("Trening ukończony! Świetna robota!");
      }
      return;
    }

    const nextIndex = currentSegmentIndex + 1;
    const nextSegment = segments[nextIndex];

    setCurrentSegmentIndex(nextIndex);
    setTimeRemaining(nextSegment.duration);
  }, [currentSegmentIndex, segments, audioMode, speak, releaseWakeLock]);

  // Timer effects
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isPreparingToStart && preparationTime > 0) {
      interval = setInterval(() => {
        setPreparationTime(prev => {
          if (audioMode === "sound") {
            if (prev > 2 && prev < 7) {
              speak((prev - 1).toString());
            } else if (prev === 2) {
              speak("1... Rozpocznij!");
            }
          } else if (audioMode === "minimal_sound") {
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
        setTimeRemaining(prev => {
          if (audioMode === "sound" && prev <= 7 && prev > 1) {
            speak((prev - 2).toString());
          }
          
          if (audioMode === "minimal_sound" && currentSegmentIndex < segments.length && prev <= 5 && prev > 0) {
            const currentSegment = segments[currentSegmentIndex];
            if (prev === 1) {
              playBeep("final");
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
  }, [isRunning, isPreparingToStart, timeRemaining, currentSegmentIndex, segments, audioMode, speak, playBeep, handleSegmentComplete]);

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
  }, [currentSegmentIndex, isRunning, hasAnnouncedSegment, segments, audioMode, speak, formatTimeNatural]);

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

  // Reset video when segment changes
  useEffect(() => {
    if (!videoRef.current) return;

    videoRef.current.load();
    videoRef.current.currentTime = 0;

    const currentSegment = segments[currentSegmentIndex];
    const shouldAutoPlay = isRunning && !isPreparingToStart && currentSegment?.videoUrl;

    if (shouldAutoPlay) {
      setTimeout(() => {
        videoRef.current?.play().catch((err) => {
          console.error("Error auto-playing video on segment change:", err);
        });
      }, 100);
    }
  }, [currentSegmentIndex, isRunning, isPreparingToStart, segments]);

  // Auto-enter fullscreen when session loads
  useEffect(() => {
    const requestFullscreenAuto = async () => {
      if (hasAttemptedAutoFullscreen.current || !session || loading || session.type !== 'timer') return;
      hasAttemptedAutoFullscreen.current = true;

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
        console.warn('Auto-fullscreen failed:', error);
      }
    };

    requestFullscreenAuto();
  }, [session, loading]);

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

    return () => {
      // Exit fullscreen on unmount
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
      releaseWakeLock();

      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, [releaseWakeLock]);

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

  const handlePlayPause = () => {
    if (!isRunning && !isPreparingToStart) {
      const currentSegment = segments[currentSegmentIndex];
      const shouldPrepare = currentSegment?.type === "exercise" && timeRemaining === currentSegment?.duration;
      
      if (shouldPrepare) {
        setIsPreparingToStart(true);
        setPreparationTime(10);
        if (audioMode === "sound") {
          speak("Przygotuj się!");
        }
        requestWakeLock();
      } else {
        setIsRunning(true);
        requestWakeLock();
      }
    } else if (isPreparingToStart) {
      setIsPreparingToStart(false);
      setPreparationTime(10);
      releaseWakeLock();
    } else {
      setIsRunning(!isRunning);
      if (!isRunning) {
        requestWakeLock();
      } else {
        releaseWakeLock();
      }
    }
  };

  const handleSkip = () => {
    handleSegmentComplete();
  };

  const handlePrevious = () => {
    if (currentSegmentIndex > 0) {
      const prevIndex = currentSegmentIndex - 1;
      const prevSegment = segments[prevIndex];
      setCurrentSegmentIndex(prevIndex);
      setTimeRemaining(prevSegment.duration);
      setIsRunning(false);
      setHasAnnouncedSegment(false);
    }
  };

  const handleCompletionModeNext = () => {
    if (currentSegmentIndex < segments.length - 1) {
      handleSegmentComplete();
    } else {
      setIsCompleted(true);
      setIsRunning(false);
      releaseWakeLock();
      if (audioMode === "sound") {
        speak("Trening ukończony! Świetna robota!");
      }
    }
  };

  const toggleAudioMode = () => {
    const modes: ("sound" | "no_sound" | "minimal_sound")[] = ["minimal_sound", "sound", "no_sound"];
    const currentIndex = modes.indexOf(audioMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setAudioMode(nextMode);
    localStorage.setItem("trainingTimerAudioMode", nextMode);
  };

  const handleFinishSession = async () => {
    releaseWakeLock();
    
    // Handle level completion tracking if coming from a level
    if (fromLevel && levelId && user && sessionId) {
      try {
        // Check if already completed (first-completion-only logic)
        const { data: existingCompletion } = await supabase
          .from('user_sport_level_training_completions')
          .select('id')
          .eq('user_id', user.id)
          .eq('sport_level_id', levelId)
          .eq('training_id', sessionId)
          .maybeSingle();

        // Only record first completion
        if (!existingCompletion) {
          const { error } = await supabase
            .from('user_sport_level_training_completions')
            .insert({
              user_id: user.id,
              sport_level_id: levelId,
              training_id: sessionId,
              duration_seconds: session?.duration_minutes ? session.duration_minutes * 60 : 0,
            });

          if (error) {
            console.error('Error recording training completion:', error);
          } else {
            toast({
              title: "Trening ukończony!",
              description: "Twój postęp został zapisany.",
            });
          }
        } else {
          toast({
            title: "Trening powtórzony!",
            description: "Świetna robota! (ukończenie już zapisane)",
          });
        }

        // Navigate back to aerial journey
        if (sportCategory) {
          navigate(`/aerial-journey/${sportCategory}`);
          return;
        }
      } catch (error) {
        console.error('Error handling level completion:', error);
      }
    }

    toast({
      title: "Trening ukończony!",
      description: "Świetna robota! Sesja treningowa została ukończona.",
    });
    navigate(`/training/${sessionId}`);
  };

  const calculateProgress = (): number => {
    if (segments.length === 0) return 0;
    const totalDuration = segments.reduce((sum, segment) => sum + segment.duration, 0);
    const completedDuration = segments.slice(0, currentSegmentIndex).reduce((sum, segment) => sum + segment.duration, 0);
    const currentSegmentProgress = segments[currentSegmentIndex] ? segments[currentSegmentIndex].duration - timeRemaining : 0;
    return ((completedDuration + currentSegmentProgress) / totalDuration) * 100;
  };

  const getCurrentSegment = () => segments[currentSegmentIndex];
  
  const getNextExercise = () => {
    for (let i = currentSegmentIndex + 1; i < segments.length; i++) {
      if (segments[i].type === "exercise") {
        return segments[i];
      }
    }
    return null;
  };

  // Manual mode helpers
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-500';
      case 'Intermediate': return 'bg-yellow-500';
      case 'Advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSectionExercises = (): Exercise[] => {
    if (!session) return [];
    
    switch (currentSection) {
      case 'warmup':
        return Array.isArray(session.warmup_exercises) ? session.warmup_exercises : [];
      case 'figures':
        return Array.isArray(session.figures) ? session.figures : [];
      case 'stretching':
        return Array.isArray(session.stretching_exercises) ? session.stretching_exercises : [];
      default:
        return [];
    }
  };

  const getSectionIcon = () => {
    switch (currentSection) {
      case 'warmup':
        return <Zap className="w-5 h-5" />;
      case 'figures':
        return <Target className="w-5 h-5" />;
      case 'stretching':
        return <Heart className="w-5 h-5" />;
      default:
        return <Target className="w-5 h-5" />;
    }
  };

  const getSectionColor = () => {
    switch (currentSection) {
      case 'warmup':
        return 'bg-yellow-500';
      case 'figures':
        return 'bg-purple-500';
      case 'stretching':
        return 'bg-pink-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSectionTitle = () => {
    switch (currentSection) {
      case 'warmup':
        return 'Rozgrzewka';
      case 'figures':
        return 'Trening';
      case 'stretching':
        return 'Rozciąganie';
      default:
        return '';
    }
  };

  const handleExerciseComplete = (exerciseKey: string) => {
    setCompletedExercises(prev => {
      const newSet = new Set(prev);
      if (newSet.has(exerciseKey)) {
        newSet.delete(exerciseKey);
      } else {
        newSet.add(exerciseKey);
      }
      return newSet;
    });
  };

  const moveToNextSection = () => {
    if (currentSection === 'warmup') {
      setCurrentSection('figures');
      setCurrentExerciseIndex(0);
    } else if (currentSection === 'figures') {
      setCurrentSection('stretching');
      setCurrentExerciseIndex(0);
    }
  };

  const moveToPreviousSection = () => {
    if (currentSection === 'stretching') {
      setCurrentSection('figures');
      setCurrentExerciseIndex(0);
    } else if (currentSection === 'figures') {
      setCurrentSection('warmup');
      setCurrentExerciseIndex(0);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-black to-purple-950/10">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Ładowanie sesji treningowej...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Timer Mode UI - Simplified like ChallengeDayTimer
  if (session.type === 'timer') {
    const currentSegment = getCurrentSegment();
    const nextExercise = getNextExercise();

    return (
      <div className={`min-h-screen bg-gradient-to-tr from-black to-purple-950/10 text-white flex flex-col ${
        isFullscreen ? "fixed inset-0 overflow-hidden" : "overflow-y-auto"
      }`}>
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

        <div className={`flex-1 flex flex-col container mx-auto px-2 sm:px-4 pt-1 sm:pt-20 md:pt-6 py-2 sm:py-3 md:py-6 max-w-4xl min-h-0 ${
          isFullscreen ? "h-screen pt-2" : ""
        }`}>
          {/* Header with controls */}
          <div className="flex items-center justify-between mb-1 sm:mb-2 md:mb-6 flex-shrink-0 relative z-50">
            <div className="flex items-center gap-2">
              {!isFullscreen && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(`/training/${sessionId}`)}
                  className="text-white hover:bg-white/10"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3 relative z-50">
              <div className="hidden sm:flex items-center gap-2 text-sm text-white/70">
                <span>{currentSegmentIndex + 1} z {segments.length}</span>
              </div>

              <Button
                variant="ghost"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/10 transition-all bg-white/5 min-w-[44px] min-h-[44px]"
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
                onClick={toggleAudioMode}
                className={`text-white hover:bg-white/10 transition-all min-w-[44px] min-h-[44px] ${
                  audioMode === "sound"
                    ? "bg-primary/20 text-primary"
                    : audioMode === "minimal_sound"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-white/5"
                }`}
                title={
                  audioMode === "sound"
                    ? "Tryb dźwięku: Pełny"
                    : audioMode === "minimal_sound"
                    ? "Tryb dźwięku: Minimalny"
                    : "Tryb dźwięku: Wyciszony"
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

          {/* Progress Bar - Mobile */}
          {currentSegment && (
            <div className="mt-2 flex-shrink-0 block md:hidden">
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

          {/* Completion Screen */}
          {isCompleted ? (
            <div className="flex-1 flex items-center justify-center">
              <Card className="glass-effect border-white/10 w-full max-w-md mx-4">
                <CardContent className="py-12 text-center">
                  <div className="space-y-6">
                    <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-2">Trening ukończony!</h2>
                      <p className="text-white/70">Świetna robota! Ukończyłeś sesję treningową.</p>
                    </div>
                    <Button
                      onClick={handleFinishSession}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Zakończ sesję
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : currentSegment ? (
            <>
              {/* Main Exercise Card */}
              <Card className={`glass-effect border-white/10 flex-shrink-0 backdrop-blur-xl mt-4 sm:mt-6 ${
                currentSegment.type === "rest"
                  ? "bg-gradient-to-br from-green-500/20 via-cyan-500/15 to-blue-500/20 border-green-400/30"
                  : "bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"
              }`}>
                <CardContent className="p-4 sm:p-6 md:p-8">
                  {currentSegment.type === "exercise" ? (
                    <div className="relative w-full h-[250px] sm:h-[300px] md:h-[500px] md:max-w-sm md:mx-auto lg:max-w-md rounded-2xl overflow-hidden ring-1 ring-white/10 mb-6">
                      {currentSegment.videoUrl ? (
                        <video
                          ref={videoRef}
                          src={currentSegment.videoUrl}
                          className={`w-full h-full object-cover ${getVideoPositionClass(currentSegment.videoPosition)}`}
                          autoPlay
                          muted
                          loop
                          playsInline
                        />
                      ) : currentSegment.exerciseImage ? (
                        <img
                          src={currentSegment.exerciseImage}
                          alt={currentSegment.exerciseName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                          <span className="text-6xl opacity-70">🏃‍♂️</span>
                        </div>
                      )}

                      {/* Overlay with Start button OR Preparation Countdown */}
                      {(!isRunning || isPreparingToStart) && currentSegment.duration > 0 && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10 transition-all duration-300">
                          {isPreparingToStart ? (
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
                              <Button
                                onClick={handlePlayPause}
                                variant="ghost"
                                className="mt-6 text-white/70 hover:text-white hover:bg-white/10"
                              >
                                <Pause className="w-5 h-5 mr-2" />
                                Anuluj
                              </Button>
                            </div>
                          ) : (
                            <Button
                              onClick={handlePlayPause}
                              size="lg"
                              className="bg-primary hover:bg-primary/90 text-white px-8 sm:px-12 py-6 sm:py-8 text-xl sm:text-2xl rounded-2xl shadow-2xl shadow-primary/30 transition-all hover:scale-105"
                            >
                              <Play className="w-8 h-8 sm:w-10 sm:h-10 mr-3" />
                              Start
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Rest period display
                    <div className="relative w-full h-[250px] sm:h-[300px] md:h-[500px] md:max-w-sm md:mx-auto lg:max-w-md rounded-2xl overflow-hidden ring-1 ring-green-400/30 mb-6 bg-gradient-to-br from-green-500/20 to-cyan-500/20 flex items-center justify-center">
                      <Hand className="w-24 h-24 sm:w-32 sm:h-32 text-green-400 opacity-80" />
                    </div>
                  )}

                  {/* Exercise Name and Timer */}
                  <div className="text-center">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">
                      {currentSegment.exerciseName}
                    </h2>

                    {currentSegment.exerciseNotes && currentSegment.type === "exercise" && (
                      <p className="text-sm sm:text-base text-primary/90 bg-primary/10 rounded-lg p-2 sm:p-3 border border-primary/20 mb-4">
                        {currentSegment.exerciseNotes}
                      </p>
                    )}

                    {currentSegment.duration === 0 ? (
                      // Completion mode
                      <div className="space-y-4">
                        <div className="flex items-center justify-center gap-2 text-green-400">
                          <CheckCircle className="w-6 h-6" />
                          <span className="text-lg font-semibold">Tryb ukończenia</span>
                        </div>
                        {currentSegment.reps && (
                          <p className="text-white/70">Wykonaj {currentSegment.reps} powtórzeń</p>
                        )}
                        <Button
                          onClick={handleCompletionModeNext}
                          size="lg"
                          className="bg-green-500 hover:bg-green-600 text-white px-8 py-4"
                        >
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Gotowe
                        </Button>
                      </div>
                    ) : (
                      // Timer display
                      <div className="text-5xl sm:text-6xl md:text-7xl font-mono font-bold text-primary mb-6">
                        {formatTime(timeRemaining)}
                      </div>
                    )}

                    {/* Control buttons */}
                    {currentSegment.duration > 0 && (isRunning || isPreparingToStart) && (
                      <div className="flex justify-center gap-3 mt-4">
                        <Button
                          onClick={handlePlayPause}
                          variant="outline"
                          size="lg"
                          className="border-white/20 text-white hover:bg-white/10 min-w-[120px]"
                        >
                          <Pause className="w-5 h-5 mr-2" />
                          Pauza
                        </Button>
                        <Button
                          onClick={handleSkip}
                          variant="outline"
                          size="lg"
                          className="border-white/20 text-white hover:bg-white/10 min-w-[120px]"
                        >
                          <SkipForward className="w-5 h-5 mr-2" />
                          Pomiń
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Next Exercise Preview */}
              {nextExercise && (
                <Card className="glass-effect border-white/10 mt-4 flex-shrink-0">
                  <CardContent className="p-4">
                    <h3 className="text-sm text-white/70 mb-2">Następne ćwiczenie</h3>
                    <div className="flex items-center gap-3">
                      {nextExercise.exerciseImage ? (
                        <img
                          src={nextExercise.exerciseImage}
                          alt={nextExercise.exerciseName}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                          <Target className="w-6 h-6 text-white/50" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-white">{nextExercise.exerciseName}</p>
                        <p className="text-sm text-white/60">{formatTimeNatural(nextExercise.duration)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </div>
      </div>
    );
  }

  // Manual Mode UI (existing implementation)
  const currentExercises = getSectionExercises();
  const currentExercise = currentExercises[currentExerciseIndex];
  const isLastSection = currentSection === 'stretching';
  const isLastExercise = currentExerciseIndex === currentExercises.length - 1;
  const canMoveNext = currentExerciseIndex < currentExercises.length - 1;
  const canMovePrevious = currentExerciseIndex > 0 || currentSection !== 'warmup';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-8">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(`/training/${sessionId}`)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center space-x-2 sm:space-x-3 mb-1 sm:mb-2">
                <h1 className="text-lg sm:text-2xl font-bold text-white">{session.title}</h1>
                <Badge className={`${getDifficultyColor(session.difficulty_level)} text-white text-xs sm:text-sm`}>
                  {session.difficulty_level}
                </Badge>
                <Badge variant="outline" className="border-white/20 text-white/70 text-xs sm:text-sm">
                  <Hand className="w-3 h-3 mr-1" />
                  Tryb manualny
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Section Progress */}
        <div className="mb-4 sm:mb-8">
          <div className="flex items-center justify-center space-x-4 sm:space-x-8">
            {(['warmup', 'figures', 'stretching'] as const).map((section) => (
              <div key={section} className="flex items-center space-x-1 sm:space-x-2">
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                  currentSection === section 
                    ? getSectionColor() 
                    : completedExercises.size > 0 && section === 'warmup' 
                      ? 'bg-green-500' 
                      : 'bg-white/10'
                }`}>
                  {section === 'warmup' && <Zap className="w-3 h-3 sm:w-4 sm:h-4" />}
                  {section === 'figures' && <Target className="w-3 h-3 sm:w-4 sm:h-4" />}
                  {section === 'stretching' && <Heart className="w-3 h-3 sm:w-4 sm:h-4" />}
                </div>
                <span className={`font-medium capitalize text-sm sm:text-base ${
                  currentSection === section ? 'text-white' : 'text-white/60'
                }`}>
                  {section === 'warmup' ? 'Rozgrzewka' : section === 'figures' ? 'Trening' : 'Rozciąganie'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Current Exercise */}
        {currentExercise && (
          <Card className="glass-effect border-white/10 mb-4 sm:mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full ${getSectionColor()} flex items-center justify-center mr-3`}>
                    {getSectionIcon()}
                  </div>
                  {getSectionTitle()}
                </div>
                <Badge variant="outline" className="border-white/20 text-white/70">
                  {currentExerciseIndex + 1} z {currentExercises.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-6">
                <h2 className="text-3xl font-bold text-white">
                  {typeof currentExercise === 'string' ? currentExercise : currentExercise.name}
                </h2>
                
                {typeof currentExercise === 'object' && (
                  <div className="flex justify-center space-x-8 text-white/80">
                    {currentExercise.sets && (
                      <div className="text-center">
                        <div className="text-lg sm:text-2xl font-bold">{currentExercise.sets}</div>
                        <div className="text-xs sm:text-sm">Serie</div>
                      </div>
                    )}
                    {currentExercise.reps && (
                      <div className="text-center">
                        <div className="text-lg sm:text-2xl font-bold">{currentExercise.reps}</div>
                        <div className="text-xs sm:text-sm">Powtórzenia</div>
                      </div>
                    )}
                    {currentExercise.completion_mode === 'completion' || currentExercise.hold_time_seconds === 0 ? (
                      <div className="text-center">
                        <div className="text-base sm:text-lg font-bold text-green-400 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 mr-1" />
                          Ukończenie
                        </div>
                        <div className="text-xs sm:text-sm">Tryb</div>
                      </div>
                    ) : currentExercise.hold_time_seconds && (
                      <div className="text-center">
                        <div className="text-lg sm:text-2xl font-bold">{currentExercise.hold_time_seconds}s</div>
                        <div className="text-xs sm:text-sm">Utrzymaj</div>
                      </div>
                    )}
                  </div>
                )}
                
                {typeof currentExercise === 'object' && currentExercise.notes && (
                  <p className="text-white/70 italic">{currentExercise.notes}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Exercise List */}
        <Card className="glass-effect border-white/10 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Postęp ćwiczeń</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {currentExercises.map((exercise, index) => {
                const exerciseKey = `${currentSection}-${index}`;
                const isExerciseCompleted = completedExercises.has(exerciseKey);
                const isCurrent = index === currentExerciseIndex;
                
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      isCurrent 
                        ? 'bg-white/20 border-l-4 border-primary' 
                        : isExerciseCompleted 
                          ? 'bg-green-500/20' 
                          : 'bg-white/5 hover:bg-white/10'
                    }`}
                    onClick={() => setCurrentExerciseIndex(index)}
                  >
                    <div className="flex items-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExerciseComplete(exerciseKey);
                        }}
                        className="mr-3"
                      >
                        {isExerciseCompleted ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-white/40" />
                        )}
                      </button>
                      <span className={`font-medium ${
                        isCurrent ? 'text-white' : isExerciseCompleted ? 'text-green-400' : 'text-white/70'
                      }`}>
                        {typeof exercise === 'string' ? exercise : exercise.name}
                      </span>
                    </div>
                    {typeof exercise === 'object' && (
                      <div className="flex items-center space-x-4 text-xs text-white/60">
                        {exercise.sets && <span>{exercise.sets} serie</span>}
                        {exercise.reps && <span>{exercise.reps} powt.</span>}
                        {exercise.completion_mode === 'completion' || exercise.hold_time_seconds === 0 ? (
                          <span className="text-green-400 flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Ukończenie
                          </span>
                        ) : exercise.hold_time_seconds && (
                          <span>{exercise.hold_time_seconds}s</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => {
              if (canMovePrevious) {
                if (currentExerciseIndex > 0) {
                  setCurrentExerciseIndex(currentExerciseIndex - 1);
                } else {
                  moveToPreviousSection();
                }
              }
            }}
            disabled={!canMovePrevious}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Poprzednie
          </Button>

          <div className="flex items-center space-x-2 sm:space-x-4 order-2">
            {currentExercises.length > 0 && (
              <span className="text-white/60 text-xs sm:text-sm">
                Ćwiczenie {currentExerciseIndex + 1} z {currentExercises.length}
              </span>
            )}
          </div>

          {isLastSection && isLastExercise ? (
            <Button
              onClick={handleFinishSession}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 w-full sm:w-auto order-3"
              size="lg"
            >
              Zakończ sesję
              <CheckCircle className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={() => {
                if (canMoveNext) {
                  setCurrentExerciseIndex(currentExerciseIndex + 1);
                } else {
                  moveToNextSection();
                }
              }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 w-full sm:w-auto order-3"
              size="lg"
            >
              Następne
              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainingExerciseSession;
