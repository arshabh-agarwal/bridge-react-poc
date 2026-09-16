import * as React from 'react';
import { useEffect, useState, version as reactVersion } from 'react';
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Link,
  Outlet,
  useRouterState,
} from '@tanstack/react-router';
import { Remote18App, Remote19App } from './remotes';
import './styles.css';

export interface HostContext {
  hostName: string;
}

type RemoteName = 'remote18' | 'remote19';

const REMOTES: Record<RemoteName, { label: string; sub: string; App: typeof Remote18App }> = {
  remote18: { label: 'React 18', sub: 'remote18 / react-router', App: Remote18App },
  remote19: { label: 'React 19', sub: 'remote19 / react-router', App: Remote19App },
};

const rootRoute = createRootRouteWithContext<HostContext>()({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HostHome,
});

// `$` is a splat: the host claims the whole prefix and hands it to the remote.
const remote18Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/remote18/$',
  component: () => <RemoteShell remote="remote18" />,
});

const remote19Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/remote19/$',
  component: () => <RemoteShell remote="remote19" />,
});

const routeTree = rootRoute.addChildren([indexRoute, remote18Route, remote19Route]);

export function createHostRouter(hostName: string) {
  // POC diagnostics: lets us compare React instance identity between host and remotes.
  ((globalThis as any).__pocReact ??= new Map()).set(hostName, React);
  return createRouter({
    routeTree,
    context: { hostName },
    defaultPreload: false,
  });
}

function usePathname() {
  return useRouterState({ select: (s) => s.location.pathname });
}

function HostHooksProbe() {
  const [ticks, setTicks] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTicks((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <code data-testid="host-effect-ticks">
      host useEffect ticks={ticks}
      {ticks > 0 ? ' · ok' : ''}
    </code>
  );
}

function RootLayout() {
  const { hostName } = rootRoute.useRouteContext();
  const pathname = usePathname();

  return (
    <div className="hg">
      <header className="hg__header">
        <strong>{hostName}</strong>
        <code>React {reactVersion}</code>
        <code>TanStack Router</code>
        <code data-testid="host-pathname">pathname={pathname}</code>
        <HostHooksProbe />
      </header>

      <nav className="hg__nav" aria-label="Remotes">
        <h2>Remotes</h2>
        <Link to="/" activeProps={{}} className={pathname === '/' ? 'is-active' : undefined}>
          Host home
        </Link>
        {(Object.keys(REMOTES) as RemoteName[]).map((name) => (
          <Link
            activeProps={{}}
            key={name}
            to={`/${name}/$` as '/remote18/$'}
            params={{ _splat: '' }}
            className={pathname.startsWith(`/${name}`) ? 'is-active' : undefined}
          >
            {REMOTES[name].label}
            <span className="nav-sub">{REMOTES[name].sub}</span>
          </Link>
        ))}
      </nav>

      <main className="hg__main">
        <Outlet />
      </main>

      <footer className="hg__footer">
        Host owns the header and side nav. Nothing in the main area is host UI — the remote
        renders its own tabs, routes, and content.
      </footer>
    </div>
  );
}

// The main area is the remote's alone: the host hands over the prefix and renders nothing else.
function RemoteShell({ remote }: { remote: RemoteName }) {
  const { App } = REMOTES[remote];
  return <App basename={`/${remote}`} />;
}

function HostHome() {
  return (
    <div className="hg__home">
      <h1>Host home</h1>
      <p>Pick a remote from the side nav. The main pane is then that remote — the host renders nothing there.</p>
    </div>
  );
}
