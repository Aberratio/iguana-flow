import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Target,
  Clock,
  RotateCcw,
  Flame,
  Dumbbell,
  Feather,
  CheckCircle,
  Timer,
} from "lucide-react";
import { ExerciseSearchModal } from "./ExerciseSearchModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDictionary } from "@/contexts/DictionaryContext";

interface Exercise {
  id: string;
  name: string;
  description?: string;
  difficulty_level?: string;
  category?: string;
  image_url?: string;
}

interface SessionExercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  hold_time_seconds: number;
  notes: string;
  order_index: number;
  completion_mode?: "time" | "completion";
}

interface ExerciseCategories {
  warmup: SessionExercise[];
  training: SessionExercise[];
  stretching: SessionExercise[];
}

interface SessionExerciseManagerProps {
  sessionId?: string;
  onExercisesChange: (exercises: ExerciseCategories) => void;
}

export const SessionExerciseManager: React.FC<SessionExerciseManagerProps> = ({
  sessionId,
  onExercisesChange,
}) => {
  const { toast } = useToast();
  const { getFigureTypeLabel } = useDictionary();
  const [exercises, setExercises] = useState<ExerciseCategories>({
    warmup: [],
    training: [],
    stretching: [],
  });
  const [loading, setLoading] = useState(true);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<
    "warmup" | "training" | "stretching"
  >("training");
  const [editingIndex, setEditingIndex] = useState<{
    category: string;
    index: number;
  } | null>(null);

  useEffect(() => {
    fetchSessionExercises();
  }, [sessionId]);

  const fetchSessionExercises = async () => {
    setLoading(true);
    try {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      const { data: session, error } = await supabase
        .from("training_sessions")
        .select("warmup_exercises, figures, stretching_exercises")
        .eq("id", sessionId)
        .single();

      if (error) throw error;

      const categorizedExercises: ExerciseCategories = {
        warmup:
          (session?.warmup_exercises as unknown as SessionExercise[]) || [],
        training: (session?.figures as unknown as SessionExercise[]) || [],
        stretching:
          (session?.stretching_exercises as unknown as SessionExercise[]) || [],
      };

      setExercises(categorizedExercises);
      onExercisesChange(categorizedExercises);
    } catch (error) {
      console.error("Error fetching session exercises:", error);
      toast({
        title: "Error",
        description: "Failed to load session exercises.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExerciseSelect = (
    exercise: Exercise,
    sets = 1,
    reps = 1,
    holdTime = 30
  ) => {
    const maxOrder =
      exercises[currentCategory].length > 0
        ? Math.max(...exercises[currentCategory].map((e) => e.order_index))
        : -1;

    const newExercise: SessionExercise = {
      id: exercise.id,
      name: exercise.name,
      sets,
      reps,
      hold_time_seconds: holdTime,
      notes: "",
      order_index: maxOrder + 1,
      completion_mode: holdTime === 0 ? "completion" : "time",
    };

    const updatedExercises = {
      ...exercises,
      [currentCategory]: [...exercises[currentCategory], newExercise],
    };

    setExercises(updatedExercises);
    onExercisesChange(updatedExercises);

    toast({
      title: "Dodano ćwiczenie",
      description: `${exercise.name} zostało dodane do kategorii ${getCategoryLabel(currentCategory)}.`,
    });
  };

  const handleRemoveExercise = (
    category: keyof ExerciseCategories,
    index: number
  ) => {
    const updatedExercises = {
      ...exercises,
      [category]: exercises[category].filter((_, i) => i !== index),
    };

    setExercises(updatedExercises);
    onExercisesChange(updatedExercises);

    toast({
      title: "Usunięto ćwiczenie",
      description: "Ćwiczenie zostało usunięte z treningu.",
    });
  };

  const handleUpdateExercise = (
    category: keyof ExerciseCategories,
    index: number,
    updates: Partial<SessionExercise>
  ) => {
    const updatedExercises = {
      ...exercises,
      [category]: exercises[category].map((ex, i) =>
        i === index ? { ...ex, ...updates } : ex
      ),
    };

    setExercises(updatedExercises);
    onExercisesChange(updatedExercises);
    setEditingIndex(null);

    toast({
      title: "Zaktualizowano ćwiczenie",
      description: "Szczegóły ćwiczenia zostały zapisane.",
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "warmup":
        return <Flame className="w-4 h-4" />;
      case "training":
        return <Dumbbell className="w-4 h-4" />;
      case "stretching":
        return <Feather className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "warmup":
        return getFigureTypeLabel("warm_up");
      case "training":
        return "Trening";
      case "stretching":
        return getFigureTypeLabel("stretching");
      default:
        return category;
    }
  };

  const renderExerciseList = (category: keyof ExerciseCategories) => {
    const categoryExercises = exercises[category];

    if (categoryExercises.length === 0) {
      return (
        <div className="text-center py-8 border-2 border-dashed border-white/10 rounded-lg">
          {getCategoryIcon(category)}
          <h3 className="text-lg font-semibold text-white mb-2 mt-4">
            Brak ćwiczeń {getCategoryLabel(category)}
          </h3>
          <p className="text-muted-foreground mb-4">
            Dodaj ćwiczenia, aby zbudować swoją rutynę{" "}
            {getCategoryLabel(category).toLowerCase()}
          </p>
          <Button
            onClick={() => {
              setCurrentCategory(category);
              setShowSearchModal(true);
            }}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Plus className="w-4 h-4 mr-2" />
            Dodaj ćwiczenie {getCategoryLabel(category)}
          </Button>
        </div>
      );
    }

    return (
      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-3">
          {categoryExercises.map((exercise, index) => (
            <Card
              key={`${category}-${index}`}
              className="bg-white/5 border-white/10"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-white">
                        {exercise.name}
                      </h4>
                      <Badge
                        variant="outline"
                        className="text-xs border-white/20 text-white/70"
                      >
                        #{index + 1}
                      </Badge>
                    </div>

                    {editingIndex?.category === category &&
                    editingIndex?.index === index ? (
                      <div className="space-y-3 mt-3">
                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <Label className="text-white/70 text-xs">
                              Serie
                            </Label>
                            <Input
                              type="number"
                              value={exercise.sets}
                              onChange={(e) => {
                                const updatedExercises = { ...exercises };
                                updatedExercises[category][index].sets =
                                  parseInt(e.target.value) || 1;
                                setExercises(updatedExercises);
                              }}
                              className="h-8 bg-white/5 border-white/10 text-white text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-white/70 text-xs">
                              Powtórzenia
                            </Label>
                            <Input
                              type="number"
                              value={exercise.reps}
                              onChange={(e) => {
                                const updatedExercises = { ...exercises };
                                updatedExercises[category][index].reps =
                                  parseInt(e.target.value) || 1;
                                setExercises(updatedExercises);
                              }}
                              className="h-8 bg-white/5 border-white/10 text-white text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-white/70 text-xs">
                              Przytrzymanie (s)
                            </Label>
                            <Input
                              type="number"
                              value={exercise.hold_time_seconds}
                              onChange={(e) => {
                                const updatedExercises = { ...exercises };
                                const holdTime = parseInt(e.target.value) || 0;
                                updatedExercises[category][
                                  index
                                ].hold_time_seconds = holdTime;
                                // Auto-set completion mode based on hold time
                                updatedExercises[category][
                                  index
                                ].completion_mode =
                                  holdTime === 0 ? "completion" : "time";
                                setExercises(updatedExercises);
                              }}
                              className="h-8 bg-white/5 border-white/10 text-white text-xs"
                            />
                          </div>
                          <div className="flex gap-1 items-end">
                            <Button
                              size="sm"
                              onClick={() =>
                                handleUpdateExercise(
                                  category,
                                  index,
                                  exercises[category][index]
                                )
                              }
                              className="h-8 w-8 p-0 bg-green-500/20 text-green-400 hover:bg-green-500/30"
                            >
                              <Save className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingIndex(null)}
                              className="h-8 w-8 p-0 border-white/20 text-white/70 hover:bg-white/10"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Completion Mode Toggle */}
                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                          <div className="flex items-center gap-2">
                            {(exercise.completion_mode || "time") === "time" ? (
                              <Timer className="w-4 h-4 text-blue-400" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            )}
                            <Label className="text-white/70 text-sm">
                              {(exercise.completion_mode || "time") === "time"
                                ? "Na czas"
                                : "Na zaliczenie"}
                            </Label>
                          </div>
                          <Switch
                            checked={
                              (exercise.completion_mode || "time") ===
                              "completion"
                            }
                            onCheckedChange={(checked) => {
                              const updatedExercises = { ...exercises };
                              updatedExercises[category][
                                index
                              ].completion_mode = checked
                                ? "completion"
                                : "time";
                              if (checked) {
                                updatedExercises[category][
                                  index
                                ].hold_time_seconds = 0;
                              }
                              setExercises(updatedExercises);
                            }}
                          />
                          <span className="text-xs text-white/50">
                            {(exercise.completion_mode || "time") ===
                            "completion"
                              ? 'Kliknij "Gotowe" aby ukończyć'
                              : "Ukończenie na podstawie timera"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <RotateCcw className="w-3 h-3" />
                          <span>{exercise.sets} serii</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          <span>{exercise.reps} powt.</span>
                        </div>
                        {(exercise.completion_mode || "time") ===
                        "completion" ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-400" />
                            <span className="text-green-400">
                              Na zaliczenie
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{exercise.hold_time_seconds}s przytrzymanie</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingIndex({ category, index })}
                      className="w-8 h-8 p-0 border-white/20 text-white/70 hover:bg-white/10"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveExercise(category, index)}
                      className="w-8 h-8 p-0 border-red-500/50 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    );
  };

  if (loading) {
    return (
      <Card className="glass-effect border-white/10">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Ładowanie ćwiczeń...</p>
        </CardContent>
      </Card>
    );
  }

  const totalExercises =
    exercises.warmup.length +
    exercises.training.length +
    exercises.stretching.length;

  return (
    <>
      <Card className="glass-effect border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center">
              <Target className="w-5 h-5 mr-2 text-primary" />
              Ćwiczenia w treningu ({totalExercises})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="training" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="warmup" className="flex items-center gap-2">
                <Flame className="w-4 h-4" />
                {getCategoryLabel("warmup")} ({exercises.warmup.length})
              </TabsTrigger>
              <TabsTrigger value="training" className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4" />
                {getCategoryLabel("training")} ({exercises.training.length})
              </TabsTrigger>
              <TabsTrigger
                value="stretching"
                className="flex items-center gap-2"
              >
                <Feather className="w-4 h-4" />
                {getCategoryLabel("stretching")} ({exercises.stretching.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="warmup" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">
                  Ćwiczenia {getCategoryLabel("warmup")}
                </h3>
                <Button
                  onClick={() => {
                    setCurrentCategory("warmup");
                    setShowSearchModal(true);
                  }}
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Dodaj {getCategoryLabel("warmup")}
                </Button>
              </div>
              {renderExerciseList("warmup")}
            </TabsContent>

            <TabsContent value="training" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">
                  Ćwiczenia {getCategoryLabel("training")}
                </h3>
                <Button
                  onClick={() => {
                    setCurrentCategory("training");
                    setShowSearchModal(true);
                  }}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Dodaj {getCategoryLabel("training")}
                </Button>
              </div>
              {renderExerciseList("training")}
            </TabsContent>

            <TabsContent value="stretching" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">
                  Ćwiczenia {getCategoryLabel("stretching")}
                </h3>
                <Button
                  onClick={() => {
                    setCurrentCategory("stretching");
                    setShowSearchModal(true);
                  }}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Dodaj {getCategoryLabel("stretching")}
                </Button>
              </div>
              {renderExerciseList("stretching")}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ExerciseSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onExerciseSelect={handleExerciseSelect}
        selectedExercises={[
          ...exercises.warmup,
          ...exercises.training,
          ...exercises.stretching,
        ].map((e) => e.id)}
      />
    </>
  );
};
