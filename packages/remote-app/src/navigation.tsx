import { useCallback, type ReactNode, type AnchorHTMLAttributes } from 'react';
import { useRemoteContext } from './context';

/**
 * Hook for navigating to a path the remote doesn't own.
 *
 * Reads `onHostNavigate` from the RemoteContext (populated by bridge-react from the
 * host adapter) and returns a function the developer can call with any host-level path.
 *
 * If no host adapter is present (e.g., running standalone), logs a warning and is a no-op.
 */
export function useHostNavigate() {
  const { onHostNavigate } = useRemoteContext();

  return useCallback(
    (path: string) => {
      if (!onHostNavigate) {
        console.warn(
          '[useHostNavigate] No host adapter provided onHostNavigate. Navigation to "%s" ignored.',
          path,
        );
        return;
      }
      onHostNavigate(path);
    },
    [onHostNavigate],
  );
}

export interface HostLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  /** The host-level path to navigate to (e.g., "/", "/app/trading/restrictions"). */
  to: string;
  children: ReactNode;
}

/**
 * Declarative link for navigating to a path the remote doesn't own.
 *
 * Renders a plain `<a>` tag (not React Router's `<Link>`, which would prepend the
 * remote's basename to the path). The `<a>` tag preserves the correct `href` for
 * hover preview, right-click "open in new tab", and accessibility. Normal clicks
 * are intercepted and routed through `useHostNavigate`.
 *
 * If no host adapter is present, the `<a>` tag still renders with the correct href,
 * so clicking it falls back to a normal page navigation.
 */
export function HostLink({ to, children, onClick, ...rest }: HostLinkProps) {
  const hostNavigate = useHostNavigate();

  return (
    <a
      {...rest}
      href={to}
      onClick={(e) => {
        // Allow ctrl+click / cmd+click to open in new tab.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        onClick?.(e);
        hostNavigate(to);
      }}
    >
      {children}
    </a>
  );
}
