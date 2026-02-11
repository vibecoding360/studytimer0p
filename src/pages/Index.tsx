import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, BookOpen, Calendar, TrendingUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface Course {
  id: string;
  name: string;
  code: string | null;
  semester: string | null;
  color: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({ name: "", code: "", semester: "" });

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setCourses(data);
    setLoading(false);
  };

  useEffect(() => { fetchCourses(); }, []);

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
      setNewCourse({ name: "", code: "", semester: "" });
      setDialogOpen(false);
      fetchCourses();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Your semester at a glance</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" />Add Course</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add a New Course</DialogTitle></DialogHeader>
            <form onSubmit={addCourse} className="space-y-4">
              <div className="space-y-2">
                <Label>Course Name</Label>
                <Input value={newCourse.name} onChange={e => setNewCourse(p => ({ ...p, name: e.target.value }))} placeholder="Advanced Econometrics" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Course Code</Label>
                  <Input value={newCourse.code} onChange={e => setNewCourse(p => ({ ...p, code: e.target.value }))} placeholder="ECON 420" />
                </div>
                <div className="space-y-2">
                  <Label>Semester</Label>
                  <Input value={newCourse.semester} onChange={e => setNewCourse(p => ({ ...p, semester: e.target.value }))} placeholder="Spring 2026" />
                </div>
              </div>
              <Button type="submit" className="w-full">Create Course</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 rounded-xl bg-secondary/30 animate-pulse" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold mb-2">No courses yet</h2>
          <p className="text-muted-foreground text-sm mb-6">Add your first course to get started</p>
          <Button onClick={() => setDialogOpen(true)} className="gap-2"><Plus className="w-4 h-4" />Add Course</Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course, i) => (
            <motion.div key={course.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card
                className="glass-card-hover cursor-pointer group"
                onClick={() => navigate(`/parse?course=${course.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: course.color }} />
                    <div>
                      <CardTitle className="text-base">{course.name}</CardTitle>
                      {course.code && <p className="text-xs text-muted-foreground mt-0.5">{course.code}</p>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {course.semester && <span>{course.semester}</span>}
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Dates</span>
                    <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />Grades</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
