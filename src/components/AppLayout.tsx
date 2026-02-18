import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
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
        <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
          <div className="flex justify-end mb-2">
            <ThemeToggle />
          </div>
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </div>
      </main>
      <CommandBar />
      {/* Mobile-only bottom nav and FAB */}
      <FloatingActionButton />
      <BottomNav />
    </div>
  );
}
