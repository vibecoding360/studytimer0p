import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { studyModulesData, taskToModuleMap, allUnlockedTaskIds } from "@/lib/study-modules-data";
import confetti from "canvas-confetti";
import { toast } from "sonner";

interface StudyProgressContextType {
  completedTasks: Set<string>;
  toggleTask: (taskId: string) => void;
  isTaskCompleted: (taskId: string) => boolean;
  getModuleProgress: (moduleId: string) => { done: number; total: number; pct: number; isComplete: boolean };
  overallProgress: { done: number; total: number; pct: number };
  roadmapTasksDone: number;
  studentName: string;
  setStudentName: (name: string) => void;
}

const StudyProgressContext = createContext<StudyProgressContextType | null>(null);

function fireConfetti() {
  const end = Date.now() + 800;
  const frame = () => {
    confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 } });
    confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 } });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

export function StudyProgressProvider({ children }: { children: ReactNode }) {
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [studentName, setStudentName] = useState("");

  const toggleTask = useCallback((taskId: string) => {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
        // Check if module just completed
        const mod = taskToModuleMap.get(taskId);
        if (mod && !mod.isLocked) {
          const newDone = mod.tasks.filter((t) => next.has(t.id)).length;
          if (newDone === mod.tasks.length) {
            fireConfetti();
            toast.success(`🎉 You completed "${mod.topicName}"! Download your certificate in Study Modules.`);
          }
        }
      }
      return next;
    });
  }, []);

  const isTaskCompleted = useCallback((taskId: string) => completedTasks.has(taskId), [completedTasks]);

  const getModuleProgress = useCallback(
    (moduleId: string) => {
      const mod = studyModulesData.find((m) => m.id === moduleId);
      if (!mod || mod.isLocked) return { done: 0, total: 0, pct: 0, isComplete: false };
      const done = mod.tasks.filter((t) => completedTasks.has(t.id)).length;
      const total = mod.tasks.length;
      return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0, isComplete: done === total };
    },
    [completedTasks]
  );

  const completedCount = [...completedTasks].filter((id) => allUnlockedTaskIds.includes(id)).length;
  const totalAll = allUnlockedTaskIds.length;

  const overallProgress = {
    done: completedCount,
    total: totalAll,
    pct: totalAll > 0 ? Math.round((completedCount / totalAll) * 100) : 0,
  };

  // Roadmap tasks count = completed module tasks (proxy for commit evidence)
  const roadmapTasksDone = completedCount;

  return (
    <StudyProgressContext.Provider
      value={{
        completedTasks,
        toggleTask,
        isTaskCompleted,
        getModuleProgress,
        overallProgress,
        roadmapTasksDone,
        studentName,
        setStudentName,
      }}
    >
      {children}
    </StudyProgressContext.Provider>
  );
}

export function useStudyProgress() {
  const ctx = useContext(StudyProgressContext);
  if (!ctx) throw new Error("useStudyProgress must be used within StudyProgressProvider");
  return ctx;
}
