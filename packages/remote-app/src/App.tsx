import * as React from 'react';
import { useEffect, useMemo, version as reactVersion } from 'react';
import { registerReactInstance, unregisterReactInstance } from './instances';
import { createBrowserRouter, RouterProvider, type RouteObject } from 'react-router';
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

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'about', element: <About /> },
      { path: 'items/:id', element: <Item /> },
      { path: '*', element: <NotFound /> },
    ],
  },
];

export function App({
  basename = '/',
  remoteName = 'remote',
  onHostNavigate,
}: AppProps) {
  registerReactInstance(remoteName, React);

  // The remote owns everything under `basename`. Recreate the router only if the prefix changes.
  const router = useMemo(() => createBrowserRouter(routes, { basename }), [basename]);

  const ctx = useMemo<RemoteContextValue>(
    () => ({ basename, remoteName, reactVersion, onHostNavigate }),
    [basename, remoteName, onHostNavigate],
  );

  useEffect(() => {
    registerReactInstance(remoteName, React);
    console.log(`[${remoteName}] mounted with React ${reactVersion}, basename=${basename}`);
    return () => {
      unregisterReactInstance(remoteName);
      console.log(`[${remoteName}] unmounted`);
    };
  }, [remoteName, basename]);

  return (
    <RemoteContext.Provider value={ctx}>
      <RouterProvider router={router} />
    </RemoteContext.Provider>
  );
}
