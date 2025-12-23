import { useState, useMemo, useEffect } from "react";

export type FilterStatus = "active" | "not_started" | "completed";

interface ChallengeFiltersState {
  status: FilterStatus[];
}

const STORAGE_KEY = "challengeFilters_v2";

const loadFiltersFromLocalStorage = (): ChallengeFiltersState | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") {
        return {
          status: Array.isArray(parsed.status) ? parsed.status : [],
        };
      }
    }
  } catch (error) {
    console.error("Error loading filters from localStorage:", error);
  }
  return null;
};

const defaultFilters: ChallengeFiltersState = {
  status: [],
};

export const useChallengeFilters = () => {
  const loadedData = loadFiltersFromLocalStorage();
  const [filters, setFilters] = useState<ChallengeFiltersState>(
    loadedData || defaultFilters
  );

  const toggleFilter = (
    category: keyof ChallengeFiltersState,
    value: FilterStatus
  ) => {
    setFilters((prev) => {
      const currentValues = prev[category] as FilterStatus[];
      const valueExists = currentValues.includes(value);

      return {
        ...prev,
        [category]: valueExists
          ? currentValues.filter((v) => v !== value)
          : [...currentValues, value],
      };
    });
  };

  const clearFilters = () => {
    setFilters({
      status: [],
    });
  };

  // Save filters to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch (error) {
      console.error("Error saving filters to localStorage:", error);
    }
  }, [filters]);

  const activeFilterCount = useMemo(() => {
    return filters.status.length;
  }, [filters]);

  const applyFilters = <
    T extends {
      id?: string;
      status: string;
    }
  >(
    challenges: T[]
  ): T[] => {
    if (filters.status.length === 0) {
      return challenges;
    }

    return challenges.filter((challenge) => {
      const statusMatch = filters.status.some((s) => {
        if (s === "active") return challenge.status === "active";
        if (s === "not_started") return challenge.status === "not-started";
        if (s === "completed") return challenge.status === "completed";
        return false;
      });
      return statusMatch;
    });
  };

  // Default sorting: active first, then not-started, then completed, then by level
  const applySorting = <
    T extends {
      status: string;
      level?: number;
      created_at?: string;
    }
  >(
    challenges: T[]
  ): T[] => {
    const statusOrder: Record<string, number> = {
      active: 0,
      "not-started": 1,
      completed: 2,
    };

    return [...challenges].sort((a, b) => {
      const statusA = statusOrder[a.status] ?? 3;
      const statusB = statusOrder[b.status] ?? 3;
      
      if (statusA !== statusB) {
        return statusA - statusB;
      }
      
      // Within same status, sort by level ascending
      return (a.level || 0) - (b.level || 0);
    });
  };

  return {
    filters,
    toggleFilter,
    clearFilters,
    activeFilterCount,
    applyFilters,
    applySorting,
  };
};
