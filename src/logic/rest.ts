import { getDay, type DayId, type Exercise } from '../program';

export function restFor(dayId: DayId, ex: Exercise, overrides: Record<string, number> = {}): number {
  return overrides[ex.id] ?? ex.restSec ?? getDay(dayId).restSec;
}

export function formatClock(sec: number): string {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
