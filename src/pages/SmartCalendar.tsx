import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { Calendar as CalIcon, AlertTriangle, CheckCircle2, Plus, Trash2, Pencil } from "lucide-react";
import { format, parseISO, isAfter, isBefore, addDays } from "date-fns";
import { toast } from "sonner";

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

const EVENT_TYPES = ["assignment", "exam", "quiz", "project", "reading", "lecture", "other"];

export default function SmartCalendar() {
  const [events, setEvents] = useState<DateEvent[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // form state
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventType, setEventType] = useState("assignment");
  const [courseId, setCourseId] = useState("");
  const [highStakes, setHighStakes] = useState(false);

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
      setEvents(mapped as DateEvent[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const resetForm = () => {
    setTitle("");
    setEventDate("");
    setEventType("assignment");
    setCourseId(courses[0]?.id || "");
    setHighStakes(false);
  };

  const openDialog = () => {
    setEditingId(null);
    resetForm();
    setCourseId(courses[0]?.id || "");
    setDialogOpen(true);
  };

  const openEditDialog = (e: DateEvent) => {
    setEditingId(e.id);
    setTitle(e.title);
    setEventDate(e.date || "");
    setEventType(e.event_type || "assignment");
    setCourseId(e.course_id);
    setHighStakes(!!e.is_high_stakes);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) return toast.error("Title is required");
    if (!eventDate) return toast.error("Date is required");
    if (!courseId) return toast.error("Please select a course (create one first if none exist)");

    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      toast.error("You must be logged in");
      setSaving(false);
      return;
    }

    const payload = {
      title: title.trim(),
      date: eventDate,
      event_type: eventType,
      course_id: courseId,
      is_high_stakes: highStakes,
    };

    const { error } = editingId
      ? await supabase.from("syllabus_dates").update(payload).eq("id", editingId)
      : await supabase.from("syllabus_dates").insert({ ...payload, user_id: userData.user.id });

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editingId ? "Event updated" : "Event created");
    setDialogOpen(false);
    setEditingId(null);
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("syllabus_dates").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Event deleted");
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const filtered = filter === "all" ? events : events.filter(e => e.course_id === filter);
  const now = new Date();
  const upcoming = filtered.filter(e => e.date && isAfter(parseISO(e.date), addDays(now, -1)));
  const past = filtered.filter(e => e.date && isBefore(parseISO(e.date), addDays(now, -1)));

  const groupByMonth = (evts: DateEvent[]) => {
    const groups: Record<string, DateEvent[]> = {};
    evts.forEach(e => {
      if (!e.date) return;
      const key = format(parseISO(e.date), "MMMM yyyy");
      (groups[key] = groups[key] || []).push(e);
    });
    return groups;
  };

  const renderEvents = (evts: DateEvent[], isPast = false) => {
    if (evts.length === 0) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <CalIcon className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">
            {isPast ? "No past events." : "No upcoming events. Create one or parse a syllabus."}
          </p>
        </motion.div>
      );
    }

    const months = groupByMonth(evts);
    return (
      <div className="space-y-6">
        {Object.entries(months).map(([month, items]) => (
          <div key={month}>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{month}</h2>
            <div className="space-y-2">
              {items.map((e, i) => (
                <motion.div key={e.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className={`glass-card-hover group ${isPast ? "opacity-60" : ""}`}>
                    <CardContent className="flex items-center gap-4 py-3 px-4">
                      <div className="text-center min-w-[48px]">
                        <p className="text-lg font-bold">{e.date ? format(parseISO(e.date), "d") : "?"}</p>
                        <p className="text-xs text-muted-foreground">{e.date ? format(parseISO(e.date), "EEE") : ""}</p>
                      </div>
                      <div className="w-0.5 h-8 rounded-full" style={{ backgroundColor: e.course_color || "#6366f1" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{e.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{e.course_name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isPast && <CheckCircle2 className="w-4 h-4 text-primary" />}
                        {e.is_high_stakes && (
                          <Badge variant="destructive" className="gap-1 text-xs">
                            <AlertTriangle className="w-3 h-3" />High Stakes
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">{e.event_type}</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => openEditDialog(e)}
                          aria-label="Edit event"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDelete(e.id)}
                          aria-label="Delete event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Smart Calendar</h1>
          <p className="text-muted-foreground text-sm mt-1">All your deadlines in one timeline</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openDialog} className="gap-2">
                <Plus className="w-4 h-4" /> New Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Calendar Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Midterm Exam" maxLength={200} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={eventType} onValueChange={setEventType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {EVENT_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Course</Label>
                  {courses.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No courses found. Add a course first via Parse Syllabus.</p>
                  ) : (
                    <Select value={courseId} onValueChange={setCourseId}>
                      <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                      <SelectContent>
                        {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label htmlFor="hs">High Stakes</Label>
                    <p className="text-xs text-muted-foreground">Mark as critical deadline</p>
                  </div>
                  <Switch id="hs" checked={highStakes} onCheckedChange={setHighStakes} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={saving}>{saving ? "Creating..." : "Create Event"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-secondary/30 animate-pulse" />)}</div>
      ) : (
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
            <TabsTrigger value="all">All ({filtered.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming">{renderEvents(upcoming)}</TabsContent>
          <TabsContent value="past">{renderEvents(past, true)}</TabsContent>
          <TabsContent value="all">{renderEvents(filtered)}</TabsContent>
        </Tabs>
      )}
    </div>
  );
}
