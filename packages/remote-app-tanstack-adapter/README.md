# @poc/remote-app-tanstack-adapter

Host-side adapter for mounting a `@module-federation/bridge-react` remote inside a TanStack Router host.

## What it does

1. Wraps `createRemoteAppComponent` from `@module-federation/bridge-react/base` to lazy-load and render a remote's bridge provider.
2. Patches `history.pushState` and `history.replaceState` on mount to dispatch synthetic `popstate` events. This keeps the host and remote routers in sync automatically.
3. Injects an `onHostNavigate` callback (backed by `router.navigate()` from TanStack Router) so the remote can navigate to paths outside its prefix.

## Usage

```tsx
import { createRemoteApp } from '@poc/remote-app-tanstack-adapter';

const MyFeatureApp = createRemoteApp({
  loader: () => import('provider_my_feature'),
  loading: <div>Loading...</div>,
  fallback: ({ error }) => <div>Failed: {error.message}</div>,
});

// In a TanStack Router splat route component:
function MyFeaturePage() {
  return <MyFeatureApp basename="/app/my-feature" />;
}
```

## API

### `createRemoteApp(options)`

Returns a React component that loads and renders the remote.

**Options:**

| Option | Type | Description |
|---|---|---|
| `loader` | `() => Promise` | Dynamic import for the remote module, e.g. `() => import('provider_my_feature')` |
| `loading` | `ReactNode` | Fallback UI while the remote is loading |
| `fallback` | `ComponentType<{ error: Error }>` | Error UI if the remote fails to load |
| `export` | `string` | Named export to use from the loaded module (defaults to `default`) |

**Component props:**

| Prop | Type | Description |
|---|---|---|
| `basename` | `string` | URL prefix the host hands over to the remote, e.g. `"/app/my-feature"` |
| `className` | `string` | Optional CSS class for the mount container |
| `style` | `CSSProperties` | Optional inline styles for the mount container |
| `...rest` | `unknown` | Extra props are forwarded to the remote's root component |

## How route sync works

The browser's History API has an asymmetry: `pushState`/`replaceState` change the URL but do not fire any event. Only Back/Forward fires `popstate`. This adapter patches `pushState`/`replaceState` to dispatch a synthetic `popstate` after every URL change, so both the host's TanStack Router and the remote's router hear every navigation. A global guard (`window.__mfe_history_patched`) ensures the patch runs only once.
