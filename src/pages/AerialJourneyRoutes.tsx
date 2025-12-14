import { useState, useEffect } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import AerialJourney from "./AerialJourney";
import SkillTree from "@/components/SkillTree";
import SportAdminPanel from "@/components/SportAdminPanel";
import { supabase } from "@/integrations/supabase/client";

const AerialJourneyRoutes = () => {
  const { mode, category } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
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

  // Show loading spinner while fetching categories
  if (loading && (mode === "preview" || mode === "admin" || mode === "sport")) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Prevent non-admins from accessing preview mode
  if (mode === "preview" && !isAdmin) {
    return <Navigate to="/aerial-journey" replace />;
  }

  // Prevent non-admins from accessing edit mode
  if (mode === "admin" && !isAdmin) {
    return <Navigate to="/aerial-journey" replace />;
  }

  // Admin preview routes - unlocked levels but no edit
  if (mode === "preview" && category && isAdmin) {
    const sportData = sportCategories.find(s => s.key_name === category);
    return (
      <SkillTree
        sportCategory={category}
        sportName={sportData?.name || category}
        onBack={() => navigate("/aerial-journey")}
        adminPreviewMode={true}
      />
    );
  }

  // Admin edit routes - per sport management
  if (mode === "admin" && category && isAdmin) {
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