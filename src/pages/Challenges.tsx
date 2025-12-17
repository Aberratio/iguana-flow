import { useState, useEffect, useMemo } from "react";
import {
  Trophy,
  Clock,
  Plus,
  TrendingUp,
  Filter,
  LayoutGrid,
  List,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useToast } from "@/hooks/use-toast";
import ChallengePreviewModal from "@/components/ChallengePreviewModal";
import CreateChallengeModal from "@/components/CreateChallengeModal";
// ChallengePurchaseModal removed - only sport paths are paid
import ChallengeFiltersBar from "@/components/ChallengeFiltersBar";
import ChallengeFiltersSheet from "@/components/ChallengeFiltersSheet";
import ChallengePathCard from "@/components/ChallengePathCard";
import ChallengeGridView from "@/components/Challenge/ChallengeGridView";
import { ChallengeListView } from "@/components/Challenge/ChallengeListView";
import { useUserRole } from "@/hooks/useUserRole";
// useSubscriptionStatus and useChallengeAccess removed - only sport paths are paid
import { useChallengeFilters } from "@/hooks/useChallengeFilters";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useDictionary } from "@/contexts/DictionaryContext";
import SEO from "@/components/SEO";

interface Challenge {
  id: string;
  title: string;
  description: string;
  level?: number;
  status: string;
  dbStatus?: string; // DB status (published/draft)
  created_by: string;
  premium: boolean;
  price_usd: number;
  price_pln: number;
  duration: number;
  participants: number;
  difficulty: string;
  userProgress: number;
  image: string;
  userParticipating: boolean;
  created_at: string;
  updated_at?: string;
  series_name?: string;
  series_order?: number;
  is_new?: boolean;
  completedCycles?: number;
  start_date?: string;
  end_date?: string;
  category?: string;
}

