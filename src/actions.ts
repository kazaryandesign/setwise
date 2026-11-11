import { db, type Session, type SetLog } from './db';
import { getDay, type DayId } from './program';
import { cursor } from './logic/session';
import { restFor } from './logic/rest';

export async function startSession(dayId: DayId, order: string[], swaps: Record<string, string>): Promise<number> {
  return db.sessions.add({ dayId, startedAt: Date.now(), order, swaps, phase: 'set' });
}

export async function sessionLogs(sessionId: number): Promise<SetLog[]> {
  return db.sets.where('sessionId').equals(sessionId).sortBy('loggedAt');
}

/** Log the current set. Returns 'rest' or 'done' (session finished). */
export async function logSet(session: Session, weight: number, reps: number, restOverrides: Record<string, number>): Promise<'rest' | 'done'> {
  const logs = await sessionLogs(session.id!);
  const c = cursor(session, logs);
  if (!c) return 'done';
  const now = Date.now();
  const entry: SetLog = {
    sessionId: session.id!, dayId: session.dayId, slotId: c.slot.slotId, name: c.slot.name,
    setIndex: c.setIndex, targetReps: c.slot.ex.reps, weight, reps,
    toFailure: getDay(session.dayId).failureLastSet && c.isLastSetOfExercise, loggedAt: now
  };
  await db.sets.add(entry);
  const next = cursor(session, [...logs, entry]);
  if (!next) {
    await db.sessions.update(session.id!, { endedAt: now, phase: 'set', restEndAt: undefined, restTotal: undefined, prefill: undefined });
    return 'done';
  }
  const rest = restFor(session.dayId, c.slot.ex, restOverrides);
  await db.sessions.update(session.id!, { phase: 'rest', restEndAt: now + rest * 1000, restTotal: rest, prefill: undefined });
  return 'rest';
}

export async function addRest(session: Session, sec: number): Promise<void> {
  const base = Math.max(Date.now(), session.restEndAt ?? Date.now());
  await db.sessions.update(session.id!, { restEndAt: base + sec * 1000, restTotal: (session.restTotal ?? 0) + sec });
}

export async function endRest(session: Session): Promise<void> {
  await db.sessions.update(session.id!, { phase: 'set', restEndAt: undefined, restTotal: undefined });
}

/** "Edit" on the rest screen: take back the last logged set and return to it with its values. */
export async function undoLastSet(session: Session): Promise<void> {
  const logs = await sessionLogs(session.id!);
  const last = logs[logs.length - 1];
  if (!last) return;
  await db.sets.delete(last.id!);
  await db.sessions.update(session.id!, {
    phase: 'set', restEndAt: undefined, restTotal: undefined,
    prefill: { slotId: last.slotId, setIndex: last.setIndex, weight: last.weight, reps: last.reps }
  });
}

/** End early. A session with nothing logged is discarded. */
export async function endSession(session: Session): Promise<'ended' | 'discarded'> {
  const n = await db.sets.where('sessionId').equals(session.id!).count();
  if (!n) { await db.sessions.delete(session.id!); return 'discarded'; }
  await db.sessions.update(session.id!, { endedAt: Date.now(), phase: 'set', restEndAt: undefined });
  return 'ended';
}

export async function updatePlan(session: Session, order: string[], swaps: Record<string, string>): Promise<void> {
  await db.sessions.update(session.id!, { order, swaps });
}

export async function deleteSession(sessionId: number): Promise<void> {
  await db.transaction('rw', db.sessions, db.sets, async () => {
    await db.sets.where('sessionId').equals(sessionId).delete();
    await db.sessions.delete(sessionId);
  });
}
