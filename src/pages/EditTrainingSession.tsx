import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  EyeOff, 
  Clock,
  Target,
  Loader2,
  Timer,
  Hand,
  Crown,
  DollarSign,
  Upload,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SessionExerciseManager } from '@/components/SessionExerciseManager';
import { ImageCropModal } from '@/components/ImageCropModal';

const EditTrainingSession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration_minutes: '',
    difficulty_level: '',
    playlist: '',
    thumbnail_url: '',
    published: false,
    type: 'timer',
    premium: false
  });

  const [sessionExercises, setSessionExercises] = useState({
    warmup: [],
    training: [],
    stretching: []
  });

  // Image upload states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate('/training');
    }
  }, [isAdmin, roleLoading, navigate]);

  // Fetch session data
  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) {
        navigate('/training');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('training_sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        if (error) throw error;
        
        if (!data) {
          navigate('/training');
          return;
        }

        setSession(data);
        setFormData({
          title: data.title || '',
          description: data.description || '',
          duration_minutes: data.duration_minutes?.toString() || '',
          difficulty_level: data.difficulty_level || '',
          playlist: data.playlist || '',
          thumbnail_url: data.thumbnail_url || '',
          published: data.published || false,
          type: data.type || 'timer',
          premium: data.premium || false
        });
      } catch (error) {
        console.error('Error fetching session:', error);
        toast({
          title: "Error",
          description: "Failed to load training session.",
          variant: "destructive",
        });
        navigate('/training');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId && !roleLoading && isAdmin) {
      fetchSession();
    }
  }, [sessionId, isAdmin, roleLoading, navigate, toast]);

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `training-sessions/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("challenges")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("challenges")
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setIsCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (croppedImageFile: File) => {
    setImageFile(croppedImageFile);
    setIsCropModalOpen(false);
    setSelectedImage(null);
    
    // Upload the image immediately
    const uploadedUrl = await uploadImage(croppedImageFile);
    if (uploadedUrl) {
      setFormData(prev => ({ ...prev, thumbnail_url: uploadedUrl }));
      toast({
        title: "Image Uploaded",
        description: "Training session image uploaded successfully.",
      });
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, thumbnail_url: '' }));
    setImageFile(null);
  };

  const handleSave = async () => {
    if (!user || !sessionId) return;
    
    setSaving(true);
    try {
      const sessionData = {
        title: formData.title,
        description: formData.description,
        duration_minutes: parseInt(formData.duration_minutes) || null,
        difficulty_level: formData.difficulty_level,
        warmup_exercises: sessionExercises.warmup,
        figures: sessionExercises.training,
        stretching_exercises: sessionExercises.stretching,
        playlist: formData.playlist,
        thumbnail_url: formData.thumbnail_url,
        published: formData.published,
        type: formData.type,
        premium: formData.premium,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('training_sessions')
        .update(sessionData)
        .eq('id', sessionId);
      
      if (error) throw error;
      
      toast({
        title: "Session Updated",
        description: "Training session updated with exercises successfully.",
      });
      
      navigate('/training');
    } catch (error) {
      console.error('Error saving session:', error);
      toast({
        title: "Error",
        description: "Failed to save session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading training session...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/training')}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Edycja treningu</h1>
              <p className="text-muted-foreground">Modyfikuj szczegóły treningu i ćwiczenia</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.published}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, published: checked }))}
                id="published-toggle"
              />
              <Label htmlFor="published-toggle" className="text-white flex items-center space-x-1">
                {formData.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span>{formData.published ? 'Opublikowany' : 'Szkic'}</span>
              </Label>
            </div>
            
            <Button
              onClick={handleSave}
              disabled={saving || !formData.title}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Zapisywanie...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Zapisz zmiany
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="glass-effect border-white/10">
              <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Target className="w-5 h-5 mr-2 text-primary" />
                Podstawowe informacje
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-white">Tytuł treningu *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Wpisz tytuł treningu"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
                    required
                  />
                </div>
                
              <div>
                <Label htmlFor="description" className="text-white">Opis</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Opisz trening..."
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
                    rows={4}
                  />
                </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration" className="text-white">Czas trwania (minuty)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: e.target.value }))}
                      placeholder="45"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                <div>
                  <Label htmlFor="difficulty" className="text-white">Poziom trudności</Label>
                  <Select value={formData.difficulty_level} onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty_level: value }))}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Wybierz poziom" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Początkujący</SelectItem>
                      <SelectItem value="Intermediate">Średniozaawansowany</SelectItem>
                      <SelectItem value="Advanced">Zaawansowany</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type" className="text-white">Typ treningu</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Wybierz typ" />
                    </SelectTrigger>
                      <SelectContent>
                      <SelectItem value="timer">
                        <div className="flex items-center">
                          <Timer className="w-4 h-4 mr-2" />
                          Tryb czasowy
                        </div>
                      </SelectItem>
                      <SelectItem value="manual">
                        <div className="flex items-center">
                          <Hand className="w-4 h-4 mr-2" />
                          Tryb ręczny
                        </div>
                      </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.premium}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, premium: checked }))}
                        id="premium-toggle"
                      />
                      <Label htmlFor="premium-toggle" className="text-white flex items-center space-x-1">
                        <Crown className="w-4 h-4 text-yellow-400" />
                        <span>Premium</span>
                      </Label>
                    </div>
                  </div>
                </div>

              <div>
                <Label htmlFor="playlist" className="text-white">Rekomendowana playlista</Label>
                  <Input
                    id="playlist"
                    value={formData.playlist}
                    onChange={(e) => setFormData(prev => ({ ...prev, playlist: e.target.value }))}
                    placeholder="Nazwa lub link do playlisty Spotify"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
                  />
                </div>

              <div>
                <Label className="text-white">Zdjęcie treningu</Label>
                  <div className="space-y-4">
                    {formData.thumbnail_url && (
                      <div className="relative">
                        <img
                          src={formData.thumbnail_url}
                          alt="Miniatura treningu"
                          className="w-full h-32 object-cover rounded-lg border border-white/10"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 border-white/20 bg-black/50 text-white hover:bg-red-500/20"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('image-upload')?.click()}
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {formData.thumbnail_url ? 'Zmień obraz' : 'Dodaj obraz'}
                      </Button>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Exercise Management */}
            <SessionExerciseManager
              sessionId={sessionId}
              onExercisesChange={setSessionExercises}
            />

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Preview */}
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Podgląd</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <img
                    src={formData.thumbnail_url || "https://images.unsplash.com/photo-1518594023387-5565c8f3d1ce?w=400&h=300&fit=crop"}
                    alt="Podgląd treningu"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <div className="absolute top-2 right-2 flex space-x-1">
                    {formData.difficulty_level && (
                      <Badge className={`${
                        formData.difficulty_level === 'Beginner' ? 'bg-green-500' :
                        formData.difficulty_level === 'Intermediate' ? 'bg-yellow-500' : 'bg-red-500'
                      } text-white`}>
                        {formData.difficulty_level}
                      </Badge>
                    )}
                    {formData.premium && (
                      <Badge className="bg-yellow-500 text-white">
                        <Crown className="w-3 h-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                  <div className="absolute top-2 left-2 flex space-x-1">
                    <Badge variant="outline" className="border-white/20 text-white/70 bg-black/30">
                      {formData.type === 'timer' ? (
                        <><Timer className="w-3 h-3 mr-1" />Czasowy</>
                      ) : (
                        <><Hand className="w-3 h-3 mr-1" />Ręczny</>
                      )}
                    </Badge>
                    {!formData.published && (
                      <Badge className="bg-orange-500/20 text-orange-400">
                        Szkic
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <h3 className="text-white font-semibold">{formData.title || 'Bez tytułu'}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {formData.description || 'Brak opisu'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Session Stats */}
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Statystyki treningu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-muted-foreground">Czas trwania</span>
                  </div>
                  <span className="text-white font-medium">
                    {formData.duration_minutes || 0} min
                  </span>
                </div>
                
                 <div className="flex items-center justify-between">
                   <div className="flex items-center space-x-2">
                     <Target className="w-4 h-4 text-purple-400" />
                     <span className="text-muted-foreground">Ćwiczenia</span>
                   </div>
                   <span className="text-white font-medium">
                     {sessionExercises.warmup.length + sessionExercises.training.length + sessionExercises.stretching.length} ćwiczeń
                   </span>
                 </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Image Crop Modal */}
        {selectedImage && (
          <ImageCropModal
            isOpen={isCropModalOpen}
            onClose={() => {
              setIsCropModalOpen(false);
              setSelectedImage(null);
            }}
            imageSrc={selectedImage}
            onCropComplete={handleCropComplete}
          />
        )}
      </div>
    </div>
  );
};

export default EditTrainingSession;