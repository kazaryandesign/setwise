import { useEffect, useRef, useState } from 'react';
import { PROGRAM, DEFAULT_REST } from '../program';
import type { Data } from '../hooks';
import { isStandalone } from '../hooks';
import { exportBackup, importBackup, saveSettings, type Settings as S } from '../db';
import { restFor, formatClock } from '../logic/rest';
import { PageHeader } from '../components/ui';

const REST_OPTIONS = [60, 75, 90, 105, 120, 135, 150, 165, 180, 210, 240, 300];

export function Settings({ data, onBack }: { data: Data; onBack: () => void }) {
  const st = data.settings;
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [msg, setMsg] = useState('');
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => { void navigator.storage?.persisted?.().then(setPersisted); }, []);

  const setRest = (id: string, sec: number, def: number) => {
    const o = { ...st.restOverrides };
    if (sec === def) delete o[id]; else o[id] = sec;
    void saveSettings({ restOverrides: o });
  };

  const doExport = async () => {
    const b = await exportBackup();
    const blob = new Blob([JSON.stringify(b, null, 1)], { type: 'application/json' });
    const name = `setwise-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const f = new File([blob], name, { type: 'application/json' });
    // iOS: the share sheet lets you save to Files / AirDrop / Mail.
    if (navigator.canShare?.({ files: [f] })) {
      try { await navigator.share({ files: [f], title: 'Setwise backup' }); setMsg('Backup shared.'); return; } catch { /* cancelled; fall back */ }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    setMsg(`Saved ${name}.`);
  };

  const doImport = async (f: File) => {
    try {
      const data = JSON.parse(await f.text());
      if (!confirm(`Replace everything on this phone with the backup from ${String(data.exportedAt ?? '').slice(0, 10)}?`)) return;
      await importBackup(data);
      setMsg(`Restored ${data.sessions.length} sessions.`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Could not read that file.');
    }
  };

  return (
    <div className="app day-push">
      <PageHeader title="Settings" onBack={onBack} />
      <main className="main" style={{ paddingBottom: 'calc(28px + env(safe-area-inset-bottom))' }}>
        <section className="card" aria-label="Appearance">
          <h2 className="h2">Appearance</h2>
          <div role="radiogroup" aria-label="Theme" className="radio-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginTop: 12 }}>
            {(['light', 'dark', 'system'] as S['theme'][]).map((t) => (
              <button key={t} type="button" role="radio" className="radio" aria-checked={st.theme === t} onClick={() => saveSettings({ theme: t })}>{t[0].toUpperCase() + t.slice(1)}</button>
            ))}
          </div>
        </section>

        <section className="card" aria-label="Rest timer alerts">
          <div className="card-head">
            <h2 className="h2">Chime at 0:10 and 0:00</h2>
            <button type="button" role="switch" aria-checked={st.sound} aria-label="Sound" onClick={() => saveSettings({ sound: !st.sound })}
              style={{ width: 56, height: 32, borderRadius: 16, border: 0, padding: 3, cursor: 'pointer', background: st.sound ? 'var(--up)' : 'var(--tick)', display: 'flex', justifyContent: st.sound ? 'flex-end' : 'flex-start' }}>
              <span style={{ width: 26, height: 26, borderRadius: 13, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </button>
          </div>
          <p className="p" style={{ marginTop: 8, fontSize: 14 }}>
            iPhones don't let web apps vibrate, so the timer chimes and flashes the screen instead. The chime follows your ringer: silent mode mutes it.
            If you leave the app mid-rest, the timer keeps counting and shows the right time when you come back, but iOS can't alert you while you're away.
          </p>
        </section>

        <section className="card list" aria-label="Rest per exercise" style={{ padding: '14px 14px 6px' }}>
          <h2 className="h2" style={{ margin: '0 0 2px 4px' }}>Rest per exercise</h2>
          <p className="meta" style={{ margin: '0 4px 6px' }}>Push 2:30 (2–3 min), squats 3:00, everything else {formatClock(DEFAULT_REST)}.</p>
          {PROGRAM.map((day) => (
            <div key={day.id}>
              <div className="meta" style={{ padding: '10px 4px 2px', fontWeight: 600, color: 'var(--text2)' }}>{day.name}</div>
              {day.exercises.map((ex) => {
                const def = restFor(day.id, ex);
                const cur = restFor(day.id, ex, st.restOverrides);
                return (
                  <div key={ex.id} className="row" style={{ padding: '4px' }}>
                    <label className="row-main" htmlFor={`rest-${ex.id}`}><span className="row-title" style={{ fontWeight: 500 }}>{ex.name}</span></label>
                    <select id={`rest-${ex.id}`} className="select num" value={cur} onChange={(e) => setRest(ex.id, Number(e.target.value), def)}>
                      {[...new Set([...REST_OPTIONS, cur, def])].sort((a, b) => a - b).map((s) => <option key={s} value={s}>{formatClock(s)}{s === def ? ' (default)' : ''}</option>)}
                    </select>
                  </div>
                );
              })}
            </div>
          ))}
        </section>

        <section className="card" aria-label="Your data">
          <h2 className="h2">Your data</h2>
          <p className="p" style={{ marginTop: 8, fontSize: 14 }}>
            Everything stays on this phone. Export a backup now and then (Files, AirDrop or email) — it's the only copy.
            {' '}{isStandalone() ? 'Installed to Home Screen ✓' : 'Add to Home Screen so iOS keeps your history.'}
            {persisted ? ' Storage is marked persistent ✓' : ''}
          </p>
          <div className="radio-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', marginTop: 12 }}>
            <button type="button" className="radio" onClick={doExport}>Export backup</button>
            <button type="button" className="radio" onClick={() => file.current?.click()}>Import backup</button>
          </div>
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void doImport(f); e.target.value = ''; }} />
          {msg && <p className="meta" role="status" style={{ marginTop: 10 }}>{msg}</p>}
        </section>

        <p className="meta" style={{ textAlign: 'center' }}>Setwise · {data.sessions.filter((s) => s.endedAt).length} sessions logged</p>
      </main>
    </div>
  );
}
