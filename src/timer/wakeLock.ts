import { useEffect } from 'react';

type Sentinel = { release: () => Promise<void> };

/** Keeps the screen on while `active` (iOS 16.4+, Chrome). Re-acquired when the app returns to the foreground. */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const wl = (navigator as unknown as { wakeLock?: { request: (t: 'screen') => Promise<Sentinel> } }).wakeLock;
    if (!wl) return;
    let sentinel: Sentinel | null = null;
    let cancelled = false;
    const acquire = async () => {
      try {
        if (document.visibilityState === 'visible') sentinel = await wl.request('screen');
        if (cancelled) void sentinel?.release();
      } catch {
        /* denied or unsupported: ignore */
      }
    };
    const onVis = () => { if (document.visibilityState === 'visible') void acquire(); };
    void acquire();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVis);
      void sentinel?.release();
    };
  }, [active]);
}
