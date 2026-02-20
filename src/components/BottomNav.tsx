import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Zap, Timer, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const tabs = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Timer, label: "Timer", path: "/timer" },
  { icon: Zap, label: "Mastery", path: "/study-architect" },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success("You have been securely signed out.");
    navigate("/auth");
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/95 backdrop-blur-xl border-t border-border/50 safe-area-bottom">
        <div className="flex items-stretch justify-around h-16">
          {tabs.map(({ icon: Icon, label, path }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 min-w-[48px] min-h-[48px] relative transition-colors duration-200",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="bottomnav-pill"
                    className="absolute top-1 w-8 h-1 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
          {user && (
            <button
              onClick={() => setShowSignOutDialog(true)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 min-w-[48px] min-h-[48px] text-muted-foreground hover:text-destructive transition-colors duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-[10px] font-medium">Sign Out</span>
            </button>
          )}
        </div>
      </nav>

      <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              Any active Deep Work session will be lost. You can sign back in anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSignOut} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
