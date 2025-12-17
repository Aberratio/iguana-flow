import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Search, UserPlus, Trash2, Shield, Users } from 'lucide-react';

interface SportCategory {
  id: string;
  name: string;
  key_name: string;
}

interface Guardian {
  id: string;
  trainer_id: string;
  sport_category_id: string;
  granted_at: string;
  notes: string | null;
  trainer_profile: {
    id: string;
    username: string;
    email: string | null;
    avatar_url: string | null;
  };
}

interface TrainerUser {
  id: string;
  username: string;
  email: string | null;
  avatar_url: string | null;
  role: string;
}

export const SportGuardiansManager: React.FC = () => {
  const { user } = useAuth();
  const [sports, setSports] = useState<SportCategory[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [trainers, setTrainers] = useState<TrainerUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingGuardian, setIsAddingGuardian] = useState(false);

  // Fetch all sports
  useEffect(() => {
    const fetchSports = async () => {
      const { data, error } = await supabase
        .from('sport_categories')
        .select('id, name, key_name')
        .order('name');

      if (error) {
        console.error('Error fetching sports:', error);
        toast.error('Błąd podczas pobierania sportów');
        return;
      }

      setSports(data || []);
      if (data && data.length > 0 && !selectedSport) {
        setSelectedSport(data[0].id);
      }
    };

    fetchSports();
  }, []);

  // Fetch guardians for selected sport
  useEffect(() => {
    const fetchGuardians = async () => {
      if (!selectedSport) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('sport_guardians')
          .select(`
            id,
            trainer_id,
            sport_category_id,
            granted_at,
            notes
          `)
          .eq('sport_category_id', selectedSport);

        if (error) throw error;

        // Fetch trainer profiles separately
        const trainerIds = (data || []).map(g => g.trainer_id);
        if (trainerIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username, email, avatar_url')
            .in('id', trainerIds);

          if (profilesError) throw profilesError;

          const guardiansWithProfiles = (data || []).map(g => ({
            ...g,
            trainer_profile: profilesData?.find(p => p.id === g.trainer_id) || {
              id: g.trainer_id,
              username: 'Unknown',
              email: null,
              avatar_url: null
            }
          }));

          setGuardians(guardiansWithProfiles);
        } else {
          setGuardians([]);
        }
      } catch (err: any) {
        console.error('Error fetching guardians:', err);
        toast.error('Błąd podczas pobierania opiekunów');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGuardians();
  }, [selectedSport]);

  // Fetch trainers for adding
  useEffect(() => {
    const fetchTrainers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, email, avatar_url, role')
        .eq('role', 'trainer')
        .ilike('username', `%${searchQuery}%`)
        .limit(20);

      if (error) {
        console.error('Error fetching trainers:', error);
        return;
      }

      setTrainers(data || []);
    };

    if (searchQuery.length >= 2) {
      fetchTrainers();
    } else {
      setTrainers([]);
    }
  }, [searchQuery]);

  const handleAddGuardian = async (trainerId: string) => {
    if (!selectedSport || !user) return;

    setIsAddingGuardian(true);
    try {
      const { error } = await supabase
        .from('sport_guardians')
        .insert({
          sport_category_id: selectedSport,
          trainer_id: trainerId,
          granted_by: user.id,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Ten trener jest już opiekunem tego sportu');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Dodano opiekuna sportu');
      setSearchQuery('');
      
      // Refresh guardians list
      const { data: newGuardian } = await supabase
        .from('sport_guardians')
        .select('id, trainer_id, sport_category_id, granted_at, notes')
        .eq('sport_category_id', selectedSport)
        .eq('trainer_id', trainerId)
        .single();

      const trainer = trainers.find(t => t.id === trainerId);
      if (newGuardian && trainer) {
        setGuardians(prev => [...prev, {
          ...newGuardian,
          trainer_profile: trainer
        }]);
      }
    } catch (err: any) {
      console.error('Error adding guardian:', err);
      toast.error('Błąd podczas dodawania opiekuna');
    } finally {
      setIsAddingGuardian(false);
    }
  };

  const handleRemoveGuardian = async (guardianId: string) => {
    try {
      const { error } = await supabase
        .from('sport_guardians')
        .delete()
        .eq('id', guardianId);

      if (error) throw error;

      toast.success('Usunięto opiekuna sportu');
      setGuardians(prev => prev.filter(g => g.id !== guardianId));
    } catch (err: any) {
      console.error('Error removing guardian:', err);
      toast.error('Błąd podczas usuwania opiekuna');
    }
  };

  const selectedSportName = sports.find(s => s.id === selectedSport)?.name || '';

  return (
    <Card className="bg-card/50 backdrop-blur border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-400" />
          Opiekunowie sportów
        </CardTitle>
        <CardDescription>
          Przypisuj trenerów jako opiekunów poszczególnych sportów. Opiekunowie mogą zarządzać poziomami i treściami swoich sportów.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sport selector */}
        <div className="space-y-2">
          <Label>Wybierz sport</Label>
          <Select value={selectedSport} onValueChange={setSelectedSport}>
            <SelectTrigger className="bg-background/50">
              <SelectValue placeholder="Wybierz sport" />
            </SelectTrigger>
            <SelectContent>
              {sports.map((sport) => (
                <SelectItem key={sport.id} value={sport.id}>
                  {sport.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Current guardians */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <Label>Aktualni opiekunowie ({selectedSportName})</Label>
          </div>
          
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : guardians.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              Brak przypisanych opiekunów
            </div>
          ) : (
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {guardians.map((guardian) => (
                  <div
                    key={guardian.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={guardian.trainer_profile.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500">
                          {guardian.trainer_profile.username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{guardian.trainer_profile.username}</p>
                        <p className="text-xs text-muted-foreground">
                          {guardian.trainer_profile.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemoveGuardian(guardian.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Add new guardian */}
        <div className="space-y-3 border-t border-border pt-4">
          <Label>Dodaj opiekuna</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Szukaj trenera po nazwie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50"
            />
          </div>

          {searchQuery.length >= 2 && trainers.length > 0 && (
            <ScrollArea className="h-48 border border-border rounded-lg">
              <div className="p-2 space-y-1">
                {trainers
                  .filter(t => !guardians.some(g => g.trainer_id === t.id))
                  .map((trainer) => (
                    <div
                      key={trainer.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-background/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={trainer.avatar_url || undefined} />
                          <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-xs">
                            {trainer.username?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{trainer.username}</p>
                          <p className="text-xs text-muted-foreground">{trainer.email}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">Trener</Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddGuardian(trainer.id)}
                        disabled={isAddingGuardian}
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Dodaj
                      </Button>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          )}

          {searchQuery.length >= 2 && trainers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nie znaleziono trenerów
            </p>
          )}

          {searchQuery.length > 0 && searchQuery.length < 2 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Wpisz co najmniej 2 znaki
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
