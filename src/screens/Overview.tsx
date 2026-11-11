import { useState } from 'react';
import { findExercise, getDay, type DayId } from '../program';
import type { Data } from '../hooks';
import { fmtW } from '../hooks';
import type { Session } from '../db';
import { plannedWeight, formatDelta } from '../logic/progression';
import { estimateMinutes } from '../logic/stats';
import { restFor, formatClock } from '../logic/rest';
import { Chip, Icon, PageHeader } from '../components/ui';

/**
 * Before a session: plan it (reorder, swap) then Begin.
 * During a session (opened from the menu): see progress, adjust exercises not started yet, resume or end.
 */
export function Overview({ data, dayId, live, onBack, onBegin, onSave, onEnd }: {
  data: Data; dayId: DayId; live?: Session;
  onBack: () => void;
  onBegin?: (order: string[], swaps: Record<string, string>) => void;
  onSave?: (order: string[], swaps: Record<string, string>) => void;
  onEnd?: () => void;
}) {
  const day = getDay(dayId);
  const [order, setOrder] = useState<string[]>(live?.order ?? day.exercises.map((e) => e.id));
  const [swaps, setSwaps] = useState<Record<string, string>>(live?.swaps ?? {});
  const [reorder, setReorder] = useState(false);
  const [swapOpen, setSwapOpen] = useState<string | null>(null);
  const [custom, setCustom] = useState('');

  const logs = data.logs;
  const doneCount = (slotId: string) => (live ? logs.filter((l) => l.sessionId === live.id && l.slotId === slotId).length : 0);
  const locked = (slotId: string) => doneCount(slotId) > 0;
  const sets = order.reduce((n, id) => n + findExercise(dayId, id).sets, 0);

  const commit = (o: string[], s: Record<string, string>) => { setOrder(o); setSwaps(s); onSave?.(o, s); };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= order.length || locked(order[i]) || locked(order[j])) return;
    const o = [...order];
    [o[i], o[j]] = [o[j], o[i]];
    commit(o, swaps);
  };
  const pickSwap = (slotId: string, name: string | null) => {
    const s = { ...swaps };
    if (name && name !== findExercise(dayId, slotId).name) s[slotId] = name; else delete s[slotId];
    commit(order, s);
    setSwapOpen(null);
    setCustom('');
  };

  return (
    <div className={`app day-${dayId}`}>
      <PageHeader title={live ? `${day.name} · in progress` : `${day.name} session`} onBack={onBack}
        right={<button type="button" className="text-btn muted" onClick={() => { setReorder(!reorder); setSwapOpen(null); }}>{reorder ? 'Done' : 'Reorder'}</button>} />
      <main className="main">
        <div className="title-row">
          <div className="stack">
            <span className="big" style={{ fontSize: 28, letterSpacing: '-0.03em' }}>{order.length} exercises</span>
            <span className="meta" style={{ fontSize: 14 }}>{sets} sets · {day.restNote.toLowerCase()}{day.failureLastSet ? ' · last set to failure' : ''}</span>
          </div>
          <Chip tone="accent">~{estimateMinutes(dayId, data.settings.restOverrides)} min</Chip>
        </div>

        <section className="card list" aria-label="Exercises">
          <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {order.map((slotId, i) => {
              const ex = findExercise(dayId, slotId);
              const name = swaps[slotId] ?? ex.name;
              const plan = plannedWeight(ex.kind, name, ex.sets, logs, live?.id);
              const done = doneCount(slotId);
              const isLocked = done > 0;
              return (
                <li key={slotId} className="li" style={{ padding: '4px 0' }}>
                  <div className="row" style={{ padding: 0 }}>
                    <span className={`badge${done >= ex.sets ? ' done' : (live ? (isLocked ? ' on' : '') : i === 0 ? ' on' : '')}`} aria-hidden="true">{done >= ex.sets ? '✓' : i + 1}</span>
                    <span className="row-main">
                      <span className="row-title">{name}</span>
                      <span className="meta num">
                        {ex.sets}×{ex.reps} · rest {formatClock(restFor(dayId, ex, data.settings.restOverrides))}
                        {swaps[slotId] ? ` · instead of ${ex.name}` : ''}
                        {live && done > 0 && done < ex.sets ? ` · ${done}/${ex.sets} done` : ''}
                      </span>
                    </span>
                    {plan.weight !== null ? (
                      <span className="num" style={{ fontSize: 15, fontWeight: 600 }}>{ex.kind === 'assisted' ? '−' : ''}{fmtW(plan.weight)}</span>
                    ) : <span className="meta">new</span>}
                    {plan.weight !== null && plan.delta !== 0 && !plan.fromThisSession && <Chip tone="up" sm>{formatDelta(ex.kind, plan.delta)}</Chip>}
                    {reorder ? (
                      <span style={{ display: 'flex' }}>
                        <button type="button" className="icon-btn" style={{ width: 40 }} aria-label={`Move ${name} up`} disabled={i === 0 || isLocked} onClick={() => move(i, -1)}>{Icon.arrowUp}</button>
                        <button type="button" className="icon-btn" style={{ width: 40 }} aria-label={`Move ${name} down`} disabled={i === order.length - 1 || isLocked} onClick={() => move(i, 1)}>{Icon.arrowDown}</button>
                      </span>
                    ) : (
                      <button type="button" className="icon-btn" style={{ width: 40, color: 'var(--text3)', marginRight: -6 }} aria-label={`Swap ${name}`} aria-expanded={swapOpen === slotId} disabled={isLocked}
                        onClick={() => setSwapOpen(swapOpen === slotId ? null : slotId)}>{Icon.swap}</button>
                    )}
                  </div>
                  {swapOpen === slotId && (
                    <div style={{ margin: '2px 0 10px 44px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span className="meta" style={{ color: 'var(--text2)' }}>Station taken? Same sets × reps.</span>
                      <div role="radiogroup" aria-label={`Swap ${ex.name} for`} className="radio-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                        {[ex.name, ...ex.alternates].map((alt) => (
                          <button key={alt} type="button" role="radio" className="radio" aria-checked={name === alt} onClick={() => pickSwap(slotId, alt)} style={{ padding: '0 8px' }}>
                            {alt === ex.name ? 'Original' : alt}
                          </button>
                        ))}
                      </div>
                      <form style={{ display: 'flex', gap: 8 }} onSubmit={(e) => { e.preventDefault(); if (custom.trim()) pickSwap(slotId, custom.trim()); }}>
                        <label className="sr-only" htmlFor={`custom-${slotId}`}>Other exercise</label>
                        <input id={`custom-${slotId}`} className="select" style={{ flex: '1 1 auto', minWidth: 0 }} placeholder="Other exercise…" value={custom} onChange={(e) => setCustom(e.target.value)} />
                        <button type="submit" className="text-btn" disabled={!custom.trim()}>Use</button>
                      </form>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        {live && onEnd && (
          <button type="button" className="text-btn danger" style={{ alignSelf: 'center' }} onClick={() => { if (confirm('End this session now? Sets you logged are kept.')) onEnd(); }}>
            End session now
          </button>
        )}
      </main>

      <footer className="bottom">
        <div className="bottom-inner">
          {live ? (
            <button type="button" className="pill" onClick={onBack}>Resume{Icon.chevron}</button>
          ) : (
            <button type="button" className="pill" onClick={() => onBegin?.(order, swaps)}>
              Begin · {swaps[order[0]] ?? findExercise(dayId, order[0]).name}{Icon.chevron}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
