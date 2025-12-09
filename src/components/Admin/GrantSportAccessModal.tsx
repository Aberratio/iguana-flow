import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface GrantSportAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface UserResult {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
}

interface SportCategory {
  id: string;
  name: string;
  key_name: string;
}

const GrantSportAccessModal = ({ isOpen, onClose, onSuccess }: GrantSportAccessModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [sports, setSports] = useState<SportCategory[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isGranting, setIsGranting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchSports();
    }
  }, [isOpen]);

  const fetchSports = async () => {
    const { data } = await supabase
      .from("sport_categories")
      .select("id, name, key_name")
      .eq("is_published", true)
      .order("name");
    
    if (data) setSports(data);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, email, avatar_url")
        .or(`username.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleGrant = async () => {
    if (!selectedUser || !selectedSport) {
      toast({
        title: "Błąd",
        description: "Wybierz użytkownika i sport",
        variant: "destructive",
      });
      return;
    }

    setIsGranting(true);
    try {
      // Check if user already has access
      const { data: existing } = await supabase
        .from("user_sport_purchases")
        .select("id")
        .eq("user_id", selectedUser.id)
        .eq("sport_category_id", selectedSport)
        .single();

      if (existing) {
        toast({
          title: "Błąd",
          description: "Użytkownik już ma dostęp do tej ścieżki",
          variant: "destructive",
        });
        return;
      }

      // Grant access
      const { error } = await supabase.from("user_sport_purchases").insert({
        user_id: selectedUser.id,
        sport_category_id: selectedSport,
        purchase_type: "admin_grant",
        notes: notes || "Dostęp nadany przez admina",
      });

      if (error) throw error;

      toast({
        title: "Sukces",
        description: `Nadano dostęp do ścieżki użytkownikowi ${selectedUser.username}`,
      });

      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error("Grant error:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się nadać dostępu",
        variant: "destructive",
      });
    } finally {
      setIsGranting(false);
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedUser(null);
    setSelectedSport("");
    setNotes("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Nadaj dostęp do ścieżki
          </DialogTitle>
          <DialogDescription>
            Ręcznie nadaj użytkownikowi dostęp do wybranej ścieżki sportowej
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User search */}
          <div className="space-y-2">
            <Label>Szukaj użytkownika</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Username lub email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Search results */}
          {searchResults.length > 0 && !selectedUser && (
            <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className="w-full flex items-center gap-2 p-2 hover:bg-muted text-left"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url || ""} />
                    <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{user.username}</div>
                    <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected user */}
          {selectedUser && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedUser.avatar_url || ""} />
                <AvatarFallback>{selectedUser.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{selectedUser.username}</div>
                <div className="text-sm text-muted-foreground truncate">{selectedUser.email}</div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                Zmień
              </Button>
            </div>
          )}

          {/* Sport selection */}
          <div className="space-y-2">
            <Label>Wybierz ścieżkę sportową</Label>
            <Select value={selectedSport} onValueChange={setSelectedSport}>
              <SelectTrigger>
                <SelectValue placeholder="Wybierz sport..." />
              </SelectTrigger>
              <SelectContent>
                {sports.map((sport) => (
                  <SelectItem key={sport.id} value={sport.id}>
                    {sport.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notatka (opcjonalnie)</Label>
            <Textarea
              placeholder="Powód nadania dostępu..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleClose}>
              Anuluj
            </Button>
            <Button onClick={handleGrant} disabled={isGranting || !selectedUser || !selectedSport}>
              {isGranting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Nadawanie...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Nadaj dostęp
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GrantSportAccessModal;
