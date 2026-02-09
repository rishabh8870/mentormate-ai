import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Code2, Plus, Users, Clock, LogIn, Loader2 } from "lucide-react";

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "html", label: "HTML/CSS" },
  { value: "sql", label: "SQL" },
];

interface CodingRoom {
  id: string;
  name: string;
  project_title: string | null;
  language: string;
  tech_stack: string[];
  invite_code: string;
  created_by: string;
  last_active: string;
  created_at: string;
}

const CollaborationHub = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<CodingRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [newRoom, setNewRoom] = useState({ name: "", project_title: "", language: "javascript" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchRooms();
  }, [user]);

  const fetchRooms = async () => {
    setLoading(true);
    // Get rooms where user is a member
    const { data: memberRooms } = await supabase
      .from("room_members")
      .select("room_id")
      .eq("user_id", user!.id);

    if (memberRooms && memberRooms.length > 0) {
      const roomIds = memberRooms.map((m) => m.room_id);
      const { data } = await supabase
        .from("coding_rooms")
        .select("*")
        .in("id", roomIds)
        .order("last_active", { ascending: false });
      setRooms((data as CodingRoom[]) || []);
    } else {
      setRooms([]);
    }
    setLoading(false);
  };

  const createRoom = async () => {
    if (!newRoom.name.trim()) return;
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("coding_rooms")
        .insert({
          name: newRoom.name,
          project_title: newRoom.project_title || null,
          language: newRoom.language,
          created_by: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      setCreateOpen(false);
      setNewRoom({ name: "", project_title: "", language: "javascript" });
      navigate(`/collaboration/${data.id}`);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const joinRoom = async () => {
    if (!joinCode.trim()) return;
    try {
      const { data: room, error: findError } = await supabase
        .from("coding_rooms")
        .select("id")
        .eq("invite_code", joinCode.trim())
        .single();

      if (findError || !room) {
        toast({ title: "Room not found", description: "Invalid invite code", variant: "destructive" });
        return;
      }

      const { error: joinError } = await supabase
        .from("room_members")
        .insert({ room_id: room.id, user_id: user!.id });

      if (joinError) {
        if (joinError.code === "23505") {
          navigate(`/collaboration/${room.id}`);
          return;
        }
        throw joinError;
      }

      navigate(`/collaboration/${room.id}`);
    } catch (error: any) {
      toast({ title: "Error joining room", description: error.message, variant: "destructive" });
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Engineering Collaboration Hub
              </h1>
              <p className="text-muted-foreground">Code together in real-time with your team</p>
            </div>
            <div className="flex gap-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter invite code..."
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="w-40"
                />
                <Button variant="outline" onClick={joinRoom} disabled={!joinCode.trim()}>
                  <LogIn className="w-4 h-4 mr-1" /> Join
                </Button>
              </div>
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-accent">
                    <Plus className="w-4 h-4 mr-1" /> Create Room
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Coding Room</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Room Name *</Label>
                      <Input value={newRoom.name} onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })} placeholder="e.g., Algorithm Practice" />
                    </div>
                    <div className="space-y-2">
                      <Label>Project Title</Label>
                      <Input value={newRoom.project_title} onChange={(e) => setNewRoom({ ...newRoom, project_title: e.target.value })} placeholder="e.g., Sorting Visualizer" />
                    </div>
                    <div className="space-y-2">
                      <Label>Language</Label>
                      <Select value={newRoom.language} onValueChange={(v) => setNewRoom({ ...newRoom, language: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map((l) => (
                            <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={createRoom} className="w-full bg-gradient-accent" disabled={creating || !newRoom.name.trim()}>
                      {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Room"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : rooms.length === 0 ? (
            <Card className="text-center py-16">
              <CardContent>
                <Code2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No coding rooms yet</h3>
                <p className="text-muted-foreground mb-4">Create a room or join one with an invite code</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <Link key={room.id} to={`/collaboration/${room.id}`}>
                  <Card className="hover:shadow-medium hover:border-primary/50 transition-all cursor-pointer h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{room.name}</CardTitle>
                          {room.project_title && <CardDescription>{room.project_title}</CardDescription>}
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {LANGUAGES.find((l) => l.value === room.language)?.label || room.language}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(room.last_active || room.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          Code: {room.invite_code}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CollaborationHub;
