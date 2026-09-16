import { useCallback, useEffect, useRef, type ComponentType, type ReactNode } from 'react';
import { createRemoteAppComponent } from '@module-federation/bridge-react/base';
import { useLocation, useRouter } from '@tanstack/react-router';

export interface CreateTanStackRemoteAppOptions<T = Record<string, unknown>> {
  /** Usually `() => loadRemote('remote/export-app')`. */
  loader: () => Promise<T>;
  loading: ReactNode;
  fallback: ComponentType<{ error: Error }>;
  /** Named export to use from the loaded module. Defaults to `default`. */
  export?: keyof T;
}

export interface TanStackRemoteAppProps {
  /** URL prefix the host hands over to the remote, e.g. "/remote18". */
  basename: string;
  className?: string;
  style?: React.CSSProperties;
  /** Any extra props are forwarded to the remote's root component. */
  [key: string]: unknown;
}

/**
 * Host-side adapter for mounting a bridge-react remote inside a TanStack Router host.
 *
 * `@module-federation/bridge-react` (default entry) derives `basename` and dispatches route
 * changes via react-router hooks. TanStack hosts have no react-router context, so we use the
 * `base` entry and supply that glue here:
 *   - `basename` is passed explicitly by the route that mounts the remote,
 *   - host-driven navigation is forwarded to the remote by dispatching a synthetic `popstate`
 *     (the remote's BrowserRouter only listens to popstate),
 *   - `onHostNavigate` lets the remote leave its prefix through the host router.
 */
export function createTanStackRemoteApp<T = Record<string, unknown>>(
  options: CreateTanStackRemoteAppOptions<T>,
) {
  // bridge-react resolves its own @types/react; casting avoids false mismatches when the
  // consuming host is on a different React major than the types bridge-react was built against.
  const Remote = createRemoteAppComponent<any, any>({
    loader: options.loader,
    loading: options.loading as any,
    fallback: options.fallback as any,
    export: options.export as any,
  });

  function TanStackRemoteApp({ basename, ...rest }: TanStackRemoteAppProps) {
    const router = useRouter();
    const location = useLocation();

    const onHostNavigate = useCallback(
      (path: string) => {
        void router.navigate({ to: path as never });
      },
      [router],
    );

    // Host -> remote route sync. TanStack patches history.pushState, so it also observes the
    // remote's own navigations; the extra popstate in that case is a harmless no-op for the remote.
    const lastPathname = useRef(location.pathname);
    useEffect(() => {
      if (lastPathname.current === location.pathname) return;
      lastPathname.current = location.pathname;
      if (location.pathname.startsWith(basename)) {
        window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
      }
    }, [location.pathname, basename]);

    return <Remote basename={basename} onHostNavigate={onHostNavigate} {...rest} />;
  }

  TanStackRemoteApp.displayName = 'TanStackRemoteApp';
  return TanStackRemoteApp;
}
