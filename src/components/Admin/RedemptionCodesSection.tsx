import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Ticket, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RedemptionCode {
  id: string;
  code: string;
  challenge_id: string | null;
  max_uses: number | null;
  current_uses: number | null;
  is_active: boolean | null;
  expires_at: string | null;
  challenge?: {
    title: string;
  };
}

export const RedemptionCodesSection: React.FC = () => {
  const { data: codes, isLoading } = useQuery({
    queryKey: ['admin-redemption-codes-overview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenge_redemption_codes')
        .select(`
          *,
          challenge:challenges (
            title
          )
        `)
        .order('current_uses', { ascending: false })
        .limit(6);

      if (error) throw error;
      return data as RedemptionCode[];
    },
    refetchInterval: 30000
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Ticket className="w-5 h-5" />
            Kody promocyjne
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Ticket className="w-5 h-5" />
            Kody promocyjne
          </CardTitle>
          <Link to="/admin/redemption-codes">
            <Button variant="ghost" size="sm" className="text-xs">
              Zarządzaj
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {codes?.map((code) => {
            const usagePercent = code.max_uses 
              ? Math.round(((code.current_uses || 0) / code.max_uses) * 100)
              : 0;
            const isExpired = code.expires_at && new Date(code.expires_at) < new Date();

            return (
              <div
                key={code.id}
                className="p-3 rounded-lg bg-muted/50 border border-border/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-sm font-bold text-primary">
                      {code.code}
                    </code>
                    {code.is_active && !isExpired ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Aktywny
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">
                        <XCircle className="w-3 h-3 mr-1" />
                        {isExpired ? 'Wygasł' : 'Nieaktywny'}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {code.current_uses || 0}/{code.max_uses || '∞'}
                  </span>
                </div>

                {code.max_uses && (
                  <Progress value={usagePercent} className="h-1.5 mb-2" />
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate">
                    {code.challenge?.title || 'Brak przypisanego wyzwania'}
                  </span>
                  {code.expires_at && (
                    <span className={isExpired ? 'text-red-400' : ''}>
                      {format(new Date(code.expires_at), 'd MMM yyyy', { locale: pl })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {codes?.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              Brak kodów promocyjnych
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
