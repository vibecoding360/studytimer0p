import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function sb(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_syllabus_events",
  title: "List calendar events",
  description: "List syllabus/calendar milestones for the signed-in user. Filter by course_id and by time window (upcoming, past, or all).",
  inputSchema: {
    course_id: z.string().uuid().optional().describe("Optional course id to filter by."),
    window: z.enum(["upcoming", "past", "all"]).default("upcoming").describe("Time window relative to today."),
    limit: z.number().int().min(1).max(200).default(50),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ course_id, window, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    let q = sb(ctx).from("syllabus_dates").select("id,title,date,event_type,is_high_stakes,course_id").limit(limit);
    if (course_id) q = q.eq("course_id", course_id);
    const today = new Date().toISOString().slice(0, 10);
    if (window === "upcoming") q = q.gte("date", today).order("date", { ascending: true });
    else if (window === "past") q = q.lt("date", today).order("date", { ascending: false });
    else q = q.order("date", { ascending: true });
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { events: data ?? [] } };
  },
});
