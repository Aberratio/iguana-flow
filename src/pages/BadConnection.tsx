import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const BadConnection = () => {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="border-border max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/20 flex items-center justify-center">
            <WifiOff className="w-10 h-10 text-destructive animate-pulse" />
          </div>

          <h1 className="text-2xl font-semibold text-foreground mb-4">
            Problem z połączeniem
          </h1>
          <p className="text-muted-foreground mb-8">
            Mamy problem z połączeniem do naszych serwerów. Sprawdź swoje
            połączenie z internetem i spróbuj ponownie.
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-center space-x-2 text-muted-foreground text-sm">
              <Wifi className="w-4 h-4" />
              <span>Sprawdzanie połączenia...</span>
            </div>

            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full animate-pulse"
                style={{ width: "60%" }}
              ></div>
            </div>
          </div>

          <Button onClick={handleRetry} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Spróbuj ponownie
          </Button>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-muted-foreground text-sm">
              Jeśli problem będzie się powtarzał, sprawdź swoje połączenie
              z internetem lub spróbuj ponownie później.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BadConnection;
