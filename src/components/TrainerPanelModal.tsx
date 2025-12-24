import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  Dumbbell, 
  FolderOpen, 
  Shield,
  GraduationCap,
  Plus,
  ArrowRight,
  Lightbulb
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSportGuardian } from '@/hooks/useSportGuardian';

interface TrainerPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrainerPanelModal: React.FC<TrainerPanelModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { hasAnyGuardianship, guardianships } = useSportGuardian();

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const mainActions = [
    {
      title: 'Moje wyzwania',
      description: 'Twórz i zarządzaj wyzwaniami',
      icon: Trophy,
      path: '/trainer/my-challenges',
      color: 'text-amber-400',
    },
    {
      title: 'Moje treningi',
      description: 'Twórz i zarządzaj treningami',
      icon: Dumbbell,
      path: '/trainer/my-trainings',
      color: 'text-blue-400',
    },
    {
      title: 'Moje ćwiczenia',
      description: 'Twórz i zarządzaj ćwiczeniami',
      icon: FolderOpen,
      path: '/trainer/my-exercises',
      color: 'text-green-400',
    },
  ];

  const quickActions = [
    { label: 'Nowe wyzwanie', path: '/challenges/create', icon: Plus },
    { label: 'Nowy trening', path: '/training/library/create', icon: Plus },
    { label: 'Nowe ćwiczenie', path: '/exercise/new', icon: Plus },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            Panel trenera
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Main Navigation */}
          <div className="space-y-2">
            {mainActions.map((action) => (
              <Button
                key={action.path}
                variant="outline"
                className="w-full justify-start h-auto py-3 px-4"
                onClick={() => handleNavigate(action.path)}
              >
                <action.icon className={`w-5 h-5 mr-3 ${action.color}`} />
                <div className="flex-1 text-left">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {action.description}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </Button>
            ))}

            {/* Sport Guardian */}
            {hasAnyGuardianship && (
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-3 px-4"
                onClick={() => handleNavigate('/trainer/my-sports')}
              >
                <Shield className="w-5 h-5 mr-3 text-purple-400" />
                <div className="flex-1 text-left">
                  <div className="font-medium">Moje sporty</div>
                  <div className="text-xs text-muted-foreground">
                    {guardianships.length} sport{guardianships.length === 1 ? '' : 'y'} pod opieką
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </Button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground mb-2 px-1">Szybkie akcje</p>
            <div className="grid grid-cols-3 gap-2">
              {quickActions.map((action) => (
                <Button
                  key={action.path}
                  variant="secondary"
                  size="sm"
                  className="flex-col h-auto py-2 text-xs"
                  onClick={() => handleNavigate(action.path)}
                >
                  <action.icon className="w-4 h-4 mb-1" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Hint for new trainers */}
          <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Wskazówka:</span>{' '}
              Zacznij od stworzenia ćwiczeń, które później wykorzystasz w treningach i wyzwaniach.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
