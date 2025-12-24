import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSportGuardian } from '@/hooks/useSportGuardian';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  Shield, 
  Eye, 
  Edit, 
  Users, 
  Layers, 
  Trophy,
  ArrowRight,
  ChevronRight,
  Dumbbell
} from 'lucide-react';
import SEO from '@/components/SEO';

interface SportDetails {
  id: string;
  key_name: string;
  name: string;
  description: string | null;
  icon: string | null;
  is_published: boolean;
  levelsCount: number;
  figuresCount: number;
}

const MySports: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { guardianships, isLoading: guardianLoading } = useSportGuardian();
  const [sports, setSports] = useState<SportDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!guardianLoading && guardianships.length > 0) {
      fetchSportDetails();
    } else if (!guardianLoading) {
      setLoading(false);
    }
  }, [guardianships, guardianLoading]);

  const fetchSportDetails = async () => {
    try {
      const sportIds = guardianships.map(g => g.sport_category_id);
      
      // Fetch sport categories
      const { data: categoriesData, error } = await supabase
        .from('sport_categories')
        .select('*')
        .in('id', sportIds);

      if (error) throw error;

      // Fetch levels and figures count for each sport
      const sportsWithDetails = await Promise.all(
        (categoriesData || []).map(async (category) => {
          const { data: levelsData } = await supabase
            .from('sport_levels')
            .select('id')
            .eq('sport_category', category.key_name);

          const { data: figuresData } = await supabase
            .from('figures')
            .select('id')
            .eq('category', category.key_name);

          return {
            ...category,
            levelsCount: levelsData?.length || 0,
            figuresCount: figuresData?.length || 0,
          } as SportDetails;
        })
      );

      setSports(sportsWithDetails);
    } catch (err) {
      console.error('Error fetching sport details:', err);
      toast.error('Błąd podczas pobierania danych sportów');
    } finally {
      setLoading(false);
    }
  };

  if (guardianLoading || loading) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (sports.length === 0) {
    return (
      <>
        <SEO 
          title="Moje sporty | IguanaFlow"
          description="Zarządzaj swoimi sportami jako opiekun"
        />
        <div className="container max-w-6xl mx-auto py-8 px-4">
          <Card className="bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Shield className="w-16 h-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Nie jesteś opiekunem żadnego sportu</h2>
              <p className="text-muted-foreground text-center max-w-md">
                Skontaktuj się z administratorem, aby zostać przydzielonym jako opiekun sportu.
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO 
        title="Moje sporty | IguanaFlow"
        description="Zarządzaj swoimi sportami jako opiekun"
      />
      
      <div className="container max-w-6xl mx-auto py-8 px-4 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              Moje sporty
            </h1>
            <p className="text-muted-foreground">
              Zarządzaj sportami, których jesteś opiekunem
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {sports.map((sport) => (
            <Card key={sport.id} className="bg-card/50 backdrop-blur border-border overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-purple-500/10 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{sport.icon || '🏆'}</span>
                    <div>
                      <CardTitle className="text-xl">{sport.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {sport.description || 'Brak opisu'}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge 
                    className={cn(
                      sport.is_published 
                        ? "bg-green-500/20 text-green-400 border-green-500/50" 
                        : ""
                    )}
                    variant={sport.is_published ? "default" : "secondary"}
                  >
                    {sport.is_published ? 'Opublikowany' : 'Szkic'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-4 space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <span className="text-muted-foreground">Poziomy:</span>
                    <span className="font-medium">{sport.levelsCount}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span className="text-muted-foreground">Ćwiczenia:</span>
                    <span className="font-medium">{sport.figuresCount}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/aerial-journey/sport/${sport.key_name}`)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Widok użytkownika
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/aerial-journey/preview/${sport.key_name}`)}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Podgląd trenera
                  </Button>
                </div>

                <Button
                  className="w-full"
                  onClick={() => navigate(`/aerial-journey/admin/${sport.key_name}`)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edytuj poziomy
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Links */}
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-lg">Szybkie akcje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button 
                variant="outline" 
                className="justify-start h-auto py-3"
                onClick={() => navigate('/trainer/my-challenges')}
              >
                <Trophy className="w-4 h-4 mr-2 text-amber-400" />
                <span className="flex-1 text-left">Moje wyzwania</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                className="justify-start h-auto py-3"
                onClick={() => navigate('/trainer/my-trainings')}
              >
                <Dumbbell className="w-4 h-4 mr-2 text-blue-400" />
                <span className="flex-1 text-left">Moje treningi</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                className="justify-start h-auto py-3"
                onClick={() => navigate('/trainer/my-exercises')}
              >
                <Layers className="w-4 h-4 mr-2 text-green-400" />
                <span className="flex-1 text-left">Moje ćwiczenia</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default MySports;
