import Dexie, { type Table } from 'dexie';
import type { DayId } from './program';

export type Phase = 'set' | 'rest';

export interface Session {
  id?: number;
  dayId: DayId;
  startedAt: number;
  endedAt?: number;
  /** Exercise slot ids in the order they'll be done. */
  order: string[];
  /** slot id → name of the exercise actually done instead. */
  swaps: Record<string, string>;
  phase: Phase;
  restEndAt?: number;
  restTotal?: number;
  /** Values to restore into the set screen after "Edit" undoes a logged set. */
  prefill?: { slotId: string; setIndex: number; weight: number; reps: number };
}

export interface SetLog {
  id?: number;
  sessionId: number;
  dayId: DayId;
  slotId: string;
  /** The name actually performed (swap name if swapped). History is keyed by this. */
  name: string;
  setIndex: number;
  targetReps: number;
  weight: number;
  reps: number;
  toFailure: boolean;
  loggedAt: number;
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  sound: boolean;
  /** exercise slot id → rest seconds */
  restOverrides: Record<string, number>;
  installHintDismissed?: boolean;
}

export const DEFAULT_SETTINGS: Settings = { theme: 'light', sound: true, restOverrides: {} };

export class SetwiseDB extends Dexie {
  sessions!: Table<Session, number>;
  sets!: Table<SetLog, number>;
  kv!: Table<{ key: string; value: unknown }, string>;

  constructor(name = 'setwise') {
    super(name);
    this.version(1).stores({
      sessions: '++id, dayId, startedAt, endedAt',
      sets: '++id, sessionId, name, loggedAt',
      kv: 'key'
    });
  }
}

export const db = new SetwiseDB();

export async function getSettings(): Promise<Settings> {
  const row = await db.kv.get('settings');
  return { ...DEFAULT_SETTINGS, ...((row?.value as Partial<Settings>) ?? {}) };
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  const cur = await getSettings();
  await db.kv.put({ key: 'settings', value: { ...cur, ...patch } });
}

export async function activeSession(): Promise<Session | undefined> {
  const all = await db.sessions.orderBy('startedAt').reverse().toArray();
  return all.find((s) => !s.endedAt);
}

export interface Backup {
  app: 'setwise';
  version: 1;
  exportedAt: string;
  sessions: Session[];
  sets: SetLog[];
  settings: Settings;
}

export async function exportBackup(): Promise<Backup> {
  return {
    app: 'setwise',
    version: 1,
    exportedAt: new Date().toISOString(),
    sessions: await db.sessions.toArray(),
    sets: await db.sets.toArray(),
    settings: await getSettings()
  };
}

export async function importBackup(data: Backup): Promise<void> {
  if (data?.app !== 'setwise' || !Array.isArray(data.sessions) || !Array.isArray(data.sets)) {
    throw new Error('This file is not a Setwise backup.');
  }
  await db.transaction('rw', db.sessions, db.sets, db.kv, async () => {
    await db.sessions.clear();
    await db.sets.clear();
    await db.sessions.bulkAdd(data.sessions);
    await db.sets.bulkAdd(data.sets);
    if (data.settings) await db.kv.put({ key: 'settings', value: data.settings });
  });
}
