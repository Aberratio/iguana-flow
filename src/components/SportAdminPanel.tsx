import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { Plus, Edit, Trash2, Save, Home, Settings, Target, Eye, ArrowLeft, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useSportGuardian } from "@/hooks/useSportGuardian";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import LevelEditorSheet from "@/components/LevelEditorSheet";
import SportDemoUsersManager from "@/components/SportDemoUsersManager";

interface SportCategory {
  id: string;
  key_name: string;
  name: string;
  description?: string;
  icon?: string;
  image_url?: string;
  is_published: boolean;
}

interface SportLevel {
  id: string;
  sport_category: string;
  level_number: number;
  level_name: string;
  point_limit: number;
  created_at: string;
  figure_count: number;
  challenge_id?: string;
  status: 'draft' | 'published';
}

interface SportAdminPanelProps {
  sportKey: string;
}

const SportAdminPanel = ({ sportKey }: SportAdminPanelProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();
  const { isGuardianOfByKey } = useSportGuardian();
  
  const isGuardian = isGuardianOfByKey(sportKey);
  const canManage = isAdmin || isGuardian;
  
  const [sportCategory, setSportCategory] = useState<SportCategory | null>(null);
  const [levels, setLevels] = useState<SportLevel[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Sport info editing states
  const [isEditingSport, setIsEditingSport] = useState(false);
  const [sportForm, setSportForm] = useState({
    name: '',
    description: '',
    icon: '',
    image_url: '',
    is_published: false
  });
  
  // Level editor
  const [isLevelEditorOpen, setIsLevelEditorOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<SportLevel | null>(null);

  useEffect(() => {
    if (!sportKey) return;
    fetchSportData();
  }, [sportKey]);

  const fetchSportData = async () => {
    try {
      setLoading(true);
      
      // Fetch sport category
      const { data: sportData, error: sportError } = await supabase
        .from("sport_categories")
        .select("*")
        .eq("key_name", sportKey)
        .single();
      
      if (sportError) throw sportError;
      setSportCategory(sportData);
      setSportForm({
        name: sportData.name,
        description: sportData.description || '',
        icon: sportData.icon || '',
        image_url: sportData.image_url || '',
        is_published: sportData.is_published
      });
      
      // Fetch levels for this sport
      await fetchLevels();
      
    } catch (error) {
      console.error('Błąd pobierania danych sportu:', error);
      toast.error('Nie udało się załadować danych sportu');
    } finally {
      setLoading(false);
    }
  };

  const fetchLevels = async () => {
    try {
      const { data, error } = await supabase
        .from('sport_levels')
        .select('*')
        .eq('sport_category', sportKey)
        .order('level_number');

      if (error) throw error;

      // Get figure counts separately
      const levelsWithCount = await Promise.all((data || []).map(async (level) => {
        const { count } = await supabase
          .from('level_figures')
          .select('*', { count: 'exact', head: true })
          .eq('level_id', level.id);
        
        return {
          ...level,
          figure_count: count || 0,
          status: level.status as 'draft' | 'published'
        };
      }));

      setLevels(levelsWithCount);
    } catch (error) {
      console.error('Błąd pobierania poziomów:', error);
      toast.error('Nie udało się załadować poziomów');
    }
  };

  const updateSportInfo = async () => {
    if (!sportCategory || !user) return;

    try {
      const { error } = await supabase
        .from('sport_categories')
        .update({
          name: sportForm.name.trim(),
          description: sportForm.description.trim() || null,
          icon: sportForm.icon.trim() || null,
          image_url: sportForm.image_url.trim() || null,
          is_published: sportForm.is_published
        })
        .eq('id', sportCategory.id);

      if (error) throw error;

      setSportCategory(prev => prev ? { ...prev, ...sportForm } : null);
      setIsEditingSport(false);
      toast.success('Zaktualizowano informacje o sporcie');
    } catch (error) {
      console.error('Błąd aktualizacji sportu:', error);
      toast.error('Nie udało się zaktualizować sportu');
    }
  };

  const deleteLevel = async (levelId: string) => {
    try {
      const { error } = await supabase
        .from('sport_levels')
        .delete()
        .eq('id', levelId);

      if (error) throw error;

      toast.success('Usunięto poziom');
      fetchLevels();
    } catch (error) {
      console.error('Błąd usuwania poziomu:', error);
      toast.error('Nie udało się usunąć poziomu');
    }
  };

  const openCreateLevel = () => {
    setSelectedLevel(null);
    setIsLevelEditorOpen(true);
  };

  const openEditLevel = (level: SportLevel) => {
    setSelectedLevel(level);
    setIsLevelEditorOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!sportCategory) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Sport nie znaleziony</h2>
          <p className="text-muted-foreground">Kategoria sportowa, której szukasz, nie istnieje.</p>
          <Button 
            onClick={() => navigate('/aerial-journey')} 
            className="mt-4"
            variant="outline"
          >
            Wróć do Podróży
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-black to-purple-950/10">
      <div className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink 
                onClick={() => navigate(isAdmin ? '/aerial-journey' : '/trainer/my-sports')}
                className="text-white/70 hover:text-white cursor-pointer flex items-center gap-1"
              >
                {isAdmin ? <Home className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                {isAdmin ? 'Podróż' : 'Moje sporty'}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-white font-medium">
                Edycja: {sportCategory.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
              {sportCategory.icon && <span className="text-4xl">{sportCategory.icon}</span>}
              {sportCategory.name}
              <Badge 
                className={`ml-2 ${
                  sportCategory.is_published 
                    ? "bg-green-500/20 text-green-400 border-green-400/30" 
                    : "bg-orange-500/20 text-orange-400 border-orange-400/30"
                }`}
              >
                {sportCategory.is_published ? "Opublikowane" : "Wersja Robocza"}
              </Badge>
              {isGuardian && !isAdmin && (
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-400/30">
                  <Shield className="w-3 h-3 mr-1" />
                  Opiekun
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">
              Zarządzaj informacjami o sporcie i poziomami umiejętności
            </p>
          </div>
          
          {/* Quick actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/aerial-journey/sport/${sportKey}`)}
              className="border-white/20"
            >
              <Eye className="w-4 h-4 mr-2" />
              Widok użytkownika
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/aerial-journey/preview/${sportKey}`)}
              className="border-blue-400/30 text-blue-400 hover:bg-blue-400/10"
            >
              <Eye className="w-4 h-4 mr-2" />
              Podgląd trenera
            </Button>
          </div>
        </div>

        {/* Sport Information Card */}
        <Card className="glass-effect border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Informacje o Sporcie
              </CardTitle>
              <Button
                variant="outline"
                onClick={() => setIsEditingSport(!isEditingSport)}
                className="border-purple-400/30 text-purple-400 hover:bg-purple-400/10"
              >
                <Edit className="w-4 h-4 mr-2" />
                {isEditingSport ? 'Anuluj' : 'Edytuj Informacje'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditingSport ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Nazwa Wyświetlana</Label>
                  <Input
                    value={sportForm.name}
                    onChange={(e) => setSportForm(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Ikona (Emoji)</Label>
                  <Input
                    value={sportForm.icon}
                    onChange={(e) => setSportForm(prev => ({ ...prev, icon: e.target.value }))}
                    className="bg-white/5 border-white/20 text-white"
                    placeholder="🪩"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-white">Opis</Label>
                  <Textarea
                    value={sportForm.description}
                    onChange={(e) => setSportForm(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-white/5 border-white/20 text-white"
                    placeholder="Krótki opis kategorii sportowej"
                  />
                </div>
                <div>
                  <Label className="text-white">URL Obrazu</Label>
                  <Input
                    value={sportForm.image_url}
                    onChange={(e) => setSportForm(prev => ({ ...prev, image_url: e.target.value }))}
                    className="bg-white/5 border-white/20 text-white"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={sportForm.is_published}
                    onCheckedChange={(checked) => setSportForm(prev => ({ ...prev, is_published: checked }))}
                  />
                  <Label className="text-white">Opublikowane</Label>
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <Button 
                    onClick={updateSportInfo}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Zapisz Zmiany
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditingSport(false)}
                  >
                    Anuluj
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Opis</p>
                  <p className="text-white">{sportCategory.description || 'Brak opisu'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nazwa Klucza</p>
                  <p className="text-white font-mono">{sportCategory.key_name}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Demo Users Management */}
        <SportDemoUsersManager sportCategory={sportKey} />

        {/* Levels Management */}
        <Card className="glass-effect border-white/10">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5" />
                Poziomy Umiejętności ({levels.length})
              </CardTitle>
              <Button
                onClick={openCreateLevel}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Dodaj Poziom
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {levels.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nie utworzono jeszcze żadnych poziomów dla tego sportu.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {levels.map((level) => (
                  <Card key={level.id} className="bg-white/5 border-white/10">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-400/30">
                              Poziom {level.level_number}
                            </Badge>
                            <h3 className="text-lg font-semibold text-white">
                              {level.level_name}
                            </h3>
                            <Badge 
                              className={`${
                                level.status === 'published' 
                                  ? "bg-green-500/20 text-green-400 border-green-400/30" 
                                  : "bg-orange-500/20 text-orange-400 border-orange-400/30"
                              }`}
                            >
                              {level.status === 'published' ? 'Opublikowane' : 'Wersja Robocza'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                            <div>
                              <span className="text-white">Limit Punktów:</span> {level.point_limit}
                            </div>
                            <div>
                              <span className="text-white">Figurek:</span> {level.figure_count}
                            </div>
                            <div>
                              <span className="text-white">Wyzwanie:</span> {level.challenge_id ? 'Powiązane' : 'Brak'}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditLevel(level)}
                            className="border-blue-400/30 text-blue-400 hover:bg-blue-400/10"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edytuj
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Usunąć poziom "${level.level_name}"?`)) {
                                deleteLevel(level.id);
                              }
                            }}
                            className="border-red-400/30 text-red-400 hover:bg-red-400/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Level Editor Sheet */}
        <LevelEditorSheet
          level={selectedLevel}
          isOpen={isLevelEditorOpen}
          onClose={() => setIsLevelEditorOpen(false)}
          sportKey={sportKey}
          onSave={fetchLevels}
        />
      </div>
    </div>
  );
};

export default SportAdminPanel;
