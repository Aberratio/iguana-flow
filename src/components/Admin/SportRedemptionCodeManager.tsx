import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Ticket, 
  Trash2, 
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Copy,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SportCategory {
  id: string;
  name: string;
  key_name: string;
}

interface RedemptionCode {
  id: string;
  code: string;
  sport_category_id: string | null;
  max_uses: number | null;
  current_uses: number | null;
  is_active: boolean | null;
  expires_at: string | null;
  created_at: string | null;
  sport_category?: SportCategory;
}

export const SportRedemptionCodeManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [codes, setCodes] = useState<RedemptionCode[]>([]);
  const [sports, setSports] = useState<SportCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Form state
  const [newCode, setNewCode] = useState('');
  const [selectedSportId, setSelectedSportId] = useState<string>('');
  const [maxUses, setMaxUses] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(undefined);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch sports
      const { data: sportsData, error: sportsError } = await supabase
        .from('sport_categories')
        .select('id, name, key_name')
        .eq('is_published', true)
        .order('name');

      if (sportsError) throw sportsError;
      setSports(sportsData || []);

      // Fetch codes with sport info
      const { data: codesData, error: codesError } = await supabase
        .from('sport_redemption_codes')
        .select(`
          *,
          sport_category:sport_categories (
            id, name, key_name
          )
        `)
        .order('created_at', { ascending: false });

      if (codesError) throw codesError;
      setCodes(codesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Błąd',
        description: 'Nie udało się pobrać danych.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode(result);
  };

  const handleCreateCode = async () => {
    if (!newCode.trim() || !selectedSportId) {
      toast({
        title: 'Błąd',
        description: 'Podaj kod i wybierz sport.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await supabase
        .from('sport_redemption_codes')
        .insert({
          code: newCode.trim().toUpperCase(),
          sport_category_id: selectedSportId,
          max_uses: maxUses ? parseInt(maxUses) : null,
          expires_at: expiresAt ? expiresAt.toISOString() : null,
          created_by: user?.id,
          is_active: true,
          current_uses: 0,
        });

      if (error) throw error;

      toast({
        title: 'Sukces',
        description: 'Kod został utworzony.',
      });

      setDialogOpen(false);
      setNewCode('');
      setSelectedSportId('');
      setMaxUses('');
      setExpiresAt(undefined);
      fetchData();
    } catch (error: any) {
      console.error('Error creating code:', error);
      toast({
        title: 'Błąd',
        description: error.message?.includes('unique') 
          ? 'Kod już istnieje.' 
          : 'Nie udało się utworzyć kodu.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleActive = async (codeId: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('sport_redemption_codes')
        .update({ is_active: !currentState })
        .eq('id', codeId);

      if (error) throw error;

      setCodes(prev => 
        prev.map(c => c.id === codeId ? { ...c, is_active: !currentState } : c)
      );

      toast({
        title: 'Zaktualizowano',
        description: `Kod ${!currentState ? 'aktywowany' : 'dezaktywowany'}.`,
      });
    } catch (error) {
      console.error('Error toggling code:', error);
      toast({
        title: 'Błąd',
        description: 'Nie udało się zmienić statusu kodu.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCode = async (codeId: string) => {
    try {
      const { error } = await supabase
        .from('sport_redemption_codes')
        .delete()
        .eq('id', codeId);

      if (error) throw error;

      setCodes(prev => prev.filter(c => c.id !== codeId));
      toast({
        title: 'Usunięto',
        description: 'Kod został usunięty.',
      });
    } catch (error) {
      console.error('Error deleting code:', error);
      toast({
        title: 'Błąd',
        description: 'Nie udało się usunąć kodu.',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Skopiowano',
      description: 'Kod skopiowany do schowka.',
    });
  };

  if (isLoading) {
    return (
      <Card className="glass-effect border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            Kody promocyjne sportów
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect border-white/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            Kody promocyjne sportów
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500">
                  <Plus className="w-4 h-4 mr-2" />
                  Dodaj kod
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-background border-white/10">
                <DialogHeader>
                  <DialogTitle>Nowy kod promocyjny</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Kod</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newCode}
                        onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                        placeholder="np. AERIAL50"
                        className="bg-white/5 border-white/10 font-mono"
                      />
                      <Button
                        variant="outline"
                        onClick={generateRandomCode}
                        className="border-white/20"
                      >
                        Generuj
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Sport</Label>
                    <Select value={selectedSportId} onValueChange={setSelectedSportId}>
                      <SelectTrigger className="bg-white/5 border-white/10">
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

                  <div>
                    <Label>Maksymalna liczba użyć (opcjonalnie)</Label>
                    <Input
                      type="number"
                      value={maxUses}
                      onChange={(e) => setMaxUses(e.target.value)}
                      placeholder="np. 100"
                      className="bg-white/5 border-white/10"
                    />
                  </div>

                  <div>
                    <Label>Data wygaśnięcia (opcjonalnie)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-white/5 border-white/10",
                            !expiresAt && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {expiresAt ? format(expiresAt, 'PPP', { locale: pl }) : 'Wybierz datę'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={expiresAt}
                          onSelect={setExpiresAt}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <Button
                    onClick={handleCreateCode}
                    disabled={isCreating || !newCode.trim() || !selectedSportId}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Tworzenie...
                      </>
                    ) : (
                      'Utwórz kod'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {codes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Brak kodów promocyjnych. Kliknij "Dodaj kod" aby utworzyć pierwszy.
          </div>
        ) : (
          <div className="space-y-3">
            {codes.map((code) => {
              const usagePercent = code.max_uses 
                ? Math.round(((code.current_uses || 0) / code.max_uses) * 100)
                : 0;
              const isExpired = code.expires_at && new Date(code.expires_at) < new Date();

              return (
                <div
                  key={code.id}
                  className="p-4 rounded-lg bg-muted/30 border border-border/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <code 
                        className="font-mono text-sm font-bold text-primary cursor-pointer hover:text-primary/80"
                        onClick={() => copyToClipboard(code.code)}
                        title="Kliknij aby skopiować"
                      >
                        {code.code}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(code.code)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      {code.is_active && !isExpired ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Aktywny
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                          <XCircle className="w-3 h-3 mr-1" />
                          {isExpired ? 'Wygasł' : 'Nieaktywny'}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={code.is_active || false}
                        onCheckedChange={() => handleToggleActive(code.id, code.is_active || false)}
                        disabled={isExpired}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => handleDeleteCode(code.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                    <span className="font-medium text-foreground">
                      {code.sport_category?.name || 'Brak sportu'}
                    </span>
                    <span>
                      Użyto: {code.current_uses || 0}/{code.max_uses || '∞'}
                    </span>
                    {code.expires_at && (
                      <span className={isExpired ? 'text-red-400' : ''}>
                        Wygasa: {format(new Date(code.expires_at), 'd MMM yyyy', { locale: pl })}
                      </span>
                    )}
                  </div>

                  {code.max_uses && (
                    <Progress value={usagePercent} className="h-1.5" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
