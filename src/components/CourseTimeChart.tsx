import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface ChartData {
  name: string;
  hours: number;
  color: string;
}

export default function CourseTimeChart() {
  const { user } = useAuth();
  const [data, setData] = useState<ChartData[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: sessions } = await supabase
        .from("study_sessions")
        .select("course_id, duration_minutes");
      const { data: courses } = await supabase
        .from("courses")
        .select("id, name, color");
      if (!sessions || !courses) return;

      const courseMap = new Map(courses.map((c) => [c.id, c]));
      const timeMap = new Map<string, number>();
      sessions.forEach((s) => {
        if (s.course_id) {
          timeMap.set(s.course_id, (timeMap.get(s.course_id) || 0) + s.duration_minutes);
        }
      });

      const chartData: ChartData[] = courses.map((c) => ({
        name: c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name,
        hours: Math.round(((timeMap.get(c.id) || 0) / 60) * 10) / 10,
        color: c.color || "#6366f1",
      }));

      setData(chartData.filter((d) => d.hours > 0).sort((a, b) => b.hours - a.hours));
    };
    fetch();
  }, [user]);

  if (data.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">Deep Work Distribution</h3>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 8 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              formatter={(value: number) => [`${value}h`, "Focus Time"]}
            />
            <Bar dataKey="hours" radius={[0, 4, 4, 0]} barSize={16}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
