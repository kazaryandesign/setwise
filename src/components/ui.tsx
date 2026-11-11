import type { CSSProperties, ReactNode } from 'react';

/* ---------- icons (inline stroke SVG, as on the canvas) ---------- */
const S = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
export const Icon = {
  menu: <svg width="20" height="20" viewBox="0 0 24 24" {...S} strokeWidth={2} aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10" /></svg>,
  back: <svg width="20" height="20" viewBox="0 0 24 24" {...S} strokeWidth={2} aria-hidden="true"><polyline points="15 5 8 12 15 19" /></svg>,
  chevron: <svg width="16" height="16" viewBox="0 0 24 24" {...S} strokeWidth={2} aria-hidden="true"><polyline points="9 5 16 12 9 19" /></svg>,
  minus: <svg width="24" height="24" viewBox="0 0 24 24" {...S} strokeWidth={2.4} aria-hidden="true"><path d="M5 12h14" /></svg>,
  plus: <svg width="24" height="24" viewBox="0 0 24 24" {...S} strokeWidth={2.4} aria-hidden="true"><path d="M5 12h14M12 5v14" /></svg>,
  check: <svg width="20" height="20" viewBox="0 0 24 24" {...S} strokeWidth={2.8} aria-hidden="true"><polyline points="5 12.5 10 17 19 7" /></svg>,
  up: <svg width="11" height="11" viewBox="0 0 24 24" {...S} strokeWidth={3} aria-hidden="true"><polyline points="5 15 12 8 19 15" /></svg>,
  bolt: <svg width="14" height="14" viewBox="0 0 24 24" {...S} strokeWidth={2.4} aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" /></svg>,
  info: <svg width="16" height="16" viewBox="0 0 24 24" {...S} strokeWidth={2.2} aria-hidden="true"><circle cx="12" cy="12" r="10" /><line x1="12" y1="11" x2="12" y2="17" /><circle cx="12" cy="7.5" r="0.6" fill="currentColor" /></svg>,
  chart: <svg width="22" height="22" viewBox="0 0 24 24" {...S} strokeWidth={1.8} aria-hidden="true"><path d="M3 3v18h18" /><path d="M7 15l4-4 3 3 5-6" /></svg>,
  gear: <svg width="22" height="22" viewBox="0 0 24 24" {...S} strokeWidth={1.8} aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
  swap: <svg width="18" height="18" viewBox="0 0 24 24" {...S} strokeWidth={2} aria-hidden="true"><path d="M7 16V4M3 8l4-4 4 4M17 8v12M21 16l-4 4-4-4" /></svg>,
  arrowUp: <svg width="18" height="18" viewBox="0 0 24 24" {...S} strokeWidth={2.2} aria-hidden="true"><polyline points="6 15 12 9 18 15" /></svg>,
  arrowDown: <svg width="18" height="18" viewBox="0 0 24 24" {...S} strokeWidth={2.2} aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>,
  play: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z" /></svg>,
  bell: <svg width="14" height="14" viewBox="0 0 24 24" {...S} strokeWidth={2} aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>,
  x: <svg width="10" height="10" viewBox="0 0 24 24" {...S} strokeWidth={3.4} aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>
};

export function Chip({ tone, children, sm, style }: { tone: 'up' | 'accent' | 'neutral' | 'dark'; children: ReactNode; sm?: boolean; style?: CSSProperties }) {
  return <span className={`chip ${tone}${sm ? ' sm' : ''}`} style={style}>{children}</span>;
}

export function SegBar({ parts }: { parts: number[] }) {
  return (
    <div className="segbar" aria-hidden="true">
      {parts.map((p, i) => <div key={i}><div style={{ width: `${Math.round(p * 100)}%` }} /></div>)}
    </div>
  );
}

export function SessionHeader({ title, clock, progress, onMenu, menuLabel = 'Session overview' }: { title: string; clock?: string; progress?: number[]; onMenu: () => void; menuLabel?: string }) {
  return (
    <header className="top">
      <div className="top-row">
        <button type="button" className="icon-btn" aria-label={menuLabel} onClick={onMenu}>{Icon.menu}</button>
        <span className="top-title"><span className="dot" aria-hidden="true" />{title}</span>
        {clock ? <span className="clock-chip">{clock}</span> : <span style={{ width: 48 }} />}
      </div>
      {progress && <SegBar parts={progress} />}
    </header>
  );
}

