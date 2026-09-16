/**
 * POC diagnostics: every host and remote registers the React module namespace it imported.
 * Comparing `createElement` identities (not the wrapper namespace) shows which apps share
 * one React instance and which run isolated copies. Not something you would ship.
 */
declare global {
  // eslint-disable-next-line no-var
  var __pocReact: Map<string, unknown> | undefined;
}

function createElementOf(reactNamespace: unknown): unknown {
  return (reactNamespace as { createElement?: unknown } | null)?.createElement ?? reactNamespace;
}

export function registerReactInstance(name: string, reactNamespace: unknown) {
  (globalThis.__pocReact ??= new Map()).set(name, reactNamespace);
}

export function unregisterReactInstance(name: string) {
  globalThis.__pocReact?.delete(name);
}

/** Returns groups of app names that share the same React instance. */
export function reactInstanceGroups(): string[][] {
  const groups = new Map<unknown, string[]>();
  for (const [name, inst] of globalThis.__pocReact ?? []) {
    const key = createElementOf(inst);
    const list = groups.get(key) ?? [];
    list.push(name);
    groups.set(key, list);
  }
  return [...groups.values()];
}

/** Human-readable share/isolation status for the on-page hooks probe. */
export function describeReactShare(selfName: string): string {
  const groups = reactInstanceGroups();
  const copies = groups.length;
  const peers = (groups.find((g) => g.includes(selfName)) ?? []).filter((n) => n !== selfName);
  const copyLabel = copies === 1 ? '1 React copy on this page' : `${copies} React copies on this page`;
  if (peers.length) return `shared instance with ${peers.join(', ')} · ${copyLabel}`;
  return `isolated instance · ${copyLabel}`;
}
