import React from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Trophy, 
  GraduationCap, 
  Globe, 
  Ticket, 
  Settings, 
  UserCheck,
  Users,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImpersonateClick: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({ 
  isOpen, 
  onClose,
  onImpersonateClick 
}) => {
  const handleLinkClick = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5" />
            Panel Administratora
          </DialogTitle>
        </DialogHeader>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="content">
            <AccordionTrigger>📝 Zarządzanie treścią</AccordionTrigger>
            <AccordionContent className="space-y-2">
              <Link to="/admin/landing-page" onClick={handleLinkClick}>
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardHeader className="p-4">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-primary" />
                      <div>
                        <CardTitle className="text-sm">Edytor strony głównej</CardTitle>
                        <CardDescription className="text-xs">Edytuj zawartość strony głównej</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>

              <Link to="/admin/achievements" onClick={handleLinkClick}>
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardHeader className="p-4">
                    <div className="flex items-center gap-3">
                      <Trophy className="w-5 h-5 text-primary" />
                      <div>
                        <CardTitle className="text-sm">Osiągnięcia</CardTitle>
                        <CardDescription className="text-xs">Zarządzaj osiągnięciami użytkowników</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>

              <Link to="/admin/training" onClick={handleLinkClick}>
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardHeader className="p-4">
                    <div className="flex items-center gap-3">
                      <GraduationCap className="w-5 h-5 text-primary" />
                      <div>
                        <CardTitle className="text-sm">Zarządzanie treningami</CardTitle>
                        <CardDescription className="text-xs">Twórz i edytuj treningi</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="users">
            <AccordionTrigger>👥 Zarządzanie użytkownikami</AccordionTrigger>
            <AccordionContent className="space-y-2">
              <Link to="/admin/user-management" onClick={handleLinkClick}>
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardHeader className="p-4">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-primary" />
                      <div>
                        <CardTitle className="text-sm">Role użytkowników</CardTitle>
                        <CardDescription className="text-xs">Zarządzaj uprawnieniami użytkowników</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>

              <Card 
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => {
                  onImpersonateClick();
                  onClose();
                }}
              >
                <CardHeader className="p-4">
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-5 h-5 text-primary" />
                    <div>
                      <CardTitle className="text-sm">Podszywanie się</CardTitle>
                      <CardDescription className="text-xs">Przeglądaj jako inny użytkownik</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="system">
            <AccordionTrigger>⚙️ System</AccordionTrigger>
            <AccordionContent className="space-y-2">
              <Link to="/admin/redemption-codes" onClick={handleLinkClick}>
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardHeader className="p-4">
                    <div className="flex items-center gap-3">
                      <Ticket className="w-5 h-5 text-primary" />
                      <div>
                        <CardTitle className="text-sm">Kody promocyjne</CardTitle>
                        <CardDescription className="text-xs">Zarządzaj kodami promocyjnymi</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>

              <Link to="/admin/site-settings" onClick={handleLinkClick}>
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardHeader className="p-4">
                    <div className="flex items-center gap-3">
                      <Settings className="w-5 h-5 text-primary" />
                      <div>
                        <CardTitle className="text-sm">Ustawienia strony</CardTitle>
                        <CardDescription className="text-xs">Konfiguruj opcje strony</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </DialogContent>
    </Dialog>
  );
};
