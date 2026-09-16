/**
 * POC diagnostics: every host and remote registers the React module namespace it imported.
 * Comparing identities on `globalThis.__pocReact` shows which apps share one React instance
 * and which run isolated copies. Not something you would ship.
 */
declare global {
  // eslint-disable-next-line no-var
  var __pocReact: Map<string, unknown> | undefined;
}

export function registerReactInstance(name: string, reactNamespace: unknown) {
  (globalThis.__pocReact ??= new Map()).set(name, reactNamespace);
}

/** Returns groups of app names that share the same React instance. */
export function reactInstanceGroups(): string[][] {
  const groups = new Map<unknown, string[]>();
  for (const [name, inst] of globalThis.__pocReact ?? []) {
    const list = groups.get(inst) ?? [];
    list.push(name);
    groups.set(inst, list);
  }
  return [...groups.values()];
}
