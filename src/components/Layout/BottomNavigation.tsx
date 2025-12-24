import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Plane, MessageSquare, Trophy, GraduationCap, LayoutDashboard } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserRole } from "@/hooks/useUserRole";
import { cn } from "@/lib/utils";
import { AdminPanelModal } from "./AdminPanelModal";
import { AdminUserImpersonationModal } from "@/components/AdminUserImpersonationModal";
import { TrainerPanelModal } from "@/components/TrainerPanelModal";

const BottomNavigation: React.FC = () => {
  const isMobile = useIsMobile();
  const { isAdmin, isTrainer } = useUserRole();
  const location = useLocation();
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isImpersonateModalOpen, setIsImpersonateModalOpen] = useState(false);
  const [isTrainerPanelOpen, setIsTrainerPanelOpen] = useState(false);

  const navItems = [
    { path: "/aerial-journey", icon: Plane, label: "Podróż" },
    { path: "/feed", icon: MessageSquare, label: "Feed" },
    { path: "/challenges", icon: Trophy, label: "Wyzwania" },
  ];

  // Add Trainer tab for trainers (mobile only, not admin)
  if (isTrainer && isMobile && !isAdmin) {
    navItems.push({ 
      path: "#trainer", 
      icon: GraduationCap, 
      label: "Trener" 
    });
  }

  // Add Admin tab for admins (mobile only)
  if (isAdmin && isMobile) {
    navItems.push({ 
      path: "#admin", 
      icon: LayoutDashboard, 
      label: "Admin" 
    });
  }

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-white/10">
        <div className="flex justify-around items-center h-16 max-w-screen-xl mx-auto px-2">
          {navItems.map((item) => {
            const isAdminTab = item.path === "#admin";
            const isTrainerTab = item.path === "#trainer";
            
            if (isAdminTab) {
              return (
                <button
                  key={item.path}
                  onClick={() => setIsAdminPanelOpen(true)}
                  className="flex flex-col items-center justify-center flex-1 h-full transition-colors relative text-muted-foreground hover:text-white"
                >
                  <item.icon className="w-6 h-6 mb-1" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            }

            if (isTrainerTab) {
              return (
                <button
                  key={item.path}
                  onClick={() => setIsTrainerPanelOpen(true)}
                  className="flex flex-col items-center justify-center flex-1 h-full transition-colors relative text-muted-foreground hover:text-white"
                >
                  <item.icon className="w-6 h-6 mb-1" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            }
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full transition-colors relative",
                  isActive(item.path)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-white"
                )}
              >
                {/* Active indicator */}
                {isActive(item.path) && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-b-full" />
                )}
                
                <item.icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      <AdminPanelModal
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        onImpersonateClick={() => {
          setIsAdminPanelOpen(false);
          setIsImpersonateModalOpen(true);
        }}
      />

      <AdminUserImpersonationModal
        isOpen={isImpersonateModalOpen}
        onClose={() => setIsImpersonateModalOpen(false)}
      />

      <TrainerPanelModal
        isOpen={isTrainerPanelOpen}
        onClose={() => setIsTrainerPanelOpen(false)}
      />
    </>
  );
};

export default BottomNavigation;
