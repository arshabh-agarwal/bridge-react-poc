import * as React from 'react';
import { version as reactVersion } from 'react';
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

// One tab per route the remote owns. Tabs are host links into the remote's prefix; the
// bridge-tanstack adapter forwards the resulting location change to the remote's router.
const TABS = [
  { label: 'Home', splat: '', match: (rest: string) => rest === '' },
  { label: 'About', splat: 'about', match: (rest: string) => rest === 'about' },
  { label: 'Items', splat: 'items/7', match: (rest: string) => rest.startsWith('items/') },
];

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
        Host owns the shell, side nav and tabs. Everything inside the dashed box is rendered by
        the remote's own React and react-router.
      </footer>
    </div>
  );
}

function RemoteShell({ remote }: { remote: RemoteName }) {
  const { App } = REMOTES[remote];
  const basename = `/${remote}`;
  const pathname = usePathname();
  const rest = pathname.replace(basename, '').replace(/^\//, '');

  return (
    <>
      <nav className="tabs" aria-label={`${remote} routes`}>
        {TABS.map((tab) => (
          <Link
            activeProps={{}}
            key={tab.label}
            to={`${basename}/$` as '/remote18/$'}
            params={{ _splat: tab.splat }}
            className={tab.match(rest) ? 'is-active' : undefined}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <App basename={basename} />
    </>
  );
}

function HostHome() {
  return (
    <div>
      <h1>Host home</h1>
      <p>Pick a remote from the side nav. Each tab in the main area is one route owned by that remote.</p>
    </div>
  );
}
