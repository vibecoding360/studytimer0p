import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Lock, Award, Download, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import jsPDF from "jspdf";

// ─── Data Architecture ───────────────────────────────────────────────
interface Task {
  id: string;
  title: string;
  subtitle: string;
}

interface StudyModule {
  id: string;
  topicName: string;
  tasks: Task[];
  isLocked: boolean;
}

const studyModulesData: StudyModule[] = [
  {
    id: "mod-1",
    topicName: "Relations & Functions",
    isLocked: false,
    tasks: [
      { id: "rf-1", title: "Types of Relations", subtitle: "Reflexive, Symmetric, Transitive" },
      { id: "rf-2", title: "One-One and Onto Functions", subtitle: "Injective, Surjective, Bijective" },
      { id: "rf-3", title: "Composition of Functions", subtitle: "fog, gof and Inverse functions" },
    ],
  },
  {
    id: "mod-2",
    topicName: "Matrices & Determinants",
    isLocked: false,
    tasks: [
      { id: "md-1", title: "Matrix Operations", subtitle: "Addition, Scalar Multiplication, Transpose" },
      { id: "md-2", title: "Determinant Properties", subtitle: "Expansion, Minors, Cofactors" },
      { id: "md-3", title: "Inverse of a Matrix", subtitle: "Adjoint method and Row reduction" },
      { id: "md-4", title: "System of Linear Equations", subtitle: "Cramer's Rule and Matrix method" },
    ],
  },
  {
    id: "mod-3",
    topicName: "Differentiation",
    isLocked: false,
    tasks: [
      { id: "df-1", title: "Limits & Continuity", subtitle: "L'Hôpital's rule and standard limits" },
      { id: "df-2", title: "First Principles", subtitle: "Definition and basic derivatives" },
      { id: "df-3", title: "Chain Rule & Product Rule", subtitle: "Composite and product functions" },
      { id: "df-4", title: "Implicit Differentiation", subtitle: "Implicit relations and parametric forms" },
      { id: "df-5", title: "Applications of Derivatives", subtitle: "Maxima, Minima, Rate of change" },
    ],
  },
  {
    id: "mod-4",
    topicName: "Integration",
    isLocked: true,
    tasks: [
      { id: "ig-1", title: "Indefinite Integrals", subtitle: "Basic formulas and substitution" },
      { id: "ig-2", title: "Integration by Parts", subtitle: "LIATE rule and applications" },
      { id: "ig-3", title: "Definite Integrals", subtitle: "Properties and evaluation" },
    ],
  },
];

