import { Volume2, VolumeX, CloudRain, Radio, Waves } from "lucide-react";
import { cn } from "@/lib/utils";

type Soundscape = "off" | "white-noise" | "lofi" | "rain";

interface SoundscapeToggleProps {
  active: Soundscape;
  onChange: (s: Soundscape) => void;
}

const options: { id: Soundscape; icon: typeof Volume2; label: string }[] = [
  { id: "off", icon: VolumeX, label: "Off" },
  { id: "white-noise", icon: Waves, label: "White Noise" },
  { id: "lofi", icon: Radio, label: "Lo-Fi" },
  { id: "rain", icon: CloudRain, label: "Rain" },
];

export default function SoundscapeToggle({ active, onChange }: SoundscapeToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-secondary/30 rounded-lg p-1">
      {options.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          title={label}
          className={cn(
            "p-2 rounded-md transition-all text-muted-foreground",
            active === id && "bg-primary/20 text-primary shadow-sm"
          )}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}
