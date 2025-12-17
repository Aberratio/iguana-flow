import React, { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Plane, MessageSquare, Trophy, GraduationCap, BookOpen } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";
import { cn } from "@/lib/utils";
import ProfileAvatar from "./ProfileAvatar";
import { AdminDropdown } from "./AdminDropdown";
import { TrainerDropdown } from "./TrainerDropdown";
import { AdminUserImpersonationModal } from "@/components/AdminUserImpersonationModal";

const TopHeader: React.FC = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { isAdmin, isTrainer } = useUserRole();
  const location = useLocation();
  const [isImpersonateModalOpen, setIsImpersonateModalOpen] = useState(false);

  const navItems = [
    { path: "/aerial-journey", icon: Plane, label: "Podróż" },
    { path: "/feed", icon: MessageSquare, label: "Feed" },
    { path: "/challenges", icon: Trophy, label: "Wyzwania" },
  ];

  // Add Training for admins/trainers
  if (isAdmin || isTrainer) {
    navItems.push({ path: "/training", icon: GraduationCap, label: "Trening" });
  }

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <NavLink to="/aerial-journey" className="flex items-center space-x-2">
          <img 
            src="/iguana-logo.svg" 
            alt="IguanaFlow" 
            className="h-8 w-8"
          />
          <span className="text-xl font-bold text-white">
            IguanaFlow
          </span>
        </NavLink>

        {/* Desktop Navigation */}
        {!isMobile && (
          <nav className="flex items-center space-x-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors",
                  isActive(item.path)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        )}

        {/* Right side - Biblioteka, Trainer, Admin & Profile */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => navigate('/library')}
            className="border-purple-400/30 text-purple-400 hover:bg-purple-400/10"
          >
            <BookOpen className={cn("w-4 h-4", !isMobile && "mr-2")} />
            {!isMobile && <span>Biblioteka</span>}
          </Button>
          {isTrainer && !isAdmin && (
            <TrainerDropdown />
          )}
          {isAdmin && (
            <AdminDropdown onImpersonateClick={() => setIsImpersonateModalOpen(true)} />
          )}
          <ProfileAvatar />
        </div>
      </div>

      <AdminUserImpersonationModal
        isOpen={isImpersonateModalOpen}
        onClose={() => setIsImpersonateModalOpen(false)}
      />
    </header>
  );
};

export default TopHeader;
