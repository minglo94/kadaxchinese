let ctx: AudioContext | null = null;

export function unlockSfx() {
  if (typeof window === "undefined") return;
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
}

function tone(freq: number, dur = 0.08, type: OscillatorType = "sine", gain = 0.07) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  amp.gain.setValueAtTime(gain, t);
  amp.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(amp).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export const sfx = {
  ok() {
    tone(523, 0.06);
    tone(784, 0.1);
  },
  bad() {
    tone(196, 0.16, "square", 0.045);
  },
  combo() {
    tone(659, 0.05);
    tone(880, 0.09);
  },
  flip() {
    tone(420, 0.04, "triangle", 0.04);
  },
  win() {
    tone(523, 0.08);
    tone(659, 0.1);
    tone(784, 0.16);
  },
};
