import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ArrowLeft, GraduationCap, Trophy, Users, Award,
  Sparkles, ShieldCheck, Phone, Eye, EyeOff, Check, X, Loader2,
} from "lucide-react";
import { z } from "zod";

// === Validation schemas ===
const emailSchema = z.string().trim().email({ message: "Please enter a valid email address" }).max(255);
const nameSchema = z.string().trim().min(2, { message: "Name must be at least 2 characters" }).max(100);
const passwordSchema = z
  .string()
  .min(6, { message: "Password must be at least 6 characters" })
  .max(72, { message: "Password is too long" });

type FieldErrors = Partial<Record<"name" | "email" | "password", string>>;

// === Password strength helpers ===
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

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [forgotMode, setForgotMode] = useState(false); // password reset flow
  const [resetSent, setResetSent] = useState(false);
  const [step, setStep] = useState(0); // signup: 0 = name, 1 = email, 2 = password
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();

  // Live validation: only show error if field has been touched
  const liveErrors: FieldErrors = useMemo(() => {
    const e: FieldErrors = {};
    if (touched.name && !isLogin) {
      const r = nameSchema.safeParse(name);
      if (!r.success) e.name = r.error.issues[0].message;
    }
    if (touched.email) {
      const r = emailSchema.safeParse(email);
      if (!r.success) e.email = r.error.issues[0].message;
    }
    if (touched.password) {
      const r = passwordSchema.safeParse(password);
      if (!r.success) e.password = r.error.issues[0].message;
    }
    return { ...e, ...errors };
  }, [name, email, password, touched, errors, isLogin]);

  const pwdChecks = passwordChecks(password);
  const pwdScore = passwordScore(password);
  const pwdLabel = ["Too short", "Weak", "Fair", "Good", "Strong"][pwdScore];
  const pwdColor =
    pwdScore <= 1 ? "bg-destructive" :
    pwdScore === 2 ? "bg-warning" :
    pwdScore === 3 ? "bg-accent" : "bg-success";

  const switchMode = (login: boolean) => {
    setIsLogin(login);
    setForgotMode(false);
    setResetSent(false);
    setStep(0);
    setErrors({});
    setTouched({});
  };

  const enterForgotMode = () => {
    setForgotMode(true);
    setResetSent(false);
    setErrors({});
    setTouched({});
  };

  const exitForgotMode = () => {
    setForgotMode(false);
    setResetSent(false);
    setErrors({});
    setTouched({});
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = emailSchema.safeParse(email);
    setTouched((t) => ({ ...t, email: true }));
    if (!r.success) {
      setErrors({ email: r.error.issues[0].message });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await resetPassword(email);
    } catch {
      // Intentionally swallow — never disclose whether account exists.
    } finally {
      setResetSent(true);
      setLoading(false);
      toast({
        title: "Reset link sent",
        description: "If an account exists for that email, a reset link is on its way.",
      });
    }
  };

  const validateCurrentStep = (): boolean => {
    if (isLogin) {
      const eRes = emailSchema.safeParse(email);
      const pRes = passwordSchema.safeParse(password);
      const newErr: FieldErrors = {};
      if (!eRes.success) newErr.email = eRes.error.issues[0].message;
      if (!pRes.success) newErr.password = pRes.error.issues[0].message;
      setTouched({ email: true, password: true });
      setErrors(newErr);
      return Object.keys(newErr).length === 0;
    }
    if (step === 0) {
      const r = nameSchema.safeParse(name);
      setTouched((t) => ({ ...t, name: true }));
      if (!r.success) { setErrors({ name: r.error.issues[0].message }); return false; }
      setErrors({});
      return true;
    }
    if (step === 1) {
      const r = emailSchema.safeParse(email);
      setTouched((t) => ({ ...t, email: true }));
      if (!r.success) { setErrors({ email: r.error.issues[0].message }); return false; }
      setErrors({});
      return true;
    }
    if (step === 2) {
      const r = passwordSchema.safeParse(password);
      setTouched((t) => ({ ...t, password: true }));
      if (!r.success) { setErrors({ password: r.error.issues[0].message }); return false; }
      setErrors({});
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    setStep((s) => Math.min(s + 1, 2));
  };

  const handleBack = () => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        navigate("/");
      } else {
        await signUp(email, password, name);
        toast({ title: "Account created", description: "Welcome to MatrixMindset!" });
        navigate("/");
      }
    } catch (err: any) {
      toast({ title: "Authentication failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const stepDirection = useMemo(() => 1, []); // forward animation by default
  const formVariants = {
    enter: { opacity: 0, x: 24, filter: "blur(4px)" },
    center: { opacity: 1, x: 0, filter: "blur(0px)" },
    exit: { opacity: 0, x: -24, filter: "blur(4px)" },
  };

  const totalSteps = isLogin ? 1 : 3;
  const currentStep = isLogin ? 1 : step + 1;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Helpline strip */}
      <div className="helpline-strip">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-1.5 flex items-center justify-between flex-wrap gap-2">
          <span className="flex items-center gap-1.5 text-xs"><Phone className="w-3 h-3" /> Admissions Helpline · 1800-MATRIX-1</span>
          <span className="text-[10px] uppercase tracking-[0.18em] font-semibold">Admissions OPEN · Batch 2026</span>
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

      {/* Hero + Form split */}
      <div className="flex-1 grid lg:grid-cols-2">
        {/* Left: marketing hero */}
        <section className="institute-hero relative px-6 md:px-10 lg:px-14 py-12 lg:py-16 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: "radial-gradient(hsl(var(--accent)) 1.2px, transparent 1.2px)",
            backgroundSize: "22px 22px",
          }} />
          <div className="relative max-w-xl mx-auto lg:mx-0">
            <div className="inline-flex items-center gap-2 bg-accent/15 border border-accent/40 rounded-full px-3 py-1 mb-5">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span className="text-[11px] uppercase tracking-[0.2em] text-accent font-semibold">India's #1 Result-Oriented Institute</span>
            </div>

            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight">
              Crack <span className="text-accent">JEE · NEET · Olympiads</span> with the Best Faculty in India.
            </h1>

            <div className="double-rule my-6 w-32" />

            <p className="text-base md:text-lg text-primary-foreground/85 font-serif italic">
              From classroom to AIR 1 — join 18,000+ aspirants who chose MatrixMindset for their journey to the IITs, AIIMS and beyond.
            </p>

            <div className="grid grid-cols-3 gap-3 mt-8">
              <div className="bg-primary/30 border border-accent/30 rounded-md p-3 text-center backdrop-blur-sm">
                <Trophy className="w-5 h-5 text-accent mx-auto mb-1" />
                <p className="font-serif text-2xl font-bold text-accent">18K+</p>
                <p className="text-[10px] uppercase tracking-wider text-primary-foreground/70">Selections</p>
              </div>
              <div className="bg-primary/30 border border-accent/30 rounded-md p-3 text-center backdrop-blur-sm">
                <Award className="w-5 h-5 text-accent mx-auto mb-1" />
                <p className="font-serif text-2xl font-bold text-accent">AIR 1</p>
                <p className="text-[10px] uppercase tracking-wider text-primary-foreground/70">JEE 2024</p>
              </div>
              <div className="bg-primary/30 border border-accent/30 rounded-md p-3 text-center backdrop-blur-sm">
                <Users className="w-5 h-5 text-accent mx-auto mb-1" />
                <p className="font-serif text-2xl font-bold text-accent">450+</p>
                <p className="text-[10px] uppercase tracking-wider text-primary-foreground/70">Faculty</p>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-8 text-xs text-primary-foreground/80">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-accent" /> ISO 9001 Certified</span>
              <span className="hidden sm:flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-accent" /> Govt. Recognised</span>
            </div>

            <p className="hidden lg:block mt-10 text-xs uppercase tracking-[0.3em] text-accent/80">— Toppers since MMXXV —</p>
          </div>
        </section>

        {/* Right: auth form */}
        <section className="flex items-center justify-center p-6 md:p-10 parchment">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-6">
              <p className="text-[10px] uppercase tracking-[0.3em] text-accent font-semibold mb-2">Student Portal</p>
              <h2 className="font-serif text-3xl font-bold tracking-tight text-primary">
                {forgotMode ? "Reset Your Password" : isLogin ? "Welcome Back, Topper" : "Begin Your Journey"}
              </h2>
              <div className="gold-rule w-24 mx-auto mt-3" />
            </div>

            <div className="bg-card border-2 border-border rounded-md p-7 shadow-lg relative">
              {!forgotMode && <div className="ribbon">Free Trial</div>}

              {/* Mode tabs (hidden in forgot mode) */}
              {!forgotMode && (
                <div className="flex gap-1 mb-5 mt-3 p-1 rounded-md bg-secondary border border-border">
                  <button
                    type="button"
                    onClick={() => switchMode(true)}
                    className={`flex-1 py-2 text-sm font-semibold rounded-sm transition-all duration-200 ${isLogin ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode(false)}
                    className={`flex-1 py-2 text-sm font-semibold rounded-sm transition-all duration-200 ${!isLogin ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Register
                  </button>
                </div>
              )}

              {/* Step progress (signup only) */}
              {!isLogin && !forgotMode && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary">
                      Step {currentStep} of {totalSteps}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {step === 0 ? "Your Identity" : step === 1 ? "Contact" : "Secure It"}
                    </span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-accent to-primary"
                      initial={false}
                      animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                    />
                  </div>
                </div>
              )}

              {!forgotMode && (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <AnimatePresence mode="wait" custom={stepDirection}>
                  {/* === LOGIN: single combined step === */}
                  {isLogin && (
                    <motion.div
                      key="login"
                      variants={formVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="space-y-4"
                    >
                      <FieldEmail
                        value={email}
                        onChange={(v) => { setEmail(v); if (errors.email) setErrors((e) => ({ ...e, email: undefined })); }}
                        onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                        error={liveErrors.email}
                      />
                      <FieldPassword
                        value={password}
                        onChange={(v) => { setPassword(v); if (errors.password) setErrors((e) => ({ ...e, password: undefined })); }}
                        onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                        error={liveErrors.password}
                        show={showPassword}
                        toggleShow={() => setShowPassword((s) => !s)}
                      />
                      <div className="flex justify-end -mt-1">
                        <button
                          type="button"
                          onClick={enterForgotMode}
                          className="text-xs font-semibold text-primary hover:text-accent transition-colors underline-offset-4 hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* === SIGNUP STEP 0: NAME === */}
                  {!isLogin && step === 0 && (
                    <motion.div
                      key="signup-name"
                      variants={formVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="space-y-2"
                    >
                      <Label htmlFor="name" className="text-[11px] font-bold text-primary uppercase tracking-wider">Full Name</Label>
                      <ValidatedInput
                        id="name"
                        autoFocus
                        value={name}
                        onChange={(v) => { setName(v); if (errors.name) setErrors((e) => ({ ...e, name: undefined })); }}
                        onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleNext(); } }}
                        placeholder="As per your school records"
                        error={liveErrors.name}
                        valid={touched.name && !liveErrors.name && nameSchema.safeParse(name).success}
                      />
                      <FieldError error={liveErrors.name} />
                      <p className="text-[11px] text-muted-foreground italic pt-1">
                        We'll address you by this name in your reports & certificates.
                      </p>
                    </motion.div>
                  )}

                  {/* === SIGNUP STEP 1: EMAIL === */}
                  {!isLogin && step === 1 && (
                    <motion.div
                      key="signup-email"
                      variants={formVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="space-y-2"
                    >
                      <FieldEmail
                        autoFocus
                        value={email}
                        onChange={(v) => { setEmail(v); if (errors.email) setErrors((e) => ({ ...e, email: undefined })); }}
                        onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleNext(); } }}
                        error={liveErrors.email}
                        valid={touched.email && !liveErrors.email && emailSchema.safeParse(email).success}
                      />
                      <p className="text-[11px] text-muted-foreground italic pt-1">
                        Used for sign-in, results & important admission notices.
                      </p>
                    </motion.div>
                  )}

                  {/* === SIGNUP STEP 2: PASSWORD === */}
                  {!isLogin && step === 2 && (
                    <motion.div
                      key="signup-password"
                      variants={formVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="space-y-3"
                    >
                      <FieldPassword
                        autoFocus
                        value={password}
                        onChange={(v) => { setPassword(v); if (errors.password) setErrors((e) => ({ ...e, password: undefined })); }}
                        onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                        error={liveErrors.password}
                        show={showPassword}
                        toggleShow={() => setShowPassword((s) => !s)}
                        valid={touched.password && !liveErrors.password && passwordSchema.safeParse(password).success}
                      />

                      {/* Strength meter */}
                      {password && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden flex gap-0.5">
                              {[0, 1, 2, 3].map((i) => (
                                <motion.div
                                  key={i}
                                  initial={false}
                                  animate={{ opacity: i < pwdScore ? 1 : 0.2 }}
                                  className={`flex-1 ${i < pwdScore ? pwdColor : "bg-muted"}`}
                                />
                              ))}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-14 text-right">
                              {pwdLabel}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                            <PwdCheck ok={pwdChecks.length} label="6+ characters" />
                            <PwdCheck ok={pwdChecks.upper} label="Uppercase" />
                            <PwdCheck ok={pwdChecks.number} label="Number" />
                            <PwdCheck ok={pwdChecks.symbol} label="Symbol" />
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* === Action row === */}
                <div className="flex gap-2 pt-2">
                  {!isLogin && step > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      disabled={loading}
                      className="h-12 px-4 gap-1"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                  )}

                  {!isLogin && step < 2 ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="flex-1 gap-2 institute-cta h-12 text-base font-bold uppercase tracking-wider"
                    >
                      Continue <ArrowRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className="flex-1 gap-2 institute-cta h-12 text-base font-bold uppercase tracking-wider"
                      disabled={loading}
                    >
                      {loading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Please wait…</>
                      ) : isLogin ? (
                        <>Enter Portal <ArrowRight className="w-4 h-4" /></>
                      ) : (
                        <>Create Account <ArrowRight className="w-4 h-4" /></>
                      )}
                    </Button>
                  )}
                </div>
              </form>
              )}

              {/* === FORGOT PASSWORD PANEL === */}
              {forgotMode && (
                <AnimatePresence mode="wait">
                  {!resetSent ? (
                    <motion.form
                      key="forgot-form"
                      onSubmit={handleForgotSubmit}
                      initial={{ opacity: 0, x: 24, filter: "blur(4px)" }}
                      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, x: -24, filter: "blur(4px)" }}
                      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="space-y-4 mt-3"
                      noValidate
                    >
                      <p className="text-sm text-muted-foreground font-serif italic">
                        Enter the email associated with your MatrixMindset account and we'll send you a secure link to reset your password.
                      </p>
                      <FieldEmail
                        autoFocus
                        value={email}
                        onChange={(v) => { setEmail(v); if (errors.email) setErrors((e) => ({ ...e, email: undefined })); }}
                        onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                        error={liveErrors.email}
                        valid={touched.email && !liveErrors.email && emailSchema.safeParse(email).success}
                      />
                      <div className="flex gap-2 pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={exitForgotMode}
                          disabled={loading}
                          className="h-12 px-4 gap-1"
                        >
                          <ArrowLeft className="w-4 h-4" /> Back
                        </Button>
                        <Button
                          type="submit"
                          disabled={loading}
                          className="flex-1 gap-2 institute-cta h-12 text-base font-bold uppercase tracking-wider"
                        >
                          {loading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                          ) : (
                            <>Send Reset Link <ArrowRight className="w-4 h-4" /></>
                          )}
                        </Button>
                      </div>
                    </motion.form>
                  ) : (
                    <motion.div
                      key="forgot-success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="text-center py-4 space-y-3 mt-3"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 18 }}
                        className="seal w-14 h-14 rounded-full flex items-center justify-center mx-auto"
                      >
                        <Check className="w-6 h-6" />
                      </motion.div>
                      <h3 className="font-serif text-xl font-bold text-primary">Check your inbox</h3>
                      <p className="text-sm text-muted-foreground">
                        If an account exists for{" "}
                        <span className="font-semibold text-foreground">{email}</span>, a password reset link is on its way. The link expires in 60 minutes.
                      </p>
                      <p className="text-[11px] text-muted-foreground italic">
                        Didn't get it? Check your spam folder or try again in a minute.
                      </p>
                      <div className="flex gap-2 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setResetSent(false)}
                          className="flex-1 h-11"
                        >
                          Try another email
                        </Button>
                        <Button
                          type="button"
                          onClick={() => switchMode(true)}
                          className="flex-1 h-11 institute-cta font-bold uppercase tracking-wider"
                        >
                          Back to Sign In
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}

              <div className="mt-5 pt-4 border-t border-border text-center">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Trusted by <span className="font-bold text-primary">2,40,000+</span> students across India
                </p>
              </div>
            </div>

            <p className="text-center text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-6">
              MatrixMindset · Office of the Registrar
            </p>
          </motion.div>
        </section>
      </div>
    </div>
  );
}

