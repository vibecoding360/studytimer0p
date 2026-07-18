import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, GraduationCap, Check, X } from "lucide-react";

// Typed wrapper for the beta supabase.auth.oauth namespace so TS is happy.
type OAuthDetails = {
  client?: { name?: string; client_name?: string; redirect_uris?: string[] };
  scope?: string;
  redirect_url?: string;
  redirect_to?: string;
};
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }>;
};
const oauthApi = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<OAuthDetails | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) { setError("Missing authorization_id in the request URL."); return; }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }
      setEmail(sess.session.user.email ?? null);
      const { data, error } = await oauthApi().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) { setError(error.message); return; }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) { window.location.href = immediate; return; }
      setDetails(data);
    })();
    return () => { active = false; };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const api = oauthApi();
    const { data, error } = approve
      ? await api.approveAuthorization(authorizationId)
      : await api.denyAuthorization(authorizationId);
    if (error) { setBusy(false); setError(error.message); return; }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(false); setError("No redirect returned by the authorization server."); return; }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? details?.client?.client_name ?? "an external app";
  const scopeList = (details?.scope ?? "").split(/\s+/).filter(Boolean);

  return (
    <div className="min-h-screen flex items-center justify-center parchment px-4 py-10">
      <div className="premium-card rounded-md p-7 max-w-lg w-full">
        <div className="flex items-center gap-3 mb-5">
          <div className="seal w-11 h-11 rounded-full flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-accent font-semibold">Agent Integration</p>
            <h1 className="font-serif text-2xl font-bold text-primary leading-tight">Connect to MatrixMindset</h1>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 text-destructive text-sm p-3 mb-4 flex items-start gap-2">
            <X className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {!details && !error && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading authorization request…
          </div>
        )}

        {details && (
          <>
            <p className="text-sm mb-4">
              <span className="font-semibold">{clientName}</span> is asking to connect to MatrixMindset and act as you.
            </p>
            {email && (
              <p className="text-xs text-muted-foreground mb-4">Signed in as <span className="font-semibold text-foreground">{email}</span></p>
            )}

            <div className="rounded-md border border-border bg-secondary/40 p-4 space-y-2 mb-5">
              <p className="text-[11px] uppercase tracking-wider font-bold text-primary flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> This will let {clientName}:
              </p>
              <ul className="text-sm space-y-1.5 pl-1">
                <li className="flex gap-2"><Check className="w-4 h-4 text-success shrink-0 mt-0.5" /> Read and update your mastery tracks, calendar events, focus sessions, daily notes, and 365 challenge progress.</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-success shrink-0 mt-0.5" /> Browse MatrixMindset's public course catalog on your behalf.</li>
              </ul>
              {scopeList.length > 0 && (
                <p className="text-[11px] text-muted-foreground pt-2">
                  Requested identity scopes: {scopeList.join(", ")}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground italic pt-1">
                Row-level security still applies — {clientName} only sees your data.
              </p>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" disabled={busy} onClick={() => decide(false)} className="flex-1 h-11">
                Deny
              </Button>
              <Button type="button" disabled={busy} onClick={() => decide(true)} className="flex-1 h-11 institute-cta font-bold uppercase tracking-wider">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Approve"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
