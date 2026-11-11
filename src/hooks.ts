import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, DEFAULT_SETTINGS, type Session, type SetLog, type Settings } from './db';

export interface Data {
  sessions: Session[];
  logs: SetLog[];
  settings: Settings;
}

/** Everything, live. A single lifter's history is small enough to keep in memory. */
export function useData(): Data | undefined {
  return useLiveQuery(async () => {
    const [sessions, logs, row] = await Promise.all([db.sessions.toArray(), db.sets.toArray(), db.kv.get('settings')]);
    return { sessions, logs, settings: { ...DEFAULT_SETTINGS, ...((row?.value as Partial<Settings>) ?? {}) } };
  });
}

export function useNow(ms = 1000): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

export function formatElapsed(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
}

export function formatDuration(ms: number): string {
  const m = Math.round(ms / 60000);
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
}

export function fmtW(w: number): string {
  return Number.isInteger(w) ? String(w) : w.toFixed(1);
}

export function dayLabel(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function daysAgo(ts: number, now = Date.now()): string {
  const a = new Date(ts); a.setHours(0, 0, 0, 0);
  const b = new Date(now); b.setHours(0, 0, 0, 0);
  const d = Math.round((b.getTime() - a.getTime()) / 86400000);
  return d === 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`;
}

export function isStandalone(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
}
