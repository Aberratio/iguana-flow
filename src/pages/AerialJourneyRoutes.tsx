import { useState, useEffect } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useSportGuardian } from "@/hooks/useSportGuardian";
import AerialJourney from "./AerialJourney";
import SkillTree from "@/components/SkillTree";
import SportAdminPanel from "@/components/SportAdminPanel";
import { supabase } from "@/integrations/supabase/client";

const AerialJourneyRoutes = () => {
  const { mode, category } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isTrainer } = useUserRole();
  const { isGuardianOfByKey, isLoading: guardianLoading } = useSportGuardian();
  const [sportCategories, setSportCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSportCategories();
  }, []);

  const fetchSportCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("sport_categories")
        .select("*")
        .order("name");
      
      if (error) throw error;
      setSportCategories(data || []);
    } catch (error) {
      console.error("Error fetching sport categories:", error);
    } finally {
      setLoading(false);
    }
  };

  // Check if user can access admin/preview mode for a sport
  const canManageSport = (sportKey: string): boolean => {
    if (isAdmin) return true;
    if (isTrainer && isGuardianOfByKey(sportKey)) return true;
    return false;
  };

  // Show loading spinner while fetching categories or guardian status
  if ((loading || guardianLoading) && (mode === "preview" || mode === "admin" || mode === "sport")) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Preview mode - admins and sport guardians can access
  if (mode === "preview" && category) {
    if (!canManageSport(category)) {
      return <Navigate to="/aerial-journey" replace />;
    }
    const sportData = sportCategories.find(s => s.key_name === category);
    return (
      <SkillTree
        sportCategory={category}
        sportName={sportData?.name || category}
        onBack={() => navigate(isAdmin ? "/aerial-journey" : "/trainer/my-sports")}
        adminPreviewMode={true}
      />
    );
  }

  // Admin/edit mode - admins and sport guardians can access
  if (mode === "admin" && category) {
    if (!canManageSport(category)) {
      return <Navigate to="/aerial-journey" replace />;
    }
    return <SportAdminPanel sportKey={category} />;
  }

  // User sport category routes
  if (mode === "sport" && category) {
    const sportData = sportCategories.find(s => s.key_name === category);
    if (sportData) {
      return (
        <SkillTree
          sportCategory={category}
          sportName={sportData.name}
          onBack={() => navigate("/aerial-journey")}
          adminPreviewMode={false}
        />
      );
    }
  }

  // Default: show main aerial journey page
  return <AerialJourney />;
};

export default AerialJourneyRoutes;