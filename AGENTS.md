# AGENTS.md

## Overview

pnpm workspace monorepo — proof of concept for `@module-federation/bridge-react`.
Two React remotes (React 18 and 19) mounted into four hosts (two React, two Ember 3.28).

## Workspace layout

- `packages/remote-app` — shared TanStack Router app exposed by both remotes
- `packages/host-react-app` — shared TanStack Router app used by both React hosts
- `packages/remote-app-tanstack-adapter` — adapter for React hosts (wraps `createRemoteAppComponent`)
- `packages/remote-app-ember-adapter` — v2 Ember addon adapter (rollup-built)
- `apps/remote-react18` (port 3018), `apps/remote-react19` (port 3019) — federation remotes
- `apps/host-react18` (port 4018), `apps/host-react19` (port 4019) — React hosts
- `apps/host-ember-webpack` (port 4200), `apps/host-ember-vite` (port 4201) — Ember hosts
- `apps/dashboard` (port 4000) — static iframe grid of all four hosts

## Commands

```sh
pnpm install          # also builds remote-app-ember-adapter via its prepare script
pnpm dev              # all 7 apps in parallel
pnpm dev:remotes      # just the two remotes
pnpm dev:react-hosts  # just the two React hosts
pnpm dev:ember-hosts  # just the two Ember hosts
pnpm build            # packages first, then apps
pnpm preview          # serve production builds on the same ports
pnpm test:e2e         # playwright (requires dev servers already running)
```

## E2E tests

- Playwright tests live in `e2e/`. Config: `playwright.config.ts`.
- Tests **require all dev servers running** (`pnpm dev`) before `pnpm test:e2e`.
- `routing.spec.ts`: parameterized matrix — 4 hosts × 2 remotes × 6 scenarios = 48 tests.
- `listener-cleanup.spec.ts`: popstate listener leak detection across mount/unmount.
- `baseURL` defaults to `http://localhost:4018` but each test navigates to the specific host's port.

## Gotchas

- **Ember addon rebuild**: after editing `packages/remote-app-ember-adapter/src`, you must manually run `pnpm --filter @poc/remote-app-ember-adapter build` and restart Ember dev servers — they don't watch the addon's `dist/`.
- **React sharing**: when host and remote use the same React major version, they share one copy (`singleton: false` but same `requiredVersion`). When versions differ, two React copies run side by side. This is intentional.
- **Router sync**: TanStack Router monkey-patches `history.pushState`/`replaceState`, so TanStack↔TanStack and Ember→TanStack directions sync automatically. For TanStack remote→Ember host, the remote calls an `onRouteChange` callback (subscribed via `router.history.subscribe()` in `App.tsx`), and the Ember adapter re-syncs via `router.replaceWith()`. No global history patching or synthetic popstate dispatch.
- **No linter/formatter/typecheck CI** — there is no ESLint, Prettier, or CI pipeline. TypeScript is `noEmit: true` in all tsconfigs.
- Node ≥20 required. Tested on Node 22. Ember CLI warns about Node 22 but works.
