import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import AppSidebar from "./AppSidebar";
import CommandBar from "./CommandBar";
import PageTransition from "./PageTransition";
import ThemeToggle from "./ThemeToggle";

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6 lg:p-8">
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
    </div>
  );
}
