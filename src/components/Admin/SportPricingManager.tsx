import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Save, Loader2, RefreshCw } from "lucide-react";
import { SportRedemptionCodeManager } from "./SportRedemptionCodeManager";

interface SportCategory {
  id: string;
  name: string;
  key_name: string;
  is_published: boolean;
  price_pln: number | null;
  free_levels_count: number | null;
}

const SportPricingManager = () => {
  const [sports, setSports] = useState<SportCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editedPrices, setEditedPrices] = useState<Record<string, { pln: string; freeLevels: string }>>({});
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: sportsData } = await supabase
        .from("sport_categories")
        .select("*")
        .order("name");

      if (sportsData) {
        setSports(sportsData);
        // Initialize edited prices
        const prices: Record<string, { pln: string; freeLevels: string }> = {};
        sportsData.forEach((sport) => {
          prices[sport.id] = {
            pln: ((sport.price_pln || 0) / 100).toFixed(2),
            freeLevels: String(sport.free_levels_count || 0),
          };
        });
        setEditedPrices(prices);
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

  const handlePriceChange = (sportId: string, field: "pln" | "freeLevels", value: string) => {
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
      const pricePln = Math.round(parseFloat(prices.pln) * 100);
      const freeLevelsCount = parseInt(prices.freeLevels) || 0;

      const { error } = await supabase
        .from("sport_categories")
        .update({ 
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
          s.id === sportId ? { ...s, price_pln: pricePln, free_levels_count: freeLevelsCount } : s
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
            <CardDescription>Ustaw ceny jednorazowe za pełny dostęp do ścieżki oraz liczbę darmowych poziomów</CardDescription>
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
                  <TableHead>Cena PLN</TableHead>
                  <TableHead>Darmowe poziomy</TableHead>
                  <TableHead>Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
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

      {/* Redemption Codes */}
      <SportRedemptionCodeManager />
    </div>
  );
};

export default SportPricingManager;
