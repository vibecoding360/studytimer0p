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
  name: "create_syllabus_event",
  title: "Create calendar event",
  description: "Create a milestone / calendar event (exam, assignment, quiz, etc.) for the signed-in user.",
  inputSchema: {
    title: z.string().trim().min(1).max(200),
    date: z.string().describe("ISO date YYYY-MM-DD."),
    event_type: z.string().trim().min(1).max(50).default("assignment").describe("e.g. exam, assignment, quiz, project, reading."),
    course_id: z.string().uuid().optional(),
    is_high_stakes: z.boolean().default(false),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  handler: async ({ title, date, event_type, course_id, is_high_stakes }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { data, error } = await sb(ctx)
      .from("syllabus_dates")
      .insert({ title, date, event_type, course_id: course_id ?? null, is_high_stakes, user_id: ctx.getUserId() })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: `Created event: ${data.title} on ${data.date}` }], structuredContent: { event: data } };
  },
});
