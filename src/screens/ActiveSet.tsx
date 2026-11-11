import { useEffect, useState } from 'react';
import { getDay, weightStep } from '../program';
import type { Data } from '../hooks';
import { fmtW, formatElapsed, useNow } from '../hooks';
import type { Session } from '../db';
import { cursor, exerciseProgress, slots } from '../logic/session';
import { lastPerformance, plannedWeight } from '../logic/progression';
import { Chip, Icon, SessionHeader, SetSegments, Stepper, TickMeter } from '../components/ui';

export function ActiveSet({ data, session, onLog, onMenu }: {
  data: Data; session: Session;
  onLog: (weight: number, reps: number) => void; onMenu: () => void;
}) {
  const now = useNow();
  const day = getDay(session.dayId);
  const logs = data.logs.filter((l) => l.sessionId === session.id);
  const c = cursor(session, logs);
  const n = slots(session).length;

  const ex = c?.slot.ex;
  const name = c?.slot.name ?? '';
  const plan = ex ? plannedWeight(ex.kind, name, ex.sets, data.logs, session.id) : null;
  const failure = !!c && day.failureLastSet && c.isLastSetOfExercise;
  const key = c ? `${c.slot.slotId}:${c.setIndex}` : 'none';
  const pre = session.prefill && c && session.prefill.slotId === c.slot.slotId && session.prefill.setIndex === c.setIndex ? session.prefill : null;

  const [weight, setWeight] = useState<number | null>(pre?.weight ?? plan?.weight ?? null);
  const [reps, setReps] = useState<number>(pre?.reps ?? ex?.reps ?? 0);
  useEffect(() => {
    setWeight(pre?.weight ?? plan?.weight ?? null);
    setReps(pre?.reps ?? ex?.reps ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!c || !ex || !plan) return null;

  const mine = logs.filter((l) => l.slotId === c.slot.slotId).sort((a, b) => a.setIndex - b.setIndex);
  const labels = Array.from({ length: ex.sets }, (_, i) =>
    i < mine.length ? `${fmtW(mine[i].weight)} × ${mine[i].reps}` : i === c.setIndex ? 'Now' : day.failureLastSet && i === ex.sets - 1 ? 'Failure' : `Set ${i + 1}`);
  const step = weightStep(ex.kind);
  const unit = ex.kind === 'assisted' ? 'lb assist' : ex.perHand ? 'lb each' : 'lb';
  const prevLast = lastPerformance(name, data.logs, session.id);
  const lastFailReps = failure && prevLast.length ? prevLast[prevLast.length - 1].reps : null;
  const deltaChip = plan.last !== null && !plan.fromThisSession && plan.delta !== 0;

  const lastLine = plan.last !== null
    ? `Last time ${fmtW(plan.last)} lb${plan.hitAll ? ' · all reps' : ''}`
    : plan.fromThisSession ? 'Same as your last set' : 'First time — enter a starting weight';

  return (
    <div className={`app day-${session.dayId}`} data-screen={`set:${key}`}>
      <SessionHeader title={`${day.name} · ${c.slotIndex + 1} of ${n}`} clock={formatElapsed(now - session.startedAt)} progress={exerciseProgress(session, logs)} onMenu={onMenu} />
      <main className="main">
        <div className="title-row">
          <div className="stack" style={{ minWidth: 0 }}>
            <h1 className="h1 sm">{name}</h1>
            <span className="sub">Set {c.setIndex + 1} of {ex.sets}{failure ? ' · last set' : ` · target ${ex.reps} reps`}</span>
          </div>
          {deltaChip && <Chip tone="up">{Icon.up}{ex.kind === 'assisted' ? `${plan.delta} assist`.replace('-', '−') : `+${fmtW(plan.delta)} lb`}</Chip>}
        </div>

        <section className="card" aria-label="Sets" style={{ padding: '14px 16px' }}>
          <SetSegments total={ex.sets} done={mine.length} current={c.setIndex} failureLast={day.failureLastSet} labels={labels} />
        </section>

        {failure ? (
          <section className="failure" aria-label="To failure">
            <span className="failure-title"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" /></svg>To failure</span>
            <p>Go until the bar stops moving with good form. Then log what you got.</p>
          </section>
        ) : day.cue.tempo ? (
          <section className="card" aria-label="Tempo" style={{ padding: '14px 16px' }}>
            <div className="card-head"><h2 className="h2">{day.cue.title}</h2><Chip tone="accent">Every rep</Chip></div>
            <div role="img" aria-label="Tempo: 3 seconds down, brief pause, then up" style={{ display: 'flex', gap: 4, height: 30, marginTop: 12 }}>
              <div style={{ flex: '3 1 0', borderRadius: 6, background: 'var(--accent-grad)' }} />
              <div style={{ flex: '0.5 1 0', borderRadius: 6, background: 'var(--tick)' }} />
              <div style={{ flex: '1 1 0', borderRadius: 6, background: 'var(--track)' }} />
            </div>
            <div aria-hidden="true" style={{ display: 'flex', gap: 4, marginTop: 8, fontSize: 13, fontWeight: 500, color: 'var(--text3)' }}>
              <span style={{ flex: '3 1 0', color: 'var(--accent-text)', fontWeight: 600 }}>↓ Down 2–3s</span><span style={{ flex: '0.5 1 0' }}>Hold</span><span style={{ flex: '1 1 0' }}>↑ Up</span>
            </div>
          </section>
        ) : day.cue.items ? (
          <section className="card" aria-label="Form cues" style={{ padding: '14px 16px' }}>
            <div className="card-head"><h2 className="h2">{day.cue.title}</h2><Chip tone="accent">Every rep</Chip></div>
            <ul style={{ listStyle: 'none', margin: '10px 0 0', padding: '10px 0 0', borderTop: '1px solid var(--line2)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {day.cue.items.map(([a, b]) => (
                <li key={a} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 500 }}>
                  <span aria-hidden="true" style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Icon.x}</span>
                  {a}<span className="meta" style={{ marginLeft: 'auto' }}>{b}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <div className="banner"><span style={{ flex: '0 0 auto', marginTop: 1 }}>{Icon.info}</span><span>{day.setCue}</span></div>
        )}

        <section className="card" aria-label="Weight">
          <div className="card-head" style={{ alignItems: 'baseline' }}><h2 className="h2">Weight</h2><span className="meta num" style={{ fontSize: 14 }}>{lastLine}</span></div>
          <Stepper label="weight" value={weight} unit={unit} size={failure ? 56 : 88} placeholder="0"
            onStep={(d) => setWeight((w) => Math.max(0, Math.round(((w ?? 0) + d * step) * 10) / 10))}
            onType={setWeight} />
        </section>

        <section className="card" aria-label={failure ? 'Reps hit' : 'Reps'}>
          <div className="card-head" style={{ alignItems: 'baseline' }}>
            <h2 className="h2">{failure ? 'Reps hit' : 'Reps'}</h2>
            {failure ? (
              <Chip tone={reps >= ex.reps ? 'up' : 'neutral'}>{reps >= ex.reps ? (lastFailReps !== null && reps > lastFailReps ? 'Beat last time' : 'On target') : `${ex.reps - reps} short of ${ex.reps}`}</Chip>
            ) : <span className="meta" style={{ fontSize: 14 }}>Target {ex.reps}</span>}
          </div>
          <Stepper label="reps" value={reps} unit="reps" size={failure ? 96 : 64} small={!failure}
            onStep={(d) => setReps((r) => Math.max(0, r + d))} />
          {failure && <TickMeter value={reps} max={Math.max(14, ex.reps + 6)} target={ex.reps} last={lastFailReps} />}
        </section>
      </main>

      <footer className="bottom">
        <div className="bottom-inner">
          <button type="button" className={`pill${failure ? ' black' : ''}`} disabled={weight === null}
            onClick={() => weight !== null && onLog(weight, reps)}>
            {failure ? null : Icon.check}
            <span style={{ fontSize: 18 }}>{weight === null ? 'Enter a weight' : failure ? 'Log set' : 'Done'}</span>
            {weight !== null && <span className="pill-sub">{fmtW(weight)} × {reps}</span>}
          </button>
        </div>
      </footer>
    </div>
  );
}
