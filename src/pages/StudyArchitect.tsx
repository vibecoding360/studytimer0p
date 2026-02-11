import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Compass, Sparkles, Loader2, ExternalLink, BookOpen, Video, Database, GraduationCap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RoadmapWeek {
  week_number: number;
  focus_area: string;
  tasks: string[];
  effort_level: string;
}

interface Resource {
  title: string;
  url?: string;
  resource_type: string;
  source: string;
  topic: string;
}

export default function StudyArchitect() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [generating, setGenerating] = useState(false);
  const [roadmap, setRoadmap] = useState<RoadmapWeek[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [existingRoadmap, setExistingRoadmap] = useState<any[]>([]);
  const [existingResources, setExistingResources] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("courses").select("*").then(({ data }) => {
      if (data) setCourses(data);
    });
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    Promise.all([
      supabase.from("study_roadmap").select("*").eq("course_id", selectedCourse).order("week_number"),
      supabase.from("resources").select("*").eq("course_id", selectedCourse),
    ]).then(([{ data: rm }, { data: res }]) => {
      if (rm?.length) setExistingRoadmap(rm);
      else setExistingRoadmap([]);
      if (res?.length) setExistingResources(res);
      else setExistingResources([]);
    });
  }, [selectedCourse]);

  const generatePlan = async () => {
    if (!selectedCourse || !user) return;
    setGenerating(true);
    try {
      // Fetch syllabus data for this course
      const [{ data: dates }, { data: weights }, { data: readings }] = await Promise.all([
        supabase.from("syllabus_dates").select("*").eq("course_id", selectedCourse),
        supabase.from("grading_weights").select("*").eq("course_id", selectedCourse),
        supabase.from("readings").select("*").eq("course_id", selectedCourse),
      ]);

      const course = courses.find(c => c.id === selectedCourse);
      const syllabusContext = `Course: ${course?.name} (${course?.code || ""})\n\nKey Dates:\n${JSON.stringify(dates || [])}\n\nGrading Weights:\n${JSON.stringify(weights || [])}\n\nReadings:\n${JSON.stringify(readings || [])}`;

      const { data, error } = await supabase.functions.invoke("parse-syllabus", {
        body: { text: syllabusContext, courseName: course?.name, action: "study_architect" },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setRoadmap(data.roadmap || []);
      setResources(data.resources || []);

      // Save to DB
      if (data.roadmap?.length) {
        await supabase.from("study_roadmap").delete().eq("course_id", selectedCourse);
        await supabase.from("study_roadmap").insert(
          data.roadmap.map((w: RoadmapWeek) => ({
            course_id: selectedCourse,
            user_id: user.id,
            week_number: w.week_number,
            focus_area: w.focus_area,
            tasks: w.tasks,
            effort_level: w.effort_level,
          }))
        );
      }
      if (data.resources?.length) {
        await supabase.from("resources").delete().eq("course_id", selectedCourse);
        await supabase.from("resources").insert(
          data.resources.map((r: Resource) => ({
            course_id: selectedCourse,
            user_id: user.id,
            title: r.title,
            url: r.url,
            resource_type: r.resource_type,
            source: r.source,
            topic: r.topic,
          }))
        );
      }

      toast({ title: "Study plan generated!", description: `${data.roadmap?.length || 0} weeks + ${data.resources?.length || 0} resources` });
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const displayRoadmap = roadmap.length ? roadmap : existingRoadmap.map(r => ({ ...r, tasks: r.tasks || [] }));
  const displayResources = resources.length ? resources : existingResources;

  const effortColor: Record<string, string> = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-primary/10 text-primary",
    high: "bg-warning/10 text-warning",
    critical: "bg-destructive/10 text-destructive",
  };

  const resourceIcon = (type: string) => {
    switch (type) {
      case "video": return <Video className="w-4 h-4" />;
      case "database": return <Database className="w-4 h-4" />;
      case "course": return <GraduationCap className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-1">Study Architect</h1>
      <p className="text-muted-foreground text-sm mb-6">AI-powered study roadmaps and resources</p>

      <div className="flex items-center gap-4 mb-6">
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Select a course" /></SelectTrigger>
          <SelectContent>
            {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={generatePlan} disabled={generating || !selectedCourse} className="gap-2">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {generating ? "Generating..." : "Generate Study Plan"}
        </Button>
      </div>

      {selectedCourse && (displayRoadmap.length > 0 || displayResources.length > 0) ? (
        <Tabs defaultValue="roadmap">
          <TabsList className="mb-6">
            <TabsTrigger value="roadmap">15-Week Roadmap</TabsTrigger>
            <TabsTrigger value="resources">Resource Hub</TabsTrigger>
          </TabsList>

          <TabsContent value="roadmap">
            <div className="space-y-3">
              {displayRoadmap.map((week, i) => (
                <motion.div key={week.week_number} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className="glass-card-hover">
                    <CardContent className="flex items-start gap-4 py-4 px-5">
                      <div className="text-center min-w-[48px]">
                        <p className="text-xs text-muted-foreground uppercase">Week</p>
                        <p className="text-xl font-bold">{week.week_number}</p>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold">{week.focus_area}</p>
                          <Badge className={`text-xs ${effortColor[week.effort_level] || ""}`}>{week.effort_level}</Badge>
                        </div>
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                          {(Array.isArray(week.tasks) ? week.tasks : []).map((t: string, j: number) => (
                            <li key={j} className="flex items-start gap-1.5">
                              <span className="mt-1.5 w-1 h-1 rounded-full bg-muted-foreground shrink-0" />
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="resources">
            <div className="grid gap-3 md:grid-cols-2">
              {displayResources.map((r, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className="glass-card-hover">
                    <CardContent className="flex items-start gap-3 py-4 px-5">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                        {resourceIcon(r.resource_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{r.title}</p>
                        <p className="text-xs text-muted-foreground">{r.source} · {r.topic}</p>
                      </div>
                      {r.url && (
                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      ) : selectedCourse ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <Compass className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-sm">No study plan yet. Click "Generate Study Plan" to create one.</p>
          <p className="text-xs text-muted-foreground mt-1">Make sure you've parsed a syllabus for this course first.</p>
        </motion.div>
      ) : null}
    </div>
  );
}
