import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Gift, Loader2, CheckCircle2, Sparkles } from "lucide-react";

interface SportPathPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  sportCategoryId: string;
  sportName: string;
  pricePln: number | null;
  onSuccess?: () => void;
}

const SportPathPurchaseModal = ({
  isOpen,
  onClose,
  sportCategoryId,
  sportName,
  pricePln,
  onSuccess
}: SportPathPurchaseModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [redemptionCode, setRedemptionCode] = useState("");
  const { toast } = useToast();

  const formatPrice = (cents: number | null) => {
    if (!cents) return "N/A";
    const amount = cents / 100;
    return `${amount.toFixed(2)} zł`;
  };

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("purchase-sport-path", {
        body: { sportCategoryId, currency: "pln" },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
        toast({
          title: "Przekierowanie do płatności",
          description: "Zostaniesz przekierowany do bezpiecznej strony płatności Stripe.",
        });
        onClose();
      }
    } catch (error: any) {
      console.error("Purchase error:", error);
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się rozpocząć płatności",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeRedemption = async () => {
    if (!redemptionCode.trim()) {
      toast({
        title: "Błąd",
        description: "Wprowadź kod promocyjny",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("redeem-sport-code", {
        body: { code: redemptionCode.trim() },
      });

      if (error) throw error;

      toast({
        title: "Sukces!",
        description: data.message || `Odblokowano ścieżkę ${sportName}!`,
      });
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Redemption error:", error);
      toast({
        title: "Błąd",
        description: error.message || "Nieprawidłowy kod",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Wykup ścieżkę: {sportName}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="purchase" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="purchase" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Kup
            </TabsTrigger>
            <TabsTrigger value="code" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Kod
            </TabsTrigger>
          </TabsList>

          <TabsContent value="purchase" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Pełny dostęp do ścieżki</CardTitle>
                <CardDescription>
                  Odblokuj wszystkie poziomy i wyzwania w ścieżce {sportName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Wszystkie poziomy
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Wszystkie wyzwania
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Dożywotni dostęp
                  </Badge>
                </div>

                <div className="flex items-center justify-end">
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(pricePln)}
                  </span>
                </div>

                <Button 
                  onClick={handlePurchase} 
                  disabled={isLoading || !pricePln}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Przetwarzanie...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Kup teraz
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="code" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Masz kod promocyjny?</CardTitle>
                <CardDescription>
                  Wprowadź kod, aby odblokować dostęp do ścieżki
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Wprowadź kod..."
                  value={redemptionCode}
                  onChange={(e) => setRedemptionCode(e.target.value.toUpperCase())}
                  className="text-center font-mono text-lg"
                />

                <Button 
                  onClick={handleCodeRedemption} 
                  disabled={isLoading || !redemptionCode.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Weryfikacja...
                    </>
                  ) : (
                    <>
                      <Gift className="mr-2 h-4 w-4" />
                      Wykorzystaj kod
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SportPathPurchaseModal;
