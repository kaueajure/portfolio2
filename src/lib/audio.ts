export class AudioEngine {
  private context: AudioContext | null = null;
  private enabled = false;
  private last = 0;
  private volume = 0.035;
  private visibility = () => {
    if (document.hidden) void this.context?.suspend();
    else if (this.enabled) void this.context?.resume().catch(() => {});
  };
  async enable() {
    try {
      this.context ??= new AudioContext();
      await this.context.resume();
      this.enabled = true;
      document.addEventListener("visibilitychange", this.visibility);
      try {
        localStorage.setItem("kaue.sound.v1", "on");
      } catch {}
      this.play("enable");
      return true;
    } catch {
      this.enabled = false;
      return false;
    }
  }
  disable() {
    this.enabled = false;
    void this.context?.suspend();
    try {
      localStorage.setItem("kaue.sound.v1", "off");
    } catch {}
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
  play(kind: "enable" | "stage" | "project" = "stage") {
    const ctx = this.context;
    if (
      !this.enabled ||
      !ctx ||
      document.hidden ||
      performance.now() - this.last < 350
    )
      return;
    this.last = performance.now();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
      kind === "project" ? 420 : 660,
      ctx.currentTime,
    );
    oscillator.frequency.exponentialRampToValueAtTime(
      kind === "enable" ? 880 : 330,
      ctx.currentTime + 0.09,
    );
    gain.gain.setValueAtTime(this.volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.13);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }
  cleanup() {
    document.removeEventListener("visibilitychange", this.visibility);
    this.enabled = false;
    void this.context?.close();
    this.context = null;
  }
}
export const audioEngine = new AudioEngine();
