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
  name: "get_daily_note",
  title: "Read a daily note",
  description: "Read the signed-in user's daily note for a specific date (defaults to today).",
  inputSchema: {
    date: z.string().optional().describe("ISO date YYYY-MM-DD. Defaults to today."),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ date }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const d = date ?? new Date().toISOString().slice(0, 10);
    const { data, error } = await sb(ctx).from("daily_notes").select("id,note_date,note_text,updated_at").eq("note_date", d).maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: data?.note_text ?? "(no note)" }], structuredContent: { note: data, date: d } };
  },
});
