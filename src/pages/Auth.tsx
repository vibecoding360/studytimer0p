import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ArrowRight, GraduationCap, Trophy, Users, Award, Sparkles, ShieldCheck, Phone } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        navigate("/");
      } else {
        await signUp(email, password, name);
        toast({ title: "Account created", description: "You're now signed in." });
        navigate("/");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
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

            {/* Stats grid */}
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

            {/* Trust strip */}
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
                {isLogin ? "Welcome Back, Topper" : "Begin Your Journey"}
              </h2>
              <div className="gold-rule w-24 mx-auto mt-3" />
            </div>

            <div className="bg-card border-2 border-border rounded-md p-7 shadow-lg relative">
              <div className="ribbon">Free Trial</div>

              <div className="flex gap-1 mb-6 mt-3 p-1 rounded-md bg-secondary border border-border">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-sm transition-all duration-200 ${isLogin ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-sm transition-all duration-200 ${!isLogin ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Register
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-[11px] font-bold text-primary uppercase tracking-wider">Full Name</Label>
                    <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="As per your school records" className="bg-background border-border h-11" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[11px] font-bold text-primary uppercase tracking-wider">Email Address</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="aspirant@matrixmindset.in" required className="bg-background border-border h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-[11px] font-bold text-primary uppercase tracking-wider">Password</Label>
                  <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="bg-background border-border h-11" />
                </div>
                <Button type="submit" className="w-full gap-2 institute-cta h-12 text-base font-bold uppercase tracking-wider" disabled={loading}>
                  {loading ? "Loading..." : isLogin ? "Enter Portal" : "Create Account"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>

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
