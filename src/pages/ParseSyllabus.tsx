import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Check, FileText, Loader2 } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import UploadZone from "@/components/UploadZone";
import ProfessorCard from "@/components/ProfessorCard";

interface ParsedData {
  dates: Array<{ title: string; date?: string; event_type: string; is_high_stakes: boolean }>;
  grading_weights: Array<{ category: string; weight: number }>;
  readings: Array<{ title: string; author?: string; chapter?: string; due_date?: string }>;
}

export default function ParseSyllabus() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState(searchParams.get("course") || "");
  const [syllabusText, setSyllabusText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedData | null>(null);
  const [saving, setSaving] = useState(false);
  const [profName, setProfName] = useState("");
  const [profEmail, setProfEmail] = useState("");
  const [officeHours, setOfficeHours] = useState("");

  useEffect(() => {
    supabase.from("courses").select("*").then(({ data }) => {
      if (data) setCourses(data);
    });
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    const course = courses.find(c => c.id === selectedCourse);
    if (course) {
      setProfName(course.professor_name || "");
      setProfEmail(course.professor_email || "");
      setOfficeHours(course.office_hours || "");
    }
  }, [selectedCourse, courses]);

  const handleFile = useCallback(async (file: File) => {
    if (file.type === "text/plain") {
      const text = await file.text();
      setSyllabusText(text);
    } else {
      toast.error("Please paste your syllabus text for now. Full PDF parsing coming soon.");
    }
  }, []);

  const parseSyllabus = async () => {
    if (!syllabusText.trim()) return;
    setParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-syllabus", {
        body: { text: syllabusText, action: "parse" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setParsed(data);
      toast.success(`Found ${data.dates?.length || 0} dates, ${data.grading_weights?.length || 0} weights, ${data.readings?.length || 0} readings.`);
    } catch (err: any) {
      toast.error(err.message || "Parse failed");
    } finally {
      setParsing(false);
    }
  };

  const saveProfessor = async () => {
    if (!selectedCourse) return;
    await supabase.from("courses").update({
      professor_name: profName || null,
      professor_email: profEmail || null,
      office_hours: officeHours || null,
    }).eq("id", selectedCourse);
  };

  const saveToDatabase = async () => {
    if (!parsed || !selectedCourse || !user) return;
    setSaving(true);
    try {
      if (parsed.dates?.length) {
        const res = await supabase.from("syllabus_dates").insert(
          parsed.dates.map(d => ({ ...d, course_id: selectedCourse, user_id: user.id }))
        );
        if (res.error) throw res.error;
      }
      if (parsed.grading_weights?.length) {
        const res = await supabase.from("grading_weights").insert(
          parsed.grading_weights.map(w => ({ ...w, course_id: selectedCourse, user_id: user.id }))
        );
        if (res.error) throw res.error;
      }
      if (parsed.readings?.length) {
        const res = await supabase.from("readings").insert(
          parsed.readings.map(r => ({ ...r, course_id: selectedCourse, user_id: user.id }))
        );
        if (res.error) throw res.error;
      }

      await saveProfessor();

      toast.success("Mastery Roadmap Saved Successfully");
      setTimeout(() => navigate("/"), 600);
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const eventTypeBadge = (type: string, highStakes: boolean) => {
    if (highStakes) return <Badge variant="destructive" className="text-xs">High Stakes</Badge>;
    const map: Record<string, string> = { midterm: "warning", final: "destructive", quiz: "secondary", assignment: "default", project: "outline" };
    return <Badge variant={(map[type] || "secondary") as any} className="text-xs">{type}</Badge>;
  };

  const saveDisabled = saving || !selectedCourse;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-1">AI Roadmap Parser</h1>
      <p className="text-muted-foreground text-sm mb-6">Upload or paste your roadmap to extract structured data</p>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger><SelectValue placeholder="Select a Mastery Track" /></SelectTrigger>
            <SelectContent>
              {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <UploadZone
            onFile={handleFile}
            onTextChange={setSyllabusText}
            text={syllabusText}
            parsing={parsing}
            parsed={!!parsed}
            onParse={parseSyllabus}
          />

          {selectedCourse && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Professor Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Name</Label>
                  <Input value={profName} onChange={e => setProfName(e.target.value)} placeholder="Dr. Smith" className="bg-secondary/30 border-border/30 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input value={profEmail} onChange={e => setProfEmail(e.target.value)} placeholder="smith@uni.edu" className="bg-secondary/30 border-border/30 text-sm" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Office Hours</Label>
                <Input value={officeHours} onChange={e => setOfficeHours(e.target.value)} placeholder="Mon/Wed 2-4pm, Room 312" className="bg-secondary/30 border-border/30 text-sm" />
              </div>
            </motion.div>
          )}
        </div>

        <div className="space-y-4">
          <ProfessorCard professorName={profName} professorEmail={profEmail} officeHours={officeHours} />

          {parsed && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><FileText className="w-4 h-4" />Key Dates ({parsed.dates?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-48 overflow-auto">
                    {parsed.dates?.map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-border/30 last:border-0">
                        <span>{d.title}</span>
                        <div className="flex items-center gap-2">
                          {d.date && <span className="text-xs text-muted-foreground">{d.date}</span>}
                          {eventTypeBadge(d.event_type, d.is_high_stakes)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Grading Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {parsed.grading_weights?.map((w, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span>{w.category}</span>
                        <span className="font-mono text-primary">{w.weight}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Readings ({parsed.readings?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-40 overflow-auto">
                    {parsed.readings?.map((r, i) => (
                      <div key={i} className="text-sm py-1 border-b border-border/30 last:border-0">
                        <p className="font-medium">{r.title}</p>
                        {r.author && <p className="text-xs text-muted-foreground">{r.author}{r.chapter ? ` — ${r.chapter}` : ""}</p>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="w-full inline-block">
                    <Button onClick={saveToDatabase} disabled={saveDisabled} className="w-full gap-2">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      {saving ? "Saving..." : "Save to Mastery Track"}
                    </Button>
                  </span>
                </TooltipTrigger>
                {!selectedCourse && (
                  <TooltipContent>
                    <p>Please select a Mastery Track first</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
