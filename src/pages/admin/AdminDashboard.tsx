import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, ShieldCheck, ImageOff, Search, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import CourseFormDialog, { AdminCourse } from "@/components/admin/CourseFormDialog";

export default function AdminDashboard() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<AdminCourse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCourse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("admin_courses")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
    } else {
      setCourses((data ?? []) as AdminCourse[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    // Realtime sync
    const channel = supabase
      .channel("admin_courses_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_courses" },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const handleEdit = (c: AdminCourse) => {
    setEditingCourse(c);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditingCourse(null);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("admin_courses").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Course deleted");
      setCourses((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    }
  };

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    (c.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-4 border-b-2 border-double border-accent/40">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-accent" />
            <span className="text-[10px] uppercase tracking-[0.25em] text-accent/90">Office of the Registrar</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold">Course Administration</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all marketplace courses · {courses.length} total
          </p>
        </div>
        <Button onClick={handleAdd} size="lg">
          <Plus className="w-4 h-4" />
          Add Course
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-lg border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-lg">
          <p className="font-serif text-lg text-muted-foreground italic">
            {courses.length === 0 ? "No courses yet. Click 'Add Course' to begin." : "No courses match your search."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c, idx) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <Card className="overflow-hidden h-full flex flex-col group hover:shadow-md transition-shadow">
                <div className="relative aspect-video bg-muted overflow-hidden">
                  {c.image_url ? (
                    <img
                      src={c.image_url}
                      alt={c.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.currentTarget.parentElement as HTMLElement).innerHTML =
                          '<div class="w-full h-full flex items-center justify-center text-muted-foreground"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m2 2 20 20"/><path d="M10.41 10.41a2 2 0 1 1-2.83-2.83"/><path d="M13.5 13.5 6 21h12a2 2 0 0 0 2-2v-5.5"/><path d="M18 12V5a2 2 0 0 0-2-2H9.5"/></svg></div>';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <ImageOff className="w-8 h-8" />
                    </div>
                  )}
                  <Badge
                    variant={c.is_published ? "default" : "secondary"}
                    className="absolute top-2 right-2"
                  >
                    {c.is_published ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                    {c.is_published ? "Published" : "Draft"}
                  </Badge>
                </div>
                <CardContent className="flex-1 flex flex-col p-4">
                  <h3 className="font-serif text-lg font-semibold leading-tight line-clamp-2">{c.title}</h3>
                  {c.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2 flex-1">{c.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <div className="flex flex-col">
                      <span className="font-serif text-lg font-semibold text-primary">
                        ${Number(c.price).toFixed(2)}
                      </span>
                      {c.duration && (
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {c.duration}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(c)} title="Edit">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteTarget(c)}
                        title="Delete"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <CourseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        course={editingCourse}
        onSaved={load}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this course?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deleteTarget?.title}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
