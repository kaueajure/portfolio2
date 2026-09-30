export type Sound =
  | "enable"
  | "stage"
  | "project"
  | "boot"
  | "code"
  | "snap"
  | "request"
  | "build"
  | "reveal";
export class AudioEngine {
  private context: AudioContext | null = null;
  private enabled = false;
  private last = -Infinity;
  private volume = 0.025;
  private listeners = new Set<() => void>();
  private generation = 0;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  getSnapshot = () => this.enabled;
  private publish() {
    this.listeners.forEach((fn) => fn());
  }
  private visibility = () => {
    if (document.hidden) void this.context?.suspend().catch(() => {});
    else if (this.enabled) void this.context?.resume().catch(() => {});
  };
  async enable() {
    const generation = this.generation;
    try {
      this.context ??= new AudioContext();
      await this.context.resume();
      if (generation !== this.generation) return false;
      this.enabled = true;
      document.addEventListener("visibilitychange", this.visibility);
      try {
        localStorage.setItem("kaue.sound.v1", "on");
      } catch {}
      this.publish();
      this.play("enable");
      return true;
    } catch {
      this.enabled = false;
      this.publish();
      return false;
    }
  }
  disable() {
    this.generation++;
    this.enabled = false;
    void this.context?.suspend().catch(() => {});
    try {
      localStorage.setItem("kaue.sound.v1", "off");
    } catch {}
    this.publish();
  }
  async toggle() {
    if (this.enabled) {
      this.disable();
      return false;
    }
    return this.enable();
  }
  setVolume(value: number) {
    this.volume = Math.min(0.08, Math.max(0, value));
  }
  play(kind: Sound = "stage") {
    const ctx = this.context;
    if (
      !this.enabled ||
      !ctx ||
      ctx.state !== "running" ||
      document.hidden ||
      performance.now() - this.last < 180
    )
      return;
    this.last = performance.now();
    const now = ctx.currentTime;
    const duration =
      kind === "reveal"
        ? 0.55
        : kind === "build"
          ? 0.32
          : kind === "code"
            ? 0.045
            : 0.13;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(this.volume, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    gain.connect(ctx.destination);
    // Filtered transients give code/snap/request a tactile sound; reveal uses a soft air sweep.
    const buffer = ctx.createBuffer(
      1,
      Math.ceil(ctx.sampleRate * duration),
      ctx.sampleRate,
    );
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++)
      samples[i] = (Math.random() * 2 - 1) * 0.35;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 0.7;
    filter.frequency.setValueAtTime(kind === "reveal" ? 500 : 2200, now);
    filter.frequency.exponentialRampToValueAtTime(
      kind === "reveal" ? 3200 : 700,
      now + duration,
    );
    noise.connect(filter);
    filter.connect(gain);
    noise.start(now);
    noise.stop(now + duration);
    noise.onended = () => {
      noise.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
    if (["code", "snap", "reveal"].includes(kind)) return;
    const tones =
      kind === "build"
        ? [440, 660, 880]
        : kind === "request"
          ? [280, 560]
          : [220, 330];
    tones.forEach((hz, index) => {
      const oscillator = ctx.createOscillator();
      const envelope = ctx.createGain();
      const at = now + index * 0.025;
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(hz, at);
      oscillator.frequency.exponentialRampToValueAtTime(
        hz * 1.12,
        at + duration,
      );
      envelope.gain.setValueAtTime(0.0001, at);
      envelope.gain.exponentialRampToValueAtTime(this.volume * 0.3, at + 0.01);
      envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
      oscillator.connect(envelope);
      envelope.connect(ctx.destination);
      oscillator.start(at);
      oscillator.stop(at + duration);
      oscillator.onended = () => {
        oscillator.disconnect();
        envelope.disconnect();
      };
    });
  }
  cleanup() {
    this.generation++;
    document.removeEventListener("visibilitychange", this.visibility);
    this.enabled = false;
    void this.context?.close().catch(() => {});
    this.context = null;
    this.publish();
  }
}
export const audioEngine = new AudioEngine();
