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

export interface HostContext {
  hostName: string;
}

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
  component: () => <Remote18App basename="/remote18" />,
});

const remote19Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/remote19/$',
  component: () => <Remote19App basename="/remote19" />,
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

function RootLayout() {
  const { hostName } = rootRoute.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 16 }}>
      <header
        style={{
          display: 'flex',
          gap: 16,
          alignItems: 'baseline',
          flexWrap: 'wrap',
          borderBottom: '2px solid #0ea5e9',
          paddingBottom: 8,
        }}
      >
        <strong style={{ color: '#0ea5e9' }}>{hostName}</strong>
        <code>React {reactVersion}</code>
        <code>TanStack Router</code>
        <code data-testid="host-pathname">pathname={pathname}</code>
      </header>

      <nav style={{ display: 'flex', gap: 12, margin: '12px 0', flexWrap: 'wrap' }}>
        <Link to="/">Host home</Link>
        <Link to="/remote18/$" params={{ _splat: '' }}>
          remote18
        </Link>
        <Link to="/remote18/$" params={{ _splat: 'about' }}>
          remote18/about
        </Link>
        <Link to="/remote18/$" params={{ _splat: 'items/7' }}>
          remote18/items/7
        </Link>
        <Link to="/remote19/$" params={{ _splat: '' }}>
          remote19
        </Link>
        <Link to="/remote19/$" params={{ _splat: 'about' }}>
          remote19/about
        </Link>
        <Link to="/remote19/$" params={{ _splat: 'items/7' }}>
          remote19/items/7
        </Link>
      </nav>

      <Outlet />
    </div>
  );
}

function HostHome() {
  return (
    <div>
      <h1>Host home</h1>
      <p>Routes under /remote18 and /remote19 are handed over to the remotes.</p>
    </div>
  );
}
