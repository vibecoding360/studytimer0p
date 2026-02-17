import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Zap, ArrowRight } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-success/15 mb-4">
            <Zap className="w-6 h-6 text-success" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">StudySync</h1>
          <p className="text-muted-foreground mt-1 text-sm">Your premium success & mastery engine</p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <div className="flex gap-1 mb-6 p-1 rounded-lg bg-secondary/50">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${isLogin ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${!isLogin ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="bg-secondary/50 border-border/50" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@university.edu" required className="bg-secondary/50 border-border/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="bg-secondary/50 border-border/50" />
            </div>
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? "Loading..." : isLogin ? "Sign In" : "Create Account"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