/* === Small presentational helpers === */

function FieldError({ error }: { error?: string }) {
  return (
    <AnimatePresence>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -4, height: 0 }}
          transition={{ duration: 0.18 }}
          className="text-xs text-destructive flex items-center gap-1.5 mt-1"
        >
          <X className="w-3 h-3" /> {error}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

function PwdCheck({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 transition-colors ${ok ? "text-success" : "text-muted-foreground"}`}>
      <motion.span
        initial={false}
        animate={{ scale: ok ? 1.1 : 1 }}
        transition={{ duration: 0.18 }}
        className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full ${ok ? "bg-success/20" : "bg-muted"}`}
      >
        {ok ? <Check className="w-2.5 h-2.5" /> : <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />}
      </motion.span>
      {label}
    </div>
  );
}

interface ValidatedInputProps extends Omit<React.ComponentProps<"input">, "onChange"> {
  value: string;
  onChange: (v: string) => void;
  error?: string;
  valid?: boolean;
}

function ValidatedInput({ value, onChange, error, valid, className = "", ...rest }: ValidatedInputProps) {
  return (
    <div className="relative">
      <Input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`bg-background h-11 pr-9 transition-colors ${
          error
            ? "border-destructive focus-visible:ring-destructive"
            : valid
              ? "border-success/60"
              : "border-border"
        } ${className}`}
      />
      {(valid || error) && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2">
          {error ? (
            <X className="w-4 h-4 text-destructive" />
          ) : (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 18 }}
            >
              <Check className="w-4 h-4 text-success" />
            </motion.span>
          )}
        </span>
      )}
    </div>
  );
}

