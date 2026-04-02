import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, Trash2, Plus, Code2, Users, Loader2, Clock, AlertTriangle,
} from "lucide-react";

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

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [rooms, setRooms] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: "", project_title: "", language: "javascript" });
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
    if (!adminLoading && !isAdmin && user) navigate("/");
  }, [user, authLoading, isAdmin, adminLoading]);

  useEffect(() => {
    if (isAdmin) {
      fetchRooms();
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchRooms = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("coding_rooms")
      .select("*")
      .order("created_at", { ascending: false });
    setRooms(data || []);
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setUsers(data || []);
  };

  const deleteRoom = async (roomId: string) => {
    setDeletingId(roomId);
    const { error } = await supabase.from("coding_rooms").delete().eq("id", roomId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Room deleted" });
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
    }
    setDeletingId(null);
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
      toast({ title: "Room created!", description: `Code: ${data.invite_code}` });
      setCreateOpen(false);
      setNewRoom({ name: "", project_title: "", language: "javascript" });
      fetchRooms();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-6xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage coding rooms and users</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <Code2 className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-3xl font-bold">{rooms.length}</p>
              <p className="text-xs text-muted-foreground">Total Rooms</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="w-6 h-6 mx-auto mb-2 text-secondary" />
              <p className="text-3xl font-bold">{users.length}</p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="w-6 h-6 mx-auto mb-2 text-accent" />
              <p className="text-3xl font-bold">{rooms.filter((r) => r.is_active).length}</p>
              <p className="text-xs text-muted-foreground">Active Rooms</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="rooms">
          <TabsList className="mb-6">
            <TabsTrigger value="rooms" className="gap-1"><Code2 className="w-3 h-3" /> Rooms</TabsTrigger>
            <TabsTrigger value="users" className="gap-1"><Users className="w-3 h-3" /> Users</TabsTrigger>
          </TabsList>

          <TabsContent value="rooms">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">All Coding Rooms</h2>
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Create Room</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create Coding Room</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Room Name *</Label>
                      <Input value={newRoom.name} onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })} placeholder="Room name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Project Title</Label>
                      <Input value={newRoom.project_title} onChange={(e) => setNewRoom({ ...newRoom, project_title: e.target.value })} placeholder="Project title" />
                    </div>
                    <div className="space-y-2">
                      <Label>Language</Label>
                      <Select value={newRoom.language} onValueChange={(v) => setNewRoom({ ...newRoom, language: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={createRoom} className="w-full" disabled={creating || !newRoom.name.trim()}>
                      {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Room"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : (
              <div className="space-y-2">
                {rooms.map((room) => (
                  <Card key={room.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-sm truncate">{room.name}</h3>
                          <Badge variant="secondary" className="text-[10px]">
                            {LANGUAGES.find((l) => l.value === room.language)?.label || room.language}
                          </Badge>
                          {!room.is_active && <Badge variant="outline" className="text-[10px] text-destructive">Inactive</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Code: {room.invite_code} · Created {new Date(room.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => deleteRoom(room.id)}
                        disabled={deletingId === room.id}
                      >
                        {deletingId === room.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="users">
            <h2 className="text-lg font-semibold mb-4">All Users</h2>
            <div className="space-y-2">
              {users.map((u) => (
                <Card key={u.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-sm">{u.full_name || u.username}</h3>
                      <p className="text-xs text-muted-foreground">@{u.username} · Joined {new Date(u.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
