import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useStudyProgress } from "@/lib/study-progress-context";
import { studyModulesData } from "@/lib/study-modules-data";
import type { PlanItem } from "@/lib/planning";

interface TodaysPlanProps {
  planItems: PlanItem[];
}

export default function TodaysPlan({ planItems }: TodaysPlanProps) {
  const { completedTasks, toggleTask, isTaskCompleted, overallProgress } = useStudyProgress();
  const [showModuleTasks, setShowModuleTasks] = useState(true);

  // Get all unlocked module tasks as interactive items
  const moduleTasks = studyModulesData
    .filter((m) => !m.isLocked)
    .flatMap((m) =>
      m.tasks.map((t) => ({
        ...t,
        moduleName: m.topicName,
        moduleId: m.id,
      }))
    );

  const todayTasksCompleted = [...completedTasks].length;
  const todayTasksTotal = moduleTasks.length;
  const pct = todayTasksTotal > 0 ? Math.round((todayTasksCompleted / todayTasksTotal) * 100) : 0;

  return (
    <Card className="rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Today&apos;s Plan
        </CardTitle>
        {/* Progress bar */}
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Daily progress</span>
            <span className="font-mono font-medium text-primary">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2" />
          <p className="text-[11px] text-muted-foreground">
            {todayTasksCompleted} of {todayTasksTotal} tasks completed
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {/* Auto-generated plan items (non-interactive context) */}
        {planItems.length > 0 && (
          <div className="space-y-2 mb-3">
            {planItems.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-border/40 p-3 bg-card hover:shadow-md transition-shadow duration-200"
              >
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.detail}</p>
              </div>
            ))}
          </div>
        )}

        {/* Module tasks toggle */}
        <button
          onClick={() => setShowModuleTasks(!showModuleTasks)}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
        >
          {showModuleTasks ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          Module Tasks ({todayTasksCompleted}/{todayTasksTotal})
        </button>

        {/* Interactive module task checklist */}
        <AnimatePresence>
          {showModuleTasks && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-1.5 overflow-hidden"
            >
              {studyModulesData
                .filter((m) => !m.isLocked)
                .map((mod) => (
                  <div key={mod.id} className="space-y-1">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-2">
                      {mod.topicName}
                    </p>
                    {mod.tasks.map((task) => {
                      const checked = isTaskCompleted(task.id);
                      return (
                        <motion.button
                          key={task.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => toggleTask(task.id)}
                          className={cn(
                            "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all duration-200 hover:shadow-md",
                            checked
                              ? "bg-success/5 border-success/20"
                              : "bg-card hover:bg-accent/50 border-border/40"
                          )}
                        >
                          <div
                            className={cn(
                              "w-4.5 h-4.5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                              checked
                                ? "bg-success border-success text-success-foreground"
                                : "border-border"
                            )}
                            style={{ width: 18, height: 18 }}
                          >
                            {checked && <Check className="w-3 h-3" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                "text-xs font-medium transition-all truncate",
                                checked && "line-through text-muted-foreground"
                              )}
                            >
                              {task.title}
                            </p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                ))}
            </motion.div>
          )}
        </AnimatePresence>

        {moduleTasks.length === 0 && planItems.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Add syllabus dates, grading data, and roadmap tasks to auto-generate your plan.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
