import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, GraduationCap, Phone, Eye, EyeOff, Check, X, Loader2, ShieldCheck, KeyRound,
} from "lucide-react";
import { z } from "zod";

import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const passwordSchema = z
  .string()
  .min(6, { message: "Password must be at least 6 characters" })
  .max(72, { message: "Password is too long" });

function passwordChecks(pwd: string) {
  return {
    length: pwd.length >= 6,
    upper: /[A-Z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    symbol: /[^A-Za-z0-9]/.test(pwd),
  };
}
function passwordScore(pwd: string) {
  const c = passwordChecks(pwd);
  return [c.length, c.upper, c.number, c.symbol].filter(Boolean).length;
}

export default function ResetPassword() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  const [verifying, setVerifying] = useState(true);
  const [recoverySession, setRecoverySession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pwdError, setPwdError] = useState<string | undefined>();
  const [confirmError, setConfirmError] = useState<string | undefined>();
  const [done, setDone] = useState(false);

  // === Validate that we're inside a recovery flow ===
  useEffect(() => {
    let cancelled = false;

    // Supabase puts the recovery token in the URL hash on click. The client
    // auto-exchanges it for a session and fires PASSWORD_RECOVERY.
    const sub = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "PASSWORD_RECOVERY") {
        setRecoverySession(true);
        setVerifying(false);
      } else if (event === "SIGNED_IN" && session) {
        // Session present (recovery token consumed) — allow update either way
        setRecoverySession(true);
        setVerifying(false);
      }
    });

    // Fallback: check existing session + URL hash
    (async () => {
      const hash = window.location.hash || "";
      const isRecovery = hash.includes("type=recovery");
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session || isRecovery) {
        setRecoverySession(true);
      }
      setVerifying(false);
    })();

    return () => {
      cancelled = true;
      sub.data.subscription.unsubscribe();
    };
  }, []);

  const pwdC = passwordChecks(password);
  const pwdScore = passwordScore(password);
  const pwdLabel = ["Too short", "Weak", "Fair", "Good", "Strong"][pwdScore];
  const pwdColor =
    pwdScore <= 1 ? "bg-destructive" :
    pwdScore === 2 ? "bg-warning" :
    pwdScore === 3 ? "bg-accent" : "bg-success";

  const validate = useMemo(() => {
    return () => {
      let ok = true;
      const r = passwordSchema.safeParse(password);
      if (!r.success) {
        setPwdError(r.error.issues[0].message);
        ok = false;
      } else setPwdError(undefined);
      if (confirm !== password) {
        setConfirmError("Passwords do not match");
        ok = false;
      } else setConfirmError(undefined);
      return ok;
    };
  }, [password, confirm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await updatePassword(password);
      setDone(true);
      toast({
        title: "Password updated",
        description: "You're now signed in. Redirecting…",
      });
      setTimeout(() => navigate("/", { replace: true }), 1500);
    } catch (err: any) {
      toast({
        title: "Could not update password",
        description: err.message ?? "The reset link may have expired. Please request a new one.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Helpline strip */}
      <div className="helpline-strip">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-1.5 flex items-center justify-between flex-wrap gap-2">
          <span className="flex items-center gap-1.5 text-xs"><Phone className="w-3 h-3" /> Admissions Helpline · 1800-MATRIX-1</span>
          <span className="text-[10px] uppercase tracking-[0.18em] font-semibold">Secure Password Reset</span>
        </div>
      </div>

      {/* Top banner */}
      <header className="college-banner border-b-4 border-accent">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="seal w-11 h-11 rounded-full flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <p className="font-serif text-lg md:text-xl font-bold tracking-wide">MatrixMindset</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-accent/90">India's Premier Coaching Institute</p>
            </div>
          </div>
          <p className="hidden md:block text-xs uppercase tracking-[0.2em] text-accent/90">Office of the Registrar</p>
        </div>
        <div className="gold-rule" />
      </header>

      <div className="flex-1 flex items-center justify-center p-6 md:p-10 parchment">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-6">
            <p className="text-[10px] uppercase tracking-[0.3em] text-accent font-semibold mb-2">Account Recovery</p>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-primary">
              Set a New Password
            </h2>
            <div className="gold-rule w-24 mx-auto mt-3" />
          </div>

          <div className="bg-card border-2 border-border rounded-md p-7 shadow-lg relative">
            <div className="seal w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-5 h-5" />
            </div>

            <AnimatePresence mode="wait">
              {verifying ? (
                <motion.div key="verifying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Verifying your reset link…</p>
                </motion.div>
              ) : !recoverySession ? (
                <motion.div key="invalid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-3">
                  <p className="font-serif text-lg font-bold text-destructive">Invalid or expired link</p>
                  <p className="text-sm text-muted-foreground">
                    This password reset link is no longer valid. Please request a new one from the sign-in page.
                  </p>
                  <Button
                    onClick={() => navigate("/auth", { replace: true })}
                    className="institute-cta font-bold uppercase tracking-wider w-full h-11 mt-2"
                  >
                    Back to Sign In <ArrowRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              ) : done ? (
                <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-3 py-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 18 }}
                    className="seal w-14 h-14 rounded-full flex items-center justify-center mx-auto"
                  >
                    <Check className="w-6 h-6" />
                  </motion.div>
                  <h3 className="font-serif text-xl font-bold text-primary">Password updated</h3>
                  <p className="text-sm text-muted-foreground">
                    You're being redirected to your dashboard…
                  </p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-4"
                  noValidate
                >
                  <p className="text-sm text-muted-foreground font-serif italic text-center">
                    Choose a strong password to secure your MatrixMindset account.
                  </p>

                  {/* New password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="new-password" className="text-[11px] font-bold text-primary uppercase tracking-wider">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        autoFocus
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); if (pwdError) setPwdError(undefined); }}
                        placeholder="••••••••"
                        minLength={6}
                        className={`bg-background h-11 pr-10 transition-colors ${pwdError ? "border-destructive focus-visible:ring-destructive" : "border-border"}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <AnimatePresence>
                      {pwdError && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="text-xs text-destructive flex items-center gap-1.5 mt-1"
                        >
                          <X className="w-3 h-3" /> {pwdError}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    {/* Strength meter */}
                    {password && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-2 mt-2"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden flex gap-0.5">
                            {[0, 1, 2, 3].map((i) => (
                              <div key={i} className={`flex-1 ${i < pwdScore ? pwdColor : "bg-muted opacity-30"}`} />
                            ))}
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-14 text-right">
                            {pwdLabel}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                          <ChecklistItem ok={pwdC.length} label="6+ characters" />
                          <ChecklistItem ok={pwdC.upper} label="Uppercase" />
                          <ChecklistItem ok={pwdC.number} label="Number" />
                          <ChecklistItem ok={pwdC.symbol} label="Symbol" />
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-password" className="text-[11px] font-bold text-primary uppercase tracking-wider">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => { setConfirm(e.target.value); if (confirmError) setConfirmError(undefined); }}
                      placeholder="••••••••"
                      minLength={6}
                      className={`bg-background h-11 transition-colors ${confirmError ? "border-destructive focus-visible:ring-destructive" : confirm && confirm === password ? "border-success/60" : "border-border"}`}
                    />
                    <AnimatePresence>
                      {confirmError && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="text-xs text-destructive flex items-center gap-1.5 mt-1"
                        >
                          <X className="w-3 h-3" /> {confirmError}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full gap-2 institute-cta h-12 text-base font-bold uppercase tracking-wider"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</>
                    ) : (
                      <>Update Password <ArrowRight className="w-4 h-4" /></>
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                    Your password is encrypted and never stored in plain text.
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          <p className="text-center text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-6">
            MatrixMindset · Office of the Registrar
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function ChecklistItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 transition-colors ${ok ? "text-success" : "text-muted-foreground"}`}>
      <span className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full ${ok ? "bg-success/20" : "bg-muted"}`}>
        {ok ? <Check className="w-2.5 h-2.5" /> : <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />}
      </span>
      {label}
    </div>
  );
}
