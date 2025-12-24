import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Upload, Lightbulb } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { HintTooltip } from "@/components/ui/hint-tooltip";
import { cn } from "@/lib/utils";
import SEO from "@/components/SEO";

// Zod validation schema
const courseSchema = z.object({
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
  duration_minutes: z.number().min(0, "Czas trwania nie może być ujemny"),
});

type CourseFormData = z.infer<typeof courseSchema>;

const CreateTrainingCourse = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    thumbnail_url: "",
    difficulty_level: "beginner",
    duration_minutes: 0,
    is_published: false,
  });

  const validateForm = (): boolean => {
    try {
      courseSchema.parse({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        difficulty_level: formData.difficulty_level,
        duration_minutes: formData.duration_minutes,
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
    
    if (!user?.id) {
      toast({
        title: "Błąd",
        description: "Musisz być zalogowany, aby utworzyć kurs",
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
      const { data, error } = await supabase
        .from("training_courses")
        .insert({
          ...formData,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Kurs utworzony!",
        description: "Możesz teraz dodać lekcje do kursu.",
      });

      navigate(`/admin/training/courses/${data.id}`);
    } catch (error) {
      console.error("Błąd tworzenia kursu:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się utworzyć kursu treningowego",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const difficultyOptions = [
    { value: "beginner", label: "Początkujący" },
    { value: "intermediate", label: "Średniozaawansowany" },
    { value: "advanced", label: "Zaawansowany" },
  ];

  return (
    <>
      <SEO
        title="Utwórz kurs treningowy | IguanaFlow"
        description="Stwórz nowy kurs treningowy z lekcjami wideo"
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Utwórz kurs treningowy
            </h1>
            <p className="text-slate-400">
              Skonfiguruj nowy kurs z lekcjami i materiałami wideo
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Szczegóły kursu</CardTitle>
                <CardDescription className="text-slate-400">
                  Wypełnij podstawowe informacje o kursie
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-white flex items-center">
                    Tytuł kursu *
                    <HintTooltip content="Krótki, opisowy tytuł który przyciągnie uwagę uczestników" />
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="np. Podstawy Aerial Hoop"
                    className={cn(
                      "bg-slate-900/50 border-slate-600 text-white",
                      errors.title && "border-destructive"
                    )}
                    maxLength={100}
                  />
                  {errors.title && (
                    <p className="text-destructive text-sm">{errors.title}</p>
                  )}
                  <p className="text-xs text-slate-500">
                    {formData.title.length}/100 znaków
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white flex items-center">
                    Opis
                    <HintTooltip content="Opisz czego uczestnicy nauczą się w tym kursie" />
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Opisz cele i korzyści kursu..."
                    className={cn(
                      "bg-slate-900/50 border-slate-600 text-white min-h-[100px]",
                      errors.description && "border-destructive"
                    )}
                    rows={4}
                    maxLength={1000}
                  />
                  {errors.description && (
                    <p className="text-destructive text-sm">{errors.description}</p>
                  )}
                  <p className="text-xs text-slate-500">
                    {formData.description.length}/1000 znaków
                  </p>
                </div>

                {/* Thumbnail URL */}
                <div className="space-y-2">
                  <Label htmlFor="thumbnail_url" className="text-white flex items-center">
                    Adres URL miniaturki
                    <HintTooltip content="Link do zdjęcia które będzie wyświetlane jako okładka kursu" />
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="thumbnail_url"
                      value={formData.thumbnail_url}
                      onChange={(e) => handleInputChange("thumbnail_url", e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="bg-slate-900/50 border-slate-600 text-white flex-1"
                    />
                    <Button type="button" variant="outline" size="icon" disabled>
                      <Upload className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Difficulty Level */}
                  <div className="space-y-2">
                    <Label htmlFor="difficulty" className="text-white flex items-center">
                      Poziom trudności
                      <HintTooltip content="Określ dla jakiego poziomu zaawansowania przeznaczony jest kurs" />
                    </Label>
                    <Select
                      value={formData.difficulty_level}
                      onValueChange={(value) => handleInputChange("difficulty_level", value)}
                    >
                      <SelectTrigger className={cn(
                        "bg-slate-900/50 border-slate-600 text-white",
                        errors.difficulty_level && "border-destructive"
                      )}>
                        <SelectValue placeholder="Wybierz poziom" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        {difficultyOptions.map((option) => (
                          <SelectItem 
                            key={option.value} 
                            value={option.value} 
                            className="text-white"
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.difficulty_level && (
                      <p className="text-destructive text-sm">{errors.difficulty_level}</p>
                    )}
                  </div>

                  {/* Duration */}
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-white flex items-center">
                      Szacowany czas (minuty)
                      <HintTooltip content="Przybliżony czas potrzebny na ukończenie całego kursu" />
                    </Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => handleInputChange("duration_minutes", parseInt(e.target.value) || 0)}
                      placeholder="60"
                      className={cn(
                        "bg-slate-900/50 border-slate-600 text-white",
                        errors.duration_minutes && "border-destructive"
                      )}
                      min="0"
                    />
                    {errors.duration_minutes && (
                      <p className="text-destructive text-sm">{errors.duration_minutes}</p>
                    )}
                  </div>
                </div>

                {/* Publish Setting */}
                <div className="flex items-center justify-between p-4 bg-slate-900/30 rounded-lg">
                  <div>
                    <Label htmlFor="published" className="text-white font-medium">
                      Opublikuj kurs
                    </Label>
                    <p className="text-sm text-slate-400 mt-1">
                      Opublikowane kursy są widoczne dla użytkowników
                    </p>
                  </div>
                  <Switch
                    id="published"
                    checked={formData.is_published}
                    onCheckedChange={(checked) => handleInputChange("is_published", checked)}
                  />
                </div>

                {/* Hint for trainers */}
                <div className="bg-slate-900/30 rounded-lg p-4 flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-slate-400">
                    <span className="font-medium text-white">Wskazówka:</span>{' '}
                    Po utworzeniu kursu zostaniesz przekierowany do strony edycji, gdzie możesz dodać lekcje wideo.
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="w-full sm:w-auto"
                    disabled={isLoading}
                  >
                    Anuluj
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:flex-1 bg-primary hover:bg-primary/90"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Utwórz kurs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateTrainingCourse;