import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

function sb(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "complete_today",
  title: "Mark today complete",
  description: "Mark today as complete in the 365-Day Consistency Challenge for the signed-in user. Idempotent for the same day.",
  inputSchema: {},
  annotations: { readOnlyHint: false, idempotentHint: true, destructiveHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const today = new Date().toISOString().slice(0, 10);
    const client = sb(ctx);
    const existing = await client.from("daily_completions").select("id").eq("completed_date", today).maybeSingle();
    if (existing.data) {
      return { content: [{ type: "text", text: `Already completed for ${today}.` }], structuredContent: { completed_date: today, already: true } };
    }
    const { error } = await client.from("daily_completions").insert({ user_id: ctx.getUserId(), completed_date: today });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: `Marked ${today} complete.` }], structuredContent: { completed_date: today, already: false } };
  },
});
