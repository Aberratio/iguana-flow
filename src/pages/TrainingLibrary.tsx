import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useTrainingLibrary } from '@/hooks/useTrainingLibrary';
import { useTrainingBookmarks } from '@/hooks/useTrainingBookmarks';
import { useAuth } from '@/contexts/AuthContext';
import TrainingLibraryCard from '@/components/TrainingLibraryCard';
import TrainingLibraryFilters from '@/components/TrainingLibraryFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import SEO from '@/components/SEO';

const TrainingLibrary = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: [],
    sportType: [],
    difficulty: [],
    trainingType: [],
    premium: null as boolean | null,
  });
  const { bookmarkedIds, toggleBookmark } = useTrainingBookmarks(user?.id);

  const { trainings, isLoading } = useTrainingLibrary({ ...filters, search });

  const activeFilterCount =
    filters.category.length +
    filters.sportType.length +
    filters.difficulty.length +
    filters.trainingType.length +
    (filters.premium !== null ? 1 : 0);

  return (
    <>
      <SEO
        title="Biblioteka Treningów"
        description="Odkrywaj treningi aerial dopasowane do Twoich potrzeb. Rozgrzewki, rozciąganie, siła i kondycja dla pole dance i aerial hoop."
        image="https://iguanaflow.app/og-training.jpg"
        url="https://iguanaflow.app/training-library"
      />
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/10">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Biblioteka Treningów
          </h1>
          <p className="text-muted-foreground">
            Odkrywaj treningi dopasowane do Twoich potrzeb
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Szukaj treningów..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-background-elevated border-white/10"
            />
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Filters Sidebar */}
          {!isMobile && (
            <div className="w-64 flex-shrink-0">
              <div className="sticky top-4">
                <TrainingLibraryFilters
                  filters={filters}
                  onFilterChange={setFilters}
                  activeFilterCount={activeFilterCount}
                  isMobile={false}
                />
              </div>
            </div>
          )}

          {/* Trainings Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-video w-full" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ))}
              </div>
            ) : trainings.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-xl text-muted-foreground">
                  Nie znaleziono treningów
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Spróbuj zmienić filtry lub wyszukiwanie
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trainings.map((training) => (
            <TrainingLibraryCard 
              key={training.id} 
              training={training}
              isBookmarked={bookmarkedIds.includes(training.id)}
              onToggleBookmark={() => toggleBookmark(training.id)}
            />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Filters Button */}
        {isMobile && (
          <TrainingLibraryFilters
            filters={filters}
            onFilterChange={setFilters}
            activeFilterCount={activeFilterCount}
            isMobile={true}
            isOpen={isFilterOpen}
            onOpenChange={setIsFilterOpen}
          />
        )}
      </div>
    </div>
    </>
  );
};

export default TrainingLibrary;