export function PageHeader({ title, onBack, right }: { title: string; onBack: () => void; right?: ReactNode }) {
  return (
    <header className="top" style={{ paddingRight: 12 }}>
      <div className="top-row">
        <button type="button" className="icon-btn" aria-label="Back" onClick={onBack}>{Icon.back}</button>
        <span className="top-title">{title}</span>
        {right ?? <span style={{ width: 48 }} />}
      </div>
    </header>
  );
}

export function Stepper(props: {
  label: string; value: number | null; unit: string; size: number; small?: boolean;
  onStep: (dir: -1 | 1) => void; onType?: (v: number | null) => void; placeholder?: string;
}) {
  const { label, value, unit, size, small, onStep, onType, placeholder } = props;
  return (
    <div className="stepper">
      <button type="button" className={`step-btn${small ? ' sm' : ''}`} aria-label={`Decrease ${label}`} onClick={() => onStep(-1)}>{Icon.minus}</button>
      <div className="step-val">
        {onType ? (
          <input
            className="step-input big"
            style={{ fontSize: size }}
            inputMode="decimal"
            aria-label={label}
            placeholder={placeholder ?? '—'}
            value={value ?? ''}
            onChange={(e) => {
              const t = e.target.value.replace(',', '.').replace(/[^0-9.]/g, '');
              onType(t === '' ? null : Number(t));
            }}
          />
        ) : (
          <span className="big" style={{ fontSize: size }} aria-label={label}>{value ?? '—'}</span>
        )}
        <span className="unit">{unit}</span>
      </div>
      <button type="button" className={`step-btn${small ? ' sm' : ''}`} aria-label={`Increase ${label}`} onClick={() => onStep(1)}>{Icon.plus}</button>
    </div>
  );
}

