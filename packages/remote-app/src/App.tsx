import * as React from 'react';
import { useEffect, useMemo, version as reactVersion } from 'react';
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

  return (
    <RemoteContext.Provider value={ctx}>
      <RouterProvider router={router} />
    </RemoteContext.Provider>
  );
}
