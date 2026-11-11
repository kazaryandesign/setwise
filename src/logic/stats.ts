import { findExercise, getDay, type DayId } from '../program';
import type { Session, SetLog } from '../db';
import { restFor } from './rest';
import { workingWeight } from './progression';

const WORK_SEC_PER_SET = 40;

export function estimateMinutes(dayId: DayId, overrides: Record<string, number> = {}): number {
  const day = getDay(dayId);
  const sec = day.exercises.reduce((t, ex) => t + ex.sets * (restFor(dayId, ex, overrides) + WORK_SEC_PER_SET), 0);
  return Math.round(sec / 60 / 5) * 5;
}

function meta(l: SetLog) {
  return findExercise(l.dayId, l.slotId);
}

/** Weight × reps; dumbbells count both hands; assisted machines excluded. */
export function volume(logs: SetLog[]): number {
  return logs.reduce((v, l) => {
    const ex = meta(l);
    if (ex.kind === 'assisted') return v;
    return v + l.weight * l.reps * (ex.perHand ? 2 : 1);
  }, 0);
}

export function volumeByName(logs: SetLog[]): { name: string; volume: number }[] {
  const map = new Map<string, number>();
  for (const l of logs) map.set(l.name, (map.get(l.name) ?? 0) + volume([l]));
  return [...map.entries()].map(([name, v]) => ({ name, volume: v })).filter((x) => x.volume > 0);
}

export interface PR {
  name: string;
  kind: 'weight' | 'reps';
  weight: number;
  reps: number;
  /** Previous best at that weight (reps PR) or previous top weight (weight PR). */
  previous: number | null;
}

/** PRs set in `sessionLogs`, judged against all earlier logs. */
export function findPRs(sessionLogs: SetLog[], earlier: SetLog[]): PR[] {
  const out: PR[] = [];
  const names = [...new Set(sessionLogs.map((l) => l.name))];
  for (const name of names) {
    const mine = sessionLogs.filter((l) => l.name === name);
    const before = earlier.filter((l) => l.name === name);
    if (!before.length) continue; // first time isn't a PR, it's a baseline
    const kind = meta(mine[0]).kind;
    const top = workingWeight(kind, mine)!;
    const prevTop = workingWeight(kind, before)!;
    const better = kind === 'assisted' ? top < prevTop : top > prevTop;
    const repsAtTop = Math.max(...mine.filter((l) => l.weight === top).map((l) => l.reps));
    if (better) {
      out.push({ name, kind: 'weight', weight: top, reps: repsAtTop, previous: prevTop });
      continue;
    }
    const prevAtTop = before.filter((l) => l.weight === top).map((l) => l.reps);
    if (prevAtTop.length && repsAtTop > Math.max(...prevAtTop)) {
      out.push({ name, kind: 'reps', weight: top, reps: repsAtTop, previous: Math.max(...prevAtTop) });
    }
  }
  return out;
}

function weekStart(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.getTime();
}

/** Consecutive weeks (Sun–Sat) with ≥ `min` finished sessions. The current week only counts once it qualifies. */
export function streakWeeks(sessions: Session[], now = Date.now(), min = 3): number {
  const counts = new Map<number, number>();
  for (const s of sessions) if (s.endedAt) counts.set(weekStart(s.startedAt), (counts.get(weekStart(s.startedAt)) ?? 0) + 1);
  let wk = weekStart(now);
  let n = 0;
  if ((counts.get(wk) ?? 0) >= min) n++;
  const step = (t: number) => { const d = new Date(t); d.setDate(d.getDate() - 7); return d.getTime(); };
  wk = step(wk);
  while ((counts.get(wk) ?? 0) >= min) { n++; wk = step(wk); }
  return n;
}

/** Working weight per session for one exercise name, oldest → newest, last `limit` sessions. */
export function trend(name: string, logs: SetLog[], sessions: Session[], limit = 8): { at: number; weight: number }[] {
  const byId = new Map(sessions.map((s) => [s.id!, s]));
  const groups = new Map<number, SetLog[]>();
  for (const l of logs) if (l.name === name && byId.get(l.sessionId)?.endedAt) groups.set(l.sessionId, [...(groups.get(l.sessionId) ?? []), l]);
  return [...groups.entries()]
    .map(([sid, ls]) => ({ at: byId.get(sid)!.startedAt, weight: workingWeight(meta(ls[0]).kind, ls)! }))
    .sort((a, b) => a.at - b.at)
    .slice(-limit);
}
