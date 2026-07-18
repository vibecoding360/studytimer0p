import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

function sb(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function computeStreak(dates: string[]): number {
  const set = new Set(dates);
  let streak = 0;
  const d = new Date();
  // If today isn't marked, start from yesterday so streak doesn't reset mid-day.
  if (!set.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
  while (set.has(d.toISOString().slice(0, 10))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export default defineTool({
  name: "get_365_stats",
  title: "365 Challenge stats",
  description: "Return the signed-in user's 365-day consistency stats: total days completed, current streak, percent progress, and today's completion status.",
  inputSchema: {},
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { data, error } = await sb(ctx).from("daily_completions").select("completed_date").order("completed_date", { ascending: false });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const dates = (data ?? []).map((r) => r.completed_date as string);
    const today = new Date().toISOString().slice(0, 10);
    const stats = {
      total_completed: dates.length,
      current_streak: computeStreak(dates),
      percent: Math.round((dates.length / 365) * 1000) / 10,
      completed_today: dates.includes(today),
    };
    return {
      content: [{ type: "text", text: `${stats.total_completed}/365 days · streak ${stats.current_streak} · today ${stats.completed_today ? "done" : "not yet"}` }],
      structuredContent: stats,
    };
  },
});
