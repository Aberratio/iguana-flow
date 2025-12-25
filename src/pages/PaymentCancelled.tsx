import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft } from "lucide-react";

const PaymentCancelled = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-tr from-black to-purple-950/10 flex items-center justify-center p-6">
      <Card className="max-w-md w-full glass-effect border-white/10 text-center">
        <CardHeader>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <CardTitle className="text-white text-2xl">
            Płatność anulowana
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-muted-foreground">
            <p>
              Płatność została anulowana. Nie zostały pobrane żadne środki z Twojego konta.
            </p>
            <p className="mt-2">
              Możesz spróbować ponownie w dowolnym momencie, aby odblokować funkcje premium.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Wróć
            </Button>

            <Button
              onClick={() => navigate("/pricing")}
              variant="primary"
              className="w-full"
            >
              Zobacz plany cenowe
            </Button>

            <Button
              variant="ghost"
              onClick={() => navigate("/feed")}
              className="w-full text-muted-foreground hover:text-white"
            >
              Przejdź do feed'u
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCancelled;
