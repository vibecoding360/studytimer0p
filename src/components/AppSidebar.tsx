import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { LayoutDashboard, Calendar, Calculator, Upload, BookOpen, Compass, LogOut, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Upload, label: "Parse Syllabus", path: "/parse" },
  { icon: Calendar, label: "Calendar", path: "/calendar" },
  { icon: Calculator, label: "Grade Calculator", path: "/grades" },
  { icon: Compass, label: "Study Architect", path: "/study-architect" },
];

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="h-screen sticky top-0 flex flex-col border-r border-border/50 bg-sidebar p-3 gap-1"
    >
      <div className={cn("flex items-center gap-2 px-2 py-3 mb-2", collapsed && "justify-center")}>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <BookOpen className="w-4 h-4 text-primary" />
        </div>
        {!collapsed && <span className="font-semibold text-sm tracking-tight">Syllabus Command</span>}
      </div>

      <nav className="flex-1 flex flex-col gap-0.5">
        {navItems.map(({ icon: Icon, label, path }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
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
            onClick={() => signOut()}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all",
              collapsed && "justify-center px-0"
            )}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        )}
      </div>
    </motion.aside>
  );
}
