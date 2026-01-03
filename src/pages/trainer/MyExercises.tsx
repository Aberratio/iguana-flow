import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { logError } from '@/lib/errorHandler';
import { 
  Plus, 
  Search, 
  Edit, 
  Archive, 
  ArchiveRestore,
  Eye,
  Filter,
  FolderOpen,
  Video,
  Image
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SEO } from '@/components/SEO';

interface Exercise {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  type: string | null;
  difficulty_level: string | null;
  deleted_at: string | null;
  created_at: string;
  image_url: string | null;
  video_url: string | null;
}

const MyExercises: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isTrainer, isAdmin, isLoading: roleLoading } = useUserRole();
  
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    if (!user || roleLoading) return;
    
    if (!isTrainer && !isAdmin) {
      navigate('/');
      return;
    }

    fetchExercises();
  }, [user, isTrainer, isAdmin, roleLoading, statusFilter]);

  const fetchExercises = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      let query = supabase
        .from('figures')
        .select('id, name, description, category, type, difficulty_level, deleted_at, created_at, image_url, video_url')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (statusFilter === 'active') {
        query = query.is('deleted_at', null);
      } else if (statusFilter === 'archived') {
        query = query.not('deleted_at', 'is', null);
      }

      const { data, error } = await query;

      if (error) throw error;
      setExercises(data || []);
    } catch (err: unknown) {
      logError(err, { component: 'MyExercises', action: 'fetchExercises' });
      toast.error('Błąd podczas pobierania ćwiczeń');
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!selectedExercise) return;

    try {
      const isArchived = selectedExercise.deleted_at !== null;
      
      const { error } = await supabase
        .from('figures')
        .update({ deleted_at: isArchived ? null : new Date().toISOString() })
        .eq('id', selectedExercise.id)
        .eq('created_by', user?.id);

      if (error) throw error;

      toast.success(isArchived ? 'Przywrócono ćwiczenie' : 'Zarchiwizowano ćwiczenie');
      fetchExercises();
    } catch (err: unknown) {
      logError(err, { component: 'MyExercises', action: 'archiveExercise' });
      toast.error('Błąd podczas archiwizacji');
    } finally {
      setArchiveDialogOpen(false);
      setSelectedExercise(null);
    }
  };

  const filteredExercises = exercises.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (roleLoading) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="Moje ćwiczenia | IguanaFlow"
        description="Zarządzaj swoimi ćwiczeniami"
      />
      
      <div className="container max-w-6xl mx-auto py-8 px-4 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Moje ćwiczenia</h1>
            <p className="text-muted-foreground">
              Zarządzaj ćwiczeniami, które stworzyłeś
            </p>
          </div>
          <Button onClick={() => navigate('/exercise/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Nowe ćwiczenie
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Szukaj ćwiczeń..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v: string) => setStatusFilter(v)}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie</SelectItem>
              <SelectItem value="active">Aktywne</SelectItem>
              <SelectItem value="archived">Zarchiwizowane</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Exercises list */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : filteredExercises.length === 0 ? (
          <Card className="bg-card/50 backdrop-blur border-border">
            <CardContent className="flex flex-col items-center justify-center py-12 px-4">
              <FolderOpen className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2 text-center">Brak ćwiczeń</h3>
              <p className="text-muted-foreground text-center mb-4 max-w-sm">
                {statusFilter === 'archived' 
                  ? 'Nie masz zarchiwizowanych ćwiczeń'
                  : 'Nie masz jeszcze żadnych ćwiczeń. Stwórz pierwsze!'}
              </p>
              {statusFilter !== 'archived' && (
                <>
                  <Button onClick={() => navigate('/exercise/new')} className="mb-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Stwórz ćwiczenie
                  </Button>
                  <p className="text-xs text-muted-foreground text-center max-w-xs">
                    💡 Wskazówka: Ćwiczenia to podstawowe elementy treningów i wyzwań. Dodaj zdjęcie lub wideo dla lepszego efektu.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredExercises.map((exercise) => (
              <Card 
                key={exercise.id} 
                className={`bg-card/50 backdrop-blur border-border transition-all hover:bg-card/70 ${
                  exercise.deleted_at ? 'opacity-60' : ''
                }`}
              >
                {exercise.image_url && (
                  <div className="h-32 overflow-hidden rounded-t-lg relative">
                    <img 
                      src={exercise.image_url} 
                      alt={exercise.name}
                      className="w-full h-full object-cover"
                    />
                    {exercise.video_url && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-background/80 backdrop-blur">
                          <Video className="w-3 h-3 mr-1" />
                          Video
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-1">
                      {exercise.name}
                    </CardTitle>
                    {exercise.deleted_at && (
                      <Badge variant="secondary" className="text-xs">
                        Archiwum
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {exercise.description || 'Brak opisu'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 flex-wrap mb-4">
                    {exercise.category && (
                      <Badge variant="outline" className="text-xs">
                        {exercise.category}
                      </Badge>
                    )}
                    {exercise.type && (
                      <Badge variant="outline" className="text-xs">
                        {exercise.type}
                      </Badge>
                    )}
                    {exercise.difficulty_level && (
                      <Badge variant="secondary" className="text-xs">
                        {exercise.difficulty_level}
                      </Badge>
                    )}
                    {!exercise.image_url && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        <Image className="w-3 h-3 mr-1" />
                        Brak zdjęcia
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/exercise/${exercise.id}`, { state: { from: '/trainer/my-exercises' } })}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Podgląd
                    </Button>
                    {!exercise.deleted_at && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/exercise/${exercise.id}/edit`)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edytuj
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="sm:w-auto"
                      onClick={() => {
                        setSelectedExercise(exercise);
                        setArchiveDialogOpen(true);
                      }}
                    >
                      {exercise.deleted_at ? (
                        <>
                          <ArchiveRestore className="w-4 h-4 mr-1" />
                          <span className="sm:hidden">Przywróć</span>
                        </>
                      ) : (
                        <>
                          <Archive className="w-4 h-4 mr-1" />
                          <span className="sm:hidden">Archiwizuj</span>
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Archive confirmation dialog */}
        <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {selectedExercise?.deleted_at 
                  ? 'Przywrócić ćwiczenie?'
                  : 'Archiwizować ćwiczenie?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {selectedExercise?.deleted_at
                  ? 'Ćwiczenie zostanie przywrócone i będzie można go używać w treningach.'
                  : 'Ćwiczenie zostanie zarchiwizowane. Nie będzie można go dodawać do nowych treningów, ale pozostanie w istniejących.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Anuluj</AlertDialogCancel>
              <AlertDialogAction onClick={handleArchive}>
                {selectedExercise?.deleted_at ? 'Przywróć' : 'Archiwizuj'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};

export default MyExercises;
