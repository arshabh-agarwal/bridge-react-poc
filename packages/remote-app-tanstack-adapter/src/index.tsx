import { useCallback, useEffect, type ComponentType, type ReactNode } from 'react';
import { createRemoteAppComponent } from '@module-federation/bridge-react/base';
import { useRouter } from '@tanstack/react-router';

export interface CreateRemoteAppOptions<T = Record<string, unknown>> {
  /** Usually `() => import('provider_my_feature')`. */
  loader: () => Promise<T>;
  loading: ReactNode;
  fallback: ComponentType<{ error: Error }>;
  /** Named export to use from the loaded module. Defaults to `default`. */
  export?: keyof T;
}

export interface RemoteAppProps {
  /** URL prefix the host hands over to the remote, e.g. "/remote18". */
  basename: string;
  className?: string;
  style?: React.CSSProperties;
  /** Any extra props are forwarded to the remote's root component. */
  [key: string]: unknown;
}

/**
 * Patch history.pushState and history.replaceState to dispatch a synthetic PopStateEvent
 * after every URL change. This is how the host and remote routers stay in sync — both
 * listen to popstate, and the browser only fires it natively on Back/Forward.
 *
 * This is the same pattern used by single-spa (13.9k stars). Their patchedUpdateState()
 * wraps pushState/replaceState globally and dispatches PopStateEvent after each call.
 * See: https://github.com/single-spa/single-spa/blob/main/src/navigation/navigation-events.js
 */
function patchHistoryIfNeeded() {
  if ((window as any).__mfe_history_patched) return;
  (window as any).__mfe_history_patched = true;

  const originalPushState = history.pushState.bind(history);
  const originalReplaceState = history.replaceState.bind(history);

  history.pushState = function (...args: Parameters<typeof history.pushState>) {
    const urlBefore = window.location.href;
    const result = originalPushState(...args);
    const urlAfter = window.location.href;
    if (urlBefore !== urlAfter) {
      window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
    }
    return result;
  };

  history.replaceState = function (...args: Parameters<typeof history.replaceState>) {
    const urlBefore = window.location.href;
    const result = originalReplaceState(...args);
    const urlAfter = window.location.href;
    if (urlBefore !== urlAfter) {
      window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
    }
    return result;
  };
}

/**
 * Host-side adapter for mounting a bridge-react remote inside a TanStack Router host.
 *
 * On mount, patches history.pushState/replaceState to dispatch synthetic popstate events.
 * This keeps the host and remote routers in sync automatically — no custom callback
 * plumbing needed. The only explicit coordination is `onHostNavigate`, which lets the
 * remote leave its prefix through the host router.
 */
export function createRemoteApp<T = Record<string, unknown>>(
  options: CreateRemoteAppOptions<T>,
) {
  const Remote = createRemoteAppComponent<any, any>({
    loader: options.loader,
    loading: options.loading as any,
    fallback: options.fallback as any,
    export: options.export as any,
  });

  function RemoteApp({ basename, ...rest }: RemoteAppProps) {
    const router = useRouter();

    useEffect(() => {
      patchHistoryIfNeeded();
    }, []);

    const onHostNavigate = useCallback(
      (path: string) => {
        void router.navigate({ to: path as never });
      },
      [router],
    );

    return <Remote basename={basename} onHostNavigate={onHostNavigate} {...rest} />;
  }

  RemoteApp.displayName = 'RemoteApp';
  return RemoteApp;
}