/** Set segments (Version B · Segmented). */
export function SetSegments({ total, done, current, failureLast, labels }: { total: number; done: number; current: number; failureLast: boolean; labels: string[] }) {
  const cols = { gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` };
  return (
    <>
      <div className="sets4" style={cols} role="img" aria-label={`${done} of ${total} sets done`}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className={`s${i < done ? ' done' : ''}${i === current ? ' now' : ''}`}>
            {failureLast && i === total - 1 && i >= done && i !== current ? Icon.bolt : null}
          </div>
        ))}
      </div>
      <div className="sets4-labels" style={cols}>
        {labels.map((l, i) => <span key={i} className={i === current ? 'now' : ''}>{l}</span>)}
      </div>
    </>
  );
}

const GRAD: [number, number[]][] = [[0, [114, 190, 230]], [0.42, [85, 152, 236]], [0.7, [76, 130, 242]], [1, [120, 150, 248]]];
export function gradAt(f: number): string {
  for (let i = 1; i < GRAD.length; i++) {
    if (f <= GRAD[i][0]) {
      const [a0, a] = GRAD[i - 1];
      const [b0, b] = GRAD[i];
      const k = (f - a0) / (b0 - a0);
      return `rgb(${a.map((v, j) => Math.round(v + (b[j] - v) * k)).join(',')})`;
    }
  }
  return 'rgb(120,150,248)';
}

/** Semicircle tick gauge (Version A · Gauge). `fill` 0–1. */
export function TickGauge({ fill, children, accent }: { fill: number; children: ReactNode; accent?: string }) {
  const N = 37;
  const edge = Math.round(fill * (N - 1));
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 326, margin: '6px auto 0', aspectRatio: '326 / 196' }}>
      <svg viewBox="0 0 326 196" width="100%" height="100%" aria-hidden="true" style={{ position: 'absolute', inset: 0 }}>
        {Array.from({ length: N }, (_, i) => {
          const f = i / (N - 1);
          const isEdge = i === edge;
          const h = isEdge ? 38 : 26;
          const c = isEdge ? (accent ?? '#3C7CEB') : f <= fill ? (accent ? accent : gradAt(f)) : 'var(--tick)';
          return <rect key={i} x={160} y={176 - 136 - h} width={6} height={h} rx={3} fill={c} opacity={accent && !isEdge && f <= fill ? 0.55 + 0.45 * f : 1} transform={`rotate(${-90 + f * 180} 163 176)`} />;
        })}
      </svg>
      {children}
    </div>
  );
}

/** Horizontal tick meter (Version D · Tick meter) for reps on a failure set. */
export function TickMeter({ value, max, target, last }: { value: number; max: number; target: number; last?: number | null }) {
  const W = 326;
  const x = (n: number) => 5 + (Math.min(max, Math.max(1, n)) - 1) * (W - 10) / (max - 1);
  return (
    <svg viewBox={`0 0 ${W} 96`} width="100%" role="img" aria-label={`${value} reps; target ${target}${last ? `; last time ${last}` : ''}`} style={{ marginTop: 14, overflow: 'visible' }}>
      {value > 0 && (
        <g transform={`translate(${Math.max(18, Math.min(W - 18, x(value)))} 0)`}>
          <rect x={-18} y={0} width={36} height={26} rx={6} fill="var(--accent)" />
          <text x={0} y={18} textAnchor="middle" fontSize="14" fontWeight="600" fill="#fff" style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</text>
        </g>
      )}
      {Array.from({ length: max }, (_, k) => {
        const i = k + 1;
        const edge = i === value;
        const lit = i <= value;
        const h = edge ? 40 : lit ? 28 : 22;
        return <rect key={i} x={x(i) - 5} y={70 - h} width={10} height={h} rx={4} fill={edge ? 'var(--accent)' : lit ? gradAt(i / max) : i === target ? 'var(--text3)' : 'var(--tick)'} />;
      })}
      <text x={x(target)} y={90} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--text2)">Target {target}</text>
      {last ? <text x={x(Math.min(max, last)) + (last === target ? 40 : 0)} y={90} textAnchor={last > target ? 'start' : 'middle'} dx={last > target ? 14 : 0} fontSize="12" fontWeight="500" fill="var(--text3)">· last {last}</text> : null}
    </svg>
  );
}

/** Stacked share bar (Engagement Funnel). */
export function StackBar({ parts }: { parts: { label: string; value: number; color: string }[] }) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  return (
    <>
      <div role="img" aria-label={parts.map((p) => `${p.label} ${Math.round(p.value).toLocaleString()}`).join(', ')} style={{ display: 'flex', gap: 4, height: 36, marginTop: 18 }}>
        {parts.map((p, i) => <div key={i} style={{ flex: `${p.value / total} 1 0`, minWidth: 6, borderRadius: 8, background: p.color }} />)}
      </div>
      <div className="num" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px 16px', marginTop: 14, fontSize: 14, fontWeight: 500 }}>
        {parts.map((p, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 3, background: p.color, flex: '0 0 auto' }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.label}</span>
            <span style={{ marginLeft: 'auto', color: 'var(--text3)' }}>{Math.round(p.value).toLocaleString()}</span>
          </span>
        ))}
      </div>
    </>
  );
}

/** Mini bar trend (Engagement tiles / Funnel C). Last bar highlighted. */
export function MiniBars({ values, color, height = 40, width = 8, labels }: { values: number[]; color: string; height?: number; width?: number; labels?: boolean }) {
  if (!values.length) return null;
  const mn = Math.min(...values), mx = Math.max(...values);
  return (
    <div aria-hidden="true" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: labels ? 'space-between' : 'flex-start', gap: labels ? 0 : 5, height: height + (labels ? 20 : 0) }}>
      {values.map((v, i) => {
        const last = i === values.length - 1;
        const h = mx === mn ? height * 0.6 : height * 0.25 + (height * 0.75 * (v - mn)) / (mx - mn);
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            {labels && <span className="num" style={{ fontSize: 11, fontWeight: 600, color: last ? 'var(--text)' : 'var(--text3)' }}>{v}</span>}
            <div style={{ width, height: h, borderRadius: width / 2 + 2, background: last ? color : 'var(--track)', boxShadow: last ? `0 0 12px ${color}55` : 'none' }} />
          </div>
        );
      })}
    </div>
  );
}

export const DAY_COLOR = { push: '#3C7CEB', pull: '#8B6CF0', legs: '#1A8435' } as const;
