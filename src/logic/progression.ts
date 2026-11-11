import { increment, type Kind } from '../program';
import type { SetLog } from '../db';

/** Logs of `name` from the most recent session (other than `excludeSessionId`) that did it. */
export function lastPerformance(name: string, logs: SetLog[], excludeSessionId?: number): SetLog[] {
  const mine = logs.filter((l) => l.name === name && l.sessionId !== excludeSessionId);
  if (!mine.length) return [];
  const latest = mine.reduce((a, b) => (b.loggedAt > a.loggedAt ? b : a));
  return mine.filter((l) => l.sessionId === latest.sessionId).sort((a, b) => a.setIndex - b.setIndex);
}

/** The weight that counts for an exercise: heaviest load, or least assistance for assisted machines. */
export function workingWeight(kind: Kind, logs: SetLog[]): number | null {
  if (!logs.length) return null;
  const ws = logs.map((l) => l.weight);
  return kind === 'assisted' ? Math.min(...ws) : Math.max(...ws);
}

/** Every logged set reached its target reps (failure sets count when reps ≥ target). */
export function hitAllTargets(logs: SetLog[], expectedSets?: number): boolean {
  if (!logs.length) return false;
  if (expectedSets !== undefined && logs.length < expectedSets) return false;
  return logs.every((l) => l.reps >= l.targetReps);
}

export interface Suggestion {
  /** null = no history yet; the lifter enters it once. */
  weight: number | null;
  last: number | null;
  hitAll: boolean;
  /** Signed change from last time, e.g. +5, +2.5, −5 (assist). 0 = hold. */
  delta: number;
}

export function nextWeight(kind: Kind, last: number, hitAll: boolean): number {
  if (!hitAll) return last;
  if (kind === 'assisted') return Math.max(0, last - 5);
  return last + increment(kind);
}

export function suggest(kind: Kind, prev: SetLog[], expectedSets?: number): Suggestion {
  const last = workingWeight(kind, prev);
  if (last === null) return { weight: null, last: null, hitAll: false, delta: 0 };
  const hitAll = hitAllTargets(prev, expectedSets);
  const weight = nextWeight(kind, last, hitAll);
  return { weight, last, hitAll, delta: weight - last };
}

export function formatDelta(kind: Kind, delta: number): string {
  if (delta === 0) return 'Hold';
  if (kind === 'assisted') return `${delta} assist`.replace('-', '−');
  return `+${delta}`;
}

/**
 * Weight to show for a set: same as the previous set of this exercise in the current
 * session, otherwise the progression suggestion from the last time it was done.
 */
export function plannedWeight(kind: Kind, name: string, expectedSets: number, logs: SetLog[], sessionId?: number): Suggestion & { fromThisSession: boolean } {
  const here = logs.filter((l) => l.sessionId === sessionId && l.name === name).sort((a, b) => a.loggedAt - b.loggedAt);
  const base = suggest(kind, lastPerformance(name, logs, sessionId), expectedSets);
  if (sessionId !== undefined && here.length) return { ...base, weight: here[here.length - 1].weight, fromThisSession: true };
  return { ...base, fromThisSession: false };
}