const Challenges = () => {
  const navigate = useNavigate();
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // Purchase modal removed - only sport paths are paid
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const isMobile = useIsMobile();
  const [historyStatePushed, setHistoryStatePushed] = useState(false);

  const {
    canCreateChallenges,
    isAdmin,
    isLoading: roleLoading,
  } = useUserRole();
  // Premium access check removed - only sport paths are paid
  const { user } = useAuth();
  const { toast } = useToast();
  const { getDifficultyLabel, getDifficultyColor: getDifficultyColorFromDict } =
    useDictionary();

  const {
    filters,
    sortBy,
    toggleFilter,
    clearFilters,
    setSortBy,
    activeFilterCount,
    applyFilters,
    applySorting,
  } = useChallengeFilters();

  useEffect(() => {
    if (!roleLoading) {
      fetchChallenges();
    }
  }, [roleLoading, isAdmin, canCreateChallenges, user]);

  // Handle browser back button for modal
  useEffect(() => {
    const handlePopState = () => {
      if (historyStatePushed && isModalOpen) {
        setIsModalOpen(false);
        setSelectedChallenge(null);
        setHistoryStatePushed(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [historyStatePushed, isModalOpen]);

  // Cleanup history state on unmount
  useEffect(() => {
    return () => {
      if (historyStatePushed) {
        setHistoryStatePushed(false);
      }
    };
  }, [historyStatePushed]);

  const fetchChallenges = async () => {
    setIsLoading(true);
    try {
      // Get challenges based on user role
      let challengeQuery = supabase
        .from("challenges")
        .select("*")
        .order("created_at", { ascending: false });

      // If not admin, show published challenges + own drafts for trainers
      if (!isAdmin) {
        if (canCreateChallenges && user) {
          challengeQuery = challengeQuery.or(
            `status.eq.published,and(status.eq.draft,created_by.eq.${user.id})`
          );
        } else {
          challengeQuery = challengeQuery.eq("status", "published");
        }
      }

      const { data: allChallenges, error } = await challengeQuery;
      if (error) throw error;

      // Get user's participation data if logged in
      let userParticipation: Record<string, string> = {};
      const userProgress: Record<string, number> = {};
      let completedCycles: Record<string, number> = {};

      if (user) {
        const { data: participationData } = await supabase
          .from("challenge_participants")
          .select("challenge_id, status, user_started_at")
          .eq("user_id", user.id);

        userParticipation =
          participationData?.reduce((acc, p) => {
            acc[p.challenge_id] = p.status;
            return acc;
          }, {} as Record<string, string>) || {};

        // Get user's progress data for challenges they're participating in
        const participatingChallengeIds =
          participationData?.map((p) => p.challenge_id) || [];

        if (participatingChallengeIds.length > 0) {
          const { data: progressData } = await supabase
            .from("challenge_day_progress")
            .select("challenge_id, status, training_day_id")
            .eq("user_id", user.id)
            .in("challenge_id", participatingChallengeIds);

          // Get total calendar days for each challenge
          const { data: calendarDaysData } = await supabase
            .from("challenge_training_days")
            .select("challenge_id, id")
            .in("challenge_id", participatingChallengeIds);

          // Calculate progress percentage for each challenge
          const challengeTotalDays =
            calendarDaysData?.reduce((acc, day) => {
              acc[day.challenge_id] = (acc[day.challenge_id] || 0) + 1;
              return acc;
            }, {} as Record<string, number>) || {};

          const challengeCompletedDays =
            progressData?.reduce((acc, progress) => {
              if (progress.status === "completed") {
                acc[progress.challenge_id] =
                  (acc[progress.challenge_id] || 0) + 1;
              }
              return acc;
            }, {} as Record<string, number>) || {};

          // Calculate completed cycles based on number of completed days
          // A cycle is considered complete when all days are completed
          completedCycles =
            Object.keys(challengeTotalDays).reduce((acc, challengeId) => {
              const totalDays = challengeTotalDays[challengeId] || 0;
              const completedDays = challengeCompletedDays[challengeId] || 0;
              // If all days are completed, count as 1 cycle
              if (totalDays > 0 && completedDays >= totalDays) {
                acc[challengeId] = 1;
              } else {
                acc[challengeId] = 0;
              }
              return acc;
            }, {} as Record<string, number>);

          participatingChallengeIds.forEach((challengeId) => {
            const completedDays = challengeCompletedDays[challengeId] || 0;
            const totalDays = challengeTotalDays[challengeId] || 1;
            userProgress[challengeId] = Math.min(
              100,
              Math.round((completedDays / totalDays) * 100)
            );
          });
        }
      }

      // Get participant counts for each challenge
      const challengeIds = allChallenges?.map((c) => c.id) || [];
      const { data: participantData } = await supabase
        .from("challenge_participants")
        .select("challenge_id")
        .in("challenge_id", challengeIds);

      const participantCounts =
        participantData?.reduce((acc, p) => {
          acc[p.challenge_id] = (acc[p.challenge_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

      // Transform data
      const transformedData: Challenge[] =
        allChallenges?.map((challenge) => {
          const userParticipating = userParticipation[challenge.id];
          const progress = userProgress[challenge.id] || 0;

          let status;
          if (userParticipating) {
            if (progress === 100) {
              status = "completed";
            } else {
              status = "active";
            }
          } else {
            status = "not-started";
          }

          return {
            id: challenge.id,
            title: challenge.title,
            description: challenge.description,
            level: challenge.level,
            status,
            dbStatus: challenge.status, // Preserve DB status (published/draft)
            created_by: challenge.created_by,
            premium: challenge.premium || false,
            price_usd: challenge.price_usd,
            price_pln: challenge.price_pln,
            duration: 28, // Default 28 days
            participants: participantCounts[challenge.id] || 0,
            difficulty: challenge.difficulty_level || "intermediate",
            userProgress: userProgress[challenge.id] || 0,
            image:
              challenge.image_url ||
              "https://images.unsplash.com/photo-1506629905496-4d3e5b9e7e59?w=400&h=200&fit=crop",
            userParticipating: !!userParticipating,
            created_at: challenge.created_at,
            updated_at: challenge.updated_at,
            series_name: challenge.series_name,
            series_order: challenge.series_order,
            is_new: challenge.is_new,
            completedCycles: completedCycles[challenge.id] || 0,
            start_date: challenge.start_date,
            end_date: challenge.end_date,
            category: "General",
          };
        }) || [];

      // Debug: Check for problematic challenge
      const problematicChallenge = transformedData.find(c => c.id === '26d319e5-49c8-4b30-a7e7-35c59d44b7e5');
      if (problematicChallenge) {
        console.log('[Challenges] Problematic challenge found:', problematicChallenge);
      } else {
        console.log('[Challenges] Problematic challenge NOT in transformedData');
        console.log('[Challenges] All challenges from DB:', allChallenges?.map(c => ({ 
          id: c.id, 
          title: c.title, 
          status: c.status 
        })));
      }

      setChallenges(transformedData);
    } catch (error) {
      console.error("Error fetching challenges:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters and sorting
  const filteredAndSortedChallenges = useMemo(() => {
    // Admins bypass UI filters when activeFilterCount === 0
    if (isAdmin && activeFilterCount === 0) {
      console.log('[Challenges] Admin mode: showing all challenges, bypassing UI filters');
      return applySorting(challenges);
    }
    
    const filtered = applyFilters(challenges);
    return applySorting(filtered);
  }, [challenges, filters, sortBy, isAdmin, activeFilterCount]);

  // Group challenges by series
  const { seriesChallenges, standaloneChallenges } = useMemo(() => {
    const series: Record<string, Challenge[]> = {};
    const standalone: Challenge[] = [];

    filteredAndSortedChallenges.forEach((challenge) => {
      // Group by series or standalone (regardless of status)
      if (challenge.series_name) {
        if (!series[challenge.series_name]) {
          series[challenge.series_name] = [];
        }
        series[challenge.series_name].push(challenge);
      } else {
        standalone.push(challenge);
      }
    });

    // Sort challenges within each series by series_order
    Object.keys(series).forEach((seriesName) => {
      series[seriesName].sort(
        (a, b) => (a.series_order || 0) - (b.series_order || 0)
      );
    });

    return {
      seriesChallenges: series,
      standaloneChallenges: standalone,
    };
  }, [filteredAndSortedChallenges]);

  const openChallengeModal = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setIsModalOpen(true);
    
    // Add history entry for back button handling
    window.history.pushState({ modalOpen: true }, '', window.location.href);
    setHistoryStatePushed(true);
  };

  const handleJoinChallenge = async (challengeId: string) => {
    if (!user) return;

    const challenge = challenges.find((c) => c.id === challengeId);
    if (!challenge) {
      toast({
        title: "Błąd",
        description: "Nie znaleziono wyzwania. Spróbuj ponownie.",
        variant: "destructive",
      });
      return;
    }

    // Premium check removed - challenges are free, only sport paths are paid

    try {
      const { error, data } = await supabase
        .from("challenge_participants")
        .insert({
          challenge_id: challengeId,
          user_id: user.id,
          status: "active",
          user_started_at: new Date().toISOString(),
        })
        .select();

      if (error) throw error;

      // Small delay to ensure data is saved
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (data && data.length > 0) {
        navigate(`/challenges/${data[0].challenge_id}`);
        toast({
          title: "Sukces!",
          description: "Dołączyłeś do wyzwania. Powodzenia!",
        });
      }
    } catch (error) {
      console.error("Error joining challenge:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się dołączyć do wyzwania. Spróbuj ponownie.",
        variant: "destructive",
      });
    }
  };

  const closeChallengeModal = () => {
    if (historyStatePushed) {
      // User closed modal via UI (X button, etc.)
      setHistoryStatePushed(false);
      setIsModalOpen(false);
      setSelectedChallenge(null);
      window.history.back();
    } else {
      // Modal closed via back button (popstate already handled it)
      setIsModalOpen(false);
      setSelectedChallenge(null);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    return getDifficultyColorFromDict(difficulty);
  };

  const getButtonText = (status: string) => {
    switch (status) {
      case "not-started":
        return "Rozpocznij";
      case "active":
        return "Kontynuuj";
      case "completed":
        return "Wyniki";
      default:
        return "Zobacz";
    }
  };

  const renderChallengeCard = (challenge: Challenge) => {
    // Premium lock removed - challenges are free
    const showBadge = challenge.is_new;
    const badgeType = "new";

    return (
      <Card
        key={challenge.id}
        className="overflow-hidden hover:shadow-xl transition-all duration-300 relative group"
      >
        {/* Admin DB Status Badge */}
        {isAdmin && challenge.dbStatus && (
          <div className="absolute top-2 left-2 z-10">
            <Badge
              variant="outline"
              className="bg-black/70 backdrop-blur-sm text-xs"
            >
              DB: {challenge.dbStatus}
            </Badge>
          </div>
        )}
        
        {/* Premium badge removed - challenges are free */}

        <CardContent className="p-0">
          {/* Thumbnail 16:9 */}
          <div className="relative overflow-hidden">
            <AspectRatio ratio={16 / 9}>
              <img
                src={challenge.image}
                alt={challenge.title}
                className="object-cover w-full h-full cursor-pointer"
                onClick={() => openChallengeModal(challenge)}
              />
            </AspectRatio>
            {/* Only show New badge */}
            {showBadge && (
              <Badge
                variant="secondary"
                className="absolute top-2 right-2"
              >
                Nowe
              </Badge>
            )}
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Title & Description */}
            <div>
              <h3 className="text-lg font-semibold mb-1 line-clamp-1">
                {challenge.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {challenge.description}
              </p>
            </div>

            {/* Meta - one line with icons */}
            <div className="flex items-center gap-2 sm:gap-3 text-sm text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{challenge.duration} dni</span>
              </div>
              {challenge.level && (
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="hidden sm:inline">Poziom </span>
                  <span>{challenge.level}</span>
                </div>
              )}
              <Badge
                variant="outline"
                className={`${getDifficultyColor(
                  challenge.difficulty
                )} text-xs sm:text-sm`}
              >
                <span className="sm:hidden">
                  {getDifficultyLabel(challenge.difficulty)}
                </span>
                <span className="hidden sm:inline">
                  {getDifficultyLabel(challenge.difficulty)}
                </span>
              </Badge>
            </div>

            {/* Progress 0-100% */}
            {challenge.userParticipating && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Postęp</span>
                  <span className="font-medium">{challenge.userProgress}%</span>
                </div>
                <Progress value={challenge.userProgress} className="h-2" />
                {challenge.completedCycles && challenge.completedCycles > 1 ? (
                  <p className="text-xs text-muted-foreground">
                    Ukończone cykle: {challenge.completedCycles}
                  </p>
                ) : null}
              </div>
            )}

            {/* CTAs */}
            <div className="flex gap-2 pt-2">
              {!challenge.userParticipating && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    openChallengeModal(challenge);
                  }}
                >
                  Szczegóły
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                className={challenge.userParticipating ? "w-full" : "flex-1"}
                onClick={async (e) => {
                  e.stopPropagation();
                  if (challenge.status === "active") {
                    navigate(`/challenges/${challenge.id}`);
                  } else if (challenge.status === "completed") {
                    openChallengeModal(challenge);
                  } else {
                    handleJoinChallenge(challenge.id);
                  }
                }}
              >
                {getButtonText(challenge.status)}
              </Button>
            </div>

            {/* Secondary link for completed */}
            {challenge.status === "completed" && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => handleJoinChallenge(challenge.id)}
              >
                Rozpocznij ponownie
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <SEO
        title="Wyzwania Treningowe Aerial"
        description="Dołącz do 28-dniowych wyzwań treningowych aerial! Buduj siłę, opanuj nowe figury pole dance i aerial hoop. Śledź postępy i osiągaj cele."
        image="https://iguanaflow.app/og-challenges.jpg"
        url="https://iguanaflow.app/challenges"
      />
      <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Wyzwania</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Przekrocz swoje granice ze strukturalnym treningiem
              </p>
            </div>
            <div className="flex items-center gap-2">
              {canCreateChallenges && (
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  variant="default"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Stwórz wyzwanie
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Filters - Desktop Bar, Mobile Sheet */}
        {!isMobile ? (
          <ChallengeFiltersBar
            filters={filters}
            sortBy={sortBy}
            activeFilterCount={activeFilterCount}
            onToggleFilter={toggleFilter}
            onClearFilters={clearFilters}
            onSortChange={setSortBy}
          />
        ) : (
          <ChallengeFiltersSheet
            filters={filters}
            sortBy={sortBy}
            activeFilterCount={activeFilterCount}
            onToggleFilter={toggleFilter}
            onClearFilters={clearFilters}
            onSortChange={setSortBy}
            isOpen={isFilterOpen}
            onOpenChange={setIsFilterOpen}
          />
        )}

        {/* Results summary and view toggle */}
        {filteredAndSortedChallenges.length > 0 && (
          <div className="mb-4 flex items-center justify-between">
            <div className="text-white/60 text-sm">
              Pokazano {filteredAndSortedChallenges.length} z{" "}
              {challenges.length} wyzwań
              {isAdmin && activeFilterCount === 0 && (
                <span className="ml-2 text-amber-400">(Tryb admina - wszystkie statusy)</span>
              )}
              {activeFilterCount > 0 && (
                <span className="ml-2 text-blue-400">
                  ({activeFilterCount} {activeFilterCount === 1 ? 'filtr' : activeFilterCount < 5 ? 'filtry' : 'filtrów'} {activeFilterCount === 1 ? 'aktywny' : activeFilterCount < 5 ? 'aktywne' : 'aktywnych'})
                </span>
              )}
            </div>
            <div className="flex gap-1 bg-white/5 rounded-lg p-1">
              <Button
                size="sm"
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                className={`h-8 w-8 p-0 ${
                  viewMode === "grid"
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === "list" ? "secondary" : "ghost"}
                className={`h-8 w-8 p-0 ${
                  viewMode === "list"
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}


        {/* Main Challenges Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <div className="aspect-video bg-muted" />
                <CardContent className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                  <div className="h-8 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAndSortedChallenges.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Brak dostępnych wyzwań
            </h3>
            <p className="text-muted-foreground">
              Wróć później po nowe wyzwania!
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Series Paths */}
            {Object.keys(seriesChallenges).length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Ścieżki</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {Object.entries(seriesChallenges).map(
                    ([seriesName, seriesList]) => (
                      <ChallengePathCard
                        key={seriesName}
                        seriesName={seriesName}
                        challenges={seriesList}
                        onChallengeClick={openChallengeModal}
                        onJoinChallenge={handleJoinChallenge}
                        hasAccess={true}
                      />
                    )
                  )}
                </div>
              </div>
            )}

            {/* Standalone Challenges */}
            {standaloneChallenges.length > 0 && (
              <div className="space-y-4">
                {Object.keys(seriesChallenges).length > 0 && (
                  <h2 className="text-xl font-semibold">Pozostałe wyzwania</h2>
                )}
                {viewMode === "grid" ? (
                  <ChallengeGridView>
                    {standaloneChallenges.map((challenge) =>
                      renderChallengeCard(challenge)
                    )}
                  </ChallengeGridView>
                ) : (
                  <ChallengeListView
                    challenges={standaloneChallenges}
                    onChallengeClick={(challenge) =>
                      openChallengeModal(challenge)
                    }
                    onPurchase={() => {}}
                    onJoinChallenge={handleJoinChallenge}
                    getDifficultyColor={getDifficultyColor}
                    getButtonText={getButtonText}
                    userPurchases={{}}
                    hasPremiumAccess={true}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Mobile Filter Button - floating */}
        {isMobile && (
          <Button
            className="fixed bottom-20 right-4 z-50 rounded-full w-14 h-14 shadow-lg"
            size="icon"
            onClick={() => setIsFilterOpen(true)}
          >
            <Filter className="w-6 h-6" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        )}
      </div>

      {/* Modals */}
      <ChallengePreviewModal
        challenge={selectedChallenge}
        isOpen={isModalOpen}
        onClose={closeChallengeModal}
        ctaMessage={getButtonText(selectedChallenge?.status || "")}
      />

      <CreateChallengeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onChallengeCreated={fetchChallenges}
      />

      {/* ChallengePurchaseModal removed - only sport paths are paid */}
    </div>
    </>
  );
};

export default Challenges;
