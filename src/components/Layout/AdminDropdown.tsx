import React from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Trophy, 
  GraduationCap, 
  Globe, 
  Settings, 
  UserCheck 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AdminDropdownProps {
  onImpersonateClick: () => void;
}

export const AdminDropdown: React.FC<AdminDropdownProps> = ({ onImpersonateClick }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <LayoutDashboard className="w-4 h-4" />
          <Badge variant="secondary" className="hidden sm:inline-flex">Admin</Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-lg border-white/10">
        <DropdownMenuLabel>Admin Panel</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        
        <DropdownMenuItem asChild>
          <Link to="/admin" className="cursor-pointer">
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Admin Dashboard
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link to="/admin/achievements" className="cursor-pointer">
            <Trophy className="w-4 h-4 mr-2" />
            Achievements
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link to="/admin/training" className="cursor-pointer">
            <GraduationCap className="w-4 h-4 mr-2" />
            Training Management
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link to="/admin/landing-page" className="cursor-pointer">
            <Globe className="w-4 h-4 mr-2" />
            Landing Page Editor
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link to="/admin/site-settings" className="cursor-pointer">
            <Settings className="w-4 h-4 mr-2" />
            Site Settings
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-white/10" />
        
        <DropdownMenuItem onClick={onImpersonateClick} className="cursor-pointer">
          <UserCheck className="w-4 h-4 mr-2" />
          Impersonate User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
