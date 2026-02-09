import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";

interface Props {
  roomId: string;
  userId: string;
}

interface ChatMessage {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  profiles?: { username: string; avatar_url: string | null } | null;
}

const RoomChat = ({ roomId, userId }: Props) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`room-chat-${roomId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "room_messages", filter: `room_id=eq.${roomId}` }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        setMessages((prev) => [...prev, newMsg]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("room_messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })
      .limit(100);
    setMessages((data as ChatMessage[]) || []);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const msg = input.trim();
    setInput("");
    await supabase.from("room_messages").insert({
      room_id: roomId,
      user_id: userId,
      content: msg,
    });
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea ref={scrollRef} className="flex-1 p-3">
        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.user_id === userId ? "items-end" : "items-start"}`}>
              <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${msg.user_id === userId ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {msg.content}
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5">
                {new Date(msg.created_at || "").toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="p-2 border-t border-border">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-1">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." className="h-8 text-xs" />
          <Button type="submit" size="icon" className="h-8 w-8 shrink-0" disabled={!input.trim()}>
            <Send className="w-3 h-3" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default RoomChat;