// ─── Certificate Generation ──────────────────────────────────────────
function generateCertificate(topicName: string, fullName: string) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const certId = `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  // Background
  doc.setFillColor(250, 250, 252);
  doc.rect(0, 0, w, h, "F");

  // Border
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(1.5);
  doc.roundedRect(10, 10, w - 20, h - 20, 4, 4, "S");
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, 14, w - 28, h - 28, 3, 3, "S");

  // Header ornament
  doc.setFillColor(99, 102, 241);
  doc.rect(w / 2 - 40, 10, 80, 3, "F");

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(99, 102, 241);
  doc.text("STUDYSYNC", w / 2, 35, { align: "center" });

  doc.setFontSize(28);
  doc.setTextColor(30, 30, 60);
  doc.text("Certificate of Completion", w / 2, 52, { align: "center" });

  // Divider
  doc.setDrawColor(200, 200, 220);
  doc.setLineWidth(0.3);
  doc.line(w / 2 - 60, 58, w / 2 + 60, 58);

  // Body
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

  // Footer info
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 170);
  doc.text(`Certificate ID: ${certId}`, w / 2, 145, { align: "center" });
  doc.text(`Date: ${today}`, w / 2, 152, { align: "center" });

  // Bottom ornament
  doc.setFillColor(99, 102, 241);
  doc.rect(w / 2 - 40, h - 13, 80, 3, "F");

  doc.save(`Certificate_${topicName.replace(/\s+/g, "_")}.pdf`);
}

// ─── Confetti Burst ──────────────────────────────────────────────────
function fireConfetti() {
  const end = Date.now() + 800;
  const frame = () => {
    confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 } });
    confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 } });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

// ─── Module Card Component ───────────────────────────────────────────
function ModuleCard({
  module,
  completedTasks,
  onToggleTask,
  studentName,
}: {
  module: StudyModule;
  completedTasks: Set<string>;
  onToggleTask: (taskId: string, moduleId: string, totalTasks: number) => void;
  studentName: string;
}) {
  const [expanded, setExpanded] = useState(!module.isLocked);
  const done = module.tasks.filter((t) => completedTasks.has(t.id)).length;
  const total = module.tasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const isComplete = done === total && !module.isLocked;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Card
        className={cn(
          "overflow-hidden transition-all duration-300",
          module.isLocked && "opacity-60",
          isComplete && "ring-2 ring-success/40"
        )}
      >
        {/* Header */}
        <CardHeader
          className="cursor-pointer select-none"
          onClick={() => !module.isLocked && setExpanded(!expanded)}
        >
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
              {!module.isLocked &&
                (expanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ))}
            </div>
          </div>
          {/* Mobile progress */}
          {!module.isLocked && (
            <div className="sm:hidden mt-3 flex items-center gap-2">
              <Progress value={pct} className="h-2 flex-1" />
              <span className="text-xs font-medium text-muted-foreground">{pct}%</span>
            </div>
          )}
        </CardHeader>

        {/* Tasks */}
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
                  const checked = completedTasks.has(task.id);
                  return (
                    <motion.button
                      key={task.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onToggleTask(task.id, module.id, total)}
                      className={cn(
                        "w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-200",
                        checked
                          ? "bg-success/5 border-success/20"
                          : "bg-card hover:bg-accent/50 border-border/50"
                      )}
                    >
                      <div
                        className={cn(
                          "mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                          checked
                            ? "bg-success border-success text-success-foreground"
                            : "border-border"
                        )}
                      >
                        {checked && <Check className="w-3 h-3" />}
                      </div>
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "text-sm font-medium transition-all",
                            checked && "line-through text-muted-foreground"
                          )}
                        >
                          {task.title}
                        </p>
                        <p
                          className={cn(
                            "text-xs mt-0.5 transition-all",
                            checked ? "text-muted-foreground/60 line-through" : "text-muted-foreground"
                          )}
                        >
                          {task.subtitle}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}

                {/* Certificate button */}
                {isComplete && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="pt-2"
                  >
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

// ─── Page Component ──────────────────────────────────────────────────
export default function StudyModules() {
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [studentName, setStudentName] = useState("");

  const totalAllTasks = studyModulesData.reduce((acc, m) => acc + (m.isLocked ? 0 : m.tasks.length), 0);
  const completedCount = [...completedTasks].filter((id) =>
    studyModulesData.some((m) => !m.isLocked && m.tasks.some((t) => t.id === id))
  ).length;
  const overallPct = totalAllTasks > 0 ? Math.round((completedCount / totalAllTasks) * 100) : 0;

  const handleToggleTask = useCallback(
    (taskId: string, moduleId: string, totalTasks: number) => {
      setCompletedTasks((prev) => {
        const next = new Set(prev);
        if (next.has(taskId)) {
          next.delete(taskId);
        } else {
          next.add(taskId);
          // Check if module just completed
          const mod = studyModulesData.find((m) => m.id === moduleId);
          if (mod) {
            const newDone = mod.tasks.filter((t) => next.has(t.id)).length;
            if (newDone === totalTasks) {
              fireConfetti();
              toast.success(`🎉 You completed "${mod.topicName}"! Download your certificate below.`);
            }
          }
        }
        return next;
      });
    },
    []
  );

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Study Modules</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete tasks, track your progress, and earn topic certificates.
        </p>
      </div>

      {/* Name input + overall progress */}
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
              <span className="text-xs font-bold text-primary">{overallPct}%</span>
            </div>
            <Progress value={overallPct} className="h-2.5" />
            <p className="text-[11px] text-muted-foreground mt-1">
              {completedCount} of {totalAllTasks} tasks completed
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Module list */}
      <div className="space-y-3">
        {studyModulesData.map((mod) => (
          <ModuleCard
            key={mod.id}
            module={mod}
            completedTasks={completedTasks}
            onToggleTask={handleToggleTask}
            studentName={studentName}
          />
        ))}
      </div>
    </div>
  );
}
