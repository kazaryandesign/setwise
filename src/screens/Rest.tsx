import { getDay } from '../program';
import type { Data } from '../hooks';
import { fmtW, formatElapsed, useNow } from '../hooks';
import type { Session } from '../db';
import { cursor, exerciseProgress } from '../logic/session';
import { plannedWeight } from '../logic/progression';
import { formatClock } from '../logic/rest';
import { useRestTimer } from '../timer/useRestTimer';
import { Chip, Icon, SessionHeader, TickGauge } from '../components/ui';

export function Rest({ data, session, onAdd30, onSkip, onEdit, onMenu }: {
  data: Data; session: Session;
  onAdd30: () => void; onSkip: () => void; onEdit: () => void; onMenu: () => void;
}) {
  const now = useNow();
  const left = useRestTimer(session.restEndAt, data.settings.sound);
  const total = session.restTotal ?? 0;
  const fill = total ? Math.min(1, 1 - left / total) : 1;
  const day = getDay(session.dayId);
  const logs = data.logs.filter((l) => l.sessionId === session.id).sort((a, b) => a.loggedAt - b.loggedAt);
  const last = logs[logs.length - 1];
  const next = cursor(session, logs);
  const nextPlan = next ? plannedWeight(next.slot.ex.kind, next.slot.name, next.slot.ex.sets, data.logs, session.id) : null;
  const nextFailure = !!next && day.failureLastSet && next.isLastSetOfExercise;
  const sameExercise = !!next && !!last && next.slot.slotId === last.slotId;
  const soon = left <= 10;
  const done = left <= 0;

  return (
    <div className={`app day-${session.dayId}`} data-screen={`rest:${logs.length}`}>
      <SessionHeader title={`${day.name} · Rest`} clock={formatElapsed(now - session.startedAt)} progress={exerciseProgress(session, logs)} onMenu={onMenu} />
      <main className="main">
        <section className="card" aria-label="Rest timer" style={{ padding: '18px 16px 16px' }}>
          <div className="card-head">
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 className="h2 lg">Rest</h2>
              <span style={{ color: 'var(--text3)' }} title={day.restNote}>{Icon.info}</span>
            </span>
            <Chip tone={soon ? 'up' : 'accent'}>{done ? 'Ready' : soon ? 'Get set' : `${Math.round(fill * 100)}% rested`}</Chip>
          </div>
          <TickGauge fill={fill}>
            <div role="timer" aria-live="off" className="big" style={{ position: 'absolute', left: 0, right: 0, top: '47%', textAlign: 'center', fontSize: 64 }}>{formatClock(left)}</div>
            <div className="num" style={{ position: 'absolute', left: 0, right: 0, top: '83%', textAlign: 'center', fontSize: 15, fontWeight: 500, color: 'var(--text2)' }}>of {formatClock(total)} rest</div>
            <span className="meta" style={{ position: 'absolute', left: 4, top: '90%' }}>0:00</span>
            <span className="meta num" style={{ position: 'absolute', right: 4, top: '90%' }}>{formatClock(total)}</span>
          </TickGauge>

          {last && (
            <button type="button" className="pill-link" style={{ marginTop: 14 }} onClick={onEdit}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span aria-hidden="true" style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--up)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Icon.check}</span>
                <span>Set {last.setIndex + 1} logged · <span className="num" style={{ color: 'var(--text)', fontWeight: 600 }}>{fmtW(last.weight)} × {last.reps}</span></span>
              </span>
              <span style={{ fontWeight: 600, color: 'var(--accent-text)' }}>Edit</span>
            </button>
          )}
        </section>

        {next && (
          <section className="card" aria-label="Up next">
            <div className="card-head">
              <span className="meta">Up next</span>
              {nextFailure ? <Chip tone="dark">{Icon.bolt}To failure</Chip> : <Chip tone="neutral">{next.slot.ex.reps} reps</Chip>}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginTop: 8 }}>
              <span style={{ fontSize: 17, fontWeight: 600, minWidth: 0 }}>{next.slot.name} · Set {next.setIndex + 1} of {next.slot.ex.sets}</span>
              <span className="big" style={{ fontSize: 28, letterSpacing: '-0.03em', flex: '0 0 auto' }}>
                {nextPlan?.weight != null ? fmtW(nextPlan.weight) : '—'}<span className="unit" style={{ fontSize: 15 }}> lb</span>
              </span>
            </div>
            <span className="sub" style={{ display: 'block', marginTop: 4, fontSize: 14 }}>
              {nextFailure ? 'Set the safeties or grab a spotter now.' : sameExercise ? 'Same weight. Shake out, breathe.' : `New exercise — set up the ${next.slot.name.toLowerCase()} now.`}
            </span>
          </section>
        )}

        <span className="meta" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {Icon.bell}{data.settings.sound ? 'Chime + flash at 0:10 and 0:00' : 'Sound off · flash at 0:10 and 0:00'}
        </span>
      </main>

      <footer className="bottom">
        <div className="bottom-inner two">
          <button type="button" className="pill secondary" onClick={onAdd30}><span className="num">+30s</span></button>
          <button type="button" className="pill" onClick={onSkip}>{done ? 'Start set' : 'Skip rest'}{Icon.chevron}</button>
        </div>
      </footer>
    </div>
  );
}
