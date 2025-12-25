import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-tr from-black to-purple-950/10 flex items-center justify-center p-6">
      <Card className="glass-effect border-white/10 max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <Search className="w-10 h-10 text-purple-400" />
          </div>

          <h1 className="text-6xl font-bold gradient-text mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-white mb-4">
            Nie znaleziono strony
          </h2>
          <p className="text-muted-foreground mb-8">
            Ups! Strona, której szukasz, nie istnieje. Mogła zostać przeniesiona,
            usunięta lub wpisałeś(aś) nieprawidłowy adres.
          </p>

          <div className="space-y-3">
            <Button asChild variant="primary" className="w-full">
              <Link to="/feed">
                <Home className="w-4 h-4 mr-2" />
                Strona główna
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10"
            >
              <Link to={-1 as any}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Wróć
              </Link>
            </Button>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-muted-foreground text-sm">
              Jeśli uważasz, że to błąd,{" "}
              <Link
                to="/about-us"
                className="text-purple-400 hover:text-purple-300"
              >
                skontaktuj się z nami
              </Link>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
