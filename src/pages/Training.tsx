import React, { useState, useEffect } from "react";
import {
  Plus,
  Play,
  Clock,
  Users,
  Music,
  Target,
  Zap,
  Heart,
  Edit,
  Trash2,
  BookOpen,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { TrainingDetailsModal } from "@/components/TrainingDetailsModal";
import { TrainingSessionPage } from "@/components/TrainingSessionPage";
import { CreateTrainingModal } from "@/components/CreateTrainingModal";

import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
const Training = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isAdmin, isTrainer, isLoading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [showTrainingSession, setShowTrainingSession] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch sessions from database
  const fetchSessions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('training_sessions')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Trainers see only their own sessions, admins see all
      if (!isAdmin && user?.id) {
        query = query.eq('user_id', user.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się załadować sesji treningowych.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ((isAdmin || isTrainer) && !roleLoading) {
      fetchSessions();
    }
  }, [isAdmin, isTrainer, roleLoading]);
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-500";
      case "Intermediate":
        return "bg-yellow-500";
      case "Advanced":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };
  const handleSessionClick = (session: any) => {
    // Navigate to the training session detail page
    navigate(`/training/${session.id}`);
  };
  const handleStartTraining = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      setSelectedSession(session);
      setShowSessionDetails(false);
      setShowTrainingSession(true);
    }
  };

  const handleCreateSession = () => {
    fetchSessions();
    setEditingSession(null);
  };

  const handleEditSession = (session: any) => {
    navigate(`/training/${session.id}/edit`);
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('training_sessions')
        .delete()
        .eq('id', sessionId);
      
      if (error) throw error;
      
      await fetchSessions();
      toast({
        title: "Sesja usunięta",
        description: "Sesja treningowa została usunięta.",
      });
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć sesji.",
        variant: "destructive",
      });
    }
  };
  if (showTrainingSession && selectedSession) {
    return (
      <TrainingSessionPage
        session={selectedSession}
        onClose={() => {
          setShowTrainingSession(false);
          setSelectedSession(null);
        }}
      />
    );
  }
  // Show access denied message for users without trainer/admin role
  if (!roleLoading && !isAdmin && !isTrainer) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center">
          <div className="glass-effect p-8 rounded-xl border border-white/10">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-primary-foreground rounded-full flex items-center justify-center">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Tylko dla trenerów
              </h1>
              <p className="text-muted-foreground text-lg mb-6">
                Sesje treningowe są dostępne tylko dla trenerów i administratorów.
              </p>
              <div className="space-y-3 text-left">
                <div className="flex items-center text-muted-foreground">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  <span>Twórz i zarządzaj sesjami treningowymi</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  <span>Interaktywne prowadzenie treningów</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  <span>Śledzenie postępów i analityka</span>
                </div>
              </div>
            </div>
            <Button
              onClick={() => navigate("/")}
              variant="primary"
              className="mr-4"
            >
              Strona główna
            </Button>
            <Button
              onClick={() => navigate("/aerial-journey")}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              Wróć do podróży
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Sesje Treningowe"
        description="Personalizowane sesje treningowe aerial dopasowane do Twojego poziomu. Twórz własne treningi i śledź postępy."
        image="https://iguanaflow.app/og-training.jpg"
        url="https://iguanaflow.app/training"
        noIndex={true}
      />
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Sesje treningowe
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Dołącz lub stwórz sesję treningową
              </p>
            </div>
            {user?.role === "trainer" || user?.role === "admin" ? (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => navigate('/training/timer')}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Stoper treningowy
                </Button>
                <Button
                  onClick={() => setShowCreateSession(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Utwórz sesję
                </Button>
                {isAdmin && (
                  <>
                    <Button
                      onClick={() => navigate('/exercise/new?type=warm_up')}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Utwórz ćwiczenie
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate('/training/library')}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Biblioteka treningowa
                    </Button>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Training Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="glass-effect border-white/10">
            <CardContent className="p-3 sm:p-6 text-center">
              <Target className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-primary" />
              <h3 className="text-lg sm:text-2xl font-bold text-white">
                {sessions.length}
              </h3>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Dostępne sesje
              </p>
            </CardContent>
          </Card>
          <Card className="glass-effect border-white/10">
            <CardContent className="p-3 sm:p-6 text-center">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-green-500" />
              <h3 className="text-lg sm:text-2xl font-bold text-white">{sessions.filter(s => s.published).length}</h3>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Opublikowane
              </p>
            </CardContent>
          </Card>
          <Card className="glass-effect border-white/10">
            <CardContent className="p-3 sm:p-6 text-center">
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-blue-500" />
              <h3 className="text-lg sm:text-2xl font-bold text-white">45</h3>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Śr. czas trwania (min)
              </p>
            </CardContent>
          </Card>
          <Card className="glass-effect border-white/10">
            <CardContent className="p-3 sm:p-6 text-center">
              <Heart className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-pink-500" />
              <h3 className="text-lg sm:text-2xl font-bold text-white">12</h3>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Ukończone
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {sessions.map((session) => (
            <Card
              key={session.id}
              className="glass-effect border-white/10 hover:border-white/20 transition-all group"
            >
              <div className="relative">
                <img
                  src={session.thumbnail_url || "https://images.unsplash.com/photo-1518594023387-5565c8f3d1ce?w=400&h=300&fit=crop"}
                  alt={session.title}
                  className="w-full h-32 sm:h-48 object-cover rounded-t-lg cursor-pointer"
                  onClick={() => handleSessionClick(session)}
                />
                <Badge
                  className={`absolute top-2 right-2 ${getDifficultyColor(
                    session.difficulty_level || "Beginner"
                  )} text-white text-xs`}
                >
                  {session.difficulty_level || "Beginner"}
                </Badge>
                
                {!session.published && (
                  <Badge className="absolute top-2 left-16 bg-orange-500/20 text-orange-400 text-xs">
                    Wersja robocza
                  </Badge>
                )}

                {/* Trainer Actions */}
                {(user?.role === "trainer" || user?.role === "admin") && (
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1 sm:space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditSession(session)}
                      className="bg-black/50 border-white/20 text-white hover:bg-white/10 w-8 h-8 p-0"
                    >
                      <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteSession(session.id)}
                      className="bg-black/50 border-red-500/50 text-red-400 hover:bg-red-500/10 w-8 h-8 p-0"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                )}
              </div>
              <CardContent className="p-4 sm:p-6">
                <h3
                  className="text-lg sm:text-xl font-bold text-white mb-2 cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSessionClick(session)}
                >
                  {session.title}
                </h3>
                <p className="text-muted-foreground mb-3 sm:mb-4 text-sm">
                  {session.description}
                </p>

                <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                  <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    {session.duration_minutes || 45} minut
                  </div>
                  {session.playlist && (
                    <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                      <Music className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      {session.playlist}
                    </div>
                  )}
                </div>

                <div className="space-y-2 mb-3 sm:mb-4">
                  {session.warmup_exercises && session.warmup_exercises.length > 0 && (
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-white mb-1">
                        Rozgrzewka ({session.warmup_exercises.length} ćwiczeń)
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {session.warmup_exercises.map((item: any) => 
                          typeof item === 'string' ? item : item.name || 'Exercise'
                        ).join(", ")}
                      </p>
                    </div>
                  )}
                  {session.figures && session.figures.length > 0 && (
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-white mb-1">
                        Figury ({session.figures.length} ćwiczeń)
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {session.figures.map((item: any) => 
                          typeof item === 'string' ? item : item.name || 'Exercise'
                        ).join(", ")}
                      </p>
                    </div>
                  )}
                  {session.stretching_exercises && session.stretching_exercises.length > 0 && (
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-white mb-1">
                        Rozciąganie ({session.stretching_exercises.length} ćwiczeń)
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {session.stretching_exercises.map((item: any) => 
                          typeof item === 'string' ? item : item.name || 'Exercise'
                        ).join(", ")}
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  variant="primary"
                  className="w-full text-sm"
                  onClick={() => handleSessionClick(session)}
                >
                  <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Zobacz szczegóły
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <TrainingDetailsModal
        session={selectedSession}
        isOpen={showSessionDetails}
        onClose={() => {
          setShowSessionDetails(false);
          setSelectedSession(null);
        }}
        onStartTraining={handleStartTraining}
      />

      <CreateTrainingModal
        isOpen={showCreateSession}
        onClose={() => {
          setShowCreateSession(false);
          setEditingSession(null);
        }}
        onSave={handleCreateSession}
        editingSession={editingSession}
      />

    </div>
    </>
  );
};
export default Training;
