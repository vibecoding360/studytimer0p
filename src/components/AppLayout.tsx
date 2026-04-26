import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { GraduationCap, Phone, Mail, Trophy, Award, ShieldCheck } from "lucide-react";
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
        {/* Helpline strip */}
        <div className="helpline-strip">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-1.5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <span className="hidden sm:flex items-center gap-1.5"><Phone className="w-3 h-3" /> 1800-MATRIX-1</span>
              <span className="hidden md:flex items-center gap-1.5"><Mail className="w-3 h-3" /> admissions@matrixmindset.in</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] font-semibold">
              <span className="hidden sm:flex items-center gap-1"><Trophy className="w-3 h-3" /> AIR 1 · 2024</span>
              <span className="flex items-center gap-1"><Award className="w-3 h-3" /> 18,000+ Selections</span>
              <span className="hidden md:flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> ISO Certified</span>
            </div>
          </div>
        </div>

        {/* Collegiate top banner */}
        <header className="college-banner border-b-4 border-accent">
          <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="seal w-11 h-11 rounded-full flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="leading-tight">
                <p className="font-serif text-lg md:text-xl font-bold tracking-wide">MatrixMindset</p>
                <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-accent/90">India's Premier Coaching Institute · Est. MMXXV</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex flex-col items-end leading-tight">
                <span className="text-[10px] uppercase tracking-[0.2em] text-accent/90">Today's Toppers</span>
                <span className="font-serif text-sm font-semibold">JEE · NEET · Foundation</span>
              </div>
              <ThemeToggle />
            </div>
          </div>
          {/* Marquee announcement */}
          <div className="bg-primary/40 border-t border-accent/30">
            <div className="max-w-6xl mx-auto px-4 md:px-6 py-1.5 marquee text-[11px] tracking-wide">
              <span className="marquee-track">
                🏆 Admissions OPEN for 2026 Batch · 🎯 100% Scholarship for Top Rankers · 🧑‍🏫 Live classes by IIT/AIIMS Alumni · 📚 Free Mock Tests every Sunday · 🏆 18,000+ Selections in JEE / NEET / Olympiads · 📞 Call 1800-MATRIX-1 to book a Free Counselling Session ·
              </span>
            </div>
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
          <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8">
            <div className="gold-rule mb-6" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
              <div>
                <p className="font-serif font-semibold text-primary mb-2">Programmes</p>
                <ul className="space-y-1 text-muted-foreground text-xs">
                  <li>JEE Main + Advanced</li>
                  <li>NEET UG</li>
                  <li>Foundation (VI–X)</li>
                  <li>Olympiads & KVPY</li>
                </ul>
              </div>
              <div>
                <p className="font-serif font-semibold text-primary mb-2">Institute</p>
                <ul className="space-y-1 text-muted-foreground text-xs">
                  <li>About Us</li>
                  <li>Faculty</li>
                  <li>Results</li>
                  <li>Centres</li>
                </ul>
              </div>
              <div>
                <p className="font-serif font-semibold text-primary mb-2">Resources</p>
                <ul className="space-y-1 text-muted-foreground text-xs">
                  <li>Free Mock Tests</li>
                  <li>Previous Papers</li>
                  <li>Study Material</li>
                  <li>Doubt Forum</li>
                </ul>
              </div>
              <div>
                <p className="font-serif font-semibold text-primary mb-2">Reach Us</p>
                <ul className="space-y-1 text-muted-foreground text-xs">
                  <li>1800-MATRIX-1</li>
                  <li>admissions@matrixmindset.in</li>
                  <li>Mon–Sat · 9am – 8pm</li>
                </ul>
              </div>
            </div>
            <div className="text-center mt-8">
              <p className="font-serif text-sm text-muted-foreground italic">
                "Discipline is the architecture of freedom."
              </p>
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-2">
                © MMXXV MatrixMindset · All Rights Reserved
              </p>
            </div>
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
