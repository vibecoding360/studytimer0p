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
  name: "log_study_session",
  title: "Log a focus session",
  description: "Record a completed focus/study session for the signed-in user.",
  inputSchema: {
    duration_minutes: z.number().int().min(1).max(600),
    mode: z.string().trim().min(1).max(50).default("focus").describe("e.g. focus, review, deep-work."),
    focus_score: z.number().int().min(1).max(5).optional(),
    commit_message: z.string().trim().max(500).optional().describe("What you worked on."),
    course_id: z.string().uuid().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { data, error } = await sb(ctx)
      .from("study_sessions")
      .insert({
        user_id: ctx.getUserId(),
        duration_minutes: input.duration_minutes,
        mode: input.mode,
        focus_score: input.focus_score ?? null,
        commit_message: input.commit_message ?? null,
        course_id: input.course_id ?? null,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: `Logged ${data.duration_minutes}m ${data.mode} session.` }], structuredContent: { session: data } };
  },
});
