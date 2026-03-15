import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { studyModulesData, taskToModuleMap, allUnlockedTaskIds } from "@/lib/study-modules-data";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
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
  loading: boolean;
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
  const { user } = useAuth();
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(true);

  // Load completed tasks from DB on login
  useEffect(() => {
    if (!user) {
      setCompletedTasks(new Set());
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("study_progress")
        .select("task_id")
        .eq("user_id", user.id);
      if (data) {
        setCompletedTasks(new Set(data.map((r: any) => r.task_id)));
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const toggleTask = useCallback((taskId: string) => {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      const wasCompleted = next.has(taskId);

      if (wasCompleted) {
        next.delete(taskId);
        // Remove from DB
        if (user) {
          supabase
            .from("study_progress")
            .delete()
            .eq("user_id", user.id)
            .eq("task_id", taskId)
            .then();
        }
      } else {
        next.add(taskId);
        // Insert into DB
        if (user) {
          supabase
            .from("study_progress")
            .insert({ user_id: user.id, task_id: taskId })
            .then();
        }
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
  }, [user]);

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
        loading,
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
