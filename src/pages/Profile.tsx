import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { User, Pencil, Save, X, Code, Users, Calendar, Mail, Timer } from "lucide-react";

const Profile = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [stats, setStats] = useState({ rooms: 0, groups: 0, totalCodingSeconds: 0, sessions: 0 });
  const [form, setForm] = useState({ full_name: "", username: "", bio: "", avatar_url: "" });

  const isOwnProfile = !userId || userId === user?.id;
  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (targetUserId) {
      fetchProfile();
      fetchStats();
    }
  }, [targetUserId]);

  const fetchProfile = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", targetUserId!)
      .single();
    if (data) {
      setProfile(data);
      setForm({
        full_name: data.full_name || "",
        username: data.username || "",
        bio: data.bio || "",
        avatar_url: data.avatar_url || "",
      });
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    const [roomRes, groupRes, sessionsRes] = await Promise.all([
      supabase.from("room_members").select("id", { count: "exact", head: true }).eq("user_id", targetUserId!),
      supabase.from("group_members").select("id", { count: "exact", head: true }).eq("user_id", targetUserId!),
      supabase.from("coding_sessions").select("duration_seconds").eq("user_id", targetUserId!),
    ]);
    const totalSeconds = (sessionsRes.data || []).reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
    setStats({
      rooms: roomRes.count || 0,
      groups: groupRes.count || 0,
      totalCodingSeconds: totalSeconds,
      sessions: sessionsRes.data?.length || 0,
    });
  };

  const handleSave = async () => {
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name,
        username: form.username,
        bio: form.bio,
        avatar_url: form.avatar_url,
      })
      .eq("id", user!.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated!" });
      setEditing(false);
      fetchProfile();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 flex justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 text-center text-muted-foreground">Profile not found.</div>
      </div>
    );
  }

  const name = profile.full_name || profile.username || "User";
  const joinDate = new Date(profile.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-12 px-4 max-w-3xl mx-auto space-y-6">
        {/* Header Card */}
        <Card className="overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-primary/80 to-secondary/80" />
          <CardContent className="relative pt-0 pb-6 px-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
              <Avatar className="w-24 h-24 border-4 border-card shadow-lg">
                {profile.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={name} />
                ) : null}
                <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                  {name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 pb-1">
                <h1 className="text-2xl font-bold truncate">{name}</h1>
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
              </div>
              {isOwnProfile && !editing && (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="w-4 h-4 mr-1" /> Edit Profile
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        {editing && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Edit Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Full Name</label>
                  <Input
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Username</label>
                  <Input
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="username"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Avatar URL</label>
                <Input
                  value={form.avatar_url}
                  onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
                  placeholder="https://example.com/avatar.png"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Bio</label>
                <Textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  <X className="w-4 h-4 mr-1" /> Cancel
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-1" /> Save
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info & Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                <User className="w-4 h-4" /> About
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">{profile.bio || "No bio yet."}</p>
              <Separator />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Joined {joinDate}
              </div>
              {isOwnProfile && user?.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                <Code className="w-4 h-4" /> Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Code className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-2xl font-bold">{stats.rooms}</p>
                  <p className="text-xs text-muted-foreground">Coding Rooms</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Users className="w-5 h-5 mx-auto mb-1 text-secondary" />
                  <p className="text-2xl font-bold">{stats.groups}</p>
                  <p className="text-xs text-muted-foreground">Groups</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Timer className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-2xl font-bold">
                    {stats.totalCodingSeconds >= 3600
                      ? `${Math.floor(stats.totalCodingSeconds / 3600)}h`
                      : `${Math.floor(stats.totalCodingSeconds / 60)}m`}
                  </p>
                  <p className="text-xs text-muted-foreground">Coding Time</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Code className="w-5 h-5 mx-auto mb-1 text-accent" />
                  <p className="text-2xl font-bold">{stats.sessions}</p>
                  <p className="text-xs text-muted-foreground">Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
