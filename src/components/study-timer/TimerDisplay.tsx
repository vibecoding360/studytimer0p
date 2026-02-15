import { motion } from "framer-motion";

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

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Glow Ring */}
      <div className="relative w-80 h-80">
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
            stroke={isBreak ? "hsl(var(--success))" : "hsl(160, 100%, 50%)"}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              filter: `drop-shadow(0 0 12px ${isBreak ? 'hsl(142, 76%, 36%)' : 'hsl(160, 100%, 50%)'})`,
            }}
            transition={{ duration: 0.5, ease: "linear" }}
          />
        </svg>
        
        {/* Inner glow fill */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${isBreak ? 'hsl(142 76% 36% / 0.05)' : 'hsl(160 100% 50% / 0.04)'} 0%, transparent 70%)`,
          }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Timer digits */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-7xl font-extralight tracking-widest tabular-nums text-foreground">
            {String(minutes).padStart(2, "0")}
          </span>
          <motion.span
            className="text-lg font-extralight tracking-[0.5em] text-muted-foreground mt-1"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {String(seconds).padStart(2, "0")}
          </motion.span>
          <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-3">
            {isBreak ? "Break" : "Focus"}
          </span>
        </div>
      </div>

      {/* Commit reminder */}
      {commitMessage && !isBreak && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 text-xs text-muted-foreground italic text-center max-w-xs"
        >
          "{commitMessage}"
        </motion.p>
      )}
    </div>
  );
}
