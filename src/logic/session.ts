import { findExercise, type Exercise } from '../program';
import type { Session, SetLog } from '../db';

export interface Slot {
  slotId: string;
  ex: Exercise;
  /** Name actually performed (swap or original). */
  name: string;
}

export function slots(session: Pick<Session, 'dayId' | 'order' | 'swaps'>): Slot[] {
  return session.order.map((slotId) => {
    const ex = findExercise(session.dayId, slotId);
    return { slotId, ex, name: session.swaps[slotId] ?? ex.name };
  });
}

export interface Cursor {
  slotIndex: number;
  slot: Slot;
  setIndex: number;
  isLastSetOfExercise: boolean;
}

/** The next set to do, or null when the session is complete. */
export function cursor(session: Session, logs: SetLog[]): Cursor | null {
  const list = slots(session);
  for (let i = 0; i < list.length; i++) {
    const done = logs.filter((l) => l.slotId === list[i].slotId).length;
    if (done < list[i].ex.sets) {
      return { slotIndex: i, slot: list[i], setIndex: done, isLastSetOfExercise: done === list[i].ex.sets - 1 };
    }
  }
  return null;
}

export function totalSets(session: Pick<Session, 'dayId' | 'order' | 'swaps'>): number {
  return slots(session).reduce((n, s) => n + s.ex.sets, 0);
}

/** Fraction 0–1 of each exercise's sets that are done, in session order. */
export function exerciseProgress(session: Session, logs: SetLog[]): number[] {
  return slots(session).map((s) => Math.min(1, logs.filter((l) => l.slotId === s.slotId).length / s.ex.sets));
}
