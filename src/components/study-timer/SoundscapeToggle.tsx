import { Volume2, VolumeX, CloudRain, Radio, Waves } from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { useState, useSyncExternalStore } from "react";
import { soundscapeEngine, type Soundscape } from "@/lib/soundscape-engine";

const options: { id: Soundscape; icon: typeof Volume2; label: string }[] = [
  { id: "off", icon: VolumeX, label: "Off" },
  { id: "white-noise", icon: Waves, label: "White Noise" },
  { id: "lofi", icon: Radio, label: "Lo-Fi" },
  { id: "rain", icon: CloudRain, label: "Rain" },
];

export default function SoundscapeToggle() {
  const [showVolume, setShowVolume] = useState(false);

  const active = useSyncExternalStore(
    (cb) => soundscapeEngine.subscribe(cb),
    () => soundscapeEngine.activeSoundscape
  );
  const volume = useSyncExternalStore(
    (cb) => soundscapeEngine.subscribe(cb),
    () => soundscapeEngine.volume
  );

  return (
    <div
      className="flex items-center gap-2"
      onMouseEnter={() => setShowVolume(true)}
      onMouseLeave={() => setShowVolume(false)}
    >
      <div className="flex items-center gap-1 bg-secondary/30 rounded-lg p-1">
        {options.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => soundscapeEngine.play(id)}
            title={label}
            className={cn(
              "p-2 rounded-md transition-all text-muted-foreground touch-target flex items-center justify-center",
              active === id && "bg-primary/20 text-primary shadow-sm"
            )}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      {showVolume && active !== "off" && (
        <div className="w-24 animate-in fade-in slide-in-from-left-2 duration-200">
          <Slider
            value={[Math.round(volume * 100)]}
            max={100}
            step={1}
            onValueChange={([v]) => soundscapeEngine.setVolume(v / 100)}
            className="cursor-pointer"
          />
        </div>
      )}
    </div>
  );
}
