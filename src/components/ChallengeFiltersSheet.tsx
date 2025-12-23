import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { X } from 'lucide-react';
import { FilterStatus } from '@/hooks/useChallengeFilters';

interface ChallengeFiltersSheetProps {
  filters: {
    status: FilterStatus[];
  };
  activeFilterCount: number;
  onToggleFilter: (category: 'status', value: FilterStatus) => void;
  onClearFilters: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const ChallengeFiltersSheet: React.FC<ChallengeFiltersSheetProps> = ({
  filters,
  activeFilterCount,
  onToggleFilter,
  onClearFilters,
  isOpen,
  onOpenChange,
}) => {
  const statusOptions: { value: FilterStatus; label: string }[] = [
    { value: 'active', label: 'W trakcie' },
    { value: 'not_started', label: 'Nierozpoczęte' },
    { value: 'completed', label: 'Ukończone' },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[50vh]">
        <SheetHeader>
          <SheetTitle className="text-left">
            Filtruj wyzwania {activeFilterCount > 0 && `(${activeFilterCount})`}
          </SheetTitle>
        </SheetHeader>
        <div className="py-6">
          <h3 className="font-medium mb-3 text-sm text-muted-foreground">Status wyzwania</h3>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map(option => (
              <Badge
                key={option.value}
                variant={filters.status.includes(option.value) ? 'default' : 'outline'}
                className="cursor-pointer hover:opacity-80 transition-opacity px-4 py-2 text-sm"
                onClick={() => onToggleFilter('status', option.value)}
              >
                {option.label}
              </Badge>
            ))}
          </div>
        </div>
        <SheetFooter className="flex gap-2 pb-4">
          <Button
            variant="outline"
            onClick={onClearFilters}
            className="flex-1"
            disabled={activeFilterCount === 0}
          >
            <X className="w-4 h-4 mr-2" />
            Wyczyść
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Zastosuj
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default ChallengeFiltersSheet;
