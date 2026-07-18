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
  name: "list_study_sessions",
  title: "List focus sessions",
  description: "List the signed-in user's recent focus/study sessions with duration, mode, focus score and optional course link.",
  inputSchema: {
    course_id: z.string().uuid().optional(),
    limit: z.number().int().min(1).max(200).default(25),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ course_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    let q = sb(ctx)
      .from("study_sessions")
      .select("id,course_id,mode,duration_minutes,focus_score,commit_message,completed_at")
      .order("completed_at", { ascending: false })
      .limit(limit);
    if (course_id) q = q.eq("course_id", course_id);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { sessions: data ?? [] } };
  },
});
