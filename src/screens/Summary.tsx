import { findExercise, getDay } from '../program';
import type { Data } from '../hooks';
import { dayLabel, fmtW, formatDuration } from '../hooks';
import { lastSessionOf } from '../logic/rotation';
import { volume, volumeByName, findPRs, trend } from '../logic/stats';
import { suggest, formatDelta, workingWeight } from '../logic/progression';
import { slots } from '../logic/session';
import { Chip, Icon, MiniBars, StackBar, DAY_COLOR } from '../components/ui';
import { deleteSession } from '../actions';

const STACK_COLORS = ['linear-gradient(90deg, #3C7CEB, #4A88F0)', 'linear-gradient(90deg, #A9CBF9, #7598F3)', 'linear-gradient(90deg, #A891F5, #8B6CF0)', 'var(--tick)'];

export function Summary({ data, sessionId, onDone }: { data: Data; sessionId: number; onDone: () => void }) {
  const session = data.sessions.find((s) => s.id === sessionId);
  if (!session) return null;
  const day = getDay(session.dayId);
  const logs = data.logs.filter((l) => l.sessionId === sessionId);
  const prevSession = lastSessionOf(data.sessions, session.dayId, session.startedAt);
  const prevLogs = prevSession ? data.logs.filter((l) => l.sessionId === prevSession.id) : [];
  const earlier = data.logs.filter((l) => l.loggedAt < session.startedAt);

  const vol = volume(logs);
  const prevVol = volume(prevLogs);
  const pct = prevVol ? ((vol - prevVol) / prevVol) * 100 : null;
  const dur = (session.endedAt ?? Date.now()) - session.startedAt;
  const prevDur = prevSession?.endedAt ? prevSession.endedAt - prevSession.startedAt : null;
  const planned = slots(session).reduce((n, s) => n + s.ex.sets, 0);
  const prs = findPRs(logs, earlier);

  const byVol = volumeByName(logs).sort((a, b) => b.volume - a.volume);
  const top3 = byVol.slice(0, 3);
  const rest = byVol.slice(3).reduce((s, x) => s + x.volume, 0);
  const parts = [...top3.map((x, i) => ({ label: x.name, value: x.volume, color: STACK_COLORS[i] })), ...(rest ? [{ label: `Other ${byVol.length - 3}`, value: rest, color: STACK_COLORS[3] }] : [])];

  const rows = slots(session)
    .map((s) => {
      const mine = logs.filter((l) => l.slotId === s.slotId).sort((a, b) => a.setIndex - b.setIndex);
      if (!mine.length) return null;
      const before = prevLogs.filter((l) => l.name === s.name).sort((a, b) => a.setIndex - b.setIndex);
      const sug = suggest(s.ex.kind, mine, s.ex.sets);
      const fmt = (ls: typeof mine) => `${s.ex.kind === 'assisted' ? '−' : ''}${fmtW(workingWeight(s.ex.kind, ls)!)} · ${ls.map((l) => l.reps).join(' ')}`;
      return { name: s.name, today: fmt(mine), was: before.length ? fmt(before) : null, next: sug.weight!, tag: formatDelta(s.ex.kind, sug.delta), up: sug.delta !== 0, kind: s.ex.kind };
    })
    .filter((r): r is NonNullable<typeof r> => !!r);
  const upCount = rows.filter((r) => r.up).length;
  const holds = rows.filter((r) => !r.up).map((r) => r.name);

  return (
    <div className={`app day-${session.dayId}`} data-screen="summary">
      <main className="main plain" style={{ paddingBottom: 'calc(28px + env(safe-area-inset-bottom))' }}>
        <div className="title-row">
          <div className="stack">
            <span className="sub" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text3)' }}><span className="dot" aria-hidden="true" />{day.name} · {dayLabel(session.startedAt)}</span>
            <h1 className="h1">{session.endedAt ? 'Session done' : 'In progress'}</h1>
          </div>
          <Chip tone={logs.length >= planned ? 'up' : 'neutral'}>{logs.length >= planned ? Icon.up : null}{logs.length} of {planned} sets</Chip>
        </div>

        <section className="card" aria-label="Total volume" style={{ padding: 18 }}>
          <div className="card-head">
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 className="h2 lg">Total volume</h2>
              <span style={{ color: 'var(--text3)' }} title="Weight × reps for every set. Dumbbells count both hands; assisted machines are left out.">{Icon.info}</span>
            </span>
            <span className="meta" style={{ fontSize: 15 }}>lb</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 12 }}>
            <span className="big" style={{ fontSize: 56 }}>{Math.round(vol).toLocaleString()}</span>
            {pct !== null && (
              <span className="stack" style={{ fontSize: 15, fontWeight: 500 }}>
                <span style={{ color: pct >= 0 ? 'var(--up)' : 'var(--down)' }}>{pct >= 0 ? '+' : '−'}{Math.abs(pct).toFixed(1)}%</span>
                <span style={{ color: 'var(--text2)' }}>vs last {day.name.toLowerCase()}</span>
              </span>
            )}
          </div>
          {parts.length > 0 && <StackBar parts={parts} />}
          <div className="stats3 divider-top">
            <div><span className="stat-v">{formatDuration(dur)}</span><span className="meta">Duration</span></div>
            <div><span className="stat-v">{prevDur === null ? '—' : `${dur - prevDur > 0 ? '+' : '−'}${Math.abs(Math.round((dur - prevDur) / 60000))} min`}</span><span className="meta">vs last</span></div>
            <div><span className="stat-v">{prs.length}</span><span className="meta">PRs</span></div>
          </div>
        </section>

        {prs.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
            {prs.map((p, i) => {
              const ex = findExercise(session.dayId, logs.find((l) => l.name === p.name)!.slotId);
              const t = trend(p.name, data.logs, data.sessions).map((x) => x.weight);
              return (
                <div key={p.name} className="card" style={{ padding: 14, minHeight: 136, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10 }}>
                  <div className="stack" style={{ gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</span>
                    <span className="big" style={{ fontSize: 22, letterSpacing: '-0.02em' }}>{ex.kind === 'assisted' ? '−' : ''}{fmtW(p.weight)} × {p.reps}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--up)' }}>{p.kind === 'weight' ? (ex.kind === 'assisted' ? 'Least assist yet' : 'Heaviest yet') : `+${p.reps - (p.previous ?? 0)} rep${p.reps - (p.previous ?? 0) === 1 ? '' : 's'} at this weight`}</span>
                  </div>
                  <MiniBars values={t.length > 1 ? t : [p.previous ?? p.weight, p.weight]} color={i % 2 ? '#8B6CF0' : DAY_COLOR[session.dayId]} />
                </div>
              );
            })}
          </div>
        )}

        <section className="card" aria-label="Next time" style={{ padding: '16px 14px 6px' }}>
          <div className="card-head" style={{ padding: '0 4px' }}>
            <h2 className="h2">Next {day.name.toLowerCase()}{prevSession ? ` · vs ${dayLabel(prevSession.startedAt)}` : ''}</h2>
            <Chip tone="accent">{upCount} go up</Chip>
          </div>
          <p className="p" style={{ margin: '6px 4px', fontSize: 14 }}>
            Every target hit → add weight next time{holds.length ? `. Holding: ${holds.join(', ')}.` : '.'}
          </p>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {rows.map((r) => (
              <li key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 4px', borderTop: '1px solid var(--line2)' }}>
                <span className="row-main">
                  <span className="row-title">{r.name}</span>
                  <span className="num" style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>{r.today}{r.was ? <span style={{ color: 'var(--text3)' }}> · was {r.was}</span> : null}</span>
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                  <span className="num" style={{ fontSize: 15, fontWeight: 700 }}>{r.kind === 'assisted' ? '−' : ''}{fmtW(r.next)}</span>
                  <Chip tone={r.up ? 'up' : 'neutral'} sm>{r.tag}</Chip>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <button type="button" className="pill" style={{ marginTop: 4 }} onClick={onDone}>{session.endedAt ? 'Done' : 'Back'}</button>
        {session.endedAt && (
          <button type="button" className="text-btn danger" style={{ alignSelf: 'center' }}
            onClick={async () => { if (confirm('Delete this session and its sets? This can’t be undone.')) { await deleteSession(sessionId); onDone(); } }}>
            Delete session
          </button>
        )}
      </main>
    </div>
  );
}
