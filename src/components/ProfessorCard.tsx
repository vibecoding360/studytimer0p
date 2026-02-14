import { Card, CardContent } from "@/components/ui/card";
import { User, Mail, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  professorName?: string | null;
  professorEmail?: string | null;
  officeHours?: string | null;
}

export default function ProfessorCard({ professorName, professorEmail, officeHours }: Props) {
  if (!professorName && !professorEmail && !officeHours) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <Card className="glass-card overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary/60" />
        <CardContent className="pt-4 pb-4 px-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Professor</p>
          <div className="space-y-2.5">
            {professorName && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{professorName}</span>
              </div>
            )}
            {professorEmail && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 shrink-0" />
                <a href={`mailto:${professorEmail}`} className="hover:text-primary transition-colors">{professorEmail}</a>
              </div>
            )}
            {officeHours && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 shrink-0" />
                <span>{officeHours}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
