import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useAdmin } from "@/hooks/use-admin";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading } = useAdmin();

  useEffect(() => {
    if (!loading && !authLoading && user && isAdmin) {
      navigate("/admin", { replace: true });
    }
  }, [isAdmin, loading, authLoading, user, navigate]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md crest-border">
        <CardHeader className="text-center">
          <div className="w-14 h-14 rounded-full mx-auto mb-3 border-2 border-accent/70 flex items-center justify-center bg-primary/10">
            <ShieldCheck className="w-7 h-7 text-accent" />
          </div>
          <CardTitle className="font-serif">Office of the Registrar</CardTitle>
          <CardDescription>Administrative Access · Restricted Area</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user ? (
            <>
              <p className="text-sm text-muted-foreground text-center">
                Sign in with an administrator account to manage courses.
                <span className="block mt-1 text-xs italic">
                  The first registered user is automatically granted admin privileges.
                </span>
              </p>
              <Button asChild className="w-full">
                <Link to="/auth">Go to Sign In</Link>
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 rounded-md border border-destructive/40 bg-destructive/5">
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive-foreground">
                  Your account does not have administrator privileges. Contact an existing admin to be granted access.
                </p>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link to="/">Return to Dashboard</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
