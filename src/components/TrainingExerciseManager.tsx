import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, GripVertical, Clock, RotateCcw, CheckCircle } from "lucide-react";
import { ExerciseSearchModal } from "@/components/ExerciseSearchModal";

export interface TrainingExerciseData {
  figure_id: string;
  figure_name?: string;
  figure_image?: string;
  order_index: number;
  completion_mode: "time" | "completion";
  sets: number;
  reps: number;
  hold_time_seconds: number;
  rest_time_seconds: number;
  notes?: string;
}

interface TrainingExerciseManagerProps {
  exercises: TrainingExerciseData[];
  onChange: (exercises: TrainingExerciseData[]) => void;
}

export const TrainingExerciseManager = ({
  exercises,
  onChange,
}: TrainingExerciseManagerProps) => {
  const [showExerciseSearch, setShowExerciseSearch] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleAddExercise = (figure: any) => {
    const newExercise: TrainingExerciseData = {
      figure_id: figure.id,
      figure_name: figure.name,
      figure_image: figure.image_url,
      order_index: exercises.length,
      completion_mode: "time",
      sets: 3,
      reps: 1,
      hold_time_seconds: 30,
      rest_time_seconds: 10,
    };
    onChange([...exercises, newExercise]);
    setShowExerciseSearch(false);
  };

  const handleUpdateExercise = (
    index: number,
    updates: Partial<TrainingExerciseData>
  ) => {
    const updated = exercises.map((ex, i) =>
      i === index ? { ...ex, ...updates } : ex
    );
    onChange(updated);
  };

  const handleRemoveExercise = (index: number) => {
    const updated = exercises.filter((_, i) => i !== index);
    onChange(updated.map((ex, i) => ({ ...ex, order_index: i })));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-lg">Ćwiczenia ({exercises.length})</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowExerciseSearch(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Dodaj ćwiczenie
        </Button>
      </div>

      {exercises.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">
            Brak ćwiczeń. Dodaj pierwsze ćwiczenie, aby rozpocząć.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowExerciseSearch(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Dodaj ćwiczenie
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {exercises.map((exercise, index) => (
            <Card key={`${exercise.figure_id}-${index}`} className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GripVertical className="w-4 h-4 cursor-grab" />
                  <span className="font-medium text-foreground">
                    {index + 1}.
                  </span>
                </div>

                {exercise.figure_image && (
                  <img
                    src={exercise.figure_image}
                    alt={exercise.figure_name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}

                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate">
                    {exercise.figure_name || "Ćwiczenie"}
                  </h4>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    <div>
                      <Label className="text-xs">Tryb</Label>
                      <Select
                        value={exercise.completion_mode}
                        onValueChange={(value: "time" | "completion") =>
                          handleUpdateExercise(index, { completion_mode: value })
                        }
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="time">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Czas
                            </div>
                          </SelectItem>
                          <SelectItem value="completion">
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Wykonanie
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Serie</Label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={exercise.sets}
                        onChange={(e) =>
                          handleUpdateExercise(index, {
                            sets: parseInt(e.target.value) || 1,
                          })
                        }
                        className="h-8"
                      />
                    </div>

                    {exercise.completion_mode === "time" && (
                      <>
                        <div>
                          <Label className="text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Czas (s)
                          </Label>
                          <Input
                            type="number"
                            min={5}
                            max={300}
                            value={exercise.hold_time_seconds}
                            onChange={(e) =>
                              handleUpdateExercise(index, {
                                hold_time_seconds: parseInt(e.target.value) || 30,
                              })
                            }
                            className="h-8"
                          />
                        </div>

                        <div>
                          <Label className="text-xs flex items-center gap-1">
                            <RotateCcw className="w-3 h-3" />
                            Przerwa (s)
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            max={120}
                            value={exercise.rest_time_seconds}
                            onChange={(e) =>
                              handleUpdateExercise(index, {
                                rest_time_seconds: parseInt(e.target.value) || 10,
                              })
                            }
                            className="h-8"
                          />
                        </div>
                      </>
                    )}

                    {exercise.completion_mode === "completion" && (
                      <div>
                        <Label className="text-xs">Powtórzenia</Label>
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={exercise.reps}
                          onChange={(e) =>
                            handleUpdateExercise(index, {
                              reps: parseInt(e.target.value) || 1,
                            })
                          }
                          className="h-8"
                        />
                      </div>
                    )}
                  </div>

                  {editingIndex === index && (
                    <div className="mt-2">
                      <Label className="text-xs">Notatki</Label>
                      <Textarea
                        value={exercise.notes || ""}
                        onChange={(e) =>
                          handleUpdateExercise(index, { notes: e.target.value })
                        }
                        placeholder="Dodatkowe wskazówki..."
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setEditingIndex(editingIndex === index ? null : index)
                    }
                  >
                    {editingIndex === index ? "Zamknij" : "Notatki"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveExercise(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ExerciseSearchModal
        isOpen={showExerciseSearch}
        onClose={() => setShowExerciseSearch(false)}
        onExerciseSelect={(exercise) => handleAddExercise(exercise)}
        selectedExercises={exercises.map(e => e.figure_id)}
      />
    </div>
  );
};
