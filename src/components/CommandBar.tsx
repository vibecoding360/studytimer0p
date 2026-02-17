import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { LayoutDashboard, Calendar, Calculator, Upload, Compass, Zap, Timer } from "lucide-react";

const pages = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Mastery Hub", path: "/timer", icon: Zap },
  { label: "Upload Roadmap", path: "/parse", icon: Upload },
  { label: "Smart Calendar", path: "/calendar", icon: Calendar },
  { label: "Grade Simulator", path: "/grades", icon: Calculator },
  { label: "Study Architect", path: "/study-architect", icon: Compass },
];

interface Course {
  id: string;
  name: string;
  code: string | null;
  color: string;
}

export default function CommandBar() {
  const [open, setOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (open) {
      supabase.from("courses").select("id,name,code,color").then(({ data }) => {
        if (data) setCourses(data);
      });
    }
  }, [open]);

  const go = useCallback((path: string) => {
    navigate(path);
    setOpen(false);
  }, [navigate]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages, mastery tracks..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Pages">
          {pages.map(p => (
            <CommandItem key={p.path} onSelect={() => go(p.path)} className="gap-3 cursor-pointer">
              <p.icon className="w-4 h-4 text-muted-foreground" />
              <span>{p.label}</span>
              {p.path === "/" && (
                <kbd className="ml-auto pointer-events-none text-[10px] font-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">⌘K</kbd>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
        {courses.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Mastery Tracks">
              {courses.map(c => (
                <CommandItem key={c.id} onSelect={() => go(`/parse?course=${c.id}`)} className="gap-3 cursor-pointer">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  <span>{c.name}</span>
                  {c.code && <span className="ml-auto text-xs text-muted-foreground">{c.code}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
