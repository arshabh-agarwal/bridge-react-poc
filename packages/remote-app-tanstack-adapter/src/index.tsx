import { useCallback, type ComponentType, type ReactNode } from 'react';
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
 * Host-side adapter for mounting a bridge-react remote inside a TanStack Router host.
 *
 * TanStack Router monkey-patches history.pushState/replaceState to detect URL changes,
 * so both the host and remote routers pick up each other's navigations automatically.
 * No synthetic popstate dispatch or global history patching is needed.
 *
 * The only explicit coordination is `onHostNavigate`, which lets the remote leave its
 * prefix through the host router.
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
