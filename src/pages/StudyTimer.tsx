import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, RotateCcw, Timer } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import TimerDisplay from "@/components/study-timer/TimerDisplay";
import FocusRating from "@/components/study-timer/FocusRating";
import SoundscapeToggle from "@/components/study-timer/SoundscapeToggle";

interface Course {
  id: string;
  name: string;
}

interface SyllabusItem {
  id: string;
  title: string;
}

type TimerMode = "pomodoro" | "deep-work" | "custom";
type TimerState = "idle" | "running" | "paused" | "break" | "rating";
type Soundscape = "off" | "white-noise" | "lofi" | "rain";

const PRESETS: Record<TimerMode, { work: number; break: number; label: string }> = {
  pomodoro: { work: 25, break: 5, label: "Pomodoro (25/5)" },
  "deep-work": { work: 90, break: 15, label: "90-Min Deep Work" },
  custom: { work: 45, break: 10, label: "Custom Flow" },
};

export default function StudyTimer() {
  const { user } = useAuth();
  const [mode, setMode] = useState<TimerMode>("pomodoro");
  const [customWork, setCustomWork] = useState(45);
  const [customBreak, setCustomBreak] = useState(10);
  const [autoBreak, setAutoBreak] = useState(true);
  const [autoNext, setAutoNext] = useState(false);
  const [state, setState] = useState<TimerState>("idle");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [totalTime, setTotalTime] = useState(25 * 60);
  const [isBreak, setIsBreak] = useState(false);
  const [round, setRound] = useState(1);
  const [commitMessage, setCommitMessage] = useState("");
  const [soundscape, setSoundscape] = useState<Soundscape>("off");
  const [courses, setCourses] = useState<Course[]>([]);
  const [syllabusItems, setSyllabusItems] = useState<SyllabusItem[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [emergencyUsed, setEmergencyUsed] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch courses
  useEffect(() => {
    supabase.from("courses").select("id, name").then(({ data }) => {
      if (data) setCourses(data);
    });
  }, []);

  // Fetch syllabus items when course changes
  useEffect(() => {
    if (!selectedCourse) { setSyllabusItems([]); return; }
    supabase.from("syllabus_items").select("id, title").eq("course_id", selectedCourse).then(({ data }) => {
      if (data) setSyllabusItems(data);
    });
  }, [selectedCourse]);

  const getWorkMinutes = () => mode === "custom" ? customWork : PRESETS[mode].work;
  const getBreakMinutes = () => mode === "custom" ? customBreak : PRESETS[mode].break;

  const startTimer = useCallback(() => {
    const work = getWorkMinutes() * 60;
    setTimeLeft(work);
    setTotalTime(work);
    setIsBreak(false);
    setState("running");
  }, [mode, customWork]);

  const startBreak = useCallback(() => {
    const brk = getBreakMinutes() * 60;
    setTimeLeft(brk);
    setTotalTime(brk);
    setIsBreak(true);
    setState("running");
  }, [mode, customBreak]);

  // Timer tick
  useEffect(() => {
    if (state !== "running") {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          handleTimerEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [state]);

  const handleTimerEnd = () => {
    // Desktop notification
    if (Notification.permission === "granted") {
      new Notification(isBreak ? "Break over! Time to focus." : "Session complete! Take a break.", {
        icon: "/favicon.ico",
      });
    }
    toast({
      title: isBreak ? "Break's over!" : "🎉 Session complete!",
      description: isBreak ? "Ready for another round?" : "Great focus work.",
    });

    if (isBreak) {
      setRound((r) => r + 1);
      if (autoNext) {
        startTimer();
      } else {
        setState("idle");
      }
    } else {
      // Show rating then start break
      setState("rating");
    }
  };

  const saveSession = async (focusScore: number) => {
    if (!user) return;
    await supabase.from("study_sessions").insert({
      user_id: user.id,
      course_id: selectedCourse || null,
      syllabus_item_id: selectedItem || null,
      mode,
      duration_minutes: getWorkMinutes(),
      focus_score: focusScore,
      commit_message: commitMessage || null,
    });

    if (autoBreak) {
      startBreak();
    } else {
      setState("idle");
    }
  };

  const handleEmergencyBreak = () => {
    const now = Date.now();
    if (emergencyUsed && now - emergencyUsed < 3600000) {
      toast({ title: "Limit reached", description: "You can only use Take 2 once per hour.", variant: "destructive" });
      return;
    }
    setTimeLeft((p) => p + 120);
    setTotalTime((p) => p + 120);
    setEmergencyUsed(now);
    toast({ title: "+2 minutes added", description: "Quick transition time." });
  };

  const togglePause = () => {
    setState(state === "running" ? "paused" : "running");
  };

  const resetTimer = () => {
    setState("idle");
    setIsBreak(false);
    setTimeLeft(getWorkMinutes() * 60);
    setTotalTime(getWorkMinutes() * 60);
    setRound(1);
  };

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const isFocusMode = state === "running" || state === "paused";

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <AnimatePresence mode="wait">
        {state === "rating" ? (
          <motion.div
            key="rating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center min-h-[60vh]"
          >
            <FocusRating onRate={saveSession} />
          </motion.div>
        ) : isFocusMode ? (
          /* ===== FOCUS MODE ===== */
          <motion.div
            key="focus"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[70vh] gap-8"
          >
            <TimerDisplay
              timeLeft={timeLeft}
              totalTime={totalTime}
              isBreak={isBreak}
              commitMessage={commitMessage}
            />

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={togglePause} className="w-12 h-12 rounded-full border border-border/30">
                {state === "running" ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={resetTimer} className="w-10 h-10 rounded-full">
                <RotateCcw className="w-4 h-4" />
              </Button>
              {!isBreak && (
                <Button variant="ghost" size="sm" onClick={handleEmergencyBreak} className="text-xs text-muted-foreground">
                  +2 min
                </Button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <SoundscapeToggle active={soundscape} onChange={setSoundscape} />
              <span className="text-xs text-muted-foreground">Round {round}</span>
            </div>
          </motion.div>
        ) : (
          /* ===== SETUP MODE ===== */
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="max-w-lg mx-auto space-y-8"
          >
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Timer className="w-6 h-6 text-[hsl(160,100%,50%)]" />
                Deep Work Timer
              </h1>
              <p className="text-muted-foreground text-sm mt-1">Lock in and build momentum</p>
            </div>

            {/* Mode Selection */}
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Mode</Label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(PRESETS) as TimerMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                      mode === m
                        ? "border-[hsl(160,100%,50%)] bg-[hsl(160,100%,50%,0.1)] text-foreground"
                        : "border-border/30 text-muted-foreground hover:border-border"
                    }`}
                  >
                    {PRESETS[m].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom duration */}
            {mode === "custom" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Work (min)</Label>
                  <Input type="number" value={customWork} onChange={(e) => setCustomWork(Number(e.target.value))} min={1} max={180} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Break (min)</Label>
                  <Input type="number" value={customBreak} onChange={(e) => setCustomBreak(Number(e.target.value))} min={1} max={60} />
                </div>
              </motion.div>
            )}

            {/* Auto toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Auto-start breaks</Label>
                <Switch checked={autoBreak} onCheckedChange={setAutoBreak} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Auto-start next round</Label>
                <Switch checked={autoNext} onCheckedChange={setAutoNext} />
              </div>
            </div>

            {/* Session labeling */}
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Link to</Label>
              <Select value={selectedCourse} onValueChange={(v) => { setSelectedCourse(v); setSelectedItem(""); }}>
                <SelectTrigger><SelectValue placeholder="Select a course (optional)" /></SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {syllabusItems.length > 0 && (
                <Select value={selectedItem} onValueChange={setSelectedItem}>
                  <SelectTrigger><SelectValue placeholder="Select a syllabus item (optional)" /></SelectTrigger>
                  <SelectContent>
                    {syllabusItems.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Commit message */}
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                The ONE thing you'll finish this session
              </Label>
              <Input
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="e.g. Complete Chapter 5 notes"
                className="border-border/30"
              />
            </div>

            {/* Soundscape */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Soundscape</Label>
              <SoundscapeToggle active={soundscape} onChange={setSoundscape} />
            </div>

            {/* Start */}
            <Button
              onClick={startTimer}
              className="w-full h-12 text-base font-semibold bg-[hsl(160,100%,40%)] hover:bg-[hsl(160,100%,35%)] text-black rounded-xl"
            >
              Start Focus Session
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
