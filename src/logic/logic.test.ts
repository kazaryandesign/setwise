import { describe, expect, it } from 'vitest';
import type { Session, SetLog } from '../db';
import { nextDay } from './rotation';
import { suggest, lastPerformance, formatDelta } from './progression';
import { restFor } from './rest';
import { volume, findPRs, streakWeeks, estimateMinutes } from './stats';
import { cursor } from './session';
import { findExercise, getDay } from '../program';

let id = 1;
const log = (p: Partial<SetLog> & Pick<SetLog, 'slotId' | 'weight' | 'reps' | 'targetReps'>): SetLog => ({
  id: id++, sessionId: 1, dayId: 'push', name: findExercise(p.dayId ?? 'push', p.slotId).name,
  setIndex: 0, toFailure: false, loggedAt: id, ...p
});
const sets = (slotId: string, weight: number, reps: number[], target: number, extra: Partial<SetLog> = {}) =>
  reps.map((r, i) => log({ slotId, weight, reps: r, targetReps: target, setIndex: i, ...extra }));

describe('rotation', () => {
  it('starts on Push and follows Push → Pull → Legs → Push', () => {
    expect(nextDay([])).toBe('push');
    const s = (dayId: Session['dayId'], t: number): Session => ({ dayId, startedAt: t, endedAt: t + 1, order: [], swaps: {}, phase: 'set' });
    expect(nextDay([s('push', 1)])).toBe('pull');
    expect(nextDay([s('push', 1), s('pull', 2)])).toBe('legs');
    expect(nextDay([s('push', 1), s('pull', 2), s('legs', 3)])).toBe('push');
  });
  it('ignores an unfinished session', () => {
    expect(nextDay([{ dayId: 'push', startedAt: 5, order: [], swaps: {}, phase: 'set' }])).toBe('push');
  });
});

describe('progression', () => {
  it('bench 180 × 8,8,8,9 → 185 (+5 compound)', () => {
    const s = suggest('compound', sets('bench', 180, [8, 8, 8, 9], 8), 4);
    expect(s.weight).toBe(185);
    expect(formatDelta('compound', s.delta)).toBe('+5');
  });
  it('lateral raise missing a rep → hold', () => {
    const s = suggest('isolation', sets('lateral', 17.5, [12, 12, 10], 12), 3);
    expect(s.weight).toBe(17.5);
    expect(formatDelta('isolation', s.delta)).toBe('Hold');
  });
  it('isolation adds 2.5', () => {
    expect(suggest('isolation', sets('cable-fly', 25, [12, 12, 13], 12), 3).weight).toBe(27.5);
  });
  it('dip assist 50 → 45', () => {
    const s = suggest('assisted', sets('dip', 50, [10, 10, 12], 10), 3);
    expect(s.weight).toBe(45);
    expect(formatDelta('assisted', s.delta)).toBe('−5 assist');
  });
  it('failure set below target means hold', () => {
    expect(suggest('compound', sets('bench', 185, [8, 8, 8, 7], 8), 4).weight).toBe(185);
  });
  it('an incomplete session (fewer sets than planned) means hold', () => {
    expect(suggest('compound', sets('bench', 185, [8, 8], 8), 4).weight).toBe(185);
  });
  it('no history → null so the lifter enters it', () => {
    expect(suggest('compound', [], 4).weight).toBeNull();
  });
  it('lastPerformance picks the most recent session', () => {
    const old = sets('bench', 175, [8, 8, 8, 8], 8, { sessionId: 1 });
    const recent = sets('bench', 180, [8, 8, 8, 9], 8, { sessionId: 2 });
    expect(lastPerformance('Bench press', [...old, ...recent]).every((l) => l.sessionId === 2)).toBe(true);
    expect(lastPerformance('Bench press', [...old, ...recent], 2).every((l) => l.sessionId === 1)).toBe(true);
  });
});

describe('rest', () => {
  it('squat 3:00, push 2:30, pull default 2:00, overrides win', () => {
    expect(restFor('legs', findExercise('legs', 'squat'))).toBe(180);
    expect(restFor('legs', findExercise('legs', 'leg-press'))).toBe(120);
    expect(restFor('push', findExercise('push', 'bench'))).toBe(150);
    expect(restFor('pull', findExercise('pull', 'lat-pd'))).toBe(120);
    expect(restFor('pull', findExercise('pull', 'lat-pd'), { 'lat-pd': 90 })).toBe(90);
  });
});

describe('stats', () => {
  it('volume counts both dumbbells and skips assisted', () => {
    const v = volume([
      ...sets('bench', 185, [8, 8, 8, 10], 8),
      ...sets('incline-db', 60, [8, 8, 9], 8),
      ...sets('dip', 50, [10, 10, 12], 10)
    ]);
    expect(v).toBe(185 * 34 + 60 * 2 * 25);
  });
  it('finds weight and rep PRs, not first-time baselines', () => {
    const before = [...sets('bench', 180, [8, 8, 8, 9], 8, { sessionId: 1 }), ...sets('rope', 42.5, [12, 12, 11], 12, { sessionId: 1 })];
    const now = [
      ...sets('bench', 185, [8, 8, 8, 10], 8, { sessionId: 2 }),
      ...sets('rope', 42.5, [12, 12, 14], 12, { sessionId: 2 }),
      ...sets('lateral', 17.5, [12, 12, 10], 12, { sessionId: 2 })
    ];
    const prs = findPRs(now, before);
    expect(prs.map((p) => [p.name, p.kind])).toEqual([['Bench press', 'weight'], ['Tricep rope pull-down', 'reps']]);
  });
  it('streak counts consecutive 3-session weeks', () => {
    const day = 86400000;
    const wed = new Date(2026, 10, 11, 18).getTime();
    const mk = (t: number): Session => ({ dayId: 'push', startedAt: t, endedAt: t + 1, order: [], swaps: {}, phase: 'set' });
    const s = [wed - 7 * day, wed - 8 * day, wed - 9 * day, wed - 14 * day, wed - 15 * day, wed - 16 * day, wed - day].map(mk);
    expect(streakWeeks(s, wed)).toBe(2); // this week has 1 so far, doesn't break it
  });
  it('estimates push at about 70 min', () => {
    expect(estimateMinutes('push')).toBe(70);
  });
});

describe('session cursor', () => {
  it('walks sets in order and marks the last set', () => {
    const day = getDay('push');
    const session: Session = { id: 1, dayId: 'push', startedAt: 0, order: day.exercises.map((e) => e.id), swaps: {}, phase: 'set' };
    const c0 = cursor(session, []);
    expect(c0?.slot.slotId).toBe('bench');
    const c = cursor(session, sets('bench', 185, [8, 8, 8], 8));
    expect(c?.setIndex).toBe(3);
    expect(c?.isLastSetOfExercise).toBe(true);
    expect(cursor(session, sets('bench', 185, [8, 8, 8, 8], 8))?.slot.slotId).toBe('incline-db');
  });
});
