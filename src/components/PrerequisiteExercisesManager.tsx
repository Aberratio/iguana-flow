import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Plus, 
  X, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp,
  Crown,
  BookOpen
} from "lucide-react";
import { usePrerequisiteExercises } from "@/hooks/usePrerequisiteExercises";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDictionary } from "@/contexts/DictionaryContext";

interface PrerequisiteExercisesManagerProps {
  figureId: string;
}

interface SearchFilters {
  category: string;
  difficulty: string;
  type: string;
  premium: string;
}

export const PrerequisiteExercisesManager = ({ figureId }: PrerequisiteExercisesManagerProps) => {
  const { prerequisiteExercises, addPrerequisiteExercise, removePrerequisiteExercise } = usePrerequisiteExercises(figureId);
  const { getDifficultyLabel, getFigureTypeLabel } = useDictionary();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<any>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    category: "all",
    difficulty: "all",
    type: "all",
    premium: "all"
  });
  const { toast } = useToast();

  const categories = useMemo(() => [
    { value: "all", label: "Wszystkie kategorie" },
    { value: "silks", label: "Szarfy" },
    { value: "hoop", label: "Aerial Hoop" },
    { value: "pole", label: "Pole Dance" },
    { value: "hammock", label: "Hamak" },
    { value: "core", label: "Core / Siła" },
    { value: "warm_up", label: "Rozgrzewka" },
    { value: "stretching", label: "Rozciąganie" },
  ], []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'intermediate': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'advanced': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Fetch current exercise details for smart suggestions
  useEffect(() => {
    const fetchCurrentExercise = async () => {
      const { data } = await supabase
        .from('figures')
        .select('*')
        .eq('id', figureId)
        .single();
      setCurrentExercise(data);
    };
    fetchCurrentExercise();
  }, [figureId]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2 || Object.values(filters).some(f => f !== "all")) {
        searchExercises();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, filters, prerequisiteExercises]);

  const searchExercises = async () => {
    setIsSearching(true);
    try {
      let query = supabase
        .from('figures')
        .select(`
          id, 
          name, 
          description,
          difficulty_level, 
          category,
          type,
          image_url, 
          premium, 
          tags,
          synonyms
        `)
        .neq('id', figureId);

      // Text search across multiple fields
      if (searchQuery.length >= 2) {
        query = query.or(`
          name.ilike.%${searchQuery}%,
          description.ilike.%${searchQuery}%,
          instructions.ilike.%${searchQuery}%
        `);
      }

      // Apply filters
      if (filters.category !== "all") {
        query = query.eq('category', filters.category);
      }
      if (filters.difficulty !== "all") {
        query = query.eq('difficulty_level', filters.difficulty);
      }
      if (filters.type !== "all") {
        query = query.eq('type', filters.type);
      }
      if (filters.premium !== "all") {
        query = query.eq('premium', filters.premium === "premium");
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;

      // Filter out exercises that are already prerequisites
      const prerequisiteIds = prerequisiteExercises.map(ex => ex.id);
      const filtered = data?.filter(ex => !prerequisiteIds.includes(ex.id)) || [];
      
      // Sort by relevance (easier difficulty first for prerequisites)
      const difficultyOrder: Record<string, number> = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
      const sorted = filtered.sort((a, b) => {
        const aScore = difficultyOrder[a.difficulty_level?.toLowerCase()] || 5;
        const bScore = difficultyOrder[b.difficulty_level?.toLowerCase()] || 5;
        return aScore - bScore; // Easier exercises first
      });
      
      setSearchResults(sorted);
    } catch (error) {
      console.error('Error searching exercises:', error);
      toast({
        title: "Błąd wyszukiwania",
        description: "Nie udało się wyszukać ćwiczeń. Spróbuj ponownie.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddPrerequisite = async (exerciseId: string) => {
    try {
      await addPrerequisiteExercise(exerciseId);
      toast({
        title: "Dodano",
        description: "Ćwiczenie podstawowe zostało dodane.",
      });
      // Remove from search results
      setSearchResults(prev => prev.filter(ex => ex.id !== exerciseId));
    } catch (error) {
      console.error('Error adding prerequisite exercise:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się dodać ćwiczenia podstawowego.",
        variant: "destructive",
      });
    }
  };

  const handleRemovePrerequisite = async (exerciseId: string) => {
    try {
      await removePrerequisiteExercise(exerciseId);
      toast({
        title: "Usunięto",
        description: "Ćwiczenie podstawowe zostało usunięte.",
      });
    } catch (error) {
      console.error('Error removing prerequisite exercise:', error);
      toast({
        title: "Błąd", 
        description: "Nie udało się usunąć ćwiczenia podstawowego.",
        variant: "destructive",
      });
    }
  };

  const clearAllFilters = () => {
    setFilters({
      category: "all",
      difficulty: "all", 
      type: "all",
      premium: "all"
    });
    setSearchQuery("");
  };

  const activeFiltersCount = Object.values(filters).filter(f => f !== "all").length;

  return (
    <div className="space-y-4">
      {/* Current Prerequisite Exercises */}
      {prerequisiteExercises.length > 0 && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-foreground text-lg font-semibold flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Naucz się najpierw ({prerequisiteExercises.length})
              </Label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {prerequisiteExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="flex items-center justify-between p-3 bg-accent/20 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {exercise.image_url && (
                      <img
                        src={exercise.image_url}
                        alt={exercise.name}
                        className="w-10 h-10 rounded object-cover flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground text-sm font-medium line-clamp-1">
                        {exercise.name}
                      </p>
                      <div className="flex items-center space-x-1 mt-1">
                        {exercise.difficulty_level && (
                          <Badge variant="secondary" className={`text-xs ${getDifficultyColor(exercise.difficulty_level)}`}>
                            {getDifficultyLabel(exercise.difficulty_level)}
                          </Badge>
                        )}
                        {exercise.premium && (
                          <Badge className="text-xs bg-yellow-500/20 text-yellow-600">
                            <Crown className="w-3 h-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePrerequisite(exercise.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 p-1 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Add New Prerequisite Exercises */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-foreground text-lg font-semibold flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Dodaj ćwiczenie podstawowe
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="border-border/50 hover:bg-accent/50"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtry
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
              {showFilters ? (
                <ChevronUp className="w-4 h-4 ml-2" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-2" />
              )}
            </Button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Szukaj ćwiczeń podstawowych..."
              className="bg-background/50 border-border/50 text-foreground pl-10"
            />
            {(searchQuery || activeFiltersCount > 0) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-accent/10 rounded-lg border border-border/30">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Kategoria</Label>
                <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({...prev, category: value}))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Trudność</Label>
                <Select value={filters.difficulty} onValueChange={(value) => setFilters(prev => ({...prev, difficulty: value}))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszystkie poziomy</SelectItem>
                    <SelectItem value="beginner">Początkujący</SelectItem>
                    <SelectItem value="intermediate">Średniozaawansowany</SelectItem>
                    <SelectItem value="advanced">Zaawansowany</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Typ</Label>
                <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({...prev, type: value}))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszystkie typy</SelectItem>
                    <SelectItem value="single_figure">{getFigureTypeLabel("single_figure")}</SelectItem>
                    <SelectItem value="combo">{getFigureTypeLabel("combo")}</SelectItem>
                    <SelectItem value="warm_up">{getFigureTypeLabel("warm_up")}</SelectItem>
                    <SelectItem value="stretching">{getFigureTypeLabel("stretching")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Dostęp</Label>
                <Select value={filters.premium} onValueChange={(value) => setFilters(prev => ({...prev, premium: value}))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszystkie</SelectItem>
                    <SelectItem value="free">Darmowe</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">
                  Znaleziono {searchResults.length} ćwiczeń (łatwiejsze najpierw)
                </Label>
                {isSearching && (
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <div className="animate-spin w-3 h-3 border border-primary border-t-transparent rounded-full"></div>
                    <span>Szukam...</span>
                  </div>
                )}
              </div>
              
              <div className="max-h-64 overflow-y-auto space-y-2">
                {searchResults.map((exercise) => (
                  <div
                    key={exercise.id}
                    className="group flex items-center justify-between p-3 hover:bg-accent/20 rounded-lg border border-border/30 cursor-pointer transition-all hover:border-primary/30"
                    onClick={() => handleAddPrerequisite(exercise.id)}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {exercise.image_url && (
                        <img
                          src={exercise.image_url}
                          alt={exercise.name}
                          className="w-10 h-10 rounded object-cover flex-shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-foreground text-sm font-medium line-clamp-1">
                          {exercise.name}
                        </p>
                        {exercise.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                            {exercise.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-1 mt-2">
                          {exercise.category && (
                            <Badge variant="outline" className="text-xs capitalize">
                              {exercise.category}
                            </Badge>
                          )}
                          {exercise.difficulty_level && (
                            <Badge variant="secondary" className={`text-xs ${getDifficultyColor(exercise.difficulty_level)}`}>
                              {getDifficultyLabel(exercise.difficulty_level)}
                            </Badge>
                          )}
                          {exercise.premium && (
                            <Badge className="text-xs bg-yellow-500/20 text-yellow-600">
                              <Crown className="w-3 h-3 mr-1" />
                              Premium
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:text-primary hover:bg-primary/10"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {searchQuery.length === 0 && activeFiltersCount === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Zacznij pisać, aby wyszukać ćwiczenia podstawowe</p>
              <p className="text-xs mt-1">Znajdź ćwiczenia, które uczniowie powinni opanować przed tym ćwiczeniem</p>
            </div>
          )}

          {searchQuery.length > 0 && searchResults.length === 0 && !isSearching && (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Nie znaleziono ćwiczeń</p>
              <p className="text-xs mt-1">Spróbuj zmienić kryteria wyszukiwania</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
