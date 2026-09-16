# Bridge React POC: 4 hosts x 2 remotes

Proof of concept for `@module-federation/bridge-react`: React Router remotes mounted into hosts
that do not use React Router (TanStack Router, Ember), with the host handing a URL prefix over to
the remote and the remote owning every route under it.

## Apps

| App | Stack | Port |
| --- | --- | --- |
| `apps/remote-react18` | React 18.3, react-router v7, Vite + `@module-federation/vite`, `bridge-react/v18` | 3018 |
| `apps/remote-react19` | React 19.3, react-router v7, Vite + `@module-federation/vite`, `bridge-react/v19` | 3019 |
| `apps/host-react18` | React 18.3, TanStack Router, Vite + `@module-federation/vite` | 4018 |
| `apps/host-react19` | React 19.3, TanStack Router, Vite + `@module-federation/vite` | 4019 |
| `apps/host-ember-webpack` | Ember 3.28, Embroider 3.x + webpack, `@module-federation/enhanced/webpack` | 4200 |
| `apps/host-ember-vite` | Ember 3.28, Embroider 4.x + `@embroider/vite`, `@module-federation/vite` | 4201 |

| Package | Purpose |
| --- | --- |
| `packages/remote-app` | The React Router app both remotes expose (`/`, `/about`, `/items/:id`, 404) |
| `packages/host-react-app` | The TanStack Router app both React hosts run |
| `packages/bridge-tanstack` | Host adapter for TanStack hosts: `createTanStackRemoteApp()` |
| `packages/bridge-ember` | Host adapter for Ember hosts (v2 addon): `remote-loader` service + `<RemoteMount>` |

Every host mounts both remotes at `/remote18/*` and `/remote19/*`.

## Run

```sh
pnpm install      # also builds the bridge-ember addon (rollup) via its prepare script
pnpm dev          # all six apps
```

