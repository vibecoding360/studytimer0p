import { motion, AnimatePresence } from "framer-motion";
import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlanItem } from "@/lib/planning";

interface TodaysPlanProps {
  planItems: PlanItem[];
}

export default function TodaysPlan({ planItems }: TodaysPlanProps) {
  return (
    <Card className="rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Today&apos;s Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <AnimatePresence mode="wait">
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {planItems.length > 0 ? (
              <div className="space-y-2">
                {planItems.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-border/40 p-3 bg-card hover:shadow-md transition-shadow duration-200"
                  >
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.detail}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Add syllabus dates, grading data, and roadmap tasks to auto-generate your plan.
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
