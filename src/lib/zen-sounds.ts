// Zen notification sounds using Web Audio API — no external files needed.

const audioCtx = () => new (window.AudioContext || (window as any).webkitAudioContext)();

/** Soft chime — used when a focus session completes */
export function playCompletionChime() {
  const ctx = audioCtx();
  const now = ctx.currentTime;

  // Three harmonious tones in sequence
  const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5

  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "sine";
    osc.frequency.value = freq;

    filter.type = "lowpass";
    filter.frequency.value = 2000;
    filter.Q.value = 1;

    gain.gain.setValueAtTime(0, now + i * 0.18);
    gain.gain.linearRampToValueAtTime(0.25, now + i * 0.18 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.8);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + i * 0.18);
    osc.stop(now + i * 0.18 + 0.8);
  });

  setTimeout(() => ctx.close(), 2000);
}

/** Soft ping — used when a break ends */
export function playBreakEndPing() {
  const ctx = audioCtx();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "triangle";
  osc.frequency.value = 440; // A4

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.2, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.6);

  setTimeout(() => ctx.close(), 1000);
}

/** Soft tick — used for the last-10-second countdown */
export function playUrgencyTick() {
  const ctx = audioCtx();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.value = 880;

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.08, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.15);

  setTimeout(() => ctx.close(), 500);
}
