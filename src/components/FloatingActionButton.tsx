import { useNavigate } from "react-router-dom";
import { FileUp } from "lucide-react";
import { motion } from "framer-motion";
import { triggerHaptic } from "@/lib/haptics";

export default function FloatingActionButton() {
  const navigate = useNavigate();

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      onClick={() => {
        triggerHaptic("light");
        navigate("/parse");
      }}
      className="fixed bottom-20 right-4 z-50 md:hidden w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center active:shadow-md transition-shadow"
      aria-label="Parse New Roadmap"
    >
      <FileUp className="w-6 h-6" />
    </motion.button>
  );
}
