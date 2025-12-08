import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  LayoutDashboard, 
  Users, 
  Trophy, 
  MessageSquare,
  Image,
  GraduationCap,
  Globe,
  Ticket,
  Settings,
  UserCheck,
  TrendingUp,
  Heart,
  ShoppingCart,
  Activity,
  Target,
  Zap,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RecentLoginsSection } from '@/components/Admin/RecentLoginsSection';
import { OrdersSection } from '@/components/Admin/OrdersSection';
import { SystemHealthSection } from '@/components/Admin/SystemHealthSection';
import { TopUsersSection } from '@/components/Admin/TopUsersSection';
import { RedemptionCodesSection } from '@/components/Admin/RedemptionCodesSection';
import { UserRoleManager } from '@/components/Admin/UserRoleManager';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayIso = today.toISOString();
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [
        { count: usersCount },
        { count: challengesCount },
        { count: postsCount },
        { count: galleryCount },
        { count: trainingsCount },
        // User Engagement
        { count: activeUsers },
        { count: newUsers },
        { count: newUsersToday },
        { count: activeToday },
        { data: loginData },
        // Challenge Participation
        { count: activeParticipants },
        { count: completedChallenges },
        { data: popularChallenge },
        // Social Engagement
        { count: friendshipsCount },
        { count: postsThisWeek },
        // Revenue & Purchases
        { count: ordersCount },
        { count: pendingOrders },
        { data: revenueData },
        { count: redemptionsCount },
        // Aerial Journey
        { count: figureCompletions },
        // Library
        { count: trainingLibraryCount }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('challenges').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('gallery_media').select('*', { count: 'exact', head: true }),
        supabase.from('training_courses').select('*', { count: 'exact', head: true }),
        // User Engagement
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('last_login_at', sevenDaysAgo),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', todayIso),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('last_login_at', todayIso),
        supabase.from('profiles').select('login_count'),
        // Challenge Participation
        supabase.from('challenge_participants').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('challenge_participants').select('*', { count: 'exact', head: true }).eq('completed', true),
        supabase.from('challenge_participants').select('challenge_id, challenges(title)').limit(1),
        // Social Engagement
        supabase.from('friendships').select('*', { count: 'exact', head: true }).eq('status', 'accepted'),
        supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
        // Revenue & Purchases
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('amount').eq('status', 'completed'),
        supabase.from('challenge_redemption_codes').select('current_uses'),
        // Aerial Journey
        supabase.from('figure_progress').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        // Library
        supabase.from('training_library').select('*', { count: 'exact', head: true })
      ]);

      const totalLogins = loginData?.reduce((sum, user) => sum + (user.login_count || 0), 0) || 0;
      const avgLogins = usersCount ? (totalLogins / usersCount).toFixed(1) : '0';
      const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0;
      const totalRedemptions = redemptionsCount || 0;
      const retentionRate = usersCount && activeUsers 
        ? Math.round((activeUsers / usersCount) * 100) 
        : 0;

      return {
        users: usersCount || 0,
        challenges: challengesCount || 0,
        posts: postsCount || 0,
        gallery: galleryCount || 0,
        trainings: trainingsCount || 0,
        trainingLibrary: trainingLibraryCount || 0,
        // User Engagement
        activeUsers: activeUsers || 0,
        newUsers: newUsers || 0,
        newUsersToday: newUsersToday || 0,
        activeToday: activeToday || 0,
        totalLogins,
        avgLogins,
        retentionRate,
        // Challenge Participation
        activeParticipants: activeParticipants || 0,
        completedChallenges: completedChallenges || 0,
        popularChallenge: popularChallenge?.[0]?.challenges?.title || 'N/A',
        // Social Engagement
        friendships: friendshipsCount || 0,
        postsThisWeek: postsThisWeek || 0,
        // Revenue & Purchases
        orders: ordersCount || 0,
        pendingOrders: pendingOrders || 0,
        revenue: totalRevenue / 100,
        redemptions: totalRedemptions,
        // Aerial Journey
        figureCompletions: figureCompletions || 0
      };
    },
    refetchInterval: 30000
  });

  const quickActions = [
    {
      title: 'User Management',
      description: 'View & manage all users',
      icon: UserCheck,
      href: '/admin/user-management',
      color: 'text-cyan-500'
    },
    {
      title: 'Achievements',
      description: 'Manage user achievements',
      icon: Trophy,
      href: '/admin/achievements',
      color: 'text-yellow-500'
    },
    {
      title: 'Training',
      description: 'Create & edit training sessions',
      icon: GraduationCap,
      href: '/admin/training',
      color: 'text-blue-500'
    },
    {
      title: 'Landing Page',
      description: 'Edit homepage content',
      icon: Globe,
      href: '/admin/landing-page',
      color: 'text-green-500'
    },
    {
      title: 'Redemption Codes',
      description: 'Manage promo codes',
      icon: Ticket,
      href: '/admin/redemption-codes',
      color: 'text-purple-500'
    },
    {
      title: 'Site Settings',
      description: 'Configure site options',
      icon: Settings,
      href: '/admin/site-settings',
      color: 'text-gray-500'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <LayoutDashboard className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            Panel kontrolny - statystyki, użytkownicy, zamówienia
          </p>
        </div>

        {/* Today's Stats */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Dzisiaj
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {isLoading ? (
              [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20" />)
            ) : (
              <>
                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground mb-1">Nowi użytkownicy</div>
                    <div className="text-2xl sm:text-3xl font-bold">{stats?.newUsersToday}</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground mb-1">Aktywni dzisiaj</div>
                    <div className="text-2xl sm:text-3xl font-bold">{stats?.activeToday}</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/20">
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground mb-1">Pending Orders</div>
                    <div className="text-2xl sm:text-3xl font-bold">{stats?.pendingOrders}</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground mb-1">Retencja (7d)</div>
                    <div className="text-2xl sm:text-3xl font-bold">{stats?.retentionRate}%</div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

        {/* Basic Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
          {isLoading ? (
            [1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-24" />)
          ) : (
            <>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Users className="w-3 h-3" />
                    Użytkownicy
                  </div>
                  <div className="text-2xl font-bold">{stats?.users}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Trophy className="w-3 h-3" />
                    Wyzwania
                  </div>
                  <div className="text-2xl font-bold">{stats?.challenges}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <MessageSquare className="w-3 h-3" />
                    Posty
                  </div>
                  <div className="text-2xl font-bold">{stats?.posts}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Image className="w-3 h-3" />
                    Galeria
                  </div>
                  <div className="text-2xl font-bold">{stats?.gallery}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <GraduationCap className="w-3 h-3" />
                    Kursy
                  </div>
                  <div className="text-2xl font-bold">{stats?.trainings}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Target className="w-3 h-3" />
                    Biblioteka
                  </div>
                  <div className="text-2xl font-bold">{stats?.trainingLibrary}</div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Left Column */}
          <div className="space-y-6">
            <RecentLoginsSection />
            <TopUsersSection />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <OrdersSection />
            <SystemHealthSection />
          </div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <UserRoleManager />
          <RedemptionCodesSection />
        </div>

        {/* User Activity Stats */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Statystyki aktywności
          </h2>
          
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <TrendingUp className="w-3 h-3" />
                    Aktywni (7d)
                  </div>
                  <div className="text-2xl font-bold">{stats?.activeUsers}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Users className="w-3 h-3" />
                    Nowi (30d)
                  </div>
                  <div className="text-2xl font-bold">{stats?.newUsers}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Zap className="w-3 h-3" />
                    Wszystkie logowania
                  </div>
                  <div className="text-2xl font-bold">{stats?.totalLogins}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Activity className="w-3 h-3" />
                    Śr. logowań/user
                  </div>
                  <div className="text-2xl font-bold">{stats?.avgLogins}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Trophy className="w-3 h-3" />
                    Aktywni w wyzwaniach
                  </div>
                  <div className="text-2xl font-bold">{stats?.activeParticipants}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Target className="w-3 h-3" />
                    Ukończone wyzwania
                  </div>
                  <div className="text-2xl font-bold">{stats?.completedChallenges}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Heart className="w-3 h-3" />
                    Znajomości
                  </div>
                  <div className="text-2xl font-bold">{stats?.friendships}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <MessageSquare className="w-3 h-3" />
                    Posty (7d)
                  </div>
                  <div className="text-2xl font-bold">{stats?.postsThisWeek}</div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Revenue Stats */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Przychody i zakupy
          </h2>
          
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <ShoppingCart className="w-3 h-3" />
                    Completed Orders
                  </div>
                  <div className="text-2xl font-bold">{stats?.orders}</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border-emerald-500/20">
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground mb-1">Przychód</div>
                  <div className="text-2xl font-bold">${stats?.revenue.toFixed(0)}</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Ticket className="w-3 h-3" />
                    Kody użyte
                  </div>
                  <div className="text-2xl font-bold">{stats?.redemptions}</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Target className="w-3 h-3" />
                    Figury ukończone
                  </div>
                  <div className="text-2xl font-bold">{stats?.figureCompletions}</div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-bold mb-4">Szybkie akcje</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {quickActions.map((action) => (
              <Link key={action.href} to={action.href}>
                <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="p-4 text-center">
                    <action.icon className={`w-6 h-6 mx-auto mb-2 ${action.color}`} />
                    <h3 className="font-medium text-sm">{action.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                      {action.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
