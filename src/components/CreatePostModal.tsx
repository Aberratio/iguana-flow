import React, { useState, useEffect } from "react";
import {
  X,
  Image,
  Users,
  Lock,
  Globe,
  Video,
  Loader2,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCreatePost } from "@/hooks/useCreatePost";
import { fetchExercises } from "@/services/exercises";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: any) => void;
  preselectedFigure?: any;
  initialContent?: string;
  onBeforeSubmit?: () => Promise<void>;
}

export const CreatePostModal = ({
  isOpen,
  onClose,
  onPostCreated,
  preselectedFigure,
  initialContent,
  onBeforeSubmit,
}: CreatePostModalProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [privacy, setPrivacy] = useState("public");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFilePreview, setSelectedFilePreview] = useState<string | null>(
    null
  );
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [selectedFigure, setSelectedFigure] = useState<any>(null);
  const [figureSearchTerm, setFigureSearchTerm] = useState("");
  const [availableFigures, setAvailableFigures] = useState([]);
  const [showFigureSearch, setShowFigureSearch] = useState(false);
  const { toast } = useToast();
  const { createPost, isSubmitting } = useCreatePost();

  // Fetch available figures for selection
  const fetchFigures = async () => {
    try {
      const figures = await fetchExercises({});
      setAvailableFigures(figures.map(f => ({
        id: f.id,
        name: f.name,
        difficulty_level: f.difficulty_level,
        category: f.category,
        image_url: f.image_url,
      })));
    } catch (error) {
      console.error("Error fetching figures:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFigures();
      if (preselectedFigure) {
        setSelectedFigure(preselectedFigure);
        setShowFigureSearch(false);
      }
      // Set initial content if provided
      if (initialContent) {
        setContent(initialContent);
      }
    } else {
      // Reset form when modal closes
      setContent("");
      setSelectedFile(null);
      setSelectedFilePreview(null);
      setPrivacy("public");
      setSelectedFigure(null);
      setShowFigureSearch(false);
    }
  }, [isOpen, preselectedFigure, initialContent]);

  const filteredFigures = availableFigures.filter((figure) =>
    figure.name.toLowerCase().includes(figureSearchTerm.toLowerCase())
  );

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: "Błąd",
        description: "Dodaj treść do swojego posta",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Błąd",
        description: "Musisz być zalogowany(a), aby utworzyć post",
        variant: "destructive",
      });
      return;
    }

    try {
      // Call onBeforeSubmit callback if provided (e.g., to mark challenge day complete)
      if (onBeforeSubmit) {
        await onBeforeSubmit();
      }

      // Create post using hook
      const newPost = await createPost(
        {
          user_id: user.id,
          content,
          privacy,
          figure_id: selectedFigure?.id || null,
        },
        selectedFile || undefined,
        selectedFile ? mediaType : undefined
      );

      // Pass the raw post data to the callback
      onPostCreated(newPost);

      // Reset form
      setContent("");
      setSelectedFile(null);
      setSelectedFilePreview(null);
      setPrivacy("public");
      onClose();

      toast({
        title: "Post utworzony!",
        description: "Twój post został udostępniony.",
      });
    } catch (error: any) {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się utworzyć posta",
        variant: "destructive",
      });
    }
  };

  const getPrivacyIcon = () => {
    switch (privacy) {
      case "friends":
        return <Users className="w-4 h-4" />;
      case "private":
        return <Lock className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto glass-effect border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Utwórz nowy post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback>
                {user?.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-white">{user?.username}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-10"></div> {/* Spacer to align with avatar */}
            <div>
              <Select value={privacy} onValueChange={setPrivacy}>
                <SelectTrigger className="w-40 h-8 bg-white/5 border-white/10 text-white">
                  <SelectValue>
                    <div className="flex items-center space-x-2">
                      {getPrivacyIcon()}
                      <span className="capitalize">
                        {privacy === "friends"
                          ? "Tylko znajomi"
                          : privacy === "private"
                          ? "Tylko ja"
                          : "Publiczny"}
                      </span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-background/95 border-white/10 z-50">
                  <SelectItem value="public">
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4" />
                      <span>Publiczny</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="friends">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>Tylko znajomi</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center space-x-2">
                      <Lock className="w-4 h-4" />
                      <span>Tylko ja</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Textarea
            placeholder={
              preselectedFigure
                ? `Podziel się swoją wersją ${preselectedFigure.name}...`
                : "Co u Ciebie słychać?"
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-muted-foreground resize-none"
          />

          {/* Selected Figure Display */}
          {selectedFigure && (
            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {selectedFigure.image_url && (
                    <img
                      src={selectedFigure.image_url}
                      alt={selectedFigure.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                  )}
                  <div>
                    <p className="text-white font-medium">
                      {selectedFigure.name}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {selectedFigure.difficulty_level}
                    </p>
                  </div>
                </div>
                {!preselectedFigure && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFigure(null)}
                    className="text-muted-foreground hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Figure Selection */}
          {!selectedFigure && !preselectedFigure && (
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => setShowFigureSearch(!showFigureSearch)}
                className="w-full justify-start border-white/20 text-white hover:bg-white/10"
              >
                <Target className="w-4 h-4 mr-2" />
                {showFigureSearch
                  ? "Ukryj wybór figury"
                  : "Połącz z figurą (opcjonalnie)"}
              </Button>

              {showFigureSearch && (
                <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/10">
                  <input
                    type="text"
                    placeholder="Szukaj figur..."
                    value={figureSearchTerm}
                    onChange={(e) => setFigureSearchTerm(e.target.value)}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-white/60 focus:border-primary focus:outline-none"
                  />
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {filteredFigures.slice(0, 5).map((figure) => (
                      <div
                        key={figure.id}
                        onClick={() => {
                          setSelectedFigure(figure);
                          setShowFigureSearch(false);
                          setFigureSearchTerm("");
                        }}
                        className="p-3 hover:bg-white/10 rounded-md cursor-pointer flex items-center space-x-3 transition-colors"
                      >
                        {figure.image_url && (
                          <img
                            src={figure.image_url}
                            alt={figure.name}
                            className="w-10 h-10 rounded object-cover flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-medium truncate">
                            {figure.name}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {figure.difficulty_level}
                          </p>
                        </div>
                      </div>
                    ))}
                    {filteredFigures.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">
                        Nie znaleziono figur
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedFilePreview && mediaType === "image" && (
            <div className="relative">
              <img
                src={selectedFilePreview}
                alt="Selected"
                className="w-full max-h-48 sm:max-h-64 object-cover rounded-lg"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => {
                  setSelectedFile(null);
                  setSelectedFilePreview(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {selectedFilePreview && mediaType === "video" && (
            <div className="relative">
              <video
                src={selectedFilePreview}
                className="w-full max-h-48 sm:max-h-64 object-cover rounded-lg"
                controls
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => {
                  setSelectedFile(null);
                  setSelectedFilePreview(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Add Photo Button */}
          <div className="flex items-center space-x-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload">
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-white text-sm"
                asChild
                onClick={() => setMediaType("image")}
              >
                <span className="flex items-center space-x-2 cursor-pointer">
                  <Image className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Dodaj zdjęcie</span>
                  <span className="sm:hidden">Zdjęcie</span>
                </span>
              </Button>
            </label>
          </div>

          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex-1"></div>

            <div className="flex space-x-2 justify-end">
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-muted-foreground hover:text-white hover:bg-white/5 text-sm"
              >
                Anuluj
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="text-sm"
                variant="primary"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span className="hidden sm:inline">Publikowanie...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  "Opublikuj"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
