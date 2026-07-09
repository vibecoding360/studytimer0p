// Maps raw errors (from Supabase, edge functions, or unknown sources) to safe,
// user-friendly messages. Detailed errors are kept in the console for debugging
// but never surfaced to end users to avoid leaking schema/internal details.

export function toUserMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (import.meta.env.DEV) {
    // Keep full detail available to developers only.
    // eslint-disable-next-line no-console
    console.error("[error]", error);
  }

  const code = (error as any)?.code as string | undefined;
  const status = (error as any)?.status as number | undefined;
  const rawMessage = typeof (error as any)?.message === "string" ? ((error as any).message as string) : "";
  const msg = rawMessage.toLowerCase();

  // Supabase auth — safe, user-facing messages
  if (msg.includes("invalid login credentials")) return "Invalid email or password.";
  if (msg.includes("email not confirmed")) return "Please confirm your email before signing in.";
  if (msg.includes("user already registered") || msg.includes("already registered")) {
    return "An account with this email already exists.";
  }
  if (msg.includes("password should be at least")) return "Password is too short.";
  if (msg.includes("rate limit") || status === 429) return "Too many attempts. Please wait a moment and try again.";
  if (msg.includes("network") || msg.includes("failed to fetch")) return "Network error. Check your connection and try again.";

  // Postgres constraint / RLS codes — never expose raw text
  if (code === "23505") return "This item already exists.";
  if (code === "23503") return "Referenced item was not found.";
  if (code?.startsWith?.("23")) return "Invalid data provided.";
  if (code === "42501" || status === 403) return "You don't have permission to do that.";
  if (status === 401) return "Please sign in to continue.";
  if (status === 402) return "Usage limit reached. Please try again later.";
  if (status && status >= 500) return "Server error. Please try again shortly.";

  return fallback;
}
