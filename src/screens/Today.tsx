import { useState } from 'react';
import { DAY_ORDER, getDay, type DayId } from '../program';
import type { Data } from '../hooks';
import { dayLabel, daysAgo, isStandalone } from '../hooks';
import { nextDay, lastSessionOf } from '../logic/rotation';
import { estimateMinutes } from '../logic/stats';
import { plannedWeight } from '../logic/progression';
import { Chip, Icon, DAY_COLOR } from '../components/ui';
import { saveSettings, type Session } from '../db';

export function Today({ data, active, onStart, onResume, onHistory, onSettings, onOpenSummary }: {
  data: Data; active?: Session;
  onStart: (d: DayId) => void; onResume: () => void; onHistory: () => void; onSettings: () => void; onOpenSummary: (id: number) => void;
}) {
  const suggested = nextDay(data.sessions);
  const [picked, setPicked] = useState<DayId>(active?.dayId ?? suggested);
  const day = getDay(picked);
  const last = lastSessionOf(data.sessions, picked);
  const ups = day.exercises
    .map((ex) => ({ ex, s: plannedWeight(ex.kind, ex.name, ex.sets, data.logs) }))
    .filter((x) => x.s.delta !== 0 && x.s.weight !== null);
  const firstUp = ups[0];
  const sets = day.exercises.reduce((n, e) => n + e.sets, 0);
  const others = DAY_ORDER.filter((d) => d !== picked);
  const showInstall = !isStandalone() && !data.settings.installHintDismissed;

  return (
    <div className={`app day-${picked}`}>
      <main className="main plain">
        <div className="title-row" style={{ alignItems: 'center' }}>
          <div className="stack">
            <span className="sub" style={{ color: 'var(--text3)' }}>{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            <h1 className="h1">Today</h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="icon-btn boxed" aria-label="History" onClick={onHistory}>{Icon.chart}</button>
            <button type="button" className="icon-btn boxed" aria-label="Settings" onClick={onSettings}>{Icon.gear}</button>
          </div>
        </div>

        {showInstall && (
          <div className="banner" role="note">
            <span style={{ flex: '0 0 auto', marginTop: 1 }}>{Icon.info}</span>
            <span style={{ flex: '1 1 auto' }}>Install it: tap <b>Share</b> → <b>Add to Home Screen</b>. It then works offline and iOS keeps your history safe.</span>
            <button type="button" className="text-btn" style={{ height: 24, padding: 0 }} onClick={() => saveSettings({ installHintDismissed: true })}>OK</button>
          </div>
        )}

        <section className="card" aria-label="Up next" style={{ padding: 18 }}>
          <div className="card-head">
            <h2 className="h2">{active ? 'In progress' : picked === suggested ? 'Up next in rotation' : 'Your pick today'}</h2>
            <Chip tone="accent">Day {DAY_ORDER.indexOf(picked) + 1} of 3</Chip>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14 }}>
            <span className="big" style={{ fontSize: 64 }}>{day.name}</span>
            {firstUp && !active && (
              <span className="stack" style={{ fontSize: 15, fontWeight: 500 }}>
                <Chip tone="up" style={{ alignSelf: 'flex-start' }}>{Icon.up}{ups.length === 1 ? `${firstUp.ex.name.split(',')[0]} +${firstUp.s.delta}` : `${ups.length} lifts go up`}</Chip>
                <span style={{ color: 'var(--text2)' }}>earned last time</span>
              </span>
            )}
          </div>
          <p className="p" style={{ marginTop: 10 }}>{day.focus}. {day.cue.title.endsWith('.') ? day.cue.title : `${day.cue.title}.`}</p>

          <div role="radiogroup" aria-label="Day" style={{ display: 'flex', gap: 4, marginTop: 16 }}>
            {DAY_ORDER.map((d) => (
              <button key={d} type="button" role="radio" aria-checked={d === picked} disabled={!!active}
                onClick={() => setPicked(d)}
                style={{ flex: '1 1 0', height: 28, border: 0, borderRadius: 6, cursor: 'pointer', background: d === picked ? 'var(--accent-grad)' : 'var(--track)' }}>
                <span className="sr-only">{getDay(d).name}</span>
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 13, fontWeight: 500, color: 'var(--text3)' }} aria-hidden="true">
            {DAY_ORDER.map((d) => <span key={d} style={d === picked ? { color: 'var(--accent-text)', fontWeight: 600 } : undefined}>{getDay(d).name}{d === suggested ? ' ·  next' : ''}</span>)}
          </div>

          <div className="stats3 divider-top">
            <div><span className="stat-v" style={{ fontSize: 24 }}>~{estimateMinutes(picked, data.settings.restOverrides)}<span className="unit" style={{ fontSize: 15 }}> min</span></span><span className="meta">Est. time</span></div>
            <div><span className="stat-v" style={{ fontSize: 24 }}>{day.exercises.length}</span><span className="meta">Exercises</span></div>
            <div><span className="stat-v" style={{ fontSize: 24 }}>{sets}</span><span className="meta">Sets</span></div>
          </div>

          {last ? (
            <button type="button" className="pill-link" style={{ marginTop: 16 }} onClick={() => onOpenSummary(last.id!)}>
              <span>Last {day.name.toLowerCase()} · {dayLabel(last.startedAt)} · {daysAgo(last.startedAt)}</span>{Icon.chevron}
            </button>
          ) : (
            <div className="pill-link" style={{ marginTop: 16, cursor: 'default' }}><span>First {day.name.toLowerCase()} — you'll set your starting weights as you go.</span></div>
          )}
        </section>

        {!active && (
          <section className="card list" aria-label="Train something else" style={{ padding: '14px 14px 6px' }}>
            <h2 className="h2" style={{ margin: '0 0 4px 4px' }}>Or train something else</h2>
            {others.map((d) => {
              const od = getDay(d);
              const l = lastSessionOf(data.sessions, d);
              return (
                <button key={d} type="button" className="row row-btn" onClick={() => setPicked(d)} style={{ padding: '6px 4px' }}>
                  <span aria-hidden="true" style={{ width: 34, height: 34, borderRadius: 10, background: `var(--${d}-tint)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ width: 12, height: 12, borderRadius: 4, background: DAY_COLOR[d] }} /></span>
                  <span className="row-main"><span className="row-title">{od.name}</span><span className="meta">{od.focus}{l ? ` · last ${dayLabel(l.startedAt)}` : ''}</span></span>
                  <span style={{ color: 'var(--text3)' }}>{Icon.chevron}</span>
                </button>
              );
            })}
          </section>
        )}
      </main>

      <footer className="bottom">
        <div className="bottom-inner">
          {active ? (
            <button type="button" className="pill" onClick={onResume}>{Icon.play}Resume {getDay(active.dayId).name}</button>
          ) : (
            <button type="button" className="pill" onClick={() => onStart(picked)}>{Icon.play}Start {day.name}</button>
          )}
        </div>
      </footer>
    </div>
  );
}
