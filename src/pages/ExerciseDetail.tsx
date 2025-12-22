import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getDifficultyLabel, getDifficultyColorClass } from "@/lib/figureUtils";
import {
  ArrowLeft,
  Play,
  User,
  Target,
  BookOpen,
  Edit,
  Trash2,
  CheckCircle,
  Bookmark,
  AlertCircle,
  Share,
  Users,
  Globe,
  Plus,
  X,
  UserCheck,
  Crown,
  UserPlus,
  LogIn,
  MessageCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useDictionary } from "@/contexts/DictionaryContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useSimilarExercises } from "@/hooks/useSimilarExercises";
import { usePrerequisiteExercises } from "@/hooks/usePrerequisiteExercises";
import { ShareExerciseModal } from "@/components/ShareExerciseModal";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { PricingModal } from "@/components/PricingModal";
import { CreatePostModal } from "@/components/CreatePostModal";
import IguanaLogo from "@/assets/iguana-logo.svg";

// Path labels for breadcrumb
const pathLabels: Record<string, string> = {
  '/challenges': 'Wyzwania',
  '/aerial-journey': 'Podróż',
  '/training': 'Trening',
  '/library': 'Biblioteka',
  '/feed': 'Feed',
  '/profile': 'Profil',
};

const ExerciseDetail = () => {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isPremium, isTrainer, isAdmin, canAccessLibrary } = useUserRole();
  const { getSportCategoryLabel, getFigureTypeLabel } = useDictionary();

  const [exercise, setExercise] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState("my-versions");
  const [myVersions, setMyVersions] = useState<any[]>([]);
  const [friendsVersions, setFriendsVersions] = useState<any[]>([]);
  const [communityVersions, setCommunityVersions] = useState<any[]>([]);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [experts, setExperts] = useState<any[]>([]);
  const [showAddExpert, setShowAddExpert] = useState(false);
  const [searchUser, setSearchUser] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);

  // Get the previous path from location state or determine fallback
  const previousPath = (location.state as { from?: string })?.from;
  const getBackPath = () => {
    if (previousPath) return previousPath;
    // Fallback based on user access
    return canAccessLibrary ? '/library' : '/aerial-journey';
  };
  const getBackLabel = () => {
    if (previousPath && pathLabels[previousPath]) {
      return pathLabels[previousPath];
    }
    return canAccessLibrary ? 'Biblioteka' : 'Podróż';
  };

  // Similar exercises hook
  const { similarExercises, loading: similarLoading } =
    useSimilarExercises(exerciseId);

  // Prerequisite exercises hook
  const { prerequisiteExercises, loading: prerequisiteLoading } =
    usePrerequisiteExercises(exerciseId);

  // Fetch exercise details
  const fetchExerciseDetails = async () => {
    if (!exerciseId) return;

    try {
      setLoading(true);

      // Fetch exercise
      const { data: exerciseData, error: exerciseError } = await supabase
        .from("figures")
        .select(
          `
          *,
          transition_from_figure:transition_from_figure_id(id, name, image_url),
          transition_to_figure:transition_to_figure_id(id, name, image_url)
        `
        )
        .eq("id", exerciseId)
        .single();

      if (exerciseError) throw exerciseError;
      setExercise(exerciseData);

      // Fetch experts for this figure
      if (exerciseData) {
        const { data: expertsData } = await supabase
          .from("figure_experts")
          .select(
            `
            *,
            profiles:expert_user_id (
              id,
              username,
              avatar_url
            )
          `
          )
          .eq("figure_id", exerciseId);

        setExperts(expertsData || []);
      }

      // Fetch user progress if logged in
      if (user && exerciseData) {
        const { data: progressData } = await supabase
          .from("figure_progress")
          .select("*")
          .eq("figure_id", exerciseId)
          .eq("user_id", user.id)
          .maybeSingle();

        setProgress(progressData);
      }

      // Fetch community versions (posts related to this exercise, excluding own and friends)
      if (exerciseData) {
        let communityQuery = supabase
          .from("posts")
          .select(
            `
            *,
            profiles:user_id (
              username,
              avatar_url
            )
          `
          )
          .eq("figure_id", exerciseId)
          .eq("privacy", "public");

        // Exclude current user's posts
        if (user) {
          communityQuery = communityQuery.neq("user_id", user.id);
        }

        const { data: communityData } = await communityQuery
          .order("created_at", { ascending: false })
          .limit(10);

        setCommunityVersions(communityData || []);

        // Fetch friends versions if user is logged in
        if (user) {
          const { data: friendsData } = await supabase
            .from("posts")
            .select(
              `
              *,
              profiles:user_id (
                username,
                avatar_url
              )
            `
            )
            .eq("figure_id", exerciseId)
            .eq("privacy", "public")
            .in("user_id", []) // TODO: Add actual friends list
            .order("created_at", { ascending: false })
            .limit(10);

          setFriendsVersions(friendsData || []);

          // Fetch user's own versions
          const { data: myData } = await supabase
            .from("posts")
            .select(
              `
              *,
              profiles:user_id (
                username,
                avatar_url
              )
            `
            )
            .eq("figure_id", exerciseId)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          setMyVersions(myData || []);
        }
      }
    } catch (error) {
      console.error("Error fetching exercise:", error);

      // Only navigate away if user is logged in, for non-logged-in users show the error state
      if (user) {
        toast({
          title: "Błąd",
          description: "Nie udało się załadować szczegółów ćwiczenia",
          variant: "destructive",
        });
        navigate(getBackPath());
      } else {
        // For non-logged-in users, just set exercise to null so they see the not found state
        setExercise(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExerciseDetails();
  }, [exerciseId, user]);

  const updateProgress = async (status: string) => {
    if (!user || !exercise) return;

    try {
      const { data, error } = await supabase
        .from("figure_progress")
        .upsert(
          {
            user_id: user.id,
            figure_id: exercise.id,
            status: status,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,figure_id",
          }
        )
        .select()
        .single();

      if (error) throw error;

      setProgress(data);

      // Show congratulations animation for completed exercises
      if (status === "completed") {
        setShowCongrats(true);
        setTimeout(() => setShowCongrats(false), 3000);
      } else {
        toast({
          title: "Postęp zaktualizowany",
          description: `Ćwiczenie oznaczone jako ${status.replace("_", " ")}`,
        });
      }
    } catch (error) {
      console.error("Error updating progress:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować postępu",
        variant: "destructive",
      });
    }
  };

  const handlePostCreated = (newPost: any) => {
    // Add the new post to my versions
    setMyVersions((prev) => [newPost, ...prev]);
    // Switch to my-versions tab to show the new post
    setActiveTab("my-versions");
    setShowCreatePost(false);
  };

  const deleteExercise = async () => {
    if (!exercise) return;

    try {
      const { error } = await supabase
        .from("figures")
        .delete()
        .eq("id", exercise.id);

      if (error) throw error;

      toast({
        title: "Ćwiczenie usunięte",
        description: "Ćwiczenie zostało pomyślnie usunięte",
      });
      navigate(getBackPath());
    } catch (error) {
      console.error("Error deleting exercise:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć ćwiczenia",
        variant: "destructive",
      });
    }
  };

  const canModifyExercise = () => {
    if (!user || !exercise) return false;

    // Admins can edit any exercise
    if (user.role === "admin") return true;

    // Trainers can edit exercises they created
    if (user.role === "trainer" && exercise.created_by === user.id) return true;

    // Trainers who are experts on this exercise can edit it
    if (
      user.role === "trainer" &&
      experts?.some((expert) => expert.expert_user_id === user.id)
    )
      return true;

    return false;
  };

  const canDeleteExercise = () => {
    if (!user || !exercise) return false;
    return (
      user.role === "admin" ||
      (user.role === "trainer" && exercise.created_by === user.id)
    );
  };

  const canManageExperts = () => {
    if (!user || !exercise) return false;
    return user.role === "admin" || exercise.created_by === user.id;
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .ilike("username", `%${query}%`)
        .limit(5);

      setSearchResults(data || []);
    } catch (error) {
      console.error("Error searching users:", error);
    }
  };

  const addExpert = async (userId: string) => {
    if (!user || !exercise) return;

    try {
      const { error } = await supabase.from("figure_experts").insert({
        figure_id: exercise.id,
        expert_user_id: userId,
        added_by: user.id,
      });

      if (error) throw error;

      toast({
        title: "Ekspert dodany",
        description: "Ekspert został pomyślnie dodany",
      });

      // Refresh experts list
      fetchExerciseDetails();
      setShowAddExpert(false);
      setSearchUser("");
      setSearchResults([]);
    } catch (error) {
      console.error("Error adding expert:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się dodać eksperta",
        variant: "destructive",
      });
    }
  };

  const removeExpert = async (expertId: string) => {
    try {
      const { error } = await supabase
        .from("figure_experts")
        .delete()
        .eq("id", expertId);

      if (error) throw error;

      toast({
        title: "Ekspert usunięty",
        description: "Ekspert został pomyślnie usunięty",
      });

      // Refresh experts list
      fetchExerciseDetails();
    } catch (error) {
      console.error("Error removing expert:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć eksperta",
        variant: "destructive",
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    return getDifficultyColorClass(difficulty);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "for_later":
        return <Bookmark className="w-5 h-5 text-blue-400" />;
      case "failed":
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          {user ? (
            // Logged-in user - show generic not found
            <>
              <p className="text-white text-lg mb-4">
                Ćwiczenie nie znalezione
              </p>
              <Button onClick={() => navigate(getBackPath())}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Powrót do {getBackLabel()}
              </Button>
            </>
          ) : (
            // Non-logged-in user - show sign up CTA
            <>
              <UserPlus className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">
                Zarejestruj się, aby uzyskać dostęp do ćwiczeń
              </h2>
              <p className="text-muted-foreground mb-6">
                Dołącz do naszej społeczności, aby uzyskać dostęp do tysięcy
                ćwiczeń akrobatycznych, śledzić swoje postępy i łączyć się z
                innymi sportowcami.
              </p>
              <div className="flex flex-col gap-3">
                <Button onClick={() => navigate("/")} variant="primary">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Zarejestruj się teraz
                </Button>
                <Button
                  onClick={() => navigate("/")}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Masz już konto?
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const hasFullAccess = isPremium || isTrainer || isAdmin;
  const isLocked = !hasFullAccess && exercise.premium;

  // Non-logged in user view
  if (!user) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="outline"
              onClick={() => setShowShareModal(true)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Share className="w-4 h-4 mr-2" />
              Udostępnij
            </Button>
          </div>

          {/* Exercise Preview Card */}
          <Card className="glass-effect border-white/10 mb-6">
            <div className="grid lg:grid-cols-2 gap-0">
              {/* Image Section */}
              <div className="relative">
                <img
                  src={
                    exercise.image_url ||
                    "https://images.unsplash.com/photo-1518594023387-5565c8f3d1ce?w=600&h=400&fit=crop"
                  }
                  alt={exercise.name}
                  className="w-full h-64 lg:h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Premium Lock Overlay */}
                {exercise.premium && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="bg-black/80 rounded-full p-4">
                      <Crown className="w-12 h-12 text-yellow-400" />
                    </div>
                  </div>
                )}
              </div>

              {/* Content Section */}
              <CardContent className="p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <h1 className="text-2xl lg:text-3xl font-bold text-white">
                    {exercise.name}
                  </h1>
                  {exercise.difficulty_level && (
                    <Badge
                      className={`text-xs ${getDifficultyColor(
                        exercise.difficulty_level
                      )}`}
                    >
                      {getDifficultyLabel(exercise.difficulty_level)}
                    </Badge>
                  )}
                </div>

                {exercise.description && (
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {exercise.description}
                  </p>
                )}

                {/* Exercise Details */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center text-muted-foreground">
                    <Target className="w-4 h-4 mr-2" />
                    <span className="text-sm">
                      Trudność: {getDifficultyLabel(exercise.difficulty_level)}
                    </span>
                  </div>
                  {exercise.category && (
                    <div className="flex items-center text-muted-foreground">
                      <BookOpen className="w-4 h-4 mr-2" />
                      <span className="text-sm">
                        Kategoria: {getSportCategoryLabel(exercise.category)}
                      </span>
                    </div>
                  )}
                  {exercise.tags && exercise.tags.length > 0 && (
                    <div className="flex items-center text-muted-foreground">
                      <span className="text-sm mr-2">Tagi:</span>
                      <div className="flex flex-wrap gap-1">
                        {exercise.tags
                          .slice(0, 3)
                          .map((tag: string, index: number) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        {exercise.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{exercise.tags.length - 3} więcej
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Premium Info or Sign Up CTA */}
                {exercise.premium ? (
                  <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
                    <div className="flex items-center mb-3">
                      <Crown className="w-5 h-5 text-yellow-400 mr-2" />
                      <h3 className="text-lg font-semibold text-white">
                        Zawartość Premium
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      To ćwiczenie jest dostępne dla subskrybentów Premium,
                      Trenerów i Administratorów.
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                        <span>Pełne instrukcje ćwiczeń</span>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                        <span>Śledzenie postępów</span>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                        <span>Funkcje społeczności</span>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => navigate("/")}
                    variant="primary"
                    className="w-full"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Zarejestruj się, aby uzyskać dostęp
                  </Button>
                  <Button
                    onClick={() => navigate("/")}
                    variant="outline"
                    className="w-full border-white/20 text-white hover:bg-white/10"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Masz już konto?
                  </Button>
                </div>
              </CardContent>
            </div>
          </Card>

          {/* Community Versions Preview */}
          {communityVersions.length > 0 && (
            <Card className="glass-effect border-white/10">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Wersje społeczności
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {communityVersions.slice(0, 6).map((version) => (
                    <div key={version.id} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden">
                        {version.image_url ? (
                          <img
                            src={version.image_url}
                            alt="Community version"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-white/10 flex items-center justify-center">
                            <MessageCircle className="w-8 h-8 text-purple-400" />
                          </div>
                        )}
                      </div>
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="flex items-center text-white text-xs">
                          <Avatar className="w-4 h-4 mr-1">
                            <AvatarImage src={version.profiles?.avatar_url} />
                            <AvatarFallback className="bg-purple-500 text-white text-xs">
                              {version.profiles?.username?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">
                            {version.profiles?.username}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center mt-4">
                  <p className="text-sm text-muted-foreground">
                    Zarejestruj się, aby zobaczyć więcej wersji społeczności i
                    udostępnić swoje!
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Premium lock screen for logged-in users
  if (isLocked) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center">
          <div className="glass-effect p-8 rounded-xl border border-white/10">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Ćwiczenie Premium
              </h1>
              <p className="text-muted-foreground text-lg mb-6">
                To ćwiczenie jest dostępne dla subskrybentów Premium, Trenerów i
                Administratorów.
              </p>
              <div className="space-y-3 text-left">
                <div className="flex items-center text-muted-foreground">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                  <span>Dostęp do wszystkich poziomów trudności</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                  <span>Zaawansowana biblioteka ćwiczeń</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                  <span>Śledzenie postępów i osiągnięcia</span>
                </div>
              </div>
            </div>
            <Button
              onClick={() => setShowPricingModal(true)}
              variant="primary"
              className="mr-4"
            >
              <Crown className="w-4 h-4 mr-2" />
              Przejdź na Premium
            </Button>
            <Button
              onClick={() => navigate(getBackPath())}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Powrót do {getBackLabel()}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 lg:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setShowShareModal(true)}
              className="border-white/20 text-white hover:bg-white/10 text-sm"
              size="sm"
            >
              <Share className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Udostępnij</span>
            </Button>

            {canModifyExercise() && (
              <Button
                variant="outline"
                onClick={() => navigate(`/exercise/${exerciseId}/edit`)}
                className="border-white/20 text-white hover:bg-white/10 text-sm"
                size="sm"
              >
                <Edit className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Edytuj</span>
              </Button>
            )}

            {canDeleteExercise() && (
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(true)}
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                size="sm"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Media Section */}
          <div className="space-y-4">
            <Card className="glass-effect border-white/10 overflow-hidden">
              <div className="relative">
                {!showVideoPlayer ? (
                  <>
                    <img
                      src={
                        exercise.image_url ||
                        "https://images.unsplash.com/photo-1518594023387-5565c8f3d1ce?w=600&h=600&fit=crop"
                      }
                      alt={exercise.name}
                      className="w-full min-h-64 max-h-[600px] object-contain cursor-pointer hover:scale-105 transition-transform duration-300"
                      onClick={() =>
                        exercise.video_url
                          ? setShowVideoPlayer(true)
                          : setShowImagePreview(true)
                      }
                    />
                    {exercise.video_url && (
                      <div
                        className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/20 transition-colors cursor-pointer"
                        onClick={() => setShowVideoPlayer(true)}
                      >
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <Play className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="relative">
                    <video
                      src={exercise.video_url}
                      controls
                      autoPlay
                      className="w-full min-h-64 max-h-[600px] object-contain"
                      onError={() => {
                        toast({
                          title: "Błąd wideo",
                          description:
                            "Nie można załadować wideo. Spróbuj ponownie.",
                          variant: "destructive",
                        });
                        setShowVideoPlayer(false);
                      }}
                    />
                  </div>
                )}

                {/* Progress Status Overlay */}
                {user &&
                  progress?.status &&
                  progress.status !== "not_tried" && (
                    <div className="absolute top-4 left-4">
                      <div className="flex items-center space-x-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-2">
                        {getStatusIcon(progress.status)}
                        <span className="text-white text-sm capitalize">
                          {progress.status === "failed"
                            ? "Nieudane"
                            : progress.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  )}
              </div>
            </Card>

            {/* Exercise Status */}
            {user && (
              <Card className="glass-effect border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold">Twój postęp</h3>
                    {progress?.status && progress.status !== "not_tried" && (
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(progress.status)}
                        <span className="text-sm text-muted-foreground capitalize">
                          {progress.status === "failed"
                            ? "Nieudane"
                            : progress.status.replace("_", " ")}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={
                        progress?.status === "completed" ? "primary" : "outline"
                      }
                      onClick={() => updateProgress("completed")}
                      className="flex-1 min-w-[120px]"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Ukończone
                    </Button>
                    <Button
                      size="sm"
                      variant={
                        progress?.status === "for_later" ? "primary" : "outline"
                      }
                      onClick={() => updateProgress("for_later")}
                      className="flex-1 min-w-[120px]"
                    >
                      <Bookmark className="w-4 h-4 mr-2" />
                      Na później
                    </Button>
                    <Button
                      size="sm"
                      variant={
                        progress?.status === "failed" ? "primary" : "outline"
                      }
                      onClick={() => updateProgress("failed")}
                      className="flex-1 min-w-[120px]"
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Uczę się!
                    </Button>
                    <Button
                      size="sm"
                      variant={
                        progress?.status === "not_tried" ? "primary" : "outline"
                      }
                      onClick={() => updateProgress("not_tried")}
                      className="flex-1 min-w-[120px]"
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Na TO-DO liście
                    </Button>
                  </div>

                  {/* Share Your Version Button */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <Button
                      onClick={() => setShowCreatePost(true)}
                      variant="outline"
                      className="w-full border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/50"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Udostępnij swoją wersję
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-4">
                {exercise.name}
              </h1>

              {/* Metadata */}
              <div className="flex flex-wrap gap-3 mb-4">
                {exercise.difficulty_level && (
                  <Badge
                    className={getDifficultyColor(exercise.difficulty_level)}
                  >
                    {getDifficultyLabel(exercise.difficulty_level)}
                  </Badge>
                )}
                {exercise.category && (
                  <Badge
                    variant="outline"
                    className="border-white/20 text-white"
                  >
                    {getSportCategoryLabel(exercise.category)}
                  </Badge>
                )}
                {exercise.type && (
                  <Badge
                    variant="outline"
                    className="border-white/20 text-white"
                  >
                    {getFigureTypeLabel(exercise.type)}
                  </Badge>
                )}
              </div>

              {/* Experts */}
              <Card className="glass-effect border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <UserCheck className="w-5 h-5 text-purple-400 mr-2" />
                      <h3 className="text-white font-semibold">Eksperci</h3>
                    </div>
                    {canManageExperts() && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddExpert(true)}
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Dodaj eksperta
                      </Button>
                    )}
                  </div>

                  {experts.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      Brak przypisanych ekspertów
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {experts.map((expert) => (
                        <div
                          key={expert.id}
                          className="flex items-center justify-between"
                        >
                          <div
                            className="flex items-center cursor-pointer hover:bg-white/5 rounded-lg p-2 transition-colors"
                            onClick={() => {
                              if (expert.profiles?.id)
                                navigate(`/profile/${expert.profiles.id}`);
                            }}
                          >
                            <Avatar className="w-8 h-8 mr-3">
                              <AvatarImage
                                src={expert.profiles?.avatar_url || undefined}
                              />
                              <AvatarFallback>
                                {expert.profiles?.username?.[0]?.toUpperCase() ||
                                  "U"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-white text-sm">
                              {expert.profiles?.username ||
                                "Nieznany użytkownik"}
                            </span>
                          </div>
                          {canManageExperts() && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeExpert(expert.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Add Expert Modal */}
              {showAddExpert && (
                <Card className="glass-effect border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-semibold">
                        Dodaj eksperta
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowAddExpert(false);
                          setSearchUser("");
                          setSearchResults([]);
                        }}
                        className="text-white hover:bg-white/10"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Wyszukaj użytkownika..."
                        value={searchUser}
                        onChange={(e) => {
                          setSearchUser(e.target.value);
                          searchUsers(e.target.value);
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/60"
                      />

                      {searchResults.length > 0 && (
                        <div className="space-y-1">
                          {searchResults.map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg cursor-pointer"
                              onClick={() => addExpert(user.id)}
                            >
                              <div className="flex items-center">
                                <Avatar className="w-8 h-8 mr-3">
                                  <AvatarImage src={user.avatar_url} />
                                  <AvatarFallback>
                                    {user.username?.[0]?.toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-white text-sm">
                                  {user.username}
                                </span>
                              </div>
                              <Plus className="w-4 h-4 text-purple-400" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Description */}
            {exercise.description && (
              <Card className="glass-effect border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center mb-3">
                    <BookOpen className="w-5 h-5 text-purple-400 mr-2" />
                    <h3 className="text-white font-semibold">Opis</h3>
                  </div>
                  <p className="text-muted-foreground">
                    {exercise.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            {exercise.instructions && (
              <Card className="glass-effect border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center mb-3">
                    <Target className="w-5 h-5 text-green-400 mr-2" />
                    <h3 className="text-white font-semibold">Instrukcje</h3>
                  </div>
                  <div className="text-muted-foreground whitespace-pre-line">
                    {exercise.instructions}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {exercise.tags && exercise.tags.length > 0 && (
              <Card className="glass-effect border-white/10">
                <CardContent className="p-4">
                  <h3 className="text-white font-semibold mb-3">Tagi</h3>
                  <div className="flex flex-wrap gap-2">
                    {exercise.tags.map((tag: string, index: number) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="border-white/20 text-white"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Prerequisite Exercises */}
            {prerequisiteExercises.length > 0 && (
              <Card className="glass-effect border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center mb-3">
                    <BookOpen className="w-5 h-5 text-orange-400 mr-2" />
                    <h3 className="text-white font-semibold">
                      Naucz się tych ćwiczeń
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-sm mb-4">
                    Naucz się tych podstawowych ćwiczeń przed próbą tego
                    ćwiczenia
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {prerequisiteExercises.map((prerequisite) => (
                      <div
                        key={prerequisite.id}
                        className="cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => navigate(`/exercise/${prerequisite.id}`)}
                      >
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted mb-2">
                          {prerequisite.image_url ? (
                            <img
                              src={prerequisite.image_url}
                              alt={prerequisite.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-orange-500/20 to-orange-700/20 flex items-center justify-center">
                              <BookOpen className="w-8 h-8 text-orange-400" />
                            </div>
                          )}
                          {prerequisite.premium && (
                            <div className="absolute top-2 right-2">
                              <Crown className="w-4 h-4 text-yellow-400" />
                            </div>
                          )}
                        </div>
                        <h4 className="text-white text-sm font-medium line-clamp-2 mb-1">
                          {prerequisite.name}
                        </h4>
                        {prerequisite.difficulty_level && (
                          <Badge
                            className={`text-xs ${getDifficultyColor(
                              prerequisite.difficulty_level
                            )}`}
                          >
                            {getDifficultyLabel(prerequisite.difficulty_level)}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Similar Exercises */}
            {similarExercises.length > 0 && (
              <Card className="glass-effect border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center mb-3">
                    <Target className="w-5 h-5 text-blue-400 mr-2" />
                    <h3 className="text-white font-semibold">
                      Podobne ćwiczenia
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {similarExercises.map((similar) => (
                      <div
                        key={similar.id}
                        className="cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => navigate(`/exercise/${similar.id}`)}
                      >
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted mb-2">
                          {similar.image_url ? (
                            <img
                              src={similar.image_url}
                              alt={similar.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-purple-700/20 flex items-center justify-center">
                              <Target className="w-8 h-8 text-purple-400" />
                            </div>
                          )}
                          {similar.premium && (
                            <div className="absolute top-2 right-2">
                              <Crown className="w-4 h-4 text-yellow-400" />
                            </div>
                          )}
                        </div>
                        <h4 className="text-white text-sm font-medium line-clamp-2 mb-1">
                          {similar.name}
                        </h4>
                        {similar.difficulty_level && (
                          <Badge
                            className={`text-xs ${getDifficultyColor(
                              similar.difficulty_level
                            )}`}
                          >
                            {getDifficultyLabel(similar.difficulty_level)}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Versions Section - only show if there are any posts */}
        {(myVersions.length > 0 || friendsVersions.length > 0 || communityVersions.length > 0) && (
          <div className="mt-12">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="w-full mb-6 bg-muted p-1">
                <TabsTrigger
                  value="my-versions"
                  className="flex-1 text-xs sm:text-sm"
                >
                  <User className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Moje wersje</span>
                  <span className="sm:hidden">Moje</span>
                  <span className="ml-1">({myVersions.length})</span>
                </TabsTrigger>
                <TabsTrigger
                  value="friends-versions"
                  className="flex-1 text-xs sm:text-sm"
                >
                  <Users className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Znajomi</span>
                  <span className="sm:hidden">Znajomi</span>
                  <span className="ml-1">({friendsVersions.length})</span>
                </TabsTrigger>
                <TabsTrigger
                  value="community"
                  className="flex-1 text-xs sm:text-sm"
                >
                  <Globe className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Społeczność</span>
                  <span className="sm:hidden">Społeczność</span>
                  <span className="ml-1">({communityVersions.length})</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="my-versions">
                {myVersions.length === 0 ? (
                  <Card className="glass-effect border-white/10">
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">
                        Brak wersji. Udostępnij swoją praktykę!
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myVersions.map((post) => (
                      <Card
                        key={post.id}
                        className="glass-effect border-white/10 cursor-pointer hover:border-purple-500/30 transition-colors"
                        onClick={() => navigate(`/post/${post.id}`)}
                      >
                        <CardContent className="p-4">
                          {post.image_url && (
                            <img
                              src={post.image_url}
                              alt="Version"
                              className="w-full h-32 object-cover rounded mb-3"
                            />
                          )}
                          <p className="text-white text-sm line-clamp-2 mb-2">
                            {post.content}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Avatar className="w-4 h-4">
                                <AvatarImage src={post.profiles?.avatar_url} />
                                <AvatarFallback>
                                  {post.profiles?.username?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span>{post.profiles?.username}</span>
                            </div>
                            <span>
                              {new Date(post.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="friends-versions">
                {friendsVersions.length === 0 ? (
                  <Card className="glass-effect border-white/10">
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">
                        Brak wersji znajomych.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {friendsVersions.map((post) => (
                      <Card
                        key={post.id}
                        className="glass-effect border-white/10 cursor-pointer hover:border-purple-500/30 transition-colors"
                        onClick={() => navigate(`/post/${post.id}`)}
                      >
                        <CardContent className="p-4">
                          {post.image_url && (
                            <img
                              src={post.image_url}
                              alt="Version"
                              className="w-full h-32 object-cover rounded mb-3"
                            />
                          )}
                          <p className="text-white text-sm line-clamp-2 mb-2">
                            {post.content}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Avatar className="w-4 h-4">
                                <AvatarImage src={post.profiles?.avatar_url} />
                                <AvatarFallback>
                                  {post.profiles?.username?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span>{post.profiles?.username}</span>
                            </div>
                            <span>
                              {new Date(post.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="community">
                {communityVersions.length === 0 ? (
                  <Card className="glass-effect border-white/10">
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">
                        Brak wersji społeczności.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {communityVersions.map((post) => (
                      <Card
                        key={post.id}
                        className="glass-effect border-white/10 cursor-pointer hover:border-purple-500/30 transition-colors"
                        onClick={() => navigate(`/post/${post.id}`)}
                      >
                        <CardContent className="p-4">
                          {post.image_url && (
                            <img
                              src={post.image_url}
                              alt="Version"
                              className="w-full h-32 object-cover rounded mb-3"
                            />
                          )}
                          <p className="text-white text-sm line-clamp-2 mb-2">
                            {post.content}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Avatar className="w-4 h-4">
                                <AvatarImage src={post.profiles?.avatar_url} />
                                <AvatarFallback>
                                  {post.profiles?.username?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span>{post.profiles?.username}</span>
                            </div>
                            <span>
                              {new Date(post.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* Modals */}
      <ShareExerciseModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        exerciseId={exercise.id}
        exerciseName={exercise.name}
      />

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={deleteExercise}
        title="Usuń ćwiczenie"
        description={`Czy na pewno chcesz usunąć "${exercise.name}"? Ta akcja nie może zostać cofnięta.`}
      />

      {/* Image Preview Modal */}
      {showImagePreview && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImagePreview(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={
                exercise.image_url ||
                "https://images.unsplash.com/photo-1518594023387-5565c8f3d1ce?w=600&h=600&fit=crop"
              }
              alt={exercise.name}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setShowImagePreview(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Pricing Modal */}
      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        onUpgrade={() => setShowPricingModal(false)}
      />

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onPostCreated={handlePostCreated}
        preselectedFigure={exercise}
      />

      {/* Congratulations Animation */}
      {showCongrats && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="relative">
            {/* Confetti elements */}
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-pulse"
                style={{
                  left: `${Math.random() * 400}px`,
                  top: `${Math.random() * 400}px`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random() * 2}s`,
                }}
              >
                <div
                  className={`w-2 h-2 rounded-full animate-bounce ${
                    [
                      "bg-purple-300",
                      "bg-purple-400",
                      "bg-purple-500",
                      "bg-purple-600",
                      "bg-purple-700",
                    ][i % 5]
                  }`}
                  style={{
                    animationDelay: `${Math.random() * 1}s`,
                    animationDuration: `${0.5 + Math.random() * 1}s`,
                  }}
                />
              </div>
            ))}

            {/* Main congratulations content */}
            <div className="rounded-xl p-8 text-center max-w-md mx-auto animate-scale-in border border-white/30 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-sm">
              {/* Iguana Logo */}
              <div className="w-16 h-16 mx-auto mb-4 animate-bounce">
                <img
                  src={IguanaLogo}
                  alt="IguanaFlow Logo"
                  className="w-full h-full"
                />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">
                Gratulacje!
              </h2>
              <p className="text-white/90 mb-4">Ukończyłeś to ćwiczenie!</p>
              <div className="flex justify-center space-x-2">
                <div className="w-2 h-2 bg-purple-300 rounded-full animate-pulse"></div>
                <div
                  className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseDetail;
