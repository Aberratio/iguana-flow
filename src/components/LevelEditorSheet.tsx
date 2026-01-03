import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ChevronDown, Crown, Plus, X, GripVertical, RotateCcw, Trophy, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDifficultyColorClass } from "@/lib/figureUtils";
import { useDictionary } from "@/contexts/DictionaryContext";

interface SportLevel {
  id: string;
  level_number: number;
  level_name: string;
  point_limit: number;
  sport_category: string;
  challenge_id?: string;
  status: string;
}

interface Figure {
  id: string;
  name: string;
  difficulty_level?: string;
  category?: string;
  type?: string;
  image_url?: string;
  sport_category_id?: string;
  premium?: boolean;
  created_at?: string;
}

interface FigureType {
  key: string;
  name_pl: string;
}

interface Challenge {
  id: string;
  title: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  rule_type: string;
}

interface LevelFigureParams {
  figure_id: string;
  order_index: number;
  is_boss: boolean;
  boss_description?: string;
  hold_time_seconds?: number;
  reps?: number;
  notes?: string;
  sublevel?: number;
  sublevel_description?: string;
}

interface LevelTrainingParams {
  training_id: string;
  order_index: number;
  is_required: boolean;
  notes?: string;
}

interface Training {
  id: string;
  title: string;
  type: string;
  difficulty_level?: string;
  duration_minutes?: number;
  thumbnail_url?: string;
  premium?: boolean;
}

interface LevelEditorSheetProps {
  level: SportLevel | null;
  isOpen: boolean;
  onClose: () => void;
  sportKey: string;
  onSave: () => void;
}

