import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserCog, Search, Save } from 'lucide-react';
import { toast } from 'sonner';

interface UserWithRole {
  id: string;
  username: string;
  email: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string | null;
}

const ROLES = ['free', 'premium', 'trainer', 'admin'] as const;

export const UserRoleManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingChanges, setPendingChanges] = useState<Record<string, string>>({});
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);

    try {
      let query = supabase
        .from('profiles')
        .select('id, username, email, avatar_url, role, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (searchTerm) {
        query = query.or(`username.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setUsers(data as UserWithRole[] || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchUsers();
    
    // Refetch every 30 seconds (similar to refetchInterval)
    const interval = setInterval(() => {
      fetchUsers();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchUsers]);

  const updateRole = useCallback(async (userId: string, newRole: string) => {
    setIsSubmitting(true);

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: newRole as 'free' | 'premium' | 'trainer' | 'admin' })
        .eq('id', userId);
      
      if (profileError) throw profileError;

      toast.success(`Rola użytkownika zmieniona na ${newRole}`);
      setPendingChanges(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      
      // Refetch users after successful update
      await fetchUsers();
    } catch (error) {
      toast.error('Nie udało się zmienić roli');
      console.error('Role update error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [fetchUsers]);

  const handleRoleChange = (userId: string, newRole: string) => {
    setPendingChanges(prev => ({ ...prev, [userId]: newRole }));
  };

  const saveRoleChange = (userId: string) => {
    const newRole = pendingChanges[userId];
    if (newRole) {
      updateRole(userId, newRole);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'trainer': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'premium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserCog className="w-5 h-5" />
            Zarządzanie rolami
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserCog className="w-5 h-5" />
          Zarządzanie rolami
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Szukaj użytkownika..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Users List */}
        <ScrollArea className="h-[350px]">
          <div className="space-y-2">
            {users.map((user) => {
              const hasPendingChange = pendingChanges[user.id] !== undefined;
              const displayRole = pendingChanges[user.id] || user.role;

              return (
                <div
                  key={user.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    hasPendingChange 
                      ? 'bg-yellow-500/10 border border-yellow-500/30' 
                      : 'bg-muted/50 hover:bg-muted/80'
                  }`}
                >
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={user.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {user.username?.slice(0, 2).toUpperCase() || '??'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{user.username}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </div>
                  </div>

                  <Select
                    value={displayRole}
                    onValueChange={(value) => handleRoleChange(user.id, value)}
                  >
                    <SelectTrigger className="w-28 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getRoleBadgeColor(role)}`}
                          >
                            {role}
                          </Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {hasPendingChange && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-yellow-400 hover:text-yellow-300"
                      onClick={() => saveRoleChange(user.id)}
                      disabled={isSubmitting}
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              );
            })}

            {users.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nie znaleziono użytkowników
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
