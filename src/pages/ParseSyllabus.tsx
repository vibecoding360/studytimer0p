import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Upload, Sparkles, Check, FileText, Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface ParsedData {
  dates: Array<{ title: string; date?: string; event_type: string; is_high_stakes: boolean }>;
  grading_weights: Array<{ category: string; weight: number }>;
  readings: Array<{ title: string; author?: string; chapter?: string; due_date?: string }>;
}

export default function ParseSyllabus() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState(searchParams.get("course") || "");
  const [syllabusText, setSyllabusText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedData | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    supabase.from("courses").select("*").then(({ data }) => {
      if (data) setCourses(data);
    });
  }, []);

  const handleFile = useCallback(async (file: File) => {
    if (file.type === "text/plain") {
      const text = await file.text();
      setSyllabusText(text);
    } else {
      // Upload to storage and read back for now, or use text extraction
      toast({ title: "PDF/Image support", description: "Please paste your syllabus text for now. Full PDF parsing coming soon." });
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

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
      toast({ title: "Syllabus parsed!", description: `Found ${data.dates?.length || 0} dates, ${data.grading_weights?.length || 0} weights, ${data.readings?.length || 0} readings.` });
    } catch (err: any) {
      toast({ title: "Parse failed", description: err.message, variant: "destructive" });
    } finally {
      setParsing(false);
    }
  };

  const saveToDatabase = async () => {
    if (!parsed || !selectedCourse || !user) return;
    setSaving(true);
    try {
      if (parsed.dates?.length) {
        await supabase.from("syllabus_dates").insert(
          parsed.dates.map(d => ({ ...d, course_id: selectedCourse, user_id: user.id }))
        );
      }
      if (parsed.grading_weights?.length) {
        await supabase.from("grading_weights").insert(
          parsed.grading_weights.map(w => ({ ...w, course_id: selectedCourse, user_id: user.id }))
        );
      }
      if (parsed.readings?.length) {
        await supabase.from("readings").insert(
          parsed.readings.map(r => ({ ...r, course_id: selectedCourse, user_id: user.id }))
        );
      }
      toast({ title: "Saved!", description: "Syllabus data attached to course." });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const eventTypeBadge = (type: string, highStakes: boolean) => {
    if (highStakes) return <Badge variant="destructive" className="text-xs">High Stakes</Badge>;
    const map: Record<string, string> = { midterm: "warning", final: "destructive", quiz: "secondary", assignment: "default", project: "outline" };
    return <Badge variant={(map[type] || "secondary") as any} className="text-xs">{type}</Badge>;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-1">AI Syllabus Parser</h1>
      <p className="text-muted-foreground text-sm mb-6">Upload or paste your syllabus to extract structured data</p>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger><SelectValue placeholder="Select a course" /></SelectTrigger>
            <SelectContent>
              {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <div
            onDragOver={e => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragActive ? "border-primary bg-primary/5" : "border-border/50"}`}
          >
            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Drag & drop a file, or paste text below</p>
          </div>

          <Textarea
            value={syllabusText}
            onChange={e => setSyllabusText(e.target.value)}
            placeholder="Paste your syllabus text here..."
            rows={10}
            className="bg-secondary/30 border-border/50 font-mono text-xs"
          />

          <Button onClick={parseSyllabus} disabled={parsing || !syllabusText.trim()} className="w-full gap-2">
            {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {parsing ? "Parsing with AI..." : "Parse Syllabus"}
          </Button>
        </div>

        {parsed && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
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

            <Button onClick={saveToDatabase} disabled={saving || !selectedCourse} className="w-full gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? "Saving..." : "Save to Course"}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