export const LevelEditorSheet = ({ level, isOpen, onClose, sportKey, onSave }: LevelEditorSheetProps) => {
  const { user } = useAuth();
  const { getDifficultyLabel } = useDictionary();
  const FILTERS_STORAGE_KEY = `level-editor-filters-${sportKey}`;
  
  const [activeTab, setActiveTab] = useState("info");
  
  // Level info state
  const [levelNumber, setLevelNumber] = useState(1);
  const [levelName, setLevelName] = useState("");
  const [pointLimit, setPointLimit] = useState(0);
  const [challengeId, setChallengeId] = useState<string>("");
  const [status, setStatus] = useState("draft");
  
  // Figures state
  const [allFigures, setAllFigures] = useState<Figure[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedFigures, setSelectedFigures] = useState<LevelFigureParams[]>([]);
  const [availableCategories, setAvailableCategories] = useState<FigureType[]>([]);
  const [availableTypes, setAvailableTypes] = useState<FigureType[]>([]);
  const [currentSportCategoryId, setCurrentSportCategoryId] = useState<string | null>(null);
  
  // Trainings state
  const [allTrainings, setAllTrainings] = useState<Training[]>([]);
  const [selectedTrainings, setSelectedTrainings] = useState<LevelTrainingParams[]>([]);
  const [trainingSearchQuery, setTrainingSearchQuery] = useState("");
  const [trainingCategoryFilter, setTrainingCategoryFilter] = useState<string>("all");
  const [trainingDifficultyFilter, setTrainingDifficultyFilter] = useState<string>("all");
  const [trainingPremiumFilter, setTrainingPremiumFilter] = useState<string>("all");
  
  // Achievements state
  const [selectedAchievements, setSelectedAchievements] = useState<string[]>([]);
  const [availableAchievements, setAvailableAchievements] = useState<Achievement[]>([]);
  
  // Filters - load from localStorage
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [sportFilter, setSportFilter] = useState<string>("current");
  const [premiumFilter, setPremiumFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);

  // Load filters from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (saved) {
      try {
        const filters = JSON.parse(saved);
        setSearchQuery(filters.searchQuery || "");
        setCategoryFilter(filters.categoryFilter || "all");
        setDifficultyFilter(filters.difficultyFilter || "all");
        setSportFilter(filters.sportFilter || "current");
        setPremiumFilter(filters.premiumFilter || "all");
        setTypeFilter(filters.typeFilter || "all");
        setSortBy(filters.sortBy || "name");
      } catch (e) {
        console.error("Error loading filters:", e);
      }
    }
  }, [sportKey]);

  // Save filters to localStorage on change
  useEffect(() => {
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify({
      searchQuery,
      categoryFilter,
      difficultyFilter,
      sportFilter,
      premiumFilter,
      typeFilter,
      sortBy,
    }));
  }, [searchQuery, categoryFilter, difficultyFilter, sportFilter, premiumFilter, typeFilter, sortBy, FILTERS_STORAGE_KEY]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
      if (level) {
        loadLevelData();
      } else {
        resetForm();
      }
    }
  }, [isOpen, level]);

  const fetchData = async () => {
    try {
      const [figuresRes, challengesRes, sportCategoryRes, sportCategoriesRes, typesRes, achievementsRes, trainingsRes] = await Promise.all([
        supabase.from("figures").select("*").order("name"),
        supabase.from("challenges").select("id, title").eq("status", "published").order("title"),
        supabase.from("sport_categories").select("id, key_name").eq("key_name", sportKey).single(),
        supabase.from("sport_categories").select("key_name, name").order("name"),
        supabase.from("figure_types").select("key, name_pl").order("order_index"),
        supabase.from("achievements").select("id, name, description, icon, points, rule_type").eq("rule_type", "sport_level_completion").order("name"),
        supabase.from("training_sessions").select("id, title, type, difficulty_level, duration_minutes, thumbnail_url, premium").eq("published", true).order("title")
      ]);

      if (figuresRes.error) throw figuresRes.error;
      if (challengesRes.error) throw challengesRes.error;

      setAllFigures(figuresRes.data || []);
      setChallenges(challengesRes.data || []);
      setCurrentSportCategoryId(sportCategoryRes.data?.id || null);
      setAvailableAchievements(achievementsRes.data || []);
      setAllTrainings(trainingsRes.data || []);
      
      // Map sport categories to FigureType format
      const sportCats: FigureType[] = (sportCategoriesRes.data || []).map(sc => ({
        key: sc.key_name,
        name_pl: sc.name
      }));
      setAvailableCategories(sportCats);
      setAvailableTypes(typesRes.data || []);
    } catch (error) {
      console.error("Błąd pobierania danych:", error);
      toast.error("Nie udało się pobrać danych");
    }
  };

  const loadLevelData = async () => {
    if (!level) return;

    setLevelNumber(level.level_number);
    setLevelName(level.level_name);
    setPointLimit(level.point_limit);
    setChallengeId(level.challenge_id || "");
    setStatus(level.status);

    try {
      const { data, error } = await supabase
        .from("level_figures")
        .select("*")
        .eq("level_id", level.id)
        .order("order_index");

      if (error) throw error;

      const figureParams: LevelFigureParams[] = (data || []).map((lf) => ({
        figure_id: lf.figure_id,
        order_index: lf.order_index,
        is_boss: lf.is_boss || false,
        boss_description: lf.boss_description || undefined,
        hold_time_seconds: lf.hold_time_seconds || undefined,
        reps: lf.reps || undefined,
        notes: lf.notes || undefined,
        sublevel: lf.sublevel || 1,
        sublevel_description: lf.sublevel_description || undefined,
      }));

      setSelectedFigures(figureParams);
      
      // Fetch achievements for this level
      const { data: achievementData } = await supabase
        .from("sport_level_achievements")
        .select("achievement_id")
        .eq("sport_level_id", level.id);

      setSelectedAchievements(achievementData?.map(a => a.achievement_id) || []);
      
      // Fetch trainings for this level
      const { data: trainingData } = await supabase
        .from("level_trainings")
        .select("training_id, order_index, is_required, notes")
        .eq("level_id", level.id)
        .order("order_index");

      const trainingParams: LevelTrainingParams[] = (trainingData || []).map((lt) => ({
        training_id: lt.training_id,
        order_index: lt.order_index,
        is_required: lt.is_required || true,
        notes: lt.notes || undefined,
      }));

      setSelectedTrainings(trainingParams);
    } catch (error) {
      console.error("Błąd ładowania figurek:", error);
      toast.error("Nie udało się załadować figurek");
    }
  };

  const resetForm = () => {
    setLevelNumber(1);
    setLevelName("");
    setPointLimit(0);
    setChallengeId("");
    setStatus("draft");
    setSelectedFigures([]);
    setSelectedTrainings([]);
    setSelectedAchievements([]);
    setActiveTab("info");
  };

  const getFilteredFigures = () => {
    let filtered = allFigures.filter((fig) => {
      // Search
      if (searchQuery && !fig.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Sport filter - show current sport OR universal figures (sport_category_id = null)
      if (sportFilter === "current" && currentSportCategoryId) {
        if (fig.sport_category_id && fig.sport_category_id !== currentSportCategoryId) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter !== "all" && fig.category !== categoryFilter) {
        return false;
      }

      // Difficulty filter (case-insensitive)
      if (difficultyFilter !== "all" && 
          fig.difficulty_level?.toLowerCase() !== difficultyFilter.toLowerCase()) {
        return false;
      }

      // Premium filter
      if (premiumFilter === "premium" && !fig.premium) {
        return false;
      }
      if (premiumFilter === "free" && fig.premium) {
        return false;
      }

      // Type filter
      if (typeFilter !== "all" && fig.type !== typeFilter) {
        return false;
      }

      return true;
    });

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name, 'pl');
      }
      if (sortBy === "difficulty") {
        const order: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3 };
        return (order[a.difficulty_level?.toLowerCase() || ""] || 0) - 
               (order[b.difficulty_level?.toLowerCase() || ""] || 0);
      }
      if (sortBy === "recent") {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
      return 0;
    });

    return sorted;
  };

  const resetFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setDifficultyFilter("all");
    setSportFilter("current");
    setPremiumFilter("all");
    setTypeFilter("all");
    setSortBy("name");
    toast.info("Zresetowano filtry");
  };

  const addFigure = (figureId: string) => {
    if (selectedFigures.some(f => f.figure_id === figureId)) {
      toast.info("Ta figurka jest już dodana do poziomu");
      return;
    }

    const newFigure: LevelFigureParams = {
      figure_id: figureId,
      order_index: selectedFigures.length,
      is_boss: false,
      sublevel: 1, // Default sublevel
    };

    setSelectedFigures([...selectedFigures, newFigure]);
    toast.success("Dodano figurkę");
  };

  const removeFigure = (figureId: string) => {
    setSelectedFigures(selectedFigures.filter(f => f.figure_id !== figureId));
    toast.success("Usunięto figurkę");
  };

  const updateFigureParams = (figureId: string, updates: Partial<LevelFigureParams>) => {
    setSelectedFigures(selectedFigures.map(f => {
      if (f.figure_id === figureId) {
        // If setting is_boss to true, unset all other bosses
        if (updates.is_boss === true) {
          setSelectedFigures(prev => prev.map(pf => 
            pf.figure_id === figureId ? pf : { ...pf, is_boss: false }
          ));
        }
        return { ...f, ...updates };
      }
      return f;
    }));
  };

  const getFigureById = (id: string) => allFigures.find(f => f.id === id);

  const getTrainingById = (id: string) => allTrainings.find(t => t.id === id);

  const addTraining = (trainingId: string) => {
    if (selectedTrainings.some(t => t.training_id === trainingId)) {
      toast.info("Ten trening jest już dodany do poziomu");
      return;
    }

    const newTraining: LevelTrainingParams = {
      training_id: trainingId,
      order_index: selectedTrainings.length,
      is_required: true,
    };

    setSelectedTrainings([...selectedTrainings, newTraining]);
    toast.success("Dodano trening");
  };

  const removeTraining = (trainingId: string) => {
    setSelectedTrainings(selectedTrainings.filter(t => t.training_id !== trainingId));
    toast.success("Usunięto trening");
  };

  const updateTrainingParams = (trainingId: string, updates: Partial<LevelTrainingParams>) => {
    setSelectedTrainings(selectedTrainings.map(t => 
      t.training_id === trainingId ? { ...t, ...updates } : t
    ));
  };

  const getFilteredTrainings = () => {
    let filtered = allTrainings.filter((training) => {
      // Search
      if (trainingSearchQuery && !training.title.toLowerCase().includes(trainingSearchQuery.toLowerCase())) {
        return false;
      }

      // Type filter
      if (trainingCategoryFilter !== "all" && training.type !== trainingCategoryFilter) {
        return false;
      }

      // Difficulty filter
      if (trainingDifficultyFilter !== "all" && 
          training.difficulty_level?.toLowerCase() !== trainingDifficultyFilter.toLowerCase()) {
        return false;
      }

      // Premium filter
      if (trainingPremiumFilter === "premium" && !training.premium) {
        return false;
      }
      if (trainingPremiumFilter === "free" && training.premium) {
        return false;
      }

      return true;
    });

    return filtered.sort((a, b) => a.title.localeCompare(b.title, 'pl'));
  };

  const toggleAchievement = (achievementId: string) => {
    setSelectedAchievements(prev => {
      if (prev.includes(achievementId)) {
        return prev.filter(id => id !== achievementId);
      } else {
        return [...prev, achievementId];
      }
    });
  };

  const saveAllChanges = async () => {
    if (!levelName.trim()) {
      toast.error("Nazwa poziomu jest wymagana");
      return;
    }

    // Check for multiple bosses
    const bossCount = selectedFigures.filter(f => f.is_boss).length;
    if (bossCount > 1) {
      toast.error("Tylko jedna figurka może być bossem poziomu");
      return;
    }

    setIsSaving(true);

    try {
      let levelId = level?.id;

      // Save or update level
      if (level) {
        const { error } = await supabase
          .from("sport_levels")
          .update({
            level_number: levelNumber,
            level_name: levelName,
            point_limit: pointLimit,
            challenge_id: challengeId || null,
            status,
          })
          .eq("id", level.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("sport_levels")
          .insert({
            sport_category: sportKey,
            level_number: levelNumber,
            level_name: levelName,
            point_limit: pointLimit,
            challenge_id: challengeId || null,
            status,
            created_by: user?.id,
          })
          .select()
          .single();

        if (error) throw error;
        levelId = data.id;
      }

      // Delete old level_figures
      if (levelId) {
        const { error: deleteError } = await supabase
          .from("level_figures")
          .delete()
          .eq("level_id", levelId);

        if (deleteError) throw deleteError;

        // Insert new level_figures with parameters
        if (selectedFigures.length > 0) {
          const levelFiguresData = selectedFigures.map((fig) => ({
            level_id: levelId,
            figure_id: fig.figure_id,
            order_index: fig.order_index,
            is_boss: fig.is_boss || false,
            boss_description: fig.boss_description || null,
            hold_time_seconds: fig.hold_time_seconds || null,
            reps: fig.reps || null,
            notes: fig.notes || null,
            sublevel: fig.sublevel || 1,
            sublevel_description: fig.sublevel_description || null,
            created_by: user?.id,
          }));

          const { error: insertError } = await supabase
            .from("level_figures")
            .insert(levelFiguresData);

          if (insertError) throw insertError;
        }
        
        // Save level achievements
        // Delete old achievements
        await supabase
          .from("sport_level_achievements")
          .delete()
          .eq("sport_level_id", levelId);

        // Insert new achievements
        if (selectedAchievements.length > 0) {
          const achievementsData = selectedAchievements.map(achievementId => ({
            sport_level_id: levelId,
            achievement_id: achievementId,
            created_by: user?.id,
          }));

          const { error: achError } = await supabase
            .from("sport_level_achievements")
            .insert(achievementsData);

          if (achError) throw achError;
        }
        
        // Save level trainings
        // Delete old trainings
        await supabase
          .from("level_trainings")
          .delete()
          .eq("level_id", levelId);

        // Insert new trainings
        if (selectedTrainings.length > 0) {
          const trainingsData = selectedTrainings.map(training => ({
            level_id: levelId,
            training_id: training.training_id,
            order_index: training.order_index,
            is_required: training.is_required,
            notes: training.notes || null,
            created_by: user?.id,
          }));

          const { error: trainingError } = await supabase
            .from("level_trainings")
            .insert(trainingsData);

          if (trainingError) throw trainingError;
        }
      }

      toast.success(level ? "Zaktualizowano poziom" : "Utworzono poziom");
      onSave();
      onClose();
    } catch (error) {
      console.error("Błąd zapisu:", error);
      toast.error("Nie udało się zapisać zmian");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedFigureIds = selectedFigures.map(f => f.figure_id);
  const availableFigures = getFilteredFigures().filter(f => !selectedFigureIds.includes(f.id));

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-[95vw] lg:max-w-7xl p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-6 pb-4 border-b">
            <SheetTitle className="text-2xl">
              {level ? "Edytuj Poziom" : "Utwórz Nowy Poziom"}
            </SheetTitle>
            <SheetDescription>
              {level ? "Zaktualizuj informacje o poziomie i przypisane figurki" : "Dodaj nowy poziom umiejętności"}
            </SheetDescription>
          </SheetHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 pt-4">
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="info">Informacje o Poziomie</TabsTrigger>
                <TabsTrigger value="figures">
                  Figurki ({selectedFigures.length})
                </TabsTrigger>
                <TabsTrigger value="trainings">
                  Treningi ({selectedTrainings.length})
                </TabsTrigger>
                <TabsTrigger value="achievements">
                  Odznaki ({selectedAchievements.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="info" className="flex-1 overflow-auto px-6 pb-6 mt-4">
              <div className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="levelNumber">Numer Poziomu</Label>
                    <Input
                      id="levelNumber"
                      type="number"
                      min="1"
                      value={levelNumber}
                      onChange={(e) => setLevelNumber(parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pointLimit">Limit Punktów</Label>
                    <Input
                      id="pointLimit"
                      type="number"
                      min="0"
                      value={pointLimit}
                      onChange={(e) => setPointLimit(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="levelName">Nazwa Poziomu</Label>
                  <Input
                    id="levelName"
                    value={levelName}
                    onChange={(e) => setLevelName(e.target.value)}
                    placeholder="np. Poziom Początkujący"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="challenge">Powiązane Wyzwanie</Label>
                  <Select value={challengeId || "none"} onValueChange={(val) => setChallengeId(val === "none" ? "" : val)}>
                    <SelectTrigger id="challenge">
                      <SelectValue placeholder="Brak Wyzwania" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Brak Wyzwania</SelectItem>
                      {challenges.map((ch) => (
                        <SelectItem key={ch.id} value={ch.id}>
                          {ch.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Wersja Robocza</SelectItem>
                      <SelectItem value="published">Opublikowane</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="figures" className="flex-1 overflow-hidden mt-4">
              <div className="grid lg:grid-cols-2 gap-6 h-full px-6 pb-6">
                {/* Left: Available figures */}
                <div className="space-y-4 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Dostępne Figurki</h3>
                    <p className="text-sm text-muted-foreground">
                      Znaleziono: {availableFigures.length}
                    </p>
                  </div>
                    
                  <div className="space-y-3">
                    <Input
                      placeholder="Szukaj figurek..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />

                    <Collapsible open={!filtersCollapsed} onOpenChange={(open) => setFiltersCollapsed(!open)}>
                      <CollapsibleTrigger asChild>
                        <Button variant="outline" className="w-full justify-between" size="sm">
                          Filtry i Sortowanie
                          <ChevronDown className={`h-4 w-4 transition-transform ${filtersCollapsed ? "" : "rotate-180"}`} />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-3 pt-3">
                        <div className="grid grid-cols-2 gap-2">
                          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger>
                              <SelectValue placeholder="Kategoria" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Wszystkie Kategorie</SelectItem>
                              {availableCategories.map((cat) => (
                                <SelectItem key={cat.key} value={cat.key}>
                                  {cat.name_pl}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                            <SelectTrigger>
                              <SelectValue placeholder="Trudność" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Wszystkie Poziomy</SelectItem>
                              <SelectItem value="beginner">Początkujący</SelectItem>
                              <SelectItem value="intermediate">Średniozaawansowany</SelectItem>
                              <SelectItem value="advanced">Zaawansowany</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Select value={premiumFilter} onValueChange={setPremiumFilter}>
                            <SelectTrigger>
                              <SelectValue placeholder="Dostęp" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Wszystkie</SelectItem>
                              <SelectItem value="premium">Premium</SelectItem>
                              <SelectItem value="free">Darmowe</SelectItem>
                            </SelectContent>
                          </Select>

                          <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger>
                              <SelectValue placeholder="Typ" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Wszystkie Typy</SelectItem>
                              {availableTypes.map((type) => (
                                <SelectItem key={type.key} value={type.key}>
                                  {type.name_pl}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Select value={sportFilter} onValueChange={setSportFilter}>
                            <SelectTrigger>
                              <SelectValue placeholder="Sport" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="current">Tylko ten sport</SelectItem>
                              <SelectItem value="all">Wszystkie sporty</SelectItem>
                            </SelectContent>
                          </Select>

                          <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger>
                              <SelectValue placeholder="Sortuj" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="name">Alfabetycznie</SelectItem>
                              <SelectItem value="difficulty">Według trudności</SelectItem>
                              <SelectItem value="recent">Ostatnio dodane</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={resetFilters}
                          className="w-full"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Resetuj filtry
                        </Button>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>

                  <ScrollArea className="flex-1">
                    <div className="space-y-2 pr-4">
                      {availableFigures.map((fig) => (
                        <Card key={fig.id} className="overflow-hidden hover:border-primary/50 transition-colors">
                          <CardContent className="p-3 flex items-center gap-3">
                            {fig.image_url && (
                              <img
                                src={fig.image_url}
                                alt={fig.name}
                                className="w-12 h-12 rounded object-cover"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{fig.name}</p>
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {fig.difficulty_level && (
                                  <Badge variant="outline" className={`text-xs ${getDifficultyColorClass(fig.difficulty_level)}`}>
                                    {getDifficultyLabel(fig.difficulty_level)}
                                  </Badge>
                                )}
                                {fig.premium && (
                                  <Badge variant="outline" className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-400/30">
                                    Premium
                                  </Badge>
                                )}
                                {!fig.sport_category_id && (
                                  <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-400 border-blue-400/30">
                                    Uniwersalna
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addFigure(fig.id)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </CardContent>
                        </Card>
                      ))}

                      {availableFigures.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">
                          Brak dostępnych figurek
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Right: Selected figures with parameters */}
                <div className="space-y-4 flex flex-col overflow-hidden">
                  <h3 className="text-lg font-semibold">Wybrane Figurki</h3>

                  <ScrollArea className="flex-1">
                    <div className="space-y-3 pr-4">
                      {selectedFigures.map((figParam) => {
                        const fig = getFigureById(figParam.figure_id);
                        if (!fig) return null;

                        return (
                          <Card key={figParam.figure_id} className={figParam.is_boss ? "border-yellow-500 border-2" : ""}>
                            <CardHeader className="pb-3">
                              <div className="flex items-start gap-3">
                                <GripVertical className="h-5 w-5 text-muted-foreground mt-1 cursor-move" />
                                {fig.image_url && (
                                  <img
                                    src={fig.image_url}
                                    alt={fig.name}
                                    className="w-12 h-12 rounded object-cover"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-base flex items-center gap-2">
                                    {fig.name}
                                    {figParam.is_boss && <Crown className="h-4 w-4 text-yellow-500" />}
                                  </CardTitle>
                                  {fig.difficulty_level && (
                                    <Badge variant="outline" className="text-xs mt-1">
                                      {getDifficultyLabel(fig.difficulty_level)}
                                    </Badge>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeFigure(figParam.figure_id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardHeader>

                            <CardContent className="pt-0">
                              <Collapsible>
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost" size="sm" className="w-full justify-between">
                                    Parametry Poziomu
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="space-y-4 pt-4">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`boss-${figParam.figure_id}`}
                                      checked={figParam.is_boss}
                                      onCheckedChange={(checked) =>
                                        updateFigureParams(figParam.figure_id, { is_boss: checked as boolean })
                                      }
                                    />
                                    <Label htmlFor={`boss-${figParam.figure_id}`} className="flex items-center gap-2">
                                      <Crown className="h-4 w-4 text-yellow-500" />
                                      Oznacz jako Boss
                                    </Label>
                                  </div>

                                  {figParam.is_boss && (
                                    <div className="space-y-2">
                                      <Label>Opis Wymagań Bossa</Label>
                                      <Textarea
                                        placeholder="np. Utrzymaj 30s bez drżenia"
                                        value={figParam.boss_description || ""}
                                        onChange={(e) =>
                                          updateFigureParams(figParam.figure_id, { boss_description: e.target.value })
                                        }
                                        rows={2}
                                      />
                                    </div>
                                  )}

                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                      <Label>Czas Trzymania (s)</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        placeholder="Auto"
                                        value={figParam.hold_time_seconds || ""}
                                        onChange={(e) =>
                                          updateFigureParams(figParam.figure_id, {
                                            hold_time_seconds: e.target.value ? parseInt(e.target.value) : undefined,
                                          })
                                        }
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label>Liczba Powtórzeń</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        placeholder="Auto"
                                        value={figParam.reps || ""}
                                        onChange={(e) =>
                                          updateFigureParams(figParam.figure_id, {
                                            reps: e.target.value ? parseInt(e.target.value) : undefined,
                                          })
                                        }
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Notatki dla Użytkownika</Label>
                                    <Textarea
                                      placeholder="Dodatkowe wskazówki..."
                                      value={figParam.notes || ""}
                                      onChange={(e) =>
                                        updateFigureParams(figParam.figure_id, { notes: e.target.value })
                                      }
                                      rows={2}
                                    />
                                  </div>

                                  <div className="pt-4 border-t space-y-4">
                                    <h4 className="text-sm font-semibold">Subpoziom</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="space-y-2">
                                        <Label>Numer Subpoziomu</Label>
                                        <Input
                                          type="number"
                                          min="1"
                                          placeholder="1"
                                          value={figParam.sublevel || 1}
                                          onChange={(e) =>
                                            updateFigureParams(figParam.figure_id, {
                                              sublevel: e.target.value ? parseInt(e.target.value) : 1,
                                            })
                                          }
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Grupuj figurki</Label>
                                        <p className="text-xs text-muted-foreground">
                                          Figurki z tym samym numerem będą zgrupowane
                                        </p>
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <Label>Opis Subpoziomu (opcjonalnie)</Label>
                                      <Textarea
                                        placeholder="np. Rozgrzewka - podstawy"
                                        value={figParam.sublevel_description || ""}
                                        onChange={(e) =>
                                          updateFigureParams(figParam.figure_id, { sublevel_description: e.target.value })
                                        }
                                        rows={2}
                                      />
                                      <p className="text-xs text-muted-foreground">
                                        Opis będzie wyświetlony raz na początku subpoziomu
                                      </p>
                                    </div>
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            </CardContent>
                          </Card>
                        );
                      })}

                      {selectedFigures.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">
                          Nie wybrano jeszcze żadnych figurek
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="trainings" className="flex-1 overflow-hidden mt-4">
              <div className="grid lg:grid-cols-2 gap-6 h-full px-6 pb-6">
                {/* Left: Available trainings */}
                <div className="space-y-4 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Dostępne Treningi</h3>
                    <p className="text-sm text-muted-foreground">
                      Znaleziono: {getFilteredTrainings().filter(t => !selectedTrainings.some(st => st.training_id === t.id)).length}
                    </p>
                  </div>
                    
                  <div className="space-y-3">
                    <Input
                      placeholder="Szukaj treningów..."
                      value={trainingSearchQuery}
                      onChange={(e) => setTrainingSearchQuery(e.target.value)}
                    />

                    <div className="grid grid-cols-3 gap-2">
                      <Select value={trainingCategoryFilter} onValueChange={setTrainingCategoryFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Kategoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Wszystkie</SelectItem>
                          <SelectItem value="warmup">Rozgrzewka</SelectItem>
                          <SelectItem value="strength">Siła</SelectItem>
                          <SelectItem value="flexibility">Stretching</SelectItem>
                          <SelectItem value="technique">Technika</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={trainingDifficultyFilter} onValueChange={setTrainingDifficultyFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Trudność" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Wszystkie</SelectItem>
                          <SelectItem value="beginner">Początkujący</SelectItem>
                          <SelectItem value="intermediate">Średniozaawansowany</SelectItem>
                          <SelectItem value="advanced">Zaawansowany</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={trainingPremiumFilter} onValueChange={setTrainingPremiumFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Dostęp" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Wszystkie</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="free">Darmowe</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <ScrollArea className="flex-1">
                    <div className="space-y-2 pr-4">
                      {getFilteredTrainings()
                        .filter(t => !selectedTrainings.some(st => st.training_id === t.id))
                        .map((training) => (
                        <Card key={training.id} className="overflow-hidden hover:border-primary/50 transition-colors">
                          <CardContent className="p-3 flex items-center gap-3">
                            {training.thumbnail_url && (
                              <img
                                src={training.thumbnail_url}
                                alt={training.title}
                                className="w-16 h-12 rounded object-cover"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{training.title}</p>
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {training.difficulty_level && (
                                  <Badge variant="outline" className={`text-xs ${getDifficultyColorClass(training.difficulty_level)}`}>
                                    {getDifficultyLabel(training.difficulty_level)}
                                  </Badge>
                                )}
                                {training.duration_minutes && (
                                  <Badge variant="outline" className="text-xs">
                                    {training.duration_minutes} min
                                  </Badge>
                                )}
                                {training.premium && (
                                  <Badge variant="outline" className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-400/30">
                                    Premium
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addTraining(training.id)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </CardContent>
                        </Card>
                      ))}

                      {getFilteredTrainings().filter(t => !selectedTrainings.some(st => st.training_id === t.id)).length === 0 && (
                        <p className="text-center text-muted-foreground py-8">
                          Brak dostępnych treningów
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Right: Selected trainings with parameters */}
                <div className="space-y-4 flex flex-col overflow-hidden">
                  <h3 className="text-lg font-semibold">Wybrane Treningi</h3>

                  <ScrollArea className="flex-1">
                    <div className="space-y-3 pr-4">
                      {selectedTrainings.map((trainingParam) => {
                        const training = getTrainingById(trainingParam.training_id);
                        if (!training) return null;

                        return (
                          <Card key={trainingParam.training_id} className="border-blue-400/30">
                            <CardHeader className="pb-3">
                              <div className="flex items-start gap-3">
                                <Play className="h-5 w-5 text-blue-400 mt-1" />
                                {training.thumbnail_url && (
                                  <img
                                    src={training.thumbnail_url}
                                    alt={training.title}
                                    className="w-16 h-12 rounded object-cover"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-base flex items-center gap-2">
                                    {training.title}
                                  </CardTitle>
                                  {training.difficulty_level && (
                                    <Badge variant="outline" className="text-xs mt-1">
                                      {getDifficultyLabel(training.difficulty_level)}
                                    </Badge>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeTraining(trainingParam.training_id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardHeader>

                            <CardContent className="pt-0 space-y-3">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={trainingParam.is_required}
                                  onCheckedChange={(checked) =>
                                    updateTrainingParams(trainingParam.training_id, { is_required: checked as boolean })
                                  }
                                />
                                <Label className="cursor-pointer">
                                  Wymagany do ukończenia poziomu
                                </Label>
                              </div>

                              <div className="space-y-2">
                                <Label>Notatki (opcjonalnie)</Label>
                                <Textarea
                                  placeholder="np. Obowiązkowa rozgrzewka przed ćwiczeniami"
                                  value={trainingParam.notes || ""}
                                  onChange={(e) =>
                                    updateTrainingParams(trainingParam.training_id, { notes: e.target.value })
                                  }
                                  rows={2}
                                />
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}

                      {selectedTrainings.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">
                          Nie wybrano jeszcze żadnych treningów
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="achievements" className="flex-1 overflow-auto px-6 pb-6 mt-4">
              <div className="space-y-4 max-w-4xl">
                <div className="bg-blue-900/20 border border-blue-400/30 rounded-lg p-4 mb-4">
                  <h4 className="text-blue-400 font-medium mb-2 flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    Odznaki za ukończenie poziomu
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Wybierz odznaki, które użytkownik otrzyma po zaliczeniu wszystkich figur w tym poziomie.
                    Tylko odznaki typu "Sport Level Completion" są dostępne.
                  </p>
                </div>

                {availableAchievements.length === 0 ? (
                  <Card className="bg-white/5 border-white/10 p-8 text-center">
                    <p className="text-muted-foreground">
                      Brak dostępnych odznak typu "Sport Level Completion".
                      <br />
                      Utwórz odznaki w sekcji Achievement Management.
                    </p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableAchievements.map((achievement) => {
                      const isSelected = selectedAchievements.includes(achievement.id);
                      
                      return (
                        <Card
                          key={achievement.id}
                          className={cn(
                            "cursor-pointer transition-all",
                            isSelected
                              ? "bg-purple-500/20 border-purple-400/50"
                              : "bg-white/5 border-white/10 hover:border-white/20"
                          )}
                          onClick={() => toggleAchievement(achievement.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleAchievement(achievement.id)}
                                  className="mt-1"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-2xl">{achievement.icon}</span>
                                  <h4 className="font-medium text-white">{achievement.name}</h4>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {achievement.description}
                                </p>
                                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-400/30">
                                  +{achievement.points} punktów
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="p-6 pt-4 border-t flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Anuluj
            </Button>
            <Button onClick={saveAllChanges} disabled={isSaving}>
              {isSaving ? "Zapisywanie..." : "Zapisz Wszystko"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
