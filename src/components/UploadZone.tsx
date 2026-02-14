import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Sparkles, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface Props {
  onFile: (file: File) => void;
  onTextChange: (text: string) => void;
  text: string;
  parsing: boolean;
  parsed: boolean;
  onParse: () => void;
}

const stages = [
  { label: "Reading document", pct: 20 },
  { label: "Extracting structure", pct: 45 },
  { label: "Identifying dates & weights", pct: 70 },
  { label: "Building course profile", pct: 90 },
  { label: "Complete", pct: 100 },
];

export default function UploadZone({ onFile, onTextChange, text, parsing, parsed, onParse }: Props) {
  const [dragActive, setDragActive] = useState(false);
  const [stage, setStage] = useState(0);

  // Simulate progress stages during parsing
  const startParsing = useCallback(() => {
    setStage(0);
    onParse();
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i >= stages.length - 1) {
        clearInterval(interval);
      }
      setStage(i);
    }, 1200);
  }, [onParse]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }, [onFile]);

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 group cursor-pointer",
          dragActive
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border/40 hover:border-border/70"
        )}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".txt,.pdf,.png,.jpg,.jpeg";
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) onFile(file);
          };
          input.click();
        }}
      >
        <motion.div animate={dragActive ? { scale: 1.1 } : { scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/15 transition-colors">
            <Upload className="w-6 h-6 text-primary" />
          </div>
        </motion.div>
        <p className="text-sm font-medium mb-1">Drop your syllabus here</p>
        <p className="text-xs text-muted-foreground">PDF, image, or text file · or click to browse</p>
      </div>

      {/* Text area */}
      <div className="relative">
        <textarea
          value={text}
          onChange={e => onTextChange(e.target.value)}
          placeholder="Or paste syllabus text directly..."
          rows={8}
          className="w-full rounded-xl bg-secondary/20 border border-border/30 p-4 text-sm font-mono leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
        />
        {text.length > 0 && (
          <span className="absolute bottom-3 right-3 text-[10px] text-muted-foreground font-mono">
            {text.length.toLocaleString()} chars
          </span>
        )}
      </div>

      {/* Parse button or progress */}
      <AnimatePresence mode="wait">
        {parsing ? (
          <motion.div
            key="progress"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass-card rounded-xl p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span className="text-sm font-medium">{stages[Math.min(stage, stages.length - 1)].label}</span>
              </div>
              <span className="text-xs font-mono text-muted-foreground">{stages[Math.min(stage, stages.length - 1)].pct}%</span>
            </div>
            <Progress value={stages[Math.min(stage, stages.length - 1)].pct} className="h-1.5" />
            <div className="flex gap-1.5 justify-center pt-1">
              {stages.map((_, i) => (
                <motion.div
                  key={i}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-colors",
                    i <= stage ? "bg-primary" : "bg-border"
                  )}
                  animate={i === stage ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
              ))}
            </div>
          </motion.div>
        ) : parsed ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 text-sm font-medium text-success justify-center py-3"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Syllabus parsed successfully</span>
          </motion.div>
        ) : (
          <motion.button
            key="btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={startParsing}
            disabled={!text.trim()}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all",
              text.trim()
                ? "bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20"
                : "bg-secondary text-muted-foreground cursor-not-allowed"
            )}
          >
            <Sparkles className="w-4 h-4" />
            Parse with AI
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
