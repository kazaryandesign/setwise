import { useEffect, useRef, useState } from 'react';
import { beep, flash } from './alerts';

/**
 * Countdown derived from an absolute end time, so it stays correct if the app is
 * backgrounded or reloaded. Fires the 0:10 and 0:00 alerts once each per rest.
 */
export function useRestTimer(endAt: number | undefined, sound: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  const fired = useRef<{ key?: number; warn: boolean; done: boolean }>({ warn: false, done: false });

  useEffect(() => {
    if (!endAt) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    const onVis = () => setNow(Date.now());
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVis); };
  }, [endAt]);

  const left = endAt ? Math.max(0, (endAt - now) / 1000) : 0;

  useEffect(() => {
    if (!endAt) return;
    const f = fired.current;
    if (f.key !== endAt) {
      // New rest (or +30s moved the end). Don't re-fire alerts that are already behind us.
      const startLeft = (endAt - Date.now()) / 1000;
      fired.current = { key: endAt, warn: startLeft <= 10, done: startLeft <= 0 };
      return;
    }
    if (document.visibilityState !== 'visible') return;
    if (!f.warn && left <= 10 && left > 0) { f.warn = true; if (sound) beep('warn'); flash(); }
    if (!f.done && left <= 0) { f.done = true; f.warn = true; if (sound) beep('done'); flash(); }
  }, [left, endAt, sound]);

  return left;
}
