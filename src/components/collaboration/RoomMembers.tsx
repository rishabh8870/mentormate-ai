import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Props {
  roomId: string;
}

const RoomMembers = ({ roomId }: Props) => {
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    fetchMembers();
  }, [roomId]);

  const fetchMembers = async () => {
    const { data } = await supabase
      .from("room_members")
      .select("*, profiles:user_id(username, full_name, avatar_url)")
      .eq("room_id", roomId);
    setMembers(data || []);
  };

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground mb-3">Room Members</h3>
      {members.map((m) => {
        const profile = m.profiles as any;
        const name = profile?.full_name || profile?.username || "User";
        return (
          <div key={m.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs" style={{ backgroundColor: m.color || "#888" }}>
                {name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{name}</p>
            </div>
            {m.role === "admin" && <Badge variant="secondary" className="text-[10px] h-4">Admin</Badge>}
          </div>
        );
      })}
    </div>
  );
};

export default RoomMembers;
