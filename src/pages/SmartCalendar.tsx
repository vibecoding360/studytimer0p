import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Calendar as CalIcon, AlertTriangle, BookOpen } from "lucide-react";
import { format, parseISO, isAfter, isBefore, addDays } from "date-fns";

interface DateEvent {
  id: string;
  title: string;
  date: string | null;
  event_type: string;
  is_high_stakes: boolean;
  course_id: string;
  course_name?: string;
  course_color?: string;
}

export default function SmartCalendar() {
  const [events, setEvents] = useState<DateEvent[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [{ data: dates }, { data: courseData }] = await Promise.all([
        supabase.from("syllabus_dates").select("*").order("date", { ascending: true }),
        supabase.from("courses").select("*"),
      ]);
      if (courseData) setCourses(courseData);
      if (dates && courseData) {
        const mapped = dates.map(d => {
          const c = courseData.find((c: any) => c.id === d.course_id);
          return { ...d, course_name: c?.name, course_color: c?.color };
        });
        setEvents(mapped);
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  const filtered = filter === "all" ? events : events.filter(e => e.course_id === filter);
  const upcoming = filtered.filter(e => e.date && isAfter(parseISO(e.date), addDays(new Date(), -1)));
  const past = filtered.filter(e => e.date && isBefore(parseISO(e.date), new Date()));

  const groupByMonth = (evts: DateEvent[]) => {
    const groups: Record<string, DateEvent[]> = {};
    evts.forEach(e => {
      if (!e.date) return;
      const key = format(parseISO(e.date), "MMMM yyyy");
      (groups[key] = groups[key] || []).push(e);
    });
    return groups;
  };

  const months = groupByMonth(upcoming);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Smart Calendar</h1>
          <p className="text-muted-foreground text-sm mt-1">All your deadlines in one timeline</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-secondary/30 animate-pulse" />)}</div>
      ) : upcoming.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <CalIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No upcoming events. Parse a syllabus to populate your calendar.</p>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {Object.entries(months).map(([month, evts]) => (
            <div key={month}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{month}</h2>
              <div className="space-y-2">
                {evts.map((e, i) => (
                  <motion.div key={e.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                    <Card className="glass-card-hover">
                      <CardContent className="flex items-center gap-4 py-3 px-4">
                        <div className="text-center min-w-[48px]">
                          <p className="text-lg font-bold">{e.date ? format(parseISO(e.date), "d") : "?"}</p>
                          <p className="text-xs text-muted-foreground">{e.date ? format(parseISO(e.date), "EEE") : ""}</p>
                        </div>
                        <div className="w-0.5 h-8 rounded-full" style={{ backgroundColor: e.course_color || "#6366f1" }} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{e.title}</p>
                          <p className="text-xs text-muted-foreground">{e.course_name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {e.is_high_stakes && (
                            <Badge variant="destructive" className="gap-1 text-xs">
                              <AlertTriangle className="w-3 h-3" />High Stakes
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">{e.event_type}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
