import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { GraduationCap } from "lucide-react";
import AppSidebar from "./AppSidebar";
import CommandBar from "./CommandBar";
import PageTransition from "./PageTransition";
import ThemeToggle from "./ThemeToggle";
import BottomNav from "./BottomNav";
import FloatingActionButton from "./FloatingActionButton";

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        {/* Collegiate top banner */}
        <header className="college-banner border-b-4 border-accent">
          <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full border-2 border-accent/80 flex items-center justify-center bg-primary/40">
                <GraduationCap className="w-5 h-5 text-accent" />
              </div>
              <div className="leading-tight">
                <p className="font-serif text-base md:text-lg font-semibold tracking-wide">MatrixMindset</p>
                <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-accent/90">Institutum Disciplinae · Est. MMXXV</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
          <div className="gold-rule" />
        </header>

        <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </div>

        {/* Collegiate footer */}
        <footer className="border-t-4 border-double border-accent/60 mt-12 bg-primary/5">
          <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6 text-center">
            <div className="gold-rule mb-4" />
            <p className="font-serif text-sm text-muted-foreground italic">
              Discipline is the architecture of freedom.
            </p>
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-2">
              MatrixMindset · Office of the Registrar
            </p>
          </div>
        </footer>
      </main>
      <CommandBar />
      {/* Mobile-only bottom nav and FAB */}
      <FloatingActionButton />
      <BottomNav />
    </div>
  );
}
