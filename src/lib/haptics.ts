type HapticStyle = "light" | "medium" | "heavy";

const DURATIONS: Record<HapticStyle, number> = {
  light: 10,
  medium: 25,
  heavy: 50,
};

export function triggerHaptic(style: HapticStyle = "light") {
  if ("vibrate" in navigator) {
    navigator.vibrate(DURATIONS[style]);
  }
}
