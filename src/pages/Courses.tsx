import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Clock, ImageOff, Search, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

interface PublicCourse {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  price: number;
  duration: string | null;
  is_published: boolean;
  created_at: string;
}

export default function Courses() {
  const [courses, setCourses] = useState<PublicCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [enrollTarget, setEnrollTarget] = useState<PublicCourse | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data, error } = await supabase
        .from("admin_courses")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (!active) return;
      if (error) toast.error(error.message);
      else setCourses((data ?? []) as PublicCourse[]);
      setLoading(false);
    };
    load();

    // Realtime updates so visitors see new admin postings immediately
    const channel = supabase
      .channel("public_courses_feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_courses" },
        () => load()
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    (c.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleEnroll = async () => {
    if (!enrollTarget) return;
    setEnrolling(true);
    // Simulated enrollment confirmation (no enrollments table yet)
    await new Promise((r) => setTimeout(r, 500));
    setEnrolling(false);
    toast.success(`You've joined "${enrollTarget.title}"! Check your email for details.`);
    setEnrollTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b-2 border-double border-accent/40">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="text-[10px] uppercase tracking-[0.25em] text-accent/90">Course Catalogue</span>
        </div>
        <h1 className="font-serif text-3xl md:text-4xl font-semibold">Join a Course</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse all courses currently offered by the Office of the Registrar. Anyone is welcome to enroll.
        </p>
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
            <div key={i} className="h-72 rounded-lg border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-lg">
          <BookOpen className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
          <p className="font-serif text-lg text-muted-foreground italic">
            {courses.length === 0
              ? "No courses are currently published. Please check back soon."
              : "No courses match your search."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c, idx) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <Card className="overflow-hidden h-full flex flex-col group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                <div className="relative aspect-video bg-muted overflow-hidden">
                  {c.image_url ? (
                    <img
                      src={c.image_url}
                      alt={c.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.currentTarget.parentElement as HTMLElement).innerHTML =
                          '<div class="w-full h-full flex items-center justify-center text-muted-foreground"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></div>';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <ImageOff className="w-8 h-8" />
                    </div>
                  )}
                  {Number(c.price) === 0 && (
                    <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground hover:bg-accent">
                      Free
                    </Badge>
                  )}
                </div>
                <CardContent className="flex-1 flex flex-col p-4">
                  <h3 className="font-serif text-lg font-semibold leading-tight line-clamp-2">
                    {c.title}
                  </h3>
                  {c.description && (
                    <p className="text-sm text-muted-foreground mt-1.5 line-clamp-3 flex-1">
                      {c.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                    {c.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {c.duration}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <span className="font-serif text-lg font-semibold text-primary">
                      {Number(c.price) === 0 ? "Free" : `$${Number(c.price).toFixed(2)}`}
                    </span>
                    <Button size="sm" onClick={() => setEnrollTarget(c)}>
                      Join Course
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Enroll confirmation */}
      <Dialog open={!!enrollTarget} onOpenChange={(o) => !o && setEnrollTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Join this course?</DialogTitle>
            <DialogDescription>
              You're about to enroll in <strong>{enrollTarget?.title}</strong>
              {enrollTarget && Number(enrollTarget.price) > 0
                ? ` for $${Number(enrollTarget.price).toFixed(2)}`
                : " for free"}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEnrollTarget(null)} disabled={enrolling}>
              Cancel
            </Button>
            <Button onClick={handleEnroll} disabled={enrolling}>
              {enrolling ? "Joining..." : "Confirm Enrollment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
