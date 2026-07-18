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
  name: "set_daily_note",
  title: "Write a daily note",
  description: "Create or overwrite the signed-in user's daily note for a specific date (defaults to today).",
  inputSchema: {
    note_text: z.string().trim().min(1).max(10000),
    date: z.string().optional().describe("ISO date YYYY-MM-DD. Defaults to today."),
  },
  annotations: { readOnlyHint: false, idempotentHint: true, destructiveHint: false },
  handler: async ({ note_text, date }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const d = date ?? new Date().toISOString().slice(0, 10);
    const client = sb(ctx);
    const existing = await client.from("daily_notes").select("id").eq("note_date", d).maybeSingle();
    if (existing.data) {
      const { data, error } = await client.from("daily_notes").update({ note_text }).eq("id", existing.data.id).select().single();
      if (error) return { content: [{ type: "text", text: error.message }], isError: true };
      return { content: [{ type: "text", text: `Updated note for ${d}.` }], structuredContent: { note: data } };
    }
    const { data, error } = await client.from("daily_notes").insert({ user_id: ctx.getUserId(), note_date: d, note_text }).select().single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: `Saved note for ${d}.` }], structuredContent: { note: data } };
  },
});
