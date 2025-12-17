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
  Trophy,
  Filter,
  Calendar,
  Users
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

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  status: string;
  difficulty_level: string | null;
  premium: boolean;
  deleted_at: string | null;
  created_at: string;
  image_url: string | null;
  participants_count?: number;
}

const MyChallenges: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isTrainer, isAdmin, isLoading: roleLoading } = useUserRole();
  
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  useEffect(() => {
    if (!user || roleLoading) return;
    
    if (!isTrainer && !isAdmin) {
      navigate('/');
      return;
    }

    fetchChallenges();
  }, [user, isTrainer, isAdmin, roleLoading, statusFilter]);

  const fetchChallenges = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      let query = supabase
        .from('challenges')
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

      // Get participants count for each challenge
      const challengeIds = (data || []).map(c => c.id);
      if (challengeIds.length > 0) {
        const { data: participantsData } = await supabase
          .from('challenge_participants')
          .select('challenge_id')
          .in('challenge_id', challengeIds);

        const participantCounts: Record<string, number> = {};
        (participantsData || []).forEach(p => {
          participantCounts[p.challenge_id] = (participantCounts[p.challenge_id] || 0) + 1;
        });

        const challengesWithCounts = (data || []).map(c => ({
          ...c,
          participants_count: participantCounts[c.id] || 0
        }));

        setChallenges(challengesWithCounts);
      } else {
        setChallenges([]);
      }
    } catch (err: any) {
      console.error('Error fetching challenges:', err);
      toast.error('Błąd podczas pobierania wyzwań');
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!selectedChallenge) return;

    try {
      const isArchived = selectedChallenge.deleted_at !== null;
      
      const { error } = await supabase
        .from('challenges')
        .update({ deleted_at: isArchived ? null : new Date().toISOString() })
        .eq('id', selectedChallenge.id)
        .eq('created_by', user?.id);

      if (error) throw error;

      toast.success(isArchived ? 'Przywrócono wyzwanie' : 'Zarchiwizowano wyzwanie');
      fetchChallenges();
    } catch (err: any) {
      console.error('Error archiving challenge:', err);
      toast.error('Błąd podczas archiwizacji');
    } finally {
      setArchiveDialogOpen(false);
      setSelectedChallenge(null);
    }
  };

  const filteredChallenges = challenges.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Opublikowane</Badge>;
      case 'draft':
        return <Badge variant="outline">Szkic</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
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
        title="Moje wyzwania | IguanaFlow"
        description="Zarządzaj swoimi wyzwaniami"
      />
      
      <div className="container max-w-6xl mx-auto py-8 px-4 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Moje wyzwania</h1>
            <p className="text-muted-foreground">
              Zarządzaj wyzwaniami, które stworzyłeś
            </p>
          </div>
          <Button onClick={() => navigate('/challenges/create')}>
            <Plus className="w-4 h-4 mr-2" />
            Nowe wyzwanie
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Szukaj wyzwań..."
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

        {/* Challenges list */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-56" />
            ))}
          </div>
        ) : filteredChallenges.length === 0 ? (
          <Card className="bg-card/50 backdrop-blur border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Trophy className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Brak wyzwań</h3>
              <p className="text-muted-foreground text-center mb-4">
                {statusFilter === 'archived' 
                  ? 'Nie masz zarchiwizowanych wyzwań'
                  : 'Nie masz jeszcze żadnych wyzwań. Stwórz pierwsze!'}
              </p>
              {statusFilter !== 'archived' && (
                <Button onClick={() => navigate('/challenges/create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Stwórz wyzwanie
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredChallenges.map((challenge) => (
              <Card 
                key={challenge.id} 
                className={`bg-card/50 backdrop-blur border-border transition-all hover:bg-card/70 ${
                  challenge.deleted_at ? 'opacity-60' : ''
                }`}
              >
                {challenge.image_url && (
                  <div className="h-32 overflow-hidden rounded-t-lg">
                    <img 
                      src={challenge.image_url} 
                      alt={challenge.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-1">
                      {challenge.title}
                    </CardTitle>
                    <div className="flex flex-wrap gap-1">
                      {challenge.deleted_at && (
                        <Badge variant="secondary" className="text-xs">
                          Archiwum
                        </Badge>
                      )}
                      {getStatusBadge(challenge.status)}
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {challenge.description || 'Brak opisu'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {challenge.participants_count || 0}
                    </div>
                    {challenge.premium && (
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-xs">
                        Premium
                      </Badge>
                    )}
                    {challenge.difficulty_level && (
                      <Badge variant="outline" className="text-xs">
                        {challenge.difficulty_level}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/challenges/${challenge.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Podgląd
                    </Button>
                    {!challenge.deleted_at && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/challenges/${challenge.id}/edit`)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edytuj
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedChallenge(challenge);
                        setArchiveDialogOpen(true);
                      }}
                    >
                      {challenge.deleted_at ? (
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
                {selectedChallenge?.deleted_at 
                  ? 'Przywrócić wyzwanie?'
                  : 'Archiwizować wyzwanie?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {selectedChallenge?.deleted_at
                  ? 'Wyzwanie zostanie przywrócone i będzie widoczne dla użytkowników.'
                  : 'Wyzwanie zostanie zarchiwizowane. Nie będzie widoczne dla nowych użytkowników, ale obecni uczestnicy nadal będą mieli dostęp.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Anuluj</AlertDialogCancel>
              <AlertDialogAction onClick={handleArchive}>
                {selectedChallenge?.deleted_at ? 'Przywróć' : 'Archiwizuj'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};

export default MyChallenges;
