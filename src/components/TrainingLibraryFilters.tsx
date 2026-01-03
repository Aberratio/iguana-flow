import React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Filter, X } from "lucide-react";
import { useDictionary } from "@/contexts/DictionaryContext";

interface TrainingLibraryFiltersProps {
  filters: {
    category: string[];
    sportType: string[];
    difficulty: string[];
    trainingType: string[];
    premium: boolean | null;
  };
  onFilterChange: (filters: any) => void;
  activeFilterCount: number;
  isMobile?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const TrainingLibraryFilters: React.FC<TrainingLibraryFiltersProps> = ({
  filters,
  onFilterChange,
  activeFilterCount,
  isMobile = false,
  isOpen = false,
  onOpenChange,
}) => {
  const { sportCategories, getSportCategoryLabel } = useDictionary();
  const handleCategoryChange = (category: string, checked: boolean) => {
    const newCategories = checked
      ? [...filters.category, category]
      : filters.category.filter((c) => c !== category);
    onFilterChange({ ...filters, category: newCategories });
  };

  const handleSportChange = (sport: string, checked: boolean) => {
    const newSports = checked
      ? [...filters.sportType, sport]
      : filters.sportType.filter((s) => s !== sport);
    onFilterChange({ ...filters, sportType: newSports });
  };

  const handleDifficultyChange = (difficulty: string, checked: boolean) => {
    const newDifficulties = checked
      ? [...filters.difficulty, difficulty]
      : filters.difficulty.filter((d) => d !== difficulty);
    onFilterChange({ ...filters, difficulty: newDifficulties });
  };

  const handleTrainingTypeChange = (type: string, checked: boolean) => {
    const newTypes = checked
      ? [...filters.trainingType, type]
      : filters.trainingType.filter((t) => t !== type);
    onFilterChange({ ...filters, trainingType: newTypes });
  };

  const handlePremiumChange = (value: string) => {
    onFilterChange({
      ...filters,
      premium: value === "free" ? false : value === "premium" ? true : null,
    });
  };

  const clearAllFilters = () => {
    onFilterChange({
      category: [],
      sportType: [],
      difficulty: [],
      trainingType: [],
      premium: null,
    });
  };

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3 text-foreground">Kategoria</h3>
        <div className="space-y-2">
          {[
            { value: "warmup", label: "🔥 Rozgrzewka" },
            { value: "exercise", label: "💪 Ćwiczenia" },
            { value: "cooldown", label: "🧘 Cooldown" },
            { value: "complex", label: "🎯 Kompleksowe" },
          ].map((cat) => (
            <div key={cat.value} className="flex items-center space-x-2">
              <Checkbox
                id={`cat-${cat.value}`}
                checked={filters.category.includes(cat.value)}
                onCheckedChange={(checked) =>
                  handleCategoryChange(cat.value, checked as boolean)
                }
              />
              <Label htmlFor={`cat-${cat.value}`} className="cursor-pointer">
                {cat.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3 text-foreground">Sporty</h3>
        <div className="space-y-2">
          {sportCategories.map((sport) => (
            <div key={sport.key_name} className="flex items-center space-x-2">
              <Checkbox
                id={`sport-${sport.key_name}`}
                checked={filters.sportType.includes(sport.key_name)}
                onCheckedChange={(checked) =>
                  handleSportChange(sport.key_name, checked as boolean)
                }
              />
              <Label
                htmlFor={`sport-${sport.key_name}`}
                className="cursor-pointer"
              >
                {sport.icon && <span className="mr-1">{sport.icon}</span>}
                {sport.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3 text-foreground">Trudność</h3>
        <div className="space-y-2">
          {[
            { value: "beginner", label: "⭐ Początkujący" },
            { value: "intermediate", label: "⭐⭐ Średni" },
            { value: "advanced", label: "⭐⭐⭐ Zaawansowany" },
          ].map((diff) => (
            <div key={diff.value} className="flex items-center space-x-2">
              <Checkbox
                id={`diff-${diff.value}`}
                checked={filters.difficulty.includes(diff.value)}
                onCheckedChange={(checked) =>
                  handleDifficultyChange(diff.value, checked as boolean)
                }
              />
              <Label htmlFor={`diff-${diff.value}`} className="cursor-pointer">
                {diff.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3 text-foreground">Typ treningu</h3>
        <div className="space-y-2">
          {[
            { value: "video", label: "📹 Filmy" },
            { value: "figure_set", label: "📝 Zestawy" },
            { value: "complex", label: "🎯 Kompleksowe" },
          ].map((type) => (
            <div key={type.value} className="flex items-center space-x-2">
              <Checkbox
                id={`type-${type.value}`}
                checked={filters.trainingType.includes(type.value)}
                onCheckedChange={(checked) =>
                  handleTrainingTypeChange(type.value, checked as boolean)
                }
              />
              <Label htmlFor={`type-${type.value}`} className="cursor-pointer">
                {type.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3 text-foreground">Dostęp</h3>
        <div className="space-y-2">
          {[
            { value: "all", label: "Wszystkie" },
            { value: "free", label: "Darmowe" },
            { value: "premium", label: "Premium" },
          ].map((access) => (
            <div key={access.value} className="flex items-center space-x-2">
              <Checkbox
                id={`access-${access.value}`}
                checked={
                  access.value === "all"
                    ? filters.premium === null
                    : access.value === "free"
                    ? filters.premium === false
                    : filters.premium === true
                }
                onCheckedChange={() => handlePremiumChange(access.value)}
              />
              <Label
                htmlFor={`access-${access.value}`}
                className="cursor-pointer"
              >
                {access.label}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <Button
          onClick={() => onOpenChange?.(true)}
          className="fixed bottom-20 right-4 z-50 rounded-full w-14 h-14 shadow-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <Filter className="w-6 h-6" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>

        <Sheet open={isOpen} onOpenChange={onOpenChange}>
          <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-left">
                Filtry {activeFilterCount > 0 && `(${activeFilterCount})`}
              </SheetTitle>
            </SheetHeader>
            <div className="py-6">
              <FilterContent />
            </div>
            <SheetFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={clearAllFilters}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Wyczyść
              </Button>
              <Button
                onClick={() => onOpenChange?.(false)}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
              >
                Zastosuj
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Filtry</h2>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs"
          >
            <X className="w-3 h-3 mr-1" />
            Wyczyść ({activeFilterCount})
          </Button>
        )}
      </div>
      <FilterContent />
    </div>
  );
};

export { TrainingLibraryFilters };
