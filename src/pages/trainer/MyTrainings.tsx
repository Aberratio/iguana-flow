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
import { 
  Plus, 
  Search, 
  Edit, 
  Archive, 
  ArchiveRestore,
  Eye,
  Clock,
  Dumbbell,
  Filter
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
import SEO from '@/components/SEO';

interface Training {
  id: string;
  title: string;
  description: string | null;
  category: string;
  training_type: string;
  difficulty_level: string | null;
  duration_seconds: number | null;
  is_published: boolean;
  deleted_at: string | null;
  created_at: string;
  thumbnail_url: string | null;
}

const MyTrainings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isTrainer, isAdmin, isLoading: roleLoading } = useUserRole();
  
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);

  useEffect(() => {
    if (!user || roleLoading) return;
    
    if (!isTrainer && !isAdmin) {
      navigate('/');
      return;
    }

    fetchTrainings();
  }, [user, isTrainer, isAdmin, roleLoading, statusFilter]);

  const fetchTrainings = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      let query = supabase
        .from('training_library')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (statusFilter === 'active') {
        query = query.is('deleted_at', null);
      } else if (statusFilter === 'archived') {
        query = query.not('deleted_at', 'is', null);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTrainings(data || []);
    } catch (err: any) {
      console.error('Error fetching trainings:', err);
      toast.error('Błąd podczas pobierania treningów');
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!selectedTraining) return;

    try {
      const isArchived = selectedTraining.deleted_at !== null;
      
      const { error } = await supabase
        .from('training_library')
        .update({ deleted_at: isArchived ? null : new Date().toISOString() })
        .eq('id', selectedTraining.id)
        .eq('created_by', user?.id);

      if (error) throw error;

      toast.success(isArchived ? 'Przywrócono trening' : 'Zarchiwizowano trening');
      fetchTrainings();
    } catch (err: any) {
      console.error('Error archiving training:', err);
      toast.error('Błąd podczas archiwizacji');
    } finally {
      setArchiveDialogOpen(false);
      setSelectedTraining(null);
    }
  };

  const filteredTrainings = trainings.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

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
        title="Moje treningi | IguanaFlow"
        description="Zarządzaj swoimi treningami"
      />
      
      <div className="container max-w-6xl mx-auto py-8 px-4 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Moje treningi</h1>
            <p className="text-muted-foreground">
              Zarządzaj treningami, które stworzyłeś
            </p>
          </div>
          <Button onClick={() => navigate('/training/library/create')}>
            <Plus className="w-4 h-4 mr-2" />
            Nowy trening
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Szukaj treningów..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
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

        {/* Trainings list */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : filteredTrainings.length === 0 ? (
          <Card className="bg-card/50 backdrop-blur border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Dumbbell className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Brak treningów</h3>
              <p className="text-muted-foreground text-center mb-4">
                {statusFilter === 'archived' 
                  ? 'Nie masz zarchiwizowanych treningów'
                  : 'Nie masz jeszcze żadnych treningów. Stwórz pierwszy!'}
              </p>
              {statusFilter !== 'archived' && (
                <Button onClick={() => navigate('/training/library/create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Stwórz trening
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTrainings.map((training) => (
              <Card 
                key={training.id} 
                className={`bg-card/50 backdrop-blur border-border transition-all hover:bg-card/70 ${
                  training.deleted_at ? 'opacity-60' : ''
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-1">
                      {training.title}
                    </CardTitle>
                    <div className="flex gap-1">
                      {training.deleted_at && (
                        <Badge variant="secondary" className="text-xs">
                          Archiwum
                        </Badge>
                      )}
                      <Badge 
                        variant={training.is_published ? 'default' : 'outline'}
                        className="text-xs"
                      >
                        {training.is_published ? 'Opublikowany' : 'Szkic'}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {training.description || 'Brak opisu'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDuration(training.duration_seconds)}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {training.category}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/training/library/${training.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Podgląd
                    </Button>
                    {!training.deleted_at && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/training/library/${training.id}/edit`)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edytuj
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedTraining(training);
                        setArchiveDialogOpen(true);
                      }}
                    >
                      {training.deleted_at ? (
                        <ArchiveRestore className="w-4 h-4" />
                      ) : (
                        <Archive className="w-4 h-4" />
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
                {selectedTraining?.deleted_at 
                  ? 'Przywrócić trening?'
                  : 'Archiwizować trening?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {selectedTraining?.deleted_at
                  ? 'Trening zostanie przywrócony i będzie widoczny dla użytkowników.'
                  : 'Trening zostanie zarchiwizowany. Nie będzie widoczny dla użytkowników, ale możesz go później przywrócić.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Anuluj</AlertDialogCancel>
              <AlertDialogAction onClick={handleArchive}>
                {selectedTraining?.deleted_at ? 'Przywróć' : 'Archiwizuj'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};

export default MyTrainings;
