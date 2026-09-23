import * as React from 'react';
import { useEffect, useMemo, useRef, version as reactVersion } from 'react';
import { registerReactInstance, unregisterReactInstance } from './instances';
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { RemoteContext, type RemoteContextValue } from './context';
import { Layout } from './routes/Layout';
import { Home } from './routes/Home';
import { About } from './routes/About';
import { Item } from './routes/Item';
import { NotFound } from './routes/NotFound';

export interface AppProps {
  /** URL prefix handed over by the host. Injected by bridge-react's render(). */
  basename?: string;
  /** Identifies which remote build this is, for display purposes. */
  remoteName?: string;
  /** Callback for leaving the remote's URL prefix. Provided by the host adapter. */
  onHostNavigate?: (path: string) => void;
  /**
   * Called with the full URL whenever the remote navigates internally (PUSH or REPLACE).
   * Hosts whose routers don't observe pushState (e.g. Ember) use this to keep their own
   * state in sync. Not called for BACK/FORWARD/GO — those fire native popstate, which
   * the host router already hears.
   */
  onRouteChange?: (url: string) => void;
}

// --- Route tree (mirrors the React Router config this replaces) ---

const rootRoute = createRootRoute({
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Home,
});

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: About,
});

export const itemRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/items/$id',
  component: Item,
});

const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '$',
  component: NotFound,
});

const routeTree = rootRoute.addChildren([indexRoute, aboutRoute, itemRoute, notFoundRoute]);

export function App({
  basename = '/',
  remoteName = 'remote',
  onHostNavigate,
  onRouteChange,
}: AppProps) {
  registerReactInstance(remoteName, React);

  // The remote owns everything under `basename`. Recreate the router only if the prefix changes.
  const router = useMemo(
    () => createRouter({ routeTree, basepath: basename, defaultPreload: false }),
    [basename],
  );

  const ctx = useMemo<RemoteContextValue>(
    () => ({ basename, remoteName, reactVersion, onHostNavigate }),
    [basename, remoteName, onHostNavigate],
  );

  useEffect(() => {
    registerReactInstance(remoteName, React);
    console.log(`[${remoteName}] mounted with React ${reactVersion}, basename=${basename}`);
    return () => {
      router.history.destroy();
      unregisterReactInstance(remoteName);
      console.log(`[${remoteName}] unmounted`);
    };
  }, [remoteName, basename, router]);

  // Notify the host when the remote navigates internally (PUSH or REPLACE).
  // Hosts that monkey-patch pushState (TanStack Router) don't need this — they detect URL
  // changes directly. Hosts that only listen to popstate (Ember) pass an onRouteChange
  // callback to keep their router state in sync.
  //
  // The callback is deferred to a microtask because TanStack Router notifies subscribers
  // synchronously *before* the deferred flush() that calls win.history.pushState. Calling
  // onRouteChange synchronously would trigger Ember's replaceState before TanStack's own
  // pushState, corrupting the history stack. By queueing a microtask from within the
  // subscriber, it runs after flush() (which was queued earlier in the same tick).
  const lastUrl = useRef(window.location.pathname + window.location.search + window.location.hash);
  useEffect(() => {
    if (!onRouteChange) return;
    return router.history.subscribe(({ location, action }) => {
      if (action.type !== 'PUSH' && action.type !== 'REPLACE') return;
      const url = location.href;
      if (url === lastUrl.current) return;
      lastUrl.current = url;
      queueMicrotask(() => onRouteChange(url));
    });
  }, [router, onRouteChange]);

  return (
    <RemoteContext.Provider value={ctx}>
      <RouterProvider router={router} />
    </RemoteContext.Provider>
  );
}
