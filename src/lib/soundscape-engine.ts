import { Howl, Howler } from "howler";

export type Soundscape = "off" | "white-noise" | "lofi" | "rain";

const AUDIO_URLS: Record<Exclude<Soundscape, "off">, string> = {
  "white-noise": "https://cdn.pixabay.com/audio/2022/03/10/audio_4dedf5bf94.mp3",
  "lofi": "https://cdn.pixabay.com/audio/2024/11/04/audio_3760f4eb4e.mp3",
  "rain": "https://cdn.pixabay.com/audio/2022/05/31/audio_982e0e7091.mp3",
};

const FADE_MS = 1000;

class SoundscapeEngine {
  private howls: Partial<Record<Exclude<Soundscape, "off">, Howl>> = {};
  private current: Soundscape = "off";
  private _volume = 0.5;
  private listeners = new Set<() => void>();

  get activeSoundscape(): Soundscape {
    return this.current;
  }

  get volume(): number {
    return this._volume;
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  private getOrCreate(id: Exclude<Soundscape, "off">): Howl {
    if (!this.howls[id]) {
      this.howls[id] = new Howl({
        src: [AUDIO_URLS[id]],
        loop: true,
        volume: 0,
        html5: true,
        preload: false,
      });
    }
    return this.howls[id]!;
  }

  play(id: Soundscape) {
    if (id === this.current) return;
    const prev = this.current;
    this.current = id;

    // Fade out previous
    if (prev !== "off") {
      const prevHowl = this.howls[prev];
      if (prevHowl && prevHowl.playing()) {
        prevHowl.fade(prevHowl.volume(), 0, FADE_MS);
        setTimeout(() => prevHowl.stop(), FADE_MS);
      }
    }

    // Fade in new
    if (id !== "off") {
      const howl = this.getOrCreate(id);
      if (!howl.playing()) {
        howl.load();
        howl.play();
      }
      howl.fade(0, this._volume, FADE_MS);
    }

    this.notify();
  }

  setVolume(v: number) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.current !== "off") {
      const howl = this.howls[this.current];
      if (howl) howl.volume(this._volume);
    }
    this.notify();
  }

  /** Pause audio without changing the selected soundscape */
  pause() {
    if (this.current !== "off") {
      const howl = this.howls[this.current];
      if (howl && howl.playing()) {
        howl.fade(howl.volume(), 0, FADE_MS);
        setTimeout(() => howl.pause(), FADE_MS);
      }
    }
  }

  /** Resume current soundscape after pause */
  resume() {
    if (this.current !== "off") {
      const howl = this.getOrCreate(this.current);
      if (!howl.playing()) {
        howl.load();
        howl.play();
      }
      howl.fade(0, this._volume, FADE_MS);
    }
  }

  stop() {
    if (this.current !== "off") {
      const howl = this.howls[this.current];
      if (howl) {
        howl.fade(howl.volume(), 0, FADE_MS);
        setTimeout(() => howl.stop(), FADE_MS);
      }
    }
    this.current = "off";
    this.notify();
  }
}

// Global singleton — persists across navigation
export const soundscapeEngine = new SoundscapeEngine();
