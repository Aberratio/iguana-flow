import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowLeft, ImageIcon, Lightbulb } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useDictionary } from "@/contexts/DictionaryContext";
import { cn } from "@/lib/utils";
import { SEO } from "@/components/SEO";
import { HintTooltip } from "@/components/ui/hint-tooltip";

// Zod validation schema
const challengeSchema = z.object({
  title: z
    .string()
    .min(3, "Tytuł musi mieć minimum 3 znaki")
    .max(100, "Tytuł może mieć maksymalnie 100 znaków"),
  description: z
    .string()
    .max(1000, "Opis może mieć maksymalnie 1000 znaków")
    .optional(),
  difficulty_level: z.enum(["beginner", "intermediate", "advanced"], {
    errorMap: () => ({ message: "Wybierz poziom trudności" }),
  }),
  type: z.enum(["manual", "timer"], {
    errorMap: () => ({ message: "Wybierz typ wyzwania" }),
  }),
  level: z.number().min(1, "Poziom musi być większy od 0").max(100, "Poziom może być maksymalnie 100"),
});

type ChallengeFormData = z.infer<typeof challengeSchema>;

const CreateChallenge = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isTrainer, isLoading: roleLoading } = useUserRole();
  const { difficultyLevels } = useDictionary();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<number>(1);
  const [difficultyLevel, setDifficultyLevel] = useState("intermediate");
  const [type, setType] = useState("manual");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if not trainer/admin
  React.useEffect(() => {
    if (!roleLoading && !isTrainer && !isAdmin) {
      navigate("/");
    }
  }, [roleLoading, isTrainer, isAdmin, navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `challenges/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("challenges")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("challenges")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error("Błąd podczas przesyłania zdjęcia:", error);
      return null;
    }
  };

  const validateForm = (): boolean => {
    try {
      challengeSchema.parse({
        title: title.trim(),
        description: description.trim() || undefined,
        difficulty_level: difficultyLevel,
        type,
        level,
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Błąd",
        description: "Musisz być zalogowany",
        variant: "destructive",
      });
      return;
    }

    if (!validateForm()) {
      toast({
        title: "Błąd walidacji",
        description: "Popraw błędy w formularzu",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Upload image if selected
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl) {
          throw new Error("Nie udało się przesłać zdjęcia");
        }
      }

      // Create challenge as draft
      const { data: challengeData, error: challengeError } = await supabase
        .from("challenges")
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          level,
          difficulty_level: difficultyLevel,
          type,
          image_url: imageUrl,
          created_by: user.id,
          status: "draft",
          premium: false,
        })
        .select()
        .single();

      if (challengeError) throw challengeError;

      toast({
        title: "Wyzwanie utworzone!",
        description: "Dodaj teraz dni treningowe i ćwiczenia.",
      });

      // Redirect to edit page
      navigate(`/challenges/${challengeData.id}/edit`);
    } catch (error: any) {
      console.error("Błąd tworzenia wyzwania:", error);
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się utworzyć wyzwania",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Stwórz wyzwanie | IguanaFlow"
        description="Utwórz nowe wyzwanie treningowe"
      />

      <div className="min-h-screen p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/trainer/my-challenges")}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Powrót do moich wyzwań
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold">Stwórz nowe wyzwanie</h1>
            <p className="text-muted-foreground mt-1">
              Wypełnij podstawowe informacje. Dni treningowe dodasz w następnym kroku.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-card/50 backdrop-blur border border-border rounded-lg p-4 sm:p-6 space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Tytuł wyzwania *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) {
                      setErrors((prev) => ({ ...prev, title: "" }));
                    }
                  }}
                  placeholder="np. 30 dni ze stretchingiem"
                  maxLength={100}
                  className={cn(errors.title && "border-destructive")}
                />
                {errors.title && (
                  <p className="text-destructive text-sm">{errors.title}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {title.length}/100 znaków
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Opis</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (errors.description) {
                      setErrors((prev) => ({ ...prev, description: "" }));
                    }
                  }}
                  placeholder="Opisz cele i korzyści wyzwania..."
                  rows={4}
                  maxLength={1000}
                  className={cn(errors.description && "border-destructive")}
                />
                {errors.description && (
                  <p className="text-destructive text-sm">{errors.description}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {description.length}/1000 znaków
                </p>
              </div>

              {/* Level */}
              <div className="space-y-2">
                <Label htmlFor="level" className="flex items-center">
                  Poziom
                  <HintTooltip content="Określa trudność wyzwania. 1 = najbardziej początkujący, wyższe wartości = trudniejsze." />
                </Label>
                <Input
                  id="level"
                  type="number"
                  min="1"
                  max="100"
                  value={level}
                  onChange={(e) => setLevel(parseInt(e.target.value) || 1)}
                  className={cn(errors.level && "border-destructive")}
                />
                {errors.level && (
                  <p className="text-destructive text-sm">{errors.level}</p>
                )}
              </div>

              {/* Difficulty Level */}
              <div className="space-y-2">
                <Label htmlFor="difficulty" className="flex items-center">
                  Poziom trudności *
                  <HintTooltip content="Określa ogólną trudność wyzwania. Pomaga użytkownikom wybrać odpowiednie wyzwanie." />
                </Label>
                <Select
                  value={difficultyLevel}
                  onValueChange={(value) => {
                    setDifficultyLevel(value);
                    if (errors.difficulty_level) {
                      setErrors((prev) => ({ ...prev, difficulty_level: "" }));
                    }
                  }}
                >
                  <SelectTrigger className={cn(errors.difficulty_level && "border-destructive")}>
                    <SelectValue placeholder="Wybierz poziom trudności" />
                  </SelectTrigger>
                  <SelectContent>
                    {difficultyLevels.map((lvl) => (
                      <SelectItem key={lvl.key} value={lvl.key}>
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full",
                              lvl.key === "beginner" && "bg-green-500",
                              lvl.key === "intermediate" && "bg-yellow-500",
                              lvl.key === "advanced" && "bg-red-500"
                            )}
                          />
                          {lvl.name_pl}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.difficulty_level && (
                  <p className="text-destructive text-sm">{errors.difficulty_level}</p>
                )}
              </div>

              {/* Challenge Type */}
              <div className="space-y-2">
                <Label htmlFor="type" className="flex items-center">
                  Typ wyzwania *
                  <HintTooltip content="Manualny = użytkownik sam odznacza wykonane ćwiczenia. Czasowy = timer automatycznie liczy czas wykonania." />
                </Label>
                <Select
                  value={type}
                  onValueChange={(value) => {
                    setType(value);
                    if (errors.type) {
                      setErrors((prev) => ({ ...prev, type: "" }));
                    }
                  }}
                >
                  <SelectTrigger className={cn(errors.type && "border-destructive")}>
                    <SelectValue placeholder="Wybierz typ wyzwania" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        Manualny
                      </div>
                    </SelectItem>
                    <SelectItem value="timer">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                        Czasowy
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-destructive text-sm">{errors.type}</p>
                )}
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label htmlFor="image">Zdjęcie wyzwania</Label>
                <div className="flex flex-col gap-3">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="cursor-pointer"
                  />
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Podgląd zdjęcia"
                        className="w-full max-w-xs h-32 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                      >
                        Usuń
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ImageIcon className="w-4 h-4" />
                      Nie wybrano pliku
                    </div>
                  )}
                </div>
              </div>

              {/* Hint for trainers */}
              <div className="bg-muted/30 rounded-lg p-4 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Wskazówka:</span>{' '}
                  Po utworzeniu wyzwania zostaniesz przekierowany do edycji, gdzie dodasz dni treningowe i ćwiczenia.
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/trainer/my-challenges")}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Anuluj
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:flex-1"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                    Tworzenie...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Stwórz wyzwanie
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateChallenge;
