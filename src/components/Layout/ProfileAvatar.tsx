import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { SettingsModal } from "@/components/SettingsModal";
import { User, Settings, LogOut } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const ProfileAvatar: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none">
            <Avatar className="w-8 h-8 border-2 border-primary/50 cursor-pointer">
              <AvatarImage src={user.avatar_url} alt={user.username} />
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                {getInitials(user.username)}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-background/95 backdrop-blur-sm border-white/10">
          <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
            <User className="w-4 h-4 mr-2" />
            Profil
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsSettingsOpen(true)} className="cursor-pointer">
            <Settings className="w-4 h-4 mr-2" />
            Ustawienia
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem 
            onClick={() => setShowLogoutDialog(true)} 
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Wyloguj
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="w-[95vw] max-w-sm glass-effect border-white/10">
          <DialogHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-2">
              <LogOut className="w-6 h-6 text-muted-foreground" />
            </div>
            <DialogTitle className="text-center">
              Wylogowanie
            </DialogTitle>
            <DialogDescription className="text-center">
              Czy na pewno chcesz się wylogować z aplikacji?
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
              className="flex-1"
            >
              Anuluj
            </Button>
            <Button
              onClick={handleLogout}
              className="flex-1"
            >
              Wyloguj
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfileAvatar;
