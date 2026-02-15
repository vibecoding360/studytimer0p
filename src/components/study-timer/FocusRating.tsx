import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useState } from "react";

interface FocusRatingProps {
  onRate: (score: number) => void;
}

export default function FocusRating({ onRate }: FocusRatingProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col items-center gap-4"
    >
      <p className="text-sm text-muted-foreground">How focused were you?</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onRate(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className="w-8 h-8 transition-colors"
              fill={star <= hovered ? "hsl(160, 100%, 50%)" : "transparent"}
              stroke={star <= hovered ? "hsl(160, 100%, 50%)" : "hsl(var(--muted-foreground))"}
            />
          </button>
        ))}
      </div>
    </motion.div>
  );
}
