import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Trophy, 
  BookOpen, 
  Dumbbell,
  Plane,
  FolderOpen,
  GraduationCap
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSportGuardian } from '@/hooks/useSportGuardian';

export const TrainerDropdown: React.FC = () => {
  const { guardianships, hasAnyGuardianship } = useSportGuardian();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <GraduationCap className="w-4 h-4" />
          <Badge variant="outline" className="hidden sm:inline-flex border-purple-500/50 text-purple-400">
            Trener
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-lg border-border">
        <DropdownMenuLabel>Panel Trenera</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        
        <DropdownMenuItem asChild>
          <Link to="/trainer/my-challenges" className="cursor-pointer">
            <Trophy className="w-4 h-4 mr-2" />
            Moje wyzwania
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link to="/trainer/my-trainings" className="cursor-pointer">
            <Dumbbell className="w-4 h-4 mr-2" />
            Moje treningi
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link to="/trainer/my-exercises" className="cursor-pointer">
            <FolderOpen className="w-4 h-4 mr-2" />
            Moje ćwiczenia
          </Link>
        </DropdownMenuItem>

        {hasAnyGuardianship && (
          <>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Sporty, którymi się opiekuję
            </DropdownMenuLabel>
            
            {guardianships.map((sport) => (
              <DropdownMenuItem key={sport.sport_category_id} asChild>
                <Link 
                  to={`/aerial-journey/sport/${sport.sport_key}`} 
                  className="cursor-pointer"
                >
                  <Plane className="w-4 h-4 mr-2" />
                  {sport.sport_name}
                </Link>
              </DropdownMenuItem>
            ))}
          </>
        )}
        
        <DropdownMenuSeparator className="bg-border" />
        
        <DropdownMenuItem asChild>
          <Link to="/training/library" className="cursor-pointer">
            <BookOpen className="w-4 h-4 mr-2" />
            Biblioteka treningów
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
