import { motion, AnimatePresence } from "framer-motion";
import { Check, Lock, Award, Download, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { useState } from "react";
import { useStudyProgress } from "@/lib/study-progress-context";
import { studyModulesData, type StudyModule } from "@/lib/study-modules-data";

// ─── Certificate Generation ──────────────────────────────────────────
function generateCertificate(topicName: string, fullName: string) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const certId = `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  doc.setFillColor(250, 250, 252);
  doc.rect(0, 0, w, h, "F");
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(1.5);
  doc.roundedRect(10, 10, w - 20, h - 20, 4, 4, "S");
  doc.setLineWidth(0.5);
  doc.roundedRect(14, 14, w - 28, h - 28, 3, 3, "S");
  doc.setFillColor(99, 102, 241);
  doc.rect(w / 2 - 40, 10, 80, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(99, 102, 241);
  doc.text("STUDYSYNC", w / 2, 35, { align: "center" });
  doc.setFontSize(28);
  doc.setTextColor(30, 30, 60);
  doc.text("Certificate of Completion", w / 2, 52, { align: "center" });
  doc.setDrawColor(200, 200, 220);
  doc.setLineWidth(0.3);
  doc.line(w / 2 - 60, 58, w / 2 + 60, 58);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(100, 100, 120);
  doc.text("This is to certify that", w / 2, 72, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(30, 30, 60);
  doc.text(fullName || "Student", w / 2, 86, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(100, 100, 120);
  doc.text("has successfully completed all tasks in the module", w / 2, 100, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(99, 102, 241);
  doc.text(`"${topicName}"`, w / 2, 114, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 170);
  doc.text(`Certificate ID: ${certId}`, w / 2, 145, { align: "center" });
  doc.text(`Date: ${today}`, w / 2, 152, { align: "center" });
  doc.setFillColor(99, 102, 241);
  doc.rect(w / 2 - 40, h - 13, 80, 3, "F");
  doc.save(`Certificate_${topicName.replace(/\s+/g, "_")}.pdf`);
}

// ─── Module Card ─────────────────────────────────────────────────────
function ModuleCard({ module }: { module: StudyModule }) {
  const [expanded, setExpanded] = useState(!module.isLocked);
  const { isTaskCompleted, toggleTask, getModuleProgress, studentName } = useStudyProgress();
  const { done, total, pct, isComplete } = getModuleProgress(module.id);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Card
        className={cn(
          "overflow-hidden transition-all duration-300 hover:shadow-md",
          module.isLocked && "opacity-60",
          isComplete && "ring-2 ring-success/40"
        )}
      >
        <CardHeader className="cursor-pointer select-none" onClick={() => !module.isLocked && setExpanded(!expanded)}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  isComplete ? "bg-success/15" : module.isLocked ? "bg-muted" : "bg-primary/10"
                )}
              >
                {module.isLocked ? (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                ) : isComplete ? (
                  <Award className="w-5 h-5 text-success" />
                ) : (
                  <BookOpen className="w-4 h-4 text-primary" />
                )}
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base truncate">{module.topicName}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {module.isLocked ? "Complete previous modules to unlock" : `${done} / ${total} tasks`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {!module.isLocked && (
                <div className="hidden sm:flex items-center gap-2 w-32">
                  <Progress value={pct} className="h-2" />
                  <span className="text-xs font-medium text-muted-foreground w-8 text-right">{pct}%</span>
                </div>
              )}
              {isComplete && (
                <Download className="w-4 h-4 text-success" />
              )}
              {!module.isLocked &&
                (expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />)}
            </div>
          </div>
          {!module.isLocked && (
            <div className="sm:hidden mt-3 flex items-center gap-2">
              <Progress value={pct} className="h-2 flex-1" />
              <span className="text-xs font-medium text-muted-foreground">{pct}%</span>
            </div>
          )}
        </CardHeader>

        <AnimatePresence>
          {expanded && !module.isLocked && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <CardContent className="pt-0 space-y-2">
                {module.tasks.map((task) => {
                  const checked = isTaskCompleted(task.id);
                  return (
                    <motion.button
                      key={task.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleTask(task.id)}
                      className={cn(
                        "w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-200 hover:shadow-md",
                        checked ? "bg-success/5 border-success/20" : "bg-card hover:bg-accent/50 border-border/50"
                      )}
                    >
                      <div
                        className={cn(
                          "mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                          checked ? "bg-success border-success text-success-foreground" : "border-border"
                        )}
                      >
                        {checked && <Check className="w-3 h-3" />}
                      </div>
                      <div className="min-w-0">
                        <p className={cn("text-sm font-medium transition-all", checked && "line-through text-muted-foreground")}>
                          {task.title}
                        </p>
                        <p className={cn("text-xs mt-0.5 transition-all", checked ? "text-muted-foreground/60 line-through" : "text-muted-foreground")}>
                          {task.subtitle}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}

                {isComplete && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="pt-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!studentName.trim()) {
                          toast.error("Please enter your full name at the top to generate a certificate.");
                          return;
                        }
                        generateCertificate(module.topicName, studentName);
                        toast.success(`Certificate for "${module.topicName}" downloaded!`);
                      }}
                      className="w-full gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download {module.topicName} Certificate
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────
export default function StudyModules() {
  const { overallProgress, studentName, setStudentName, loading } = useStudyProgress();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Study Modules</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete tasks, track your progress, and earn topic certificates.
        </p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div>
            <label htmlFor="student-name" className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Your Full Name (for certificates)
            </label>
            <Input
              id="student-name"
              placeholder="e.g. Priya Sharma"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-muted-foreground">Overall Progress</span>
              <span className="text-xs font-bold text-primary">{overallProgress.pct}%</span>
            </div>
            <Progress value={overallProgress.pct} className="h-2.5" />
            <p className="text-[11px] text-muted-foreground mt-1">
              {overallProgress.done} of {overallProgress.total} tasks completed
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-2 w-32 hidden sm:block" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="flex items-start gap-3 p-3 rounded-xl border border-border/50">
                        <Skeleton className="w-5 h-5 rounded-md shrink-0 mt-0.5" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-3.5 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-3"
            >
              {studyModulesData.map((mod) => (
                <ModuleCard key={mod.id} module={mod} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
