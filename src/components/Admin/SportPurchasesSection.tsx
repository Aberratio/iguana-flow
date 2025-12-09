import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { ShoppingBag, Gift, Shield, RefreshCw, Loader2 } from "lucide-react";

interface SportPurchase {
  id: string;
  user_id: string;
  sport_category_id: string;
  purchase_type: string;
  payment_amount: number | null;
  currency: string | null;
  redemption_code: string | null;
  purchased_at: string;
  profile?: {
    username: string;
    email: string;
    avatar_url: string | null;
  };
  sport?: {
    name: string;
    key_name: string;
  };
}

const SportPurchasesSection = () => {
  const [purchases, setPurchases] = useState<SportPurchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    payments: 0,
    redemptions: 0,
    adminGrants: 0,
    totalRevenue: 0,
  });

  const fetchPurchases = async () => {
    setIsLoading(true);
    try {
      // Fetch purchases
      const { data: purchasesData, error } = await supabase
        .from("user_sport_purchases")
        .select("*")
        .order("purchased_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch profiles and sports for each purchase
      const enrichedPurchases = await Promise.all(
        (purchasesData || []).map(async (purchase) => {
          const [profileResult, sportResult] = await Promise.all([
            supabase
              .from("profiles")
              .select("username, email, avatar_url")
              .eq("id", purchase.user_id)
              .single(),
            supabase
              .from("sport_categories")
              .select("name, key_name")
              .eq("id", purchase.sport_category_id)
              .single(),
          ]);

          return {
            ...purchase,
            profile: profileResult.data || undefined,
            sport: sportResult.data || undefined,
          };
        })
      );

      setPurchases(enrichedPurchases);

      // Calculate stats
      const payments = enrichedPurchases.filter(p => p.purchase_type === "payment");
      const redemptions = enrichedPurchases.filter(p => p.purchase_type === "redemption");
      const adminGrants = enrichedPurchases.filter(p => p.purchase_type === "admin_grant");
      const totalRevenue = payments.reduce((sum, p) => sum + (p.payment_amount || 0), 0);

      setStats({
        total: enrichedPurchases.length,
        payments: payments.length,
        redemptions: redemptions.length,
        adminGrants: adminGrants.length,
        totalRevenue,
      });
    } catch (error) {
      console.error("Error fetching sport purchases:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const getPurchaseTypeBadge = (type: string) => {
    switch (type) {
      case "payment":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><ShoppingBag className="h-3 w-3 mr-1" />Płatność</Badge>;
      case "redemption":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20"><Gift className="h-3 w-3 mr-1" />Kod</Badge>;
      case "admin_grant":
        return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20"><Shield className="h-3 w-3 mr-1" />Admin</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const formatAmount = (amount: number | null, currency: string | null) => {
    if (!amount) return "-";
    const value = amount / 100;
    return currency === "pln" ? `${value.toFixed(2)} PLN` : `$${value.toFixed(2)}`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Zakupy ścieżek sportowych
          </CardTitle>
          <CardDescription>
            Historia zakupów i kodów promocyjnych
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchPurchases} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent>
        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Łącznie</div>
          </div>
          <div className="bg-green-500/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-500">{stats.payments}</div>
            <div className="text-xs text-muted-foreground">Płatności</div>
          </div>
          <div className="bg-blue-500/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-500">{stats.redemptions}</div>
            <div className="text-xs text-muted-foreground">Kody</div>
          </div>
          <div className="bg-primary/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-primary">
              {(stats.totalRevenue / 100).toFixed(0)} PLN
            </div>
            <div className="text-xs text-muted-foreground">Przychód</div>
          </div>
        </div>

        {/* Purchases table */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Użytkownik</TableHead>
                <TableHead>Sport</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Kwota</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : purchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Brak zakupów
                  </TableCell>
                </TableRow>
              ) : (
                purchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={purchase.profile?.avatar_url || ""} />
                          <AvatarFallback>
                            {purchase.profile?.username?.charAt(0).toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium truncate">
                            {purchase.profile?.username || "Unknown"}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {purchase.profile?.email || ""}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{purchase.sport?.name || "Unknown"}</Badge>
                    </TableCell>
                    <TableCell>{getPurchaseTypeBadge(purchase.purchase_type)}</TableCell>
                    <TableCell>
                      {purchase.purchase_type === "payment" 
                        ? formatAmount(purchase.payment_amount, purchase.currency)
                        : purchase.redemption_code 
                          ? <code className="text-xs">{purchase.redemption_code}</code>
                          : "-"
                      }
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(purchase.purchased_at), { 
                        addSuffix: true, 
                        locale: pl 
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default SportPurchasesSection;