Or per group: `pnpm dev:remotes`, `pnpm dev:react-hosts`, `pnpm dev:ember-hosts`.
After editing `packages/bridge-ember/src`, rerun `pnpm --filter @poc/bridge-ember build` and
restart the Ember dev servers (they do not watch the addon's `dist/`).
Remotes also run standalone at their own port (basename `/`). `pnpm build` builds everything.

Production bundles, on the same ports:

```sh
pnpm build
pnpm preview      # vite preview for the Vite apps, `serve -s dist` for the webpack Ember host
```

Tested with Node 22.18 and pnpm 10. ember-cli 4.12 prints a "not tested against Node 22"
warning; it works.

## How route ownership works

```mermaid
sequenceDiagram
  participant Host as Host router (TanStack / Ember)
  participant Adapter as bridge-tanstack / bridge-ember
  participant Provider as bridge-react provider
  participant Remote as Remote react-router

  Host->>Adapter: route /remote18/* matched
  Adapter->>Provider: loadRemote('remote18/export-app').default()
  Adapter->>Provider: render({ dom, basename: '/remote18', onHostNavigate, onRouteChange })
  Provider->>Remote: createBrowserRouter(routes, { basename })
  Note over Remote: owns everything under /remote18
  Host->>Adapter: host navigates to /remote18/about
  Adapter->>Remote: dispatch synthetic popstate
  Remote->>Adapter: onRouteChange('/remote18/items/1') after internal Link
  Adapter->>Host: replaceWith(url) (Ember only; TanStack already patches pushState)
  Remote->>Adapter: onHostNavigate('/')
  Adapter->>Host: navigate('/') -> route unmounts
  Adapter->>Provider: destroy({ dom })
```

- The remote receives `basename` from `render()` and builds its own `createBrowserRouter`.
  It never hardcodes the prefix, so the same build mounts at any path.
- The host only declares a splat/wildcard route. Adding routes to the remote needs no host change.
- Both routers read `window.location`; sync is a prefix split plus two nudges:
  host-initiated navigation inside the prefix is forwarded as a synthetic `popstate`
  (react-router only listens to that), and the remote reports its own navigations via
  `onRouteChange` so hosts that do not observe `pushState` (Ember) can catch up.
- `onHostNavigate(path)` is how the remote leaves its prefix; it goes through the host router.

## Adapters

`packages/bridge-tanstack` (one file): wraps `createRemoteAppComponent` from
`@module-federation/bridge-react/base`, passes `basename`, dispatches `popstate` on TanStack
location changes, injects `onHostNavigate`.

`packages/bridge-ember` (v2 addon, ~100 lines): `remote-loader` service resolves the
`@module-federation/runtime` instance and caches providers; `<RemoteMount @remote @basename
@props>` calls `render` on `did-insert`, `destroy` on `will-destroy`, forwards `routeDidChange`
as `popstate`, and resyncs Ember on `onRouteChange` with a `replaceWith`.

The service supports two modes, chosen by `config/environment.js`:

- **Bundler plugin (used by both Ember apps).** Remotes are declared in the build:
  `ModuleFederationPlugin` from `@module-federation/enhanced/webpack` inside Embroider's
  `packagerOptions.webpackConfig.plugins` (`apps/host-ember-webpack/ember-cli-build.js`), and
  `federation()` from `@module-federation/vite` in `apps/host-ember-vite/vite.config.mjs`. The
  plugin initialises the runtime before Ember boots; the service finds that instance with
  `getInstance(inst => inst.name === config.moduleFederation.name)`.
- **Runtime only.** If `config.moduleFederation.remotes` is set, the service calls
  `createInstance()` itself and no bundler plugin is needed. Useful for hosts whose build you
  cannot touch.

The webpack host points its remotes at the Vite remotes' `mf-manifest.json` rather than
`remoteEntry.js`: the manifest carries `remoteEntry.type: 'module'`, which is how a webpack host
learns to `import()` an ESM remote instead of injecting a script tag. `shared: {}` in both,
since Ember shares nothing with React.

## Verification matrix

Checked manually in the browser on 2026-09-16, dev servers, all six apps running.
Columns: deep link on cold load (`/remoteNN/items/42`), host nav into a remote sub-route,
remote internal link, swap to the other remote, browser back, "Back to host home" (destroy).

| Host | Remote | React instance | Deep link | Host nav | Remote nav | Swap | Back | Exit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| host-react18 | remote18 | shared (one 18.3.1) | ok | ok | ok | ok | ok | ok |
| host-react18 | remote19 | isolated (18 + 19) | ok | ok | ok | ok | ok | ok |
| host-react19 | remote18 | isolated (19 + 18) | ok | ok | ok | ok | ok | ok |
| host-react19 | remote19 | shared (one 19.3.0) | ok | ok | ok | ok | ok | ok |
| host-ember-webpack | remote18 | remote's own | ok | ok | ok | ok | ok | ok |
| host-ember-webpack | remote19 | remote's own | ok | ok | ok | ok | ok | ok |
| host-ember-vite | remote18 | remote's own | ok | ok | ok | ok | ok | ok |
| host-ember-vite | remote19 | remote's own | ok | ok | ok | ok | ok | ok |

Forward was additionally checked on host-react18 and host-ember-webpack with a 10-step
back/back/back/forward/forward/forward sequence that crosses remotes; URL, host state and
remote content agreed at every step, with exactly one history entry per navigation.

The Ember rows were re-verified after switching from runtime-only loading to the bundler
plugins (`globalThis.__FEDERATION__.__INSTANCES__` shows the plugin-created `host_ember_*`
instance being used).

"React instance" was verified by identity of `React.createElement` across host and remote
(`globalThis.__pocReact`, a POC-only diagnostic registered by each app). Namespace identity is
misleading here because every app gets its own `loadShare` wrapper module.

### Production bundles

The same walk was repeated against `pnpm build` output served with `pnpm preview` (remotes via
`vite preview`, so `remoteEntry.js` and `mf-manifest.json` come from `dist/`). On each of the
four hosts: deep link into one remote, host nav into the other remote's sub-route, remote-internal
link, back, forward, exit via `onHostNavigate`. Every step matched dev behaviour, React sharing /
isolation was identical, and the console was completely silent (the dev-only react-router
basename warning does not exist in production builds). The Ember hosts confirmed they were using
the plugin-created `host_ember_webpack` / `host_ember_vite` runtime instances.

## Findings and gotchas

Things that were not obvious from the docs and cost time; each is handled in the code.

1. **Cross-version isolation is a `shared` config choice.** Remotes declare
   `react`/`react-dom` as `{ singleton: false, requiredVersion: '^18' }` (or `^19`). When the
   host's React satisfies the range the remote reuses it; otherwise it loads its own copy.
   `singleton: true` would force the remote onto the host's React and break across majors.
2. **`@module-federation/bridge-react`'s default entry imports `react-router-dom`** and calls
   `useLocation()` to derive `basename`. Hosts without React Router must import from
   `@module-federation/bridge-react/base` and pass `basename` themselves.
3. **The bridge unmounts synchronously inside the host's effect cleanup.** With a shared React
   instance this triggers "Attempted to synchronously unmount a root while React was already
   rendering". Fixed on the remote side with a custom `render` that defers `unmount` by a
   macrotask (`createDeferredUnmountRender`).
4. **A custom `render` passed to `createBridgeComponent` is called on every update**, not just
   on mount. It must cache roots per container or `createRoot` gets called twice on one element.
5. **Dev-mode Vite remotes in a non-Vite host need the React Fast Refresh preamble.** The
   plugin-react transform references `$RefreshSig$` and `__vite_plugin_react_preamble_installed__`,
   which only a Vite host page defines. The Ember `index.html` files ship a no-op shim; built
   remotes do not need it.
6. **Ember does not observe `pushState`.** After the remote navigates, `router.currentURL` and
   active `LinkTo`s go stale, and a later Ember transition to the same URL pushes a duplicate
   history entry. The remote reports navigations through `onRouteChange`; `RemoteMount` stamps
   `path` onto `history.state` (so Ember's `HistoryLocation` treats the URL as current and does
   not clobber react-router's state) and calls `router.replaceWith(url)`. TanStack does not need
   this because `@tanstack/history` patches `pushState`.
7. **Ember route shape.** A bare glob `/remote18/*path` does not match `/remote18`, so each remote
   gets a parent route (`/remote18`) plus a `catchall` child (`/*path`); `<RemoteMount>` lives in
   the parent template and survives child transitions.
8. **Glimmer components reserve `element`.** Assigning `this.element` throws in 3.28. The mount
   target is stored as `targetElement`.
9. **Ember 3.28 dependency pairs.** Webpack flavor: `@embroider/core|compat` 3.x with
   `@embroider/webpack` 4.x, `ember-resolver` 8. Vite flavor: `@embroider/core|compat` 4.x with
   `@embroider/vite` 1.x, `ember-resolver` 13 + `ember-load-initializers` 3 with the explicit
   `compatModules` wiring in `app/app.js` (no global AMD loader under Vite). Peer warnings about
   `ember-source` are expected and harmless here.
10. **`ember-vite-codemod` needs `testem.js` and a `tests/` tree** to exist even if unused; it also
    reads the installed `ember-cli` version, so install before running it. It got the Vite flavor
    most of the way; the remaining steps (`ember-cli-build.js`, `package.json`, `app/app.js`) were
    finished by hand following its README.
11. **Dev-only noise:** when the browser goes back/forward from one remote's prefix to the other,
    react-router logs `<Router basename="/remote19"> is not able to match the URL` in the instant
    before the host unmounts it. Harmless; production builds strip the warning.

## Not covered

- `memoryRoute` (remote with an in-memory router, host owns the URL). One prop away but out of
  scope for this POC.
- Deploying to real origins / CDNs. Remote URLs are hardcoded to `localhost` ports in the host
  build configs.
