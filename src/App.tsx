import { useEffect, useState } from 'react';
import type { DayId } from './program';
import { useData } from './hooks';
import { addRest, endRest, endSession, logSet, startSession, undoLastSet, updatePlan } from './actions';
import { unlockAudio } from './timer/alerts';
import { useWakeLock } from './timer/wakeLock';
import { Today } from './screens/Today';
import { Overview } from './screens/Overview';
import { ActiveSet } from './screens/ActiveSet';
import { Rest } from './screens/Rest';
import { Summary } from './screens/Summary';
import { History } from './screens/History';
import { Settings } from './screens/Settings';

type View =
  | { name: 'today' }
  | { name: 'plan'; dayId: DayId }
  | { name: 'session'; id: number }
  | { name: 'session-plan'; id: number }
  | { name: 'summary'; id: number; from: 'session' | 'history' | 'today' }
  | { name: 'history' }
  | { name: 'settings' };

function useTheme(theme: 'light' | 'dark' | 'system' | undefined) {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0E0E10' : '#FFFFFF');
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);
}

export default function App() {
  const data = useData();
  const [view, setView] = useState<View | null>(null);
  const active = data?.sessions.filter((s) => !s.endedAt).sort((a, b) => b.startedAt - a.startedAt)[0];

  useTheme(data?.settings.theme);
  useWakeLock(!!active && (view?.name === 'session' || view?.name === 'session-plan'));

  // First load: reopen straight into an unfinished workout.
  useEffect(() => {
    if (data && view === null) setView(active ? { name: 'session', id: active.id! } : { name: 'today' });
  }, [data, view, active]);

  // Scroll to top on every screen change.
  useEffect(() => { window.scrollTo(0, 0); }, [view?.name]);

  if (!data || !view) return <div className="app" aria-busy="true" />;

  const go = (v: View) => setView(v);
  const toToday = () => go({ name: 'today' });
  // The live query can lag a write by a tick; wait for the session rather than bouncing away.
  const viewed = view.name === 'session' || view.name === 'session-plan' ? data.sessions.find((s) => s.id === view.id) : undefined;

  switch (view.name) {
    case 'today':
      return (
        <Today data={data} active={active}
          onStart={(dayId) => { unlockAudio(); go({ name: 'plan', dayId }); }}
          onResume={() => { unlockAudio(); if (active) go({ name: 'session', id: active.id! }); }}
          onHistory={() => go({ name: 'history' })}
          onSettings={() => go({ name: 'settings' })}
          onOpenSummary={(id) => go({ name: 'summary', id, from: 'today' })} />
      );

    case 'plan':
      return (
        <Overview data={data} dayId={view.dayId} onBack={toToday}
          onBegin={async (order, swaps) => {
            unlockAudio();
            void navigator.storage?.persist?.();
            const id = await startSession(view.dayId, order, swaps);
            go({ name: 'session', id });
          }} />
      );

    case 'session-plan': {
      const active = viewed;
      if (!active) return <div className="app" aria-busy="true" />;
      return (
        <Overview data={data} dayId={active.dayId} live={active}
          onBack={() => go({ name: 'session', id: active.id! })}
          onSave={(order, swaps) => updatePlan(active, order, swaps)}
          onEnd={async () => {
            const r = await endSession(active);
            go(r === 'ended' ? { name: 'summary', id: active.id!, from: 'session' } : { name: 'today' });
          }} />
      );
    }

    case 'session': {
      const active = viewed;
      if (!active) return <div className="app" aria-busy="true" />;
      if (active.endedAt) return <Summary data={data} sessionId={active.id!} onDone={toToday} />;
      if (active.phase === 'rest') {
        return (
          <Rest data={data} session={active}
            onAdd30={() => addRest(active, 30)}
            onSkip={() => endRest(active)}
            onEdit={() => undoLastSet(active)}
            onMenu={() => go({ name: 'session-plan', id: active.id! })} />
        );
      }
      return (
        <ActiveSet key={active.id} data={data} session={active}
          onMenu={() => go({ name: 'session-plan', id: active.id! })}
          onLog={async (w, r) => {
            unlockAudio();
            const res = await logSet(active, w, r, data.settings.restOverrides);
            if (res === 'done') go({ name: 'summary', id: active.id!, from: 'session' });
          }} />
      );
    }

    case 'summary':
      return <Summary data={data} sessionId={view.id} onDone={() => go(view.from === 'history' ? { name: 'history' } : { name: 'today' })} />;

    case 'history':
      return <History data={data} onBack={toToday} onOpen={(id) => go({ name: 'summary', id, from: 'history' })} />;

    case 'settings':
      return <Settings data={data} onBack={toToday} />;
  }
}
