import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Zap, Calendar, TrendingUp, Search, Trash2, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import StudyHeatmap from "@/components/StudyHeatmap";
import CourseTimeChart from "@/components/CourseTimeChart";
import DashboardTimer from "@/components/DashboardTimer";
import BottomSheet from "@/components/BottomSheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { triggerHaptic } from "@/lib/haptics";

interface Course {
  id: string;
  name: string;
  code: string | null;
  semester: string | null;
  color: string;
  professor_name?: string | null;
  professor_email?: string | null;
  office_hours?: string | null;
}

function SwipeableCourseCard({ course, onDelete }: { course: Course; onDelete: (c: Course) => void }) {
  const x = useMotionValue(0);
  const bg = useTransform(x, [-120, 0], ["hsl(var(--destructive))", "transparent"]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -100) {
      triggerHaptic("medium");
      onDelete(course);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <motion.div className="absolute inset-0 flex items-center justify-end pr-6 rounded-2xl" style={{ backgroundColor: bg }}>
        <Trash2 className="w-5 h-5 text-destructive-foreground" />
      </motion.div>
      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="swipe-card gpu-accelerated"
      >
        <Card className="glass-card-hover group rounded-2xl overflow-hidden relative p-6">
          <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: course.color }} />
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: course.color }} />
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold group-hover:text-primary transition-colors duration-200">{course.name}</h3>
              {course.code && <p className="text-xs text-muted-foreground mt-0.5">{course.code}</p>}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 touch-target opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-muted-foreground hover:text-destructive hidden md:flex"
              onClick={(e) => { e.stopPropagation(); onDelete(course); }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {course.semester && <span>{course.semester}</span>}
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Milestones</span>
            <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />Progress</span>
          </div>
          {course.professor_name && (
            <p className="text-xs text-muted-foreground border-t border-border/30 pt-3 mt-3">
              Prof. {course.professor_name}
            </p>
          )}
        </Card>
      </motion.div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({ name: "", code: "", semester: "" });
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);

  const fetchCourses = useCallback(async () => {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setCourses(data);
    setLoading(false);
  }, []);

  const { containerRef, refreshing } = usePullToRefresh(fetchCourses);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const addCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"];
    const { error } = await supabase.from("courses").insert({
      user_id: user.id,
      name: newCourse.name,
      code: newCourse.code || null,
      semester: newCourse.semester || null,
      color: colors[courses.length % colors.length],
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      triggerHaptic("light");
      setNewCourse({ name: "", code: "", semester: "" });
      setDialogOpen(false);
      fetchCourses();
    }
  };

  const deleteCourse = async () => {
    if (!deletingCourse) return;
    const { error } = await supabase.from("courses").delete().eq("id", deletingCourse.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      triggerHaptic("medium");
      toast({ title: "Track removed", description: `${deletingCourse.name} and all milestones have been deleted.` });
      fetchCourses();
    }
    setDeletingCourse(null);
  };

  return (
    <div ref={containerRef}>
      {/* Pull-to-refresh indicator */}
      <AnimatePresence>
        {refreshing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 48 }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-center"
          >
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Your mastery overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-muted-foreground touch-target hidden sm:flex"
            onClick={() => {
              const e = new KeyboardEvent("keydown", { key: "k", metaKey: true });
              document.dispatchEvent(e);
            }}
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline text-[10px] font-mono bg-secondary px-1.5 py-0.5 rounded ml-1">⌘K</kbd>
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 touch-target"><Plus className="w-4 h-4" />Add Track</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Mastery Track</DialogTitle></DialogHeader>
              <form onSubmit={addCourse} className="space-y-4">
                <div className="space-y-2">
                  <Label>Track Name</Label>
                  <Input value={newCourse.name} onChange={e => setNewCourse(p => ({ ...p, name: e.target.value }))} placeholder="Advanced Econometrics" required className="h-12" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Code</Label>
                    <Input value={newCourse.code} onChange={e => setNewCourse(p => ({ ...p, code: e.target.value }))} placeholder="ECON 420" className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label>Semester</Label>
                    <Input value={newCourse.semester} onChange={e => setNewCourse(p => ({ ...p, semester: e.target.value }))} placeholder="Spring 2026" className="h-12" />
                  </div>
                </div>
                <Button type="submit" className="w-full h-12">Create Track</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Deep Work Timer — Top of Dashboard */}
      <div className="mb-8">
        <DashboardTimer />
      </div>

      {/* Study Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm p-6">
          <CardHeader className="pb-2 p-0 mb-4">
            <CardTitle className="text-base font-semibold">Study Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <StudyHeatmap />
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm p-6">
          <CardHeader className="pb-2 p-0 mb-4">
            <CardTitle className="text-base font-semibold">Focus Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <CourseTimeChart />
          </CardContent>
        </Card>
      </div>

      {/* Mastery Tracks */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold tracking-tight">Mastery Tracks</h2>
        <p className="text-xs text-muted-foreground md:hidden">← swipe to delete</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 rounded-2xl bg-secondary/20 animate-pulse" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-success/10 mb-4">
            <Zap className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-lg font-semibold mb-2">No mastery tracks yet</h2>
          <p className="text-muted-foreground text-sm mb-6">Add your first track to begin</p>
          <Button onClick={() => setDialogOpen(true)} className="gap-2 touch-target"><Plus className="w-4 h-4" />Add Track</Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course, i) => (
            <motion.div key={course.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}>
              <SwipeableCourseCard course={course} onDelete={setDeletingCourse} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Confirmation — Bottom Sheet on mobile, AlertDialog on desktop */}
      {isMobile ? (
        <BottomSheet
          open={!!deletingCourse}
          onOpenChange={(open) => { if (!open) setDeletingCourse(null); }}
          title="Remove Mastery Track"
          description={`Are you sure you want to remove ${deletingCourse?.name} and all associated milestones? This action cannot be undone.`}
        >
          <div className="flex flex-col gap-3 pt-2">
            <Button variant="destructive" className="w-full h-12 text-base" onClick={deleteCourse}>
              Remove
            </Button>
            <Button variant="outline" className="w-full h-12 text-base" onClick={() => setDeletingCourse(null)}>
              Cancel
            </Button>
          </div>
        </BottomSheet>
      ) : (
        <Dialog open={!!deletingCourse} onOpenChange={(open) => { if (!open) setDeletingCourse(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Mastery Track</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to remove <span className="font-medium text-foreground">{deletingCourse?.name}</span> and all associated milestones? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setDeletingCourse(null)}>Cancel</Button>
              <Button variant="destructive" onClick={deleteCourse}>Remove</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
