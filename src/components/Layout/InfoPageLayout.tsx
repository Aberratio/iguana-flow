import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import IguanaLogo from "@/assets/iguana-logo.svg";
import AuthModal from "@/components/Auth/AuthModal";
import TopHeader from "./TopHeader";
import { useAuth } from "@/contexts/AuthContext";

interface InfoPageLayoutProps {
  children: React.ReactNode;
}

const InfoPageLayout: React.FC<InfoPageLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const handleAuthClick = (mode: "login" | "register") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background - same as landing */}
      <div className="fixed inset-0 -z-10 parallax-bg">
        <div className="hero-particle" style={{ width: '100px', height: '100px', top: '15%', left: '10%' }}></div>
        <div className="hero-particle-tropical" style={{ width: '120px', height: '120px', top: '65%', right: '15%' }}></div>
      </div>

      {/* Conditional Header - TopHeader for logged in users, login buttons for guests */}
      {user ? (
        <TopHeader />
      ) : (
        <header className="fixed top-0 w-full z-50 glass-effect border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity">
              <img
                src={IguanaLogo}
                alt="IguanaFlow Logo"
                className="w-6 h-6 sm:w-8 sm:h-8"
              />
              <span className="text-lg sm:text-xl font-bold gradient-text">
                IguanaFlow
              </span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAuthClick("login")}
                className="text-xs sm:text-sm"
              >
                Zaloguj się
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleAuthClick("register")}
                className="text-xs sm:text-sm"
              >
                Rozpocznij
              </Button>
            </div>
          </div>
        </header>
      )}

      {!user && (
        <AuthModal
          open={showAuthModal}
          onOpenChange={setShowAuthModal}
          mode={authMode}
          onModeChange={setAuthMode}
        />
      )}

      {/* Back Button - different link for logged in vs guests */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-4">
        <Link to={user ? "/aerial-journey" : "/"}>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            {user ? "Powrót do aplikacji" : "Powrót na stronę główną"}
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pb-12">
        {children}
      </main>

      {/* Footer - identical to landing page */}
      <footer className="border-t border-white/10 bg-background/50 backdrop-blur-lg relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img
                  src={IguanaLogo}
                  alt="IguanaFlow Logo"
                  className="w-6 h-6"
                />
                <span className="text-lg font-bold gradient-text">
                  IguanaFlow
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Zmień swoje umiejętności powietrzne dzięki kompleksowej platformie treningowej.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Firma</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/about-us" className="hover:text-foreground transition-colors">
                    O nas
                  </Link>
                </li>
                <li>
                  <Link to="/privacy-policy" className="hover:text-foreground transition-colors">
                    Polityka prywatności
                  </Link>
                </li>
                <li>
                  <Link to="/terms-of-use" className="hover:text-foreground transition-colors">
                    Regulamin
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Szybkie linki</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/library" className="hover:text-foreground transition-colors">
                    Biblioteka figur
                  </Link>
                </li>
                <li>
                  <Link to="/challenges" className="hover:text-foreground transition-colors">
                    Wyzwania
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="hover:text-foreground transition-colors">
                    Cennik
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Śledź nas</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a 
                    href="https://instagram.com/iguana.flow" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors flex items-center gap-2 group"
                  >
                    <Instagram className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    @iguana.flow
                  </a>
                </li>
              </ul>
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Kontakt</h3>
                <a 
                  href="mailto:contact@iguanaflow.com"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  contact@iguanaflow.com
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} IguanaFlow. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default InfoPageLayout;
