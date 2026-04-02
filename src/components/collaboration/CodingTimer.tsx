import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Timer, Play, Square, AlertTriangle } from "lucide-react";

interface Props {
  roomId: string;
  userId: string;
}

const INACTIVITY_TIMEOUT = 3 * 60 * 1000; // 3 minutes

const CodingTimer = ({ roomId, userId }: Props) => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [wasAutoStopped, setWasAutoStopped] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const inactivityRef = useRef<ReturnType<typeof setTimeout>>();
  const startTimeRef = useRef<Date>();

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const stopTimer = useCallback(async (autoStopped = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (inactivityRef.current) clearTimeout(inactivityRef.current);
    setIsRunning(false);

    if (sessionId && startTimeRef.current) {
      const duration = Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000);
      await supabase
        .from("coding_sessions")
        .update({
          ended_at: new Date().toISOString(),
          duration_seconds: duration,
          was_auto_stopped: autoStopped,
        })
        .eq("id", sessionId);
    }

    if (autoStopped) setWasAutoStopped(true);
    setSessionId(null);
  }, [sessionId]);

  const resetInactivityTimer = useCallback(() => {
    if (!isRunning) return;
    if (inactivityRef.current) clearTimeout(inactivityRef.current);
    setWasAutoStopped(false);
    inactivityRef.current = setTimeout(() => {
      stopTimer(true);
    }, INACTIVITY_TIMEOUT);
  }, [isRunning, stopTimer]);

  // Listen for activity events
  useEffect(() => {
    if (!isRunning) return;

    const events = ["mousemove", "keydown", "mousedown", "scroll", "touchstart"];
    const handler = () => resetInactivityTimer();

    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    resetInactivityTimer(); // Start initial inactivity timer

    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
      if (inactivityRef.current) clearTimeout(inactivityRef.current);
    };
  }, [isRunning, resetInactivityTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (inactivityRef.current) clearTimeout(inactivityRef.current);
    };
  }, []);

  const startTimer = async () => {
    const now = new Date();
    startTimeRef.current = now;
    setElapsed(0);
    setIsRunning(true);
    setWasAutoStopped(false);

    const { data } = await supabase
      .from("coding_sessions")
      .insert({
        user_id: userId,
        room_id: roomId,
        started_at: now.toISOString(),
      })
      .select("id")
      .single();

    if (data) setSessionId(data.id);

    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
  };

  return (
    <div className="flex items-center gap-2">
      <Timer className="w-4 h-4 text-muted-foreground" />
      <Badge
        variant={isRunning ? "default" : "secondary"}
        className={`font-mono text-xs tabular-nums ${isRunning ? "bg-green-600 text-white animate-pulse" : ""}`}
      >
        {formatTime(elapsed)}
      </Badge>
      {!isRunning ? (
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={startTimer} title="Start timer">
          <Play className="w-3 h-3" />
        </Button>
      ) : (
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => stopTimer(false)} title="Stop timer">
          <Square className="w-3 h-3" />
        </Button>
      )}
      {wasAutoStopped && (
        <span className="text-[10px] text-amber-500 flex items-center gap-0.5">
          <AlertTriangle className="w-3 h-3" /> Auto-stopped
        </span>
      )}
    </div>
  );
};

export default CodingTimer;
