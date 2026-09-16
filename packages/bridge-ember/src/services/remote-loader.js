import Service from '@ember/service';
import { getOwner } from '@ember/application';
import { createInstance, getInstance } from '@module-federation/runtime';

/**
 * Resolves the Module Federation runtime instance for this Ember app and caches bridge providers.
 *
 * Two modes, selected by `config/environment.js`:
 *
 * 1. Bundler plugin (default). Remotes are declared in the build config
 *    (`@module-federation/enhanced/webpack` in ember-cli-build.js, or `@module-federation/vite`
 *    in vite.config.mjs). The plugin initialises the runtime before the app boots; this service
 *    looks that instance up by name.
 *
 *      moduleFederation: { name: 'host_ember' }
 *
 * 2. Runtime only. If `remotes` is present the service creates its own instance and no bundler
 *    plugin is required.
 *
 *      moduleFederation: {
 *        name: 'host_ember',
 *        remotes: [{ name: 'remote18', entry: 'http://localhost:3018/remoteEntry.js', type: 'module' }],
 *      }
 */
export default class RemoteLoaderService extends Service {
  _instance = null;
  _providers = new Map();

  get config() {
    const env = getOwner(this).resolveRegistration('config:environment') || {};
    return env.moduleFederation || {};
  }

  get instance() {
    if (!this._instance) {
      const { name, remotes, shared } = this.config;
      if (Array.isArray(remotes) && remotes.length) {
        this._instance = createInstance({ name: name || 'ember_host', remotes, shared });
      } else {
        // Search the global registry (not just this module copy) so a runtime bundled by the
        // webpack/vite plugin is found even if the addon resolved its own copy of the runtime.
        this._instance =
          (name && getInstance((inst) => inst.name === name)) ||
          getInstance() ||
          (globalThis.__FEDERATION__ && globalThis.__FEDERATION__.__INSTANCES__[0]) ||
          null;
        if (!this._instance) {
          throw new Error(
            '[bridge-ember] No Module Federation runtime instance found. Either wire the ' +
              'bundler plugin with `remotes`, or set `moduleFederation.remotes` in config/environment.js.',
          );
        }
      }
    }
    return this._instance;
  }

  /**
   * Loads `<remote>/<expose>` and calls the bridge factory once, returning the provider
   * ({ render, destroy }). The provider keeps its own root-per-DOM map, so sharing one
   * provider across mounts is safe.
   */
  loadProvider(remoteName, expose = 'export-app') {
    const id = `${remoteName}/${expose}`;
    if (!this._providers.has(id)) {
      const promise = Promise.resolve()
        .then(() => this.instance.loadRemote(id))
        .then((mod) => {
          const factory = mod && (mod.default || mod);
          if (typeof factory !== 'function') {
            throw new Error(`${id} does not export a bridge component factory`);
          }
          return factory();
        })
        .catch((error) => {
          this._providers.delete(id);
          throw error;
        });
      this._providers.set(id, promise);
    }
    return this._providers.get(id);
  }
}
