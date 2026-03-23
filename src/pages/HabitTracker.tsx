import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Flame, Trophy, Calendar, Play, CheckCircle2 } from "lucide-react";
import { playCompletionChime } from "@/lib/zen-sounds";
import confetti from "canvas-confetti";
import { toast } from "@/hooks/use-toast";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MOTIVATIONAL = [
  "Focus for 25 minutes. Your future self is watching.",
  "One session at a time. That's how greatness is built.",
  "You showed up. That's already winning.",
  "Deep focus is your superpower.",
  "Consistency beats talent every single time.",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

function fireConfetti() {
  const end = Date.now() + 1500;
  const colors = ["#8E7CFF", "#2AF598", "#FF6B6B", "#FFD700"];
  const frame = () => {
    confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors });
    confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

export default function HabitTracker() {
  const { user } = useAuth();
  const [completedDates, setCompletedDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [timerState, setTimerState] = useState<"idle" | "running" | "done">("idle");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [showCelebration, setShowCelebration] = useState(false);

  const today = formatDate(new Date());
  const todayCompleted = completedDates.has(today);
  const year = new Date().getFullYear();

  // Fetch completions
  useEffect(() => {
    if (!user) return;
    supabase
      .from("daily_completions")
      .select("completed_date")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) {
          setCompletedDates(new Set(data.map((d) => d.completed_date)));
        }
        setLoading(false);
      });
  }, [user]);

  // Timer countdown
  useEffect(() => {
    if (timerState !== "running") return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerState]);

  const handleComplete = useCallback(async () => {
    setTimerState("done");
    playCompletionChime();
    fireConfetti();
    setShowCelebration(true);

    if (user && !completedDates.has(today)) {
      await supabase.from("daily_completions").insert({
        user_id: user.id,
        completed_date: today,
      });
      setCompletedDates((prev) => new Set([...prev, today]));
    }
  }, [user, today, completedDates]);

  const startSession = () => {
    if (todayCompleted) {
      toast({
        title: "Already completed!",
        description: "You already completed today. Come back tomorrow and continue your streak.",
      });
      return;
    }
    setTimeLeft(25 * 60);
    setTimerState("running");
  };

  const dismissCelebration = () => {
    setShowCelebration(false);
    setTimerState("idle");
  };

  // Streak calculation
  const streak = useMemo(() => {
    let count = 0;
    const d = new Date();
    // Check today first
    if (!completedDates.has(formatDate(d))) {
      // Check if yesterday was completed (streak still alive today)
      d.setDate(d.getDate() - 1);
      if (!completedDates.has(formatDate(d))) return 0;
    }
    // Count backwards
    const start = new Date();
    if (!completedDates.has(formatDate(start))) start.setDate(start.getDate() - 1);
    const cursor = new Date(start);
    while (completedDates.has(formatDate(cursor))) {
      count++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [completedDates]);

  const totalCompleted = completedDates.size;
  const progressPercent = Math.round((totalCompleted / 365) * 100);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerProgress = 1 - timeLeft / (25 * 60);
  const circumference = 2 * Math.PI * 120;
  const motivationalMsg = MOTIVATIONAL[Math.floor(Math.random() * MOTIVATIONAL.length)];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
          <Calendar className="w-7 h-7 text-primary" />
          365-Day Consistency Challenge
        </h1>
        <p className="text-muted-foreground text-sm">Show up every day. Build your future.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border/50 rounded-xl p-4 text-center">
          <Flame className="w-5 h-5 text-accent mx-auto mb-1" />
          <p className="text-2xl font-bold">{streak}</p>
          <p className="text-xs text-muted-foreground">Day Streak</p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4 text-center">
          <Trophy className="w-5 h-5 text-success mx-auto mb-1" />
          <p className="text-2xl font-bold">{totalCompleted}</p>
          <p className="text-xs text-muted-foreground">/ 365 Days</p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4 text-center">
          <CheckCircle2 className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold">{progressPercent}%</p>
          <p className="text-xs text-muted-foreground">Complete</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>{totalCompleted} / 365</span>
        </div>
        <Progress value={progressPercent} className="h-2.5" />
      </div>

      {/* Timer / Start Section */}
      <AnimatePresence mode="wait">
        {timerState === "running" ? (
          <motion.div
            key="timer"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center gap-6 py-8"
          >
            {/* Ambient glow */}
            <motion.div
              className="fixed inset-0 pointer-events-none z-0"
              animate={{
                background: `radial-gradient(circle at 50% 40%, hsl(var(--timer-focus-glow)) 0%, transparent 55%)`,
              }}
              transition={{ duration: 1.2 }}
            />

            <div className="relative w-64 h-64 z-10">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 260 260">
                <circle cx="130" cy="130" r="120" fill="none" stroke="hsl(var(--border))" strokeWidth="2" opacity={0.2} />
                <motion.circle
                  cx="130" cy="130" r="120"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - timerProgress)}
                  style={{ filter: "drop-shadow(0 0 10px hsl(var(--primary) / 0.4))" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-6xl font-extralight tracking-widest tabular-nums">
                  {String(minutes).padStart(2, "0")}
                </span>
                <motion.span
                  className="text-lg font-extralight tracking-[0.5em] text-muted-foreground"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {String(seconds).padStart(2, "0")}
                </motion.span>
                <span className="text-[10px] uppercase tracking-[0.3em] mt-2 text-primary font-medium">Focus</span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground italic text-center max-w-xs z-10">
              "{motivationalMsg}"
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="start"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col items-center gap-4 py-6"
          >
            {todayCompleted ? (
              <div className="text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
                <p className="text-lg font-semibold">Today's session complete!</p>
                <p className="text-sm text-muted-foreground">Come back tomorrow and continue your streak.</p>
              </div>
            ) : (
              <>
                <Button
                  onClick={startSession}
                  className="h-16 px-10 text-base font-semibold rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Today's Focus Session
                </Button>
                <p className="text-xs text-muted-foreground">25 minutes of deep focus</p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 365-Day Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Your Year</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {Array.from({ length: 12 }, (_, monthIdx) => {
            const days = getDaysInMonth(year, monthIdx);
            return (
              <div key={monthIdx} className="bg-card border border-border/50 rounded-xl p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">{MONTHS[monthIdx]}</p>
                <div className="grid grid-cols-7 gap-[3px]">
                  {Array.from({ length: days }, (_, dayIdx) => {
                    const dateStr = `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(dayIdx + 1).padStart(2, "0")}`;
                    const isCompleted = completedDates.has(dateStr);
                    const isToday = dateStr === today;
                    return (
                      <div
                        key={dayIdx}
                        className={`w-3 h-3 rounded-[2px] transition-colors ${
                          isCompleted
                            ? "bg-success"
                            : isToday
                            ? "bg-primary/30 ring-1 ring-primary"
                            : "bg-muted/40"
                        }`}
                        title={`${MONTHS[monthIdx]} ${dayIdx + 1}${isCompleted ? " ✓" : ""}`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Celebration Modal */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-card border border-border/50 rounded-2xl p-8 max-w-sm mx-4 text-center shadow-2xl"
            >
              <span className="text-5xl mb-4 block">🎉</span>
              <h2 className="text-xl font-bold mb-2">You did it!</h2>
              <p className="text-sm text-muted-foreground mb-6">
                That's another day of becoming the person who shows up consistently. See you tomorrow.
              </p>
              <div className="flex items-center justify-center gap-2 mb-6">
                <Flame className="w-5 h-5 text-accent" />
                <span className="font-bold text-lg">{streak} day streak</span>
              </div>
              <Button onClick={dismissCelebration} className="w-full rounded-xl">
                Awesome!
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
