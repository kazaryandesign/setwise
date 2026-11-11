import { useMemo, useState } from 'react';
import { getDay, PROGRAM } from '../program';
import type { Data } from '../hooks';
import { dayLabel, fmtW, formatDuration } from '../hooks';
import { streakWeeks, trend, volume } from '../logic/stats';
import { Chip, Icon, MiniBars, PageHeader, DAY_COLOR } from '../components/ui';

const DEFAULT_TABS = ['Bench press', 'Back squat', 'Lat pull-down, wide grip'];

export function History({ data, onBack, onOpen }: { data: Data; onBack: () => void; onOpen: (id: number) => void }) {
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [tab, setTab] = useState(DEFAULT_TABS[0]);
  const finished = data.sessions.filter((s) => s.endedAt).sort((a, b) => b.startedAt - a.startedAt);
  const streak = streakWeeks(data.sessions);

  const days = useMemo(() => {
    const y = month.getFullYear(), m = month.getMonth();
    const n = new Date(y, m + 1, 0).getDate();
    const lead = new Date(y, m, 1).getDay();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const cells: { n: number | null; dayId?: string; id?: number; today?: boolean; future?: boolean }[] = Array.from({ length: lead }, () => ({ n: null }));
    for (let d = 1; d <= n; d++) {
      const t = new Date(y, m, d).getTime();
      const s = finished.find((x) => { const a = new Date(x.startedAt); a.setHours(0, 0, 0, 0); return a.getTime() === t; });
      cells.push({ n: d, dayId: s?.dayId, id: s?.id, today: t === today.getTime(), future: t > today.getTime() });
    }
    return cells;
  }, [month, finished]);
  const inMonth = finished.filter((s) => { const d = new Date(s.startedAt); return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear(); });
  const counts = { push: 0, pull: 0, legs: 0 } as Record<string, number>;
  inMonth.forEach((s) => counts[s.dayId]++);

  const names = useMemo(() => {
    const done = new Set(data.logs.map((l) => l.name));
    const program = PROGRAM.flatMap((d) => d.exercises.map((e) => e.name));
    return [...new Set([...program, ...done])].filter((n) => done.has(n));
  }, [data.logs]);
  const series = trend(tab, data.logs, data.sessions);
  const color = (() => {
    const l = data.logs.find((x) => x.name === tab);
    return l ? DAY_COLOR[l.dayId] : DAY_COLOR.push;
  })();
  const values = series.map((s) => s.weight);
  const gain = values.length > 1 ? values[values.length - 1] - values[0] : 0;
  const assisted = data.logs.find((x) => x.name === tab)?.slotId === 'dip' || data.logs.find((x) => x.name === tab)?.slotId === 'pullup';

  return (
    <div className="app day-push">
      <PageHeader title="History" onBack={onBack} />
      <main className="main" style={{ paddingBottom: 'calc(28px + env(safe-area-inset-bottom))' }}>
        <section className="card" aria-label="Streak and calendar" style={{ padding: 18 }}>
          <div className="card-head">
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 className="h2 lg">Streak</h2>
              <span style={{ color: 'var(--text3)' }} title="Weeks in a row with 3 or more sessions">{Icon.info}</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <button type="button" className="icon-btn" style={{ width: 40 }} aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>{Icon.back}</button>
              <span className="meta" style={{ fontSize: 15, minWidth: 74, textAlign: 'center' }}>{month.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
              <button type="button" className="icon-btn" style={{ width: 40, marginRight: -10 }} aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>{Icon.chevron}</button>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
            <span className="big" style={{ fontSize: 64 }}>{streak}</span>
            <span className="stack" style={{ fontSize: 15, fontWeight: 500 }}>
              <span style={{ color: streak ? 'var(--up)' : 'var(--text2)' }}>week{streak === 1 ? '' : 's'} in a row</span>
              <span style={{ color: 'var(--text2)' }}>3+ sessions each week</span>
            </span>
          </div>
          <div aria-hidden="true" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6, marginTop: 18, fontSize: 12, fontWeight: 500, color: 'var(--text3)', textAlign: 'center' }}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i}>{d}</span>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6, marginTop: 6 }}>
            {days.map((c, i) => c.n === null ? <span key={i} /> : (
              <button key={i} type="button" className="num" disabled={!c.id} onClick={() => c.id && onOpen(c.id)}
                aria-label={`${month.toLocaleDateString(undefined, { month: 'long' })} ${c.n}${c.dayId ? `, ${getDay(c.dayId as 'push').name}` : ''}`}
                style={{ height: 38, border: 0, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: c.id ? 'pointer' : 'default',
                  background: c.dayId ? DAY_COLOR[c.dayId as 'push'] : c.future ? 'transparent' : 'var(--line2)',
                  color: c.dayId ? '#FFFFFF' : c.future ? 'var(--tick)' : 'var(--text3)',
                  boxShadow: c.today ? '0 0 0 2px var(--card), 0 0 0 4px var(--today-ring)' : 'none' }}>{c.n}</button>
            ))}
          </div>
          <div className="num" style={{ display: 'flex', gap: 18, marginTop: 14, fontSize: 14, fontWeight: 500 }}>
            {(['push', 'pull', 'legs'] as const).map((d) => (
              <span key={d} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 3, background: DAY_COLOR[d] }} />{getDay(d).name} <span style={{ color: 'var(--text3)' }}>{counts[d]}</span></span>
            ))}
          </div>
        </section>

        <section className="card" aria-label="Top-set trend" style={{ padding: 18 }}>
          <h2 className="h2 lg">Top-set trend</h2>
          <div role="tablist" aria-label="Exercise" className="tabs">
            {DEFAULT_TABS.map((t) => (
              <button key={t} type="button" role="tab" className="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t === 'Lat pull-down, wide grip' ? 'Lat pull-down' : t === 'Back squat' ? 'Squat' : 'Bench'}</button>
            ))}
          </div>
          {names.length > 0 && (
            <>
              <label className="sr-only" htmlFor="ex-pick">Any exercise</label>
              <select id="ex-pick" className="select" style={{ width: '100%', marginTop: 8 }} value={names.includes(tab) ? tab : ''} onChange={(e) => setTab(e.target.value)}>
                <option value="" disabled>Any exercise…</option>
                {names.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </>
          )}
          {values.length ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
                <span className="big" style={{ fontSize: 40, letterSpacing: '-0.03em' }}>{assisted ? '−' : ''}{fmtW(values[values.length - 1])}<span className="unit" style={{ fontSize: 16 }}> lb{assisted ? ' assist' : ''}</span></span>
                {gain !== 0 && <Chip tone="up">{Icon.up}{assisted ? `${fmtW(gain)} assist`.replace('-', '−') : `+${fmtW(gain)} lb`}</Chip>}
              </div>
              <span className="meta" style={{ display: 'block', marginTop: 8, fontSize: 14 }}>Last {values.length} session{values.length === 1 ? '' : 's'} · working weight</span>
              <div style={{ marginTop: 16 }} role="img" aria-label={`${tab}: ${values.join(', ')} lb`}>
                <MiniBars values={values.map((v) => Number(fmtW(v)))} color={color} height={94} width={26} labels />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 13, fontWeight: 500, color: 'var(--text3)' }}>
                <span>{dayLabel(series[0].at)}</span><span>{dayLabel(series[series.length - 1].at)}</span>
              </div>
            </>
          ) : (
            <p className="p" style={{ marginTop: 16 }}>No {tab.toLowerCase()} sessions yet. Your trend shows up after the first one.</p>
          )}
        </section>

        <section className="card list" aria-label="Recent sessions" style={{ padding: '14px 14px 4px' }}>
          <h2 className="h2" style={{ margin: '0 0 4px 4px' }}>Recent</h2>
          {finished.length === 0 && <p className="p" style={{ margin: '4px 4px 12px' }}>Nothing logged yet.</p>}
          {finished.slice(0, 10).map((s) => {
            const ls = data.logs.filter((l) => l.sessionId === s.id);
            return (
              <button key={s.id} type="button" className="row row-btn" style={{ padding: '6px 4px' }} onClick={() => onOpen(s.id!)}>
                <span aria-hidden="true" style={{ width: 32, height: 32, borderRadius: 9, background: `var(--${s.dayId}-tint)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ width: 10, height: 10, borderRadius: 3, background: DAY_COLOR[s.dayId] }} /></span>
                <span className="row-main"><span className="row-title">{getDay(s.dayId).name}</span><span className="meta">{dayLabel(s.startedAt)}</span></span>
                <span className="num" style={{ fontSize: 14, fontWeight: 500, color: 'var(--text2)' }}>{formatDuration(s.endedAt! - s.startedAt)} · {(volume(ls) / 1000).toFixed(1)}k lb</span>
              </button>
            );
          })}
        </section>
      </main>
    </div>
  );
}
