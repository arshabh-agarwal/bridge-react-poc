# Bridge React POC: 4 hosts x 2 remotes

Proof of concept for `@module-federation/bridge-react`: React Router remotes mounted into
non-React-Router hosts, with the host handing over a URL prefix to the remote.

| App | Stack | Port |
| --- | --- | --- |
| `apps/remote-react18` | React 18, react-router v7, Vite + `@module-federation/vite`, `bridge-react/v18` | 3018 |
| `apps/remote-react19` | React 19, react-router v7, Vite + `@module-federation/vite`, `bridge-react/v19` | 3019 |
| `apps/host-react18` | React 18, TanStack Router, Vite + `@module-federation/vite` | 4018 |
| `apps/host-react19` | React 19, TanStack Router, Vite + `@module-federation/vite` | 4019 |
| `apps/host-ember-webpack` | Ember 3.28, Embroider + webpack, MF runtime | 4200 |
| `apps/host-ember-vite` | Ember 3.28, Embroider + Vite, MF runtime | 4201 |

Shared packages:

| Package | Purpose |
| --- | --- |
| `packages/remote-app` | The React Router app source used by both remotes |
| `packages/host-react-app` | The TanStack Router app source used by both React hosts |
| `packages/bridge-tanstack` | Host-side adapter: bridge-react `base` + TanStack route sync |
| `packages/bridge-ember` | Host-side adapter (v2 addon): MF runtime service + `<RemoteMount>` |

## Run

```sh
pnpm install
pnpm dev            # all six apps
pnpm dev:remotes    # only the two remotes
```

Every host mounts both remotes at `/remote18/*` and `/remote19/*`.

## Verification matrix

See the bottom of this file; filled in as pairings are verified.
