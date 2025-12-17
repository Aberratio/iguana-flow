import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Users, TrendingUp, CheckCircle, Calendar, Clock, Target } from "lucide-react";

interface ChallengeStatisticsProps {
  challengeId: string;
  compact?: boolean;
}

interface Stats {
  totalParticipants: number;
  activeParticipants: number;
  completedParticipants: number;
  averageProgress: number;
  totalDays: number;
  recentJoins: number;
}

const ChallengeStatistics = ({ challengeId, compact = false }: ChallengeStatisticsProps) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, [challengeId]);

  const fetchStatistics = async () => {
    try {
      // Fetch participants
      const { data: participants, error: participantsError } = await supabase
        .from("challenge_participants")
        .select("id, status, completed, joined_at, user_started_at")
        .eq("challenge_id", challengeId);

      if (participantsError) throw participantsError;

      // Fetch total days
      const { data: trainingDays } = await supabase
        .from("challenge_training_days")
        .select("id")
        .eq("challenge_id", challengeId);

      // Fetch progress data
      const { data: progressData } = await supabase
        .from("challenge_day_progress")
        .select("user_id, status")
        .eq("challenge_id", challengeId)
        .eq("status", "completed");

      const totalParticipants = participants?.length || 0;
      const activeParticipants = participants?.filter(p => p.status === "active" && !p.completed).length || 0;
      const completedParticipants = participants?.filter(p => p.completed).length || 0;
      const totalDays = trainingDays?.length || 0;

      // Calculate average progress
      let averageProgress = 0;
      if (totalParticipants > 0 && totalDays > 0) {
        const completedDaysPerUser: Record<string, number> = {};
        progressData?.forEach(p => {
          completedDaysPerUser[p.user_id] = (completedDaysPerUser[p.user_id] || 0) + 1;
        });

        const totalProgress = Object.values(completedDaysPerUser).reduce((sum, days) => 
          sum + (days / totalDays) * 100, 0
        );
        averageProgress = Math.round(totalProgress / totalParticipants);
      }

      // Recent joins (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentJoins = participants?.filter(p => 
        p.joined_at && new Date(p.joined_at) > sevenDaysAgo
      ).length || 0;

      setStats({
        totalParticipants,
        activeParticipants,
        completedParticipants,
        averageProgress,
        totalDays,
        recentJoins,
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return compact ? (
      <div className="flex gap-4">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    ) : (
      <Card className="bg-card/50">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Users className="w-4 h-4" />
          <span className="font-medium text-foreground">{stats.totalParticipants}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <TrendingUp className="w-4 h-4" />
          <span className="font-medium text-foreground">{stats.averageProgress}%</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="font-medium text-foreground">{stats.completedParticipants}</span>
        </div>
        {stats.recentJoins > 0 && (
          <Badge variant="secondary" className="text-xs">
            +{stats.recentJoins} ostatni tydzień
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Statystyki wyzwania
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Users className="w-4 h-4" />
              Wszyscy uczestnicy
            </div>
            <p className="text-2xl font-bold">{stats.totalParticipants}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <TrendingUp className="w-4 h-4" />
              Aktywni
            </div>
            <p className="text-2xl font-bold text-blue-400">{stats.activeParticipants}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <CheckCircle className="w-4 h-4" />
              Ukończyli
            </div>
            <p className="text-2xl font-bold text-green-400">{stats.completedParticipants}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Calendar className="w-4 h-4" />
              Nowi (7 dni)
            </div>
            <p className="text-2xl font-bold text-purple-400">{stats.recentJoins}</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Średni postęp uczestników</span>
            <span className="text-sm font-medium">{stats.averageProgress}%</span>
          </div>
          <Progress value={stats.averageProgress} className="h-2" />
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>Wyzwanie ma {stats.totalDays} dni treningowych</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChallengeStatistics;
