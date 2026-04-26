import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Clock, ImageOff, Search, Sparkles, Trophy, Users, Star, Award, TrendingUp, ShieldCheck, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

const STREAMS = [
  { key: "all", label: "All Programmes" },
  { key: "jee", label: "JEE Main + Adv" },
  { key: "neet", label: "NEET UG" },
  { key: "foundation", label: "Foundation" },
  { key: "olympiad", label: "Olympiads" },
];

// Pseudo-classify a course into a stream by keywords for badge color
function streamOf(title: string, desc?: string | null): "jee" | "neet" | "foundation" | "olympiad" {
  const t = `${title} ${desc ?? ""}`.toLowerCase();
  if (/(neet|biology|aiims|medical)/.test(t)) return "neet";
  if (/(foundation|class\s?[6-9]|class\s?10|olympia)/.test(t) && /olymp/.test(t) === false) return "foundation";
  if (/olympia/.test(t)) return "olympiad";
  return "jee";
}

const STREAM_BADGE: Record<string, string> = {
  jee: "badge-jee",
  neet: "badge-neet",
  foundation: "badge-foundation",
  olympiad: "badge-topper",
};

const STREAM_LABEL: Record<string, string> = {
  jee: "JEE",
  neet: "NEET",
  foundation: "Foundation",
  olympiad: "Olympiad",
};

