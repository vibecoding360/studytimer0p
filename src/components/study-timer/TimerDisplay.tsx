import { motion } from "framer-motion";
import { useMemo } from "react";

interface TimerDisplayProps {
  timeLeft: number;
  totalTime: number;
  isBreak: boolean;
  commitMessage?: string;
}

export default function TimerDisplay({ timeLeft, totalTime, isBreak, commitMessage }: TimerDisplayProps) {
  const progress = totalTime > 0 ? 1 - timeLeft / totalTime : 0;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const circumference = 2 * Math.PI * 140;
  const strokeDashoffset = circumference * (1 - progress);
  const isUrgent = !isBreak && timeLeft <= 10 && timeLeft > 0;

  // Color-coded state: focus → deep blue, break → warm orange, urgency → pulsing red
  const stateColor = useMemo(() => {
    if (isUrgent) return "var(--timer-urgency)";
    if (isBreak) return "var(--timer-break)";
    return "var(--timer-focus)";
  }, [isBreak, isUrgent]);

  const stateGlow = useMemo(() => {
    if (isUrgent) return "var(--timer-urgency-glow)";
    if (isBreak) return "var(--timer-break-glow)";
    return "var(--timer-focus-glow)";
  }, [isBreak, isUrgent]);

  const stateLabel = isBreak ? "Break" : isUrgent ? "Almost there" : "Focus";

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Full-screen ambient glow for state */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-0"
        animate={{
          background: `radial-gradient(circle at 50% 40%, hsl(${stateGlow}) 0%, transparent 60%)`,
        }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      />

      {/* Glow Ring */}
      <div className={`relative w-80 h-80 ${isUrgent ? "timer-urgency-pulse" : ""}`}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 300 300">
          <circle
            cx="150" cy="150" r="140"
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="2"
            opacity={0.2}
          />
          <motion.circle
            cx="150" cy="150" r="140"
            fill="none"
            stroke={`hsl(${stateColor})`}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              filter: `drop-shadow(0 0 12px hsl(${stateColor}))`,
            }}
            transition={{ duration: 0.5, ease: "linear" }}
          />
        </svg>
        
        {/* Inner glow fill */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, hsl(${stateGlow}) 0%, transparent 70%)`,
          }}
          animate={{
            opacity: isUrgent ? [0.4, 0.8, 0.4] : [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: isUrgent ? 1 : 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Timer digits */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-7xl font-extralight tracking-widest tabular-nums text-foreground"
            animate={isUrgent ? { scale: [1, 1.03, 1] } : { scale: 1 }}
            transition={isUrgent ? { duration: 1, repeat: Infinity } : {}}
          >
            {String(minutes).padStart(2, "0")}
          </motion.span>
          <motion.span
            className="text-lg font-extralight tracking-[0.5em] text-muted-foreground mt-1"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: isUrgent ? 0.5 : 1.5, repeat: Infinity }}
          >
            {String(seconds).padStart(2, "0")}
          </motion.span>
          <motion.span
            className="text-[10px] uppercase tracking-[0.3em] mt-3 font-medium"
            style={{ color: `hsl(${stateColor})` }}
            key={stateLabel}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {stateLabel}
          </motion.span>
        </div>
      </div>

      {/* Commit reminder */}
      {commitMessage && !isBreak && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 text-xs text-muted-foreground italic text-center max-w-xs relative z-10"
        >
          "{commitMessage}"
        </motion.p>
      )}
    </div>
  );
}
