import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useAdmin } from "@/hooks/use-admin";
import { LayoutDashboard, Zap, LogOut, ChevronLeft, ChevronRight, Search, CalendarDays, GraduationCap, ShieldCheck, BookOpen } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Zap, label: "Mastery Hub", path: "/timer" },
  { icon: CalendarDays, label: "365 Challenge", path: "/365" },
  { icon: BookOpen, label: "Courses", path: "/courses" },
];

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const items = isAdmin
    ? [...navItems, { icon: ShieldCheck, label: "Admin", path: "/admin" }]
    : navItems;

  const handleSignOut = async () => {
    await signOut();
    toast.success("You have been securely signed out.");
    navigate("/auth");
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="h-screen sticky top-0 flex flex-col border-r border-border/50 bg-sidebar p-3 gap-1"
    >
      <div className={cn("flex items-center gap-2.5 px-2 py-3 mb-2 border-b border-sidebar-border", collapsed && "justify-center")}>
        <div className="w-9 h-9 rounded-full border-2 border-accent/70 flex items-center justify-center shrink-0 bg-sidebar-accent">
          <GraduationCap className="w-4 h-4 text-accent" />
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <span className="font-serif text-sm font-semibold tracking-wide text-sidebar-foreground block">MatrixMindset</span>
            <span className="text-[9px] uppercase tracking-[0.2em] text-accent/80">Institutum</span>
          </div>
        )}
      </div>

      <nav className="flex-1 flex flex-col gap-0.5">
        {items.map(({ icon: Icon, label, path }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1">
        <button
          onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-all",
            collapsed && "justify-center px-0"
          )}
          title="Search (⌘K)"
        >
          <Search className="w-4 h-4 shrink-0" />
          {!collapsed && (
            <>
              <span>Search</span>
              <kbd className="ml-auto text-[10px] font-mono bg-secondary px-1.5 py-0.5 rounded">⌘K</kbd>
            </>
          )}
        </button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
        {user && (
          <button
            onClick={() => setShowSignOutDialog(true)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all",
              collapsed && "justify-center px-0"
            )}
            title={collapsed ? "Sign Out" : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        )}
      </div>

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
    </motion.aside>
  );
}
