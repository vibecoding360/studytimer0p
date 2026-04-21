import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Zap, ArrowRight, GraduationCap } from "lucide-react";

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
      {/* University header banner */}
      <header className="college-banner border-b-4 border-accent">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-accent/80 flex items-center justify-center bg-primary/40">
              <GraduationCap className="w-5 h-5 text-accent" />
            </div>
            <div className="leading-tight">
              <p className="font-serif text-lg font-semibold tracking-wide">MatrixMindset</p>
              <p className="text-[10px] uppercase tracking-[0.25em] text-accent/90">Institutum Disciplinae · Est. MMXXV</p>
            </div>
          </div>
          <p className="hidden md:block text-xs uppercase tracking-[0.2em] text-accent/90">Office of the Registrar</p>
        </div>
        <div className="gold-rule" />
      </header>

      <div className="flex-1 flex items-center justify-center p-4 parchment">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border-2 border-accent bg-card mb-4 shadow-md">
              <Zap className="w-7 h-7 text-primary" />
            </div>
            <div className="gold-rule w-24 mx-auto mb-3" />
            <h1 className="font-serif text-3xl font-bold tracking-tight text-primary">MatrixMindset</h1>
            <p className="text-muted-foreground mt-2 text-sm font-serif italic">Discipline is the architecture of freedom.</p>
            <div className="gold-rule w-24 mx-auto mt-3" />
          </div>

          <div className="bg-card border border-border rounded-md p-8 shadow-md crest-border">
            <p className="text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-6">Student Portal</p>
            <div className="flex gap-1 mb-6 p-1 rounded-md bg-secondary border border-border">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 text-sm font-medium rounded-sm transition-all duration-200 ${isLogin ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 text-sm font-medium rounded-sm transition-all duration-200 ${!isLogin ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-semibold text-primary uppercase tracking-wider">Name</Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="bg-background border-border" />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold text-primary uppercase tracking-wider">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@university.edu" required className="bg-background border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-semibold text-primary uppercase tracking-wider">Password</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="bg-background border-border" />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? "Loading..." : isLogin ? "Sign In" : "Create Account"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </div>

          <p className="text-center text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-6">
            MatrixMindset · Office of the Registrar
          </p>
        </motion.div>
      </div>
    </div>
  );
}
