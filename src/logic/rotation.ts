import { DAY_ORDER, type DayId } from '../program';
import type { Session } from '../db';

/** The day after the most recently finished session, Push → Pull → Legs → Push. */
export function nextDay(sessions: Session[]): DayId {
  const done = sessions.filter((s) => s.endedAt).sort((a, b) => b.startedAt - a.startedAt);
  if (!done.length) return 'push';
  const i = DAY_ORDER.indexOf(done[0].dayId);
  return DAY_ORDER[(i + 1) % DAY_ORDER.length];
}

/** Most recent finished session of a given day, optionally strictly before a timestamp. */
export function lastSessionOf(sessions: Session[], dayId: DayId, before = Infinity): Session | undefined {
  return sessions
    .filter((s) => s.endedAt && s.dayId === dayId && s.startedAt < before)
    .sort((a, b) => b.startedAt - a.startedAt)[0];
}
