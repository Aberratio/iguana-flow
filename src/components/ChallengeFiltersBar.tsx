import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { FilterStatus } from '@/hooks/useChallengeFilters';

interface ChallengeFiltersBarProps {
  filters: {
    status: FilterStatus[];
  };
  activeFilterCount: number;
  onToggleFilter: (category: 'status', value: FilterStatus) => void;
  onClearFilters: () => void;
}

const ChallengeFiltersBar = ({
  filters,
  activeFilterCount,
  onToggleFilter,
  onClearFilters,
}: ChallengeFiltersBarProps) => {
  const statusOptions: { value: FilterStatus; label: string }[] = [
    { value: 'active', label: 'W trakcie' },
    { value: 'not_started', label: 'Nierozpoczęte' },
    { value: 'completed', label: 'Ukończone' },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-6 items-center">
      <span className="text-sm text-muted-foreground mr-1">Filtruj:</span>
      {statusOptions.map(option => (
        <Badge
          key={option.value}
          variant={filters.status.includes(option.value) ? 'default' : 'outline'}
          className="cursor-pointer hover:opacity-80 transition-opacity px-3 py-1"
          onClick={() => onToggleFilter('status', option.value)}
        >
          {option.label}
        </Badge>
      ))}

      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="ml-2 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4 mr-1" />
          Wyczyść
        </Button>
      )}
    </div>
  );
};

export default ChallengeFiltersBar;
