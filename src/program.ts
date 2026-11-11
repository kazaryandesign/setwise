export type DayId = 'push' | 'pull' | 'legs';
export type Kind = 'compound' | 'isolation' | 'assisted';

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  kind: Kind;
  /** Dumbbell lifts: logged weight is per hand, volume counts both. */
  perHand?: boolean;
  /** Overrides the day's default rest, in seconds. */
  restSec?: number;
  alternates: string[];
}

export interface Day {
  id: DayId;
  name: string;
  focus: string;
  restSec: number;
  restNote: string;
  failureLastSet: boolean;
  cue: { title: string; items?: [string, string][]; tempo?: boolean };
  setCue: string;
  exercises: Exercise[];
}

export const DEFAULT_REST = 120;

export const PROGRAM: Day[] = [
  {
    id: 'push',
    name: 'Push',
    focus: 'Chest, shoulders, triceps',
    restSec: 150,
    restNote: 'Push rest is 2–3 min',
    failureLastSet: true,
    cue: { title: 'Last set of every exercise goes to failure.' },
    setCue: 'Stop at the target with clean reps. Save the rest for the failure set.',
    exercises: [
      { id: 'bench', name: 'Bench press', sets: 4, reps: 8, kind: 'compound', alternates: ['Smith machine bench', 'DB bench press'] },
      { id: 'incline-db', name: 'Incline DB press', sets: 3, reps: 8, kind: 'compound', perHand: true, alternates: ['Incline machine press', 'Incline Smith press'] },
      { id: 'db-shoulder', name: 'Dumbbell shoulder press', sets: 3, reps: 10, kind: 'compound', perHand: true, alternates: ['Machine shoulder press', 'Seated barbell press'] },
      { id: 'cable-fly', name: 'Cable flys', sets: 3, reps: 12, kind: 'isolation', alternates: ['Pec deck', 'Dumbbell flys'] },
      { id: 'lateral', name: 'Lateral raise', sets: 3, reps: 12, kind: 'isolation', perHand: true, alternates: ['Cable lateral raise', 'Machine lateral raise'] },
      { id: 'dip', name: 'Assisted dip machine', sets: 3, reps: 10, kind: 'assisted', alternates: ['Bench dips', 'Close-grip bench'] },
      { id: 'rope', name: 'Tricep rope pull-down', sets: 3, reps: 12, kind: 'isolation', alternates: ['Straight-bar push-down', 'Overhead cable extension'] }
    ]
  },
  {
    id: 'pull',
    name: 'Pull',
    focus: 'Back, biceps',
    restSec: DEFAULT_REST,
    restNote: 'Default rest 2 min',
    failureLastSet: false,
    cue: { title: 'Full stretch at the bottom', items: [['No swinging', 'torso stays still'], ['No half reps', 'arms long each time']] },
    setCue: 'Full stretch at the bottom. No swinging, no half reps.',
    exercises: [
      { id: 'lat-pd', name: 'Lat pull-down, wide grip', sets: 4, reps: 8, kind: 'compound', alternates: ['Machine pull-down', 'Single-arm cable pull-down'] },
      { id: 'seated-row', name: 'Seated row, wide grip', sets: 3, reps: 8, kind: 'compound', alternates: ['Chest-supported row', 'Machine row'] },
      { id: 'pullup', name: 'Assisted pull-ups', sets: 3, reps: 10, kind: 'assisted', alternates: ['Lat pull-down, close grip', 'Band-assisted pull-ups'] },
      { id: 'db-row', name: 'Bent-over DB row', sets: 3, reps: 12, kind: 'compound', perHand: true, alternates: ['Cable row, single arm', 'Barbell row'] },
      { id: 'machine-curl', name: 'Machine bicep curl', sets: 3, reps: 12, kind: 'isolation', alternates: ['Cable curl', 'EZ-bar curl'] },
      { id: 'hammer', name: 'DB hammer curls', sets: 3, reps: 10, kind: 'isolation', perHand: true, alternates: ['Rope hammer curl', 'Cross-body curl'] }
    ]
  },
  {
    id: 'legs',
    name: 'Legs',
    focus: 'Quads, hamstrings, calves',
    restSec: DEFAULT_REST,
    restNote: 'Squats rest 3 min, others 2 min',
    failureLastSet: false,
    cue: { title: 'Lower for 2–3 seconds', tempo: true },
    setCue: '2–3 sec lowering on every rep.',
    exercises: [
      { id: 'squat', name: 'Back squat', sets: 4, reps: 8, kind: 'compound', restSec: 180, alternates: ['Smith machine squat', 'Hack squat'] },
      { id: 'leg-press', name: 'Leg press', sets: 3, reps: 15, kind: 'compound', alternates: ['Hack squat', 'Belt squat'] },
      { id: 'ham-curl', name: 'Seated hamstring curl', sets: 3, reps: 12, kind: 'isolation', alternates: ['Lying hamstring curl', 'Romanian deadlift'] },
      { id: 'leg-ext', name: 'Seated leg extensions', sets: 3, reps: 12, kind: 'isolation', alternates: ['Single-leg extension', 'Sissy squat'] },
      { id: 'goblet', name: 'Goblet squats', sets: 3, reps: 15, kind: 'compound', alternates: ['DB split squat', 'Walking lunges'] },
      { id: 'calf', name: 'Seated calf raise', sets: 3, reps: 15, kind: 'isolation', alternates: ['Standing calf raise', 'Leg-press calf raise'] }
    ]
  }
];

export const DAY_ORDER: DayId[] = ['push', 'pull', 'legs'];

export function getDay(id: DayId): Day {
  return PROGRAM.find((d) => d.id === id)!;
}

export function findExercise(dayId: DayId, exId: string): Exercise {
  return getDay(dayId).exercises.find((e) => e.id === exId)!;
}

export function increment(kind: Kind): number {
  return kind === 'isolation' ? 2.5 : 5;
}

export function weightStep(kind: Kind): number {
  return kind === 'isolation' ? 2.5 : 5;
}