function FieldEmail(props: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  error?: string;
  valid?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="email" className="text-[11px] font-bold text-primary uppercase tracking-wider">Email Address</Label>
      <ValidatedInput
        id="email"
        type="email"
        autoComplete="email"
        autoFocus={props.autoFocus}
        value={props.value}
        onChange={props.onChange}
        onBlur={props.onBlur}
        onKeyDown={props.onKeyDown}
        placeholder="aspirant@matrixmindset.in"
        error={props.error}
        valid={props.valid}
      />
      <FieldError error={props.error} />
    </div>
  );
}

function FieldPassword(props: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  valid?: boolean;
  show: boolean;
  toggleShow: () => void;
  autoFocus?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="password" className="text-[11px] font-bold text-primary uppercase tracking-wider">Password</Label>
      <div className="relative">
        <Input
          id="password"
          type={props.show ? "text" : "password"}
          autoComplete={props.show ? "off" : "current-password"}
          autoFocus={props.autoFocus}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          onBlur={props.onBlur}
          placeholder="••••••••"
          minLength={6}
          className={`bg-background h-11 pr-20 transition-colors ${
            props.error
              ? "border-destructive focus-visible:ring-destructive"
              : props.valid
                ? "border-success/60"
                : "border-border"
          }`}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {(props.valid || props.error) && (
            props.error
              ? <X className="w-4 h-4 text-destructive" />
              : (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 18 }}
                >
                  <Check className="w-4 h-4 text-success" />
                </motion.span>
              )
          )}
          <button
            type="button"
            onClick={props.toggleShow}
            aria-label={props.show ? "Hide password" : "Show password"}
            className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            {props.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <FieldError error={props.error} />
    </div>
  );
}
