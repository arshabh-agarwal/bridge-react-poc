# @poc/remote-app-ember-adapter

Host-side adapter for mounting a `@module-federation/bridge-react` remote inside an Ember 3.28+ host. Ships as a v2 Ember addon.

## What it provides

### `<RemoteAppMount>` component

Mounts a remote's bridge provider into a DOM node owned by Ember. Handles loading, error states, and cleanup.

```handlebars
<RemoteAppMount @remote="provider_my_feature" @basename="/my-feature" />
{{outlet}}
```

**Arguments:**

| Argument | Type | Description |
|---|---|---|
| `@remote` | `string` | The Module Federation remote name (e.g. `"provider_my_feature"`) |
| `@basename` | `string` | URL prefix the host hands over to the remote |
| `@expose` | `string` | Module expose key (defaults to `"."`) |
| `@props` | `object` | Extra props forwarded to the remote's root component |

On mount, the component:
1. Patches `history.pushState`/`history.replaceState` to dispatch synthetic `popstate` events (keeps host and remote routers in sync).
2. Loads the remote via the `remote-loader` service.
3. Calls `provider.render({ dom, basename, onHostNavigate, ...props })`.
4. Injects `onHostNavigate` backed by Ember's `router.transitionTo()` so the remote can navigate outside its prefix.
5. On `will-destroy`, calls `provider.destroy()` to unmount the remote's React tree.

### `remote-loader` service

Resolves the Module Federation runtime instance and caches bridge providers.

Two modes, selected by `config/environment.js`:

**1. Bundler plugin (default).** Remotes are declared in the build config (`@module-federation/enhanced/webpack` in `ember-cli-build.js`, or `@module-federation/vite` in `vite.config.mjs`). The plugin initializes the runtime before the app boots; the service finds that instance by name.

```js
// config/environment.js
moduleFederation: {
  name: 'host_ember',
}
```

**2. Runtime-only.** If `remotes` is present, the service creates its own MF runtime instance.

```js
// config/environment.js
moduleFederation: {
  name: 'host_ember',
  remotes: [
    { name: 'provider_my_feature', entry: 'http://localhost:3000/remoteEntry.js', type: 'module' },
  ],
}
```

## Host setup

### Router

Declare a wildcard route for the remote's prefix:

```js
// router.js
this.route('my-feature', { path: '/my-feature' }, function () {
  this.route('catchall', { path: '/*path' });
});
```

### Template

```handlebars
{{!-- templates/my-feature.hbs --}}
<RemoteAppMount @remote="provider_my_feature" @basename="/my-feature" />
{{outlet}}
```

## How route sync works

The browser's History API has an asymmetry: `pushState`/`replaceState` change the URL but do not fire any event. Only Back/Forward fires `popstate`. This adapter patches `pushState`/`replaceState` to dispatch a synthetic `popstate` after every URL change, so both Ember's router and the remote's router hear every navigation. A global guard (`window.__mfe_history_patched`) ensures the patch runs only once.
