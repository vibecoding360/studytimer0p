import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Pause, RotateCcw, Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import SoundscapeToggle from "@/components/study-timer/SoundscapeToggle";
import { soundscapeEngine } from "@/lib/soundscape-engine";
import { useNavigate } from "react-router-dom";

export default function DashboardTimer() {
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [oneThing, setOneThing] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          toast({ title: "🎉 Session complete!", description: "Great focus work." });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = 1 - timeLeft / (25 * 60);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-success" />
          <h3 className="text-base font-semibold">Quick Focus</h3>
        </div>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate("/timer")}>
          Full Timer →
        </Button>
      </div>

      <div className="flex items-center gap-6">
        {/* Timer display */}
        <div className="relative w-24 h-24 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(var(--border))" strokeWidth="2" opacity={0.3} />
            <circle
              cx="50" cy="50" r="44"
              fill="none"
              stroke="hsl(var(--success))"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 44}
              strokeDashoffset={2 * Math.PI * 44 * (1 - progress)}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-light tabular-nums">{String(minutes).padStart(2, "0")}</span>
            <span className="text-[10px] text-muted-foreground tabular-nums">{String(seconds).padStart(2, "0")}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1 space-y-3">
          <Input
            value={oneThing}
            onChange={(e) => setOneThing(e.target.value)}
            placeholder="The ONE thing to finish this session..."
            className="border-border/30 text-sm"
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={running ? "outline" : "default"}
              onClick={() => setRunning(!running)}
              className="gap-1.5"
            >
              {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {running ? "Pause" : "Start"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setRunning(false); setTimeLeft(25 * 60); }}>
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
            <div className="ml-auto">
              <SoundscapeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* One Thing reminder during focus */}
      {running && oneThing && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-xs text-muted-foreground italic text-center border-t border-border/30 pt-3"
        >
          Focus: "{oneThing}"
        </motion.p>
      )}
    </motion.div>
  );
}
