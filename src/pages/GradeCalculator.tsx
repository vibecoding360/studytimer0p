import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { motion } from "framer-motion";
import { Calculator, Target, TrendingUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Weight {
  id: string;
  category: string;
  weight: number;
  current_score: number | null;
}

export default function GradeCalculator() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [weights, setWeights] = useState<Weight[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [whatIfExamScore, setWhatIfExamScore] = useState(85);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("courses").select("*").then(({ data }) => {
      if (data) setCourses(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    supabase.from("grading_weights").select("*").eq("course_id", selectedCourse).then(({ data }) => {
      if (data) {
        setWeights(data);
        const s: Record<string, number> = {};
        data.forEach(w => { s[w.id] = w.current_score ?? 0; });
        setScores(s);
      }
    });
  }, [selectedCourse]);

  const updateScore = async (id: string, score: number) => {
    setScores(prev => ({ ...prev, [id]: score }));
    await supabase.from("grading_weights").update({ current_score: score }).eq("id", id);
  };

  const weightedGrade = useMemo(() => {
    if (!weights.length) return 0;
    let totalWeight = 0;
    let weightedSum = 0;
    weights.forEach(w => {
      const score = scores[w.id] ?? 0;
      if (score > 0) {
        weightedSum += (score / 100) * w.weight;
        totalWeight += w.weight;
      }
    });
    return totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
  }, [weights, scores]);

  // What-If: find the exam/final category and simulate
  const whatIfGrade = useMemo(() => {
    if (!weights.length) return 0;
    const examCategory = weights.find(w =>
      w.category.toLowerCase().includes("final") || w.category.toLowerCase().includes("exam") || w.category.toLowerCase().includes("midterm")
    );
    let totalWeight = 0;
    let weightedSum = 0;
    weights.forEach(w => {
      const score = w.id === examCategory?.id ? whatIfExamScore : (scores[w.id] ?? 0);
      if (score > 0) {
        weightedSum += (score / 100) * w.weight;
        totalWeight += w.weight;
      }
    });
    return totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
  }, [weights, scores, whatIfExamScore]);

  const gradeLabel = (pct: number) => {
    if (pct >= 93) return { letter: "A", color: "text-success" };
    if (pct >= 90) return { letter: "A-", color: "text-success" };
    if (pct >= 87) return { letter: "B+", color: "text-primary" };
    if (pct >= 83) return { letter: "B", color: "text-primary" };
    if (pct >= 80) return { letter: "B-", color: "text-primary" };
    if (pct >= 77) return { letter: "C+", color: "text-warning" };
    if (pct >= 73) return { letter: "C", color: "text-warning" };
    return { letter: "Below C", color: "text-destructive" };
  };

  const currentGrade = gradeLabel(weightedGrade);
  const simulatedGrade = gradeLabel(whatIfGrade);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-1">Grade Calculator</h1>
      <p className="text-muted-foreground text-sm mb-6">Track your standing and simulate outcomes</p>

      <Select value={selectedCourse} onValueChange={setSelectedCourse}>
        <SelectTrigger className="w-64 mb-6"><SelectValue placeholder="Select a course" /></SelectTrigger>
        <SelectContent>
          {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
        </SelectContent>
      </Select>

      {selectedCourse && weights.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Calculator className="w-4 h-4" />Score Entry</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {weights.map(w => (
                  <div key={w.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{w.category}</span>
                      <span className="text-xs text-muted-foreground">{w.weight}% weight</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={scores[w.id] ?? ""}
                        onChange={e => updateScore(w.id, Number(e.target.value))}
                        className="w-20 text-sm bg-secondary/30"
                        placeholder="—"
                      />
                      <Progress value={scores[w.id] ?? 0} className="flex-1 h-2" />
                      <span className="text-xs font-mono w-10 text-right">{scores[w.id] ?? 0}%</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* What-If Slider */}
            <Card className="glass-card glow">
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Target className="w-4 h-4" />What-If Simulator</CardTitle></CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-4">Slide to simulate different exam scores and see the impact on your final grade.</p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Exam Score</span>
                    <span className="text-2xl font-bold font-mono">{whatIfExamScore}%</span>
                  </div>
                  <Slider
                    value={[whatIfExamScore]}
                    onValueChange={v => setWhatIfExamScore(v[0])}
                    min={0}
                    max={100}
                    step={1}
                  />
                  <div className="flex items-center justify-between pt-2 border-t border-border/30">
                    <span className="text-sm text-muted-foreground">Simulated Final Grade</span>
                    <div className="text-right">
                      <span className={`text-xl font-bold ${simulatedGrade.color}`}>{simulatedGrade.letter}</span>
                      <span className="text-sm text-muted-foreground ml-2">({whatIfGrade.toFixed(1)}%)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="glass-card sticky top-8">
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4" />Current Standing</CardTitle></CardHeader>
              <CardContent className="text-center">
                <div className={`text-5xl font-bold ${currentGrade.color} mb-2`}>{currentGrade.letter}</div>
                <p className="text-lg font-mono">{weightedGrade.toFixed(1)}%</p>
                <Progress value={weightedGrade} className="mt-4 h-3" />
                <div className="mt-6 space-y-2 text-xs text-left">
                  {[{ label: "A (93%)", needed: 93 }, { label: "B (83%)", needed: 83 }, { label: "C (73%)", needed: 73 }].map(t => (
                    <div key={t.label} className="flex justify-between">
                      <span className="text-muted-foreground">Need for {t.label}</span>
                      <span className={weightedGrade >= t.needed ? "text-success" : "text-muted-foreground"}>
                        {weightedGrade >= t.needed ? "✓" : `${(t.needed - weightedGrade).toFixed(1)}% more`}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : selectedCourse ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <Calculator className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No grading weights found. Parse a syllabus first.</p>
        </motion.div>
      ) : null}
    </div>
  );
}
