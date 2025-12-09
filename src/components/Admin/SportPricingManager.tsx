import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Save, Loader2, RefreshCw } from "lucide-react";
import { SportRedemptionCodeManager } from "./SportRedemptionCodeManager";

interface SportCategory {
  id: string;
  name: string;
  key_name: string;
  is_published: boolean;
  price_usd: number | null;
  price_pln: number | null;
  free_levels_count: number | null;
}

interface SportLevel {
  id: string;
  level_number: number;
  level_name: string;
  sport_category: string;
  is_demo: boolean;
}

const SportPricingManager = () => {
  const [sports, setSports] = useState<SportCategory[]>([]);
  const [levels, setLevels] = useState<SportLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editedPrices, setEditedPrices] = useState<Record<string, { usd: string; pln: string; freeLevels: string }>>({});
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [sportsResult, levelsResult] = await Promise.all([
        supabase.from("sport_categories").select("*").order("name"),
        supabase.from("sport_levels").select("*").order("sport_category, level_number"),
      ]);

      if (sportsResult.data) {
        setSports(sportsResult.data);
        // Initialize edited prices
        const prices: Record<string, { usd: string; pln: string; freeLevels: string }> = {};
        sportsResult.data.forEach((sport) => {
          prices[sport.id] = {
            usd: ((sport.price_usd || 0) / 100).toFixed(2),
            pln: ((sport.price_pln || 0) / 100).toFixed(2),
            freeLevels: String(sport.free_levels_count || 0),
          };
        });
        setEditedPrices(prices);
      }
      if (levelsResult.data) {
        setLevels(levelsResult.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePriceChange = (sportId: string, field: "usd" | "pln" | "freeLevels", value: string) => {
    setEditedPrices((prev) => ({
      ...prev,
      [sportId]: {
        ...prev[sportId],
        [field]: value,
      },
    }));
  };

  const handleSavePrice = async (sportId: string) => {
    setSavingId(sportId);
    try {
      const prices = editedPrices[sportId];
      const priceUsd = Math.round(parseFloat(prices.usd) * 100);
      const pricePln = Math.round(parseFloat(prices.pln) * 100);
      const freeLevelsCount = parseInt(prices.freeLevels) || 0;

      const { error } = await supabase
        .from("sport_categories")
        .update({ 
          price_usd: priceUsd, 
          price_pln: pricePln,
          free_levels_count: freeLevelsCount
        })
        .eq("id", sportId);

      if (error) throw error;

      toast({
        title: "Zapisano",
        description: "Ustawienia zostały zaktualizowane",
      });

      // Update local state
      setSports((prev) =>
        prev.map((s) =>
          s.id === sportId ? { ...s, price_usd: priceUsd, price_pln: pricePln, free_levels_count: freeLevelsCount } : s
        )
      );
    } catch (error) {
      console.error("Error saving price:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się zapisać ustawień",
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleDemo = async (levelId: string, isDemo: boolean) => {
    try {
      const { error } = await supabase
        .from("sport_levels")
        .update({ is_demo: isDemo })
        .eq("id", levelId);

      if (error) throw error;

      setLevels((prev) =>
        prev.map((l) => (l.id === levelId ? { ...l, is_demo: isDemo } : l))
      );

      toast({
        title: "Zapisano",
        description: isDemo ? "Poziom oznaczony jako demo" : "Poziom przestał być demo",
      });
    } catch (error) {
      console.error("Error toggling demo:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować poziomu",
        variant: "destructive",
      });
    }
  };

  const getLevelsForSport = (sportKeyName: string) => {
    return levels.filter((l) => l.sport_category === sportKeyName);
  };

  return (
    <div className="space-y-6">
      {/* Pricing Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Ceny ścieżek sportowych
            </CardTitle>
            <CardDescription>Ustaw ceny jednorazowe za pełny dostęp do ścieżki</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sport</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cena USD</TableHead>
                  <TableHead>Cena PLN</TableHead>
                  <TableHead>Darmowe poziomy</TableHead>
                  <TableHead>Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : (
                  sports.map((sport) => (
                    <TableRow key={sport.id}>
                      <TableCell className="font-medium">{sport.name}</TableCell>
                      <TableCell>
                        {sport.is_published ? (
                          <Badge className="bg-green-500/10 text-green-500">Opublikowany</Badge>
                        ) : (
                          <Badge variant="secondary">Szkic</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            value={editedPrices[sport.id]?.usd || ""}
                            onChange={(e) => handlePriceChange(sport.id, "usd", e.target.value)}
                            className="w-24"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            step="0.01"
                            value={editedPrices[sport.id]?.pln || ""}
                            onChange={(e) => handlePriceChange(sport.id, "pln", e.target.value)}
                            className="w-24"
                          />
                          <span className="text-muted-foreground">PLN</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={editedPrices[sport.id]?.freeLevels || "0"}
                            onChange={(e) => handlePriceChange(sport.id, "freeLevels", e.target.value)}
                            className="w-20"
                          />
                          <span className="text-xs text-muted-foreground">poziomów</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleSavePrice(sport.id)}
                          disabled={savingId === sport.id}
                        >
                          {savingId === sport.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Demo Levels Card */}
      <Card>
        <CardHeader>
          <CardTitle>Poziomy demo</CardTitle>
          <CardDescription>
            Poziomy oznaczone jako demo są dostępne dla wszystkich użytkowników, którzy mają dany sport w profilu (bez zakupu)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sports.map((sport) => {
              const sportLevels = getLevelsForSport(sport.key_name);
              if (sportLevels.length === 0) return null;

              return (
                <div key={sport.id} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">{sport.name}</h4>
                  <div className="grid gap-2">
                    {sportLevels.map((level) => (
                      <div
                        key={level.id}
                        className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Poziom {level.level_number}</Badge>
                          <span className="text-sm">{level.level_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Demo:</span>
                          <Switch
                            checked={level.is_demo}
                            onCheckedChange={(checked) => handleToggleDemo(level.id, checked)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Redemption Codes */}
      <SportRedemptionCodeManager />
    </div>
  );
};

export default SportPricingManager;
