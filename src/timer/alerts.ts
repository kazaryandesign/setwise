// iOS Safari has no Vibration API for web apps, so alerts are a sound plus a screen flash.
let ctx: AudioContext | null = null;

/** Call from a user tap (e.g. Start) — iOS only lets audio start inside a gesture. */
export function unlockAudio(): void {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    // A silent blip keeps the context unlocked on iOS.
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    g.gain.value = 0.0001;
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.01);
  } catch {
    /* audio is a nicety; never block the workout */
  }
}

function tone(freq: number, at: number, dur: number) {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(0.6, at + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(ctx.destination);
  o.start(at);
  o.stop(at + dur + 0.02);
}

export function beep(kind: 'warn' | 'done'): void {
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume();
  const t = ctx.currentTime + 0.02;
  if (kind === 'warn') tone(880, t, 0.18);
  else [0, 0.22, 0.44].forEach((d) => tone(1175, t + d, 0.16));
  if ('vibrate' in navigator) navigator.vibrate?.(kind === 'warn' ? 120 : [200, 100, 200]);
}

export function flash(): void {
  const el = document.getElementById('flash');
  if (!el) return;
  el.classList.remove('on');
  void el.offsetWidth; // restart the animation
  el.classList.add('on');
}
