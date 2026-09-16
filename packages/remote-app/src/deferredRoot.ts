import type { ReactElement } from 'react';

interface RootLike {
  // Loosely typed on purpose: consumers are on different @types/react majors.
  render(children: any): void;
  unmount(): void;
}

type CreateRootFn = (container: any) => RootLike;

/**
 * Custom `render` for `createBridgeComponent`.
 *
 * bridge-react calls `root.unmount()` synchronously from the host's effect cleanup. When host and
 * remote share the same React instance, React warns: "Attempted to synchronously unmount a root
 * while React was already rendering". Deferring the unmount by a macrotask avoids that while
 * keeping the bridge's render/destroy contract intact.
 */
export function createDeferredUnmountRender(createRoot: CreateRootFn) {
  // The bridge calls this custom render on every update, not only on first mount, so keep one
  // root per container instead of calling createRoot() again on the same element.
  const roots = new WeakMap<Element, RootLike>();

  return (app: ReactElement, container?: HTMLElement | string) => {
    const el =
      typeof container === 'string' ? (document.getElementById(container) as HTMLElement) : container!;
    let root = roots.get(el);
    if (!root) {
      const inner = createRoot(el);
      root = {
        render: (children) => inner.render(children),
        unmount: () => {
          roots.delete(el);
          setTimeout(() => inner.unmount(), 0);
        },
      };
      roots.set(el, root);
    }
    root.render(app);
    return root as unknown as ReturnType<CreateRootFn>;
  };
}