export default function Courses() {
  const [courses, setCourses] = useState<PublicCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeStream, setActiveStream] = useState<string>("all");
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

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchSearch =
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        (c.description ?? "").toLowerCase().includes(search.toLowerCase());
      const matchStream = activeStream === "all" || streamOf(c.title, c.description) === activeStream;
      return matchSearch && matchStream;
    });
  }, [courses, search, activeStream]);

  const handleEnroll = async () => {
    if (!enrollTarget) return;
    setEnrolling(true);
    await new Promise((r) => setTimeout(r, 500));
    setEnrolling(false);
    toast.success(`You've joined "${enrollTarget.title}"! Check your email for details.`);
    setEnrollTarget(null);
  };

  return (
    <div className="space-y-10">
      {/* === HERO === */}
      <section className="institute-hero relative overflow-hidden rounded-lg border-2 border-accent/40 px-6 md:px-10 py-10 md:py-14">
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: "radial-gradient(hsl(var(--accent)) 1.2px, transparent 1.2px)",
          backgroundSize: "22px 22px",
        }} />
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-accent/15 border border-accent/40 rounded-full px-3 py-1 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-[11px] uppercase tracking-[0.2em] text-accent font-semibold">Admissions OPEN · Batch 2026</span>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-bold leading-[1.05] tracking-tight">
            Choose Your Path to <span className="text-accent">AIR 1</span>.
          </h1>
          <div className="double-rule my-5 w-32" />
          <p className="text-base md:text-lg text-primary-foreground/85 font-serif italic max-w-2xl">
            Industry-leading classroom, hybrid and online programmes — designed by India's most decorated faculty for JEE, NEET, Olympiads and Foundation aspirants.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <Button className="institute-cta h-11 px-6 font-bold uppercase tracking-wider gap-2">
              <Phone className="w-4 h-4" /> Book Free Counselling
            </Button>
            <Button variant="outline" className="h-11 px-6 bg-transparent border-accent/60 text-accent-foreground hover:bg-accent/15">
              View Scholarship Test
            </Button>
          </div>
        </div>
      </section>

      {/* === STATS STRIP === */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Trophy, num: "18,000+", label: "Selections in 2024" },
          { icon: Award, num: "AIR 1", label: "JEE Advanced 2024" },
          { icon: Users, num: "450+", label: "IIT/AIIMS Faculty" },
          { icon: TrendingUp, num: "98.4%", label: "Selection Rate" },
        ].map(({ icon: Icon, num, label }) => (
          <div key={label} className="stat-card">
            <Icon className="w-5 h-5 text-accent mx-auto mb-1.5" />
            <p className="stat-number">{num}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </section>

      {/* === CATALOGUE HEADER === */}
      <section>
        <div className="pb-4 border-b-2 border-double border-accent/40">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-accent" />
            <span className="text-[10px] uppercase tracking-[0.25em] text-accent/90 font-semibold">Course Catalogue · 2026</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl md:text-3xl font-bold">Our Premier Programmes</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Hand-crafted curricula for every aspirant. Anyone can enroll.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              100% Money-back guarantee within 7 days
            </div>
          </div>
        </div>

        {/* Filter pills + search */}
        <div className="mt-6 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {STREAMS.map((s) => {
              const active = activeStream === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setActiveStream(s.key)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border-2 transition-all
                    ${active
                      ? "bg-primary text-primary-foreground border-primary shadow-md"
                      : "bg-card text-muted-foreground border-border hover:border-accent hover:text-primary"}
                  `}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
          <div className="relative md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
        </div>
      </section>

      {/* === COURSE GRID === */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 rounded-lg border-2 border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-lg">
          <BookOpen className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
          <p className="font-serif text-lg text-muted-foreground italic">
            {courses.length === 0
              ? "New batches launching soon. Check back shortly."
              : "No courses match your filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c, idx) => {
            const stream = streamOf(c.title, c.description);
            const isTopper = idx < 2; // mark first two as bestseller
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Card className="overflow-hidden h-full flex flex-col group hover:shadow-xl hover:-translate-y-1 transition-all duration-200 border-2 hover:border-accent/60 relative">
                  {isTopper && <div className="ribbon">Bestseller</div>}
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
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gradient-to-br from-primary/10 to-accent/10">
                        <ImageOff className="w-8 h-8" />
                      </div>
                    )}
                    {/* Stream badge */}
                    <span className={`absolute top-2 right-2 ${STREAM_BADGE[stream]}`}>
                      {STREAM_LABEL[stream]}
                    </span>
                    {Number(c.price) === 0 && (
                      <span className="absolute bottom-2 left-2 badge-topper">Free Trial</span>
                    )}
                  </div>
                  <CardContent className="flex-1 flex flex-col p-4">
                    {/* Rating row */}
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-accent text-accent" />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">4.9 · 2,400+ enrolled</span>
                    </div>
                    <h3 className="font-serif text-lg font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {c.title}
                    </h3>
                    {c.description && (
                      <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 flex-1">
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
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Live + Recorded
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t-2 border-dashed border-border">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Course Fee</p>
                        <p className="font-serif text-xl font-bold text-primary">
                          {Number(c.price) === 0 ? "Free" : `₹${Number(c.price).toLocaleString("en-IN")}`}
                        </p>
                      </div>
                      <Button size="sm" onClick={() => setEnrollTarget(c)} className="institute-cta font-bold uppercase tracking-wider">
                        Enroll Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* === FACULTY / TRUST SECTION === */}
      <section className="bg-card border-2 border-border rounded-lg p-6 md:p-8">
        <div className="text-center mb-6">
          <span className="text-[10px] uppercase tracking-[0.25em] text-accent font-semibold">Why MatrixMindset</span>
          <h2 className="font-serif text-2xl md:text-3xl font-bold mt-1">Faculty That Transforms Aspirants Into Toppers</h2>
          <div className="gold-rule w-32 mx-auto mt-3" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: Trophy, title: "Proven Results", body: "Over 18,000 selections in JEE, NEET and Olympiads in 2024 alone." },
            { icon: Users, title: "IIT/AIIMS Faculty", body: "Learn from 450+ alumni of the country's most elite institutions." },
            { icon: Award, title: "Personalised Mentoring", body: "1-on-1 doubt sessions, weekly tests and AIR-prediction analytics." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="text-center p-5 rounded-md border border-border hover:border-accent/60 transition-colors">
              <div className="seal w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Icon className="w-5 h-5" />
              </div>
              <p className="font-serif text-lg font-bold">{title}</p>
              <p className="text-sm text-muted-foreground mt-1">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Enroll confirmation */}
      <Dialog open={!!enrollTarget} onOpenChange={(o) => !o && setEnrollTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Confirm Your Enrollment</DialogTitle>
            <DialogDescription>
              You're about to enroll in <strong>{enrollTarget?.title}</strong>
              {enrollTarget && Number(enrollTarget.price) > 0
                ? ` for ₹${Number(enrollTarget.price).toLocaleString("en-IN")}`
                : " for free"}. Our admissions team will reach out within 24 hours.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEnrollTarget(null)} disabled={enrolling}>
              Cancel
            </Button>
            <Button onClick={handleEnroll} disabled={enrolling} className="institute-cta font-bold uppercase tracking-wider">
              {enrolling ? "Joining..." : "Confirm Enrollment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
