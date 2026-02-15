import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";

export default function StudyHeatmap() {
  const { user } = useAuth();
  const [data, setData] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;
    const fetchSessions = async () => {
      const since = subDays(new Date(), 112); // ~16 weeks
      const { data: sessions } = await supabase
        .from("study_sessions")
        .select("completed_at, duration_minutes")
        .gte("completed_at", since.toISOString());
      if (!sessions) return;
      const map: Record<string, number> = {};
      sessions.forEach((s) => {
        const day = format(new Date(s.completed_at), "yyyy-MM-dd");
        map[day] = (map[day] || 0) + s.duration_minutes;
      });
      setData(map);
    };
    fetchSessions();
  }, [user]);

  const today = startOfDay(new Date());
  const days = eachDayOfInterval({ start: subDays(today, 112), end: today });

  const getIntensity = (minutes: number) => {
    if (!minutes) return "bg-secondary/30";
    if (minutes < 30) return "bg-[hsl(160,100%,50%,0.2)]";
    if (minutes < 60) return "bg-[hsl(160,100%,50%,0.4)]";
    if (minutes < 120) return "bg-[hsl(160,100%,50%,0.6)]";
    return "bg-[hsl(160,100%,50%,0.85)]";
  };

  // Group by weeks (columns)
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  days.forEach((day, i) => {
    currentWeek.push(day);
    if (day.getDay() === 6 || i === days.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">Study Activity</h3>
      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const mins = data[key] || 0;
              return (
                <Tooltip key={key}>
                  <TooltipTrigger asChild>
                    <div
                      className={`w-3 h-3 rounded-[2px] transition-colors ${getIntensity(mins)}`}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p>{format(day, "MMM d")}: {mins ? `${mins}m` : "No study"}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>Less</span>
        {["bg-secondary/30", "bg-[hsl(160,100%,50%,0.2)]", "bg-[hsl(160,100%,50%,0.4)]", "bg-[hsl(160,100%,50%,0.6)]", "bg-[hsl(160,100%,50%,0.85)]"].map((c, i) => (
          <div key={i} className={`w-3 h-3 rounded-[2px] ${c}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
