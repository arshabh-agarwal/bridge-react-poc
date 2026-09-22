import { useEffect, useState } from 'react';
import { useLocation } from '@tanstack/react-router';
import { useRemoteContext } from './context';
import { describeReactShare } from './instances';

/**
 * Visible proof that this remote's hooks run on its own React dispatcher.
 * Mixed React copies (the classic MF singleton failure) throw "Invalid hook call"
 * and this interval never ticks.
 */
export function HooksProbe() {
  const { remoteName } = useRemoteContext();
  const location = useLocation();
  const [ticks, setTicks] = useState(0);
  const [pathRuns, setPathRuns] = useState(0);
  const [share, setShare] = useState('checking React instance…');

  useEffect(() => {
    const id = window.setInterval(() => setTicks((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setPathRuns((n) => n + 1);
  }, [location.pathname]);

  useEffect(() => {
    setShare(describeReactShare(remoteName));
  }, [remoteName, ticks]);

  const ok = ticks > 0;

  return (
    <aside
      data-testid="hooks-probe"
      data-ok={ok ? 'true' : 'false'}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        alignItems: 'baseline',
        margin: '0 0 12px',
        padding: '8px 10px',
        borderRadius: 6,
        fontSize: 12,
        background: ok ? '#ecfdf5' : '#fff7ed',
        border: `1px solid ${ok ? '#6ee7b7' : '#fdba74'}`,
        color: '#18181b',
      }}
    >
      <strong style={{ color: ok ? '#047857' : '#c2410c' }}>
        {ok ? 'useEffect ok' : 'useEffect starting…'}
      </strong>
      <code data-testid="hooks-probe-ticks">interval ticks={ticks}</code>
      <code data-testid="hooks-probe-paths">path-effect runs={pathRuns}</code>
      <span data-testid="hooks-probe-share">{share}</span>
    </aside>
  );
}
