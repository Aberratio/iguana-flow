import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Trophy, User, LogOut, Bell, Users, Dumbbell, Settings, Crown, Lock, Globe, LayoutDashboard, Plane, UserCheck, GraduationCap, FolderOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import IguanaLogo from '@/assets/iguana-logo.svg';
import { AdminUserImpersonationModal } from '@/components/AdminUserImpersonationModal';
interface NavigationProps {
  isOpen?: boolean;
  onClose?: () => void;
}
const Navigation: React.FC<NavigationProps> = ({
  isOpen = false,
  onClose
}) => {
  const location = useLocation();
  const {
    user,
    logout
  } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showImpersonationModal, setShowImpersonationModal] = useState(false);
  const isMobile = useIsMobile();

  // Fetch unread notifications count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user) return;
      try {
        // Get unread activities
        const {
          count
        } = await supabase.from('user_activities').select('*', {
          count: 'exact',
          head: true
        }).eq('user_id', user.id).eq('is_read', false);
        setUnreadCount(count || 0);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };
    fetchUnreadCount();

    // Set up real-time subscription for new activities and updates
    const channel = supabase.channel('user_activities_changes').on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'user_activities',
      filter: `user_id=eq.${user?.id}`
    }, () => {
      fetchUnreadCount();
    }).on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'user_activities',
      filter: `user_id=eq.${user?.id}`
    }, () => {
      fetchUnreadCount();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Check if user has premium access or admin override
  const hasPremiumAccess = user?.role && ['premium', 'trainer', 'admin'].includes(user.role);
  const isAdmin = user?.role === 'admin';
  const freeNavItems = [{
    path: '/aerial-journey',
    icon: Plane,
    label: 'Podróż'
  }, {
    path: '/feed',
    icon: Home,
    label: 'Feed'
  }, {
    path: '/challenges',
    icon: Trophy,
    label: 'Wyzwania'
  }];

  // User-related items
  const userNavItems = [{
    path: '/profile',
    icon: User,
    label: 'Profil'
  }, {
    path: '/friends',
    icon: Users,
    label: 'Znajomi'
  }, {
    path: '/inbox',
    icon: Bell,
    label: 'Wiadomości'
  }];
  // Training section for admins/trainers - not behind premium paywall
  const trainingNavItems = (isAdmin || user?.role === 'trainer') ? [{
    path: '/training',
    icon: Dumbbell,
    label: 'Trening'
  }, {
    path: '/training/library',
    icon: BookOpen,
    label: 'Biblioteka treningów'
  }] : [];

  // Separate section for library access
  const resourcesNavItems = [{
    path: '/library',
    icon: BookOpen,
    label: 'Biblioteka'
  }];

  // Trainer-specific items (not admin)
  const trainerItems = user?.role === 'trainer' && !isAdmin ? [{
    path: '/trainer/my-challenges',
    icon: Trophy,
    label: 'Moje wyzwania'
  }, {
    path: '/trainer/my-trainings',
    icon: Dumbbell,
    label: 'Moje treningi'
  }, {
    path: '/trainer/my-exercises',
    icon: FolderOpen,
    label: 'Moje ćwiczenia'
  }] : [];

  // Admin-only items
  const adminItems = user?.role === 'admin' ? [{
    path: '/admin/achievements',
    icon: Settings,
    label: 'Osiągnięcia'
  }, {
    path: '/admin/training',
    icon: BookOpen,
    label: 'Treningi'
  }, {
    path: '/admin/landing-page',
    icon: Globe,
    label: 'Strona główna'
  }] : [];

  const adminActions = user?.role === 'admin' ? [{
    icon: UserCheck,
    label: 'Wciel się w użytkownika',
    onClick: () => setShowImpersonationModal(true)
  }] : [];
  const isActive = (path: string) => location.pathname === path;
  return <nav className={`fixed left-0 top-0 h-full transition-all duration-300 glass-effect border-r border-white/10 z-50 ${isMobile ? `w-64 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}` : 'w-20 lg:w-64'}`}>
      <div className="flex flex-col h-full p-4 overflow-y-auto">
        {/* Logo */}
        <Link to="/aerial-journey" onClick={isMobile ? onClose : undefined} className={`flex items-center space-x-3 group ${isMobile ? 'mb-4 mt-16' : 'mb-8 mt-4'}`}>
          <img src={IguanaLogo} alt="IguanaFlow Logo" className="w-8 h-8" />
          <span className={`font-bold text-xl ${isMobile ? 'block' : 'hidden lg:block'} group-hover:scale-105 transition-transform`}>
            <span className="text-white">Iguana</span><span className="bg-gradient-to-r from-purple-500 via-violet-500 to-purple-700 bg-clip-text text-transparent">Flow</span>
          </span>
        </Link>

        {/* Free Navigation Items */}
        <div className="flex-1 space-y-2">
          {freeNavItems.map(item => {
          const Icon = item.icon;
          return <Link key={item.path} to={item.path} onClick={isMobile ? onClose : undefined} className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all group relative ${isActive(item.path) ? 'bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 text-white' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}>
                <Icon className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span className={`font-medium ${isMobile ? 'block' : 'hidden lg:block'}`}>{item.label}</span>
              </Link>;
        })}

          {/* User Section */}
          <div className={`border-t border-white/10 ${isMobile ? 'my-2' : 'my-4'} ${isMobile ? 'block' : 'hidden lg:block'}`}></div>
          <div className={`text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2 ${isMobile ? 'block' : 'hidden lg:block'}`}>
            Użytkownik
          </div>
          
          {userNavItems.map(item => {
          const Icon = item.icon;
          const showUnreadBadge = item.path === '/inbox' && unreadCount > 0;
          return <Link key={item.path} to={item.path} onClick={isMobile ? onClose : undefined} className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all group relative ${isActive(item.path) ? 'bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 text-white' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}>
                <Icon className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span className={`font-medium ${isMobile ? 'block' : 'hidden lg:block'}`}>{item.label}</span>
                {showUnreadBadge}
              </Link>;
        })}

          {/* Resources Section */}
          <div className={`border-t border-white/10 ${isMobile ? 'my-2' : 'my-4'} ${isMobile ? 'block' : 'hidden lg:block'}`}></div>
          <div className={`text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2 ${isMobile ? 'block' : 'hidden lg:block'}`}>
            Zasoby
          </div>
          
          {resourcesNavItems.map(item => {
          const Icon = item.icon;
          return <Link key={item.path} to={item.path} onClick={isMobile ? onClose : undefined} className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all group relative ${isActive(item.path) ? 'bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 text-white' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}>
                <Icon className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span className={`font-medium ${isMobile ? 'block' : 'hidden lg:block'}`}>{item.label}</span>
              </Link>;
         })}

          {/* Training Section for Admins/Trainers */}
          {trainingNavItems.length > 0 && (
            <>
              <div className={`border-t border-white/10 ${isMobile ? 'my-2' : 'my-4'} ${isMobile ? 'block' : 'hidden lg:block'}`}></div>
              {trainingNavItems.map(item => {
                const Icon = item.icon;
                return <Link key={item.path} to={item.path} onClick={isMobile ? onClose : undefined} className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all group relative ${isActive(item.path) ? 'bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 text-white' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}>
                      <Icon className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                      <span className={`font-medium ${isMobile ? 'block' : 'hidden lg:block'}`}>{item.label}</span>
                    </Link>;
              })}
            </>
          )}

          {/* Trainer Section */}
          {trainerItems.length > 0 && <>
              <div className={`border-t border-white/10 ${isMobile ? 'my-2' : 'my-4'} ${isMobile ? 'block' : 'hidden lg:block'}`}></div>
              <div className={`text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2 ${isMobile ? 'block' : 'hidden lg:block'}`}>
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3 h-3" />
                  Panel Trenera
                </span>
              </div>
              {trainerItems.map(item => {
            const Icon = item.icon;
            return <Link key={item.path} to={item.path} onClick={isMobile ? onClose : undefined} className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all group ${isActive(item.path) ? 'bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 text-white' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}>
                    <Icon className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className={`font-medium ${isMobile ? 'block' : 'hidden lg:block'}`}>{item.label}</span>
                  </Link>;
          })}
            </>}

          {/* Admin Section */}
          {adminItems.length > 0 && <>
              <div className={`border-t border-white/10 ${isMobile ? 'my-2' : 'my-4'} ${isMobile ? 'block' : 'hidden lg:block'}`}></div>
              <div className={`text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2 ${isMobile ? 'block' : 'hidden lg:block'}`}>
                Administrator
              </div>
              {adminItems.map(item => {
            const Icon = item.icon;
            return <Link key={item.path} to={item.path} onClick={isMobile ? onClose : undefined} className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all group ${isActive(item.path) ? 'bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 text-white' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}>
                    <Icon className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className={`font-medium ${isMobile ? 'block' : 'hidden lg:block'}`}>{item.label}</span>
                  </Link>;
          })}
              
              {adminActions.map((action, index) => {
            const Icon = action.icon;
            return <button key={index} onClick={() => {
                    action.onClick();
                    if (isMobile && onClose) onClose();
                  }} className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all group text-muted-foreground hover:text-white hover:bg-white/5">
                    <Icon className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className={`font-medium ${isMobile ? 'block' : 'hidden lg:block'}`}>{action.label}</span>
                  </button>;
          })}
            </>}
        </div>

        {/* User Profile */}
        <div className={`border-t border-white/10 ${isMobile ? 'pt-2' : 'pt-4'}`}>
          <div className="space-y-2">
            <Link to="/profile" onClick={isMobile ? onClose : undefined} className="flex items-center space-x-3 px-3 py-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500">
                  {user?.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className={`flex-1 ${isMobile ? 'block' : 'hidden lg:block'}`}>
                <p className="text-white font-medium text-sm">{user?.username}</p>
              </div>
            </Link>
          </div>
          <Button onClick={() => {
          logout();
          if (isMobile && onClose) onClose();
        }} variant="ghost" size="sm" className="w-full mt-2 text-muted-foreground hover:text-white hover:bg-white/10 justify-start">
            <LogOut className="w-4 h-4 mr-3" />
            <span className={isMobile ? 'block' : 'hidden lg:block'}>Wyloguj</span>
          </Button>
          
          {/* Footer Links */}
          <div className={`space-y-2 border-t border-white/10 ${isMobile ? 'mt-2 pt-2' : 'mt-4 pt-4'}`}>
            <Link to="/privacy-policy" className="flex items-center justify-center text-xs text-muted-foreground hover:text-white transition-colors">
              Polityka prywatności
            </Link>
            <Link to="/terms-of-use" className="flex items-center justify-center text-xs text-muted-foreground hover:text-white transition-colors">
              Regulamin
            </Link>
            <Link to="/about-us" className="flex items-center justify-center text-xs text-muted-foreground hover:text-white transition-colors">
              O nas
            </Link>
          </div>
        </div>
      </div>

      <AdminUserImpersonationModal
        isOpen={showImpersonationModal}
        onClose={() => setShowImpersonationModal(false)}
      />
    </nav>;
};
export default Navigation;