import { Link, Outlet, useLocation } from '@tanstack/react-router';
import { HostLink } from '../navigation';
import { useRemoteContext } from '../context';
import { HooksProbe } from '../HooksProbe';

// One tab per route this remote owns. The host knows nothing about these.
const TABS: readonly { label: string; to: string; exact: boolean; matchPrefix?: string }[] = [
  { label: 'Home', to: '/', exact: true },
  { label: 'About', to: '/about', exact: true },
  { label: 'Items', to: '/items/7', exact: false, matchPrefix: '/items' },
];

const activeTabStyle = {
  padding: '8px 14px',
  marginBottom: -2,
  borderBottom: '2px solid #7c3aed',
  color: '#6d28d9',
  fontWeight: 600,
  textDecoration: 'none',
};

const inactiveTabStyle = {
  padding: '8px 14px',
  marginBottom: -2,
  borderBottom: '2px solid transparent',
  color: '#52525b',
  fontWeight: 400,
  textDecoration: 'none',
};

export function Layout() {
  const { basename, remoteName, reactVersion } = useRemoteContext();
  const location = useLocation();

  return (
    <div
      data-testid={`${remoteName}-root`}
      style={{
        border: '2px dashed #7c3aed',
        borderRadius: 0,
        height: '100%',
        minHeight: '100%',
        padding: 16,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <header
        style={{ display: 'flex', gap: 16, alignItems: 'baseline', flexWrap: 'wrap', fontSize: 13 }}
      >
        <strong style={{ color: '#7c3aed', fontSize: 15 }}>{remoteName}</strong>
        <code>React {reactVersion}</code>
        <code>basename={basename}</code>
        <code data-testid="remote-pathname">pathname={location.pathname}</code>
      </header>

      <nav
        className="remote-tabs"
        aria-label={`${remoteName} routes`}
        style={{ display: 'flex', gap: 4, borderBottom: '2px solid #e4e4e7', margin: '12px 0' }}
      >
        {TABS.map((tab) => {
          // TanStack Router's Link doesn't have NavLink's isActive render prop.
          // Compute active state from the current pathname instead.
          const isActive = tab.matchPrefix
            ? location.pathname.startsWith(tab.matchPrefix)
            : tab.exact
              ? location.pathname === tab.to
              : location.pathname.startsWith(tab.to);

          return (
            <Link
              key={tab.label}
              to={tab.to}
              className={isActive ? 'active' : ''}
              style={isActive ? activeTabStyle : inactiveTabStyle}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 13, alignItems: 'center' }}>
        <span style={{ color: '#71717a' }}>Demo links:</span>
        <Link to="/items/42">Item 42</Link>
        <Link to="/does-not-exist">Broken link</Link>
        <HostLink to="/">Back to host home</HostLink>
      </div>

      <HooksProbe />

      <main style={{ padding: 12, background: '#faf5ff', borderRadius: 6 }}>
        <Outlet />
      </main>
    </div>
  );
}
