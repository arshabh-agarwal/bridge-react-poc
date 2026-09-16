import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { useRemoteContext } from '../context';

const navStyle = ({ isActive }: { isActive: boolean }) => ({
  fontWeight: isActive ? 700 : 400,
  textDecoration: isActive ? 'underline' : 'none',
});

export function Layout() {
  const { basename, remoteName, reactVersion, onHostNavigate } = useRemoteContext();
  const location = useLocation();

  return (
    <div
      data-testid={`${remoteName}-root`}
      style={{
        border: '2px dashed #7c3aed',
        borderRadius: 8,
        padding: 16,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <header style={{ display: 'flex', gap: 16, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <strong style={{ color: '#7c3aed' }}>{remoteName}</strong>
        <code>React {reactVersion}</code>
        <code>basename={basename}</code>
        <code data-testid="remote-pathname">pathname={location.pathname}</code>
      </header>

      <nav style={{ display: 'flex', gap: 12, margin: '12px 0' }}>
        <NavLink to="/" end style={navStyle}>
          Home
        </NavLink>
        <NavLink to="/about" style={navStyle}>
          About
        </NavLink>
        <Link to="/items/1">Item 1</Link>
        <Link to="/items/42">Item 42</Link>
        <Link to="/does-not-exist">Broken link</Link>
        {onHostNavigate && (
          <button type="button" onClick={() => onHostNavigate('/')}>
            Back to host home
          </button>
        )}
      </nav>

      <main style={{ padding: 12, background: '#faf5ff', borderRadius: 6 }}>
        <Outlet />
      </main>
    </div>
  );
}
